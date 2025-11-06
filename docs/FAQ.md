# Frequently Asked Questions (FAQ)

Common questions about the Strapi Video Chat Plugin.

## General Questions

### What is this plugin?

The Strapi Video Chat Plugin adds video and audio calling capabilities to your Strapi V5 application using VDO.Ninja's open-source WebRTC technology.

### Is it free?

Yes! The plugin is open source (MIT license) and uses VDO.Ninja's free service. You only pay for your Strapi hosting.

### Does it work with Strapi V4?

No, this plugin is specifically designed for Strapi V5. For V4, you would need to adapt the code significantly.

### What browsers are supported?

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best performance |
| Firefox | ✅ Full | Good performance |
| Safari | ✅ Full | iOS 14.3+ required |
| Edge | ✅ Full | Chromium-based |
| Opera | ✅ Full | Chromium-based |
| IE 11 | ❌ No | WebRTC not supported |

---

## Technical Questions

### How does video calling work?

The plugin uses peer-to-peer (P2P) WebRTC technology:

1. Your Strapi backend manages call metadata (who, when, status)
2. VDO.Ninja handles the actual video/audio streaming
3. 95% of calls connect directly between users (P2P)
4. 5% use relay servers (TURN) for restricted networks

**No video streams pass through your server!**

### Do I need to host VDO.Ninja?

No! By default, it uses the free vdo.ninja service. But you can self-host if you want full control:

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      vdoNinja: {
        hostUrl: 'https://your-vdo-ninja.com'
      }
    }
  }
};
```

### Is it HTTPS required?

**Yes**, WebRTC requires HTTPS in production. Development on `localhost` works with HTTP.

### What's the maximum number of participants?

Default is 10 for group calls, but configurable:

```typescript
// config/plugins.ts
calls: {
  maxGroupParticipants: 20 // Adjust as needed
}
```

**Note:** More participants = higher bandwidth requirements.

### Does it work on mobile?

Yes! Mobile browsers with WebRTC support work:
- iOS Safari (14.3+)
- Chrome for Android
- Firefox for Android

A dedicated mobile app is planned for v2.0.

---

## Cost & Infrastructure

### What are the hosting costs?

**Plugin costs**: $0 (open source)

**Infrastructure costs**:
- **Using vdo.ninja**: Free!
- **Self-hosted VDO.Ninja**: ~$10-50/month (DigitalOcean/AWS)
- **TURN server (optional)**: ~$20-100/month
- **Your Strapi hosting**: Depends on your plan

**Total for most users**: $0-20/month

### Do I need a TURN server?

Not required, but recommended for enterprise:

**Without TURN**: 90-95% of calls work (P2P)
**With TURN**: 98-99% of calls work (P2P + relay)

TURN helps with:
- Corporate firewalls
- Symmetric NAT
- Restrictive networks

Popular TURN providers:
- [Twilio](https://www.twilio.com/stun-turn) (pay-as-you-go)
- [Xirsys](https://xirsys.com/) (free tier available)
- Self-hosted [coturn](https://github.com/coturn/coturn) (open source)

### Will it scale?

Yes! The P2P architecture scales naturally:

| Metric | Scalability |
|--------|-------------|
| **Concurrent calls** | Unlimited* |
| **Users** | 1,000s |
| **Server load** | Low (only metadata) |
| **Bandwidth** | P2P (users' bandwidth) |

*Limited only by your Strapi server capacity for API calls.

---

## Features & Capabilities

### Can I record calls?

Not in v1.0. Call recording is planned for v1.1:
- Cloud storage integration (S3, etc.)
- Local recording option
- Permission controls

### Is screen sharing supported?

Yes! Screen sharing works out of the box:
- Click the screen share button during a call
- Browser will prompt for permission
- Share entire screen, window, or tab

### Can I customize the video interface?

Yes! Multiple ways:

1. **Custom CSS**:
```typescript
ui: {
  customCSS: 'https://your-domain.com/vdo-custom.css'
}
```

2. **Custom React components**:
```typescript
import { VideoCallFrame } from './your-custom-component';
```

3. **VDO.Ninja URL parameters**:
```typescript
// Adjust quality, layout, controls, etc.
```

### Does it support chat during calls?

VDO.Ninja has built-in chat. Enable it:

```typescript
ui: {
  enableChat: true
}
```

### Can I add virtual backgrounds?

Not currently. Planned for v2.0:
- Blur background
- Custom images
- AI-powered backgrounds

---

## Privacy & Security

### Is it secure?

Yes, multiple security layers:

1. **HTTPS/TLS**: Encrypted transport
2. **JWT Auth**: Secure authentication
3. **RBAC**: Role-based permissions
4. **Room Passwords**: VDO.Ninja room security
5. **WebRTC Encryption**: Native DTLS-SRTP

### Are calls end-to-end encrypted?

**Partially.** WebRTC uses DTLS-SRTP encryption, meaning:
- ✅ Encrypted between peers
- ✅ No one can intercept the stream
- ⚠️ VDO.Ninja handshake server can see metadata
- ⚠️ TURN server can see encrypted packets (if used)

For true E2E encryption, you'd need to encrypt before WebRTC, which impacts performance.

### What data is stored?

**Stored**:
- Call metadata (participants, timestamps, duration)
- User presence (online/offline status)
- Participant records (join/leave times)

**NOT stored**:
- Video streams (P2P, never hits server)
- Audio streams (P2P, never hits server)
- Chat messages (unless you enable server-side storage)

### Is it GDPR compliant?

Yes, if configured correctly:

1. **Data minimization**: Only stores necessary data
2. **Right to access**: API provides user data export
3. **Right to erasure**: Implement data deletion
4. **Consent**: Get user consent for camera/mic
5. **Data processing agreement**: Sign DPA with VDO.Ninja if required

See [Security Guide](./SECURITY.md#gdpr-compliance) for details.

### Is it HIPAA compliant?

Can be, with additional configuration:

- Disable call recording
- Use self-hosted VDO.Ninja
- Sign BAA with hosting provider
- Enable audit logging
- Encrypt database at rest

**Consult HIPAA compliance expert** for healthcare use.

---

## Integration Questions

### How do I add it to my frontend?

Multiple approaches:

**1. Direct API calls**:
```javascript
const response = await fetch('http://localhost:1337/api/video-chat/calls', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participantIds: [2],
    callType: 'one-on-one'
  })
});
```

**2. React component**:
```jsx
import { VideoCallButton } from './components/VideoCallButton';

