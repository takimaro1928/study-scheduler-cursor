// DatePickerCalendar.js
import React, { useState, useEffect } from 'react';

// カレンダーコンポーネント - 画像と完全に同じデザイン
const DatePickerCalendar = ({ selectedDate, onChange, onClose }) => {
  // 初期表示する日付
  const initialDate = selectedDate || new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [localSelectedDate, setLocalSelectedDate] = useState(initialDate);
  
  // 選択日が変更された時に同期する
  useEffect(() => {
    if (selectedDate) {
      setLocalSelectedDate(selectedDate);
    }
  }, [selectedDate]);
  
  // 月を変更する関数
  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };
  
  // カレンダーデータを生成
  const generateCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // 月の最初と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 先月の日を取得（前月の空白を埋めるため）
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstWeekday = firstDay.getDay(); // 0=日曜日
    
    const daysInMonth = lastDay.getDate();
    const calendar = [];
    
    // 先月の日を追加
    const prevMonthDays = [];
    for (let i = 0; i < firstWeekday; i++) {
      const day = prevMonthLastDay - firstWeekday + i + 1;
      const date = new Date(year, month - 1, day);
      prevMonthDays.push({ day, date, isPrevMonth: true });
    }
    
    // 今月の日を追加
    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      currentMonthDays.push({ day, date, isCurrentMonth: true });
    }
    
    // 来月の日を追加（次月の空白を埋めるため）
    const nextMonthDays = [];
    const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      nextMonthDays.push({ day, date, isNextMonth: true });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };
  
  const calendar = generateCalendar();
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // カレンダーを週ごとに分割
  const weeks = [];
  for (let i = 0; i < calendar.length; i += 7) {
    weeks.push(calendar.slice(i, i + 7));
  }
  
  // 日付が今日かどうかチェック
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // 日付が選択されているかチェック
  const isSelected = (date) => {
    return localSelectedDate && 
           date.getDate() === localSelectedDate.getDate() && 
           date.getMonth() === localSelectedDate.getMonth() && 
           date.getFullYear() === localSelectedDate.getFullYear();
  };
  
 // 日付選択ハンドラー - 絶対に閉じないバージョン
const handleDateSelect = (date) => {
  // ローカルの状態だけを更新
  setLocalSelectedDate(date);
  
  // 親コンポーネントにイベントを伝達（閉じる処理はなし）
  if (onChange) {
    console.log('日付選択イベントを親に通知:', date);
    onChange(date);
  }
};
  
  // 「今日」ボタンのハンドラー
  const handleTodayClick = () => {
    const today = new Date();
    setViewDate(today);
    setLocalSelectedDate(today);
    onChange && onChange(today);
  };
  
  // 「削除」ボタンのハンドラー
  const handleClearClick = () => {
    setLocalSelectedDate(null);
    onChange && onChange(null);
  };
  
  // 和暦の年号を取得
  const getJapaneseEraYear = (date) => {
    const year = date.getFullYear();
    if (year >= 2019) return `令和${year - 2018}`;
    if (year >= 1989) return `平成${year - 1988}`;
    if (year >= 1926) return `昭和${year - 1925}`;
    if (year >= 1912) return `大正${year - 1911}`;
    return `明治${year - 1867}`;
  };
  
  return (
    <div className="w-64 bg-white border border-gray-200">
      {/* ヘッダー部分 - 完全に写真通りのデザイン */}
      <div className="border-b border-gray-200 p-2">
        <div className="flex justify-between items-center">
          {/* 年月表示 */}
          <div className="text-sm text-gray-800">
            {`${viewDate.getFullYear()}年(${getJapaneseEraYear(viewDate)}年)${viewDate.getMonth() + 1}月`}
          </div>
          
          {/* 上下矢印ボタン */}
          <div className="flex items-center">
            <button 
              onClick={() => changeMonth(-1)} 
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              ↑
            </button>
            <button 
              onClick={() => changeMonth(1)} 
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
      
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 text-center">
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className={`p-1 text-sm ${
              index === 0 ? 'text-red-500' : 
              index === 6 ? 'text-blue-500' : 
              'text-gray-800'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* カレンダー本体 */}
      <div className="grid grid-cols-7 text-center border-t border-b border-gray-200">
        {calendar.map((dateObj, index) => {
          const { day, date, isPrevMonth, isNextMonth } = dateObj;
          const _isToday = isToday(date);
          const _isSelected = isSelected(date);
          
          // 写真どおりの日付セルのスタイル
          return (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className={`
                p-1 text-sm border border-transparent
                ${isPrevMonth || isNextMonth ? 'text-gray-400' : 'text-gray-800'}
                ${_isSelected ? 'bg-blue-500 text-white' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
      
      {/* フッター部分 */}
      <div className="flex justify-between p-2">
        <button
          onClick={handleClearClick}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          削除
        </button>
        
        <button
          onClick={handleTodayClick}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          今日
        </button>
      </div>
    </div>
  );
};

export default DatePickerCalendar;
