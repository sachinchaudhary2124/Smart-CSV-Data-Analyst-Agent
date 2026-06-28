const API_BASE_URL = 'http://127.0.0.1:8005/api';

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API GET error: status ${res.status}`);
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API POST error: status ${res.status}`);
    return res.json();
  },

  async upload(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`API upload error: status ${res.status}`);
    return res.json();
  }
};
