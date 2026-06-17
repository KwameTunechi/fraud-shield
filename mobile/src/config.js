// mobile/src/config.js
// IMPORTANT: In dev mode, the phone can't reach "localhost" — it's a different
// device on the same WiFi. Set DEV_API_URL to your laptop's LAN IP address.
// Find it with: ipconfig (Windows) or ifconfig (macOS/Linux).
// Example: http://192.168.1.50:3000

const DEV_API_URL = 'https://roots-normally-forward-executed.trycloudflare.com'

export const API_URL = __DEV__
  ? DEV_API_URL
  : (process.env.EXPO_PUBLIC_API_URL ?? 'https://fraudshield-api.up.railway.app')
