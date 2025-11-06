# Strapi Plugin Video Chat

Audio/Video chat plugin for Strapi V5 using VDO.Ninja WebRTC technology.

## Features

- 🎥 1-on-1 and group video calls
- 🎙️ Audio-only calls
- 👥 User presence system (online/offline/in-call)
- 📞 Call history and management
- 🔔 Real-time call invitations and notifications
- 🎨 Customizable UI with CSS injection
- 🔐 Role-based access control
- 🌐 Self-hosted or cloud VDO.Ninja options
- 📱 Responsive design

## Installation

```bash
npm install strapi-plugin-video-chat
```

## Configuration

Add the plugin to your `config/plugins.ts`:

```typescript
export default {
  'video-chat': {
    enabled: true,
    config: {
      vdoNinja: {
        hostUrl: 'https://vdo.ninja', // or your self-hosted URL
        defaultQuality: 2,
        codec: 'vp9',
      },
      calls: {
        maxGroupParticipants: 10,
        timeoutMinutes: 60,
      },
    },
  },
};
```

## Usage

See [TECH_SPEC_VIDEO_CHAT_PLUGIN.md](./TECH_SPEC_VIDEO_CHAT_PLUGIN.md) for complete documentation.

## Development

```bash
# Install dependencies
npm install

# Watch for changes
npm run dev

# Build
npm run build

# Type check
npm run verify
```

## License

MIT
