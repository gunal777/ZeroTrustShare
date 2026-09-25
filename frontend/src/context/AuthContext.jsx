import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/client";
import { AuthContext } from "./auth";
export function AuthProvider({ children }) {
  const [signedOut, setSignedOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const check = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const data = await api.getProfile();
      if (sequence.current === current) {
        setUser(data.user);
        setError("");
      }
    } catch (err) {
      if (sequence.current === current) {
        setUser(null);
        if (err.status !== 401) setError(err.message);
      }
    } finally {
      if (sequence.current === current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(check);
    const expire = () => {
      sequence.current++;
      setSignedOut(false);
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, [check]);
  const authenticate = async (mode, data) => {
    sequence.current++;
    const result = await api[mode](data);
    setSignedOut(false);
    setUser(result.user);
    setError("");
  };
  const signOut = async () => {
    try {
      await api.logout();
    } catch (err) {
      if (err.status !== 401) throw err;
    }
    sequence.current++;
    setSignedOut(true);
    setUser(null);
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, check, authenticate, signOut, signedOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
