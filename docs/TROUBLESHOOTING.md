# Troubleshooting Guide

Common issues and solutions for the Strapi Video Chat Plugin.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Plugin Not Showing](#plugin-not-showing)
- [Call Creation Issues](#call-creation-issues)
- [Video/Audio Issues](#videoaudio-issues)
- [Connection Problems](#connection-problems)
- [Permission Errors](#permission-errors)
- [Performance Issues](#performance-issues)
- [Database Errors](#database-errors)

---

## Installation Issues

### Plugin Doesn't Install

**Problem:** `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### TypeScript Compilation Errors

**Problem:** Build fails with TypeScript errors

**Solution:**
```bash
# Ensure TypeScript is installed
npm install --save-dev typescript@^5.0.0

# Check tsconfig.json is present
ls tsconfig.json

# Build with verbose output
npm run build --verbose
```

### Missing Dependencies

**Problem:** Module not found errors

**Solution:**
```bash
# Install all dependencies
npm install uuid socket.io socket.io-client

# For React dependencies
npm install react react-dom react-router-dom styled-components
```

---

## Plugin Not Showing

### Plugin Not in Admin Panel

**Problem:** Video Chat plugin doesn't appear in sidebar

**Checklist:**

1. **Verify plugin is enabled** in `config/plugins.ts`:
```typescript
export default {
  'video-chat': {
    enabled: true,
    resolve: './src/plugins/video-chat', // If local
  },
};
```

2. **Rebuild admin panel**:
```bash
npm run build
# Or for development
npm run develop
```

3. **Clear browser cache**:
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

4. **Check browser console** for errors:
```
Press F12 → Console tab
Look for errors related to video-chat
```

5. **Verify plugin structure**:
```bash
# Check if files exist
ls -la src/plugins/video-chat/strapi-server.ts
ls -la src/plugins/video-chat/strapi-admin.ts
```

6. **Check Strapi logs**:
```bash
# Start Strapi and watch logs
npm run develop

# Look for:
# ✓ Video Chat plugin loaded
```

### Plugin Crashes Admin Panel

**Problem:** Admin panel won't load after installing plugin

**Solution:**

1. **Check for JavaScript errors**:
```javascript
// Open browser console (F12)
// Look for errors like:
// "Cannot read property 'xyz' of undefined"
```

2. **Disable plugin temporarily**:
```typescript
// config/plugins.ts
export default {
  'video-chat': {
    enabled: false, // Disable to test
  },
};
```

3. **Check plugin dependencies**:
```bash
# Ensure all peer dependencies are installed
npm install @strapi/design-system @strapi/icons
```

4. **Clear .cache folder**:
```bash
rm -rf .cache
npm run build
```

---

## Call Creation Issues

### "participantIds is required" Error

**Problem:** Call creation fails

**Solution:**
```typescript
// ❌ Wrong
await api.createCall({
  participants: [2, 3], // Wrong key
  callType: 'group'
});

// ✅ Correct
await api.createCall({
  participantIds: [2, 3], // Correct key
  callType: 'group'
});
```

### "Cannot call yourself" Error

**Problem:** Initiator ID in participantIds array

**Solution:**
```typescript
// ❌ Wrong
const currentUserId = 1;
await api.createCall({
  participantIds: [1, 2], // Includes self!
  callType: 'one-on-one'
});

// ✅ Correct
await api.createCall({
  participantIds: [2], // Only other users
  callType: 'one-on-one'
});
```

### "Call not found" Error

**Problem:** Call ID doesn't exist

**Solution:**
```typescript
// Verify call exists before joining
const { data: call } = await api.getCall(callId);
if (!call) {
  console.error('Call not found');
  return;
}

await api.joinCall(callId);
```

### "Permission denied" Error

**Problem:** User doesn't have permission to create calls

**Solution:**

1. **Check user role permissions**:
   - Go to Settings → Roles
   - Select user's role (e.g., "Authenticated")
   - Enable "create" permission under video-chat → calls

2. **Verify authentication**:
```typescript
// Ensure JWT token is valid
const token = getJWTToken();
if (!token) {
  console.error('Not authenticated');
  return;
}
```

---

## Video/Audio Issues

### Camera/Microphone Not Working

**Problem:** No video or audio in call

**Solutions:**

1. **Check browser permissions**:
```
Chrome: Settings → Privacy and security → Site settings → Camera/Microphone
Firefox: about:permissions
Safari: Preferences → Websites → Camera/Microphone
```

2. **Verify HTTPS**:
```
WebRTC requires HTTPS in production
http://localhost is OK for development
```

3. **Test device access**:
```javascript
// Test camera
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('Devices work!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('Device error:', error);
  });
```

4. **Check if device is in use**:
- Close other apps using camera/microphone
- Check system tray for apps using devices

5. **Try different browser**:
- Chrome (best WebRTC support)
- Firefox (good support)
- Safari (limited support)
- Edge (good support)

### Video Quality Issues

**Problem:** Poor video quality or lag

**Solutions:**

1. **Adjust quality setting**:
```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      vdoNinja: {
        defaultQuality: 1, // Lower: 0, Higher: 3
        codec: 'h264' // Try h264 if vp9 has issues
      }
    }
  }
};
```

2. **Check network bandwidth**:
```bash
# Test internet speed
# Minimum recommended:
# - Upload: 1 Mbps for video
# - Download: 1 Mbps for video
# - Ping: < 100ms
```

3. **Close bandwidth-heavy apps**:
- Streaming services
- Downloads
- Other video calls

4. **Use audio-only mode**:
```typescript
await api.createCall({
  participantIds: [2],
  callType: 'one-on-one',
  audioOnly: true // Disable video
});
```

### Echo or Feedback

**Problem:** Hearing echo during call

**Solutions:**

1. **Use headphones**
2. **Mute when not speaking**
3. **Reduce speaker volume**
4. **Check for multiple devices**:
```javascript
// Ensure only one audio output
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
    console.log('Audio outputs:', audioOutputs);
  });
```

---

## Connection Problems

### "Failed to join room" Error

**Problem:** Cannot connect to VDO.Ninja

**Solutions:**

1. **Check VDO.Ninja availability**:
```bash
# Test if VDO.Ninja is accessible
curl -I https://vdo.ninja
# Should return 200 OK
```

2. **Verify firewall settings**:
```
Allow outgoing connections to:
- vdo.ninja (or your self-hosted URL)
- WebRTC ports: UDP 3478, TCP/UDP 1024-65535
```

3. **Test with default VDO.Ninja**:
```typescript
// Temporarily use official VDO.Ninja
// config/plugins.ts
vdoNinja: {
  hostUrl: 'https://vdo.ninja' // Default
}
```

4. **Check corporate firewall/VPN**:
- Try without VPN
- Contact IT about WebRTC ports

### Calls Drop Frequently

**Problem:** Connections disconnect randomly

**Solutions:**

1. **Configure TURN server** (for NAT traversal):
```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      turnServer: {
        enabled: true,
        urls: ['turn:your-turn-server.com:3478'],
        username: 'your-username',
        credential: 'your-password'
      }
    }
  }
};
```

2. **Check network stability**:
```bash
# Ping test
ping -c 100 8.8.8.8
# Look for packet loss
```

3. **Reduce call timeout**:
```typescript
// config/plugins.ts
calls: {
  timeoutMinutes: 30 // Lower timeout
}
```

### Slow Connection

**Problem:** Long time to connect

**Solutions:**

1. **Check STUN/TURN configuration**
2. **Verify both parties have good internet**
3. **Try different time/reduce network load**

---

## Permission Errors

### 403 Forbidden Error

**Problem:** API returns 403 error

**Solutions:**

1. **Check user role**:
```bash
# In Strapi admin
Settings → Roles → Your Role → Video Chat permissions
Enable all necessary permissions
```

2. **Verify JWT token is valid**:
```javascript
// Decode JWT to check expiration
const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

