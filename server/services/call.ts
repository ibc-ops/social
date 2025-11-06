import type { Core } from '@strapi/strapi';
import { v4 as uuidv4 } from 'uuid';

interface CreateCallParams {
  initiatorId: number;
  participantIds: number[];
  callType: 'one-on-one' | 'group';
  audioOnly?: boolean;
  metadata?: any;
}

interface JoinCallParams {
  callId: number;
  userId: number;
  deviceInfo?: any;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Create a new call
   */
  async create(params: CreateCallParams) {
    const { initiatorId, participantIds, callType, audioOnly, metadata } = params;

    // Validate participants
    if (callType === 'one-on-one' && participantIds.length !== 1) {
      throw new Error('One-on-one calls must have exactly one other participant');
    }

    const pluginConfig = strapi.config.get('plugin::video-chat');
    const maxParticipants = pluginConfig?.calls?.maxGroupParticipants || 10;

    if (callType === 'group' && participantIds.length > maxParticipants - 1) {
      throw new Error(`Group calls cannot exceed ${maxParticipants} participants`);
    }

    // Check if initiator is trying to call themselves
    if (participantIds.includes(initiatorId)) {
      throw new Error('Cannot call yourself');
    }

    // Generate unique identifiers
    const uuid = uuidv4();
    const vdoNinjaService = strapi.plugin('video-chat').service('vdo-ninja');
    const roomId = vdoNinjaService.generateRoomId();
    const roomPassword = vdoNinjaService.generateRoomPassword();

    // Create the call
    const call = await strapi.entityService.create('plugin::video-chat.call', {
      data: {
        uuid,
        roomId,
        callType,
        status: 'pending',
        initiator: initiatorId,
        participants: [initiatorId, ...participantIds],
        metadata: {
          ...metadata,
          password: roomPassword,
          audioOnly: audioOnly || false,
        },
      },
      populate: {
        initiator: {
          fields: ['id', 'username', 'email'],
        },
        participants: {
          fields: ['id', 'username', 'email'],
        },
      },
    });

    // Create participant records
    const participantRecords = [];

    // Add initiator as host
    const hostParticipant = await strapi.entityService.create(
      'plugin::video-chat.call-participant',
      {
        data: {
          call: call.id,
          user: initiatorId,
          status: 'invited',
          role: 'host',
        },
      }
    );
    participantRecords.push(hostParticipant);

    // Add other participants
    for (const participantId of participantIds) {
      const participant = await strapi.entityService.create(
        'plugin::video-chat.call-participant',
        {
          data: {
            call: call.id,
            user: participantId,
            status: 'invited',
            role: 'participant',
          },
        }
      );
      participantRecords.push(participant);
    }

    // Generate join URLs for each participant
    const inviteLinks: Record<number, string> = {};

    for (const participant of call.participants) {
      const roomConfig = await vdoNinjaService.generateRoomConfig({
        callId: call.id,
        userId: participant.id,
        role: participant.id === initiatorId ? 'host' : 'participant',
        userName: participant.username || participant.email,
        audioOnly: audioOnly || false,
      });

      inviteLinks[participant.id] = roomConfig.roomUrl;
    }

    return {
      call,
      participants: participantRecords,
      inviteLinks,
    };
  },

  /**
   * Find a call by ID
   */
  async findOne(callId: number, userId?: number) {
    const call = await strapi.entityService.findOne('plugin::video-chat.call', callId, {
      populate: {
        initiator: {
          fields: ['id', 'username', 'email'],
        },
        participants: {
          fields: ['id', 'username', 'email'],
        },
        currentCall: true,
      },
    });

    if (!call) {
      throw new Error('Call not found');
    }

    // Check if user has access to this call
    if (userId) {
      const hasAccess = call.participants.some((p: any) => p.id === userId) ||
                        call.initiator.id === userId;

      if (!hasAccess) {
        throw new Error('You do not have access to this call');
      }
    }

    return call;
  },

  /**
   * Find all calls (with filters)
   */
  async find(filters: any = {}, userId?: number) {
    const query: any = {
      filters: {},
      populate: {
        initiator: {
          fields: ['id', 'username', 'email'],
        },
        participants: {
          fields: ['id', 'username', 'email'],
        },
      },
      sort: { createdAt: 'desc' },
    };

    // Filter by user's calls only
    if (userId) {
      query.filters.$or = [
        { initiator: { id: userId } },
        { participants: { id: userId } },
      ];
    }

    // Apply additional filters
    if (filters.status) {
      query.filters.status = filters.status;
    }

    if (filters.callType) {
      query.filters.callType = filters.callType;
    }

    if (filters.startDate) {
      query.filters.startedAt = { $gte: filters.startDate };
    }

    if (filters.endDate) {
      query.filters.startedAt = { ...query.filters.startedAt, $lte: filters.endDate };
    }

    const calls = await strapi.entityService.findMany('plugin::video-chat.call', query);

    return calls;
  },

