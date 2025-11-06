import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Badge,
  Button,
  EmptyStateLayout,
} from '@strapi/design-system';
import { EmptyDocuments, Phone } from '@strapi/icons';
import { api } from '../utils/api';

interface OnlineUsersProps {
  onCallUser: (userId: number) => void;
}

export const OnlineUsers: React.FC<OnlineUsersProps> = ({ onCallUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnlineUsers();

    // Refresh every 10 seconds
    const interval = setInterval(loadOnlineUsers, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadOnlineUsers = async () => {
    try {
      const response = await api.getOnlineUsers();
      setUsers(response.data || []);
      if (loading) setLoading(false);
    } catch (error) {
      console.error('Failed to load online users:', error);
      if (loading) setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'in-call':
        return 'primary';
      case 'busy':
        return 'warning';
      case 'away':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (users.length === 0) {
    return (
      <EmptyStateLayout
        icon={<EmptyDocuments width="10rem" />}
        content="No online users"
        action={null}
      />
    );
  }

  return (
    <Box>
      <Table colCount={4} rowCount={users.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">User</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Status</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Last Seen</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Actions</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((presence) => (
            <Tr key={presence.id}>
              <Td>
                <Typography>
                  {presence.user?.username || presence.user?.email}
                </Typography>
              </Td>
              <Td>
                <Badge backgroundColor={`${getStatusColor(presence.status)}500`}>
                  {presence.status}
                </Badge>
              </Td>
              <Td>
                <Typography variant="omega">
                  {formatLastSeen(presence.lastSeenAt)}
                </Typography>
              </Td>
              <Td>
                {presence.status !== 'in-call' && (
                  <Button
                    size="S"
                    startIcon={<Phone />}
                    onClick={() => onCallUser(presence.user.id)}
                  >
                    Call
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
