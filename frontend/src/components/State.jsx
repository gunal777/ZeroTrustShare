import Icon from "./Icon";

export function Loading({ full = false }) {
  return (
    <div
      className={"loading-state" + (full ? " loading-state--full" : "")}
      role="status"
    >
      <span className="spinner" />
      <span>Opening your vault…</span>
    </div>
  );
}

export function Empty({ icon = "folder", title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <Icon name="alert" />
      <span>{message}</span>
      <button className="btn btn--small" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
