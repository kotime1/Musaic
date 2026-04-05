import Callback from './pages/Callback.jsx';
import Builder from './pages/Builder.jsx';
import Landing from './pages/Landing.jsx';
import { getAccessToken, isTokenExpired } from './lib/spotify.js';
import './styles/global.css';

export default function App() {
  const path = window.location.pathname;
  if (path === '/callback') return <Callback />;
  const isAuthed = getAccessToken() && !isTokenExpired();
  if (isAuthed) return <Builder />;
  return <Landing />;
}