<VideoCallButton userId={2} jwtToken={jwt} />
```

**3. Vue.js composable**:
```javascript
import { useVideoChat } from './composables/useVideoChat';

const { createCall } = useVideoChat(jwt);
```

See [Developer Guide](./DEVELOPER_GUIDE.md) for complete examples.

### Can I use it with Next.js?

Yes! Examples provided for:
- Next.js Pages Router
- Next.js App Router
- API routes
- Server-side rendering considerations

See [Developer Guide - Next.js Integration](./DEVELOPER_GUIDE.md#nextjs-integration).

### Does it work with GraphQL?

The plugin provides REST API only. For GraphQL:

```typescript
// Create GraphQL wrapper
type Mutation {
  createCall(input: CreateCallInput!): Call
}

// Resolver calls REST API
createCall: async (_, { input }, ctx) => {
  const response = await fetch('http://localhost:1337/api/video-chat/calls', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ctx.jwt}` },
    body: JSON.stringify(input)
  });
  return response.json();
}
```

### Can I customize presence statuses?

Yes, the presence system supports:
- `online`
- `offline`
- `in-call`
- `busy`
- `away`

And you can store custom metadata:

```typescript
await api.updatePresence('busy', {
  customStatus: 'In a meeting until 3pm',
  availableAt: '2025-11-06T15:00:00Z'
});
```

---

## Troubleshooting

### Why can't I see my video?

Check:
1. **Browser permissions**: Allow camera access
2. **HTTPS**: Required for WebRTC (except localhost)
3. **Camera in use**: Close other apps using camera
4. **Browser support**: Use Chrome, Firefox, or Edge

See [Troubleshooting Guide](./TROUBLESHOOTING.md#videoaudio-issues).

### Why does my call drop?

Common causes:
1. **Poor internet**: Check bandwidth
2. **Network restrictions**: Configure TURN server
3. **Browser issues**: Try different browser
4. **Firewall**: Allow WebRTC ports

### How do I enable debug mode?

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      debug: true
    }
  }
};
```

Then check console/logs for detailed information.

---

## Development Questions

### How do I contribute?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### How do I report bugs?

1. Check existing issues on GitHub
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Strapi version, Node version, browser)
   - Screenshots if applicable

### How do I request features?

Open a GitHub issue with:
- **Feature description**: What you want
- **Use case**: Why you need it
- **Proposed solution**: How it could work
- **Alternatives**: Other approaches you've considered

### What's the roadmap?

**v1.0** (Current):
- Core video calling
- Admin panel UI
- REST API
- Presence system

**v1.1** (Q2 2025):
- Call recording
- Push notifications
- Mobile app (React Native)
- Advanced analytics

**v2.0** (Q3-Q4 2025):
- AI transcription
- Virtual backgrounds
- Calendar integration
- WebRTC mesh networking

---

## Pricing & Licensing

### Is it really free?

Yes! MIT License = fully free and open source:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Private use
- ❌ No warranty provided

### Can I sell it?

Yes, you can:
- Use in commercial projects
- Charge your users for access
- Offer as a service
- Include in your product

But you cannot:
- Remove the license
- Sue if it doesn't work perfectly

### Do I need to credit you?

Not required, but appreciated! A simple mention like:

```
"Video calling powered by Strapi Video Chat Plugin"
```

or a GitHub star ⭐ helps us out!

---

## Migration Questions

### Can I migrate from another solution?

Depends on your current setup:

**From Twilio Video**: Export call history → import to Strapi
**From Zoom API**: Similar migration process
**From Jitsi**: May require custom migration script

Contact us for migration assistance.

### Will my data be safe during updates?

Yes, database schema changes are handled by Strapi migrations. Always:

1. Backup database before updating
2. Test in development first
3. Review CHANGELOG for breaking changes
4. Follow update instructions

---

## Still Have Questions?

- **Documentation**: [Full Documentation Index](./README.md)
- **GitHub Issues**: Open an issue for bugs/features
- **Stack Overflow**: Tag with `strapi-video-chat`
- **Email**: support@your-domain.com

---

## Quick Links

- [Installation Guide](../INSTALLATION.md)
- [Quick Start](./QUICK_START.md)
- [API Reference](./API_REFERENCE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Security Guide](./SECURITY.md)
