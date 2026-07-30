import React from 'react';
import { createRoot } from 'react-dom/client';
import './lib/amplify';
import { applyThemeMode } from './features/shell/useTheme';
import { parseThemeMode } from './features/shell/themeMode';
import App from './App';

// Apply the saved theme before first paint so there's no light/dark flash.
applyThemeMode(parseThemeMode(localStorage.getItem('stickies:theme')));

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
