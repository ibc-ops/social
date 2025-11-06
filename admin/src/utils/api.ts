import { request } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

const API_BASE = `/${PLUGIN_ID}`;

export const api = {
  // Call endpoints
  createCall: async (data: any) => {
    return request(`${API_BASE}/calls`, {
      method: 'POST',
      body: data,
    });
  },

  getCalls: async (params?: any) => {
    return request(`${API_BASE}/calls`, {
      method: 'GET',
      params,
    });
  },

  getCall: async (id: number) => {
    return request(`${API_BASE}/calls/${id}`, {
      method: 'GET',
    });
  },

  joinCall: async (id: number, deviceInfo?: any) => {
    return request(`${API_BASE}/calls/${id}/join`, {
      method: 'POST',
      body: { deviceInfo },
    });
  },

  leaveCall: async (id: number) => {
    return request(`${API_BASE}/calls/${id}/leave`, {
      method: 'POST',
    });
  },

  declineCall: async (id: number) => {
    return request(`${API_BASE}/calls/${id}/decline`, {
      method: 'POST',
    });
  },

  endCall: async (id: number) => {
    return request(`${API_BASE}/calls/${id}/end`, {
      method: 'POST',
    });
  },

  deleteCall: async (id: number) => {
    return request(`${API_BASE}/calls/${id}`, {
      method: 'DELETE',
    });
  },

  // Presence endpoints
  getMyPresence: async () => {
    return request(`${API_BASE}/presence`, {
      method: 'GET',
    });
  },

  updateMyPresence: async (status: string, metadata?: any) => {
    return request(`${API_BASE}/presence`, {
      method: 'PATCH',
      body: { status, metadata },
    });
  },

  getUsersPresence: async (userIds: number[]) => {
    return request(`${API_BASE}/presence/users?userIds=${userIds.join(',')}`, {
      method: 'GET',
    });
  },

  getOnlineUsers: async () => {
    return request(`${API_BASE}/presence/online`, {
      method: 'GET',
    });
  },

  heartbeat: async () => {
    return request(`${API_BASE}/presence/heartbeat`, {
      method: 'POST',
    });
  },

  // Config endpoints
  getConfig: async () => {
    return request(`${API_BASE}/config`, {
      method: 'GET',
    });
  },

  updateConfig: async (data: any) => {
    return request(`${API_BASE}/config`, {
      method: 'PUT',
      body: data,
    });
  },

  getIframeConfig: async () => {
    return request(`${API_BASE}/vdo/iframe-config`, {
      method: 'GET',
    });
  },
};
