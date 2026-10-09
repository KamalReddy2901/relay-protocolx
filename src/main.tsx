import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
  return <main><header>Relay</header><p className="eyebrow">Development checkpoint · CP0</p><h1>What did you miss?</h1><p>Know what changed, what you need to do, and which messages prove it.</p><section aria-labelledby="status"><h2 id="status">The deployment shell is ready.</h2><p>Chat import and AI processing are not implemented at this checkpoint. This page is not submission-ready.</p></section></main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