  /**
   * Join a call
   */
  async join(params: JoinCallParams) {
    const { callId, userId, deviceInfo } = params;

    // Find the call
    const call = await this.findOne(callId, userId);

    // Check if call is still active
    if (call.status === 'ended' || call.status === 'declined') {
      throw new Error('This call has ended');
    }

    // Find participant record
    const participants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
          user: userId,
        },
      }
    );

    if (!participants || participants.length === 0) {
      throw new Error('You are not a participant in this call');
    }

    const participant = participants[0];

    // Update participant status
    const updatedParticipant = await strapi.entityService.update(
      'plugin::video-chat.call-participant',
      participant.id,
      {
        data: {
          status: 'joined',
          joinedAt: new Date(),
          deviceInfo: deviceInfo || null,
        },
      }
    );

    // Update call status to active if it's the first join
    if (call.status === 'pending') {
      await strapi.entityService.update('plugin::video-chat.call', callId, {
        data: {
          status: 'active',
          startedAt: new Date(),
        },
      });
    }

    // Generate room URL for this user
    const vdoNinjaService = strapi.plugin('video-chat').service('vdo-ninja');
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      fields: ['id', 'username', 'email'],
    });

    const roomConfig = await vdoNinjaService.generateRoomConfig({
      callId,
      userId,
      role: participant.role,
      userName: user.username || user.email,
      audioOnly: call.metadata?.audioOnly || false,
    });

    // Update participant with stream ID
    await strapi.entityService.update(
      'plugin::video-chat.call-participant',
      participant.id,
      {
        data: {
          streamId: roomConfig.streamId,
        },
      }
    );

    // Update user presence
    const presenceService = strapi.plugin('video-chat').service('presence');
    await presenceService.updateStatus(userId, 'in-call', callId);

    return {
      call,
      participant: updatedParticipant,
      roomUrl: roomConfig.roomUrl,
      iframeUrl: roomConfig.iframeUrl,
      streamId: roomConfig.streamId,
    };
  },

  /**
   * Leave a call
   */
  async leave(callId: number, userId: number) {
    // Find participant record
    const participants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
          user: userId,
        },
      }
    );

    if (!participants || participants.length === 0) {
      throw new Error('You are not a participant in this call');
    }

    const participant = participants[0];

    // Update participant status
    await strapi.entityService.update(
      'plugin::video-chat.call-participant',
      participant.id,
      {
        data: {
          status: 'left',
          leftAt: new Date(),
        },
      }
    );

    // Update user presence
    const presenceService = strapi.plugin('video-chat').service('presence');
    await presenceService.updateStatus(userId, 'online');

    // Check if all participants have left
    const allParticipants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
        },
      }
    );

    const activeParticipants = allParticipants.filter(
      (p: any) => p.status === 'joined' || p.status === 'invited'
    );

    // End call if no active participants
    if (activeParticipants.length === 0) {
      await this.end(callId);
    }

    return { success: true };
  },

  /**
   * Decline a call
   */
  async decline(callId: number, userId: number) {
    // Find participant record
    const participants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
          user: userId,
        },
      }
    );

    if (!participants || participants.length === 0) {
      throw new Error('You are not a participant in this call');
    }

    const participant = participants[0];

    // Update participant status
    await strapi.entityService.update(
      'plugin::video-chat.call-participant',
      participant.id,
      {
        data: {
          status: 'declined',
          leftAt: new Date(),
        },
      }
    );

    // For one-on-one calls, end the call if declined
    const call = await strapi.entityService.findOne('plugin::video-chat.call', callId);

    if (call.callType === 'one-on-one') {
      await strapi.entityService.update('plugin::video-chat.call', callId, {
        data: {
          status: 'declined',
          endedAt: new Date(),
        },
      });
    }

    return { success: true };
  },

  /**
   * End a call
   */
  async end(callId: number) {
    const call = await strapi.entityService.findOne('plugin::video-chat.call', callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.status === 'ended') {
      return { success: true };
    }

    // Calculate duration
    let duration = null;
    if (call.startedAt) {
      const endTime = new Date();
      const startTime = new Date(call.startedAt);
      duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // seconds
    }

    // Update call status
    await strapi.entityService.update('plugin::video-chat.call', callId, {
      data: {
        status: 'ended',
        endedAt: new Date(),
        duration,
      },
    });

    // Update all active participants
    const participants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
          status: { $in: ['joined', 'invited'] },
        },
      }
    );

    for (const participant of participants) {
      await strapi.entityService.update(
        'plugin::video-chat.call-participant',
        participant.id,
        {
          data: {
            status: 'left',
            leftAt: new Date(),
          },
        }
      );

      // Update presence for joined participants
      if (participant.status === 'joined') {
        const presenceService = strapi.plugin('video-chat').service('presence');
        await presenceService.updateStatus(participant.user.id, 'online');
      }
    }

    return { success: true, duration };
  },

  /**
   * Delete a call (admin only)
   */
  async delete(callId: number) {
    // Delete all participant records first
    const participants = await strapi.entityService.findMany(
      'plugin::video-chat.call-participant',
      {
        filters: {
          call: callId,
        },
      }
    );

    for (const participant of participants) {
      await strapi.entityService.delete(
        'plugin::video-chat.call-participant',
        participant.id
      );
    }

    // Delete the call
    await strapi.entityService.delete('plugin::video-chat.call', callId);

    return { success: true };
  },
});
