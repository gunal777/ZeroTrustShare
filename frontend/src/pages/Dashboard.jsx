import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useVault } from "../context/vault";
import { formatBytes, formatDate } from "../utils/format";
import FileRow from "../components/FileRow";
import Icon from "../components/Icon";
import { Empty, ErrorState, Loading } from "../components/State";
export default function Dashboard() {
  const { user } = useAuth();
  const { files, links, loading, error, refresh, setUploadOpen } = useVault();
  const active = links.filter(
    (link) => !link.isRevoked && new Date(link.expiresAt) > new Date(),
  );
  const bytes = files.reduce((sum, file) => sum + file.size, 0);
  const accesses = links.reduce((sum, link) => sum + link.accessCount, 0);
  const activities = [
    ...files.map((file) => ({
      id: file._id,
      icon: "upload",
      title: "File added to your vault",
      text: file.originalName,
      date: file.createdAt,
    })),
    ...links.map((link) => ({
      id: link._id,
      icon: link.isRevoked ? "lock" : "link",
      title: link.isRevoked ? "Share link revoked" : "Share link created",
      text: link.file?.originalName || "Deleted file",
      date: link.isRevoked ? link.updatedAt : link.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR VAULT, AT A GLANCE</span>
          <h1>
            Welcome back,{" "}
            {(user.name || user.email.split("@")[0]).split(" ")[0]}
            <span className="heading-period">.</span>
          </h1>
          <p>Everything you need. Only the access you allow.</p>
        </div>
        <span className="date-label">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      {error && <ErrorState message={error} onRetry={refresh} />}
      <section className="hero-banner">
        <div>
          <span className="eyebrow eyebrow--mint">
            A SAFE PLACE FOR WHAT MATTERS
          </span>
          <h2>
            Private files.
            <br />
            Peace of mind.
          </h2>
          <p>
            Upload, protect, and share on your terms.
            <br />
            Your next file is in good hands.
          </p>
          <button className="btn btn--mint" onClick={() => setUploadOpen(true)}>
            <Icon name="upload" size={18} />
            Upload a file
            <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-ring" />
          <div className="hero-ring hero-ring--inner" />
          <div className="hero-shield">
            <Icon name="shield" size={75} />
          </div>
          <span className="hero-chip">
            <Icon name="lock" size={13} />
            ENCRYPTED AT REST
          </span>
          <span className="hero-spark spark-one" />
          <span className="hero-spark spark-two" />
        </div>
      </section>
      <section className="stats-grid" aria-label="Vault statistics">
        {[
          {
            icon: "folder",
            label: "Files in your vault",
            value: files.length,
            detail: "Privately stored",
            tone: "green",
          },
          {
            icon: "link",
            label: "Active share links",
            value: active.length,
            detail: "Access you control",
            tone: "blue",
          },
          {
            icon: "activity",
            label: "Shared file accesses",
            value: accesses,
            detail: "Previews & downloads",
            tone: "purple",
          },
          {
            icon: "shield",
            label: "Encrypted storage",
            value: formatBytes(bytes),
            detail: "AES-256-GCM protected",
            tone: "amber",
          },
        ].map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className={"stat-icon tone-" + stat.tone}>
                <Icon name={stat.icon} size={18} />
              </span>
            </div>
            <strong>{loading ? "—" : stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              Recent files <span className="count-pill">{files.length}</span>
            </h2>
            <Link className="text-link" to="/files">
              View all
              <Icon name="arrow" size={15} />
            </Link>
          </div>
          {loading ? (
            <Loading />
          ) : files.length ? (
            <div role="list">
              {files.slice(0, 5).map((file) => (
                <FileRow key={file._id} file={file} />
              ))}
            </div>
          ) : (
            <Empty
              title="Your vault starts here."
              message="Add your first file. We'll encrypt it before it's stored."
              action={
                <button className="btn" onClick={() => setUploadOpen(true)}>
                  <Icon name="plus" size={16} />
                  Add a file
                </button>
              }
            />
          )}
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <Icon name="activity" size={18} />
          </div>
          {loading ? (
            <Loading />
          ) : activities.length ? (
            <div className="activity-list">
              {activities.map((item) => (
                <div className="activity-item" key={item.id}>
                  <span className="activity-icon">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p title={item.text}>{item.text}</p>
                    <small>{formatDate(item.date)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="activity"
              title="A fresh start."
              message="Your recent uploads and link changes will appear here."
            />
          )}
        </section>
      </div>
      <div className="privacy-strip">
        <Icon name="shield" size={20} />
        <span>
          <strong>Security is part of the workflow.</strong> Files are encrypted
          at rest, and every share link has an expiry.
        </span>
        <Link to="/links">
          Manage access
          <Icon name="arrow" size={15} />
        </Link>
      </div>
    </>
  );
}
