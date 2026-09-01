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
    title: '⚽ Football AI Alert',
    body: 'New match update available.',
    icon: 'https://ui-avatars.com/api/?name=AI&background=10b981&color=ffffff&bold=true&rounded=true',
    badge: 'https://ui-avatars.com/api/?name=FT&background=059669&color=ffffff&bold=true',
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
    icon: data.icon || 'https://ui-avatars.com/api/?name=AI&background=10b981&color=ffffff&bold=true&rounded=true',
    badge: data.badge || 'https://ui-avatars.com/api/?name=FT&background=059669&color=ffffff&bold=true',
    tag: data.tag || 'general-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || { url: '/' },
    actions: [
      { action: 'view', title: '👁️ View Match' },
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

// Background Sync Event for periodic match checking
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-live-matches') {
    event.waitUntil(
      fetch('/api/automation/alerts')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.alerts && data.alerts.length > 0) {
            const latest = data.alerts[0];
            return self.registration.showNotification(latest.title, {
              body: latest.body,
              icon: 'https://ui-avatars.com/api/?name=AI&background=10b981&color=ffffff&bold=true&rounded=true',
              tag: latest.id,
              data: { url: '/' }
            });
          }
        })
        .catch(() => {})
    );
  }
});
