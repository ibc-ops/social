export default [
  // Call management routes
  {
    method: 'POST',
    path: '/calls',
    handler: 'call.create',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/calls',
    handler: 'call.find',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/calls/:id',
    handler: 'call.findOne',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/calls/:id/join',
    handler: 'call.join',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/calls/:id/leave',
    handler: 'call.leave',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/calls/:id/decline',
    handler: 'call.decline',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/calls/:id/end',
    handler: 'call.end',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'DELETE',
    path: '/calls/:id',
    handler: 'call.delete',
    config: {
      policies: [],
      middlewares: [],
    },
  },

  // Presence routes
  {
    method: 'GET',
    path: '/presence',
    handler: 'presence.getMyPresence',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'PATCH',
    path: '/presence',
    handler: 'presence.updateMyPresence',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/presence/users',
    handler: 'presence.getUsersPresence',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/presence/online',
    handler: 'presence.getOnlineUsers',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/presence/heartbeat',
    handler: 'presence.heartbeat',
    config: {
      policies: [],
      middlewares: [],
    },
  },

  // Configuration routes
  {
    method: 'GET',
    path: '/config',
    handler: 'config.getConfig',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'PUT',
    path: '/config',
    handler: 'config.updateConfig',
    config: {
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/vdo/iframe-config',
    handler: 'config.getIframeConfig',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];
