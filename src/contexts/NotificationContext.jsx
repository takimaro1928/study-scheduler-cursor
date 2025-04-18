import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notification';
import NotificationSystem from '../components/NotificationSystem';

// 通知コンテキストを作成
const NotificationContext = createContext(null);

/**
 * 通知コンテキストプロバイダー
 * アプリケーション全体で通知システムを利用できるようにする
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // 通知サービスに登録
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return () => unsubscribe();
  }, []);

  // 通知ヘルパー関数
  const showSuccess = (message, options = {}) => {
    return notificationService.success(message, options);
  };

  const showInfo = (message, options = {}) => {
    return notificationService.info(message, options);
  };

  const showWarning = (message, options = {}) => {
    return notificationService.warning(message, options);
  };

  const showError = (message, options = {}) => {
    return notificationService.error(message, options);
  };

  const removeNotification = (id) => {
    notificationService.removeNotification(id);
  };

  const clearAllNotifications = () => {
    notificationService.clearAllNotifications();
  };

  // コンテキスト値
  const contextValue = {
    notifications,
    showSuccess,
    showInfo,
    showWarning,
    showError,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationSystem />
    </NotificationContext.Provider>
  );
};

/**
 * 通知フック
 * コンポーネント内で通知機能を利用するためのフック
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext; 
