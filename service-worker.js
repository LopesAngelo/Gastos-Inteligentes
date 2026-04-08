// SERVICE WORKER — PWA + NOTIFICAÇÕES PUSH
const CACHE_NAME = 'gastos-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/styles-adicionais.css',
    '/dados.js',
    '/gastos.js',
    '/dashboard.js',
    '/graficos.js',
    '/melhorias.js',
    '/ia-categorizacao.js',
    '/perfil.js',
    '/historico-mensal.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// ============================================
// INSTALAÇÃO
// ============================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// ============================================
// ATIVAÇÃO — LIMPAR CACHES ANTIGOS
// ============================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(names.map(name => name !== CACHE_NAME ? caches.delete(name) : null)))
            .then(() => self.clients.claim())
    );
});

// ============================================
// FETCH — CACHE FIRST, NETWORK FALLBACK
// ============================================
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request).catch(() =>
                event.request.mode === 'navigate'
                    ? caches.match('/index.html')
                    : new Response('Offline', { status: 503 })
            ))
    );
});

// ============================================
// NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: 'Gastos Inteligente', body: 'Nova atualização disponível' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            data: data.url || '/'
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});

// ============================================
// SYNC — SINCRONIZAR QUANDO VOLTAR ONLINE
// ============================================
self.addEventListener('sync', event => {
    if (event.tag === 'sync-gastos') {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: 'SYNC_REQUEST' }));
            })
        );
    }
});
