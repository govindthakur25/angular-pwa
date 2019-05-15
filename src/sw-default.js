// Let's use the local version of Workbox instead of CDN
importScripts('workbox-v4.3.1/workbox-sw.js');

// SETTINGS

// Path prefix to load modules locally
workbox.setConfig({
  modulePathPrefix: 'workbox-v4.3.1/'
});

// Turn on logging
workbox.setConfig({
  debug: true
});

// Modify SW update cycle
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// PRECACHING

// We inject manifest here using "workbox-build" in workbox-build-inject.js
workbox.precaching.precacheAndRoute([]);

// Registering a broadcast update plugin
workbox.precaching.addPlugins([
  new workbox.broadcastUpdate.Plugin({
    channelName: 'app-shell'
  })
]);

// RUNTIME CACHING

// Google fonts
workbox.routing.registerRoute(
  new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'googleapis',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 30
      })
    ]
  })
);

// API with network-first strategy
workbox.routing.registerRoute(
  /(http[s]?:\/\/)?([^\/\s]+\/)timeline/,
  new workbox.strategies.NetworkFirst()
);

// API with cache-first strategy
workbox.routing.registerRoute(
  /(http[s]?:\/\/)?([^\/\s]+\/)favorites/,
  new workbox.strategies.CacheFirst()
);

// PUSH NOTIFICATIONS

// Receive push and show a notification
self.addEventListener('push', function(event) {
  console.log('[Service Worker]: Received push event', event);

  var notificationData = {};

  if (event.data.json()) {
    notificationData = event.data.json().notification;
  } else {
    notificationData = {
      title: 'Something Has Happened',
      message: 'Something you might want to check out',
      icon: '/assets/images/logo.png'
    };
  }

  self.registration.showNotification(notificationData.title, notificationData);
});

// Custom notification actions
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker]: Received notificationclick event');

  event.notification.close();

  if (event.action == 'opentweet') {
    console.log('[Service Worker]: Performing action opentweet');

    event.waitUntil(
      clients.openWindow(event.notification.data).then(function(windowClient) {
        // do something with the windowClient.
      })
    );
  } else {
    console.log('[Service Worker]: Performing default click action');

    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          includeUncontrolled: true,
          type: 'window'
        })
        .then(function(clientList) {
          for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url == '/' && 'focus' in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow('/');
        })
    );
  }
});

// Closing notification action
self.addEventListener('notificationclose', function(event) {
  log('[Service Worker]: Received notificationclose event');
});

// BACKGROUND SYNC

// Registering a route for retries
workbox.routing.registerRoute(
  /(http[s]?:\/\/)?([^\/\s]+\/)post-tweet/,
  new workbox.strategies.NetworkOnly({
    plugins: [
      new workbox.backgroundSync.Plugin('tweetsQueue', {
        maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
      })
    ]
  }),
  'POST'
);

// GOOGLE ANALYTICS
