// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
export const SERVER_BASE_URL = process.env.REACT_APP_SERVER_URL || '';

export const config = {
  apiUrl: API_BASE_URL,
  serverUrl: SERVER_BASE_URL,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '';
  
  // If imagePath already contains full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If SERVER_BASE_URL is empty (Docker setup), use relative path
  if (!SERVER_BASE_URL) {
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  }
  
  // If imagePath starts with /, remove it to avoid double slash
  const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  
  return `${SERVER_BASE_URL}/${cleanPath}`;
};

export default config;
