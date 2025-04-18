/**
 * エラーロギングユーティリティ
 * アプリケーション全体で一貫したエラーログ管理を提供します
 */

// 環境設定
const isDevelopment = process.env.NODE_ENV === 'development';
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
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
  if (isDevelopment) {
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

export default {
  logError,
  logWarning,
  getErrorLogs,
  clearErrorLogs,
  setupGlobalErrorHandlers
}; 
