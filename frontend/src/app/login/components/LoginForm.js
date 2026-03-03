import { useState } from "react";
import "./LoginForm.css";
import { getSystemSnapshot } from "../../dashboard/analyticsData";

export default function LoginForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const snapshot = getSystemSnapshot();

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 900);
  };

  return (
    <div className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-glow login-brand-glow-top" />
        <div className="login-brand-glow login-brand-glow-bottom" />

        <div className="login-brand-top">
          <div className="login-brand-logo-wrap">
            <img src="/turotugma-logo.png" alt="TuroTugma" className="login-brand-logo" />
            <div>
              <p className="login-brand-name">TuroTugma</p>
              <p className="login-brand-subtitle">School Timetable Management System</p>
            </div>
          </div>
        </div>

        <div className="login-brand-quote-wrap">
          <div className="login-brand-line" />
          <p className="login-brand-quote">
            "Every teacher in the right section, at the right time — automatically."
          </p>
          <p className="login-brand-caption">TUROTUGMA SCHEDULING ENGINE</p>
        </div>

        <div className="login-brand-stats">
          <div className="login-brand-stat">
            <p className="login-brand-stat-value">{snapshot.activeTeachers}</p>
            <p className="login-brand-stat-label">Teachers</p>
          </div>
          <div className="login-brand-stat">
            <p className="login-brand-stat-value">{snapshot.totalSections}</p>
            <p className="login-brand-stat-label">Sections</p>
          </div>
          <div className="login-brand-stat">
            <p className="login-brand-stat-value">{snapshot.totalSubjects}</p>
            <p className="login-brand-stat-label">Subjects</p>
          </div>
        </div>
      </aside>

      <section className="login-form-panel">
        <div className="login-form-shell">
          <a href="/" className="login-back-link">← Back to Homepage</a>
          <h1 className="login-title">Admin Login</h1>
          <p className="login-subtitle">Enter your administrator credentials to continue.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="employeeId">Employee ID</label>
            <input
              id="employeeId"
              type="text"
              className="login-input"
              placeholder="e.g. EMP001"
              autoComplete="username"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            />

            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="login-input login-input-password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <div className="login-demo-box">
              <p className="login-demo-title">Demo Credentials</p>
              <p>Admin: EMP001 / admin123</p>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Authenticating..." : "→ Sign In"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
