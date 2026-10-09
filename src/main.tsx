import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
const Probe = lazy(() => import('./probe/Probe').then((m) => ({ default: m.Probe })));

function Shell() {
  return (
    <main>
      <header>Relay</header>
      <p className="eyebrow">Development checkpoint · CP1</p>
      <h1>What did you miss?</h1>
      <p>Know what changed, what you need to do, and which messages prove it.</p>
      <section aria-labelledby="status">
        <h2 id="status">The model probe is being verified.</h2>
        <p>Chat import and the catch-up brief are not wired yet. This page is not submission-ready.</p>
      </section>
    </main>
  );
}

const showProbe = window.location.hash === '#probe';
createRoot(document.getElementById('root')!).render(<StrictMode>{showProbe ? (
      <Suspense fallback={<p>Loading probe…</p>}>
        <Probe />
      </Suspense>
    ) : (
      <Shell />
    )}</StrictMode>);
