import { Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './features/shell/useTheme';
import { ErrorBoundary } from './features/shell/ErrorBoundary';
import { DeepLinks } from './features/shell/DeepLinks';
import { Toast } from './features/shell/Toast';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Design tokens */
import './theme/variables.css';

setupIonicReact();

/** Stickies is a two-route SPA: the home explainer (/) and a room pad (/:room).
 * A room slug is just a URL segment — no entity has to exist for a route to
 * work. Routes are DIRECT children of IonRouterOutlet (it only matches those). */
const App: React.FC = () => (
  <IonApp>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <IonReactRouter>
          <DeepLinks />
          <ErrorBoundary>
            <IonRouterOutlet>
              <Route exact path="/">
                <HomePage />
              </Route>
              <Route exact path="/:room">
                <RoomPage />
              </Route>
            </IonRouterOutlet>
          </ErrorBoundary>
          <Toast />
        </IonReactRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </IonApp>
);

export default App;
