/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service Worker: Football AI Engine Background Push Notifications & Sync
 * Handles background push notifications, sound triggers, and action clicks
 * even when the web application tab is closed or in the background.
 */

const CACHE_NAME = 'predictpro-v1';

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Event: Received from Web Push Server
self.addEventListener('push', (event) => {
  let data = {
    title: '⚽ PredictPro Value Bet & Match Alert',
    body: 'High-confidence AI value bet identified for today.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'live-alert-' + Date.now(),
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'predictpro-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [250, 100, 250, 100, 250],
    data: data.data || { url: '/' },
    actions: [
      { action: 'view', title: '👁️ View Prediction' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background Sync Event for periodic match & value bet checking
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-live-matches' || event.tag === 'sync-value-bets') {
    event.waitUntil(
      fetch('/api/automation/alerts')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.alerts && data.alerts.length > 0) {
            const latest = data.alerts[0];
            return self.registration.showNotification(latest.title || '🎯 PredictPro Value Alert', {
              body: latest.body || 'New high-edge mathematical opportunity verified.',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: latest.id || 'alert-' + Date.now(),
              vibrate: [200, 100, 200],
              data: { url: '/' }
            });
          }
        })
        .catch(() => {})
    );
  }
});

// Periodic Background Sync Event (Supported on Android Chrome PWA when app is closed)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-value-bets' || event.tag === 'get-latest-matches') {
    event.waitUntil(
      fetch('/api/automation/alerts')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.alerts && data.alerts.length > 0) {
            const latest = data.alerts[0];
            return self.registration.showNotification(latest.title || '🎯 PredictPro Value Alert', {
              body: latest.body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: latest.id,
              vibrate: [200, 100, 200],
              data: { url: '/' }
            });
          }
        })
        .catch(() => {})
    );
  }
});
