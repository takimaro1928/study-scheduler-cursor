// src/RedesignedAllQuestionsView.js
// モダンなカードデザイン + 科目カラー活用版
import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Edit, Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle, Info,
  ChevronRight, ChevronDown, ChevronUp, X as XIcon
} from 'lucide-react';
import styles from './RedesignedAllQuestionsView.module.css'; // CSSモジュール

// 科目ごとのカラーマップ（境界線の色に使用）
const subjectColorMap = {
  "経営管理論": "#4f46e5", // indigo
  "運営管理": "#10b981", // emerald 
  "経済学": "#ef4444", // red
  "経営情報システム": "#3b82f6", // blue
  "経営法務": "#8b5cf6", // purple
  "中小企業経営・中小企業政策": "#f59e0b", // amber
  "過去問題集": "#6b7280", // gray
};

// デフォルトカラー（未知の科目用）
const defaultColor = "#9ca3af";

// 科目名からカラーコードを取得する関数
const getSubjectColorCode = (subjectName) => {
  return subjectColorMap[subjectName || ""] || defaultColor;
};

// 理解度に応じたスタイルとアイコンを返す関数
const getUnderstandingStyle = (understanding) => {
  if (understanding === '理解○') {
    return {
      icon: <CheckCircle className={styles.iconGreen} size={16} />,
      badgeClass: styles.understandingBadgeGreen,
    };
  } else if (understanding?.startsWith('曖昧△')) {
    return {
      icon: <AlertTriangle className={styles.iconYellow} size={16} />,
      badgeClass: styles.understandingBadgeYellow,
    };
  } else if (understanding === '理解できていない×') {
    return {
      icon: <XCircle className={styles.iconRed} size={16} />,
      badgeClass: styles.understandingBadgeRed,
    };
  } else {
    return {
      icon: <Info className={styles.iconGray} size={16} />,
      badgeClass: styles.understandingBadgeGray,
    };
  }
};

// 正解率に応じたバーの色クラスを返す関数
const getCorrectRateColorClass = (rate) => {
  if (rate >= 80) return styles.rateBarColorGreen;
  if (rate >= 60) return styles.rateBarColorLime;
  if (rate >= 40) return styles.rateBarColorYellow;
  if (rate >= 20) return styles.rateBarColorOrange;
  return styles.rateBarColorRed;
};

