import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import App from './App.jsx';

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
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  );
};

export default init;