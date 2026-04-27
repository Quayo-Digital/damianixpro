import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { SecurityHeaders } from '@/utils/security';
import { warnOnLegacyFrontendSecrets } from '@/utils/envWarnings';

// Apply runtime security meta tags (production only; no-op in local dev)
if (typeof document !== 'undefined') {
  SecurityHeaders.applyHeaders();
}

warnOnLegacyFrontendSecrets();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
