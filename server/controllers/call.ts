import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Create a new call
   * POST /video-chat/calls
   */
  async create(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { participantIds, callType, audioOnly, metadata } = ctx.request.body;

      if (!participantIds || !Array.isArray(participantIds)) {
        return ctx.badRequest('participantIds is required and must be an array');
      }

      if (!callType || !['one-on-one', 'group'].includes(callType)) {
        return ctx.badRequest('callType must be "one-on-one" or "group"');
      }

      const callService = strapi.plugin('video-chat').service('call');

      const result = await callService.create({
        initiatorId: userId,
        participantIds,
        callType,
        audioOnly: audioOnly || false,
        metadata: metadata || {},
      });

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error creating call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Get call by ID
   * GET /video-chat/calls/:id
   */
  async findOne(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { id } = ctx.params;

      const callService = strapi.plugin('video-chat').service('call');
      const call = await callService.findOne(parseInt(id), userId);

      ctx.body = {
        data: call,
      };
    } catch (error) {
      strapi.log.error('Error finding call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Get all calls
   * GET /video-chat/calls
   */
  async find(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { status, callType, startDate, endDate } = ctx.query;

      const callService = strapi.plugin('video-chat').service('call');
      const calls = await callService.find(
        {
          status,
          callType,
          startDate,
          endDate,
        },
        userId
      );

      ctx.body = {
        data: calls,
      };
    } catch (error) {
      strapi.log.error('Error finding calls:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Join a call
   * POST /video-chat/calls/:id/join
   */
  async join(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { id } = ctx.params;
      const { deviceInfo } = ctx.request.body;

      const callService = strapi.plugin('video-chat').service('call');
      const result = await callService.join({
        callId: parseInt(id),
        userId,
        deviceInfo,
      });

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error joining call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Leave a call
   * POST /video-chat/calls/:id/leave
   */
  async leave(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { id } = ctx.params;

      const callService = strapi.plugin('video-chat').service('call');
      const result = await callService.leave(parseInt(id), userId);

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error leaving call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Decline a call
   * POST /video-chat/calls/:id/decline
   */
  async decline(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { id } = ctx.params;

      const callService = strapi.plugin('video-chat').service('call');
      const result = await callService.decline(parseInt(id), userId);

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error declining call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * End a call
   * POST /video-chat/calls/:id/end
   */
  async end(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { id } = ctx.params;

      // Verify user is part of the call
      const callService = strapi.plugin('video-chat').service('call');
      const call = await callService.findOne(parseInt(id), userId);

      // Check if user is the initiator or admin
      const isInitiator = call.initiator.id === userId;
      const isAdmin = ctx.state.user?.role?.type === 'admin';

      if (!isInitiator && !isAdmin) {
        return ctx.forbidden('Only the call initiator or admin can end the call');
      }

      const result = await callService.end(parseInt(id));

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error ending call:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Delete a call (admin only)
   * DELETE /video-chat/calls/:id
   */
  async delete(ctx: any) {
    try {
      const userId = ctx.state.user?.id;
      const isAdmin = ctx.state.user?.role?.type === 'admin';

      if (!userId || !isAdmin) {
        return ctx.forbidden('Only administrators can delete calls');
      }

      const { id } = ctx.params;

      const callService = strapi.plugin('video-chat').service('call');
      const result = await callService.delete(parseInt(id));

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error deleting call:', error);
      ctx.badRequest(error.message);
    }
  },
});