const decoded = parseJwt(jwtToken);
console.log('Token expires:', new Date(decoded.exp * 1000));
```

3. **Refresh authentication**:
```typescript
// Re-login if token expired
if (tokenExpired()) {
  await login(username, password);
}
```

### 401 Unauthorized Error

**Problem:** Not authenticated

**Solution:**
```typescript
// Ensure Authorization header is set
headers: {
  'Authorization': `Bearer ${jwtToken}`,
  'Content-Type': 'application/json'
}

// Check if token exists
if (!jwtToken) {
  // Redirect to login
  window.location.href = '/login';
}
```

---

## Performance Issues

### Slow API Responses

**Problem:** API calls take too long

**Solutions:**

1. **Add database indexes**:
```sql
-- Check if indexes exist
SHOW INDEX FROM video_chat_calls;

-- Add if missing
CREATE INDEX idx_call_status ON video_chat_calls(status);
CREATE INDEX idx_call_initiator ON video_chat_calls(initiator_id);
```

2. **Limit query results**:
```typescript
// Add pagination
const calls = await api.getCalls({
  _limit: 25,
  _start: 0
});
```

3. **Optimize populate**:
```typescript
// Only populate what you need
const call = await strapi.entityService.findOne('plugin::video-chat.call', id, {
  populate: ['initiator'], // Don't populate everything
});
```

### High Memory Usage

**Problem:** Server using too much memory

**Solutions:**

1. **Archive old calls**:
```typescript
// Automatically delete calls older than 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

