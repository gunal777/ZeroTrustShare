import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/auth";
import { VaultProvider } from "../context/VaultContext";
import { useVault } from "../context/vault";
import { useToast } from "./toast";
import Icon from "./Icon";
import { ErrorState, Loading } from "./State";
import VaultDialogs from "./VaultDialogs";

export function Brand({ light = false }) {
  return (
    <Link
      to="/"
      className={"brand" + (light ? " brand--light" : "")}
      aria-label="ZeroTrust home"
    >
      <span className="brand-mark">
        <Icon name="shield" size={25} />
      </span>
      <span>
        ZeroTrust<span className="brand-sub">SECURE FILE WORKSPACE</span>
      </span>
    </Link>
  );
}

function Shell() {
  const { user, signOut } = useAuth();
  const { files, links, setUploadOpen } = useVault();
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useToast();
  const [mobilePath, setMobilePath] = useState("");
  const mobileOpen = mobilePath === location.pathname;
  const setMobileOpen = (open) => setMobilePath(open ? location.pathname : "");
  const [leaving, setLeaving] = useState(false);
  const [token, setToken] = useState("");
  const mainRef = useRef(null);
  const route = location.pathname.split("/")[1];
  const title =
    { dashboard: "Overview", files: "My files", links: "Shared links" }[
      route
    ] || "Workspace";

  useEffect(() => {
    document.title = title + " · ZeroTrust";
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname, title]);

  async function handleLogout() {
    setLeaving(true);
    try {
      await signOut();
    } catch (err) {
      notify(err.message, { variant: "danger" });
    } finally {
      setLeaving(false);
    }
  }

  function openLink(event) {
    event.preventDefault();
    const value = token.trim().split("/share/").pop().split(/[?#]/)[0];
    if (!/^[A-Za-z0-9_-]{32}$/.test(value))
      return notify("Paste a valid share link or token.", {
        variant: "danger",
      });
    navigate("/share/" + value);
    setToken("");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={"sidebar" + (mobileOpen ? " is-open" : "")}>
        <Brand light />
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink to="/dashboard">
            <Icon name="grid" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/files">
            <Icon name="folder" />
            <span>My files</span>
            <span className="nav-count">{files.length}</span>
          </NavLink>
          <NavLink to="/links">
            <Icon name="link" />
            <span>Shared links</span>
            <span className="nav-count">
              {
                links.filter(
                  (link) =>
                    !link.isRevoked && new Date(link.expiresAt) > new Date()
                ).length
              }
            </span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="shield" size={25} />
            <h3>Private by design.</h3>
            <p>Your files are encrypted at rest. You decide who gets access.</p>
            <span>
              AES-256-GCM <Icon name="check" size={13} />
            </span>
          </div>
          <button
            className="account-row"
            onClick={handleLogout}
            disabled={leaving}
            aria-label="Sign out"
          >
            <span className="avatar">
              {(user.name || user.email)[0].toUpperCase()}
            </span>
            <span className="account-text">
              <strong>{user.name || user.email.split("@")[0]}</strong>
              <small>{user.email}</small>
            </span>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>{title}</strong>
          </div>
          <div className="header-actions">
            <span className="secure-status">
              <span />
              Private workspace
            </span>
            <button
              className="btn btn--primary btn--small"
              onClick={() => setUploadOpen(true)}
            >
              <Icon name="plus" size={16} />
              Upload file
            </button>
          </div>
        </header>
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="main-content"
        >
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
        <footer className="workspace-footer">
          <span>
            ZeroTrust Vault <span className="footer-dot">·</span> Your files.
            Your control.
          </span>
          <form className="open-link" onSubmit={openLink}>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-label="Open a share link"
              placeholder="Have a share link? Paste it here"
            />
            <button aria-label="Open share link">
              <Icon name="arrow" size={16} />
            </button>
          </form>
        </footer>
      </div>
      <VaultDialogs />
    </div>
  );
}

export default function AppLayout() {
  const { user, loading, error, check, signedOut } = useAuth();
  const location = useLocation();
  if (loading) return <Loading full />;
  if (error)
    return (
      <div className="public-page">
        <Brand />
        <ErrorState message={error} onRetry={check} />
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={signedOut ? null : { from: location.pathname }}
        replace
      />
    );
  return (
    <VaultProvider key={user.id}>
      <Shell />
    </VaultProvider>
  );
}
