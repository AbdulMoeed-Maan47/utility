import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      try {
        const refresh = localStorage.getItem("refresh_token");
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/token/refresh`,
          { refresh_token: refresh },
        );
        localStorage.setItem("access_token", res.data.access_token);
        err.config.headers.Authorization = `Bearer ${res.data.access_token}`;
        return axios(err.config);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
