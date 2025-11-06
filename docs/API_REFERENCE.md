# API Reference

Complete REST API documentation for the Strapi Video Chat Plugin.

## Base URL

All API endpoints are prefixed with:
```
/api/video-chat
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Get your JWT token by authenticating with Strapi's auth endpoints:
```bash
POST /api/auth/local
{
  "identifier": "user@example.com",
  "password": "password"
}
```

---

## Call Endpoints

### Create Call

Create a new video call and invite participants.

**Endpoint:** `POST /api/video-chat/calls`

**Request Body:**
```json
{
  "participantIds": [2, 3, 4],
  "callType": "group",
  "audioOnly": false,
  "metadata": {
    "purpose": "Team Meeting",
    "custom": "any data"
  }
}
```

**Parameters:**
- `participantIds` (array, required): Array of user IDs to invite
- `callType` (string, required): Either `"one-on-one"` or `"group"`
- `audioOnly` (boolean, optional): Set to `true` for audio-only call
- `metadata` (object, optional): Custom data to store with the call

**Response:** `201 Created`
```json
{
  "data": {
    "call": {
      "id": 1,
      "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "roomId": "aBcDeFgHiJkL",
      "callType": "group",
      "status": "pending",
      "initiator": {
        "id": 1,
        "username": "john",
        "email": "john@example.com"
      },
      "participants": [
        {
          "id": 1,
          "username": "john",
          "email": "john@example.com"
        },
        {
          "id": 2,
          "username": "jane",
          "email": "jane@example.com"
        }
      ],
      "startedAt": null,
      "endedAt": null,
      "duration": null,
      "metadata": {
        "password": "auto-generated-password",
        "audioOnly": false,
        "purpose": "Team Meeting"
      },
      "createdAt": "2025-11-06T10:00:00.000Z",
      "updatedAt": "2025-11-06T10:00:00.000Z"
    },
    "participants": [...],
    "inviteLinks": {
      "1": "https://vdo.ninja?room=aBcDeFgHiJkL&push=streamId1&...",
      "2": "https://vdo.ninja?room=aBcDeFgHiJkL&push=streamId2&..."
    }
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions

---

### Get Call

Retrieve details of a specific call.

**Endpoint:** `GET /api/video-chat/calls/:id`

**Parameters:**
- `id` (path parameter): Call ID

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "roomId": "aBcDeFgHiJkL",
    "callType": "one-on-one",
    "status": "active",
    "initiator": {...},
    "participants": [...],
    "startedAt": "2025-11-06T10:05:00.000Z",
    "endedAt": null,
    "duration": null,
    "metadata": {...}
  }
}
```

**Errors:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not a participant of this call
- `404 Not Found`: Call doesn't exist

---

### List Calls

Get all calls for the authenticated user.

**Endpoint:** `GET /api/video-chat/calls`

**Query Parameters:**
- `status` (string, optional): Filter by status (`pending`, `active`, `ended`, `missed`, `declined`)
- `callType` (string, optional): Filter by type (`one-on-one`, `group`)
- `startDate` (ISO string, optional): Filter calls started after this date
- `endDate` (ISO string, optional): Filter calls started before this date

**Example:**
```
GET /api/video-chat/calls?status=active&callType=one-on-one
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "...",
      "callType": "one-on-one",
      "status": "active",
      "participants": [...],
      "startedAt": "2025-11-06T10:00:00.000Z",
      ...
    },
    ...
  ]
}
```

---

### Join Call

Join an existing call.

**Endpoint:** `POST /api/video-chat/calls/:id/join`

**Parameters:**
- `id` (path parameter): Call ID

**Request Body:**
```json
{
  "deviceInfo": {
    "browser": "Chrome",
    "platform": "Windows",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "call": {...},
    "participant": {
      "id": 1,
      "status": "joined",
      "role": "host",
      "streamId": "xyz123",
      "joinedAt": "2025-11-06T10:05:00.000Z"
    },
    "roomUrl": "https://vdo.ninja?room=...&push=xyz123&...",
    "iframeUrl": "https://vdo.ninja?room=...&push=xyz123&cleanoutput=1&...",
    "streamId": "xyz123"
  }
}
```

**Errors:**
- `400 Bad Request`: Call has ended or declined
- `403 Forbidden`: Not invited to this call

---

### Leave Call

Leave an active call.

**Endpoint:** `POST /api/video-chat/calls/:id/leave`

**Parameters:**
- `id` (path parameter): Call ID

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

---

### Decline Call

Decline a call invitation.

**Endpoint:** `POST /api/video-chat/calls/:id/decline`

**Parameters:**
- `id` (path parameter): Call ID

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

---

### End Call

End a call (initiator or admin only).

**Endpoint:** `POST /api/video-chat/calls/:id/end`

**Parameters:**
- `id` (path parameter): Call ID

**Response:** `200 OK`
```json
{
  "data": {
    "success": true,
    "duration": 300
  }
}
```

**Errors:**
- `403 Forbidden`: Only initiator or admin can end calls

---

### Delete Call

Delete a call record (admin only).

**Endpoint:** `DELETE /api/video-chat/calls/:id`

**Parameters:**
- `id` (path parameter): Call ID

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

**Errors:**
- `403 Forbidden`: Admin role required

---

## Presence Endpoints

### Get My Presence

Get the current user's presence status.

**Endpoint:** `GET /api/video-chat/presence`

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "user": {
      "id": 1,
      "username": "john",
      "email": "john@example.com"
    },
    "status": "online",
    "currentCall": null,
    "lastSeenAt": "2025-11-06T10:00:00.000Z",
    "socketId": null,
    "metadata": {
      "browser": "Chrome",
      "platform": "Windows"
    },
    "createdAt": "2025-11-06T09:00:00.000Z",
    "updatedAt": "2025-11-06T10:00:00.000Z"
  }
}
```

