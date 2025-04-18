/**
 * 通知サービス
 * アプリケーション全体で一貫した通知管理を提供します
 */

// 通知タイプの定義
export const NOTIFICATION_TYPES = {
  SUCCESS: 'SUCCESS',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
};

class NotificationService {
  constructor() {
    this.subscribers = [];
    this.notifications = [];
    this.nextId = 1;
  }

  /**
   * 通知リスナーを登録
   * @param {Function} callback - 通知リストが変更された時に呼ばれるコールバック
   * @returns {Function} - 購読解除用の関数
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    // 初期状態を通知
    callback(this.notifications);
    
    // 購読解除用の関数を返す
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * 全てのサブスクライバーに通知
   * @private
   */
  _notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.notifications]));
  }

  /**
   * 通知を追加
   * @param {Object} notification - 通知オブジェクト
   * @param {string} notification.type - 通知タイプ（SUCCESS, INFO, WARNING, ERROR）
   * @param {string} notification.message - 通知メッセージ
   * @param {boolean} [notification.dismissible=true] - 閉じることができるかどうか
   * @param {boolean} [notification.critical=false] - 重要な通知かどうか
   * @param {number} [notification.timeout=null] - 自動消去までの時間（ミリ秒）
   * @returns {number} - 通知ID
   */
  addNotification({ type, message, dismissible = true, critical = false, timeout = null }) {
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      console.warn(`無効な通知タイプ: ${type}`);
      type = NOTIFICATION_TYPES.INFO;
    }

    const id = this.nextId++;
    const timestamp = new Date();
    
    const notification = {
      id,
      type,
      message,
      dismissible,
      critical,
      timestamp,
    };

    this.notifications.unshift(notification);
    this._notifySubscribers();

    // 自動削除のタイマーをセット
    if (timeout && timeout > 0) {
      setTimeout(() => {
        this.dismissNotification(id);
      }, timeout);
    }

    return id;
  }

  /**
   * 成功通知を追加
   * @param {string} message - 通知メッセージ
   * @param {Object} [options={}] - オプション
   * @returns {number} - 通知ID
   */
  success(message, options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      timeout: 5000, // デフォルトで5秒後に消える
      ...options
    });
  }

  /**
   * 情報通知を追加
   * @param {string} message - 通知メッセージ
   * @param {Object} [options={}] - オプション
   * @returns {number} - 通知ID
   */
  info(message, options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      timeout: 7000, // デフォルトで7秒後に消える
      ...options
    });
  }

  /**
   * 警告通知を追加
   * @param {string} message - 通知メッセージ
   * @param {Object} [options={}] - オプション
   * @returns {number} - 通知ID
   */
  warning(message, options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      critical: true, // デフォルトで重要
      ...options
    });
  }

  /**
   * エラー通知を追加
   * @param {string} message - 通知メッセージ
   * @param {Object} [options={}] - オプション
   * @returns {number} - 通知ID
   */
  error(message, options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      critical: true, // デフォルトで重要
      dismissible: true,
      ...options
    });
  }

  /**
   * 特定の通知を消去
   * @param {number} id - 通知ID
   * @returns {boolean} - 成功したかどうか
   */
  dismissNotification(id) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(notification => notification.id !== id);
    
    if (this.notifications.length !== initialLength) {
      this._notifySubscribers();
      return true;
    }
    
    return false;
  }

  /**
   * すべての通知を消去
   */
  clearAllNotifications() {
    if (this.notifications.length > 0) {
      this.notifications = [];
      this._notifySubscribers();
    }
  }

  /**
   * すべての読んだ通知を消去（重要でない通知のみ）
   */
  clearNonCriticalNotifications() {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(notification => notification.critical);
    
    if (this.notifications.length !== initialLength) {
      this._notifySubscribers();
    }
  }

  /**
   * 特定の通知を重要としてマーク/解除
   * @param {number} id - 通知ID
   * @param {boolean} isCritical - 重要かどうか
   * @returns {boolean} - 成功したかどうか
   */
  markNotificationCritical(id, isCritical) {
    const notification = this.notifications.find(n => n.id === id);
    
    if (notification) {
      notification.critical = isCritical;
      this._notifySubscribers();
      return true;
    }
    
    return false;
  }

  /**
   * 現在の通知一覧を取得
   * @returns {Array} - 通知リスト
   */
  getNotifications() {
    return [...this.notifications];
  }
}

// シングルトンインスタンスをエクスポート
const notificationService = new NotificationService();
export default notificationService; 
