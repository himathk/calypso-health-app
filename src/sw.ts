/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// SPA: serve the cached shell for navigations when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match('/index.html', { ignoreSearch: true })) ?? Response.error()),
  );
});

/**
 * Notification buttons ("Drank 250 ml", "Did it", "Snooze") are handled by the app,
 * so focus an open window and forward the action — or open one with the action in the URL.
 */
self.addEventListener('notificationclick', (event) => {
  const data = (event.notification.data ?? {}) as { id?: string; kind?: string };
  const action = event.action || 'open';
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const message = { type: 'calypso-reminder-action', action, id: data.id, kind: data.kind };
      const client = windows[0];
      if (client) {
        client.postMessage(message);
        if ('focus' in client) await (client as WindowClient).focus().catch(() => undefined);
        return;
      }
      const params = new URLSearchParams({ action, kind: data.kind ?? '', id: data.id ?? '' });
      await self.clients.openWindow(`/?${params.toString()}`);
    })(),
  );
});
