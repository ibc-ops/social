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

interface CallHistoryProps {
  onJoinCall: (callId: number) => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({ onJoinCall }) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const response = await api.getCalls();
      setCalls(response.data || []);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'ended':
        return 'neutral';
      case 'missed':
        return 'warning';
      case 'declined':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (calls.length === 0) {
    return (
      <EmptyStateLayout
        icon={<EmptyDocuments width="10rem" />}
        content="No calls yet"
        action={null}
      />
    );
  }

  return (
    <Box>
      <Table colCount={6} rowCount={calls.length}>
        <Thead>
          <Tr>
            <Th>
              <Typography variant="sigma">Type</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Status</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Participants</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Started</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Duration</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Actions</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {calls.map((call) => (
            <Tr key={call.id}>
              <Td>
                <Typography>{call.callType}</Typography>
              </Td>
              <Td>
                <Badge backgroundColor={`${getStatusColor(call.status)}500`}>
                  {call.status}
                </Badge>
              </Td>
              <Td>
                <Typography>
                  {call.participants?.length || 0} participants
                </Typography>
              </Td>
              <Td>
                <Typography variant="omega">
                  {call.startedAt ? formatDate(call.startedAt) : 'Not started'}
                </Typography>
              </Td>
              <Td>
                <Typography>{formatDuration(call.duration)}</Typography>
              </Td>
              <Td>
                {call.status === 'active' && (
                  <Button
                    size="S"
                    startIcon={<Phone />}
                    onClick={() => onJoinCall(call.id)}
                  >
                    Join
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
