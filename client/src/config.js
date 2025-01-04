// API URLs
export const API_URL = process.env.NODE_ENV === 'production'
    ? 'https://lies-server.onrender.com'
    : 'http://localhost:8080';

// Other configuration constants
export const SOCKET_URL = API_URL;
export const DEFAULT_AVATAR_COLOR = '#7C4DFF'; 