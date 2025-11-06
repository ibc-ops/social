# Examples & Tutorials

Practical code examples for integrating the Video Chat plugin.

## Table of Contents

- [Basic Examples](#basic-examples)
- [React Examples](#react-examples)
- [Vue.js Examples](#vuejs-examples)
- [Advanced Examples](#advanced-examples)
- [Full Applications](#full-applications)

---

## Basic Examples

### Example 1: Simple Call Button

The simplest possible implementation:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Video Call Example</title>
</head>
<body>
    <button id="callButton">Start Video Call</button>

    <script>
        const JWT_TOKEN = 'your-jwt-token';
        const RECIPIENT_ID = 2;

        document.getElementById('callButton').addEventListener('click', async () => {
            try {
                // Create call
                const response = await fetch('http://localhost:1337/api/video-chat/calls', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${JWT_TOKEN}`
                    },
                    body: JSON.stringify({
                        participantIds: [RECIPIENT_ID],
                        callType: 'one-on-one'
                    })
                });

                const { data } = await response.json();

                // Join call
                const joinResponse = await fetch(
                    `http://localhost:1337/api/video-chat/calls/${data.call.id}/join`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
                    }
                );

                const joinData = await joinResponse.json();

                // Open video call in new window
                window.open(joinData.data.roomUrl, '_blank', 'width=1280,height=720');
            } catch (error) {
                console.error('Failed to start call:', error);
                alert('Failed to start call');
            }
        });
    </script>
</body>
</html>
```

---

### Example 2: Embedded Video Interface

Embed video directly on your page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Embedded Video Call</title>
    <style>
        #videoContainer {
            width: 100%;
            height: 600px;
            position: relative;
        }
        #videoFrame {
            width: 100%;
            height: 100%;
            border: none;
        }
        #controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        button {
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 24px;
            border: none;
            cursor: pointer;
            background: #333;
            color: white;
        }
        button:hover {
            background: #555;
        }
        .hangup {
            background: #d32f2f;
        }
        .hangup:hover {
            background: #b71c1c;
        }
    </style>
</head>
<body>
    <h1>Video Call</h1>
    <div id="videoContainer">
        <iframe id="videoFrame" allow="camera; microphone; display-capture"></iframe>
        <div id="controls">
            <button id="muteBtn">Mute</button>
            <button id="videoBtn">Stop Video</button>
            <button id="shareBtn">Share Screen</button>
            <button id="hangupBtn" class="hangup">Hang Up</button>
        </div>
    </div>

    <script>
        const JWT_TOKEN = 'your-jwt-token';
        const CALL_ID = 1;

        let iframeOrigin;
        let isMuted = false;
        let isVideoOff = false;

        async function startCall() {
            try {
                // Join call
                const response = await fetch(
                    `http://localhost:1337/api/video-chat/calls/${CALL_ID}/join`,
                    {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
                    }
                );

                const { data } = await response.json();

                // Load iframe
                const iframe = document.getElementById('videoFrame');
                iframe.src = data.iframeUrl;
                iframeOrigin = new URL(data.iframeUrl).origin;

                // Listen for messages from VDO.Ninja
                window.addEventListener('message', handleIframeMessage);
            } catch (error) {
                console.error('Failed to join call:', error);
            }
        }

        function handleIframeMessage(event) {
            if (event.origin !== iframeOrigin) return;

            const { action, value } = event.data;
            console.log('VDO.Ninja event:', action, value);

            switch (action) {
                case 'left-room':
                    console.log('Call ended');
                    window.location.reload();
                    break;
                case 'error':
                    console.error('VDO.Ninja error:', value);
                    break;
            }
        }

        function sendCommand(command) {
            const iframe = document.getElementById('videoFrame');
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage({ command }, iframeOrigin);
            }
        }

        // Control buttons
        document.getElementById('muteBtn').addEventListener('click', () => {
            isMuted = !isMuted;
            sendCommand(isMuted ? 'mute-audio' : 'unmute-audio');
            document.getElementById('muteBtn').textContent = isMuted ? 'Unmute' : 'Mute';
        });

        document.getElementById('videoBtn').addEventListener('click', () => {
            isVideoOff = !isVideoOff;
            sendCommand(isVideoOff ? 'mute-video' : 'unmute-video');
            document.getElementById('videoBtn').textContent =
                isVideoOff ? 'Start Video' : 'Stop Video';
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            sendCommand('start-screenshare');
        });

        document.getElementById('hangupBtn').addEventListener('click', async () => {
            sendCommand('hangup');

            // Leave call on server
            await fetch(`http://localhost:1337/api/video-chat/calls/${CALL_ID}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
            });

            window.location.reload();
        });

        // Start call when page loads
        startCall();
    </script>
</body>
</html>
```

---

## React Examples

### Example 3: React Video Call Component

Complete React component with hooks:

```typescript
// VideoCallApp.tsx
import React, { useState, useEffect } from 'react';
import { VideoChatAPI } from './api/videoChat';
import { VideoCallButton } from './components/VideoCallButton';
import { VideoCallFrame } from './components/VideoCallFrame';
import { OnlineUsers } from './components/OnlineUsers';

interface User {
  id: number;
  username: string;
}

export const VideoCallApp: React.FC<{ jwtToken: string; currentUser: User }> = ({
  jwtToken,
  currentUser
}) => {
  const [activeCall, setActiveCall] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const api = new VideoChatAPI(jwtToken);

  useEffect(() => {
    // Set online
    api.updatePresence('online');

    // Heartbeat
    const heartbeat = setInterval(() => {
      api.sendHeartbeat();
    }, 30000);

    // Load online users
    loadOnlineUsers();
    const usersInterval = setInterval(loadOnlineUsers, 10000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(usersInterval);
      api.updatePresence('offline');
    };
  }, []);

  const loadOnlineUsers = async () => {
    try {
      const { data } = await api.getOnlineUsers();
      setOnlineUsers(data.map((p: any) => p.user));
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  const handleStartCall = async (userId: number) => {
    try {
      const { data: callData } = await api.createCall([userId], 'one-on-one');
      const { data: joinData } = await api.joinCall(callData.call.id);

      setActiveCall({
        id: callData.call.id,
        iframeUrl: joinData.iframeUrl,
        participants: callData.call.participants
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Failed to start call');
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;

    try {
      await api.leaveCall(activeCall.id);
      setActiveCall(null);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  if (activeCall) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Video Call</h1>
        <VideoCallFrame
          iframeUrl={activeCall.iframeUrl}
          onHangup={handleEndCall}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Video Chat</h1>
      <OnlineUsers
        users={onlineUsers.filter(u => u.id !== currentUser.id)}
        onCallUser={handleStartCall}
      />
    </div>
  );
};
```

```typescript
// components/OnlineUsers.tsx
import React from 'react';

interface User {
  id: number;
  username: string;
}

interface OnlineUsersProps {
  users: User[];
  onCallUser: (userId: number) => void;
}

export const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, onCallUser }) => {
  return (
    <div>
      <h2>Online Users ({users.length})</h2>
      {users.length === 0 ? (
        <p>No users online</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(user => (
            <li key={user.id} style={{
              padding: '10px',
              margin: '5px 0',
              background: '#f5f5f5',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4caf50',
                  marginRight: '8px'
                }}></span>
                {user.username}
              </span>
              <button
                onClick={() => onCallUser(user.id)}
                style={{
                  padding: '6px 12px',
                  background: '#4945ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📹 Call
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

### Example 4: React Hook for Video Chat

Reusable React hook:

```typescript
// hooks/useVideoChat.ts
import { useState, useEffect, useCallback } from 'react';
import { VideoChatAPI } from '../api/videoChat';

export function useVideoChat(jwtToken: string) {
  const [api] = useState(() => new VideoChatAPI(jwtToken));
  const [presence, setPresence] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize
    api.updatePresence('online');
    loadOnlineUsers();
    loadCalls();

    // Heartbeat
    const heartbeat = setInterval(() => {
      api.sendHeartbeat().catch(console.error);
    }, 30000);

    // Refresh online users
    const refresh = setInterval(loadOnlineUsers, 10000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(refresh);
      api.updatePresence('offline').catch(console.error);
    };
  }, [jwtToken]);

  const loadOnlineUsers = useCallback(async () => {
    try {
      const { data } = await api.getOnlineUsers();
      setOnlineUsers(data);
    } catch (err: any) {
      console.error('Failed to load online users:', err);
    }
  }, [api]);

  const loadCalls = useCallback(async () => {
    try {
      const { data } = await api.getCalls();
      setCalls(data);
    } catch (err: any) {
      console.error('Failed to load calls:', err);
    }
  }, [api]);

  const createCall = useCallback(async (
    participantIds: number[],
    callType: 'one-on-one' | 'group',
    options?: { audioOnly?: boolean }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.createCall(
        participantIds,
        callType,
        options?.audioOnly
      );
      await loadCalls();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, loadCalls]);

  const joinCall = useCallback(async (callId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.joinCall(callId);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const leaveCall = useCallback(async (callId: number) => {
    setLoading(true);
    setError(null);

    try {
      await api.leaveCall(callId);
      await loadCalls();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, loadCalls]);

  return {
    presence,
    onlineUsers,
    calls,
    loading,
    error,
    createCall,
    joinCall,
    leaveCall,
    refreshCalls: loadCalls,
    refreshUsers: loadOnlineUsers
  };
}

// Usage
function MyComponent() {
  const { onlineUsers, createCall, joinCall } = useVideoChat(jwtToken);

  const handleCall = async (userId: number) => {
    const callData = await createCall([userId], 'one-on-one');
    const joinData = await joinCall(callData.call.id);
    window.open(joinData.roomUrl, '_blank');
  };

  return (
    <div>
      {onlineUsers.map(user => (
        <button key={user.id} onClick={() => handleCall(user.id)}>
          Call {user.user.username}
        </button>
      ))}
    </div>
  );
}
```

---

## Vue.js Examples

### Example 5: Vue 3 Composition API

```vue
<!-- VideoCall.vue -->
<template>
  <div class="video-call-app">
    <div v-if="activeCall" class="call-active">
      <h2>Video Call</h2>
      <div class="video-container">
        <iframe
          ref="videoFrame"
          :src="activeCall.iframeUrl"
          allow="camera; microphone; display-capture"
          allowfullscreen
        />
        <div class="controls">
          <button @click="toggleMute">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
          <button @click="toggleVideo">{{ isVideoOff ? 'Start Video' : 'Stop Video' }}</button>
          <button @click="hangup" class="danger">Hang Up</button>
        </div>
      </div>
    </div>

    <div v-else class="call-inactive">
      <h2>Online Users</h2>
      <div v-if="onlineUsers.length === 0">
        <p>No users online</p>
      </div>
      <ul v-else class="user-list">
        <li v-for="user in onlineUsers" :key="user.id">
          <span class="status-indicator"></span>
          <span>{{ user.user.username }}</span>
          <button @click="startCall(user.user.id)">Call</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useVideoChat } from '../composables/useVideoChat';

const props = defineProps<{
  jwtToken: string;
}>();

const videoFrame = ref<HTMLIFrameElement | null>(null);
const activeCall = ref<any>(null);
const isMuted = ref(false);
const isVideoOff = ref(false);

const { onlineUsers, createCall, joinCall, leaveCall } = useVideoChat(props.jwtToken);

const startCall = async (userId: number) => {
  try {
    const callData = await createCall([userId], 'one-on-one');
    const joinData = await joinCall(callData.call.id);

    activeCall.value = {
      id: callData.call.id,
      iframeUrl: joinData.iframeUrl
    };
  } catch (error) {
    console.error('Failed to start call:', error);
    alert('Failed to start call');
  }
};

const hangup = async () => {
  if (!activeCall.value) return;

  try {
    await leaveCall(activeCall.value.id);
    activeCall.value = null;
    isMuted.value = false;
    isVideoOff.value = false;
  } catch (error) {
    console.error('Failed to end call:', error);
  }
};

const sendCommand = (command: string) => {
  if (videoFrame.value?.contentWindow && activeCall.value) {
    const origin = new URL(activeCall.value.iframeUrl).origin;
    videoFrame.value.contentWindow.postMessage({ command }, origin);
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  sendCommand(isMuted.value ? 'mute-audio' : 'unmute-audio');
};

const toggleVideo = () => {
  isVideoOff.value = !isVideoOff.value;
  sendCommand(isVideoOff.value ? 'mute-video' : 'unmute-video');
};
</script>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  height: 600px;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  background: #333;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #555;
}

button.danger {
  background: #d32f2f;
}

button.danger:hover {
  background: #b71c1c;
}

.user-list {
  list-style: none;
  padding: 0;
}

.user-list li {
  padding: 10px;
  margin: 5px 0;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
  margin-right: 8px;
}
</style>
```

---

## Advanced Examples

### Example 6: Call with Custom Metadata

Track custom data with calls:

```typescript
// Customer support call
const startSupportCall = async (customerId: number, ticketId: string) => {
  const { data } = await api.createCall(
    [customerId],
    'one-on-one',
    false,
    {
      type: 'customer-support',
      ticketId,
      priority: 'high',
      department: 'technical-support',
      startedBy: 'agent',
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    }
  );

  // Store ticket reference
  await updateTicket(ticketId, {
    callId: data.call.id,
    status: 'in-call'
  });

  return data;
};

// Sales call
const startSalesCall = async (leadId: number, productId: string) => {
  const { data } = await api.createCall(
    [leadId],
    'one-on-one',
    false,
    {
      type: 'sales-demo',
      productId,
      leadScore: 85,
      demoScript: 'script-v2',
      followUpDate: '2025-11-10'
    }
  );

  return data;
};
```

---

### Example 7: Group Call Manager

Manage group calls with dynamic participants:

```typescript
class GroupCallManager {
  private api: VideoChatAPI;
  private callId: number | null = null;

  constructor(jwtToken: string) {
    this.api = new VideoChatAPI(jwtToken);
  }

  async createGroupCall(initialParticipants: number[], topic: string) {
    const { data } = await this.api.createCall(
      initialParticipants,
      'group',
      false,
      { topic, maxParticipants: 10 }
    );

    this.callId = data.call.id;
    return data;
  }

  async inviteParticipant(userId: number) {
    if (!this.callId) throw new Error('No active call');

    // Add to call (custom endpoint - you'd need to implement this)
    await fetch(`http://localhost:1337/api/video-chat/calls/${this.callId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.api.jwtToken}`
      },
      body: JSON.stringify({ userId })
    });
  }

  async removeParticipant(userId: number) {
    // Custom implementation
  }

  async getParticipants() {
    if (!this.callId) return [];

    const { data } = await this.api.getCall(this.callId);
    return data.participants;
  }

  async endForAll() {
    if (!this.callId) return;

    await this.api.endCall(this.callId);
    this.callId = null;
  }
}

// Usage
const manager = new GroupCallManager(jwtToken);
const call = await manager.createGroupCall([2, 3, 4], 'Team Standup');
await manager.inviteParticipant(5); // Add another participant mid-call
```

---

## Full Applications

### Example 8: Complete Video Chat App

See the `/examples` folder in the repository for complete applications:

- **React Video Chat App**: Full-featured React application
- **Vue 3 Video Chat App**: Complete Vue.js implementation
- **Next.js Integration**: Server-side rendering example
- **Mobile App (React Native)**: Coming in v1.1

Clone and run:

```bash
git clone https://github.com/your-org/strapi-plugin-video-chat-examples
cd strapi-plugin-video-chat-examples/react-app
npm install
npm start
```

---

## Next Steps

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Integration guide
- **[Architecture](./ARCHITECTURE.md)** - Understand the system design
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues

---

## Contributing Examples

Have a great example? Submit a pull request!

1. Fork the repository
2. Add your example to `/examples`
3. Include README with setup instructions
4. Submit PR with description

We especially welcome:
- Framework integrations (Angular, Svelte, etc.)
- Use case examples (telemedicine, education, etc.)
- Advanced features (recording, transcription, etc.)
