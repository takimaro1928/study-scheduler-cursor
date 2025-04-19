// src/serviceWorker.js
// このファイルはアプリケーションの完全オフライン動作を可能にするサービスワーカーを実装します

// キャッシュの名前（バージョン更新時に変更）
const CACHE_NAME = 'study-scheduler-cache-v1';

// キャッシュするアセット
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('Service Worker: インストール中...');
  
  // インストール完了までの処理を待機
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: キャッシュを開いています');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 新しいサービスワーカーをすぐにアクティブにする
  );
});

// アクティベーション時の処理
self.addEventListener('activate', (event) => {
  console.log('Service Worker: アクティブになりました');
  
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除しています', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // このサービスワーカーにコントロールを要求
  );
});

// フェッチイベントの処理（ネットワークリクエストの傍受）
self.addEventListener('fetch', (event) => {
  // API呼び出しやデータURLはキャッシュしない
  if (event.request.url.includes('/api/') || 
      event.request.url.startsWith('data:') ||
      event.request.url.startsWith('chrome-extension:')) {
    return;
  }
  
  event.respondWith(
    // ネットワーク優先戦略
    fetch(event.request)
      .then((response) => {
        // 有効なレスポンスのみキャッシュ
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // レスポンスをクローンしてキャッシュ（レスポンスは一度しか使えないため）
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        // ネットワークが利用できない場合はキャッシュから取得
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response; // キャッシュにある場合はそれを返す
            }
            
            // HTMLリクエストの場合はオフラインページを返す
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// プッシュ通知
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || '通知の内容',
    icon: '/logo192.png',
    badge: '/badge.png',
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '学習リマインダー', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // 通知がクリックされたときにアプリを開く
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
  );
});

// オフライン/オンラインの状態変化を検知
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ONLINE_STATUS_CHANGE') {
    const isOnline = event.data.payload.isOnline;
    console.log(`Service Worker: ネットワーク状態の変更 - ${isOnline ? 'オンライン' : 'オフライン'}`);
    
    // クライアントに通知
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NETWORK_STATUS_CHANGED',
          payload: {
            isOnline: isOnline
          }
        });
      });
    });
  }
}); 
