import React, { useState, useEffect } from 'react';
import {
  Layout,
  Main,
  HeaderLayout,
  ContentLayout,
  Box,
  Button,
  Tabs,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
} from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';
import { CallHistory } from '../components/CallHistory';
import { OnlineUsers } from '../components/OnlineUsers';
import { VideoCallInterface } from '../components/VideoCallInterface';
import { CallInitiator } from '../components/CallInitiator';
import { api } from '../utils/api';

const HomePage = () => {
  const { toggleNotification } = useNotification();
  const [activeCall, setActiveCall] = useState<any>(null);
  const [showCallInitiator, setShowCallInitiator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      api.heartbeat().catch(console.error);
    }, 30000);

    // Set initial online status
    api.updateMyPresence('online').catch(console.error);

    return () => {
      clearInterval(interval);
      // Set offline when component unmounts
      api.updateMyPresence('offline').catch(console.error);
    };
  }, []);

  const handleCreateCall = async (data: any) => {
    try {
      const response = await api.createCall(data);
      const { call, inviteLinks } = response.data;

      toggleNotification({
        type: 'success',
        message: 'Call created successfully',
      });

      // Auto-join the call
      const joinResponse = await api.joinCall(call.id);
      setActiveCall({
        ...call,
        roomUrl: joinResponse.data.roomUrl,
        iframeUrl: joinResponse.data.iframeUrl,
      });

      setShowCallInitiator(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toggleNotification({
        type: 'danger',
        message: error?.message || 'Failed to create call',
      });
    }
  };

  const handleJoinCall = async (callId: number) => {
    try {
      const response = await api.joinCall(callId);
      const { call, roomUrl, iframeUrl } = response.data;

      setActiveCall({
        ...call,
        roomUrl,
        iframeUrl,
      });

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toggleNotification({
        type: 'danger',
        message: error?.message || 'Failed to join call',
      });
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;

    try {
      await api.leaveCall(activeCall.id);
      setActiveCall(null);
      setRefreshKey((prev) => prev + 1);

      toggleNotification({
        type: 'success',
        message: 'Left call successfully',
      });
    } catch (error: any) {
      toggleNotification({
        type: 'danger',
        message: error?.message || 'Failed to leave call',
      });
    }
  };

  return (
    <Layout>
      <Main>
        <HeaderLayout
          title="Video Chat"
          subtitle="Manage video and audio calls with VDO.Ninja"
          primaryAction={
            !activeCall && (
              <Button
                startIcon={<Plus />}
                onClick={() => setShowCallInitiator(true)}
              >
                New Call
              </Button>
            )
          }
        />

        <ContentLayout>
          {activeCall ? (
            <VideoCallInterface
              call={activeCall}
              onEndCall={handleEndCall}
            />
          ) : (
            <TabGroup label="Video Chat Tabs" id="video-chat-tabs">
              <Tabs>
                <Tab>Call History</Tab>
                <Tab>Online Users</Tab>
              </Tabs>

              <TabPanels>
                <TabPanel>
                  <Box padding={4}>
                    <CallHistory
                      key={refreshKey}
                      onJoinCall={handleJoinCall}
                    />
                  </Box>
                </TabPanel>

                <TabPanel>
                  <Box padding={4}>
                    <OnlineUsers
                      key={refreshKey}
                      onCallUser={(userId) => {
                        setShowCallInitiator(true);
                      }}
                    />
                  </Box>
                </TabPanel>
              </TabPanels>
            </TabGroup>
          )}

          {showCallInitiator && (
            <CallInitiator
              onClose={() => setShowCallInitiator(false)}
              onCreate={handleCreateCall}
            />
          )}
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default HomePage;
