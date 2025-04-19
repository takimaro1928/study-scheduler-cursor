import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * オフライン状態を検知して通知するコンポーネント
 */
const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  // オンライン状態の変化を監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // オンラインに戻ったことを短時間表示
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    // カスタムイベントも監視（サービスワーカーからの通知用）
    const handleNetworkStatusChanged = (event) => {
      if (event.detail && typeof event.detail.isOnline === 'boolean') {
        setIsOffline(!event.detail.isOnline);
        setShowBanner(!event.detail.isOnline);
        
        if (event.detail.isOnline) {
          // オンラインに戻った場合は3秒後に非表示
          setTimeout(() => setShowBanner(false), 3000);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('network-status-changed', handleNetworkStatusChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('network-status-changed', handleNetworkStatusChanged);
    };
  }, []);

  // オフライン状態でないか、表示モードがオフの場合は何も表示しない
  if (!showBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isOffline ? '#f87171' : '#10b981',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        maxWidth: '90%',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {isOffline ? (
        <>
          <WifiOff size={18} />
          <span>オフラインモードで表示しています。変更はデバイスに保存されます。</span>
        </>
      ) : (
        <>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5l10 -10"></path>
          </svg>
          <span>ネットワーク接続が回復しました</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator; 
