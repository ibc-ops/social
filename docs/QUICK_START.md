# Quick Start Guide

Get up and running with Strapi Video Chat in under 5 minutes!

## Prerequisites

- Strapi V5 project already set up
- Node.js 18+ and npm 9+ installed
- HTTPS enabled (required for WebRTC)

## Step 1: Install the Plugin (2 minutes)

### Option A: From npm (when published)

```bash
npm install strapi-plugin-video-chat
```

### Option B: Local installation

```bash
# Copy plugin to your Strapi project
cp -r strapi-plugin-video-chat ./src/plugins/video-chat
cd your-strapi-project
npm install
```

## Step 2: Enable the Plugin (1 minute)

Edit `config/plugins.ts`:

```typescript
export default {
  'video-chat': {
    enabled: true,
    resolve: './src/plugins/video-chat', // Only for local installation
  },
};
```

## Step 3: Build and Start (1 minute)

```bash
# Build the admin panel
npm run build

# Start Strapi in development mode
npm run develop
```

## Step 4: Access the Plugin (30 seconds)

1. Navigate to `http://localhost:1337/admin`
2. Log in to your admin panel
3. Look for "Video Chat" in the sidebar menu
4. Click it to open the plugin!

## Making Your First Call (1 minute)

### 1. Start a New Call

Click the **"New Call"** button in the top right corner.

### 2. Select Participants

In the modal that appears:
- Choose **"One-on-One"** or **"Group"** call type
- Select users from the dropdown
- Toggle **"Audio Only"** if you don't want video
- Click **"Start Call"**

### 3. Join the Call

- The video interface will load with VDO.Ninja
- Allow browser permissions for camera/microphone when prompted
- You'll see yourself and waiting for others to join

### 4. During the Call

Use the control buttons at the bottom:
- 🎤 **Microphone** - Mute/unmute audio
- 📹 **Camera** - Turn video on/off
- 🖥️ **Screen Share** - Share your screen
- 📞 **Hang Up** (red) - End the call

### 5. View Call History

After ending the call:
- Go to the **"Call History"** tab
- See all your past calls with duration and participants
- Join active calls directly from here

## Quick Tips

### For Best Quality
- Use a wired internet connection
- Close bandwidth-heavy applications
- Ensure good lighting for video
- Use headphones to prevent echo

### Browser Permissions
If you don't see video/audio:
1. Check browser permissions (usually in the address bar)
2. Allow camera and microphone access
3. Refresh the page and try again

### Testing Solo
You can test the interface by:
1. Creating a call with yourself (use incognito mode)
2. Opening the room URL in another browser
3. Checking call quality and controls

## What's Next?

Now that you have the basics working:

1. **Configure the Plugin** - [Configuration Guide](./CONFIGURATION.md)
2. **Set Up Permissions** - [Security Guide](./SECURITY.md)
3. **Integrate with Frontend** - [Developer Guide](./DEVELOPER_GUIDE.md)
4. **Deploy to Production** - [Deployment Guide](./DEPLOYMENT.md)

## Common First-Time Issues

### Plugin Not Showing
```bash
# Rebuild admin panel
npm run build
# Clear browser cache and refresh
```

### Camera/Microphone Not Working
- Ensure HTTPS is enabled (WebRTC requirement)
- Check browser permissions
- Try a different browser

### Can't Create Calls
- Verify user has permissions in Settings → Roles
- Ensure user is authenticated

## Need Help?

- **Documentation**: [Full Documentation Index](./README.md)
- **Troubleshooting**: [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **FAQ**: [Frequently Asked Questions](./FAQ.md)
- **Support**: Open an issue on GitHub

## Next Steps

### For Users
- Read the [User Guide](./USER_GUIDE.md) for detailed features
- Check out [FAQ](./FAQ.md) for common questions

### For Developers
- Review the [API Reference](./API_REFERENCE.md)
- Try the [Code Examples](./EXAMPLES.md)
- Study the [Architecture](./ARCHITECTURE.md)

### For Administrators
- Configure [Security Settings](./SECURITY.md)
- Set up [Monitoring](./MONITORING.md)
- Plan for [Production Deployment](./DEPLOYMENT.md)

---

**Congratulations!** 🎉 You now have video calling working in your Strapi application!
