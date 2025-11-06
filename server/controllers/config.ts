import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get public plugin configuration
   * GET /video-chat/config
   */
  async getConfig(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'video-chat',
      });

      const settings = await pluginStore.get({ key: 'settings' });
      const vdoNinjaService = strapi.plugin('video-chat').service('vdo-ninja');

      // Return only public configuration
      ctx.body = {
        data: {
          vdoNinjaHostUrl: settings?.vdoNinjaHostUrl || 'https://vdo.ninja',
          maxGroupCallParticipants: settings?.maxGroupCallParticipants || 10,
          enableScreenShare: settings?.enableScreenShare !== false,
          enableChat: settings?.enableChat !== false,
          customCSS: settings?.customCSS || null,
          iframeApi: vdoNinjaService.getIframeApiConfig(),
        },
      };
    } catch (error) {
      strapi.log.error('Error getting config:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Update plugin configuration (admin only)
   * PUT /video-chat/config
   */
  async updateConfig(ctx: any) {
    try {
      const userId = ctx.state.user?.id;
      const isAdmin = ctx.state.user?.role?.type === 'admin';

      if (!userId || !isAdmin) {
        return ctx.forbidden('Only administrators can update configuration');
      }

      const pluginStore = strapi.store({
        type: 'plugin',
        name: 'video-chat',
      });

      const currentSettings = await pluginStore.get({ key: 'settings' });
      const newSettings = {
        ...currentSettings,
        ...ctx.request.body,
      };

      await pluginStore.set({
        key: 'settings',
        value: newSettings,
      });

      ctx.body = {
        data: newSettings,
      };
    } catch (error) {
      strapi.log.error('Error updating config:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * Get VDO.Ninja IFRAME config
   * GET /video-chat/vdo/iframe-config
   */
  async getIframeConfig(ctx: any) {
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        return ctx.unauthorized('You must be authenticated');
      }

      const vdoNinjaService = strapi.plugin('video-chat').service('vdo-ninja');
      const config = vdoNinjaService.getIframeApiConfig();

      ctx.body = {
        data: config,
      };
    } catch (error) {
      strapi.log.error('Error getting iframe config:', error);
      ctx.badRequest(error.message);
    }
  },
});
