import './i18n.js';

import { createRoot } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import App from './App.jsx';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <MantineProvider>
    <Notifications position="top-right" />

    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>,
);