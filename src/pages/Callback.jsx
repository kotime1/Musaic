import { useEffect } from 'react';
import { exchangeCodeForToken } from '../lib/spotify.js';

export default function Callback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      window.location.href = '/?auth_error=' + error;
      return;
    }

    if (code) {
      exchangeCodeForToken(code)
        .then(() => {
          window.location.href = '/';
        })
        .catch(err => {
          console.error('Token exchange failed:', err);
          window.location.href = '/?auth_error=token_exchange_failed';
        });
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0f',
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: '1rem',
      letterSpacing: '0.05em',
    }}>
      Connecting to Spotify…
    </div>
  );
}
