# Usage Guide

## Admin Panel Usage

### Starting a Video Call

1. Navigate to the Video Chat section in the admin panel
2. Click the "New Call" button
3. Select call type:
   - **One-on-One**: Call a single user
   - **Group**: Call multiple users
4. Select participants from the list
5. Toggle "Audio Only" if you don't want video
6. Click "Start Call"

### During a Call

The video interface includes these controls:

- **Microphone**: Mute/unmute your audio
- **Camera**: Turn your video on/off
- **Screen Share**: Share your screen
- **Hang Up**: End the call (red button)

### Call History

View all your past calls:

- Filter by status, type, or date
- See call duration
- Join active calls
- View participant lists

### Online Users

See who's currently online:

- Real-time presence updates
- Quick call buttons
- Status indicators (online, in-call, busy, away)

## API Usage

### For Frontend Developers

You can integrate video chat into your Strapi frontend application:

```typescript
import { request } from '@strapi/strapi';

// Create a call
const createCall = async (participantIds: number[]) => {
  const response = await request('/video-chat/calls', {
    method: 'POST',
    body: {
      participantIds,
      callType: 'one-on-one',
      audioOnly: false,
    },
  });

  return response.data;
};

// Join a call
const joinCall = async (callId: number) => {
  const response = await request(`/video-chat/calls/${callId}/join`, {
    method: 'POST',
    body: {
      deviceInfo: {
        browser: navigator.userAgent,
        platform: navigator.platform,
      },
    },
  });

  return response.data;
};

// Update presence
const setOnline = async () => {
  await request('/video-chat/presence', {
    method: 'PATCH',
    body: { status: 'online' },
  });
};

// Get online users
const getOnlineUsers = async () => {
  const response = await request('/video-chat/presence/online', {
    method: 'GET',
  });

  return response.data;
};
```

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';

function VideoCallButton({ userId }: { userId: number }) {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    // Set user online
    fetch('/api/video-chat/presence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'online' }),
    });

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/video-chat/presence/heartbeat', {
        method: 'POST',
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const startCall = async () => {
    // Create call
    const callResponse = await fetch('/api/video-chat/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantIds: [userId],
        callType: 'one-on-one',
      }),
    });

    const { data } = await callResponse.json();
    const { call, inviteLinks } = data;

    // Join call
    const joinResponse = await fetch(`/api/video-chat/calls/${call.id}/join`, {
      method: 'POST',
    });

    const { roomUrl, iframeUrl } = (await joinResponse.json()).data;

    // Open in new window or embed
    window.open(roomUrl, '_blank');
  };

  return <button onClick={startCall}>Start Video Call</button>;
}
```

### Embedding Video Calls

```tsx
function VideoCallFrame({ iframeUrl }: { iframeUrl: string }) {
  return (
    <iframe
      src={iframeUrl}
      allow="camera; microphone; display-capture; autoplay; picture-in-picture"
      allowFullScreen
      style={{ width: '100%', height: '600px', border: 'none' }}
    />
  );
}
```

## REST API Endpoints

### Calls

**POST /api/video-chat/calls**
Create a new call
```json
{
  "participantIds": [2, 3],
  "callType": "group",
  "audioOnly": false
}
```

**GET /api/video-chat/calls**
List all calls (filtered by user)

**GET /api/video-chat/calls/:id**
Get call details

**POST /api/video-chat/calls/:id/join**
Join a call

**POST /api/video-chat/calls/:id/leave**
Leave a call

**POST /api/video-chat/calls/:id/decline**
Decline a call invitation

**POST /api/video-chat/calls/:id/end**
End a call (initiator/admin only)

**DELETE /api/video-chat/calls/:id**
Delete a call (admin only)

### Presence

**GET /api/video-chat/presence**
Get current user's presence

**PATCH /api/video-chat/presence**
Update presence status
```json
{
  "status": "online"
}
```

**GET /api/video-chat/presence/users?userIds=1,2,3**
Get presence for multiple users

**GET /api/video-chat/presence/online**
Get all online users

**POST /api/video-chat/presence/heartbeat**
Send keep-alive signal

### Configuration

**GET /api/video-chat/config**
Get public configuration

**PUT /api/video-chat/config** (admin only)
Update plugin configuration

**GET /api/video-chat/vdo/iframe-config**
Get VDO.Ninja IFRAME API documentation

## VDO.Ninja IFRAME API

### Sending Commands to IFRAME

```javascript
const iframe = document.querySelector('iframe');
const vdoOrigin = new URL(iframeUrl).origin;

