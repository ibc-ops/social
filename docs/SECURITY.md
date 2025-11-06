# Security Guide

Complete security documentation for the Strapi Video Chat Plugin.

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Permissions](#permissions)
- [Call Security](#call-security)
- [Data Privacy](#data-privacy)
- [Best Practices](#best-practices)
- [Compliance](#compliance)
- [Security Checklist](#security-checklist)

---

## Security Overview

The Video Chat plugin implements multiple security layers:

```
User Request
    │
    ├─► HTTPS/TLS Encryption
    ├─► JWT Authentication
    ├─► Role-Based Access Control (RBAC)
    ├─► Permission Checks
    ├─► Room Password Protection
    ├─► Unique Stream IDs
    └─► WebRTC End-to-End Encryption (DTLS-SRTP)
```

### Security Principles

1. **Defense in Depth**: Multiple security layers
2. **Principle of Least Privilege**: Minimal permissions by default
3. **Secure by Default**: Security enabled out of the box
4. **Data Minimization**: Store only necessary data
5. **Encryption Everywhere**: HTTPS and WebRTC encryption

---

## Authentication & Authorization

### JWT Authentication

All API endpoints require valid JWT authentication:

```typescript
// Headers required for all requests
{
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
}
```

**Getting a JWT Token:**

```javascript
const response = await fetch('http://localhost:1337/api/auth/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'securePassword123!'
  })
});

const { jwt, user } = await response.json();
// Store securely (httpOnly cookie preferred)
```

### Token Security

**✅ Do:**
- Store tokens in httpOnly cookies (server-side)
- Use sessionStorage (client-side, better than localStorage)
- Implement token refresh logic
- Set appropriate expiration times (15 minutes - 1 hour)
- Clear tokens on logout

**❌ Don't:**
- Store tokens in localStorage (XSS vulnerable)
- Include tokens in URLs
- Log tokens to console
- Share tokens between users
- Store tokens in version control

### Example: Secure Token Storage

```typescript
// ✅ Good: httpOnly cookie (server-side)
res.cookie('jwt', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
});

// ✅ Good: sessionStorage (client-side)
sessionStorage.setItem('jwt', token);

// ❌ Bad: localStorage
localStorage.setItem('jwt', token); // Vulnerable to XSS

// ❌ Bad: URL parameter
window.location.href = `/call?token=${token}`;
```

---

## Permissions

### Role-Based Access Control

The plugin integrates with Strapi's RBAC system.

#### Default Roles

| Role | Permissions |
|------|------------|
| **Public** | None |
| **Authenticated** | Create calls, join calls, view own calls, manage presence |
| **Admin** | All permissions + delete calls, view all calls, update config |

#### Configuring Permissions

1. Navigate to **Settings → Roles**
2. Select a role (e.g., "Authenticated")
3. Find **Video Chat** section
4. Enable desired permissions:

```
video-chat
├─ calls
│  ├─ create        ✓ Allow users to create calls
│  ├─ find          ✓ Allow users to list their calls
│  ├─ findOne       ✓ Allow users to view call details
│  ├─ join          ✓ Allow users to join calls
│  ├─ leave         ✓ Allow users to leave calls
│  ├─ decline       ✓ Allow users to decline calls
│  ├─ end           ✓ Allow call initiators to end calls
│  └─ delete        ✗ Admin only
├─ presence
│  ├─ getMyPresence     ✓ Allow users to view their presence
│  ├─ updateMyPresence  ✓ Allow users to update their status
│  ├─ getUsersPresence  ✓ Allow users to see others' presence
│  ├─ getOnlineUsers    ✓ Allow users to see who's online
│  └─ heartbeat         ✓ Allow keep-alive requests
└─ config
   ├─ getConfig         ✓ Allow users to read config
   └─ updateConfig      ✗ Admin only
```

#### Custom Permission Logic

Add custom permission checks in controllers:

```typescript
// server/controllers/call.ts
async create(ctx: any) {
  const userId = ctx.state.user?.id;
  const { participantIds } = ctx.request.body;

  // Custom: Check if user can call these participants
  for (const participantId of participantIds) {
    const canCall = await checkUserCanCall(userId, participantId);
    if (!canCall) {
      return ctx.forbidden(`You cannot call user ${participantId}`);
    }
  }

  // Proceed with call creation...
}
```

#### Example: Department-Based Permissions

```typescript
// Only allow calls within same department
const checkUserCanCall = async (callerId: number, recipientId: number) => {
  const caller = await strapi.entityService.findOne(
    'plugin::users-permissions.user',
    callerId,
    { populate: ['department'] }
  );

  const recipient = await strapi.entityService.findOne(
    'plugin::users-permissions.user',
    recipientId,
    { populate: ['department'] }
  );

  return caller.department?.id === recipient.department?.id;
};
```

---

## Call Security

### Room Password Protection

Every call automatically generates a secure password:

```typescript
// Automatically generated on call creation
const roomPassword = crypto.randomBytes(16).toString('hex');
// Example: "a7f2c4e1b9d3f8e5c2a1d4f7e9b3c5a8"
```

This password is:
- Included in VDO.Ninja URLs
- Stored in call metadata
- Required to join the room
- Never exposed to unauthorized users

### Unique Stream IDs

Each participant gets a unique stream ID:

```typescript
// Generated per participant
const streamId = generateStreamId(); // e.g., "aBc12XyZ"
```

Benefits:
- Prevents unauthorized viewing
- Isolates participant streams
- Enables individual control

### Access Control

```typescript
// Authorization flow
async join(callId: number, userId: number) {
  // 1. Verify call exists
  const call = await findCall(callId);
  if (!call) throw new Error('Call not found');

  // 2. Verify user is invited
  const isParticipant = call.participants.some(p => p.id === userId);
  if (!isParticipant) throw new Error('Not invited');

  // 3. Verify call is active
  if (call.status === 'ended') throw new Error('Call ended');

  // 4. Generate secure URL with password
  return generateSecureRoomUrl(call, userId);
}
```

---

## Data Privacy

### Data Retention

**What We Store:**
- Call metadata (participants, timestamps, duration)
- Participant information (join/leave times, status)
- User presence (status, last seen)

**What We DON'T Store:**
- Video streams (peer-to-peer)
- Audio streams (peer-to-peer)
- Chat messages (if enabled)
- Screen sharing content

### GDPR Compliance

#### Right to Access

```typescript
// GET /api/video-chat/calls?userId=123
// Returns all calls for the user
```

#### Right to Erasure

```typescript
// Implement data deletion
const deleteUserData = async (userId: number) => {
  // Delete call history
  await strapi.db.query('plugin::video-chat.call').deleteMany({
    where: { initiator: userId }
  });

  // Delete participant records
  await strapi.db.query('plugin::video-chat.call-participant').deleteMany({
    where: { user: userId }
  });

  // Delete presence
  await strapi.db.query('plugin::video-chat.user-presence').deleteMany({
    where: { user: userId }
  });
};
```

#### Data Export

```typescript
// Export user's video chat data
const exportUserData = async (userId: number) => {
  const calls = await strapi.entityService.findMany('plugin::video-chat.call', {
    filters: {
      $or: [
        { initiator: userId },
        { participants: userId }
      ]
    }
  });

  const presence = await strapi.entityService.findMany('plugin::video-chat.user-presence', {
    filters: { user: userId }
  });

  return { calls, presence };
};
```

### Sensitive Data Handling

**Room Passwords:**
```typescript
// ✅ Good: Hash room passwords if storing long-term
const hashedPassword = await bcrypt.hash(roomPassword, 10);

// ✅ Good: Use environment variables for secrets
const turnUsername = process.env.TURN_USERNAME;

// ❌ Bad: Store passwords in plain text
metadata.password = 'plain-text-password';
```

---

## Best Practices

### 1. HTTPS Only

**❌ Bad:**
```
http://your-site.com/admin
```

**✅ Good:**
```
https://your-site.com/admin
```

WebRTC requires HTTPS in production. Configure SSL/TLS:

```nginx
# Nginx configuration
server {
    listen 443 ssl http2;
    server_name your-site.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:1337;
    }
}
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// server/middlewares/rateLimit.ts
export default (config, { strapi }) => {
  return async (ctx, next) => {
    const userId = ctx.state.user?.id;
    const key = `rate_limit:${userId}:${ctx.path}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60); // 60 second window
    }

    if (count > 10) { // Max 10 requests per minute
      return ctx.tooManyRequests('Rate limit exceeded');
    }

    await next();
  };
};
```

Apply to routes:

```typescript
// server/routes/index.ts
{
  method: 'POST',
  path: '/calls',
  handler: 'call.create',
  config: {
    middlewares: ['plugin::video-chat.rateLimit'],
  },
}
```

### 3. Input Validation

Validate all inputs:

```typescript
// ✅ Good: Validate participant IDs
async create(ctx: any) {
  const { participantIds } = ctx.request.body;

  // Validate array
  if (!Array.isArray(participantIds)) {
    return ctx.badRequest('participantIds must be an array');
  }

  // Validate IDs are numbers
  if (!participantIds.every(id => Number.isInteger(id))) {
    return ctx.badRequest('All participant IDs must be integers');
  }

  // Validate IDs exist
  for (const id of participantIds) {
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      id
    );
    if (!user) {
      return ctx.badRequest(`User ${id} not found`);
    }
  }

  // Proceed...
}
```

### 4. SQL Injection Prevention

Strapi's ORM prevents SQL injection, but be careful with raw queries:

```typescript
// ✅ Good: Use ORM
await strapi.entityService.findMany('plugin::video-chat.call', {
  filters: { status: userInput }
});

// ❌ Bad: Raw SQL with user input
await strapi.db.connection.raw(
  `SELECT * FROM calls WHERE status = '${userInput}'`
);

// ✅ Good: Raw SQL with parameterized queries
await strapi.db.connection.raw(
  'SELECT * FROM calls WHERE status = ?',
  [userInput]
);
```

### 5. XSS Prevention

Sanitize user inputs that will be displayed:

```typescript
import sanitizeHtml from 'sanitize-html';

// Sanitize user-provided labels
const safeLabel = sanitizeHtml(userProvidedLabel, {
  allowedTags: [],
  allowedAttributes: {}
});
```

### 6. CSRF Protection

Strapi includes CSRF protection. Ensure it's enabled:

```typescript
// config/middlewares.ts
export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:'],
          'frame-src': ['https://vdo.ninja'], // Allow VDO.Ninja iframes
        },
      },
    },
  },
  // ... other middlewares
];
```

---

## Compliance

### HIPAA (Healthcare)

If handling healthcare data:

1. **Sign BAA**: Business Associate Agreement with vendors
2. **Encrypt at Rest**: Database encryption
3. **Audit Logs**: Log all access
4. **Access Controls**: Strict RBAC
5. **No Recording**: Disable call recording

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      enableCallRecording: false, // HIPAA requirement
      auditLog: true,
      encryptMetadata: true
    }
  }
};
```

