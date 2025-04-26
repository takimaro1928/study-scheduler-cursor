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
export const logError = (error, context, additionalData = {}) => {
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
export const logWarning = (message, context, additionalData = {}) => {
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
export const getErrorLogs = () => {
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
export const clearErrorLogs = () => {
  try {
    localStorage.removeItem('errorLogs');
  } catch (err) {
    console.error('Failed to clear error logs:', err);
  }
};

/**
 * グローバルエラーハンドラの設定
 * アプリケーションの初期化時に呼び出す
 */
export const setupGlobalErrorHandlers = () => {
  // キャッチされていない例外をキャッチ
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'UnhandledException', {
      fileName: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno
    });
  });
  
  // Promiseでキャッチされていない例外をキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'UnhandledPromiseRejection');
  });
};

// ③ indexedDBの最適化（answerHistoryのクリーンアップ強化）
const cleanupOldAnswerHistory = (days = 30) => {
  // 30日以上前の回答履歴を自動的に削除
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  // ... 削除処理
}

export default {
  logError,
  logWarning,
  getErrorLogs,
  clearErrorLogs,
  setupGlobalErrorHandlers
}; 
