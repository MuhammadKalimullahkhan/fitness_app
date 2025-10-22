// FIREBASE CONFIGURATION
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;

// GEMINI CONFIGURATION
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export { firebaseConfig, appId, initialAuthToken, apiKey };
