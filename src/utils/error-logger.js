/**
 * エラーロギングユーティリティ
 * アプリケーション全体で一貫したエラーログ管理を提供します
 */

// LOG_LEVELSの定義をファイルの先頭に追加
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// エラーログ出力を本番環境で最小限にする
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = IS_PRODUCTION ? 'error' : 'debug';

// 環境に応じたログ出力関数
const logger = {
  debug: (...args) => {
    if (LOG_LEVEL === 'debug') {
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (LOG_LEVEL !== 'error') {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

// エラーログ保存のための最大サイズ
const MAX_LOG_ENTRIES = 100;

/**
 * ローカルストレージにエラーログを保存
 * @param {Object} logEntry - ログエントリオブジェクト
 */
const saveLogToStorage = (logEntry) => {
  try {
    // 既存のログを取得
    const storedLogs = localStorage.getItem('errorLogs');
    let logs = storedLogs ? JSON.parse(storedLogs) : [];
    
    // 最大サイズを超えた場合は古いログを削除
    if (logs.length >= MAX_LOG_ENTRIES) {
      logs = logs.slice(-MAX_LOG_ENTRIES + 1);
    }
    
    // 新しいログを追加
    logs.push(logEntry);
    
    // ローカルストレージに保存
    localStorage.setItem('errorLogs', JSON.stringify(logs));
  } catch (err) {
    // ローカルストレージへの保存に失敗した場合はコンソールにのみ出力
    console.error('Failed to save error log to localStorage:', err);
  }
};

/**
 * エラーのログ記録
 * @param {Error|string} error - エラーオブジェクトまたはエラーメッセージ
 * @param {string} context - エラーが発生したコンテキスト
 * @param {Object} additionalData - 追加のデータ (オプション)
 */
const logError = (error, context, additionalData = {}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const stackTrace = error instanceof Error ? error.stack : new Error().stack;
  
  const logEntry = {
    level: LOG_LEVELS.ERROR,
    timestamp: new Date().toISOString(),
    message: errorMessage,
    context,
    stack: stackTrace,
    additionalData,
    userAgent: navigator.userAgent,
  };
  
  // コンソールに出力
  console.error(`[ERROR][${context}]`, errorMessage, additionalData);
  
  // ローカルストレージに保存
  saveLogToStorage(logEntry);
  
  // 本番環境では外部サービスへの送信を行うなどの処理を追加可能
  // if (!isDevelopment) {
  //   sendToErrorTrackingService(logEntry);
  // }
};

/**
 * 警告のログ記録
 * @param {string} message - 警告メッセージ
 * @param {string} context - 警告が発生したコンテキスト
 * @param {Object} additionalData - 追加のデータ (オプション)
 */
const logWarning = (message, context, additionalData = {}) => {
  const logEntry = {
    level: LOG_LEVELS.WARN,
    timestamp: new Date().toISOString(),
    message,
    context,
    additionalData,
    userAgent: navigator.userAgent,
  };
  
  // コンソールに出力
  console.warn(`[WARN][${context}]`, message, additionalData);
  
  // 開発環境の場合のみローカルストレージに保存
  if (IS_PRODUCTION) {
    saveLogToStorage(logEntry);
  }
};

/**
 * エラーログの取得
 * @returns {Array} 保存されているエラーログ
 */
const getErrorLogs = () => {
  try {
    const storedLogs = localStorage.getItem('errorLogs');
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (err) {
    console.error('Failed to retrieve error logs:', err);
    return [];
  }
};

/**
 * エラーログのクリア
 */
const clearErrorLogs = () => {
  try {
    localStorage.removeItem('errorLogs');
  } catch (err) {
    console.error('Failed to clear error logs:', err);
  }
};

/**
 * エラーリカバリーUIを表示する関数
 * ページ全体にエラーメッセージとリカバリーオプションを表示します
 * 
 * @param {Error|string} error - エラーオブジェクトまたはエラーメッセージ
 * @param {Object} options - オプション設定
 * @param {string} options.title - エラータイトル (デフォルト: 'エラーが発生しました')
 * @param {string} options.message - エラーメッセージ (デフォルト: '申し訳ありません。予期しないエラーが発生しました。')
 * @param {boolean} options.showReload - リロードボタンを表示するか (デフォルト: true)
 * @param {boolean} options.showReset - リセットボタンを表示するか (デフォルト: false)
 */
const showErrorRecoveryUI = (error, options = {}) => {
  // エラーをログに記録
  logError(error, 'ErrorRecoveryUI');
  
  // オプションのデフォルト値を設定
  const {
    title = 'エラーが発生しました',
    message = '申し訳ありません。予期しないエラーが発生しました。',
    showReload = true,
    showReset = false
  } = options;
  
  // 既存のエラーUIがあれば削除
  const existingErrorUI = document.getElementById('global-error-ui');
  if (existingErrorUI) {
    existingErrorUI.remove();
  }
  
  // エラーUIのコンテナを作成
  const errorContainer = document.createElement('div');
  errorContainer.id = 'global-error-ui';
  errorContainer.style.position = 'fixed';
  errorContainer.style.top = '0';
  errorContainer.style.left = '0';
  errorContainer.style.width = '100%';
  errorContainer.style.height = '100%';
  errorContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  errorContainer.style.zIndex = '9999';
  errorContainer.style.display = 'flex';
  errorContainer.style.flexDirection = 'column';
  errorContainer.style.justifyContent = 'center';
  errorContainer.style.alignItems = 'center';
  errorContainer.style.padding = '2rem';
  errorContainer.style.boxSizing = 'border-box';
  
  // エラーカードを作成
  const errorCard = document.createElement('div');
  errorCard.style.maxWidth = '500px';
  errorCard.style.width = '100%';
  errorCard.style.backgroundColor = 'white';
  errorCard.style.borderRadius = '8px';
  errorCard.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  errorCard.style.overflow = 'hidden';
  
  // エラーヘッダーを作成
  const errorHeader = document.createElement('div');
  errorHeader.style.backgroundColor = '#ef4444';
  errorHeader.style.color = 'white';
  errorHeader.style.padding = '1rem 1.5rem';
  errorHeader.style.fontWeight = 'bold';
  errorHeader.style.fontSize = '1.25rem';
  errorHeader.textContent = title;
  
  // エラーボディを作成
  const errorBody = document.createElement('div');
  errorBody.style.padding = '1.5rem';
  
  // エラーメッセージを作成
  const errorMessage = document.createElement('p');
  errorMessage.style.marginBottom = '1.5rem';
  errorMessage.style.lineHeight = '1.5';
  errorMessage.style.color = '#4b5563';
  errorMessage.textContent = message;
  
  // ボタンコンテナを作成
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '0.75rem';
  buttonContainer.style.justifyContent = 'center';
  
  // リロードボタンを作成
  if (showReload) {
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'ページをリロード';
    reloadButton.style.backgroundColor = '#3b82f6';
    reloadButton.style.color = 'white';
    reloadButton.style.border = 'none';
    reloadButton.style.borderRadius = '4px';
    reloadButton.style.padding = '0.5rem 1rem';
    reloadButton.style.cursor = 'pointer';
    reloadButton.style.fontWeight = '500';
    reloadButton.onclick = () => window.location.reload();
    buttonContainer.appendChild(reloadButton);
  }
  
  // リセットボタンを作成
  if (showReset) {
    const resetButton = document.createElement('button');
    resetButton.textContent = 'データをリセット';
    resetButton.style.backgroundColor = '#ef4444';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.padding = '0.5rem 1rem';
    resetButton.style.cursor = 'pointer';
    resetButton.style.fontWeight = '500';
    resetButton.onclick = () => {
      if (window.confirm('本当にデータをリセットしますか？この操作は元に戻せません。')) {
        try {
          localStorage.clear();
          // indexedDBを直接参照するのではなく、window.indexedDBを使用
          if (window.indexedDB) {
            window.indexedDB.deleteDatabase('studySchedulerDB');
          }
          window.location.reload();
        } catch (err) {
          console.error('データリセット中にエラーが発生しました:', err);
          alert('データリセット中にエラーが発生しました。ページをリロードします。');
          window.location.reload();
        }
      }
    };
    buttonContainer.appendChild(resetButton);
  }
  
  // 要素を組み立てる
  errorBody.appendChild(errorMessage);
  errorBody.appendChild(buttonContainer);
  errorCard.appendChild(errorHeader);
  errorCard.appendChild(errorBody);
  errorContainer.appendChild(errorCard);
  
  // DOMにエラーUIを追加
  document.body.appendChild(errorContainer);
  
  return errorContainer;
};

/**
 * グローバルエラーハンドラの設定
 * アプリケーションの初期化時に呼び出す
 */
const setupGlobalErrorHandlers = () => {
  // キャッチされていない例外をキャッチ
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'UnhandledException', {
      fileName: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno
    });
    
    // ErrorBoundaryでキャッチされていないケースのみグローバルUIを表示
    if (event.error && !window.__errorBoundaryCaught) {
      showErrorRecoveryUI(event.error);
    }
  });
  
  // Promiseでキャッチされていない例外をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'UnhandledPromiseRejection');
    
    // 深刻なPromiseエラーの場合にUIを表示
    if (typeof event.reason === 'object' && event.reason !== null && 
        (event.reason.name === 'QuotaExceededError' || 
         event.reason.message?.includes('quota') || 
         event.reason.message?.includes('storage'))) {
      showErrorRecoveryUI(event.reason, {
        title: 'ストレージエラー',
        message: 'ブラウザのストレージ容量が不足しています。不要なデータを削除するか、ブラウザの設定を確認してください。',
        showReset: true
      });
    }
  });

  // グローバル関数として公開
  window.showErrorRecoveryUI = showErrorRecoveryUI;
};

// ③ indexedDBの最適化（answerHistoryのクリーンアップ強化）
const cleanupOldAnswerHistory = (days = 30) => {
  // 30日以上前の回答履歴を自動的に削除
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  // ... 削除処理
}

// 重複エクスポートエラーを修正
// 名前付きエクスポートのみを使用する
export { 
  logError, 
  logWarning, 
  getErrorLogs, 
  clearErrorLogs, 
  setupGlobalErrorHandlers,
  showErrorRecoveryUI
};

// デフォルトエクスポートを削除
// export default {
//   logError,
//   logWarning,
//   getErrorLogs,
//   clearErrorLogs,
//   setupGlobalErrorHandlers
// }; 
