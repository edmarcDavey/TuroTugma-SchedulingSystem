export default function Header() {
  return (
    <header style={{ width: '100%', padding: '18px 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '48px', height: 56 }}>
        <img src="/turotugma-logo.png" alt="TuroTugma Logo" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} />
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#1a3a8c', lineHeight: '44px', display: 'block' }}>TuroTugma</span>
      </div>
    </header>
  );
}
