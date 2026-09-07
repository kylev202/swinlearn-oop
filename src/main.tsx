import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bundled, not fetched: the desktop build has to look right with the network
// unplugged, and a lab room's proxy is not the first thing a student should
// meet. Each import is the variable weight axis for the latin subset only.
import '@fontsource-variable/fraunces/soft.css';
import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/instrument-sans/wght-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/jetbrains-mono/wght-italic.css';

import { App } from './ui/App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
