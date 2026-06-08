import axios from "../api/axiosConfig";

const parseJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const authService = {
  login: async (username, password) => {
    const response = await axios.post("/api/auth/login", {
      username,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token); // Lưu token lại
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  },

  getToken: () => localStorage.getItem("token"),

  getPayload: () => {
    const token = localStorage.getItem("token");
    return parseJwtPayload(token);
  },

  getRoles: () => {
    const payload = parseJwtPayload(localStorage.getItem("token"));
    if (!payload) return [];
    const roles = payload.roles || payload.role || [];
    if (Array.isArray(roles)) return roles;
    return [roles];
  },

  getUserName: () => {
    const payload = authService.getPayload();
    if (!payload) return "Người dùng";
    return payload.sub || "Người dùng";
  },

  isAdmin: () => {
    const roles = authService.getRoles();
    return roles.includes("ROLE_ADMIN");
  },

  isUser: () => {
    const roles = authService.getRoles();
    return roles.includes("ROLE_USER");
  },

  changePassword: (data) => axios.post("/api/auth/change-password", data),
};

export default authService;
