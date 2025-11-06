export default {
  kind: 'collectionType',
  collectionName: 'video_chat_user_presences',
  info: {
    singularName: 'user-presence',
    pluralName: 'user-presences',
    displayName: 'User Presence',
    description: 'User online/offline status and availability',
  },
  options: {
    draftAndPublish: false,
    comment: '',
  },
  pluginOptions: {
    'content-manager': {
      visible: true,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  attributes: {
    user: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'plugin::users-permissions.user',
      unique: true,
      configurable: false,
    },
    status: {
      type: 'enumeration',
      enum: ['online', 'offline', 'in-call', 'busy', 'away'],
      required: true,
      default: 'offline',
    },
    currentCall: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::video-chat.call',
      required: false,
      configurable: false,
    },
    lastSeenAt: {
      type: 'datetime',
      required: true,
    },
    socketId: {
      type: 'string',
      required: false,
      // For real-time Socket.io connection
    },
    metadata: {
      type: 'json',
      required: false,
      // Device capabilities, browser info, etc.
    },
  },
};
