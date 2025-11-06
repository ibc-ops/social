# Developer Guide

Complete guide for integrating the Video Chat plugin into your Strapi application.

## Table of Contents

- [Getting Started](#getting-started)
- [Frontend Integration](#frontend-integration)
- [React Components](#react-components)
- [Vue.js Integration](#vuejs-integration)
- [Next.js Integration](#nextjs-integration)
- [Advanced Customization](#advanced-customization)
- [Testing](#testing)
- [Best Practices](#best-practices)

---

## Getting Started

### Plugin Architecture

The plugin provides three integration layers:

1. **REST API** - Backend API for all operations
2. **Admin Panel** - Built-in UI for administrators
3. **Frontend SDK** - Utilities for client-side integration

### Authentication

All API calls require a valid JWT token:

```javascript
// Login to get JWT token
const response = await fetch('http://localhost:1337/api/auth/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password'
  })
});

const { jwt, user } = await response.json();
// Store jwt for subsequent requests
```

---

## Frontend Integration

### Basic Setup

Create an API client for video chat operations:

```typescript
// api/videoChat.ts
const API_BASE = 'http://localhost:1337/api/video-chat';

export class VideoChat API {
  constructor(private jwtToken: string) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwtToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async createCall(participantIds: number[], callType: 'one-on-one' | 'group') {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify({ participantIds, callType }),
    });
  }

  async joinCall(callId: number) {
    return this.request(`/calls/${callId}/join`, {
      method: 'POST',
    });
  }

  async leaveCall(callId: number) {
    return this.request(`/calls/${callId}/leave`, {
      method: 'POST',
    });
  }

  async getCalls() {
    return this.request('/calls');
  }

  async getOnlineUsers() {
    return this.request('/presence/online');
  }

  async updatePresence(status: string) {
    return this.request('/presence', {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async sendHeartbeat() {
    return this.request('/presence/heartbeat', {
      method: 'POST',
    });
  }
}
```

### Usage

```typescript
const api = new VideoChatAPI(jwtToken);

// Create and join a call
const { data } = await api.createCall([2, 3], 'group');
const joinData = await api.joinCall(data.call.id);

// Open video call in new window
window.open(joinData.data.roomUrl, '_blank');
```

---

## React Components

### Video Call Button

```tsx
// components/VideoCallButton.tsx
import React, { useState } from 'react';
import { VideoChatAPI } from '../api/videoChat';

interface VideoCallButtonProps {
  userId: number;
  jwtToken: string;
  className?: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  userId,
  jwtToken,
  className
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCall = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = new VideoChatAPI(jwtToken);

      // Create call
      const { data: callData } = await api.createCall([userId], 'one-on-one');

      // Join call
      const { data: joinData } = await api.joinCall(callData.call.id);

      // Open in new window
      window.open(joinData.roomUrl, '_blank', 'width=1280,height=720');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={startCall}
        disabled={loading}
        className={className}
      >
        {loading ? 'Starting call...' : 'Video Call'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### Embedded Video Interface

```tsx
// components/VideoCallFrame.tsx
import React, { useRef, useEffect, useState } from 'react';

interface VideoCallFrameProps {
  iframeUrl: string;
  onHangup?: () => void;
  onError?: (error: string) => void;
}

export const VideoCallFrame: React.FC<VideoCallFrameProps> = ({
  iframeUrl,
  onHangup,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from VDO.Ninja origin
      const vdoOrigin = new URL(iframeUrl).origin;
      if (event.origin !== vdoOrigin) return;

      const { action, value } = event.data;

      switch (action) {
        case 'left-room':
          onHangup?.();
          break;
        case 'error':
          onError?.(value);
          break;
        case 'remote-track-added':
          console.log('Participant joined');
          break;
        case 'remote-track-removed':
          console.log('Participant left');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeUrl, onHangup, onError]);

  const sendCommand = (command: string) => {
    if (iframeRef.current?.contentWindow) {
      const vdoOrigin = new URL(iframeUrl).origin;
      iframeRef.current.contentWindow.postMessage(
        { command },
        vdoOrigin
      );
    }
  };

  const toggleMute = () => {
    sendCommand(isMuted ? 'unmute-audio' : 'mute-audio');
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    sendCommand(isVideoOff ? 'unmute-video' : 'mute-video');
    setIsVideoOff(!isVideoOff);
  };

  const hangup = () => {
    sendCommand('hangup');
    onHangup?.();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        allow="camera; microphone; display-capture; autoplay; picture-in-picture"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none' }}
      />

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px'
      }}>
        <button onClick={toggleMute}>
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button onClick={toggleVideo}>
          {isVideoOff ? '📹❌' : '📹'}
        </button>
        <button onClick={hangup} style={{ background: 'red' }}>
          📞
        </button>
      </div>
    </div>
  );
};
```

### Presence Hook

```tsx
// hooks/usePresence.ts
import { useState, useEffect } from 'react';
import { VideoChatAPI } from '../api/videoChat';

export function usePresence(jwtToken: string) {
  const [presence, setPresence] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!jwtToken) return;

    const api = new VideoChatAPI(jwtToken);

    // Get initial presence
    api.getMyPresence().then(({ data }) => setPresence(data));

    // Set online
    api.updatePresence('online');

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      api.sendHeartbeat().catch(console.error);
    }, 30000);

    // Get online users every 10 seconds
    const refreshUsers = setInterval(() => {
      api.getOnlineUsers()
        .then(({ data }) => setOnlineUsers(data))
        .catch(console.error);
    }, 10000);

    // Initial load
    api.getOnlineUsers()
      .then(({ data }) => setOnlineUsers(data))
      .catch(console.error);

    // Cleanup
    return () => {
      clearInterval(heartbeat);
      clearInterval(refreshUsers);
      api.updatePresence('offline').catch(console.error);
    };
  }, [jwtToken]);

  return { presence, onlineUsers };
}
```

### Call History Component

```tsx
// components/CallHistory.tsx
import React, { useState, useEffect } from 'react';
import { VideoChatAPI } from '../api/videoChat';

interface CallHistoryProps {
  jwtToken: string;
}

export const CallHistory: React.FC<CallHistoryProps> = ({ jwtToken }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = new VideoChatAPI(jwtToken);
    api.getCalls()
      .then(({ data }) => setCalls(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jwtToken]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Call History</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Status</th>
            <th>Participants</th>
            <th>Duration</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {calls.map(call => (
            <tr key={call.id}>
              <td>{call.callType}</td>
              <td>{call.status}</td>
              <td>{call.participants.length}</td>
              <td>{call.duration ? `${call.duration}s` : '-'}</td>
              <td>{call.startedAt ? new Date(call.startedAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Vue.js Integration

### Composable

```typescript
// composables/useVideoChat.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useVideoChat(jwtToken: string) {
  const presence = ref(null);
  const onlineUsers = ref([]);
  const calls = ref([]);

  const api = {
    async createCall(participantIds: number[], callType: string) {
      const response = await fetch('http://localhost:1337/api/video-chat/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ participantIds, callType })
      });
      return response.json();
    },

    async joinCall(callId: number) {
      const response = await fetch(`http://localhost:1337/api/video-chat/calls/${callId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      return response.json();
    },

    async updatePresence(status: string) {
      const response = await fetch('http://localhost:1337/api/video-chat/presence', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ status })
      });
      return response.json();
    },

    async getOnlineUsers() {
      const response = await fetch('http://localhost:1337/api/video-chat/presence/online', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      const data = await response.json();
      onlineUsers.value = data.data;
    }
  };

  let heartbeatInterval: any;
  let usersInterval: any;

  onMounted(async () => {
    // Set online
    await api.updatePresence('online');

    // Start heartbeat
    heartbeatInterval = setInterval(() => {
      fetch('http://localhost:1337/api/video-chat/presence/heartbeat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
    }, 30000);

    // Refresh online users
    usersInterval = setInterval(() => {
      api.getOnlineUsers();
    }, 10000);

    await api.getOnlineUsers();
  });

  onUnmounted(async () => {
    clearInterval(heartbeatInterval);
    clearInterval(usersInterval);
    await api.updatePresence('offline');
  });

  return {
    presence,
    onlineUsers,
    calls,
    ...api
  };
}
```

### Component

```vue
<!-- components/VideoCallButton.vue -->
<template>
  <div>
    <button @click="startCall" :disabled="loading">
      {{ loading ? 'Starting...' : 'Video Call' }}
    </button>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVideoChat } from '../composables/useVideoChat';

const props = defineProps<{
  userId: number;
  jwtToken: string;
}>();

const { createCall, joinCall } = useVideoChat(props.jwtToken);
const loading = ref(false);
const error = ref<string | null>(null);

const startCall = async () => {
  try {
    loading.value = true;
    error.value = null;

    const { data: callData } = await createCall([props.userId], 'one-on-one');
    const { data: joinData } = await joinCall(callData.call.id);

    window.open(joinData.roomUrl, '_blank', 'width=1280,height=720');
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
```

---

## Next.js Integration

### API Route (Server-side)

```typescript
// pages/api/video-chat/create-call.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { participantIds, callType } = req.body;
  const jwtToken = req.headers.authorization?.replace('Bearer ', '');

  if (!jwtToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch('http://localhost:1337/api/video-chat/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ participantIds, callType })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

### Client Component

```tsx
// components/VideoCall.tsx
'use client';

import { useState } from 'react';

export function VideoCall({ userId }: { userId: number }) {
  const [loading, setLoading] = useState(false);

  const startCall = async () => {
    setLoading(true);

    try {
      // Create call via Next.js API route
      const response = await fetch('/api/video-chat/create-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: [userId],
          callType: 'one-on-one'
        })
      });

      const { data } = await response.json();

      // Join call
      const joinResponse = await fetch(`/api/video-chat/join-call/${data.call.id}`, {
        method: 'POST'
      });

      const joinData = await joinResponse.json();

      // Open video call
      window.open(joinData.data.roomUrl, '_blank');
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={startCall} disabled={loading}>
      {loading ? 'Starting...' : 'Video Call'}
    </button>
  );
}
```

---

## Advanced Customization

### Custom CSS for VDO.Ninja

Create a custom CSS file to style the VDO.Ninja interface:

```css
/* public/vdo-custom.css */

/* Hide VDO.Ninja branding */
.branding {
  display: none !important;
}

/* Custom button colors */
.control-button {
  background-color: #4945ff !important;
  border-radius: 50% !important;
}

.control-button:hover {
  background-color: #3730cc !important;
}

/* Custom video layout */
.video-container {
  border-radius: 12px !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
}

/* Hide specific controls */
#settings-button {
  display: none !important;
}
```

Configure in Strapi:

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      ui: {
        customCSS: 'https://your-domain.com/vdo-custom.css'
      }
    }
  }
};
```

### Custom Metadata

Store custom data with calls:

```typescript
const { data } = await api.createCall(
  [userId],
  'one-on-one',
  false,
  {
    ticketId: '12345',
    department: 'support',
    priority: 'high',
    customerName: 'John Doe'
  }
);

// Access later
console.log(data.call.metadata.ticketId); // '12345'
```

### Event Tracking

Track call events for analytics:

```typescript
const trackEvent = (event: string, data: any) => {
  // Send to your analytics platform
  analytics.track(event, data);
};

// Track call creation
const call = await api.createCall([userId], 'one-on-one');
trackEvent('call_created', {
  callId: call.data.call.id,
  callType: call.data.call.callType,
  participantCount: call.data.participants.length
});

// Track call join
const joinData = await api.joinCall(callId);
trackEvent('call_joined', {
  callId,
  duration: calculateDuration(call.startedAt)
});

// Track call end
await api.leaveCall(callId);
trackEvent('call_ended', {
  callId,
  duration: call.duration
});
```

---

## Testing

### Unit Tests

```typescript
// tests/videoChat.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { VideoChatAPI } from '../api/videoChat';

describe('VideoChatAPI', () => {
  let api: VideoChatAPI;
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    api = new VideoChatAPI(mockToken);
  });

  it('creates a call successfully', async () => {
    const result = await api.createCall([2], 'one-on-one');

    expect(result.data.call).toBeDefined();
    expect(result.data.call.callType).toBe('one-on-one');
    expect(result.data.inviteLinks).toBeDefined();
  });

  it('joins a call successfully', async () => {
    const result = await api.joinCall(1);

    expect(result.data.roomUrl).toBeDefined();
    expect(result.data.iframeUrl).toBeDefined();
    expect(result.data.streamId).toBeDefined();
  });

  it('handles errors correctly', async () => {
    await expect(api.createCall([], 'one-on-one'))
      .rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
import { test, expect } from '@playwright/test';

test('complete call flow', async ({ page, context }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Start a call
  await page.click('[data-testid="video-call-button"]');

  // Wait for call to initialize
  await page.waitForSelector('iframe[src*="vdo.ninja"]');

  // Verify iframe loaded
  const iframe = page.frameLocator('iframe[src*="vdo.ninja"]');
  await expect(iframe.locator('video')).toBeVisible();

  // Test controls
  await page.click('[data-testid="mute-button"]');
  await page.click('[data-testid="video-toggle"]');

  // End call
  await page.click('[data-testid="hangup-button"]');

  // Verify call ended
  await expect(page.locator('[data-testid="call-ended"]')).toBeVisible();
});
```

---

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch blocks:

```typescript
try {
  const call = await api.createCall([userId], 'one-on-one');
} catch (error: any) {
  if (error.message.includes('permission')) {
    showError('You don\'t have permission to call this user');
  } else if (error.message.includes('offline')) {
    showError('User is offline');
  } else {
    showError('Failed to start call. Please try again.');
  }
}
```

### 2. Presence Management

Always update presence when app loads/unloads:

```typescript
// On app mount
await api.updatePresence('online');

// Send heartbeat regularly
setInterval(() => api.sendHeartbeat(), 30000);

// On app unmount
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon(
    'http://localhost:1337/api/video-chat/presence',
    JSON.stringify({ status: 'offline' })
  );
});
```

### 3. Memory Management

Clean up intervals and event listeners:

```typescript
useEffect(() => {
  const heartbeat = setInterval(() => {
    api.sendHeartbeat();
  }, 30000);

  const handleMessage = (event: MessageEvent) => {
    // Handle VDO.Ninja messages
  };

  window.addEventListener('message', handleMessage);

  return () => {
    clearInterval(heartbeat);
    window.removeEventListener('message', handleMessage);
  };
}, []);
```

### 4. Security

Never expose JWT tokens in URLs or logs:

```typescript
// ❌ Bad
console.log('Token:', jwtToken);
window.location.href = `/call?token=${jwtToken}`;

// ✅ Good
sessionStorage.setItem('jwt', jwtToken);
window.location.href = '/call';
```

### 5. User Experience

Provide clear feedback to users:

```typescript
const [status, setStatus] = useState('');

const startCall = async () => {
  setStatus('Creating call...');
  const call = await api.createCall([userId], 'one-on-one');

  setStatus('Joining call...');
  const joinData = await api.joinCall(call.data.call.id);

  setStatus('Connected!');
  window.open(joinData.data.roomUrl, '_blank');
};
```

---

## Next Steps

- **[Examples](./EXAMPLES.md)** - More code examples
- **[API Reference](./API_REFERENCE.md)** - Complete API docs
- **[Architecture](./ARCHITECTURE.md)** - System design
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues
