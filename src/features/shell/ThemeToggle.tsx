import { IonIcon } from '@ionic/react';
import { contrastOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { useTheme } from './useTheme';
import type { ThemeMode } from './themeMode';
import './themeToggle.css';

const OPTIONS: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light', icon: sunnyOutline, label: 'Light' },
  { mode: 'dark', icon: moonOutline, label: 'Dark' },
  { mode: 'system', icon: contrastOutline, label: 'System' },
];

/** A small Light / Dark / System switch for the toolbar. Persists via useTheme;
 * the actual light/dark tokens follow the resolved scheme in variables.css. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.mode}
          className={opt.mode === mode ? 'theme-toggle__btn is-active' : 'theme-toggle__btn'}
          aria-pressed={opt.mode === mode}
          aria-label={opt.label}
          data-testid={`theme-${opt.mode}`}
          onClick={() => setMode(opt.mode)}
        >
          <IonIcon icon={opt.icon} />
        </button>
      ))}
    </div>
  );
}
