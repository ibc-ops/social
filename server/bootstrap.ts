import type { Core } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Initialize plugin on Strapi startup
  strapi.log.info('Video Chat plugin loaded');

  // Initialize Socket.io for real-time signaling
  // This will be implemented when we add real-time features

  // Set up default plugin settings if they don't exist
  try {
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'video-chat',
    });

    const config = await pluginStore.get({ key: 'settings' });

    if (!config) {
      // Set default configuration
      await pluginStore.set({
        key: 'settings',
        value: {
          vdoNinjaHostUrl: 'https://vdo.ninja',
          enableCallRecording: false,
          maxGroupCallParticipants: 10,
          callTimeoutMinutes: 60,
          autoAnswerEnabled: false,
          customCSS: null,
          allowedRoles: ['authenticated'],
          turnServerConfig: null,
          webhookUrl: null,
        },
      });

      strapi.log.info('Video Chat plugin: Default settings initialized');
    }
  } catch (error) {
    strapi.log.error('Video Chat plugin: Failed to initialize settings', error);
  }
};
