import { useState } from "react";
import { downloadFile, triggerBlobDownload } from "../api/client";
import { extFromName, formatBytes, formatDate } from "../utils/format";
import { useVault } from "../context/vault";
import { useToast } from "./toast";
import Icon from "./Icon";

export default function FileRow({ file }) {
  const { setShareTarget, setDeleteTarget } = useVault();
  const notify = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);

    try {
      const data = await downloadFile(file._id);
      triggerBlobDownload(data.blob, data.filename || file.originalName);
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="file-row" role="listitem">
      <span
        className={
          "file-icon file-icon--" + extFromName(file.originalName).toLowerCase()
        }
      >
        <Icon name="file" size={22} />
        <small>{extFromName(file.originalName)}</small>
      </span>
      <div className="file-row-main">
        <strong title={file.originalName}>{file.originalName}</strong>
        <span>
          {formatBytes(file.size)} <span className="footer-dot">·</span>{" "}
          {formatDate(file.createdAt)}
        </span>
      </div>
      <span className="badge badge--success file-status">
        <Icon name="lock" size={11} />
        Encrypted
      </span>
      <div className="file-actions">
        <button
          className="icon-btn"
          onClick={download}
          disabled={busy}
          aria-label={"Download " + file.originalName}
          title="Download"
        >
          {busy ? (
            <span className="spinner spinner--small" />
          ) : (
            <Icon name="download" size={18} />
          )}
        </button>
        <button
          className="icon-btn"
          onClick={() => setShareTarget(file)}
          aria-label={"Share " + file.originalName}
          title="Share"
        >
          <Icon name="link" size={18} />
        </button>
        <button
          className="icon-btn icon-btn--danger"
          onClick={() => setDeleteTarget(file)}
          aria-label={"Delete " + file.originalName}
          title="Delete"
        >
          <Icon name="trash" size={18} />
        </button>
      </div>
    </div>
  );
}
