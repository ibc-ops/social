export default {
  default: {
    vdoNinja: {
      hostUrl: 'https://vdo.ninja',
      defaultQuality: 2,
      codec: 'vp9',
    },
    calls: {
      maxGroupParticipants: 10,
      timeoutMinutes: 60,
      autoEndEmptyCall: true,
    },
    presence: {
      heartbeatInterval: 30000,
      offlineThreshold: 60000,
    },
    turnServer: {
      enabled: false,
      urls: [],
      username: '',
      credential: '',
    },
    permissions: {
      allowedRoles: ['authenticated'],
      adminRoles: ['admin'],
    },
    ui: {
      customCSS: '',
      brandColor: '#4945ff',
      enableChat: true,
      enableScreenShare: true,
    },
  },
  validator: (config: any) => {
    // Validate configuration
    if (config.calls.maxGroupParticipants < 2) {
      throw new Error('maxGroupParticipants must be at least 2');
    }
    if (config.calls.timeoutMinutes < 1) {
      throw new Error('timeoutMinutes must be at least 1');
    }
  },
};
