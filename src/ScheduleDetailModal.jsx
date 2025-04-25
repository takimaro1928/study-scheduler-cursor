import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calendar, ChevronDown, GripVertical, ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './ScheduleDetailModal.module.css';
import DatePickerCalendarModal from './DatePickerCalendarModal';

// 問題アイテムコンポーネント
const DetailQuestionItem = ({ question, scheduleQuestion }) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(new Date(question.nextDate));

  // 日付を変更する処理
  const handleDateChange = (e) => {
    setNewDate(new Date(e.target.value));
  };

  // スケジュール変更を確定する処理
  const handleReschedule = () => {
    scheduleQuestion(question.id, newDate);
    setIsRescheduling(false);
  };

  // 日付文字列をYYYY-MM-DD形式に変換
  const formatDateForInput = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // 表示用の問題識別子を作成
  const displayText = `${question.subject || question.subjectName || ''}${question.chapter || question.chapterName ? ` ${question.chapter || question.chapterName}` : ''}-${question.number || ''}`;

  return (
    <div className={styles.questionItem}>
      <div className={styles.questionHeader}>
        <div className={styles.questionTitle}>
          <GripVertical size={14} className={styles.gripIcon} />
          <span className={styles.questionText}>{displayText}</span>
        </div>
        <button 
          className={styles.rescheduleButton}
          onClick={() => setIsRescheduling(!isRescheduling)}
        >
          <Calendar size={14} />
          <span>{format(new Date(question.nextDate), 'yyyy/MM/dd')}</span>
        </button>
      </div>

      {isRescheduling && (
        <div className={styles.reschedulingPanel}>
          <input 
            type="date" 
            value={formatDateForInput(newDate)} 
            onChange={handleDateChange}
            className={styles.dateInput}
          />
          <div className={styles.reschedulingActions}>
            <button 
              className={styles.cancelButton} 
              onClick={() => setIsRescheduling(false)}
            >
              キャンセル
            </button>
            <button 
              className={styles.saveButton} 
              onClick={handleReschedule}
            >
              変更を保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// メインのScheduleDetailModalコンポーネント
const ScheduleDetailModal = ({ isOpen, onClose, date, questions, scheduleQuestion, refreshData }) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // 科目別に問題をグループ化
  const groupedQuestions = useMemo(() => {
    const groups = {};
    questions.forEach(q => {
      if (!groups[q.subject]) {
        groups[q.subject] = [];
      }
      groups[q.subject].push(q);
    });
    return groups;
  }, [questions]);

  // 科目の表示順（アルファベット順）
  const subjectOrder = useMemo(() => {
    return Object.keys(groupedQuestions).sort((a, b) => a.localeCompare(b));
  }, [groupedQuestions]);

  // 科目の開閉状態
  const [openSubjects, setOpenSubjects] = useState(() => {
    const state = {};
    subjectOrder.forEach(subject => {
      state[subject] = true; // 初期状態はすべて開いた状態
    });
    return state;
  });

  // 科目の開閉を切り替える処理
  const toggleSubject = (subject) => {
    setOpenSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  // モーダルが開いていない場合は何も表示しない
  if (!isOpen || !date) return null;

  // 日付をフォーマット
  const formattedDate = format(date, 'yyyy年M月d日(E)', { locale: ja });

  // 前日・翌日のリンク用に日付を計算
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  // 日付選択カレンダーを開く
  const openDatePicker = (questionId) => {
    setSelectedQuestionId(questionId);
    setIsDatePickerOpen(true);
  };

  // 日付選択カレンダーを閉じる
  const closeDatePicker = () => {
    setIsDatePickerOpen(false);
    setSelectedQuestionId(null);
  };

  // 日付変更の保存処理
  const handleDateChange = (newDate) => {
    if (selectedQuestionId && newDate) {
      scheduleQuestion(selectedQuestionId, newDate);
      
      // 変更後にデータを更新
      setTimeout(() => {
        refreshData && refreshData();
      }, 100);
    }
    closeDatePicker();
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button className={styles.navButton} onClick={() => handleDateChange(prevDate)}>
            <ArrowLeft size={16} />
          </button>
          
          <h2 className={styles.modalTitle}>
            <Calendar size={18} className={styles.calendarIcon} />
            {formattedDate}の学習問題
          </h2>
          
          <button className={styles.navButton} onClick={() => handleDateChange(nextDate)}>
            <ArrowRight size={16} />
          </button>
        </div>
        
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className={styles.modalBody}>
          {questions.length === 0 ? (
            <p className={styles.noQuestions}>この日に予定されている問題はありません</p>
          ) : (
            <div className={styles.questionList}>
              {questions.map(question => (
                <div key={question.id} className={styles.questionItem}>
                  <div className={styles.questionDetails}>
                    <div className={styles.subjectInfo}>
                      <span className={styles.subjectTag}>
                        {question.subject || question.subjectName || '未分類'}
                        {question.chapter || question.chapterName ? ` - ${question.chapter || question.chapterName}` : ''}
                      </span>
                    </div>
                    <div className={styles.questionNumber}>問題 {question.number || question.id}</div>
                    {question.comment && (
                      <div className={styles.questionComment}>{question.comment}</div>
                    )}
                  </div>
                  
                  <div className={styles.questionActions}>
                    <button 
                      className={styles.rescheduleButton}
                      onClick={() => openDatePicker(question.id)}
                    >
                      日程変更
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 日付選択モーダル */}
      <DatePickerCalendarModal
        isOpen={isDatePickerOpen}
        onClose={closeDatePicker}
        onDateSelect={handleDateChange}
        initialDate={date}
      />
    </div>
  );
};

export default ScheduleDetailModal; 
