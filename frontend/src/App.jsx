import { Route, BrowserRouter, Routes } from "react-router-dom";
import Vault from "./pages/Vault";
import SharedAccess from "./pages/SharedAccess";
import { ToastProvider } from "./components/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Vault />} />
          <Route path="/share/:token" element={<SharedAccess />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
