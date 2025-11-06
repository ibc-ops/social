export default {
  kind: 'collectionType',
  collectionName: 'video_chat_call_participants',
  info: {
    singularName: 'call-participant',
    pluralName: 'call-participants',
    displayName: 'Call Participant',
    description: 'Individual participant in a video call',
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
    call: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::video-chat.call',
      configurable: false,
    },
    user: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::users-permissions.user',
      configurable: false,
    },
    joinedAt: {
      type: 'datetime',
      required: false,
    },
    leftAt: {
      type: 'datetime',
      required: false,
    },
    status: {
      type: 'enumeration',
      enum: ['invited', 'joined', 'left', 'declined'],
      required: true,
      default: 'invited',
    },
    role: {
      type: 'enumeration',
      enum: ['host', 'participant'],
      required: true,
      default: 'participant',
    },
    streamId: {
      type: 'string',
      required: false,
      // VDO.Ninja stream ID
    },
    deviceInfo: {
      type: 'json',
      required: false,
      // Camera/mic info, browser info, etc.
    },
  },
};
