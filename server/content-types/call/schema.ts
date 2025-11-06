export default {
  kind: 'collectionType',
  collectionName: 'video_chat_calls',
  info: {
    singularName: 'call',
    pluralName: 'calls',
    displayName: 'Video Call',
    description: 'Video and audio call records',
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
    uuid: {
      type: 'string',
      required: true,
      unique: true,
      configurable: false,
    },
    roomId: {
      type: 'string',
      required: true,
      configurable: false,
    },
    callType: {
      type: 'enumeration',
      enum: ['one-on-one', 'group'],
      required: true,
      default: 'one-on-one',
    },
    status: {
      type: 'enumeration',
      enum: ['pending', 'active', 'ended', 'missed', 'declined'],
      required: true,
      default: 'pending',
    },
    initiator: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'plugin::users-permissions.user',
      configurable: false,
    },
    participants: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'plugin::users-permissions.user',
      configurable: false,
    },
    startedAt: {
      type: 'datetime',
      required: false,
    },
    endedAt: {
      type: 'datetime',
      required: false,
    },
    duration: {
      type: 'integer',
      required: false,
      min: 0,
      // Duration in seconds
    },
    metadata: {
      type: 'json',
      required: false,
      // Stores VDO.Ninja config, quality stats, etc.
    },
  },
};
