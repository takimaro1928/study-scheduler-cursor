import React, { useState } from 'react';
import { Clock, Calendar, List, Info, BookOpen, Settings, Menu, X, AlertTriangle } from 'lucide-react';

const TopNavigation = ({ activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // メニュー項目
  const navItems = [
    { id: 'today', label: '今日の問題', icon: <Clock size={20} /> },
    { id: 'schedule', label: 'スケジュール', icon: <Calendar size={20} /> },
    { id: 'all', label: '全問題一覧', icon: <List size={20} /> },
    { id: 'trends', label: '傾向分析', icon: <Info size={20} /> },
    { id: 'stats', label: '学習統計', icon: <BookOpen size={20} /> },
    { id: 'ambiguous', label: '曖昧分析', icon: <AlertTriangle size={20} /> },
    { id: 'settings', label: '設定', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* ヘッダー */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem', marginRight: '8px' }}>📚</span>
          <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>学習マネージャー</span>
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#4b5563'
          }}
          aria-label="メインメニューを開く"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* サイドメニュー */}
      {isMenuOpen && (
        <div id="menu-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 50,
          display: 'flex'
        }}>
          {/* サイドメニュー本体 */}
          <div style={{
            width: '300px',
            backgroundColor: 'white',
            height: '100%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* メニューヘッダー */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', marginRight: '8px' }}>📚</span>
                <span style={{ fontSize: '1rem', fontWeight: 500 }}>メインメニュー</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* メニューリスト */}
            <div>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '14px 16px',
                    textAlign: 'left',
                    backgroundColor: activeTab === item.id ? '#eef2ff' : 'white',
                    color: activeTab === item.id ? '#4f46e5' : '#374151',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                >
                  <div style={{ marginRight: '12px', opacity: 0.85 }}>{item.icon}</div>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* オーバーレイ部分（クリックするとメニューを閉じる） */}
          <div
            style={{
              flexGrow: 1,
              cursor: 'pointer'
            }}
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
      )}

      {/* メインコンテンツの余白調整 */}
      <div style={{ paddingTop: '56px' }}></div>
    </>
  );
};

export default TopNavigation;
