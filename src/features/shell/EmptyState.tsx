import { IonIcon } from '@ionic/react';
import type { ReactNode } from 'react';
import './emptyState.css';

/** Centered empty/placeholder state: icon, message, and optional action slot. */
export function EmptyState({
  icon,
  title,
  message,
  children,
  testId,
}: {
  icon: string;
  title: string;
  message?: string;
  children?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="empty-state" data-testid={testId}>
      <div className="empty-state__icon" aria-hidden="true">
        <IonIcon icon={icon} />
      </div>
      <p className="sk-heading empty-state__title">{title}</p>
      {message && <p className="sk-muted empty-state__message">{message}</p>}
      {children}
    </div>
  );
}
