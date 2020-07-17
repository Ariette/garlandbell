const CACHE = ['v3'];
const refreshFiles = ['fish.min.js', 'gt.bell.min.js', 'locale-ko.min.js', 'nodes.min.js', 'timers.min.js', 'index.html','style.css','manifest.json'];

// On install, cache some resources.
self.addEventListener('install', function(event) {
  console.log('The service worker is being installed.');
  self.skipWaiting();

  // Ask the service worker to keep installing until the returning promise resolves.
  event.waitUntil(async function () {
      return caches.open(CACHE).then(function (cache) {
        // Open a cache and use `addAll()` with an array of assets to add all of them to the cache. Return a promise resolving when all the assets are added.
        return cache.addAll(['./index.html']);
    });
  }());

});

self.addEventListener('activate', event => {
  // delete any caches that aren't in CACHE
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (!CACHE.includes(key)) {
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('Unused cache deleted.');
    })
  );
});


self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);
  // Routing for local URLs
  if (requestURL.origin == location.origin) {
    if (endsWithAny(refreshFiles, requestURL.pathname)) {
      // Network first and Falling back to cache strategy.
      event.respondWith(async function() {
        try {
          const response = await fetch(event.request);
          SaveCache(event.request,response); // Update cache whenever cache is available or not.
          return response; // Load network first.
        } catch (err) {
          const cachedResponse = await caches.match(event.request); // Falling back to cache.
          return cachedResponse;
        }
      }());
    }
    else {
      // Cache first and Falling back to network strategy.
      event.respondWith(async function() {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
            return cachedResponse; // Load cache first.
        }
        const response = await fetch(event.request);
        SaveCache(event.request,response); // Update cache when it is not available.
        return response;
      }());
    }
  } else {
    // Network only strategy for external fetch event.
    return event.respondWith(fetch(event.request));
  }
});

async function SaveCache(request, response) {
  const res = response.clone();
  const cache = await caches.open(CACHE);
  return cache.put(request, res);
}

function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}