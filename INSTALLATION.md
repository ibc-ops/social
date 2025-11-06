# Installation Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Strapi v5 application

## Step 1: Install the Plugin

### Option A: From NPM (when published)

```bash
npm install strapi-plugin-video-chat
```

### Option B: Local Development

```bash
# Clone or copy the plugin to your Strapi project
cp -r strapi-plugin-video-chat ./src/plugins/video-chat

# Install dependencies in your Strapi project
npm install
```

## Step 2: Enable the Plugin

Edit your `config/plugins.ts` (or `.js`) file:

```typescript
export default {
  // ... other plugins
  'video-chat': {
    enabled: true,
    resolve: './src/plugins/video-chat', // Only for local development
    config: {
      vdoNinja: {
        hostUrl: process.env.VDO_NINJA_URL || 'https://vdo.ninja',
        defaultQuality: 2, // 0-3, higher is better
        codec: 'vp9', // 'vp9', 'h264', or 'vp8'
      },
      calls: {
        maxGroupParticipants: 10,
        timeoutMinutes: 60,
        autoEndEmptyCall: true,
      },
      presence: {
        heartbeatInterval: 30000, // 30 seconds
        offlineThreshold: 60000, // 1 minute
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
  },
};
```

## Step 3: Environment Variables (Optional)

Create a `.env` file in your Strapi root:

```env
VDO_NINJA_URL=https://vdo.ninja
# Add TURN server credentials if needed
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-credential
```

## Self-Hosting Options

For better control, privacy, and compliance, you can self-host VDO.Ninja and/or run your own TURN server:

### Option A: Use Free Services (Default)
- **VDO.Ninja**: Uses the free public instance at https://vdo.ninja
- **STUN/TURN**: Uses Google's public STUN server
- **Cost**: $0/month
- **Connection Rate**: ~85-92% (STUN only)

### Option B: Self-Host VDO.Ninja Only
- **VDO.Ninja**: Your own Docker container
- **STUN/TURN**: Public STUN server
- **Cost**: ~$10-20/month (small VPS)
- **Connection Rate**: ~85-92%
- **See**: [VDO.Ninja Docker Guide](./docs/VDO_NINJA_DOCKER.md)

### Option C: Self-Host TURN Server Only
- **VDO.Ninja**: Uses public instance
- **TURN**: Your own Coturn server
- **Cost**: ~$10-30/month (VPS)
- **Connection Rate**: ~95-99% (includes relay)
- **See**: [TURN Server Docker Guide](./docs/TURN_SERVER_DOCKER.md)

### Option D: Self-Host Everything (Recommended for Production)
- **VDO.Ninja**: Your Docker container
- **TURN**: Your Coturn server
- **Cost**: ~$20-40/month (medium VPS)
- **Connection Rate**: ~95-99%
- **Privacy**: Complete control
- **See**: [Complete Self-Hosting Guide](./docs/SELF_HOSTING_GUIDE.md)

### Quick Comparison

| Scenario | Cost | Connection Rate | Privacy | Recommended For |
|----------|------|-----------------|---------|-----------------|
| Free Services | $0 | 85-92% | Low | Development, Testing |
| Self-Hosted VDO | $10-20 | 85-92% | Medium | Small Teams |
| Self-Hosted TURN | $10-30 | 95-99% | Medium | Better Reliability |
| Self-Hosted Both | $20-40 | 95-99% | High | Production, Enterprise |

### Configuration for Self-Hosted

If you self-host, update your plugin configuration:

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    enabled: true,
    config: {
      vdoNinja: {
        hostUrl: 'https://vdo.yourdomain.com', // Your VDO.Ninja instance
        defaultQuality: 2,
        codec: 'vp9',
      },
      turnServer: {
        enabled: true, // Enable TURN server
        urls: [
          'turn:turn.yourdomain.com:3478', // Your TURN server
          'turns:turn.yourdomain.com:5349'  // TURNS (TLS)
        ],
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
    },
  },
};
```

**Docker Deployment Guides:**
- 📘 [VDO.Ninja Docker Setup](./docs/VDO_NINJA_DOCKER.md) - Self-host VDO.Ninja in Docker
- 📘 [TURN Server Docker Setup](./docs/TURN_SERVER_DOCKER.md) - Deploy Coturn TURN server
- 📘 [Complete Self-Hosting Guide](./docs/SELF_HOSTING_GUIDE.md) - Deploy everything together

## Step 4: Build and Start Strapi

```bash
# Build the admin panel
npm run build

# Start Strapi
npm run develop
```

## Step 5: Access the Plugin

1. Log in to your Strapi admin panel
2. Look for "Video Chat" in the sidebar menu
3. You can now start making video calls!

## Configuration Options

### VDO.Ninja Configuration

- **hostUrl**: URL to VDO.Ninja instance (default or self-hosted)
- **defaultQuality**: Video quality preset (0-3)
- **codec**: Video codec to use ('vp9' recommended)

### Call Settings

- **maxGroupParticipants**: Maximum users in a group call
- **timeoutMinutes**: Auto-end calls after this duration
- **autoEndEmptyCall**: End calls when all users leave

### Presence Settings

- **heartbeatInterval**: How often clients send keep-alive (ms)
- **offlineThreshold**: Time before marking user offline (ms)

### TURN Server (Optional)

For improved connectivity in restricted networks:

```typescript
turnServer: {
  enabled: true,
  urls: ['turn:your-server.com:3478'],
  username: 'your-username',
  credential: 'your-password',
}
```

Recommended TURN providers:
- [Twilio TURN](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- Self-hosted [coturn](https://github.com/coturn/coturn)

## Self-Hosting VDO.Ninja (Optional)

For complete control and branding:

1. Clone VDO.Ninja repository:
```bash
git clone https://github.com/steveseguin/vdo.ninja.git
cd vdo.ninja
```

2. Follow their [installation guide](https://github.com/steveseguin/vdo.ninja/blob/develop/install.md)

3. Update your plugin config to use your hosted URL:
```typescript
vdoNinja: {
  hostUrl: 'https://your-vdo-ninja-instance.com',
}
```

## Permissions

The plugin integrates with Strapi's role-based permissions:

1. Go to Settings → Roles
2. Select a role (e.g., "Authenticated")
3. Enable permissions for the "Video Chat" plugin

## Troubleshooting

### Plugin not showing in admin

- Ensure plugin is enabled in `config/plugins.ts`
- Rebuild admin: `npm run build`
- Clear browser cache

### Cannot create calls

- Check user permissions in Settings → Roles
- Verify user is authenticated

### Video quality issues

- Adjust `defaultQuality` setting (0-3)
- Consider using a TURN server
- Check network bandwidth

### Self-hosted VDO.Ninja not working

- Verify CORS settings
- Check SSL certificates
- Ensure WebRTC ports are open

## Support

- [GitHub Issues](https://github.com/your-org/strapi-plugin-video-chat/issues)
- [Technical Specification](./TECH_SPEC_VIDEO_CHAT_PLUGIN.md)
- [VDO.Ninja Documentation](https://docs.vdo.ninja)
