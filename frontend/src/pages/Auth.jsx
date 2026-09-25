import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { Brand } from "../components/AppLayout";
import Icon from "../components/Icon";
import { Loading } from "../components/State";
export default function Auth({ signup = false }) {
  const { user, loading, authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const destination = ["/dashboard", "/files", "/links"].includes(
    location.state?.from,
  )
    ? location.state.from
    : "/dashboard";
  useEffect(() => {
    document.title = (signup ? "Create account" : "Sign in") + " · ZeroTrust";
  }, [signup]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authenticate(signup ? "signup" : "login", {
        name,
        email,
        password,
      });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading full />;
  if (user) return <Navigate to={destination} replace />;
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <span className="eyebrow eyebrow--mint">
            <span className="status-dot" />A LITTLE MORE PEACE OF MIND
          </span>
          <h1>
            Keep it private.
            <br />
            <span>Share with confidence.</span>
          </h1>
          <p>
            A quiet, secure home for your important files.
            <br />
            Protected from the moment they arrive.
          </p>
          <div className="vault-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="vault-core">
              <Icon name="shield" size={74} />
            </div>
            <div className="floating-tag tag-top">
              <Icon name="lock" size={16} />
              Encrypted at rest
            </div>
            <div className="floating-tag tag-bottom">
              <Icon name="check" size={16} />
              Access under your control
            </div>
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
          </div>
          <div className="auth-features">
            <span>
              <Icon name="lock" size={17} />
              AES-256 encryption
            </span>
            <span>
              <Icon name="clock" size={17} />
              Expiring links
            </span>
            <span>
              <Icon name="shield" size={17} />
              Revoke anytime
            </span>
          </div>
        </div>
        <p className="auth-story-footer">Your files. Your control. Always.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-switch">
          {signup ? "Already have an account?" : "New to ZeroTrust?"}{" "}
          <Link to={signup ? "/login" : "/signup"} state={location.state}>
            {signup ? "Sign in" : "Create an account"}{" "}
            <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div
          className="auth-form-wrap page-transition"
          key={signup ? "signup" : "login"}
        >
          <div className="auth-heading-icon">
            <Icon name={signup ? "shield" : "lock"} size={25} />
          </div>
          <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
          <h2>{signup ? "A safer place for your files." : "Welcome back."}</h2>
          <p>
            {signup
              ? "Create your account and make room for peace of mind."
              : "Sign in to your vault. Everything is right where you left it."}
          </p>
          <form className="form-stack" onSubmit={submit}>
            {signup && (
              <label className="field">
                <span>Your name</span>
                <input
                  className="text-input"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                className="text-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <span className="password-input">
                <input
                  className="text-input"
                  type={visible ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={signup ? 8 : undefined}
                  maxLength={72}
                  placeholder={
                    signup ? "At least 8 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                >
                  <Icon name="eye" size={18} />
                </button>
              </span>
            </label>
            {error && (
              <div className="field-error" role="alert">
                <Icon name="alert" size={17} />
                {error}
              </div>
            )}
            <button
              className="btn btn--primary btn--full btn--large"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="spinner spinner--small" />
                  {signup ? "Creating your vault…" : "Signing in…"}
                </>
              ) : (
                <>
                  {signup ? "Create your account" : "Sign in to your vault"}
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </form>
          <div className="auth-assurance">
            <Icon name="lock" size={15} />
            <span>Your session is private and protected.</span>
          </div>
        </div>
        <p className="auth-panel-footer">
          Built for the things you want to keep to yourself.
        </p>
      </section>
    </div>
  );
}
