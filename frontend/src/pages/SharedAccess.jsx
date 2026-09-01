import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, getShareInfo, triggerBlobDownload, unlockShareLink } from "../api/client";
import { extFromName, formatBytes } from "../utils/format";

export default function SharedAccess() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ready | gone | error
  const [file, setFile] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    getShareInfo(token)
      .then((data) => {
        setFile(data.file);
        setPasswordRequired(Boolean(data.passwordRequired));
        setStatus("ready");
      })
      .catch((err) => {
        setStatus(err instanceof ApiError && err.status === 410 ? "gone" : "error");
      });
  }, [token]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      const { blob, filename } = await unlockShareLink(token, password);
      triggerBlobDownload(blob, filename || file?.name);
      setDownloaded(true);
    } catch (err) {
      setUnlockError(
        err instanceof ApiError && err.status === 401
          ? "That password isn't right. Try again."
          : err.message || "Couldn't unlock this file.",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="share-page">
      <div className="share-card">
        <div className="share-card__mark" aria-hidden="true">
          {status === "ready" ? "⌁" : "×"}
        </div>

        {status === "loading" && <p className="share-card__status">Checking link…</p>}

        {status === "gone" && (
          <>
            <h1>This link is gone</h1>
            <p className="share-card__status">It's expired or was revoked by its owner.</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1>Link not found</h1>
            <p className="share-card__status">
              This share link doesn't exist, or the vault server is unreachable.
            </p>
          </>
        )}

        {status === "ready" && file && (
          <>
            <h1>{passwordRequired && !downloaded ? "Locked file" : "Ready to download"}</h1>

            <div className="share-card__file">
              <span className="badge">{extFromName(file.name)}</span>
              <div>
                <p className="share-card__filename">{file.name}</p>
                <p className="mono share-card__filesize">{formatBytes(file.size)}</p>
              </div>
            </div>

            {downloaded && (
              <p className="share-card__status share-card__status--success">
                Download started. If it didn't save, use the button below to try again.
              </p>
            )}

            <form onSubmit={handleUnlock} className="share-form">
              {passwordRequired && (
                <label className="field">
                  <span className="field__label">This file is password protected</span>
                  <input
                    type="password"
                    className="text-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </label>
              )}

              {unlockError && <p className="field__error">{unlockError}</p>}

              <button type="submit" className="btn btn--primary btn--full" disabled={isUnlocking}>
                {isUnlocking
                  ? "Unlocking…"
                  : downloaded
                    ? "Download again"
                    : passwordRequired
                      ? "Unlock & download"
                      : "Download"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
