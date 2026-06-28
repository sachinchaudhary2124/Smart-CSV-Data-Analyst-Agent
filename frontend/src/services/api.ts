export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = {
  async get(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!res.ok) {
      console.error(`API GET error: status ${res.status} on endpoint ${endpoint}`);
      throw new Error(`API GET error: status ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint: string, data?: any, options?: RequestInit) {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string>),
      },
      body: isFormData ? data : (data !== undefined ? JSON.stringify(data) : undefined),
      ...options,
    });
    if (!res.ok) {
      console.error(`API POST error: status ${res.status} on endpoint ${endpoint}`);
      throw new Error(`API POST error: status ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      ...options,
    });
    if (!res.ok) {
      console.error(`API DELETE error: status ${res.status} on endpoint ${endpoint}`);
      throw new Error(`API DELETE error: status ${res.status}`);
    }
    return res.json();
  },

  async upload(endpoint: string, file: File, options?: RequestInit) {
    const formData = new FormData();
    formData.append("file", file);
    return this.post(endpoint, formData, options);
  }
};
