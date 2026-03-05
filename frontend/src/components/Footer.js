export default function Footer() {
  return (
    <footer style={{ width: '100%', background: '#fff', borderTop: '1px solid #ececec', padding: '18px 0', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 500 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        {/* Left: Copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/turotugma-logo.png" alt="TuroTugma Logo" style={{ width: 38, height: 38, objectFit: 'contain', marginRight: 6 }} />
          <span style={{ fontWeight: 700, fontSize: 22, color: '#1a3a8c' }}>TuroTugma</span>
          <span style={{ color: '#888', fontSize: 15 }}>© {new Date().getFullYear()} TuroTugma. All rights reserved.</span>
        </div>
        {/* Center: Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/" style={{ color: '#888', textDecoration: 'none', fontSize: 15 }}>Home</a>
          <a href="/public-dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 15 }}>Public Dashboard</a>
          <a href="/login" style={{ color: '#888', textDecoration: 'none', fontSize: 15 }}>Staff Login</a>
          <a href="/privacy" style={{ color: '#888', textDecoration: 'none', fontSize: 15 }}>Privacy</a>
          <a href="/terms" style={{ color: '#888', textDecoration: 'none', fontSize: 15 }}>Terms</a>
        </nav>
        {/* Right: Icon Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: '#ececec', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }} title="Website">
            <span role="img" aria-label="Globe" style={{ fontSize: 20, color: '#888' }}>🌐</span>
          </button>
          <button style={{ background: '#ececec', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }} title="Email">
            <span role="img" aria-label="Mail" style={{ fontSize: 20, color: '#888' }}>✉️</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
