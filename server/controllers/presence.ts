import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get current user's presence
   * GET /video-chat/presence
   */
  async getMyPresence(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const presenceService = strapi.plugin('video-chat').service('presence');
      const presence = await presenceService.getPresence(userId);

      ctx.body = {
        data: presence,
      };
    } catch (error) {
      strapi.log.error('Error getting presence:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Update current user's presence
   * PATCH /video-chat/presence
   */
  async updateMyPresence(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { status, metadata } = ctx.request.body;

      if (!status || !['online', 'offline', 'busy', 'away'].includes(status)) {
        return ctx.badRequest(
          'status must be one of: online, offline, busy, away'
        );
      }

      const presenceService = strapi.plugin('video-chat').service('presence');

      // Update status
      const presence = await presenceService.updateStatus(userId, status);

      // Update metadata if provided
      if (metadata) {
        await presenceService.updateMetadata(userId, metadata);
      }

      ctx.body = {
        data: presence,
      };
    } catch (error) {
      strapi.log.error('Error updating presence:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Get presence for multiple users
   * GET /video-chat/presence/users?userIds=1,2,3
   */
  async getUsersPresence(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const { userIds } = ctx.query;

      if (!userIds) {
        return ctx.badRequest('userIds query parameter is required');
      }

      // Parse comma-separated IDs
      const ids = userIds
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id));

      if (ids.length === 0) {
        return ctx.badRequest('No valid user IDs provided');
      }

      const presenceService = strapi.plugin('video-chat').service('presence');
      const presences = await presenceService.getPresenceForUsers(ids);

      ctx.body = {
        data: presences,
      };
    } catch (error) {
      strapi.log.error('Error getting users presence:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Get all online users
   * GET /video-chat/presence/online
   */
  async getOnlineUsers(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const presenceService = strapi.plugin('video-chat').service('presence');
      const presences = await presenceService.getOnlineUsers();

      ctx.body = {
        data: presences,
      };
    } catch (error) {
      strapi.log.error('Error getting online users:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Send heartbeat (keep-alive)
   * POST /video-chat/presence/heartbeat
   */
  async heartbeat(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const presenceService = strapi.plugin('video-chat').service('presence');
      const result = await presenceService.heartbeat(userId);

      ctx.body = {
        data: result,
      };
    } catch (error) {
      strapi.log.error('Error sending heartbeat:', error);
      ctx.badRequest(error.message);
    }
  },
});
