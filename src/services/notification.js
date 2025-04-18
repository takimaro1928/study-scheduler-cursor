/**
 * 通知の種類
 */
export const NotificationType = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
};

/**
 * 通知のデフォルトタイムアウト（ミリ秒）
 */
const DEFAULT_TIMEOUT = 5000;

class NotificationService {
  constructor() {
    this.subscribers = [];
    this.notifications = [];
    this.nextId = 1;
  }

  /**
   * 通知を購読する
   * @param {Function} callback - 通知が変更された時に呼び出されるコールバック関数
   * @returns {Function} - 購読解除用の関数
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * すべての購読者に通知する
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  /**
   * 通知を追加する
   * @param {Object} notification - 通知オブジェクト
   * @param {string} notification.message - 通知メッセージ
   * @param {string} notification.type - 通知タイプ
   * @param {number} [notification.timeout] - 自動消去までの時間（ミリ秒）
   * @param {boolean} [notification.dismissable=true] - ユーザーが閉じることができるか
   * @returns {number} - 通知のID
   */
  addNotification({ message, type = NotificationType.INFO, timeout = DEFAULT_TIMEOUT, dismissable = true }) {
    const id = this.nextId++;
    const newNotification = {
      id,
      message,
      type,
      dismissable,
      timestamp: new Date(),
    };

    this.notifications = [...this.notifications, newNotification];
    this.notifySubscribers();

    // タイムアウトが指定されている場合は自動的に通知を削除
    if (timeout > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, timeout);
    }

    return id;
  }

  /**
   * 成功通知を追加する
   * @param {string} message - 通知メッセージ
   * @param {Object} [options] - 追加オプション
   * @returns {number} - 通知のID
   */
  success(message, options = {}) {
    return this.addNotification({
      message,
      type: NotificationType.SUCCESS,
      ...options,
    });
  }

  /**
   * 情報通知を追加する
   * @param {string} message - 通知メッセージ
   * @param {Object} [options] - 追加オプション
   * @returns {number} - 通知のID
   */
  info(message, options = {}) {
    return this.addNotification({
      message,
      type: NotificationType.INFO,
      ...options,
    });
  }

  /**
   * 警告通知を追加する
   * @param {string} message - 通知メッセージ
   * @param {Object} [options] - 追加オプション
   * @returns {number} - 通知のID
   */
  warning(message, options = {}) {
    return this.addNotification({
      message,
      type: NotificationType.WARNING,
      ...options,
    });
  }

  /**
   * エラー通知を追加する
   * @param {string} message - 通知メッセージ
   * @param {Object} [options] - 追加オプション
   * @returns {number} - 通知のID
   */
  error(message, options = {}) {
    return this.addNotification({
      message,
      type: NotificationType.ERROR,
      timeout: 0, // エラーはデフォルトで自動消去しない
      ...options,
    });
  }

  /**
   * 特定の通知を削除する
   * @param {number} id - 削除する通知のID
   */
  removeNotification(id) {
    this.notifications = this.notifications.filter(notification => notification.id !== id);
    this.notifySubscribers();
  }

  /**
   * すべての通知を削除する
   */
  clearAllNotifications() {
    this.notifications = [];
    this.notifySubscribers();
  }

  /**
   * すべての通知を取得する
   * @returns {Array} - 通知の配列
   */
  getNotifications() {
    return this.notifications;
  }
}

// シングルトンインスタンスを作成
const notificationService = new NotificationService();

export default notificationService; 
