import type { Core } from '@strapi/strapi';

type PresenceStatus = 'online' | 'offline' | 'in-call' | 'busy' | 'away';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get or create presence for a user
   */
  async getOrCreate(userId: number) {
    // Try to find existing presence
    const presences = await strapi.entityService.findMany(
      'plugin::video-chat.user-presence',
      {
        filters: {
          user: userId,
        },
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
          currentCall: true,
        },
      }
    );

    if (presences && presences.length > 0) {
      return presences[0];
    }

    // Create new presence
    const presence = await strapi.entityService.create(
      'plugin::video-chat.user-presence',
      {
        data: {
          user: userId,
          status: 'offline',
          lastSeenAt: new Date(),
        },
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
        },
      }
    );

    return presence;
  },

  /**
   * Update user status
   */
  async updateStatus(
    userId: number,
    status: PresenceStatus,
    callId?: number,
    socketId?: string
  ) {
    const presence = await this.getOrCreate(userId);

    const updateData: any = {
      status,
      lastSeenAt: new Date(),
    };

    if (status === 'in-call' && callId) {
      updateData.currentCall = callId;
    } else if (status !== 'in-call') {
      updateData.currentCall = null;
    }

    if (socketId !== undefined) {
      updateData.socketId = socketId;
    }

    const updated = await strapi.entityService.update(
      'plugin::video-chat.user-presence',
      presence.id,
      {
        data: updateData,
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
          currentCall: true,
        },
      }
    );

    return updated;
  },

  /**
   * Set user online
   */
  async setOnline(userId: number, socketId?: string) {
    return this.updateStatus(userId, 'online', undefined, socketId);
  },

  /**
   * Set user offline
   */
  async setOffline(userId: number) {
    return this.updateStatus(userId, 'offline', undefined, null);
  },

  /**
   * Get presence for a user
   */
  async getPresence(userId: number) {
    return this.getOrCreate(userId);
  },

  /**
   * Get presence for multiple users
   */
  async getPresenceForUsers(userIds: number[]) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const presences = await strapi.entityService.findMany(
      'plugin::video-chat.user-presence',
      {
        filters: {
          user: {
            id: {
              $in: userIds,
            },
          },
        },
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
          currentCall: {
            fields: ['id', 'uuid', 'status'],
          },
        },
      }
    );

    // Create presence for users who don't have one yet
    const existingUserIds = presences.map((p: any) => p.user.id);
    const missingUserIds = userIds.filter(id => !existingUserIds.includes(id));

    for (const userId of missingUserIds) {
      const newPresence = await this.getOrCreate(userId);
      presences.push(newPresence);
    }

    return presences;
  },

  /**
   * Update last seen timestamp
   */
  async heartbeat(userId: number) {
    const presence = await this.getOrCreate(userId);

    // Auto-set to online if currently offline
    const status = presence.status === 'offline' ? 'online' : presence.status;

    await strapi.entityService.update(
      'plugin::video-chat.user-presence',
      presence.id,
      {
        data: {
          status,
          lastSeenAt: new Date(),
        },
      }
    );

    return { success: true };
  },

  /**
   * Check for stale presences and mark as offline
   */
  async cleanupStalePresences() {
    const pluginConfig = strapi.config.get('plugin::video-chat');
    const offlineThreshold = pluginConfig?.presence?.offlineThreshold || 60000; // 60 seconds

    const thresholdDate = new Date(Date.now() - offlineThreshold);

    // Find all presences that haven't been updated recently
    const stalePresences = await strapi.entityService.findMany(
      'plugin::video-chat.user-presence',
      {
        filters: {
          status: {
            $in: ['online', 'away'],
          },
          lastSeenAt: {
            $lt: thresholdDate,
          },
        },
      }
    );

    // Mark them as offline
    for (const presence of stalePresences) {
      await strapi.entityService.update(
        'plugin::video-chat.user-presence',
        presence.id,
        {
          data: {
            status: 'offline',
            socketId: null,
          },
        }
      );
    }

    return {
      cleaned: stalePresences.length,
    };
  },

  /**
   * Get all online users
   */
  async getOnlineUsers() {
    const presences = await strapi.entityService.findMany(
      'plugin::video-chat.user-presence',
      {
        filters: {
          status: {
            $in: ['online', 'in-call', 'busy', 'away'],
          },
        },
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
        },
        sort: { lastSeenAt: 'desc' },
      }
    );

    return presences;
  },

  /**
   * Update device metadata
   */
  async updateMetadata(userId: number, metadata: any) {
    const presence = await this.getOrCreate(userId);

    await strapi.entityService.update(
      'plugin::video-chat.user-presence',
      presence.id,
      {
        data: {
          metadata: {
            ...presence.metadata,
            ...metadata,
          },
        },
      }
    );

    return { success: true };
  },
});