await strapi.db.query('plugin::video-chat.call').deleteMany({
  where: {
    endedAt: {
      $lt: thirtyDaysAgo
    }
  }
});
```

2. **Clean up stale presence**:
```typescript
// Run presence cleanup more frequently
const presenceService = strapi.plugin('video-chat').service('presence');
await presenceService.cleanupStalePresences();
```

3. **Limit concurrent calls**:
```typescript
// Add max concurrent calls check
const activeCalls = await strapi.db.query('plugin::video-chat.call').count({
  where: { status: 'active' }
});

if (activeCalls >= 100) {
  throw new Error('Maximum concurrent calls reached');
}
```

---

## Database Errors

### Migration Errors

**Problem:** Database migration fails

**Solution:**
```bash
# Reset database (WARNING: destroys data)
npm run strapi db:drop
npm run strapi db:migrate

# Or manually run migrations
npm run strapi db:migrate -- --force
```

### Duplicate Key Errors

**Problem:** Unique constraint violation

**Solution:**
```sql
-- Check for duplicates
SELECT user_id, COUNT(*)
FROM video_chat_user_presences
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM video_chat_user_presences
WHERE id NOT IN (
  SELECT MAX(id)
  FROM video_chat_user_presences
  GROUP BY user_id
);
```

### Connection Pool Exhausted

**Problem:** "Too many connections" error

**Solution:**
```typescript
// config/database.ts
export default {
  connection: {
    client: 'postgres',
    connection: {
      // ... connection details
    },
    pool: {
      min: 2,
      max: 10 // Increase if needed
    }
  }
};
```

---

## Debug Mode

Enable debug logging:

```typescript
// config/plugins.ts
export default {
  'video-chat': {
    config: {
      debug: true // Enable verbose logging
    }
  }
};
```

Check logs:
```bash
# Development
npm run develop
# Look for debug messages

# Production
pm2 logs strapi
```

---

## Getting Help

If you're still experiencing issues:

1. **Check existing GitHub issues**: Search for similar problems
2. **Gather diagnostic info**:
   ```
   - Strapi version
   - Plugin version
   - Node version (node --version)
   - OS and browser
   - Error messages (full stack trace)
   - Steps to reproduce
   ```

3. **Create a minimal reproduction**:
   - Fresh Strapi install
   - Install plugin
   - Minimal code to trigger issue

4. **Open a GitHub issue** with all information

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `participantIds is required` | Missing or wrong field name | Use `participantIds` array |
| `Call not found` | Invalid call ID | Verify call exists |
| `Permission denied` | Insufficient permissions | Check role permissions |
| `Not authenticated` | Missing/invalid JWT | Re-authenticate |
| `Call has ended` | Trying to join ended call | Check call status first |
| `Maximum participants reached` | Too many in group call | Increase limit in config |
| `User is offline` | Participant not online | Check presence status |
| `Rate limit exceeded` | Too many requests | Wait and retry |

---

## Next Steps

- [FAQ](./FAQ.md) - Frequently asked questions
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Developer Guide](./DEVELOPER_GUIDE.md) - Integration guide
- [Security Guide](./SECURITY.md) - Security best practices
