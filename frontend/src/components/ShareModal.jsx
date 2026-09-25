import { useState } from "react";
import { Link } from "react-router-dom";
import { createShareLink } from "../api/client";
import { useVault } from "../context/vault";
import { useToast } from "./toast";
import Modal from "./Modal";
import Icon from "./Icon";
import { formatDate } from "../utils/format";

const EXPIRIES = [
  { label: "1 hour", hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

export default function ShareModal({ file, onClose }) {
  const { setLinks } = useVault();
  const notify = useToast();
  const [hours, setHours] = useState(24);
  const [password, setPassword] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");
  const previewable = ["application/pdf", "text/plain"].includes(file.mimeType);
  const url = link ? window.location.origin + "/share/" + link.token : "";

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createShareLink({
        fileId: file._id,
        expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
        password: password || undefined,
        allowDownload,
      });
      setLink(result);
      setLinks((current) => [{ ...result, file }, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copied.", { variant: "success" });
    } catch {
      notify("Select the link and copy it manually.", { variant: "danger" });
    }
  }

  return (
    <Modal
      title={link ? "Ready to share." : "Share on your terms."}
      description={file.originalName}
      onClose={onClose}
      busy={busy}
    >
      {!link ? (
        <form className="form-stack" onSubmit={create}>
          <fieldset className="field">
            <legend>Link expires in</legend>
            <div className="segmented">
              {EXPIRIES.map((option) => (
                <button
                  type="button"
                  key={option.hours}
                  className={hours === option.hours ? "is-active" : ""}
                  aria-pressed={hours === option.hours}
                  onClick={() => setHours(option.hours)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>
              Password <small>optional</small>
            </span>
            <input
              type="password"
              className="text-input"
              autoComplete="new-password"
              placeholder="Add an extra layer of privacy"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={password ? 4 : undefined}
              maxLength={72}
            />
          </label>
          <label className="toggle-field">
            <span>
              <strong>Allow downloads</strong>
              <small>
                {previewable
                  ? "Turn off for preview-only access."
                  : "Required for Word documents."}
              </small>
            </span>
            <input
              type="checkbox"
              checked={allowDownload}
              disabled={!previewable}
              onChange={(event) => setAllowDownload(event.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true" />
          </label>
          {!allowDownload && (
            <p className="helper-text">
              Preview-only hides the download action. Recipients can still
              capture or save content they can view.
            </p>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn--primary btn--full" disabled={busy}>
            {busy ? "Creating link…" : "Create share link"}
            <Icon name="link" size={17} />
          </button>
        </form>
      ) : (
        <div className="share-result">
          <span className="success-emblem">
            <Icon name="check" size={28} />
          </span>
          <p>
            Only people with this link
            {link.isPasswordProtected ? " and its password" : ""} can access the
            file.
          </p>
          <label className="field">
            <span>Share link</span>
            <div className="link-copy">
              <input
                className="text-input"
                aria-label="Share link"
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
              />
              <button className="btn btn--primary" onClick={copy}>
                <Icon name="copy" size={17} />
                Copy
              </button>
            </div>
          </label>
          <div className="link-details">
            <span>
              <Icon name="clock" size={15} />
              Expires {formatDate(link.expiresAt)}
            </span>
            <span>
              <Icon
                name={link.isPasswordProtected ? "lock" : "link"}
                size={15}
              />
              {link.isPasswordProtected
                ? "Password protected"
                : "Anyone with the link"}
            </span>
          </div>
          <Link className="text-link" to="/links" onClick={onClose}>
            Manage or revoke this link
            <Icon name="arrow" size={16} />
          </Link>
          <button className="btn btn--full" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
