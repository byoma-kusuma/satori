// Load API URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://api.satori.byomakusuma.com' : 'http://localhost:3000');