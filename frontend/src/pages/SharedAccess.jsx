import { lazy, Suspense, useEffect, useState } from "react";
const PdfPreview = lazy(() => import("../components/PdfPreview"));
import { Link, useParams } from "react-router-dom";
import {
  getShareInfo,
  previewShareLink,
  unlockShareLink,
  triggerBlobDownload,
} from "../api/client";
import { Brand } from "../components/AppLayout";
import { formatBytes, formatDate, extFromName } from "../utils/format";
import { Empty, Loading } from "../components/State";
import Icon from "../components/Icon";
export default function SharedAccess() {
  const { token } = useParams();
  return <SharedFile key={token} token={token} />;
}
function SharedFile({ token }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    document.title = "Secure file access · ZeroTrust";
    getShareInfo(token)
      .then((result) => {
        if (live) {
          setData(result);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (live) {
          setStatus(
            err.status === 410
              ? "gone"
              : err.status === 404
                ? "missing"
                : "error",
          );
          setError(err.message);
        }
      });
    return () => {
      live = false;
    };
  }, [token, retry]);
  async function access(kind) {
    setBusy(kind);
    setError("");
    try {
      const result = await (
        kind === "preview" ? previewShareLink : unlockShareLink
      )(token, password);
      if (kind === "preview")
        setPreview(
          data.file.mimeType === "text/plain"
            ? { text: await result.blob.text() }
            : { blob: result.blob },
        );
      else {
        triggerBlobDownload(result.blob, result.filename || data.file.name);
        setDownloaded(true);
      }
    } catch (err) {
      setError(err.message);
      if ([404, 410].includes(err.status)) {
        setStatus("gone");
        setPreview(null);
      }
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <Link className="btn btn--small" to="/">
          My workspace
          <Icon name="arrow" size={16} />
        </Link>
      </header>
      <div className={"public-share-layout" + (preview ? " has-preview" : "")}>
        <section className="public-share-card page-transition">
          {status === "loading" ? (
            <Loading />
          ) : status !== "ready" ? (
            <Empty
              icon="lock"
              title={
                status === "gone"
                  ? "This link has closed."
                  : status === "missing"
                    ? "Link not found."
                    : "Unable to check this link."
              }
              message={
                status === "gone"
                  ? "The owner revoked access, or the link expired. Ask them for a new link."
                  : status === "missing"
                    ? "Check the address or ask the sender for a new link."
                    : error
              }
              action={
                status === "error" && (
                  <button
                    className="btn"
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    Try again
                  </button>
                )
              }
            />
          ) : (
            <>
              <span className="public-share-emblem">
                <Icon
                  name={data.passwordRequired ? "lock" : "shield"}
                  size={29}
                />
              </span>
              <span className="eyebrow">SHARED WITH YOU</span>
              <h1>
                {data.passwordRequired
                  ? "A little privacy, first."
                  : "A file, just for you."}
              </h1>
              <p className="muted">
                {data.passwordRequired
                  ? "Enter the password from the sender to access this file."
                  : "Your file is ready. Access is available until the link expires."}
              </p>
              <div className="shared-file">
                <span className="file-icon">
                  <Icon name="file" size={24} />
                  <small>{extFromName(data.file.name)}</small>
                </span>
                <div>
                  <strong>{data.file.name}</strong>
                  <small>{formatBytes(data.file.size)}</small>
                </div>
              </div>
              <form
                className="form-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  access(data.allowDownload ? "download" : "preview");
                }}
              >
                {data.passwordRequired && (
                  <label className="field">
                    <span>Share password</span>
                    <input
                      className="text-input"
                      type="password"
                      autoComplete="off"
                      required
                      value={password}
                      maxLength={72}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter the password"
                    />
                  </label>
                )}
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
                {downloaded && (
                  <p className="success-message" role="status">
                    <Icon name="check" size={17} />
                    Download started.
                  </p>
                )}
                <button
                  className="btn btn--primary btn--full"
                  disabled={Boolean(busy)}
                >
                  {busy ? (
                    <span className="spinner spinner--small" />
                  ) : (
                    <Icon
                      name={data.allowDownload ? "download" : "eye"}
                      size={18}
                    />
                  )}
                  {busy
                    ? "Opening file…"
                    : data.allowDownload
                      ? downloaded
                        ? "Download again"
                        : "Download file"
                      : "Open preview"}
                </button>
                {data.allowDownload &&
                  ["text/plain", "application/pdf"].includes(
                    data.file.mimeType,
                  ) && (
                    <button
                      className="btn btn--full"
                      type="button"
                      disabled={
                        Boolean(busy) || (data.passwordRequired && !password)
                      }
                      onClick={() => access("preview")}
                    >
                      <Icon name="eye" size={18} />
                      Preview file
                    </button>
                  )}
              </form>
              <div className="share-expiry">
                <Icon name="clock" size={14} />
                Expires {formatDate(data.expiresAt)}
              </div>
              {!data.allowDownload && (
                <p className="helper-text">
                  The owner has enabled preview-only access.
                </p>
              )}
            </>
          )}
        </section>
        {preview && (
          <section className="preview-panel">
            <div className="panel-heading">
              <h2>File preview</h2>
              <button
                className="icon-btn"
                onClick={() => setPreview(null)}
                aria-label="Close preview"
              >
                <Icon name="close" />
              </button>
            </div>
            {preview.blob ? (
              <Suspense fallback={<Loading />}>
                <PdfPreview blob={preview.blob} />
              </Suspense>
            ) : (
              <pre className="text-preview">{preview.text}</pre>
            )}
          </section>
        )}
      </div>
      <p className="public-footer">
        <Icon name="shield" size={16} />
        Shared securely with ZeroTrust Vault
      </p>
    </div>
  );
}
