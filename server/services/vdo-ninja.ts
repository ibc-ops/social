import type { Core } from '@strapi/strapi';
import { randomBytes } from 'crypto';

interface VDONinjaConfig {
  room: string;
  push?: string;
  view?: string;
  cleanoutput?: boolean;
  cleanish?: boolean;
  novideo?: boolean;
  screenshare?: boolean;
  quality?: number;
  codec?: 'vp9' | 'h264' | 'vp8';
  css?: string;
  label?: string;
  password?: string;
  hash?: string;
}

interface RoomConfig {
  callId: number;
  userId: number;
  role: 'host' | 'participant';
  userName?: string;
  audioOnly?: boolean;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Generate a unique room ID
   */
  generateRoomId(): string {
    // Generate a 12-character alphanumeric room ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomId = '';
    const randomValues = randomBytes(12);

    for (let i = 0; i < 12; i++) {
      roomId += chars[randomValues[i] % chars.length];
    }

    return roomId;
  },

  /**
   * Generate a unique stream ID for a participant
   */
  generateStreamId(): string {
    // Generate a unique stream ID (8 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let streamId = '';
    const randomValues = randomBytes(8);

    for (let i = 0; i < 8; i++) {
      streamId += chars[randomValues[i] % chars.length];
    }

    return streamId;
  },

  /**
   * Generate a secure room password
   */
  generateRoomPassword(): string {
    return randomBytes(16).toString('hex');
  },

  /**
   * Get VDO.Ninja host URL from config
   */
  getHostUrl(): string {
    const pluginConfig = strapi.config.get('plugin::video-chat');
    return pluginConfig?.vdoNinja?.hostUrl || 'https://vdo.ninja';
  },

  /**
   * Build VDO.Ninja URL with parameters
   */
  buildUrl(config: VDONinjaConfig): string {
    const hostUrl = this.getHostUrl();
    const params = new URLSearchParams();

    // Add room parameter
    if (config.room) {
      params.append('room', config.room);
    }

    // Add push/view for stream control
    if (config.push) {
      params.append('push', config.push);
    }
    if (config.view) {
      params.append('view', config.view);
    }

    // UI customization
    if (config.cleanoutput) {
      params.append('cleanoutput', '1');
    }
    if (config.cleanish) {
      params.append('cleanish', '1');
    }
    if (config.novideo) {
      params.append('novideo', '1');
    }
    if (config.screenshare !== undefined) {
      params.append('screenshare', config.screenshare ? '1' : '0');
    }

    // Quality settings
    if (config.quality !== undefined) {
      params.append('quality', config.quality.toString());
    }
    if (config.codec) {
      params.append('codec', config.codec);
    }

    // Custom CSS
    if (config.css) {
      params.append('css', config.css);
    }

    // User label
    if (config.label) {
      params.append('label', config.label);
    }

    // Security
    if (config.password) {
      params.append('password', config.password);
    }
    if (config.hash) {
      params.append('hash', config.hash);
    }

    return `${hostUrl}?${params.toString()}`;
  },

  /**
   * Generate complete room configuration for a user
   */
  async generateRoomConfig(roomConfig: RoomConfig) {
    const { callId, userId, role, userName, audioOnly } = roomConfig;

    // Get plugin configuration
    const pluginConfig = strapi.config.get('plugin::video-chat');
    const defaultQuality = pluginConfig?.vdoNinja?.defaultQuality || 2;
    const defaultCodec = pluginConfig?.vdoNinja?.codec || 'vp9';

    // Get or create room ID for this call
    const call = await strapi.entityService.findOne('plugin::video-chat.call', callId, {
      fields: ['roomId', 'metadata'],
    });

    if (!call) {
      throw new Error('Call not found');
    }

    const roomId = call.roomId;
    const streamId = this.generateStreamId();

    // Build VDO.Ninja URL
    const vdoConfig: VDONinjaConfig = {
      room: roomId,
      push: streamId,
      cleanish: true,
      quality: defaultQuality,
      codec: defaultCodec,
      label: userName || `User ${userId}`,
      screenshare: true,
    };

    if (audioOnly) {
      vdoConfig.novideo = true;
    }

    // Add room password if configured
    if (call.metadata?.password) {
      vdoConfig.password = call.metadata.password;
    }

    const roomUrl = this.buildUrl(vdoConfig);

    // Generate IFRAME embed URL (cleaner UI for embedding)
    const iframeConfig: VDONinjaConfig = {
      ...vdoConfig,
      cleanoutput: true,
    };
    const iframeUrl = this.buildUrl(iframeConfig);

    return {
      roomUrl,
      iframeUrl,
      streamId,
      roomId,
      hostUrl: this.getHostUrl(),
    };
  },

  /**
   * Generate viewer URL (for viewing a specific stream)
   */
  async generateViewerUrl(roomId: string, streamId: string, userName?: string) {
    const pluginConfig = strapi.config.get('plugin::video-chat');
    const defaultQuality = pluginConfig?.vdoNinja?.defaultQuality || 2;

    const vdoConfig: VDONinjaConfig = {
      room: roomId,
      view: streamId,
      cleanish: true,
      quality: defaultQuality,
      label: userName || 'Viewer',
    };

    return this.buildUrl(vdoConfig);
  },

  /**
   * Get IFRAME API documentation/config
   */
  getIframeApiConfig() {
    return {
      events: [
        'remote-track-added',
        'remote-track-removed',
        'connection-quality',
        'joined-room',
        'left-room',
        'error',
      ],
      commands: [
        'mute-audio',
        'unmute-audio',
        'mute-video',
        'unmute-video',
        'hangup',
        'start-screenshare',
        'stop-screenshare',
      ],
      documentation: 'https://github.com/steveseguin/vdo.ninja/blob/develop/IFRAME.md',
    };
  },
});
