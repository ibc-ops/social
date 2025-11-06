export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Call {
  id: number;
  uuid: string;
  roomId: string;
  callType: 'one-on-one' | 'group';
  status: 'pending' | 'active' | 'ended' | 'missed' | 'declined';
  initiator: User;
  participants: User[];
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  metadata: {
    password?: string;
    audioOnly?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CallParticipant {
  id: number;
  call: Call;
  user: User;
  joinedAt: string | null;
  leftAt: string | null;
  status: 'invited' | 'joined' | 'left' | 'declined';
  role: 'host' | 'participant';
  streamId: string | null;
  deviceInfo: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  id: number;
  user: User;
  status: 'online' | 'offline' | 'in-call' | 'busy' | 'away';
  currentCall: Call | null;
  lastSeenAt: string;
  socketId: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface PluginConfig {
  vdoNinjaHostUrl: string;
  maxGroupCallParticipants: number;
  enableScreenShare: boolean;
  enableChat: boolean;
  customCSS: string | null;
  iframeApi: {
    events: string[];
    commands: string[];
    documentation: string;
  };
}

export interface CreateCallRequest {
  participantIds: number[];
  callType: 'one-on-one' | 'group';
  audioOnly?: boolean;
  metadata?: any;
}

export interface JoinCallResponse {
  call: Call;
  participant: CallParticipant;
  roomUrl: string;
  iframeUrl: string;
  streamId: string;
}
