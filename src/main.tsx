import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Manage service worker registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In local dev server, clear stale registrations to avoid development caching collisions
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  } else {
    // In production, register Service Worker immediately for 100% offline capability across all browsers
    registerSW({
      immediate: true,
      onNeedRefresh() {
        // Auto-update to latest assets
      },
      onOfflineReady() {
        console.log('نظام إدارة المحلات جاهز للعمل بدون إنترنت بالكامل');
      },
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
