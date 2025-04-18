/**
 * 通知システムユーティリティ
 * アプリケーション全体で共通の通知機能を提供します
 */

// 通知タイプ
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// 通知保存用キー
const NOTIFICATIONS_STORAGE_KEY = 'study_scheduler_notifications';

// アクティブな通知を格納する配列
let activeNotifications = [];

// 通知リスナー（コンポーネントからの購読用）
const listeners = [];

/**
 * 通知を作成する
 * @param {string} message 通知メッセージ
 * @param {string} type 通知タイプ
 * @param {number} duration 表示時間（ミリ秒）
 * @param {boolean} isDismissible ユーザーが閉じられるか
 * @returns {Object} 作成された通知オブジェクト
 */
export const createNotification = (type, message, options = {}) => {
  const id = Date.now().toString();
  
  return {
    id,
    type,
    message,
    timestamp: new Date(),
    isDismissible: options.isDismissible !== false,
    ...options
  };
};

/**
 * 通知を表示する
 * @param {Object} notification 通知オブジェクト
 * @returns {string} 通知ID
 */
export const showNotification = (notification) => {
  activeNotifications = [notification, ...activeNotifications];
  notifyListeners();
  
  // 自動消去の設定
  if (notification.timeout) {
    setTimeout(() => {
      removeNotification(notification.id);
    }, notification.timeout);
  }
  
  return notification.id;
};

/**
 * 成功通知を表示する
 * @param {string} message 通知メッセージ
 * @param {Object} options オプション
 * @returns {string} 通知ID
 */
export const showSuccess = (message, options = {}) => {
  const notification = createNotification(
    NOTIFICATION_TYPES.SUCCESS,
    message,
    { timeout: 5000, ...options }
  );
  return showNotification(notification);
};

/**
 * 情報通知を表示する
 * @param {string} message 通知メッセージ
 * @param {Object} options オプション
 * @returns {string} 通知ID
 */
export const showInfo = (message, options = {}) => {
  const notification = createNotification(
    NOTIFICATION_TYPES.INFO,
    message,
    { timeout: 7000, ...options }
  );
  return showNotification(notification);
};

/**
 * 警告通知を表示する
 * @param {string} message 通知メッセージ
 * @param {Object} options オプション
 * @returns {string} 通知ID
 */
export const showWarning = (message, options = {}) => {
  const notification = createNotification(
    NOTIFICATION_TYPES.WARNING,
    message,
    { ...options }
  );
  return showNotification(notification);
};

/**
 * エラー通知を表示する
 * @param {string} message 通知メッセージ
 * @param {Object} options オプション
 * @returns {string} 通知ID
 */
export const showError = (message, options = {}) => {
  const notification = createNotification(
    NOTIFICATION_TYPES.ERROR,
    message,
    { ...options }
  );
  return showNotification(notification);
};

/**
 * 通知を削除する
 * @param {string} id 削除する通知のID
 */
export const removeNotification = (id) => {
  const initialLength = activeNotifications.length;
  activeNotifications = activeNotifications.filter(n => n.id !== id);
  
  if (activeNotifications.length !== initialLength) {
    notifyListeners();
    return true;
  }
  
  return false;
};

/**
 * すべての通知を削除する
 */
export const clearAllNotifications = () => {
  if (activeNotifications.length > 0) {
    activeNotifications = [];
    notifyListeners();
  }
};

/**
 * ストレージから通知を読み込む
 */
export const loadNotificationsFromStorage = () => {
  try {
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (storedNotifications) {
      const parsedNotifications = JSON.parse(storedNotifications);
      // 期限切れでない通知のみを追加
      const now = new Date();
      parsedNotifications.forEach(notification => {
        const createdAt = new Date(notification.createdAt);
        const expiryTime = 24 * 60 * 60 * 1000; // 24時間
        
        if ((now - createdAt) < expiryTime) {
          showNotification(
            notification,
            0, // 自動で閉じない
            notification.isDismissible
          );
        }
      });
    }
  } catch (error) {
    console.error('通知の読み込み中にエラーが発生しました:', error);
  }
};

/**
 * 通知をストレージに保存する
 * @param {Object} notification 保存する通知
 */
const saveNotificationToStorage = (notification) => {
  try {
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    let notifications = [];
    
    if (storedNotifications) {
      notifications = JSON.parse(storedNotifications);
    }
    
    // すでに存在する場合は上書き、なければ追加
    const existingIndex = notifications.findIndex(n => n.id === notification.id);
    if (existingIndex >= 0) {
      notifications[existingIndex] = notification;
    } else {
      notifications.push(notification);
    }
    
    // 期限切れの通知を削除
    const now = new Date();
    notifications = notifications.filter(n => {
      const createdAt = new Date(n.createdAt);
      const expiryTime = 24 * 60 * 60 * 1000; // 24時間
      return (now - createdAt) < expiryTime;
    });
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('通知の保存中にエラーが発生しました:', error);
  }
};

/**
 * 通知をストレージから削除する
 * @param {string} id 削除する通知のID
 */
const removeNotificationFromStorage = (id) => {
  try {
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (storedNotifications) {
      let notifications = JSON.parse(storedNotifications);
      notifications = notifications.filter(n => n.id !== id);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }
  } catch (error) {
    console.error('通知の削除中にエラーが発生しました:', error);
  }
};

/**
 * アクティブな通知を取得する
 * @returns {Array} アクティブな通知の配列
 */
export const getActiveNotifications = () => {
  return [...activeNotifications];
};

/**
 * 通知リスナーを追加する
 * @param {Function} listener 通知の変更時に呼び出されるコールバック関数
 * @returns {Function} リスナーの登録を解除するための関数
 */
export const subscribeToNotifications = (listener) => {
  listeners.push(listener);
  listener([...activeNotifications]); // 初期状態を通知
  
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * すべてのリスナーに通知の変更を通知する
 */
const notifyListeners = () => {
  listeners.forEach(listener => {
    try {
      listener([...activeNotifications]);
    } catch (error) {
      console.error('通知リスナーの呼び出し中にエラーが発生しました:', error);
    }
  });
};

/**
 * 現在のすべての通知を取得する
 * @returns {Array} 通知リスト
 */
export const getAllNotifications = () => {
  return [...activeNotifications];
}; 
