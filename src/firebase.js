import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBseyWQJeqs6wrHRSX40OcTVMSoQCfRlss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tt-crm-f6a6c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tt-crm-f6a6c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tt-crm-f6a6c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "833472295992",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:833472295992:web:2822bf9709d1e43eb8a2cd",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BEYWKVaEPo-3aPv2Ala9j_WVrOkPrVA9U_NTelblUF-r6j_hEbSosMfn0yRMjJjGlUPPrcqweaqx-cksKh6kjiQ";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });
    console.log("✅ FCM Token:", token);
    return token;
  } catch (err) {
    console.error("FCM token error:", err);
    return null;
  }
};

export { messaging, onMessage };
