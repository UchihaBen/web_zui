// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const config = {
  apiUrl: API_BASE_URL,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

export default config;