---

### Update My Presence

Update the current user's presence status.

**Endpoint:** `PATCH /api/video-chat/presence`

**Request Body:**
```json
{
  "status": "busy",
  "metadata": {
    "reason": "In a meeting",
    "availableAt": "2025-11-06T11:00:00.000Z"
  }
}
```

**Parameters:**
- `status` (string, required): One of `online`, `offline`, `busy`, `away`
- `metadata` (object, optional): Custom presence data

**Response:** `200 OK`
```json
{
  "data": {
    "id": 1,
    "status": "busy",
    "metadata": {...},
    ...
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid status value

---

### Get Users Presence

Get presence for multiple users.

**Endpoint:** `GET /api/video-chat/presence/users?userIds=1,2,3`

**Query Parameters:**
- `userIds` (string, required): Comma-separated list of user IDs

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "john"
      },
      "status": "online",
      "lastSeenAt": "2025-11-06T10:00:00.000Z"
    },
    {
      "id": 2,
      "user": {
        "id": 2,
        "username": "jane"
      },
      "status": "in-call",
      "currentCall": {
        "id": 5,
        "status": "active"
      },
      "lastSeenAt": "2025-11-06T10:00:00.000Z"
    }
  ]
}
```

---

### Get Online Users

Get all currently online users.

**Endpoint:** `GET /api/video-chat/presence/online`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "user": {...},
      "status": "online",
      "lastSeenAt": "2025-11-06T10:00:00.000Z"
    },
    ...
  ]
}
```

---

### Send Heartbeat

Send a keep-alive signal to maintain online status.

**Endpoint:** `POST /api/video-chat/presence/heartbeat`

**Response:** `200 OK`
```json
{
  "data": {
    "success": true
  }
}
```

**Note:** Call this endpoint every 30 seconds to maintain online status.

---

## Configuration Endpoints

### Get Configuration

Get public plugin configuration.

**Endpoint:** `GET /api/video-chat/config`

**Response:** `200 OK`
```json
{
  "data": {
    "vdoNinjaHostUrl": "https://vdo.ninja",
    "maxGroupCallParticipants": 10,
    "enableScreenShare": true,
    "enableChat": true,
    "customCSS": null,
    "iframeApi": {
      "events": [
        "remote-track-added",
        "remote-track-removed",
        "connection-quality",
        "joined-room",
        "left-room",
        "error"
      ],
      "commands": [
        "mute-audio",
        "unmute-audio",
        "mute-video",
        "unmute-video",
        "hangup",
        "start-screenshare",
        "stop-screenshare"
      ],
      "documentation": "https://github.com/steveseguin/vdo.ninja/blob/develop/IFRAME.md"
    }
  }
}
```

---

### Update Configuration

Update plugin configuration (admin only).

**Endpoint:** `PUT /api/video-chat/config`

**Request Body:**
```json
{
  "vdoNinjaHostUrl": "https://your-vdo-ninja.com",
  "maxGroupCallParticipants": 20,
  "enableScreenShare": true,
  "enableChat": false,
  "customCSS": "https://your-domain.com/vdo-custom.css"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "vdoNinjaHostUrl": "https://your-vdo-ninja.com",
    "maxGroupCallParticipants": 20,
    ...
  }
}
```

**Errors:**
- `403 Forbidden`: Admin role required

---

### Get IFRAME API Config

Get VDO.Ninja IFRAME API documentation.

**Endpoint:** `GET /api/video-chat/vdo/iframe-config`

**Response:** `200 OK`
```json
{
  "data": {
    "events": [...],
    "commands": [...],
    "documentation": "..."
  }
}
```

---

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error occurred |

---

## Rate Limiting

The API does not currently implement rate limiting. In production, consider adding rate limiting middleware:

- Call creation: 10 per minute per user
- Heartbeat: 1 per 20 seconds per user
- List endpoints: 60 per minute per user

---

## Webhooks (Future)

Future versions will support webhooks for real-time events:

- `call.created`
- `call.started`
- `call.ended`
- `participant.joined`
- `participant.left`

---

## Code Examples

### JavaScript/Fetch

```javascript
// Create a call
const response = await fetch('http://localhost:1337/api/video-chat/calls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    participantIds: [2],
    callType: 'one-on-one'
  })
});

const data = await response.json();
console.log(data);
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1337/api/video-chat',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Join a call
const { data } = await api.post('/calls/1/join', {
  deviceInfo: {
    browser: navigator.userAgent
  }
});

console.log(data.roomUrl);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function usePresence() {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    // Get initial presence
    fetch('/api/video-chat/presence', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPresence(data.data));

    // Send heartbeat every 30s
    const interval = setInterval(() => {
      fetch('/api/video-chat/presence/heartbeat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return presence;
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "participantIds is required and must be an array",
    "details": {}
  }
}
```

Handle errors appropriately:

```javascript
try {
  const response = await createCall({ participantIds: [2] });
} catch (error) {
  if (error.response?.status === 403) {
    console.error('Permission denied');
  } else if (error.response?.status === 400) {
    console.error('Invalid request:', error.response.data.error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Next Steps

- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Integration tutorials
- **[Examples](./EXAMPLES.md)** - Complete code examples
- **[Architecture](./ARCHITECTURE.md)** - Understand the system design
