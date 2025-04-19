/* global workbox */
// これはウェブパックプラグインによって生成・置換されるスタブファイルです
// オリジナルの実装はsrc/serviceWorker.jsにあります

// この空のサービスワーカーはSWを生成できない場合のフォールバックです
// 通常はビルド時にworkboxプラグインによって置き換えられます

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
}); 
