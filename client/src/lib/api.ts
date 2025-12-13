import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const clientsAPI = {
  getAll: async (filters?: { riskBand?: string; search?: string }) => {
    const response = await api.get('/clients', { params: filters });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/clients', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/clients/${id}`);
  }
};

export const documentsAPI = {
  upload: async (clientId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/clients/${clientId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  download: async (clientId: string, docId: string, filename: string) => {
    const response = await api.get(`/clients/${clientId}/documents/${docId}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  delete: async (clientId: string, docId: string) => {
    await api.delete(`/clients/${clientId}/documents/${docId}`);
  }
};

export const reportsAPI = {
  generate: async (clientId: string) => {
    const response = await api.get(`/clients/${clientId}/report`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const riskConfigAPI = {
  get: async () => {
    const response = await api.get('/risk-config');
    return response.data;
  },
  update: async (data: any) => {
    const response = await api.put('/risk-config', data);
    return response.data;
  }
};

export interface UserPreferences {
  theme: string;
  primaryColor: string;
  dashboardWidgets: string[];
  widgetLayout: string;
}

export const preferencesAPI = {
  get: async (): Promise<UserPreferences> => {
    const response = await api.get('/user/preferences');
    return response.data;
  },
  update: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    const response = await api.put('/user/preferences', data);
    return response.data;
  }
};
