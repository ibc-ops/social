# Architecture Overview

Detailed architecture documentation for the Strapi Video Chat Plugin.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Database Design](#database-design)
- [VDO.Ninja Integration](#vdoninja-integration)
- [Security Architecture](#security-architecture)
- [Scalability](#scalability)

---

## System Overview

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Client Applications                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Browser    │  │  React App   │  │  Mobile App       │  │
│  │   (Admin)    │  │  (Frontend)  │  │  (Future)         │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
└─────────┼──────────────────┼───────────────────┼──────────────┘
          │                  │                   │
          │   HTTPS/REST API │                   │
          └──────────────────┼───────────────────┘
                             │
          ┌──────────────────▼────────────────────┐
          │        Strapi V5 Application          │
          │  ┌─────────────────────────────────┐  │
          │  │   Video Chat Plugin             │  │
          │  │  ┌───────────┐  ┌─────────────┐│  │
          │  │  │Controllers│  │  Services   ││  │
          │  │  ├───────────┤  ├─────────────┤│  │
          │  │  │   Routes  │  │   Models    ││  │
          │  │  └───────────┘  └─────────────┘│  │
          │  └─────────────────────────────────┘  │
          │  ┌─────────────────────────────────┐  │
          │  │        Database Layer           │  │
          │  │   (PostgreSQL/MySQL/SQLite)     │  │
          │  └─────────────────────────────────┘  │
          └──────────────────┬────────────────────┘
                             │
          ┌──────────────────▼────────────────────┐
          │       VDO.Ninja (WebRTC Layer)        │
          │   ┌──────────────────────────────┐    │
          │   │   Handshake Server (Free)    │    │
          │   │   • Peer Discovery           │    │
          │   │   • ICE Negotiation          │    │
          │   │   • Room Management          │    │
          │   └──────────────────────────────┘    │
          └───────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         ┌────▼────┐                   ┌────▼────┐
         │ Peer A  │◄─────P2P WebRTC──►│ Peer B  │
         │ Browser │     (95% Direct)  │ Browser │
         └─────────┘                   └─────────┘
              │                             │
              └──────────TURN Server────────┘
                    (5% Relay Fallback)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | Admin UI components |
| **UI Framework** | Strapi Design System | Consistent UI/UX |
| **Backend** | Strapi V5 | CMS and API platform |
| **Language** | TypeScript | Type-safe development |
| **Database** | PostgreSQL/MySQL/SQLite | Data persistence |
| **WebRTC** | VDO.Ninja | Video/audio streaming |
| **Signaling** | REST API + Polling | Application-level events |

---

## Component Architecture

### Backend Components

#### 1. Content Types (Data Models)

**Call**
```typescript
{
  id: number
  uuid: string              // Unique identifier
  roomId: string            // VDO.Ninja room ID
  callType: enum            // one-on-one | group
  status: enum              // pending | active | ended | missed | declined
  initiator: User           // User who started call
  participants: User[]      // All participants
  startedAt: DateTime?
  endedAt: DateTime?
  duration: number?         // Seconds
  metadata: JSON           // Custom data
}
```

**CallParticipant**
```typescript
{
  id: number
  call: Call
  user: User
  joinedAt: DateTime?
  leftAt: DateTime?
  status: enum             // invited | joined | left | declined
  role: enum               // host | participant
  streamId: string?        // VDO.Ninja stream ID
  deviceInfo: JSON?
}
```

**UserPresence**
```typescript
{
  id: number
  user: User
  status: enum             // online | offline | in-call | busy | away
  currentCall: Call?
  lastSeenAt: DateTime
  socketId: string?
  metadata: JSON?
}
```

#### 2. Services

**VDO.Ninja Service**
- Room ID generation
- Stream ID generation
- URL building with parameters
- IFRAME API configuration
- Password generation

**Call Service**
- Create, read, update, delete calls
- Join/leave/decline operations
- Participant management
- Call state transitions
- Duration calculation

**Presence Service**
- Get/set user status
- Heartbeat management
- Online users tracking
- Stale presence cleanup
- Metadata management

#### 3. Controllers

**Call Controller**
- HTTP request handling
- Input validation
- Permission checks
- Response formatting
- Error handling

**Presence Controller**
- Status updates
- Heartbeat endpoint
- Online users query
- Presence retrieval

**Config Controller**
- Plugin configuration
- Settings management
- IFRAME API info

#### 4. Routes

RESTful API routing:
- `/calls` - Call management
- `/presence` - Presence operations
- `/config` - Configuration

### Frontend Components

#### Admin Panel Components

**HomePage**
- Main entry point
- Tab navigation
- Call management
- Heartbeat logic

**VideoCallInterface**
- IFRAME embedding
- Control buttons
- Event handling
- Command sending

**CallHistory**
- List past calls
- Filter and sort
- Join active calls
- Display metadata

**OnlineUsers**
- Show online users
- Real-time updates
- Quick call actions
- Status indicators

**CallInitiator**
- Modal dialog
- User selection
- Call type choice
- Audio/video toggle

---

## Data Flow

### Creating and Joining a Call

```
User A (Initiator)                    Backend                      VDO.Ninja                    User B
     │                                    │                            │                           │
     ├─1. POST /calls ───────────────────►│                            │                           │
     │   {participantIds: [userB]}        │                            │                           │
     │                                    ├─2. Generate roomId         │                           │
     │                                    ├─3. Generate passwords      │                           │
     │                                    ├─4. Create Call record      │                           │
     │                                    ├─5. Create Participants     │                           │
     │                                    │                            │                           │
     │◄─6. Return call + inviteLinks ────┤                            │                           │
     │   {call, inviteLinks}              │                            │                           │
     │                                    │                            │                           │
     ├─7. POST /calls/1/join ────────────►│                            │                           │
     │                                    ├─8. Generate streamId       │                           │
     │                                    ├─9. Update participant      │                           │
     │                                    ├─10. Build VDO URL          │                           │
     │                                    │                            │                           │
     │◄─11. Return roomUrl + iframeUrl ──┤                            │                           │
     │                                    │                            │                           │
     ├─12. Load IFRAME ───────────────────┼────────────────────────────►│                          │
     │    with roomUrl                    │                            ├─13. Join room             │
     │                                    │                            ├─14. Setup ICE/STUN        │
     │                                    │                            │                           │
     │                                    │                            │                           │
     │                      [User B receives notification]             │                           │
     │                                    │                            │                           │
     │                                    │◄─15. POST /calls/1/join ───┤                           │
     │                                    ├─16. Generate streamId      │                           │
     │                                    ├─17. Return roomUrl ────────►│                          │
     │                                    │                            │                           │
     │                                    │                            │◄─18. Load IFRAME ─────────┤
     │                                    │                            ├─19. Join room             │
     │                                    │                            │                           │
     │◄────────────────20. P2P WebRTC Connection Established ──────────────────────────────────────►│
     │                                    │                            │                           │
     │                    [Video/Audio streaming directly peer-to-peer]                            │
     │◄────────────────────────────────────────────────────────────────────────────────────────────►│
```

### Presence System Flow

```
Client                          Backend                       Database
  │                               │                              │
  ├─1. App Loads                  │                              │
  ├─2. PATCH /presence ──────────►│                              │
  │   {status: "online"}          ├─3. Update presence ─────────►│
  │                               │◄─4. Confirm ────────────────┤
  │◄─5. Success ───────────────────┤                              │
  │                               │                              │
  ├─6. Start heartbeat timer      │                              │
  │   (every 30s)                 │                              │
  │                               │                              │
  ├─7. POST /heartbeat ───────────►│                              │
  │   (every 30s)                 ├─8. Update lastSeenAt ───────►│
  │◄─9. Success ───────────────────┤                              │
  │                               │                              │
  │   [User starts call]          │                              │
  │                               │                              │
  ├─10. Call started              │                              │
  │    (automatically)            ├─11. Update status ──────────►│
  │                               │    to "in-call"               │
  │                               │                              │
  │   [User ends call]            │                              │
  │                               │                              │
  ├─12. Call ended                │                              │
  │    (automatically)            ├─13. Update status ──────────►│
  │                               │    to "online"                │
  │                               │                              │
  ├─14. App Unloads               │                              │
  ├─15. PATCH /presence ──────────►│                              │
  │   {status: "offline"}         ├─16. Update presence ────────►│
  │                               │                              │
  │                               │                              │
  │   [Background cleanup]        │                              │
  │                               ├─17. cleanupStalePresences()  │
  │                               │    (every 60s)               │
  │                               ├─18. Find stale ─────────────►│
  │                               ├─19. Mark offline ───────────►│
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
│  (Strapi Core)  │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────▼──────────────┐
    │   UserPresence    │◄──────┐
    ├───────────────────┤       │
    │ id                │       │
    │ user_id (FK)      │       │
    │ status            │       │
    │ current_call_id   │       │
    │ last_seen_at      │       │
    │ socket_id         │       │
    │ metadata          │       │
    └───────────────────┘       │
                                │
                                │ N:1
                                │
         ┌──────────────────────┤
         │                      │
    ┌────▼──────────────┐       │
    │       Call        │───────┘
    ├───────────────────┤
    │ id                │
    │ uuid              │
    │ room_id           │
    │ call_type         │
    │ status            │
    │ initiator_id (FK) │───┐
    │ started_at        │   │
    │ ended_at          │   │
    │ duration          │   │
    │ metadata          │   │
    └────┬──────────────┘   │
         │                  │
         │ 1:N              │ N:1
         │                  │
    ┌────▼──────────────┐   │
    │ CallParticipant   │   │
    ├───────────────────┤   │
    │ id                │   │
    │ call_id (FK)      │───┘
    │ user_id (FK)      │───┐
    │ joined_at         │   │
    │ left_at           │   │
    │ status            │   │
    │ role              │   │
    │ stream_id         │   │
    │ device_info       │   │
    └───────────────────┘   │
                            │
                            │ N:1
                            │
                       ┌────▼────┐
                       │  User   │
                       └─────────┘
```

### Indexes

Performance-critical indexes:

```sql
-- Calls
CREATE INDEX idx_call_status ON video_chat_calls(status);
CREATE INDEX idx_call_initiator ON video_chat_calls(initiator_id);
CREATE INDEX idx_call_dates ON video_chat_calls(started_at, ended_at);
CREATE INDEX idx_call_type_status ON video_chat_calls(call_type, status);

-- Call Participants
CREATE INDEX idx_participant_call ON video_chat_call_participants(call_id);
CREATE INDEX idx_participant_user ON video_chat_call_participants(user_id);
CREATE INDEX idx_participant_status ON video_chat_call_participants(status);

-- User Presence
CREATE INDEX idx_presence_user ON video_chat_user_presences(user_id);
CREATE INDEX idx_presence_status ON video_chat_user_presences(status);
CREATE INDEX idx_presence_last_seen ON video_chat_user_presences(last_seen_at);
CREATE INDEX idx_presence_current_call ON video_chat_user_presences(current_call_id);
```

---

## VDO.Ninja Integration

### Architecture

VDO.Ninja provides the WebRTC layer:

```
Plugin Backend              VDO.Ninja Service           Browser (Peer)
     │                            │                          │
     ├─1. Generate roomId         │                          │
     ├─2. Generate streamId       │                          │
     ├─3. Build URL with params   │                          │
     │   ?room=ABC&push=XYZ&      │                          │
     │    quality=2&codec=vp9     │                          │
     │                            │                          │
     │                            │◄─4. Load IFRAME URL ─────┤
     │                            ├─5. Connect to handshake  │
     │                            │   server                 │
     │                            ├─6. Discover peers        │
     │                            ├─7. Exchange SDP          │
     │                            ├─8. Establish ICE         │
     │                            ├─9. Test STUN/TURN        │
     │                            │                          │
     │                            │◄─10. Send IFRAME messages─┤
     │                            │    {command: "mute-audio"}│
     │                            │                          │
     │                            ├─11. Send events ─────────►│
     │                            │    {action: "joined-room"}│
     │                            │                          │
     │                            │    [P2P Connection]      │
     │                            │◄─────────────────────────►│
```

### URL Parameters

The plugin generates VDO.Ninja URLs with these parameters:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `room` | Room identifier | `room=aBcDeFgH` |
| `push` | Stream ID for publishing | `push=xyz123` |
| `view` | Stream ID for viewing | `view=abc456` |
| `quality` | Video quality (0-3) | `quality=2` |
| `codec` | Video codec | `codec=vp9` |
| `cleanoutput` | Minimal UI for embedding | `cleanoutput=1` |
| `label` | User display name | `label=John` |
| `password` | Room password | `password=secret` |

### IFRAME API

Bidirectional communication with VDO.Ninja:

**Commands (Plugin → VDO.Ninja):**
```javascript
iframe.contentWindow.postMessage(
  { command: 'mute-audio' },
  'https://vdo.ninja'
);
```

**Events (VDO.Ninja → Plugin):**
```javascript
window.addEventListener('message', (event) => {
  const { action, value } = event.data;
  // action: 'remote-track-added', 'joined-room', etc.
});
```

---

## Security Architecture

### Authentication & Authorization

```
Request → JWT Validation → Role Check → Permission Check → Controller
  │             │              │              │               │
  401         Valid?        Has Role?    Has Permission?    Execute
Unauthorized    ↓              ↓              ↓               ↓
              Pass          Pass            Pass          Success
```

### Data Flow Security

1. **HTTPS Only**: All communication encrypted
2. **JWT Tokens**: Secure authentication
3. **Role-Based Access**: Strapi RBAC
4. **Room Passwords**: VDO.Ninja room security
5. **Stream IDs**: Unique per participant
6. **WebRTC Encryption**: Native DTLS-SRTP

### Security Layers

| Layer | Mechanism | Protection |
|-------|-----------|------------|
| **Transport** | HTTPS/WSS | Man-in-the-middle attacks |
| **Authentication** | JWT | Identity verification |
| **Authorization** | RBAC | Permission enforcement |
| **Room Security** | Passwords | Unauthorized access |
| **Stream Security** | Unique IDs | Stream hijacking |
| **WebRTC** | DTLS-SRTP | Media encryption |

---

## Scalability

### Horizontal Scaling

```
                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │Strapi 1 │     │Strapi 2 │    │Strapi 3 │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────▼──────┐
                  │  Database   │
                  │  (Primary)  │
                  └──────┬──────┘
                         │
                  ┌──────▼──────┐
                  │  Database   │
                  │  (Replicas) │
                  └─────────────┘
```

### Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **API Response Time** | <200ms | CRUD operations |
| **Call Setup Time** | <3s | Room creation to join |
| **P2P Success Rate** | >90% | Direct connections |
| **Concurrent Calls** | Unlimited* | *P2P architecture |
| **Max Group Size** | 10 (default) | Configurable |
| **Database Queries** | <10 per request | Optimized with indexes |

### Bottlenecks & Solutions

1. **Database**: Add read replicas, implement caching
2. **API**: Load balance Strapi instances
3. **Presence Updates**: Use Redis for real-time data
4. **Call History**: Archive old calls, implement pagination

### Caching Strategy

```typescript
// Example Redis caching for presence
const getOnlineUsers = async () => {
  const cached = await redis.get('online_users');
  if (cached) return JSON.parse(cached);

  const users = await db.findOnlineUsers();
  await redis.setex('online_users', 10, JSON.stringify(users));
  return users;
};
```

---

## Monitoring & Observability

### Metrics to Track

**Application Metrics:**
- API response times
- Error rates
- Active calls count
- Online users count
- Call success rate

**Business Metrics:**
- Daily active users
- Total calls per day
- Average call duration
- Call completion rate
- User engagement

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Database connections
- Network bandwidth

### Logging

```typescript
// Example structured logging
strapi.log.info('Call created', {
  callId: call.id,
  callType: call.callType,
  initiatorId: call.initiator.id,
  participantCount: call.participants.length,
  timestamp: new Date().toISOString()
});
```

---

## Future Architecture Enhancements

### Phase 2 Features

1. **Real-time Signaling**: Add Socket.io for instant notifications
2. **Call Recording**: Integrate cloud storage for recordings
3. **Load Balancing**: Redis adapter for multi-server presence
4. **Caching Layer**: Redis for frequently accessed data
5. **Message Queue**: Bull/BullMQ for async operations

### Proposed Architecture (v2.0)

```
                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │Strapi 1 │     │Strapi 2 │    │Strapi 3 │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         ├───────────────┼───────────────┤
         │          ┌────▼────┐          │
         │          │  Redis  │          │
         │          │(Presence)          │
         │          └─────────┘          │
         │          ┌─────────┐          │
         └──────────┤Socket.io├──────────┘
                    │ Cluster │
                    └─────────┘
```

---

## Conclusion

This architecture provides:
- ✅ Scalable design with P2P WebRTC
- ✅ Clean separation of concerns
- ✅ RESTful API design
- ✅ Secure by default
- ✅ Easy to extend and customize
- ✅ Production-ready foundation

For implementation details, see:
- [API Reference](./API_REFERENCE.md)
- [Security Guide](./SECURITY.md)
- [Performance Guide](./PERFORMANCE.md)
