import { useCallback, useEffect, useRef, useState } from "react";
import { listFiles, listShareLinks } from "../api/client";
import { VaultContext } from "./vault";

export function VaultProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const requests = useRef({ version: 0 });

  const refresh = useCallback(async () => {
    const current = ++requests.current.version;

    try {
      const [nextFiles, nextLinks] = await Promise.all([
        listFiles(),
        listShareLinks(),
      ]);

      if (current === requests.current.version) {
        setFiles(nextFiles);
        setLinks(nextLinks);
        setError("");
      }
    } catch (err) {
      if (current === requests.current.version) {
        setError(err.message);
      }
    } finally {
      if (current === requests.current.version) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const state = requests.current;
    void Promise.resolve().then(refresh);
    window.addEventListener("focus", refresh);

    return () => {
      state.version++;
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return (
    <VaultContext.Provider
      value={{
        files,
        links,
        loading,
        error,
        refresh,
        setFiles,
        setLinks,
        uploadOpen,
        setUploadOpen,
        shareTarget,
        setShareTarget,
        deleteTarget,
        setDeleteTarget,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}
