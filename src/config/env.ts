import { Platform } from 'react-native';

// -------------------------------------------------------------
// 1. Live Production Backend (Render)
// -------------------------------------------------------------
const LIVE_API_URL = 'https://cable-be.onrender.com/api';

// -------------------------------------------------------------
// 2. Local Development Backend (Uncomment when working locally)
// -------------------------------------------------------------
// const DEV_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
// const DEV_LAN_URL = 'http://192.168.1.100:5000/api'; // For physical phone on same Wi-Fi

// -------------------------------------------------------------
// 3. Active Base URL
// -------------------------------------------------------------
// Currently active: Live Render Backend
export const BASE_URL = LIVE_API_URL;

// To work locally: comment the line above and uncomment the line below:
// export const BASE_URL = DEV_LOCAL_URL;
