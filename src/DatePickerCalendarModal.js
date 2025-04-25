import React from 'react';
import { X } from 'lucide-react';
import DatePickerCalendar from './DatePickerCalendar';
import styles from './DatePickerCalendarModal.module.css';

const DatePickerCalendarModal = ({ isOpen, onClose, onDateSelect, initialDate }) => {
  if (!isOpen) return null;

  // 日付選択時の処理
  const handleDateSelect = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // モーダル以外の領域がクリックされたら閉じる
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>
        
        <div className={styles.calendarContainer}>
          <DatePickerCalendar
            selectedDate={initialDate}
            onChange={handleDateSelect}
            onClose={onClose}
          />
        </div>
        
        <div className={styles.footer}>
          <span>日付を選択してください</span>
          <button 
            className={styles.confirmButton}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerCalendarModal; 
