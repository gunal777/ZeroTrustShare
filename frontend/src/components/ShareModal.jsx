import { useState } from "react";
import { createShareLink, revokeShareLink } from "../api/client";
import { formatDate, timeUntil } from "../utils/format";
import { useToast } from "./ToastProvider";

const EXPIRY_OPTIONS = [
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function ShareModal({ file, onClose }) {
  const notify = useToast();
  const [expiryIndex, setExpiryIndex] = useState(1);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [link, setLink] = useState(null); // { token, url, expiresAt, isPasswordProtected }
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const expiresAt = new Date(Date.now() + EXPIRY_OPTIONS[expiryIndex].ms).toISOString();
      const data = await createShareLink({ fileId: file._id, expiresAt, password });
      const url = `${window.location.origin}/share/${data.token}`;
      setLink({ ...data, url });
    } catch (err) {
      notify(err.message || "Couldn't create the share link.", { variant: "danger" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url);
    notify("Link copied to clipboard.", { variant: "success" });
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeShareLink(link.token);
      notify("Share link revoked.", { variant: "success" });
      setLink(null);
    } catch (err) {
      notify(err.message || "Couldn't revoke the link.", { variant: "danger" });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2>Share &ldquo;{file.originalName}&rdquo;</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>

        {!link ? (
          <form onSubmit={handleCreate} className="share-form">
            <label className="field">
              <span className="field__label">Link expires in</span>
              <div className="segmented">
                {EXPIRY_OPTIONS.map((opt, i) => (
                  <button
                    type="button"
                    key={opt.label}
                    className={`segmented__option${i === expiryIndex ? " is-active" : ""}`}
                    onClick={() => setExpiryIndex(i)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>

            <label className="field">
              <span className="field__label">Password (optional)</span>
              <input
                type="text"
                className="text-input"
                placeholder="Leave blank for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </label>

            <button type="submit" className="btn btn--primary" disabled={isCreating}>
              {isCreating ? "Generating link…" : "Generate share link"}
            </button>
          </form>
        ) : (
          <div className="share-result">
            <div className="field">
              <span className="field__label">Share link</span>
              <div className="link-row">
                <code className="mono link-row__value">{link.url}</code>
                <button className="btn btn--small" onClick={handleCopy}>
                  Copy
                </button>
              </div>
            </div>

            <div className="share-result__meta">
              <span className={`badge ${link.isPasswordProtected ? "badge--accent" : ""}`}>
                {link.isPasswordProtected ? "Password protected" : "No password"}
              </span>
              <span className="badge badge--warn">{timeUntil(link.expiresAt)}</span>
              <span className="share-result__expiry mono">expires {formatDate(link.expiresAt)}</span>
            </div>

            <div className="share-result__actions">
              <button className="btn btn--danger-ghost" onClick={handleRevoke} disabled={isRevoking}>
                {isRevoking ? "Revoking…" : "Revoke link"}
              </button>
              <button className="btn" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
