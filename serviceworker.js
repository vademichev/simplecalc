// Версия кэша — меняйте при обновлении контента
const CACHE_NAME = 'sw-simplecalc-v1';

// Список файлов для кэширования при установке
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'logo192.png',
  'logo512.png'
];

// Установка: кэшируем ресурсы
self.addEventListener('install', function(event) {
  event.waitUntil((async function() { // Ждать пока не разрешится промис
    let cache = await caches.open(CACHE_NAME); // Открываем кэш (ждем когда разрешится caches.open)
    await cache.addAll(FILES_TO_CACHE); // Ждем пока в кэш загрузятся все файлы
  })());
});

// Активация: удаляем старые кэши и захватываем клиенты
self.addEventListener('activate', function(event) { // Срабатывает когда sw первый раз запускается
  event.waitUntil((async function() { // нужно для обновления
    let cacheNames = await caches.keys(); // Получаем все кеши которые зарегистрированы
    await Promise.all( // Чистим все кэши
      cacheNames.map(function(name) {
        if (name !== CACHE_NAME) {
          return caches.delete(name);
        }
      })
    );
    self.clients.claim(); // Говорим, что этот сервисворкер будет работать со всеми клиентами
  })());
});

// Перехват запросов - обработчик события fetch
self.addEventListener('fetch', function(event) {
  // Игнорируем не-GET и внешние запросы
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith((async function() {
    try {
      // Сначала пробуем загрузить из сети
      let networkResponse = await fetch(event.request);
      if (networkResponse.status === 200) {
        // Сохраняем успешный ответ в кэш
        let cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      // Если нет сети — отдаём из кэша
      let cachedResponse = await caches.match(event.request);
      return cachedResponse || new Response('Нет интернета и нет кэша', { status: 500 });
    }
  })());
});