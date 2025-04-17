import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Calendar, ChevronDown, GripVertical } from 'lucide-react';
import styles from './ScheduleDetailModal.module.css';

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
  const displayText = `${question.subject}${question.chapter ? ` ${question.chapter}` : ''}-${question.number}`;

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
const ScheduleDetailModal = ({ isOpen, onClose, date, questions, scheduleQuestion }) => {
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            {format(date, 'yyyy年MM月dd日(EEE)', { locale: ja })} の問題リスト ({questions.length}件)
          </h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ (科目別アコーディオン) */}
        <div className={styles.content}>
          {questions.length > 0 ? (
            <div className={styles.accordionContainer}>
              {subjectOrder.map((subject) => (
                <div key={subject} className={styles.subjectGroup}>
                  <button 
                    className={styles.subjectHeader} 
                    onClick={() => toggleSubject(subject)}
                  >
                    <span className={styles.subjectName}>
                      {subject} ({groupedQuestions[subject].length}件)
                    </span>
                    <ChevronDown 
                      size={20} 
                      className={`${styles.subjectChevron} ${openSubjects[subject] ? styles.subjectChevronOpen : ''}`} 
                    />
                  </button>
                  {openSubjects[subject] && (
                    <div className={styles.subjectContent}>
                      {groupedQuestions[subject].map((question) => (
                        <DetailQuestionItem 
                          key={question.id} 
                          question={question} 
                          scheduleQuestion={scheduleQuestion} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noQuestionsText}>この日に予定されている問題はありません。</p>
          )}
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeButtonFooter}>閉じる</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal; 
