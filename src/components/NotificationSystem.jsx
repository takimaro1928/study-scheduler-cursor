import React, { useState, useEffect } from 'react';
import {
  subscribeToNotifications,
  removeNotification,
  clearAllNotifications,
  NOTIFICATION_TYPES
} from '../utils/notifications';
import styles from './NotificationSystem.module.css';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle, XCircle } from 'react-feather';

/**
 * 通知アイコンを取得する
 * @param {string} type 通知タイプ
 * @returns {JSX.Element} アイコンコンポーネント
 */
const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return <CheckCircle className={styles.icon} />;
    case NOTIFICATION_TYPES.INFO:
      return <Info className={styles.icon} />;
    case NOTIFICATION_TYPES.WARNING:
      return <AlertTriangle className={styles.icon} />;
    case NOTIFICATION_TYPES.ERROR:
      return <AlertCircle className={styles.icon} />;
    default:
      return <Info className={styles.icon} />;
  }
};

/**
 * 単一の通知を表示するコンポーネント
 */
const Notification = ({ notification, onClose }) => {
  const { id, message, type, isDismissible } = notification;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        {getNotificationIcon(type)}
        <p className={styles.message}>{message}</p>
      </div>
      {isDismissible && (
        <button 
          className={styles.closeButton} 
          onClick={() => onClose(id)}
          aria-label="通知を閉じる"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

/**
 * 通知管理システムコンポーネント
 * アプリケーション全体の通知を表示・管理する
 */
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // 通知システムに登録し、通知リストを取得する
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notificationList) => {
      setNotifications(notificationList);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 通知を閉じる
  const handleClose = (id) => {
    removeNotification(id);
  };

  // すべての通知を閉じる
  const handleClearAll = () => {
    clearAllNotifications();
  };

  // 通知ボタンのバッジカウント（最大9まで表示）
  const badgeCount = notifications.length > 9 ? '9+' : notifications.length;

  // 通知があるかどうか
  const hasNotifications = notifications.length > 0;

  // エラーと警告の数をカウント
  const criticalCount = notifications.filter(
    n => n.type === NOTIFICATION_TYPES.ERROR || n.type === NOTIFICATION_TYPES.WARNING
  ).length;

  return (
    <div className={styles.notificationSystem}>
      {/* 通知トグルボタン */}
      {hasNotifications && (
        <button 
          className={`${styles.toggleButton} ${criticalCount > 0 ? styles.hasCritical : ''}`}
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "通知を隠す" : "通知を表示"}
        >
          {expanded ? (
            <XCircle size={24} />
          ) : (
            <>
              <AlertCircle size={24} />
              {badgeCount > 0 && <span className={styles.badge}>{badgeCount}</span>}
            </>
          )}
        </button>
      )}

      {/* 通知リスト */}
      {expanded && hasNotifications && (
        <div className={styles.notificationContainer}>
          <div className={styles.notificationHeader}>
            <h3 className={styles.notificationTitle}>通知</h3>
            <button 
              className={styles.clearAllButton}
              onClick={handleClearAll}
              aria-label="すべての通知を消去"
            >
              すべて消去
            </button>
          </div>
          <div className={styles.notificationList}>
            {notifications.map(notification => (
              <Notification
                key={notification.id}
                notification={notification}
                onClose={handleClose}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem; 
