import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import { Toaster, toast } from "sonner";
import routes from "./route/SidebarRaoute";
import { requestFCMToken, messaging, onMessage } from "./firebase";
import { authAPI } from "./api/auth";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading CRM panel...</p>
    </div>
  </div>
);

function NotificationBanner({ onAllow, onDeny }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3">
      <div className="text-2xl">🔔</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">Enable Notifications</p>
        <p className="text-xs text-gray-500 mt-0.5">Reminders aur follow-up alerts ke liye notifications on karo.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={onAllow}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition">
            Allow
          </button>
          <button onClick={onDeny}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isLoggedIn, loading } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (Notification.permission === "default") {
      setShowBanner(true);
    } else if (Notification.permission === "denied") {
      toast.warning("Notifications blocked hain. Browser settings se on karo.", { duration: 6000 });
    }
  }, [isLoggedIn]);

  const handleAllow = async () => {
    setShowBanner(false);
    const fcmToken = await requestFCMToken();
    if (fcmToken) {
      try {
        await authAPI.saveFCMToken(fcmToken);
        toast.success("Notifications enabled!");
      } catch { }
    } else {
      toast.error("Notification permission denied.");
    }
  };

  const handleDeny = () => setShowBanner(false);

  // ✅ Foreground FCM notification listener
  useEffect(() => {
    if (!isLoggedIn) return;

    console.log("🔔 FCM onMessage listener lagaya gaya");

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 FCM Message Aaya (Foreground):", payload);

      const title = payload?.notification?.title || payload?.data?.title || "New Notification";
      const body  = payload?.notification?.body  || payload?.data?.message || "";

      console.log("📋 Title:", title);
      console.log("📋 Body:", body);

      toast(body, {
        description: title,
        duration: 6000,
        icon: "🔔",
      });
    });

    return () => {
      console.log("🔕 FCM listener hata diya");
      unsubscribe();
    };
  }, [isLoggedIn]);

  if (loading) return <LoadingSpinner />;

  return (
    <Router>
      <Toaster position="top-right" />
      {showBanner && <NotificationBanner onAllow={handleAllow} onDeny={handleDeny} />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected */}
        {isLoggedIn ? (
          <Route element={<DashboardLayout />}>
            {routes.flatMap(route => (route.children ? route.children : route)).map(({ path, component: Component }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;