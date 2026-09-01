import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadDropzone from "../components/UploadDropzone";
import FileRow from "../components/FileRow";
import ShareModal from "../components/ShareModal";
import { useToast } from "../components/ToastProvider";
import {
  deleteFile,
  downloadFile,
  listFiles,
  triggerBlobDownload,
  uploadFile,
} from "../api/client";

export default function Vault() {
  const notify = useToast();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [uploadProgress, setUploadProgress] = useState(null); // { name, percent } | null
  const [shareTarget, setShareTarget] = useState(null);
  const [tokenInput, setTokenInput] = useState("");

  const refresh = async () => {
    try {
      const data = await listFiles();
      setFiles(data);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      notify(err.message || "Couldn't load your files.", { variant: "danger" });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (file) => {
    setUploadProgress({ name: file.name, percent: 0 });
    try {
      const uploaded = await uploadFile(file, (percent) =>
        setUploadProgress({ name: file.name, percent }),
      );
      setFiles((current) => [uploaded, ...current]);
      notify(`${file.name} encrypted and stored.`, { variant: "success" });
    } catch (err) {
      notify(err.message || "Upload failed.", { variant: "danger" });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const { blob, filename } = await downloadFile(file._id);
      triggerBlobDownload(blob, filename || file.originalName);
    } catch (err) {
      notify(err.message || "Download failed.", { variant: "danger" });
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"? This can't be undone.`)) return;
    try {
      await deleteFile(file._id);
      setFiles((current) => current.filter((f) => f._id !== file._id));
      notify("File deleted.", { variant: "success" });
    } catch (err) {
      notify(err.message || "Couldn't delete the file.", { variant: "danger" });
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">
            ⌁
          </span>
          <div>
            <h1>ZeroTrust Vault</h1>
            <p className="topbar__tagline">Every file encrypted at rest. Links you control.</p>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Open a share link">
          <input
            type="text"
            className="text-input topbar__nav-input"
            placeholder="Paste a share link or token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button
            className="btn btn--small"
            onClick={() => {
              const token = tokenInput.trim().split("/share/").pop();
              if (token) navigate(`/share/${token}`);
            }}
          >
            Open
          </button>
        </nav>
      </header>

      <section aria-label="Upload a file">
        <UploadDropzone
          onFileAccepted={handleUpload}
          onValidationError={(msg) => notify(msg, { variant: "danger" })}
        />
        {uploadProgress && (
          <div className="upload-progress" aria-live="polite">
            <div className="upload-progress__label mono">
              <span>Encrypting {uploadProgress.name}</span>
              <span>{uploadProgress.percent}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-track__fill" style={{ width: `${uploadProgress.percent}%` }} />
            </div>
          </div>
        )}
      </section>

      <section className="vault-list" aria-label="Your files">
        {status === "loading" && <p className="empty-state">Loading your vault…</p>}

        {status === "error" && (
          <div className="empty-state empty-state--error">
            <p>Couldn't reach the vault. Is the backend running?</p>
            <button className="btn" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {status === "ready" && files.length === 0 && (
          <div className="empty-state">
            <p>Your vault is empty.</p>
            <p className="empty-state__hint">Drop a file above to encrypt and store your first one.</p>
          </div>
        )}

        {status === "ready" &&
          files.map((file) => (
            <FileRow
              key={file._id}
              file={file}
              onDownload={handleDownload}
              onShare={setShareTarget}
              onDelete={handleDelete}
            />
          ))}
      </section>

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}
