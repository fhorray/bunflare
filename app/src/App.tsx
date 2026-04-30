import { useState, useEffect } from 'react';
import logo from '../public/logo.svg';

export function App() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch status:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <img src={logo} style={styles.logo} alt="logo" />
        <h1 style={styles.title}>Bunflare + React!</h1>
        <p style={styles.subtitle}>Fullstack Bun APIs on Cloudflare Workers</p>
      </header>

      <main style={styles.main}>
        {loading ? (
          <p>Loading API status...</p>
        ) : status ? (
          <div style={styles.card}>
            <h3>Backend Status</h3>
            <p>
              <strong>Status:</strong> {status.status}
            </p>
            <p>
              <strong>SQLite:</strong> {status.sqlite}
            </p>
            <p>
              <strong>Runtime:</strong> {status.runtime}
            </p>
            <p style={styles.timestamp}>
              Last update: {new Date(status.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p style={{ color: 'red' }}>Error connecting to API</p>
        )}
      </main>

      <footer style={styles.footer}>Built with 🧡 by Bunflare</footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#0a0a0a',
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  logo: {
    width: '120px',
    height: '120px',
    marginBottom: '1rem',
    animation: 'pulse 2s infinite ease-in-out',
  },
  title: {
    fontSize: '3rem',
    margin: 0,
    background: 'linear-gradient(90deg, #ff8800, #ffcc00)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#888',
    fontSize: '1.2rem',
  },
  main: {
    width: '100%',
    maxWidth: '400px',
  },
  card: {
    background: '#151515',
    padding: '1.5rem',
    borderRadius: '1rem',
    border: '1px solid #333',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  timestamp: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '1rem',
  },
  footer: {
    marginTop: '4rem',
    color: '#444',
    fontSize: '0.9rem',
  },
};
