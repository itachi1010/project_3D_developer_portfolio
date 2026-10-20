import { useEffect, useRef, useState } from 'react';

async function request(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('/api/game/sessions' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal, cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
    return data;
  } finally { clearTimeout(timeout); }
}

function release(token) {
  const body = JSON.stringify({ token });
  if (navigator.sendBeacon?.('/api/game/sessions/release', new Blob([body], { type: 'application/json' }))) return;
  fetch('/api/game/sessions/release', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

export default function GamePlayer({ onClose }) {
  const dialog = useRef(null);
  const stage = useRef(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true });
  const [scale, setScale] = useState(0.7);

  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; element.close(); opener?.focus(); };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 960)));
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true, token, renewTimer, expiryTimer, expires = 0;
    const stop = message => {
      clearInterval(renewTimer); clearInterval(expiryTimer);
      if (token) { release(token); token = null; }
      if (active) setState({ error: message });
    };
    const pageHide = () => stop('Your play window closed. Request a new one to continue.');
    const checkExpiry = () => { if (token && Date.now() >= expires) stop('Your session expired. Request a new play window.'); };
    setState({ loading: true });
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('focus', checkExpiry);
    document.addEventListener('visibilitychange', checkExpiry);
    (async () => {
      try {
        const started = Date.now();
        const session = await request('', {});
        if (!active) { release(session.token); return; }
        token = session.token;
        expires = started + session.expiresIn * 1000 - 5000;
        setState({ embedUrl: session.embedUrl });
        window.dispatchEvent(new Event('portfolio-game-start'));
        let renewing = false;
        renewTimer = setInterval(async () => {
          checkExpiry();
          if (!token || renewing) return;
          renewing = true;
          const currentToken = token, sentAt = Date.now();
          try {
            const renewed = await request('/heartbeat', { token: currentToken });
            if (active && token === currentToken) expires = sentAt + renewed.expiresIn * 1000 - 5000;
          } catch (error) { if (active && token === currentToken) stop(error.message); }
          finally { renewing = false; }
        }, 20000);
        expiryTimer = setInterval(checkExpiry, 1000);
      } catch (error) { if (active) setState({ error: error.name === 'AbortError' ? 'Connection timed out. Please try again.' : error.message }); }
    })();
    return () => {
      active = false; clearInterval(renewTimer); clearInterval(expiryTimer);
      window.removeEventListener('pagehide', pageHide); window.removeEventListener('focus', checkExpiry);
      document.removeEventListener('visibilitychange', checkExpiry);
      if (token) release(token);
    };
  }, [attempt]);

  return <dialog className='game-dialog' ref={dialog} aria-labelledby='game-title' onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><p className='eyebrow'>A QUICK PLAY BREAK</p><h2 id='game-title'>Waffles Runner</h2></div><button type='button' onClick={onClose} aria-label='Close game'>Close <span aria-hidden='true'>×</span></button></header>
    <p className='game-note'>Up to 3 play windows at once · 15-minute sessions · Keyboard recommended</p>
    <div ref={stage} className='game-stage' style={{ height: Math.max(180, 638 * scale) }}>
      {state.embedUrl ? <iframe title='Waffles Runner game' src={state.embedUrl}
        style={{ transform: `scale(${scale})` }} allow='autoplay; fullscreen; gamepad' allowFullScreen />
        : <div className='game-message' role='status'><p>{state.loading ? 'Checking for a free play window…' : state.error}</p>{!state.loading && <button className='button-primary' type='button' onClick={() => setAttempt(value => value + 1)}>Try again</button>}</div>}
    </div>
    <p className='game-footnote'>Hosted on itch.io. Close this window when you finish to free your place.</p>
  </dialog>;
}
