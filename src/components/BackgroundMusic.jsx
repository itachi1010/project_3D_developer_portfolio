import { useEffect, useRef, useState } from 'react';

const volumeKey = 'portfolio-music-volume';
function savedVolume() {
  try {
    const stored = localStorage.getItem(volumeKey);
    const value = Number(stored);
    if (stored !== null && Number.isFinite(value) && value >= 0 && value <= 1) return value;
  } catch { /* Storage may be unavailable in a private browsing session. */ }
  return 0.15;
}

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const wanted = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(savedVolume);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;
    try { localStorage.setItem(volumeKey, String(volume)); } catch { /* Optional preference. */ }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const pauseForGame = () => { wanted.current = false; audio.pause(); setLoading(false); };
    window.addEventListener('portfolio-game-start', pauseForGame);
    return () => { window.removeEventListener('portfolio-game-start', pauseForGame); wanted.current = false; audio.pause(); };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    wanted.current = !wanted.current;
    if (!wanted.current) {
      audio.pause();
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    // Set the source only after a deliberate click: no audio download on page load.
    if (!audio.getAttribute('src')) audio.src = '/audio/gymnopedie-no-1.mp3';
    try {
      await audio.play();
      if (!wanted.current) audio.pause();
    } catch {
      if (wanted.current) {
        wanted.current = false;
        setError('Music could not play. Please try again.');
      }
    } finally { setLoading(false); }
  }

  return <aside className='background-music' aria-label='Background music'>
    <audio ref={audioRef} loop preload='none'
      onPlay={() => { if (wanted.current) setPlaying(true); else audioRef.current.pause(); }}
      onPause={() => setPlaying(false)}
      onError={() => { wanted.current = false; setPlaying(false); setLoading(false); setError('Music is unavailable. Please try again later.'); }} />
    <button className='music-toggle' type='button' onClick={toggle}
      aria-pressed={playing} aria-label={playing || loading ? 'Pause background music' : 'Play background music'}>
      <span aria-hidden='true'>{playing || loading ? 'Ⅱ' : '♫'}</span>
      {loading ? 'Loading…' : playing ? 'Pause music' : 'Play music'}
    </button>
    <details className='music-settings'>
      <summary aria-label='Music volume and track information'>Settings</summary>
      <div className='music-panel'>
        <p className='music-track'>A little piano, if you like.</p>
        <label htmlFor='music-volume'>Volume <span>{Math.round(volume * 100)}%</span></label>
        <input id='music-volume' type='range' min='0' max='1' step='0.01' value={volume}
          onChange={event => setVolume(Number(event.target.value))} />
        <p>Gymnopédie No. 1 · Erik Satie</p>
        <a href='/credits.html'>Recording &amp; public-domain credit ↗</a>
      </div>
    </details>
    <span className='music-error' role='status'>{error}</span>
  </aside>;
}
