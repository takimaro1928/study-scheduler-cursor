// src/DayDetailModal.jsx (CSS Modules + スタイル改善版)
import React, { useState, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';
// CSSモジュールをインポート
import styles from './DayDetailModal.module.css';

// モーダル内で問題を表示するコンポーネント (カスタムクラス使用)
function ModalQuestionItem({ question }) {
  const displayText = `${question.subjectName || ''} / ${question.chapterName || ''} / 問題 ${question.id || ''}`;
  return (
    <div className={styles.modalQuestionItem} title={displayText}>
      {displayText}
    </div>
  );
}

const DayDetailModal = ({ isOpen, onClose, date, questions, formatDate }) => {
  const [openSubjects, setOpenSubjects] = useState({});

  const groupedQuestions = useMemo(() => {
    if (!questions) return {};
    return questions.reduce((acc, q) => {
      const subject = q.subjectName || '未分類';
      if (!acc[subject]) { acc[subject] = []; }
      acc[subject].push(q);
      acc[subject].sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true}));
      return acc;
    }, {});
  }, [questions]);

  // 最初はすべて開く (useEffectを使用)
  useState(() => {
      const initialOpenState = {};
      Object.keys(groupedQuestions).forEach(subject => { initialOpenState[subject] = true; });
      setOpenSubjects(initialOpenState);
  }, [groupedQuestions]); // groupedQuestions が変わった時だけ実行

  const toggleSubject = (subjectName) => {
    setOpenSubjects(prev => ({ ...prev, [subjectName]: !prev[subjectName] }));
  };

  if (!isOpen || !date) { return null; }

  const subjectOrder = Object.keys(groupedQuestions).sort();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            {formatDate(date)} の問題リスト ({questions.length}件)
          </h3>
          <button onClick={onClose} className={styles.closeButton}> <X size={24} /> </button>
        </div>

        {/* コンテンツ (科目別アコーディオン) */}
        <div className={styles.content}>
          {questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}> {/* space-y-3 相当 */}
              {subjectOrder.map((subjectName) => (
                <div key={subjectName} className={styles.subjectGroup}>
                  <button className={styles.subjectHeader} onClick={() => toggleSubject(subjectName)}>
                    <span className={styles.subjectName}>
                      {subjectName} ({groupedQuestions[subjectName].length}件)
                    </span>
                    <ChevronDown size={20} className={`${styles.subjectChevron} ${openSubjects[subjectName] ? styles.subjectChevronOpen : ''}`} />
                  </button>
                  {openSubjects[subjectName] && (
                    <div className={styles.subjectContent}>
                      <div className={styles.subjectQuestionList}>
                        {groupedQuestions[subjectName].map((q) => (
                          <ModalQuestionItem key={q.id} question={q} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noQuestionsText}>この日の問題はありません。</p>
          )}
        </div>

        {/* フッター */}
        <div className={styles.footer}>
           <button onClick={onClose} className={styles.closeButtonFooter}> 閉じる </button>
        </div>
      </div>
    </div>
  );
};

export default DayDetailModal;
