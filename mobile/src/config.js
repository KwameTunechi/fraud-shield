// mobile/src/config.js
// Backend is deployed at http://18.168.188.211 (Nginx on port 80).
// All API paths start with /api — Nginx proxies them to the Express backend.
// To use a local backend instead, change DEV_API_URL to your machine's LAN IP.

const DEV_API_URL = 'http://18.168.188.211'

export const API_URL = __DEV__
  ? DEV_API_URL
  : (process.env.EXPO_PUBLIC_API_URL ?? 'http://18.168.188.211')
