// src/AmbiguousTrendsPage.js
// テーブルソート機能の不具合修正版 + 科目名/章名プロパティ対応版

import React, { useState, useEffect, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, Info, ArrowUpDown, BarChart2, AlertCircle, RotateCcw, TrendingUp, Edit2, TrendingDown, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import styles from './AmbiguousTrendsPage.module.css';
import CommentEditModal from './CommentEditModal';

// 曖昧問題データを取得・整形する関数
function getAmbiguousQuestions(subjects) {
  const ambiguousQuestions = []; 
  if (!Array.isArray(subjects)) return ambiguousQuestions;
  
  subjects.forEach(subject => { 
    if (!subject?.chapters) return; 
    
    // 両方のプロパティ名に対応
    const currentSubjectName = subject.subjectName || subject.name || '?';
    
    subject.chapters.forEach(chapter => { 
      if (!chapter?.questions) return; 
      
      // 両方のプロパティ名に対応
      const currentChapterName = chapter.chapterName || chapter.name || '?';
      
      chapter.questions.forEach(question => {
        if (typeof question !== 'object' || question === null) return; 
        if (question.understanding?.startsWith('曖昧△')) {
          let reason = '理由なし'; 
          if (question.understanding.includes(':')) { 
            reason = question.understanding.split(':')[1].trim(); 
          }
          const lastAnsweredDate = question.lastAnswered ? new Date(question.lastAnswered) : null; 
          const nextDateDate = question.nextDate ? new Date(question.nextDate) : null;
          
          ambiguousQuestions.push({ 
            id: question.id || '?', 
            subjectId: subject.id, 
            subjectName: currentSubjectName, 
            chapterId: chapter.id, 
            chapterName: currentChapterName,
            reason: reason, 
            correctRate: question.correctRate ?? 0, 
            lastAnswered: !isNaN(lastAnsweredDate?.getTime()) ? lastAnsweredDate : null, 
            nextDate: !isNaN(nextDateDate?.getTime()) ? nextDateDate : null, 
            answerCount: question.answerCount ?? 0, 
            previousUnderstanding: question.previousUnderstanding, 
            comment: question.comment || '', 
          }); 
        } 
      }); 
    }); 
  });
  
  return ambiguousQuestions;
}

// 日付のフォーマット関数
const formatDateInternal = (date) => { if (!date || !(date instanceof Date) || isNaN(date.getTime())) { return '----/--/--'; } try { return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`; } catch (e) { console.error("formatDateエラー:", e); return 'エラー'; } };

// 自然順ソート用の比較関数 - より強固なバージョン
function naturalSortCompare(a, b, order = 'asc') {
  // Nullチェック (nullは常にソートの最後に)
  const nullOrder = (order === 'asc' ? 1 : -1);
  if (a == null && b != null) return nullOrder;
  if (a != null && b == null) return -nullOrder;
  if (a == null && b == null) return 0;

  // 文字列に変換
  const aStr = String(a);
  const bStr = String(b);

  // 数字部分と非数字部分に分割する正規表現
  const re = /(\d+)|(\D+)/g;
  
  // 文字列を部分に分割
  const aParts = aStr.match(re) || [];
  const bParts = bStr.match(re) || [];
  
  // 最小の長さまで比較
  const len = Math.min(aParts.length, bParts.length);
  
  for (let i = 0; i < len; i++) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    
    // 数値部分の比較
    const aNum = parseInt(aPart, 10);
    const bNum = parseInt(bPart, 10);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    } else {
      // 文字列部分の比較
      const comparison = aPart.localeCompare(bPart, undefined, { sensitivity: 'base' });
      if (comparison !== 0) {
        return comparison;
      }
    }
  }
  
  // 部分の長さで比較（短い方が先）
  return aParts.length - bParts.length;
}

// ソート処理を共通化する関数 - 改良版
const sortData = (dataToSort, sortKey, sortOrder) => {
  if (!Array.isArray(dataToSort)) {
    console.warn("sortData received non-array:", dataToSort);
    return [];
  }
  
  // null/undefinedでないオブジェクトのみフィルタリング
  const validData = dataToSort.filter(item => typeof item === 'object' && item !== null);
  
  return validData.slice().sort((a, b) => {
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return 0;
    }
    
    const valA = a[sortKey];
    const valB = b[sortKey];
    
    // nullチェック - nullは常にソートの最後に
    if (valA == null && valB != null) return sortOrder === 'asc' ? 1 : -1;
    if (valA != null && valB == null) return sortOrder === 'asc' ? -1 : 1;
    if (valA == null && valB == null) return 0;
    
    let comparison = 0;
    
    // データ型に応じた比較ロジック
    if (sortKey === 'lastAnswered' || sortKey === 'nextDate') {
      // 日付型の比較
      const dateA = valA instanceof Date ? valA : new Date(valA);
      const dateB = valB instanceof Date ? valB : new Date(valB);
      
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
        comparison = 0;
      } else if (isNaN(dateA.getTime())) {
        comparison = 1; // 無効な日付は後ろに
      } else if (isNaN(dateB.getTime())) {
        comparison = -1; // 無効な日付は後ろに
      } else {
        comparison = dateA.getTime() - dateB.getTime();
      }
    } else if (sortKey === 'correctRate' || sortKey === 'answerCount') {
      // 数値型の比較
      const numA = typeof valA === 'number' ? valA : parseFloat(valA);
      const numB = typeof valB === 'number' ? valB : parseFloat(valB);
      
      if (isNaN(numA) && isNaN(numB)) {
        comparison = 0;
      } else if (isNaN(numA)) {
        comparison = 1; // 無効な数値は後ろに
      } else if (isNaN(numB)) {
        comparison = -1; // 無効な数値は後ろに
      } else {
        comparison = numA - numB;
      }
    } else {
      // 文字列型または混合型の比較
      if (sortKey === 'id' || sortKey === 'chapterName' || sortKey === 'subjectName' || sortKey === 'reason') {
        // 自然順ソートを適用
        comparison = naturalSortCompare(valA, valB);
      } else {
        // 通常の文字列比較
        const strA = String(valA);
        const strB = String(valB);
        comparison = strA.localeCompare(strB, undefined, { sensitivity: 'base' });
      }
    }
    
    // ソート順に応じて結果を反転
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

// 曖昧問題傾向表示ページコンポーネント
const AmbiguousTrendsPage = ({ subjects, formatDate = formatDateInternal, answerHistory = [], saveComment }) => {
  // --- State ---
  const [filter, setFilter] = useState({ reason: 'all', subject: 'all', period: 'all' });
  
  // ★ 各テーブル用の独立したソート状態を管理 ★
  const [allQuestionsSort, setAllQuestionsSort] = useState({ key: 'lastAnswered', order: 'desc' });
  const [longStagnantSort, setLongStagnantSort] = useState({ key: 'lastAnswered', order: 'desc' });
  const [recentRevertedSort, setRecentRevertedSort] = useState({ key: 'lastAnswered', order: 'desc' });
  const [completeRevertedSort, setCompleteRevertedSort] = useState({ key: 'lastAnswered', order: 'desc' });
  
  const [showFilters, setShowFilters] = useState(false);
  const [editingCommentQuestion, setEditingCommentQuestion] = useState(null);
  const [expandedCommentId, setExpandedCommentId] = useState(null); // クリック表示用State

  // --- Memoized Data ---
  const ambiguousQuestions = useMemo(() => getAmbiguousQuestions(subjects || []), [subjects]);

  const recentRevertedQuestions = useMemo(() => {
    console.log("[AmbiguousTrendsPage] Calculating recent reverted questions...");
    if (!answerHistory || answerHistory.length === 0) {
        console.log("[AmbiguousTrendsPage] No answer history for recent reverted.");
        return [];
    }
    const historyByQuestion = answerHistory.reduce((acc, record) => {
      if (!record || !record.questionId || !record.timestamp) return acc;
      if (!acc[record.questionId]) { acc[record.questionId] = []; }
      const timestamp = new Date(record.timestamp);
      if (!isNaN(timestamp.getTime())) {
        acc[record.questionId].push({ timestamp, understanding: record.understanding || '' });
      }
      return acc;
    }, {});
    Object.values(historyByQuestion).forEach(history => history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
    const revertedQuestionIds = new Set();
    Object.keys(historyByQuestion).forEach(questionId => {
      const history = historyByQuestion[questionId];
      if (history.length >= 2) {
        const lastRecord = history[history.length - 1];
        const secondLastRecord = history[history.length - 2];
        if (lastRecord.understanding?.startsWith('曖昧△') && secondLastRecord.understanding === '理解○') {
          revertedQuestionIds.add(questionId);
        }
      }
    });
    console.log("[AmbiguousTrendsPage] Found recent reverted question IDs:", revertedQuestionIds);
    const results = ambiguousQuestions.filter(q => revertedQuestionIds.has(q.id));
    console.log("[AmbiguousTrendsPage] Filtered recent reverted questions (currently ambiguous):", results.length);
    return results;
  }, [answerHistory, ambiguousQuestions]);

  const completeRevertedQuestions = useMemo(() => {
    console.log("[AmbiguousTrendsPage] Calculating complete reverted questions...");
    if (!answerHistory || answerHistory.length === 0) {
        console.log("[AmbiguousTrendsPage] No answer history for complete reverted.");
        return [];
    }
     const historyByQuestion = answerHistory.reduce((acc, record) => {
       if (!record || !record.questionId || !record.timestamp) return acc;
       if (!acc[record.questionId]) { acc[record.questionId] = []; }
       const timestamp = new Date(record.timestamp);
       if (!isNaN(timestamp.getTime())) {
           acc[record.questionId].push({ timestamp, understanding: record.understanding || '' });
       }
       return acc;
     }, {});
     Object.values(historyByQuestion).forEach(history => history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
     const revertedQuestionIds = new Set();
     Object.keys(historyByQuestion).forEach(questionId => {
         const history = historyByQuestion[questionId];
         let state = 'initial';
         for (const record of history) {
             const isAmbiguous = record.understanding?.startsWith('曖昧△');
             const isUnderstood = record.understanding === '理解○';
             switch (state) {
                 case 'initial': if (isAmbiguous) state = 'ambiguous'; else if (isUnderstood) state = 'understood_first'; break;
                 case 'understood_first': if (isAmbiguous) state = 'ambiguous'; break;
                 case 'ambiguous': if (isUnderstood) state = 'understood'; break;
                 case 'understood': if (isAmbiguous) { state = 'reverted'; revertedQuestionIds.add(questionId); } break;
                 case 'reverted': break;
                 default: break;
             }
             if (state === 'reverted') break;
         }
     });
     console.log("[AmbiguousTrendsPage] Found complete reverted question IDs:", revertedQuestionIds);
     const results = ambiguousQuestions.filter(q => revertedQuestionIds.has(q.id));
     console.log("[AmbiguousTrendsPage] Filtered complete reverted questions (currently ambiguous):", results.length);
     return results;
  }, [answerHistory, ambiguousQuestions]);

  const ambiguousCountBySubject = useMemo(() => {
    const counts = {};
    ambiguousQuestions.forEach(q => {
      counts[q.subjectName] = (counts[q.subjectName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ subjectName: name, count })).sort((a, b) => b.count - a.count);
  }, [ambiguousQuestions]);

  const longStagnantQuestions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return ambiguousQuestions.filter(q => q.lastAnswered && q.lastAnswered < thirtyDaysAgo);
  }, [ambiguousQuestions]);

  const ambiguousTrendsData = useMemo(() => {
    console.log("[AmbiguousTrendsPage] Calculating ambiguous trends data...");
    if (!answerHistory || answerHistory.length === 0) {
        console.log("[AmbiguousTrendsPage] No answer history for trends data.");
        return [];
    }
    const historySorted = [...answerHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const trends = [];
    const questionLastState = new Map();
    let dailyAmbiguousCount = 0;
    let currentDate = '';
    ambiguousQuestions.forEach(q => {
        questionLastState.set(q.id, q.understanding);
    });
    historySorted.forEach((record, index) => {
      if (!record || !record.timestamp || !record.questionId) return;
      const recordDate = new Date(record.timestamp);
      const recordDateString = formatDateInternal(recordDate);
      const currentUnderstanding = record.understanding || '';
      const previousUnderstanding = questionLastState.get(record.questionId);
      if (currentDate === '') {
        currentDate = recordDateString;
         let initialCount = 0;
         questionLastState.forEach(state => { if(state?.startsWith('曖昧△')) initialCount++; });
         dailyAmbiguousCount = initialCount;
      } else if (recordDateString !== currentDate) {
        trends.push({ date: currentDate, count: dailyAmbiguousCount });
        currentDate = recordDateString;
      }
      const wasAmbiguous = previousUnderstanding?.startsWith('曖昧△');
      const isAmbiguous = currentUnderstanding.startsWith('曖昧△');
      if (!wasAmbiguous && isAmbiguous) {
        dailyAmbiguousCount++;
      } else if (wasAmbiguous && !isAmbiguous) {
        dailyAmbiguousCount = Math.max(0, dailyAmbiguousCount - 1);
      }
      questionLastState.set(record.questionId, currentUnderstanding);
      if (index === historySorted.length - 1) {
        trends.push({ date: currentDate, count: dailyAmbiguousCount });
      }
    });
     console.log("[AmbiguousTrendsPage] Calculated ambiguous trends data points:", trends.length);
    return trends;
  }, [answerHistory, ambiguousQuestions]);

  const filteredQuestionsBase = useMemo(() => {
    let filtered = [...ambiguousQuestions];
    if (filter.reason !== 'all') {
      filtered = filtered.filter(q => q.reason === filter.reason);
    }
    if (filter.subject !== 'all') {
      filtered = filtered.filter(q => q.subjectName === filter.subject);
    }
    if (filter.period !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      switch (filter.period) {
        case 'week': cutoffDate.setDate(now.getDate() - 7); break;
        case 'month': cutoffDate.setMonth(now.getMonth() - 1); break;
        case 'quarter': cutoffDate.setMonth(now.getMonth() - 3); break;
        default: break;
      }
      if (filter.period !== 'all') {
        filtered = filtered.filter(q => q.lastAnswered && q.lastAnswered >= cutoffDate);
      }
    }
    return filtered;
  }, [ambiguousQuestions, filter]);

  // ★ 各テーブル用に独立したソート処理を適用 ★
  const filteredAndSortedQuestions = useMemo(() => 
    sortData(filteredQuestionsBase, allQuestionsSort.key, allQuestionsSort.order), 
    [filteredQuestionsBase, allQuestionsSort]
  );
  
  const sortedLongStagnantQuestions = useMemo(() => 
    sortData(longStagnantQuestions, longStagnantSort.key, longStagnantSort.order), 
    [longStagnantQuestions, longStagnantSort]
  );
  
  const sortedRecentRevertedQuestions = useMemo(() => 
    sortData(recentRevertedQuestions, recentRevertedSort.key, recentRevertedSort.order), 
    [recentRevertedQuestions, recentRevertedSort]
  );
  
  const sortedCompleteRevertedQuestions = useMemo(() => 
    sortData(completeRevertedQuestions, completeRevertedSort.key, completeRevertedSort.order), 
    [completeRevertedQuestions, completeRevertedSort]
  );

  const filterOptions = useMemo(() => {
    const reasons = [...new Set(ambiguousQuestions.map(q => q.reason))].sort();
    const subjects = [...new Set(ambiguousQuestions.map(q => q.subjectName))].sort();
    return { reasons, subjects };
  }, [ambiguousQuestions]);

  // --- Handlers ---
  // ★ テーブルごとに独立したソートハンドラを実装 ★
  const handleSort = (tableType, key) => {
    switch (tableType) {
      case 'all':
        setAllQuestionsSort(prevSort => ({
          key: key,
          order: prevSort.key === key && prevSort.order === 'desc' ? 'asc' : 'desc'
        }));
        break;
      case 'longStagnant':
        setLongStagnantSort(prevSort => ({
          key: key,
          order: prevSort.key === key && prevSort.order === 'desc' ? 'asc' : 'desc'
        }));
        break;
      case 'recentReverted':
        setRecentRevertedSort(prevSort => ({
          key: key,
          order: prevSort.key === key && prevSort.order === 'desc' ? 'asc' : 'desc'
        }));
        break;
      case 'completeReverted':
        setCompleteRevertedSort(prevSort => ({
          key: key,
          order: prevSort.key === key && prevSort.order === 'desc' ? 'asc' : 'desc'
        }));
        break;
      default:
        console.warn("Unknown table type for sorting:", tableType);
    }
  };
  
  // ★ テーブルごとのソートアイコン取得関数 ★
  const getSortIcon = (tableType, key) => {
    let currentSort;
    
    switch (tableType) {
      case 'all': 
        currentSort = allQuestionsSort;
        break;
      case 'longStagnant': 
        currentSort = longStagnantSort;
        break;
      case 'recentReverted': 
        currentSort = recentRevertedSort;
        break;
      case 'completeReverted': 
        currentSort = completeRevertedSort;
        break;
      default:
        console.warn("Unknown table type for sort icon:", tableType);
        return <ArrowUpDown size={14} className={styles.sortIcon} />;
    }
    
    if (currentSort.key !== key) {
      return <ArrowUpDown size={14} className={styles.sortIcon} />;
    }
    
    return currentSort.order === 'desc'
      ? <ChevronDown size={14} className={styles.sortIconActive} />
      : <ChevronUp size={14} className={styles.sortIconActive} />;
  };
  
  const handleEditCommentClick = (question) => { setEditingCommentQuestion(question); };
  const handleCloseCommentModal = () => { setEditingCommentQuestion(null); };
  // コメントクリック時のハンドラ
  const handleCommentClick = (questionId) => {
    setExpandedCommentId(prevId => (prevId === questionId ? null : questionId));
  };

  // --- テーブルレンダリング関数 ---
  // ★ renderTableを修正し、テーブルタイプを引数に追加 ★
  const renderTable = (tableType, title, titleIcon, titleColor, subtitle, data, emptyMessage, emptyBgColor) => {
    const tableData = Array.isArray(data) ? data : [];
    console.log(`Rendering table: ${title}, Data count: ${tableData.length}`);
    return (
       <div className={styles.tableContainer} style={{marginTop: '2rem', borderColor: titleColor || '#e5e7eb' }}>
         <h3 className={styles.tableTitle} style={{color: titleColor || '#1f2937' }}> {titleIcon && React.createElement(titleIcon, { size: 18, style: { marginRight: '0.5rem', color: titleColor || '#4f46e5' } })} {title} ({tableData.length}件) {subtitle && <span style={{fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', color: '#71717a' }}>{subtitle}</span>} </h3>
         {tableData.length > 0 ? (
           <table className={styles.table}>
             <thead> <tr> 
               <th onClick={() => handleSort(tableType, 'id')}>問題ID {getSortIcon(tableType, 'id')}</th> 
               <th onClick={() => handleSort(tableType, 'subjectName')}>科目 {getSortIcon(tableType, 'subjectName')}</th> 
               <th onClick={() => handleSort(tableType, 'chapterName')}>章 {getSortIcon(tableType, 'chapterName')}</th> 
               <th onClick={() => handleSort(tableType, 'reason')}>理由 {getSortIcon(tableType, 'reason')}</th> 
               <th>コメント</th> 
               <th onClick={() => handleSort(tableType, 'correctRate')}>正答率 {getSortIcon(tableType, 'correctRate')}</th> 
               <th onClick={() => handleSort(tableType, 'answerCount')}>解答回数 {getSortIcon(tableType, 'answerCount')}</th> 
               <th onClick={() => handleSort(tableType, 'lastAnswered')}>最終解答日 {getSortIcon(tableType, 'lastAnswered')}</th> 
               <th>編集</th> 
             </tr> </thead>
             <tbody> {tableData.map(q => {
                if (!q) return null;
                const lastAnsweredDate = (q.lastAnswered instanceof Date && !isNaN(q.lastAnswered)) ? q.lastAnswered : null;
                const isExpanded = expandedCommentId === q.id; // このコメントが全文表示中か
                return (
                 <tr key={q.id}>
                   <td>{q.id ?? 'N/A'}</td>
                   <td>{q.subjectName ?? 'N/A'}</td>
                   <td>{q.chapterName ?? 'N/A'}</td>
                   <td>{q.reason ?? 'N/A'}</td>
                   <td className={styles.commentCell}>
                     <span
                       className={styles.commentTextAbbr}
                       onClick={() => handleCommentClick(q.id)}
                       title={isExpanded ? "" : "クリックして全文表示"}
                     >
                       {q.comment ?? ''}
                     </span>
                     {isExpanded && (
                       <div className={styles.expandedCommentBox}>
                         <button
                           className={styles.closeExpandedComment}
                           onClick={() => setExpandedCommentId(null)}
                           title="閉じる"
                         >
                           <X size={14} />
                         </button>
                         {q.comment}
                       </div>
                     )}
                   </td>
                   <td>{q.correctRate != null ? `${q.correctRate}%` : 'N/A'}</td>
                   <td>{q.answerCount ?? 'N/A'}</td>
                   <td style={title === '長期停滞している曖昧問題' ? {color: '#dc2626', fontWeight: 500} : {}}>{formatDate(lastAnsweredDate)}</td>
                   <td> <button onClick={() => handleEditCommentClick(q)} className={styles.editCommentButton} title="コメント編集"><Edit2 size={16}/></button> </td>
                 </tr>
                );
              })}
             </tbody>
           </table>
         ) : ( <div className={styles.noDataMessage} style={{backgroundColor: emptyBgColor || '#f9fafb' }}> {emptyMessage} </div> )}
       </div> ); };

  // --- Component Render ---
  return (
    <div className={styles.container}>
      <h2 className={styles.title}> <Info className={styles.titleIcon} /> 曖昧問題傾向分析 </h2>

      <div className={styles.filterToggleContainer}> <button onClick={() => setShowFilters(!showFilters)} className={styles.filterToggleButton}> <Filter size={16} /> フィルター・並べ替え {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />} </button> </div>

      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div>
              <label htmlFor="reasonFilter" className={styles.filterLabel}>理由</label>
              <select id="reasonFilter" value={filter.reason} onChange={(e) => setFilter({ ...filter, reason: e.target.value })} className={styles.filterSelect} >
                <option value="all">全ての理由</option>
                {filterOptions.reasons.map(reason => (<option key={reason} value={reason}>{reason}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="subjectFilter" className={styles.filterLabel}>科目</label>
              <select id="subjectFilter" value={filter.subject} onChange={(e) => setFilter({ ...filter, subject: e.target.value })} className={styles.filterSelect} >
                <option value="all">全ての科目</option>
                {filterOptions.subjects.map(subject => (<option key={subject} value={subject}>{subject}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="periodFilter" className={styles.filterLabel}>最終解答期間</label>
              <select id="periodFilter" value={filter.period} onChange={(e) => setFilter({ ...filter, period: e.target.value })} className={styles.filterSelect} >
                <option value="all">全期間</option>
                <option value="week">直近1週間</option>
                <option value="month">直近1ヶ月</option>
                <option value="quarter">直近3ヶ月</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}> <BarChart2 size={18} /> 科目別の曖昧問題数 </h3>
        {ambiguousCountBySubject.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ambiguousCountBySubject} margin={{ top: 5, right: 20, left: -10, bottom: 50 }} barGap={5} >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="subjectName" tick={{ fontSize: 11, fill: '#4b5563' }} angle={-45} textAnchor="end" height={60} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(238, 242, 255, 0.6)' }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" name="曖昧問題数" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noDataMessage}>グラフを表示するデータがありません。</div>
        )}
      </div>
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}> <TrendingUp size={18} /> 曖昧問題数の推移 (日次) </h3>
        {ambiguousTrendsData.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ambiguousTrendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4b5563' }} />
              <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} allowDecimals={false} domain={['auto', 'auto']} />
              <Tooltip cursor={{ stroke: '#a5b4fc', strokeWidth: 1 }} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.375rem', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="count" name="曖昧問題数" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noDataMessage}>
            {answerHistory.length === 0 ? '解答履歴データがありません。' : 'グラフを表示するための十分な解答履歴データがありません。(2日分以上の記録が必要です)'}
          </div>
        )}
      </div>

      {/* テーブル表示エリア - テーブルタイプ引数を追加 */}
      {renderTable('longStagnant', '長期停滞している曖昧問題', AlertCircle, '#b45309', '(最終解答日から30日以上経過)', sortedLongStagnantQuestions, '長期停滞している曖昧問題はありません。', '#fffbeb')}
      {renderTable('recentReverted', '直近の"揺り戻し"が発生した問題', TrendingDown, '#f97316', '(直前の解答が「理解○」だった問題)', sortedRecentRevertedQuestions, '直近で「理解○」→「曖昧△」となった問題はありません。', '#fff7ed')}
      {renderTable('completeReverted', '完全な"揺り戻しサイクル"を経験した問題', RotateCcw, '#5b21b6', '(曖昧△ → 理解○ → 曖昧△ の流れを経験)', sortedCompleteRevertedQuestions, '完全な"揺り戻しサイクル"を経験した問題はありません。', '#f5f3ff')}
      {renderTable('all', '全ての曖昧問題リスト', null, '#374151', '(現在のフィルターとソート適用)', filteredAndSortedQuestions, ambiguousQuestions.length > 0 ? '表示できる曖昧問題がありません。フィルター条件を変更してみてください。' : '曖昧と評価された問題はまだありません。', null)}

      {editingCommentQuestion && ( <CommentEditModal question={editingCommentQuestion} onSave={saveComment} onCancel={handleCloseCommentModal} /> )}
    </div>
  );
};

export default AmbiguousTrendsPage;
