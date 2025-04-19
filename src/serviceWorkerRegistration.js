// サービスワーカーの登録管理を行うファイル
// このコードはブラウザがサービスワーカーをサポートしているかチェックし、
// サポートしている場合はサービスワーカーを登録します

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register() {
  if ('serviceWorker' in navigator) {
    // ページのロードが完了したらサービスワーカーを登録
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      if (isLocalhost) {
        // ローカル環境での処理
        checkValidServiceWorker(swUrl);
        
        // 開発者向けのログ出力
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'このアプリケーションはサービスワーカーによってキャッシュされています。\n' +
            '詳細: https://cra.link/PWA'
          );
        });
      } else {
        // プロダクション環境での処理
        registerValidSW(swUrl);
      }
      
      // オンライン/オフライン状態の監視を設定
      setupNetworkListeners();
    });
  } else {
    console.log('このブラウザはサービスワーカーをサポートしていません。オフラインモードは利用できません。');
  }
}

// オンライン/オフライン状態の監視を設定
function setupNetworkListeners() {
  // オンライン状態の変化を監視
  window.addEventListener('online', () => {
    notifyServiceWorkerOfNetworkChange(true);
    document.dispatchEvent(new CustomEvent('network-status-changed', { detail: { isOnline: true } }));
  });
  
  window.addEventListener('offline', () => {
    notifyServiceWorkerOfNetworkChange(false);
    document.dispatchEvent(new CustomEvent('network-status-changed', { detail: { isOnline: false } }));
  });
  
  // 初期状態も通知
  document.dispatchEvent(new CustomEvent('network-status-changed', { detail: { isOnline: navigator.onLine } }));
}

// サービスワーカーにネットワーク状態変化を通知
function notifyServiceWorkerOfNetworkChange(isOnline) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'ONLINE_STATUS_CHANGE',
      payload: { isOnline }
    });
  }
}

// サービスワーカーを登録
function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // 更新がある場合のイベント設定
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 新しいバージョンが利用可能
              console.log('新しいバージョンが利用可能です。更新するにはページを再読み込みしてください。');
              
              // アプリケーションに更新通知を送信
              document.dispatchEvent(new CustomEvent('sw-update-available'));
            } else {
              // 初回インストール
              console.log('コンテンツがオフライン用にキャッシュされました。');
              document.dispatchEvent(new CustomEvent('sw-installed'));
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('サービスワーカーの登録中にエラーが発生しました:', error);
    });
}

// サービスワーカーが有効かチェック
function checkValidServiceWorker(swUrl) {
  // サービスワーカースクリプトが見つかるか確認
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // 404かどうかとJavaScriptかどうかを確認
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // サービスワーカーが見つからない、またはJSファイルでない
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // 有効なサービスワーカーを登録
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('インターネット接続がありません。オフラインモードで動作しています。');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('サービスワーカーの登録解除でエラーが発生しました:', error);
      });
  }
} 
