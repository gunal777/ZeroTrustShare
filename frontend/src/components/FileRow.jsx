import { useState } from "react";
import CipherReveal from "./CipherReveal";
import { extFromName, formatBytes, formatDate } from "../utils/format";

function FileIcon({ ext }) {
  return (
    <div className="file-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <span className="file-icon__ext">{ext}</span>
    </div>
  );
}

export default function FileRow({ file, onDownload, onShare, onDelete }) {
  const [isBusy, setIsBusy] = useState(null); // 'download' | 'delete' | null

  const run = async (kind, action) => {
    setIsBusy(kind);
    try {
      await action();
    } finally {
      setIsBusy(null);
    }
  };

  return (
    <div className="file-row">
      <FileIcon ext={extFromName(file.originalName)} />

      <div className="file-row__main">
        <CipherReveal as="p" className="file-row__name" text={file.originalName} />
        <p className="file-row__meta mono">
          {formatBytes(file.size)} &middot; uploaded {formatDate(file.createdAt)}
        </p>
      </div>

      <span className="badge badge--success" title="Files are encrypted at rest">
        {file.encryptionStatus === "encrypted" ? "Encrypted" : "Unencrypted"}
      </span>

      <div className="file-row__actions">
        <button
          className="btn btn--small"
          onClick={() => run("download", () => onDownload(file))}
          disabled={isBusy === "download"}
        >
          {isBusy === "download" ? "Downloading…" : "Download"}
        </button>
        <button className="btn btn--small" onClick={() => onShare(file)}>
          Share
        </button>
        <button
          className="btn btn--small btn--danger-ghost"
          onClick={() => run("delete", () => onDelete(file))}
          disabled={isBusy === "delete"}
        >
          {isBusy === "delete" ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
