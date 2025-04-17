// BulkEditSection.js
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import DatePickerCalendar from './DatePickerCalendar';

// 一括編集セクションコンポーネント
const BulkEditSection = ({ selectedQuestions, setSelectedDate, selectedDate, saveBulkEdit }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  
  // カレンダーを開く/閉じる
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };
  
  // カレンダーから日付が選択されたとき
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };
  
  // クリックがカレンダーの外側で発生したときに閉じる
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarRef]);
  
  // 日付をフォーマット
  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  return (
    <div className="mb-6 p-5 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <p className="text-indigo-800 font-medium">{selectedQuestions.length}個の問題を選択中</p>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            一括設定する日付
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
            <input
              type="text"
              className="px-4 py-2 outline-none text-gray-700 w-48"
              placeholder="日付を選択"
              value={selectedDate ? formatDate(selectedDate) : ''}
              readOnly
              onClick={toggleCalendar}
            />
            <button
              onClick={toggleCalendar}
              className="px-3 py-2 bg-gray-50 text-gray-600 border-l border-gray-300 h-full hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
          
          {isCalendarOpen && (
            <div 
              ref={calendarRef}
              className="absolute left-0 top-full mt-1 z-50"
            >
              <DatePickerCalendar
                selectedDate={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          )}
        </div>
        
        <button 
          onClick={() => selectedDate && saveBulkEdit(selectedDate)}
          disabled={!selectedDate}
          className={`px-5 py-2 rounded-lg text-gray-800 font-medium shadow-sm flex items-center
            ${selectedDate 
              ? 'bg-green-300 hover:bg-green-400 active:bg-green-500' 
              : 'bg-gray-300 cursor-not-allowed'
            } transition-colors`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          一括設定
        </button>
      </div>
    </div>
  );
};

export default BulkEditSection;
