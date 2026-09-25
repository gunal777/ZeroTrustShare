import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/vault";
import { revokeShareLink } from "../api/client";
import { formatDate } from "../utils/format";
import { useToast } from "../components/toast";
import { Empty, ErrorState, Loading } from "../components/State";
import Modal from "../components/Modal";
import Icon from "../components/Icon";

const statusOf = (link) =>
  link.isRevoked
    ? "revoked"
    : new Date(link.expiresAt) <= new Date()
      ? "expired"
      : "active";

export default function Links() {
  const { links, setLinks, loading, error, refresh } = useVault();
  const notify = useToast();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const filtered = links.filter(
    (link) =>
      (filter === "all" || statusOf(link) === filter) &&
      (link.file?.originalName || "")
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  async function copy(link) {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + "/share/" + link.token
      );
      notify("Link copied.", { variant: "success" });
    } catch {
      notify("Open the link, then copy its address from your browser.", {
        variant: "danger",
      });
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      await revokeShareLink(target.token);
      setLinks((current) =>
        current.map((link) =>
          link.token === target.token
            ? { ...link, isRevoked: true, updatedAt: new Date().toISOString() }
            : link
        )
      );
      setTarget(null);
      notify("Access revoked. The link no longer works.", {
        variant: "success",
      });
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SHARING, WITH BOUNDARIES</span>
          <h1>
            Shared links<span className="heading-period">.</span>
          </h1>
          <p>Know what’s shared. Decide when access ends.</p>
        </div>
        <Link className="btn btn--primary" to="/files">
          <Icon name="plus" size={17} />
          Share a file
        </Link>
      </div>
      <div className="info-strip">
        <Icon name="shield" />
        <p>
          You're in control. Revoke a link anytime to prevent new access to the
          file.
        </p>
      </div>
      {error && <ErrorState message={error} onRetry={refresh} />}
      <section className="panel">
        <div className="file-toolbar">
          <div className="filter-tabs" aria-label="Filter links">
            {["all", "active", "expired", "revoked"].map((status) => (
              <button
                key={status}
                className={filter === status ? "is-active" : ""}
                aria-pressed={filter === status}
                onClick={() => setFilter(status)}
              >
                {status[0].toUpperCase() + status.slice(1)}
                {status === "all" && <span>{links.length}</span>}
              </button>
            ))}
          </div>
          <div className="search-input">
            <Icon name="search" size={17} />
            <input
              type="search"
              placeholder="Find a shared file…"
              aria-label="Search shared files"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : filtered.length ? (
          <div className="links-list">
            {filtered.map((link) => {
              const status = statusOf(link);
              return (
                <article className="share-link-row" key={link.token}>
                  <span className="link-icon">
                    <Icon name="link" />
                  </span>
                  <div className="share-link-main">
                    <div className="share-link-title">
                      <h3>{link.file?.originalName || "Deleted file"}</h3>
                      <span className={"badge badge--" + status}>{status}</span>
                    </div>
                    <div className="share-link-meta">
                      <span>
                        <Icon name="clock" size={13} />
                        Expires {formatDate(link.expiresAt)}
                      </span>
                      <span>
                        <Icon
                          name={link.isPasswordProtected ? "lock" : "eye"}
                          size={13}
                        />
                        {link.isPasswordProtected
                          ? "Password protected"
                          : "No password"}
                      </span>
                      <span>
                        {link.allowDownload
                          ? "Downloads allowed"
                          : "Preview only"}
                      </span>
                      <span>{link.accessCount} accesses</span>
                    </div>
                  </div>
                  <div className="link-actions">
                    {status === "active" && (
                      <>
                        <button
                          className="icon-btn"
                          aria-label={
                            "Copy link for " + link.file?.originalName
                          }
                          title="Copy link"
                          onClick={() => copy(link)}
                        >
                          <Icon name="copy" size={17} />
                        </button>
                        <Link
                          className="icon-btn"
                          to={"/share/" + link.token}
                          aria-label={
                            "Open link for " + link.file?.originalName
                          }
                          title="Open link"
                        >
                          <Icon name="arrow" size={17} />
                        </Link>
                        <button
                          className="btn btn--small btn--danger-ghost"
                          onClick={() => setTarget(link)}
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            icon="link"
            title={
              links.length
                ? "No matching links."
                : "Share a little. Control a lot."
            }
            message={
              links.length
                ? "Try another filter or search."
                : "Create a link from My files. Set an expiry, add a password, and share when you’re ready."
            }
            action={
              !links.length && (
                <Link className="btn" to="/files">
                  Choose a file
                  <Icon name="arrow" size={16} />
                </Link>
              )
            }
          />
        )}
      </section>
      {target && (
        <Modal
          title="Revoke this share link?"
          description={target.file?.originalName}
          onClose={() => setTarget(null)}
          busy={busy}
        >
          <div className="dialog-notice">
            <Icon name="lock" />
            <p>
              The link will stop working immediately. Existing downloaded copies
              cannot be recalled. You can create a new link later.
            </p>
          </div>
          <div className="dialog-actions">
            <button
              className="btn"
              onClick={() => setTarget(null)}
              disabled={busy}
            >
              Keep sharing
            </button>
            <button
              className="btn btn--danger"
              onClick={revoke}
              disabled={busy}
            >
              {busy ? "Revoking…" : "Revoke access"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