### SOC 2

For SOC 2 compliance:

1. **Access Controls**: RBAC implementation
2. **Audit Trails**: Log all operations
3. **Encryption**: HTTPS + WebRTC encryption
4. **Monitoring**: Track security events
5. **Incident Response**: Document procedures

### PCI DSS

If handling payment data (not recommended):

- Never store payment info in call metadata
- Use separate, PCI-compliant systems
- Avoid discussing payment details in calls

---

## Security Checklist

### Pre-Production

- [ ] HTTPS enabled and enforced
- [ ] JWT authentication configured
- [ ] Permissions properly set for all roles
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Error messages don't leak sensitive info

### Production

- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Intrusion detection system configured
- [ ] Firewall rules implemented
- [ ] Database backups encrypted
- [ ] Access logs monitored
- [ ] Incident response plan documented
- [ ] Security training for team
- [ ] Third-party security scan completed
- [ ] Compliance requirements met

### Post-Deployment

- [ ] Monitor for suspicious activity
- [ ] Review access logs regularly
- [ ] Update dependencies monthly
- [ ] Conduct penetration testing
- [ ] Review and update permissions
- [ ] Archive old call data
- [ ] Test backup restoration
- [ ] Review security policies

---

## Security Headers

Configure security headers in Nginx/Apache:

