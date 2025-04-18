// src/RedesignedAllQuestionsView.js
// モダンなカードデザイン + 科目カラー活用版 + 検索・フィルター機能強化版
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, Edit, Clock, Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle, Info,
  ChevronRight, ChevronDown, ChevronUp, X as XIcon, FilePlus, Sliders, PlusCircle
} from 'lucide-react';
import styles from './RedesignedAllQuestionsView.module.css'; // CSSモジュール
import AddQuestionModal from './AddQuestionModal';

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

// 検索文字列内のキーワードをハイライトするコンポーネント
const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <span>{text}</span>;
  
  const normalizedText = text.toString();
  const normalizedSearch = searchTerm.toLowerCase();
  const keywords = normalizedSearch.split(/\s+/).filter(keyword => keyword.trim() !== '');
  
  if (keywords.length === 0) return <span>{text}</span>;
  
  // 正規表現をキーワードごとに作成 (大文字小文字を区別しない)
  const regexPattern = keywords.map(keyword => 
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 正規表現特殊文字のエスケープ
  ).join('|');
  
  const regex = new RegExp(`(${regexPattern})`, 'gi');
  const parts = normalizedText.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => {
        const matchesKeyword = keywords.some(
          keyword => part.toLowerCase() === keyword.toLowerCase()
        );
        return matchesKeyword ? 
          <mark key={i} className={styles.highlightedText}>{part}</mark> : 
          <span key={i}>{part}</span>;
      })}
    </span>
  );
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
  onToggleBulkEdit,
  onSaveBulkEditItems,
  onAddQuestion,
}) => {
  // 検索とフィルター用state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // 問題追加モーダル制御
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 拡張フィルターstate
  const [filters, setFilters] = useState({
    understanding: 'all',
    selectedSubjects: [],
    selectedChapters: [],
    correctRateMin: '',
    correctRateMax: '',
    answerCountMin: '',
    answerCountMax: '',
    nextDateStart: '',
    nextDateEnd: '',
    lastAnsweredStart: '',
    lastAnsweredEnd: '',
  });

  // 科目と章に関するオプション
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);

  // 科目・章オプションをロード
  useEffect(() => {
    if (!Array.isArray(subjects)) return;
    
    // 科目オプションを抽出
    const subjectOpts = subjects.map(subject => ({
      id: subject.id,
      name: subject.name || subject.subjectName || '未分類',
    }));
    
    setSubjectOptions(subjectOpts);
    
    // 選択された科目に基づいて章オプションを更新
    updateChapterOptions();
  }, [subjects]);

  // 選択された科目に基づいて章オプションを更新
  useEffect(() => {
    updateChapterOptions();
  }, [filters.selectedSubjects]);

  // 章オプションを更新する関数
  const updateChapterOptions = () => {
    if (!Array.isArray(subjects)) return;
    
    const selectedSubjectIds = filters.selectedSubjects;
    
    // 選択された科目がない場合は章リストをクリア
    if (selectedSubjectIds.length === 0) {
      setChapterOptions([]);
      return;
    }
    
    // 選択された科目に属する全ての章を取得
    const chapters = [];
    subjects.forEach(subject => {
      if (selectedSubjectIds.includes(subject.id) && Array.isArray(subject.chapters)) {
        subject.chapters.forEach(chapter => {
          chapters.push({
            id: chapter.id,
            name: chapter.name || chapter.chapterName || '未分類',
            subjectId: subject.id,
            subjectName: subject.name || subject.subjectName || '未分類',
          });
        });
      }
    });
    
    setChapterOptions(chapters);
  };

  // 科目選択を切り替える
  const toggleSubjectSelection = (subjectId) => {
    setFilters(prev => {
      const newSelectedSubjects = [...prev.selectedSubjects];
      const index = newSelectedSubjects.indexOf(subjectId);
      
      if (index > -1) {
        newSelectedSubjects.splice(index, 1);
      } else {
        newSelectedSubjects.push(subjectId);
      }
      
      // 選択された科目に属さない章があれば選択解除
      const validChapterIds = Array.isArray(subjects) ? 
        subjects
          .filter(s => newSelectedSubjects.includes(s.id))
          .flatMap(s => s.chapters || [])
          .map(c => c.id) : 
        [];
      
      const newSelectedChapters = prev.selectedChapters.filter(chapterId => 
        validChapterIds.includes(chapterId)
      );
      
      return { 
        ...prev, 
        selectedSubjects: newSelectedSubjects,
        selectedChapters: newSelectedChapters
      };
    });
  };

  // 章選択を切り替える
  const toggleChapterSelection = (chapterId) => {
    setFilters(prev => {
      const newSelectedChapters = [...prev.selectedChapters];
      const index = newSelectedChapters.indexOf(chapterId);
      
      if (index > -1) {
        newSelectedChapters.splice(index, 1);
      } else {
        newSelectedChapters.push(chapterId);
      }
      
      return { ...prev, selectedChapters: newSelectedChapters };
    });
  };

  // 全ての科目選択を切り替える
  const toggleAllSubjects = () => {
    setFilters(prev => {
      const allSubjectIds = subjectOptions.map(s => s.id);
      const newSelectedSubjects = prev.selectedSubjects.length === allSubjectIds.length ? 
        [] : 
        allSubjectIds;
      
      // 全科目選択が解除された場合は、章の選択も全て解除する
      const newSelectedChapters = newSelectedSubjects.length > 0 ? 
        prev.selectedChapters : 
        [];
      
      return { 
        ...prev, 
        selectedSubjects: newSelectedSubjects,
        selectedChapters: newSelectedChapters
      };
    });
  };

  // 全ての章選択を切り替える
  const toggleAllChapters = () => {
    setFilters(prev => {
      const allChapterIds = chapterOptions.map(c => c.id);
      const newSelectedChapters = prev.selectedChapters.length === allChapterIds.length ? 
        [] : 
        allChapterIds;
      
      return { ...prev, selectedChapters: newSelectedChapters };
    });
  };

  // アクティブなフィルター数を計算
  useEffect(() => {
    let count = 0;
    
    // 検索語句
    if (searchTerm.trim()) count++;
    
    // 理解度
    if (filters.understanding !== 'all') count++;
    
    // 科目
    if (filters.selectedSubjects.length > 0 && 
        filters.selectedSubjects.length < subjectOptions.length) count++;
    
    // 章
    if (filters.selectedChapters.length > 0 && 
        filters.selectedChapters.length < chapterOptions.length) count++;
    
    // 正解率
    if (filters.correctRateMin || filters.correctRateMax) count++;
    
    // 解答回数
    if (filters.answerCountMin || filters.answerCountMax) count++;
    
    // 次回予定日
    if (filters.nextDateStart || filters.nextDateEnd) count++;
    
    // 最終解答日
    if (filters.lastAnsweredStart || filters.lastAnsweredEnd) count++;
    
    setActiveFiltersCount(count);
  }, [filters, searchTerm, subjectOptions.length, chapterOptions.length]);

  // フィルタリングされた科目データ
  const filteredSubjects = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    
    // 検索キーワードを配列化 (スペース区切り)
    const searchKeywords = searchTerm.trim().toLowerCase().split(/\s+/).filter(k => k);
    
    return subjects.map(subject => {
      if (!subject?.chapters) return { ...subject, chapters: [] };
      
      // 科目名と科目IDを取得 (互換性のため両方のプロパティをチェック)
      const subjectName = subject.name || subject.subjectName || '';
      const subjectId = subject.id;
      
      // 科目フィルター (科目が選択されていない場合は全科目を表示)
      if (filters.selectedSubjects.length > 0 && !filters.selectedSubjects.includes(subjectId)) {
        return { ...subject, chapters: [] };
      }
      
      const filteredChapters = subject.chapters.map(chapter => {
        if (!chapter?.questions) return { ...chapter, questions: [] };
        
        // 章名と章IDを取得 (互換性のため両方のプロパティをチェック)
        const chapterName = chapter.name || chapter.chapterName || '';
        const chapterId = chapter.id;
        
        // 章フィルター (章が選択されていない場合は全章を表示)
        if (filters.selectedChapters.length > 0 && !filters.selectedChapters.includes(chapterId)) {
          return { ...chapter, questions: [] };
        }
        
        const filteredQuestions = chapter.questions.filter(question => {
          // 検索フィルタリング (複数キーワード対応)
          if (searchKeywords.length > 0) {
            const questionId = question.id?.toLowerCase() || '';
            const comment = question.comment?.toLowerCase() || '';
            
            // いずれかのキーワードがマッチするかチェック (OR検索)
            const keywordMatch = searchKeywords.some(keyword => 
              questionId.includes(keyword) || 
              subjectName.toLowerCase().includes(keyword) || 
              chapterName.toLowerCase().includes(keyword) || 
              comment.includes(keyword)
            );
            
            if (!keywordMatch) return false;
          }
          
          // 理解度フィルタリング
          if (filters.understanding !== 'all') {
            if (!question.understanding?.startsWith(filters.understanding)) {
              return false;
            }
          }
          
          // 正解率範囲フィルタリング
          const rate = question.correctRate ?? 0;
          if (filters.correctRateMin && rate < parseInt(filters.correctRateMin, 10)) return false;
          if (filters.correctRateMax && rate > parseInt(filters.correctRateMax, 10)) return false;
          
          // 解答回数範囲フィルタリング
          const answerCount = question.answerCount ?? 0;
          if (filters.answerCountMin && answerCount < parseInt(filters.answerCountMin, 10)) return false;
          if (filters.answerCountMax && answerCount > parseInt(filters.answerCountMax, 10)) return false;
          
          // 次回予定日範囲フィルタリング
          if (question.nextDate) {
            const nextDate = new Date(question.nextDate);
            if (filters.nextDateStart) {
              const startDate = new Date(filters.nextDateStart);
              if (nextDate < startDate) return false;
            }
            if (filters.nextDateEnd) {
              const endDate = new Date(filters.nextDateEnd);
              endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
              if (nextDate > endDate) return false;
            }
          } else if (filters.nextDateStart || filters.nextDateEnd) {
            // 次回予定日が設定されておらず、フィルターが有効な場合は除外
            return false;
          }
          
          // 最終解答日範囲フィルタリング
          if (question.lastAnswered) {
            const lastAnswered = new Date(question.lastAnswered);
            if (filters.lastAnsweredStart) {
              const startDate = new Date(filters.lastAnsweredStart);
              if (lastAnswered < startDate) return false;
            }
            if (filters.lastAnsweredEnd) {
              const endDate = new Date(filters.lastAnsweredEnd);
              endDate.setHours(23, 59, 59, 999); // 終了日は日の終わりまで
              if (lastAnswered > endDate) return false;
            }
          } else if (filters.lastAnsweredStart || filters.lastAnsweredEnd) {
            // 最終解答日が設定されておらず、フィルターが有効な場合は除外
            return false;
          }
          
          return true;
        });
        
        return { ...chapter, questions: filteredQuestions };
      }).filter(chapter => chapter.questions.length > 0);
      
      return { ...subject, chapters: filteredChapters };
    }).filter(subject => subject.chapters.length > 0);
  }, [subjects, searchTerm, filters]);

  // すべてのフィルターをリセット
  const resetAllFilters = () => {
    setSearchTerm('');
    setFilters({
      understanding: 'all',
      selectedSubjects: [],
      selectedChapters: [],
      correctRateMin: '',
      correctRateMax: '',
      answerCountMin: '',
      answerCountMax: '',
      nextDateStart: '',
      nextDateEnd: '',
      lastAnsweredStart: '',
      lastAnsweredEnd: '',
    });
  };
  
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
            placeholder="キーワードで検索 (問題ID、科目名、章名、コメント)"
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
            onClick={() => setShowAddModal(true)}
            className={styles.addButton}
          >
            <PlusCircle size={18} />
            新規問題追加
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.controlButton} ${activeFiltersCount > 0 ? styles.activeFilterButton : ''}`}
          >
            <Filter size={18} />
            フィルター
            {activeFiltersCount > 0 && (
              <span className={styles.filterBadge}>{activeFiltersCount}</span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <button
            onClick={() => onToggleBulkEdit ? onToggleBulkEdit() : setBulkEditMode(!bulkEditMode)}
            className={`${styles.controlButton} ${
              bulkEditMode ? styles.bulkEditButtonActive : styles.bulkEditButtonInactive
            }`}
          >
            {bulkEditMode ? '選択終了' : '一括編集'}
          </button>
        </div>
      </div>

      {/* 新規問題追加モーダル */}
      {showAddModal && (
        <AddQuestionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(newQuestion) => {
            if (onAddQuestion) {
              onAddQuestion(newQuestion);
            }
            setShowAddModal(false);
          }}
          subjects={subjects}
        />
      )}

      {/* 拡張フィルターパネル */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>基本フィルター</h3>
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
                <label className={styles.filterLabel}>正解率 (%)</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最小"
                    className={styles.rangeInput}
                    value={filters.correctRateMin}
                    onChange={(e) => setFilters({...filters, correctRateMin: e.target.value})}
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="最大"
                    className={styles.rangeInput}
                    value={filters.correctRateMax}
                    onChange={(e) => setFilters({...filters, correctRateMax: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className={styles.filterLabel}>解答回数</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="number"
                    min="0"
                    placeholder="最小"
                    className={styles.rangeInput}
                    value={filters.answerCountMin}
                    onChange={(e) => setFilters({...filters, answerCountMin: e.target.value})}
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="最大"
                    className={styles.rangeInput}
                    value={filters.answerCountMax}
                    onChange={(e) => setFilters({...filters, answerCountMax: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>日付フィルター</h3>
            <div className={styles.filterGrid}>
              <div>
                <label className={styles.filterLabel}>次回予定日</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.nextDateStart}
                    onChange={(e) => setFilters({...filters, nextDateStart: e.target.value})}
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.nextDateEnd}
                    onChange={(e) => setFilters({...filters, nextDateEnd: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className={styles.filterLabel}>最終解答日</label>
                <div className={styles.rangeInputContainer}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.lastAnsweredStart}
                    onChange={(e) => setFilters({...filters, lastAnsweredStart: e.target.value})}
                  />
                  <span className={styles.rangeSeparator}>〜</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={filters.lastAnsweredEnd}
                    onChange={(e) => setFilters({...filters, lastAnsweredEnd: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>科目・章フィルター</h3>
            
            {/* 科目選択 */}
            <div className={styles.multiSelectContainer}>
              <div className={styles.multiSelectHeader}>
                <label className={styles.filterLabel}>科目</label>
                <button 
                  className={styles.toggleAllButton}
                  onClick={toggleAllSubjects}
                >
                  {filters.selectedSubjects.length === subjectOptions.length ? "全て解除" : "全て選択"}
                </button>
              </div>
              <div className={styles.multiSelectGrid}>
                {subjectOptions.map(subject => (
                  <div key={subject.id} className={styles.checkboxItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={filters.selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubjectSelection(subject.id)}
                        className={styles.checkbox}
                      />
                      <span>{subject.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 章選択 (科目が選択されている場合のみ表示) */}
            {filters.selectedSubjects.length > 0 && chapterOptions.length > 0 && (
              <div className={styles.multiSelectContainer}>
                <div className={styles.multiSelectHeader}>
                  <label className={styles.filterLabel}>章</label>
                  <button 
                    className={styles.toggleAllButton}
                    onClick={toggleAllChapters}
                  >
                    {filters.selectedChapters.length === chapterOptions.length ? "全て解除" : "全て選択"}
                  </button>
                </div>
                <div className={styles.multiSelectGrid}>
                  {chapterOptions.map(chapter => (
                    <div key={chapter.id} className={styles.checkboxItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={filters.selectedChapters.includes(chapter.id)}
                          onChange={() => toggleChapterSelection(chapter.id)}
                          className={styles.checkbox}
                        />
                        <span title={`${chapter.subjectName}: ${chapter.name}`}>
                          {chapter.name}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.filterActions}>
            <button
              onClick={resetAllFilters}
              className={styles.filterResetButton}
            >
              <XIcon size={14} className={styles.resetIcon} />
              フィルターをリセット
            </button>
          </div>
        </div>
      )}

      {/* 一括編集パネル */}
      {bulkEditMode && selectedQuestions.length > 0 && (
        <div className={styles.bulkEditPanel}>
          <p className={styles.bulkEditMessage}>
            {selectedQuestions.length}件の問題を選択中
          </p>
          <div className={styles.bulkEditControls}>
            <input
              type="date"
              value={selectedDate instanceof Date 
                ? selectedDate.toISOString().split('T')[0] 
                : selectedDate 
                  ? new Date(selectedDate).toISOString().split('T')[0] 
                  : ''}
              onChange={(e) => {
                try {
                  // 日付文字列をそのまま保持
                  const dateStr = e.target.value;
                  console.log("選択された日付文字列:", dateStr);
                  
                  if (dateStr) {
                    // 表示用にDateオブジェクトも作成
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const dateObj = new Date(year, month-1, day);
                    console.log("変換後の日付オブジェクト:", dateObj);
                    
                    if (!isNaN(dateObj.getTime())) {
                      setSelectedDate(dateStr);
                    } else {
                      console.error("無効な日付形式:", dateStr);
                    }
                  } else {
                    setSelectedDate(null);
                  }
                } catch (e) {
                  console.error("日付処理エラー:", e);
                  setSelectedDate(null);
                }
              }}
              className={styles.bulkEditDateInput}
            />
            <button
              onClick={() => {
                if (selectedDate) {
                  console.log("一括編集の日付:", selectedDate);
                  // saveBulkEdit 関数を呼び出して一括編集を実行
                  // この関数は App.js から渡されたもので、選択した日付を nextDate として設定する
                  saveBulkEdit(selectedDate);
                } else {
                  alert("日付を選択してください");
                }
              }}
              disabled={!selectedDate}
              className={styles.bulkEditButton}
            >
              次回日付を一括設定
            </button>
          </div>
        </div>
      )}

      {/* 問題リスト (アコーディオン) */}
      {filteredSubjects.length === 0 ? (
        <div className={styles.noResults}>
          <div className={styles.noResultsIcon}>
            <FilePlus size={36} />
          </div>
          <p className={styles.noResultsMessage}>
            {searchTerm || activeFiltersCount > 0 ? 
              "検索条件に一致する問題がありません" : 
              "表示できる問題がありません"}
          </p>
          {(searchTerm || activeFiltersCount > 0) && (
            <button onClick={resetAllFilters} className={styles.resetSearchButton}>
              検索条件をリセット
            </button>
          )}
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
                    <HighlightedText 
                      text={subject.name || subject.subjectName || '未分類'} 
                      searchTerm={searchTerm}
                    />
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
                            <HighlightedText 
                              text={chapter.name || chapter.chapterName || '未分類'} 
                              searchTerm={searchTerm}
                            />
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
                                    <HighlightedText 
                                      text={question.id} 
                                      searchTerm={searchTerm}
                                    />
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
                                  
                                  {question.comment && (
                                    <div className={styles.commentBox} title={question.comment}>
                                      <HighlightedText 
                                        text={question.comment} 
                                        searchTerm={searchTerm}
                                      />
                                    </div>
                                  )}
                                  
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
