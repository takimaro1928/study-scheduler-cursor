// src/ReminderNotification.js
import React from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

const styles = {
  reminderBanner: {
    position: 'fixed',
    top: '56px',
    left: 0,
    right: 0,
    backgroundColor: '#fff7ed',
    borderBottom: '1px solid #fdba74',
    zIndex: 20,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  reminderContent: {
    maxWidth: '72rem',
    margin: '0 auto',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem 1rem'
  },
  reminderIcon: {
    flexShrink: 0,
    color: '#f97316'
  },
  reminderText: {
    flexGrow: 1,
    fontSize: '0.875rem',
    color: '#9a3412'
  },
  reminderActions: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto'
  },
  reminderButtonPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    backgroundColor: '#fb923c',
    color: 'white'
  },
  reminderButtonSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    backgroundColor: '#ffedd5',
    color: '#9a3412'
  }
};

const ReminderNotification = ({ daysSinceLastExport, onGoToSettings, onDismiss }) => {
  return (
    <div style={styles.reminderBanner}>
      <div style={styles.reminderContent}>
        <AlertTriangle size={18} style={styles.reminderIcon} />
        <span style={styles.reminderText}>
          最後のバックアップから14日以上経過しています。データの安全のためにエクスポートをお勧めします。
        </span>
        <div style={styles.reminderActions}>
          <button onClick={onGoToSettings} style={styles.reminderButtonPrimary}>
            <Save size={14} />
            設定ページへ
          </button>
          <button onClick={onDismiss} style={styles.reminderButtonSecondary}>
            <X size={14} />
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderNotification;