```nginx
# Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src https://vdo.ninja;" always;
```

---

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs for anomalies
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerabilities
5. **Document**: Record incident details
6. **Review**: Update security measures

### Example: Suspected Token Compromise

```typescript
// Immediately revoke compromised token
const revokeToken = async (userId: number) => {
  // Force user logout
  await strapi.entityService.update(
    'plugin::users-permissions.user',
    userId,
    { data: { blocked: true } }
  );

  // Log incident
  strapi.log.error('Security incident: Token compromise', {
    userId,
    timestamp: new Date().toISOString()
  });

  // Notify admins
  await notifyAdmins('Security Alert', `User ${userId} token compromised`);

  // Require password reset
  await sendPasswordResetEmail(userId);
};
```

---

## Security Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Strapi Security Guide**: https://docs.strapi.io/dev-docs/security
- **WebRTC Security**: https://webrtcsecurity.github.io/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security@your-domain.com
3. Include detailed description
4. Wait for confirmation before disclosure

---

## Conclusion

Security is a continuous process. Regular reviews, updates, and vigilance are essential to maintaining a secure video chat system.

For more information:
- [Architecture](./ARCHITECTURE.md) - System design
- [Deployment Guide](./DEPLOYMENT.md) - Production setup
- [Monitoring](./MONITORING.md) - Security monitoring
