import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Typography,
  Button,
  Select,
  Option,
  MultiSelect,
  MultiSelectOption,
  ToggleInput,
  Box,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';

interface CallInitiatorProps {
  onClose: () => void;
  onCreate: (data: any) => void;
  preselectedUserId?: number;
}

export const CallInitiator: React.FC<CallInitiatorProps> = ({
  onClose,
  onCreate,
  preselectedUserId,
}) => {
  const { toggleNotification } = useNotification();
  const [callType, setCallType] = useState<'one-on-one' | 'group'>('one-on-one');
  const [selectedUsers, setSelectedUsers] = useState<number[]>(
    preselectedUserId ? [preselectedUserId] : []
  );
  const [audioOnly, setAudioOnly] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, you would fetch available users from the API
    // For now, we'll use a placeholder
    setAvailableUsers([
      { id: 1, username: 'user1' },
      { id: 2, username: 'user2' },
      { id: 3, username: 'user3' },
    ]);
  }, []);

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      toggleNotification({
        type: 'warning',
        message: 'Please select at least one user to call',
      });
      return;
    }

    if (callType === 'one-on-one' && selectedUsers.length > 1) {
      toggleNotification({
        type: 'warning',
        message: 'One-on-one calls can only have one other participant',
      });
      return;
    }

    setLoading(true);

    onCreate({
      participantIds: selectedUsers,
      callType,
      audioOnly,
    });
  };

  return (
    <ModalLayout onClose={onClose} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          Initiate Call
        </Typography>
      </ModalHeader>

      <ModalBody>
        <Box paddingBottom={4}>
          <Select
            label="Call Type"
            placeholder="Select call type"
            value={callType}
            onChange={(value: 'one-on-one' | 'group') => setCallType(value)}
          >
            <Option value="one-on-one">One-on-One</Option>
            <Option value="group">Group Call</Option>
          </Select>
        </Box>

        <Box paddingBottom={4}>
          <MultiSelect
            label="Select Participants"
            placeholder="Choose users to call"
            value={selectedUsers}
            onChange={setSelectedUsers}
            withTags
          >
            {availableUsers.map((user) => (
              <MultiSelectOption key={user.id} value={user.id}>
                {user.username}
              </MultiSelectOption>
            ))}
          </MultiSelect>
        </Box>

        <Box paddingBottom={4}>
          <ToggleInput
            label="Audio Only"
            hint="Disable video for this call"
            onLabel="Yes"
            offLabel="No"
            checked={audioOnly}
            onChange={() => setAudioOnly(!audioOnly)}
          />
        </Box>
      </ModalBody>

      <ModalFooter
        startActions={
          <Button onClick={onClose} variant="tertiary">
            Cancel
          </Button>
        }
        endActions={
          <Button onClick={handleSubmit} loading={loading}>
            Start Call
          </Button>
        }
      />
    </ModalLayout>
  );
};
