import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import './sentry.js';
import './i18n.js';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const init = async () => {
  const queryClient = new QueryClient();

  return (
    <MantineProvider>
      <Notifications position="top-right" />

      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<ChatPage />}
            />

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/404"
              element={<NotFoundPage />}
            />

            <Route
              path="*"
              element={<Navigate to="/404" replace />}
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
};

export default init;