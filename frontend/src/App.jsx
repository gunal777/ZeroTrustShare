import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ToastProvider";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import Links from "./pages/Links";
import SharedAccess from "./pages/SharedAccess";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Auth key="login" />} />
            <Route path="/signup" element={<Auth key="signup" signup />} />
            <Route path="/share/:token" element={<SharedAccess />} />
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/files" element={<Vault />} />
              <Route path="/links" element={<Links />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
