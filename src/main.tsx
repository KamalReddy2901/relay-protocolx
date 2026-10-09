import '@fontsource-variable/bricolage-grotesque/index.css';
import '@fontsource/atkinson-hyperlegible/latin-400.css';
import '@fontsource/atkinson-hyperlegible/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';

// CP1 debug view, reachable only at #probe. To be removed or hidden before the CP3 package.
const Probe = lazy(() => import('./probe/Probe').then((m) => ({ default: m.Probe })));

const showProbe = window.location.hash === '#probe';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showProbe ? (
      <Suspense fallback={<p>Loading probe…</p>}>
        <Probe />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
