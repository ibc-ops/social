import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Flex,
  Badge,
} from '@strapi/design-system';
import { Phone, Microphone, Camera, Monitor } from '@strapi/icons';
import styled from 'styled-components';

const IFrameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 70vh;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
`;

const IFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const ControlBar = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 24px;
  backdrop-filter: blur(10px);
`;

const ControlButton = styled(Button)<{ variant?: 'danger' }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.variant === 'danger' ? '#d32f2f' : '#424242')};
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.variant === 'danger' ? '#b71c1c' : '#616161')};
  }
`;

interface VideoCallInterfaceProps {
  call: any;
  onEndCall: () => void;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  call,
  onEndCall,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    // Listen for messages from VDO.Ninja IFRAME
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(call.iframeUrl).origin) return;

      const { action, value } = event.data;

      // Handle VDO.Ninja events
      switch (action) {
        case 'remote-track-added':
          console.log('Remote track added:', value);
          break;
        case 'remote-track-removed':
          console.log('Remote track removed:', value);
          break;
        case 'connection-quality':
          console.log('Connection quality:', value);
          break;
        case 'joined-room':
          console.log('Joined room:', value);
          break;
        case 'left-room':
          console.log('Left room:', value);
          onEndCall();
          break;
        case 'error':
          console.error('VDO.Ninja error:', value);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [call, onEndCall]);

  const sendIFrameCommand = (command: string, value?: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { command, value },
        new URL(call.iframeUrl).origin
      );
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      sendIFrameCommand('unmute-audio');
    } else {
      sendIFrameCommand('mute-audio');
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (isVideoOff) {
      sendIFrameCommand('unmute-video');
    } else {
      sendIFrameCommand('mute-video');
    }
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      sendIFrameCommand('stop-screenshare');
    } else {
      sendIFrameCommand('start-screenshare');
    }
    setIsScreenSharing(!isScreenSharing);
  };

  const handleHangup = () => {
    sendIFrameCommand('hangup');
    onEndCall();
  };

  return (
    <Box>
      <Flex justifyContent="space-between" padding={4}>
        <Box>
          <Typography variant="beta">
            {call.callType === 'one-on-one' ? 'One-on-One Call' : 'Group Call'}
          </Typography>
          <Typography variant="omega" textColor="neutral600">
            Room ID: {call.roomId}
          </Typography>
        </Box>
        <Badge backgroundColor="success500">Active</Badge>
      </Flex>

      <IFrameContainer>
        <IFrame
          ref={iframeRef}
          src={call.iframeUrl}
          allow="camera; microphone; display-capture; autoplay; picture-in-picture"
          allowFullScreen
        />

        <ControlBar>
          <ControlButton onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            <Microphone />
          </ControlButton>

          <ControlButton onClick={toggleVideo} title={isVideoOff ? 'Start Video' : 'Stop Video'}>
            <Camera />
          </ControlButton>

          <ControlButton onClick={toggleScreenShare} title="Screen Share">
            <Monitor />
          </ControlButton>

          <ControlButton variant="danger" onClick={handleHangup} title="End Call">
            <Phone />
          </ControlButton>
        </ControlBar>
      </IFrameContainer>

      <Box padding={4}>
        <Typography variant="omega" textColor="neutral600">
          Participants: {call.participants?.length || 0}
        </Typography>
      </Box>
    </Box>
  );
};