// Mute audio
iframe.contentWindow.postMessage(
  { command: 'mute-audio' },
  vdoOrigin
);

// Unmute audio
iframe.contentWindow.postMessage(
  { command: 'unmute-audio' },
  vdoOrigin
);

// Mute video
iframe.contentWindow.postMessage(
  { command: 'mute-video' },
  vdoOrigin
);

// Unmute video
iframe.contentWindow.postMessage(
  { command: 'unmute-video' },
  vdoOrigin
);

// Hang up
iframe.contentWindow.postMessage(
  { command: 'hangup' },
  vdoOrigin
);

// Start screen share
iframe.contentWindow.postMessage(
  { command: 'start-screenshare' },
  vdoOrigin
);

// Stop screen share
iframe.contentWindow.postMessage(
  { command: 'stop-screenshare' },
  vdoOrigin
);
```

### Listening for Events from IFRAME

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== vdoOrigin) return;

  const { action, value } = event.data;

  switch (action) {
    case 'remote-track-added':
      console.log('Remote user joined:', value);
      break;
    case 'remote-track-removed':
      console.log('Remote user left:', value);
      break;
    case 'connection-quality':
      console.log('Connection quality:', value);
      break;
    case 'joined-room':
      console.log('Joined room:', value);
      break;
    case 'left-room':
      console.log('Left room:', value);
      break;
    case 'error':
      console.error('Error:', value);
      break;
  }
});
```

## Best Practices

### Presence Management

Always update user presence when your app loads:

```typescript
// On app load
await setPresence('online');

// Send heartbeat every 30 seconds
setInterval(() => {
  await fetch('/api/video-chat/presence/heartbeat', { method: 'POST' });
}, 30000);

// On app unload
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/video-chat/presence',
    JSON.stringify({ status: 'offline' })
  );
});
```

### Error Handling

Always handle errors gracefully:

```typescript
try {
  const call = await createCall([userId]);
} catch (error) {
  if (error.message.includes('not a participant')) {
    // Handle permission error
  } else if (error.message.includes('ended')) {
    // Handle ended call
  } else {
    // Generic error
  }
}
```

### Call Quality

For best call quality:

1. Use a wired internet connection when possible
2. Close bandwidth-heavy applications
3. Use headphones to prevent echo
4. Ensure good lighting for video
5. Consider using `quality: 2` or `quality: 3` in config

### Security

- Never expose room passwords in URLs
- Use HTTPS for production
- Implement rate limiting for call creation
- Validate user permissions before allowing calls
- Consider implementing call recording audit logs

## Customization

### Custom CSS

Add custom styling to VDO.Ninja interface:

```typescript
// In config/plugins.ts
ui: {
  customCSS: 'https://your-domain.com/vdo-custom.css',
}
```

Example CSS file:
```css
/* Hide VDO.Ninja branding */
.branding {
  display: none !important;
}

/* Custom button colors */
.button {
  background-color: #4945ff !important;
}
```

### Custom Metadata

Store custom data with calls:

```typescript
await createCall({
  participantIds: [2],
  callType: 'one-on-one',
  metadata: {
    purpose: 'Customer Support',
    ticketId: 12345,
    priority: 'high',
  },
});
```

## Troubleshooting

### Call won't start

1. Check browser permissions (camera/mic)
2. Verify HTTPS is being used
3. Check firewall/antivirus settings
4. Try disabling browser extensions

### Poor video quality

1. Check internet speed
2. Lower quality setting
3. Use audio-only mode
4. Configure TURN server

### User shows as offline

1. Check heartbeat is sending
2. Verify presence update on login
3. Check offlineThreshold setting

## Support

For more help:
- [Technical Specification](./TECH_SPEC_VIDEO_CHAT_PLUGIN.md)
- [Installation Guide](./INSTALLATION.md)
- [VDO.Ninja Docs](https://docs.vdo.ninja)
- [GitHub Issues](https://github.com/your-org/strapi-plugin-video-chat/issues)
