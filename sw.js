const CACHE_NAME = 'family-acc-smart-cache';

// ۱. نصب و ذخیره فایل‌های اولیه
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['./', './index.html']);
    })
  );
});

// ۲. فعال‌سازی
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// ۳. رهگیری درخواست‌ها (استراتژی هوشمند)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // اگر درخواست برای باز کردن صفحه HTML است:
  // اول سعی کن از اینترنت بگیر (تا همیشه نسخه جدید باشه)، اگر نشد از کش بگیر (آفلاین)
  if (event.request.mode === 'navigate' || event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // برای بقیه فایل‌ها (مثل فونت)، اول از کش بگیر
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) return response;
        return fetch(event.request).then(fetchRes => {
          if (event.request.url.includes('vazirmatn') || event.request.url.includes('.woff')) {
            const resClone = fetchRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return fetchRes;
        });
      })
    );
  }
});