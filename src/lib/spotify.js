// ─── Spotify OAuth (PKCE) + API ───────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback';
const SCOPES = ['user-top-read'].join(' ');

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map(v => chars[v % chars.length]).join('');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64URLEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

export async function redirectToSpotifyLogin() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(hashed);

  sessionStorage.setItem('code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  const codeVerifier = sessionStorage.getItem('code_verifier');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) throw new Error('Token exchange failed');

  const data = await response.json();
  storeTokens(data);
  return data;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new Error('Token refresh failed');

  const data = await response.json();
  storeTokens(data);
  return data.access_token;
}

function storeTokens({ access_token, refresh_token, expires_in }) {
  localStorage.setItem('access_token', access_token);
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
  localStorage.setItem('token_expires_at', Date.now() + expires_in * 1000);
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function isTokenExpired() {
  const expiresAt = localStorage.getItem('token_expires_at');
  return !expiresAt || Date.now() > parseInt(expiresAt) - 60_000;
}

export function clearTokens() {
  ['access_token', 'refresh_token', 'token_expires_at'].forEach(k =>
    localStorage.removeItem(k)
  );
}

// ── API client ────────────────────────────────────────────────────────────────

async function spotifyFetch(path) {
  let token = getAccessToken();

  if (isTokenExpired()) {
    token = await refreshAccessToken();
  }

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Spotify API error: ${res.status} ${path}`);
  return res.json();
}

// ── Data fetching ─────────────────────────────────────────────────────────────

/**
 * Fetch top tracks and extract unique albums, sorted by frequency.
 * time_range: 'short_term' | 'medium_term' | 'long_term'
 */
export async function getTopAlbums(timeRange = 'medium_term', limit = 50) {
  const data = await spotifyFetch(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  );

  const albumMap = new Map();

  for (const track of data.items) {
    const { album } = track;
    if (!albumMap.has(album.id)) {
      albumMap.set(album.id, {
        id: album.id,
        name: album.name,
        artist: album.artists[0]?.name ?? '',
        imageUrl: album.images[0]?.url ?? null,
        count: 1,
      });
    } else {
      albumMap.get(album.id).count++;
    }
  }

  return Array.from(albumMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * Fetch top artists with images.
 */
export async function getTopArtists(timeRange = 'medium_term', limit = 50) {
  const data = await spotifyFetch(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  );

  return data.items.map(artist => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images[0]?.url ?? null,
  }));
}