const RedesignedAllQuestionsView = ({
  subjects,
  expandedSubjects = {},
  expandedChapters = {},
  toggleSubject,
  toggleChapter,
  setEditingQuestion,
  setBulkEditMode,
  bulkEditMode,
  selectedQuestions = [],
  setSelectedQuestions,
  saveBulkEdit,
  selectedDate,
  setSelectedDate,
  formatDate,
  toggleQuestionSelection,
}) => {
  // 検索とフィルター用state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    understanding: 'all',
    correctRate: 'all',
    interval: 'all',
  });

  // フィルタリングされた科目データ
  const filteredSubjects = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    
    return subjects.map(subject => {
      if (!subject?.chapters) return { ...subject, chapters: [] };
      
      const filteredChapters = subject.chapters.map(chapter => {
        if (!chapter?.questions) return { ...chapter, questions: [] };
        
        const filteredQuestions = chapter.questions.filter(question => {
          // 検索フィルタリング
          if (searchTerm && !question.id?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          
          // 理解度フィルタリング
          if (filters.understanding !== 'all') {
            if (!question.understanding?.startsWith(filters.understanding)) {
              return false;
            }
          }
          
          // 正解率フィルタリング
          if (filters.correctRate !== 'all') {
            const rate = question.correctRate || 0;
            if (filters.correctRate === 'high' && rate < 80) return false;
            if (filters.correctRate === 'medium' && (rate < 50 || rate >= 80)) return false;
            if (filters.correctRate === 'low' && rate >= 50) return false;
          }
          
          // 間隔フィルタリング
          if (filters.interval !== 'all' && question.interval !== filters.interval) {
            return false;
          }
          
          return true;
        });
        
        return { ...chapter, questions: filteredQuestions };
      }).filter(chapter => chapter.questions.length > 0);
      
      return { ...subject, chapters: filteredChapters };
    }).filter(subject => subject.chapters.length > 0);
  }, [subjects, searchTerm, filters]);

  // 科目内の全問題選択/選択解除
  const toggleSelectAllForSubject = (subject) => {
    if (!subject?.chapters) return;
    
    const allQuestionIdsInSubject = [];
    subject.chapters.forEach(chapter => {
      chapter.questions.forEach(question => {
        allQuestionIdsInSubject.push(question.id);
      });
    });
    
    if (allQuestionIdsInSubject.length === 0) return;
    
    // 全て選択されているかチェック
    const allSelected = allQuestionIdsInSubject.every(id => 
      selectedQuestions.includes(id)
    );
    
    if (allSelected) {
      // 全て選択されていれば、全て解除
      setSelectedQuestions(prev => 
        prev.filter(id => !allQuestionIdsInSubject.includes(id))
      );
    } else {
      // そうでなければ、全て選択
      setSelectedQuestions(prev => 
        [...new Set([...prev, ...allQuestionIdsInSubject])]
      );
    }
  };

  return (
    <div className={styles.container}>
      {/* 検索・フィルターコントロール */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="問題IDで検索..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={styles.searchIcon}>
            <Search size={18} />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearSearchButton}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
        
        <div className={styles.controlButtons}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.controlButton}
          >
            <Filter size={18} />
            フィルター
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`${styles.controlButton} ${
              bulkEditMode ? styles.bulkEditButtonActive : styles.bulkEditButtonInactive
            }`}
          >
            {bulkEditMode ? '選択終了' : '一括編集'}
          </button>
        </div>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div>
              <label className={styles.filterLabel}>理解度</label>
              <select
                className={styles.filterSelect}
                value={filters.understanding}
                onChange={(e) => setFilters({...filters, understanding: e.target.value})}
              >
                <option value="all">すべて</option>
                <option value="理解○">理解○</option>
                <option value="曖昧△">曖昧△</option>
                <option value="理解できていない×">理解できていない×</option>
              </select>
            </div>
            
            <div>
              <label className={styles.filterLabel}>正解率</label>
              <select
                className={styles.filterSelect}
                value={filters.correctRate}
                onChange={(e) => setFilters({...filters, correctRate: e.target.value})}
              >
                <option value="all">すべて</option>
                <option value="high">高い (80%以上)</option>
                <option value="medium">中間 (50-80%)</option>
                <option value="low">低い (50%未満)</option>
              </select>
            </div>
            
            <div>
              <label className={styles.filterLabel}>復習間隔</label>
              <select
                className={styles.filterSelect}
                value={filters.interval}
                onChange={(e) => setFilters({...filters, interval: e.target.value})}
              >
                <option value="all">すべて</option>
                <option value="1日">1日</option>
                <option value="3日">3日</option>
                <option value="7日">7日</option>
                <option value="14日">14日</option>
                <option value="1ヶ月">1ヶ月</option>
                <option value="2ヶ月">2ヶ月</option>
              </select>
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button
              onClick={() => setFilters({
                understanding: 'all',
                correctRate: 'all',
                interval: 'all',
              })}
              className={styles.filterResetButton}
            >
              フィルターをリセット
            </button>
          </div>
        </div>
      )}

      {/* 一括編集パネル */}
      {bulkEditMode && selectedQuestions.length > 0 && (
        <div className={styles.bulkEditPanel}>
          <p className="text-base font-medium text-gray-700 mb-3">
            {selectedQuestions.length}件の問題を選択中
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setSelectedDate(date);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => saveBulkEdit(selectedDate)}
              disabled={!selectedDate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              一括設定
            </button>
          </div>
        </div>
      )}

      {/* 問題リスト (アコーディオン) */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center border border-gray-200">
          <p className="text-gray-500">表示できる問題がありません</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {filteredSubjects.map(subject => {
            // 科目ごとのカラー取得
            const subjectColorValue = getSubjectColorCode(subject.name || subject.subjectName);
            
            // 科目内の全問題のIDリスト
            const allQuestionIdsInSubject = [];
            subject.chapters?.forEach(chapter => {
              chapter.questions?.forEach(question => {
                allQuestionIdsInSubject.push(question.id);
              });
            });
            
           // 全て選択されているかチェック
            const isAllSelectedInSubject = allQuestionIdsInSubject.length > 0 && 
              allQuestionIdsInSubject.every(id => selectedQuestions.includes(id));

            return (
              <div key={subject.id} className={styles.subjectAccordion}>
                <div 
                  className={styles.subjectHeader}
                  style={{ borderLeftColor: subjectColorValue }}
                  onClick={() => toggleSubject(subject.id)}
                >
                  {bulkEditMode && (
                    <input
                      type="checkbox"
                      className={styles.subjectCheckbox}
                      checked={isAllSelectedInSubject}
                      onChange={() => toggleSelectAllForSubject(subject)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div
                    className={`${styles.subjectChevron} ${
                      expandedSubjects[subject.id] ? styles.subjectChevronOpen : ''
                    }`}
                  >
                    <ChevronRight size={20} />
                  </div>
                  <h3 className={styles.subjectTitle}>
                    {subject.name || subject.subjectName || '未分類'}
                  </h3>
                  <div className={styles.subjectCountBadge}>
                    {subject.chapters.reduce(
                      (sum, chapter) => sum + chapter.questions.length,
                      0
                    )}問
                  </div>
                </div>
                
                {expandedSubjects[subject.id] && (
                  <div className={styles.subjectContent}>
                    {subject.chapters.map(chapter => (
                      <div key={chapter.id} className={styles.chapterAccordion}>
                        <div
                          className={styles.chapterHeader}
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <div
                            className={`${styles.chapterChevron} ${
                              expandedChapters[chapter.id] ? styles.chapterChevronOpen : ''
                            }`}
                          >
                            <ChevronRight size={16} />
                          </div>
                          <h4 className={styles.chapterTitle}>
                            {chapter.name || chapter.chapterName || '未分類'}
                          </h4>
                          <div className={styles.chapterCountBadge}>
                            {chapter.questions.length}問
                          </div>
                        </div>
                        
                        {expandedChapters[chapter.id] && (
                          <div className={styles.questionCardList}>
                            {chapter.questions.map(question => {
                              const understanding = getUnderstandingStyle(question.understanding);
                              const borderStyle = { borderLeftColor: subjectColorValue };
                              
                              return (
                                <div
                                  key={question.id}
                                  className={styles.questionCard}
                                  style={borderStyle}
                                >
                                  {bulkEditMode && (
                                    <input
                                      type="checkbox"
                                      className={styles.questionCheckbox}
                                      checked={selectedQuestions.includes(question.id)}
                                      onChange={() => toggleQuestionSelection(question.id)}
                                    />
                                  )}
                                  
                                  <div className={styles.questionId} title={question.id}>
                                    {question.id}
                                  </div>
                                  
                                  <div className={styles.statusGrid}>
                                    <div className={styles.statusItem} title="次回予定日">
                                      <Clock size={16} />
                                      <span>{formatDate(question.nextDate)}</span>
                                    </div>
                                    
                                    <div className={styles.statusItem} title="復習間隔">
                                      <CalendarIcon size={16} />
                                      <span>{question.interval || '未設定'}</span>
                                    </div>
                                    
                                    <div
                                      className={`${styles.statusItem} ${understanding.badgeClass}`}
                                      title={`理解度: ${question.understanding || '未設定'}`}
                                    >
                                      {understanding.icon}
                                      <span>
                                        {question.understanding?.includes(':')
                                          ? question.understanding.split(':')[0]
                                          : question.understanding || '未設定'}
                                      </span>
                                    </div>
                                    
                                    <div
                                      className={styles.statusItem}
                                      title={`正解率: ${question.correctRate || 0}% (${
                                        question.answerCount || 0
                                      }回解答)`}
                                    >
                                      <div className={styles.rateBarContainer}>
                                        <div className={styles.rateBar}>
                                          <div
                                            className={`${styles.rateBarInner} ${getCorrectRateColorClass(
                                              question.correctRate || 0
                                            )}`}
                                            style={{ width: `${question.correctRate || 0}%` }}
                                          />
                                        </div>
                                        <span className={styles.rateText}>
                                          {question.correctRate || 0}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => setEditingQuestion(question)}
                                    className={styles.editButton}
                                    title="編集"
                                  >
                                    <Edit size={18} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RedesignedAllQuestionsView;
