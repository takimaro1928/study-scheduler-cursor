// src/EnhancedStatsPage.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Calendar, BookOpen, CheckCircle, AlertTriangle, XCircle, ArrowUpDown, ChevronDown, ChevronRight, Filter, Calendar as CalendarIcon, X, RefreshCw, BookOpenCheck, Zap } from 'lucide-react';
import styles from './StatsPage.module.css';

const EnhancedStatsPage = ({ subjects = [], answerHistory = [], formatDate }) => {
  // タブ切り替え用のステート
  const [activeTab, setActiveTab] = useState('overview');
  
  // 期間フィルター用のステート
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // 科目フィルター用のステート
  const [subjectFilter, setSubjectFilter] = useState('all');
  
  // 章フィルター用のステート
  const [chapterFilter, setChapterFilter] = useState([]);
  
  // 展開されている科目ID
  const [expandedSubjectIds, setExpandedSubjectIds] = useState([]);
  
  // グラフ表示オプション
  const [chartOptions, setChartOptions] = useState({
    showMovingAverage: false,
    timeseriesView: 'daily' // 'daily', 'weekly', 'monthly'
  });
  
  // カスタム期間フィルター
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
    enabled: false
  });
  
  // 苦手問題テーブルのソート状態
  const [weakPointsSort, setWeakPointsSort] = useState({
    key: 'correctRate',
    order: 'asc' // 正解率の低い順
  });
  
  // フィルタリングされた解答履歴
  const filteredHistory = useMemo(() => {
    if (!Array.isArray(answerHistory)) return [];
    
    // 期間フィルタリング
    let filtered = [...answerHistory];
    
    // カスタム期間フィルターの適用
    if (customDateRange.enabled && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = new Date(record.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
      });
    } 
    // 標準期間フィルターの適用（カスタム期間が無効の場合）
    else if (periodFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(periodFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '3months':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = new Date(record.timestamp);
        return recordDate >= cutoffDate;
      });
    }
    
    // 科目/章フィルタリング（問題IDから該当科目を探す）
    if (subjectFilter !== 'all' || chapterFilter.length > 0) {
      // 当該科目に属する問題IDのリストを作成
      const questionIdsInFilter = [];
      
      subjects.forEach(subject => {
        // 科目フィルターに合致するか確認
        const subjectMatch = subjectFilter === 'all' || 
                            subject.id?.toString() === subjectFilter || 
                            subject.subjectId?.toString() === subjectFilter;
        
        if (subjectMatch) {
          subject.chapters?.forEach(chapter => {
            // 章フィルターに合致するか確認
            const chapterMatch = chapterFilter.length === 0 || 
                               chapterFilter.includes(chapter.id?.toString());
            
            if (chapterMatch) {
              chapter.questions?.forEach(question => {
                if (question.id) {
                  questionIdsInFilter.push(question.id);
                }
              });
            }
          });
        }
      });
      
      // フィルタリング
      if (questionIdsInFilter.length > 0) {
        filtered = filtered.filter(record => 
          questionIdsInFilter.includes(record.questionId)
        );
      }
    }
    
    return filtered;
  }, [answerHistory, periodFilter, subjectFilter, chapterFilter, customDateRange, subjects]);
  
  // 科目一覧（フィルター用）
  const subjectOptions = useMemo(() => {
    return subjects.map(subject => ({
      id: subject.id || subject.subjectId,
      name: subject.name || subject.subjectName || '未分類'
    }));
  }, [subjects]);
  
  // 章一覧（フィルター用）- 選択された科目に基づいて章リストを生成
  const chapterOptions = useMemo(() => {
    if (subjectFilter === 'all') return [];
    
    const selectedSubject = subjects.find(subject => 
      (subject.id?.toString() === subjectFilter || subject.subjectId?.toString() === subjectFilter)
    );
    
    if (!selectedSubject || !selectedSubject.chapters) return [];
    
    return selectedSubject.chapters.map(chapter => ({
      id: chapter.id || chapter.chapterId,
      name: chapter.name || chapter.chapterName || '未分類'
    }));
  }, [subjects, subjectFilter]);
  
  // 時系列データの生成関数（月次表示機能を追加）
  const generateTimeseriesData = (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      return { daily: [], weekly: [], monthly: [], movingAverage: [] };
    }
    
    // 日付でソート
    const sortedHistory = [...history].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // 最初と最後の日付を取得
    const firstDate = new Date(sortedHistory[0].timestamp);
    const lastDate = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
    
    // データが1日分しかない場合の特別処理
    if (firstDate.toDateString() === lastDate.toDateString()) {
      const dayData = processDailyData(sortedHistory, firstDate);
      return {
        daily: [dayData],
        weekly: [{
          period: `${formatDate(firstDate)}`,
          count: dayData.count,
          correctRate: dayData.correctRate
        }],
        monthly: [{
          period: `${firstDate.getFullYear()}/${(firstDate.getMonth() + 1).toString().padStart(2, '0')}`,
          count: dayData.count,
          correctRate: dayData.correctRate
        }],
        movingAverage: [] // 移動平均の計算には十分なデータがない
      };
    }
    
    // 日次データ
    const dailyData = [];
    const currentDate = new Date(firstDate);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= lastDate) {
      const dayRecords = sortedHistory.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayRecords.length > 0) {
        dailyData.push(processDailyData(dayRecords, new Date(currentDate)));
      } else {
        // データがない日は0で埋める
        dailyData.push({
          date: formatDate(new Date(currentDate)),
          count: 0,
          correctRate: 0
        });
      }
      
      // 次の日に進める
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 週次データ
    const weeklyData = [];
    let weekStart = new Date(firstDate);
    weekStart.setHours(0, 0, 0, 0);
    // 日曜日にする
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    while (weekStart <= lastDate) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekRecords = sortedHistory.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      if (weekRecords.length > 0) {
        const totalCount = weekRecords.length;
        const correctCount = weekRecords.filter(record => record.isCorrect).length;
        const correctRate = Math.round((correctCount / totalCount) * 100);
        
        weeklyData.push({
          period: `${formatDate(weekStart)}〜${formatDate(weekEnd)}`,
          count: totalCount,
          correctRate: correctRate
        });
      } else {
        // データがない週は0で埋める
        weeklyData.push({
          period: `${formatDate(weekStart)}〜${formatDate(weekEnd)}`,
          count: 0,
          correctRate: 0
        });
      }
      
      // 次の週に進める
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    // 月次データ（新機能）
    const monthlyData = [];
    let monthStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    
    while (monthStart <= lastDate) {
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // 月の最終日
      
      const monthRecords = sortedHistory.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      const monthLabel = `${monthStart.getFullYear()}/${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (monthRecords.length > 0) {
        const totalCount = monthRecords.length;
        const correctCount = monthRecords.filter(record => record.isCorrect).length;
        const correctRate = Math.round((correctCount / totalCount) * 100);
        
        monthlyData.push({
          period: monthLabel,
          count: totalCount,
          correctRate: correctRate
        });
      } else {
        // データがない月は0で埋める
        monthlyData.push({
          period: monthLabel,
          count: 0,
          correctRate: 0
        });
      }
      
      // 次の月に進める
      monthStart.setMonth(monthStart.getMonth() + 1);
    }
    
    // 移動平均の計算 (7日間移動平均)
    const movingAverageData = [];
    const windowSize = 7;
    
    for (let i = 0; i < dailyData.length; i++) {
      let window = dailyData.slice(Math.max(0, i - windowSize + 1), i + 1);
      let totalCount = 0;
      let totalCorrect = 0;
      
      window.forEach(day => {
        totalCount += day.count;
      });
      
      // 正解率の移動平均を計算
      let validRateDays = window.filter(day => day.count > 0);
      let avgRate = 0;
      
      if (validRateDays.length > 0) {
        avgRate = validRateDays.reduce((sum, day) => sum + day.correctRate * day.count, 0) / 
                 validRateDays.reduce((sum, day) => sum + day.count, 0);
        avgRate = Math.round(avgRate);
      }
      
      movingAverageData.push({
        date: dailyData[i].date,
        maCount: totalCount / window.length,
        maCorrectRate: avgRate
      });
    }
    
    return { daily: dailyData, weekly: weeklyData, monthly: monthlyData, movingAverage: movingAverageData };
  };
  
  // 日ごとのデータ処理
  const processDailyData = (records, date) => {
    const totalCount = records.length;
    const correctCount = records.filter(record => record.isCorrect).length;
    const correctRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    
    return {
      date: formatDate(date),
      count: totalCount,
      correctRate: correctRate
    };
  };
  
  // 統計情報の計算
  const stats = useMemo(() => {
    if (!Array.isArray(subjects)) return {};
    
    // 1. 総問題数と解答済み問題数
    let totalQuestions = 0;
    let answeredQuestions = 0;
    let understandingCounts = { '理解○': 0, '曖昧△': 0, '理解できていない×': 0, '未解答': 0 };
    let correctRateDistribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0, '未解答': 0 };
    let intervalDistribution = { '未設定': 0, '1日': 0, '3日': 0, '7日': 0, '14日': 0, '1ヶ月': 0, '2ヶ月': 0 };
    let subjectStats = [];
    
    // 科目ごとの統計
    subjects.forEach(subject => {
      const subjectName = subject.name || subject.subjectName || '未分類';
      const subjectId = subject.id || subject.subjectId;
      
      let subjectTotal = 0;
      let subjectAnswered = 0;
      let subjectCorrectCount = 0;
      let subjectUnderstanding = { '理解○': 0, '曖昧△': 0, '理解できていない×': 0, '未解答': 0 };
      let subjectIntervals = { '未設定': 0, '1日': 0, '3日': 0, '7日': 0, '14日': 0, '1ヶ月': 0, '2ヶ月': 0 };
      let chapterStats = [];
      
      subject.chapters?.forEach(chapter => {
        const chapterName = chapter.name || chapter.chapterName || '未分類';
        const chapterId = chapter.id || chapter.chapterId;
        
        let chapterTotal = 0;
        let chapterAnswered = 0;
        let chapterCorrectCount = 0;
        let chapterCorrectRate = 0;
        
        chapter.questions?.forEach(question => {
          // 科目の合計数に加算
          subjectTotal++;
          // 章の合計数に加算
          chapterTotal++;
          // 全体の合計数に加算
          totalQuestions++;
          
          // 間隔の分布をカウント
          const interval = question.interval || '未設定';
          intervalDistribution[interval] = (intervalDistribution[interval] || 0) + 1;
          subjectIntervals[interval] = (subjectIntervals[interval] || 0) + 1;
          
          // 解答済みかどうかを確認
          if (question.answerCount && question.answerCount > 0) {
            answeredQuestions++;
            subjectAnswered++;
            chapterAnswered++;
            
            // 理解度のカテゴリ分け
            const understanding = question.understanding || '未解答';
            const baseUnderstanding = understanding.split(':')[0]; // "曖昧△:理由" の形式の場合は "曖昧△" を取得
            
            if (baseUnderstanding === '理解○') {
              understandingCounts['理解○']++;
              subjectUnderstanding['理解○']++;
            } else if (baseUnderstanding.startsWith('曖昧△')) {
              understandingCounts['曖昧△']++;
              subjectUnderstanding['曖昧△']++;
            } else if (baseUnderstanding === '理解できていない×') {
              understandingCounts['理解できていない×']++;
              subjectUnderstanding['理解できていない×']++;
            } else {
              understandingCounts['未解答']++;
              subjectUnderstanding['未解答']++;
            }
            
            // 正解率の分布
            const rate = question.correctRate || 0;
            if (rate >= 0 && rate <= 20) correctRateDistribution['0-20']++;
            else if (rate > 20 && rate <= 40) correctRateDistribution['21-40']++;
            else if (rate > 40 && rate <= 60) correctRateDistribution['41-60']++;
            else if (rate > 60 && rate <= 80) correctRateDistribution['61-80']++;
            else if (rate > 80 && rate <= 100) correctRateDistribution['81-100']++;
            
            // 問題の正解回数を計算（正解率と解答回数から逆算）
            if (question.correctRate && question.answerCount) {
              const correctCount = Math.round((question.correctRate / 100) * question.answerCount);
              subjectCorrectCount += correctCount;
              chapterCorrectCount += correctCount;
            }
          } else {
            understandingCounts['未解答']++;
            subjectUnderstanding['未解答']++;
            correctRateDistribution['未解答']++;
          }
        });
        
        // 章の正解率を計算
        chapterCorrectRate = chapterAnswered > 0 ? Math.round((chapterCorrectCount / chapterAnswered) * 100) : 0;
        
        // 章の統計情報を保存
        chapterStats.push({
          id: chapterId,
          name: chapterName,
          total: chapterTotal,
          answered: chapterAnswered,
          completionRate: chapterTotal > 0 ? Math.round((chapterAnswered / chapterTotal) * 100) : 0,
          correctRate: chapterCorrectRate
        });
      });
      
      // 科目ごとの統計を保存
      const subjectCorrectRate = subjectAnswered > 0 ? Math.round((subjectCorrectCount / subjectAnswered) * 100) : 0;
      
      subjectStats.push({
        id: subjectId,
        name: subjectName,
        total: subjectTotal,
        answered: subjectAnswered,
        completionRate: subjectTotal > 0 ? Math.round((subjectAnswered / subjectTotal) * 100) : 0,
        correctRate: subjectCorrectRate,
        understanding: subjectUnderstanding,
        intervals: subjectIntervals,
        chapters: chapterStats
      });
    });
    
    // 理解度の円グラフデータ
    const understandingPieData = [
      { name: '理解○', value: understandingCounts['理解○'], color: '#10b981' },
      { name: '曖昧△', value: understandingCounts['曖昧△'], color: '#f59e0b' },
      { name: '理解できていない×', value: understandingCounts['理解できていない×'], color: '#ef4444' },
      { name: '未解答', value: understandingCounts['未解答'], color: '#9ca3af' }
    ];
    
    // 正解率分布の棒グラフデータ
    const correctRateBarData = [
      { name: '0-20%', value: correctRateDistribution['0-20'], color: '#ef4444' },
      { name: '21-40%', value: correctRateDistribution['21-40'], color: '#f97316' },
      { name: '41-60%', value: correctRateDistribution['41-60'], color: '#eab308' },
      { name: '61-80%', value: correctRateDistribution['61-80'], color: '#84cc16' },
      { name: '81-100%', value: correctRateDistribution['81-100'], color: '#10b981' }
    ];
    
    // 復習間隔の分布データ（新機能）
    const intervalBarData = [
      { name: '未設定', value: intervalDistribution['未設定'] || 0, color: '#9ca3af' },
      { name: '1日', value: intervalDistribution['1日'] || 0, color: '#ef4444' },
      { name: '3日', value: intervalDistribution['3日'] || 0, color: '#f97316' },
      { name: '7日', value: intervalDistribution['7日'] || 0, color: '#eab308' },
      { name: '14日', value: intervalDistribution['14日'] || 0, color: '#84cc16' },
      { name: '1ヶ月', value: intervalDistribution['1ヶ月'] || 0, color: '#10b981' },
      { name: '2ヶ月', value: intervalDistribution['2ヶ月'] || 0, color: '#3b82f6' }
    ];
    
    // 苦手な問題のリスト（新機能）
    const weakPointsList = [];
    subjects.forEach(subject => {
      const subjectName = subject.name || subject.subjectName || '未分類';
      
      subject.chapters?.forEach(chapter => {
        const chapterName = chapter.name || chapter.chapterName || '未分類';
        
        chapter.questions?.forEach(question => {
          // 苦手問題の条件: 正解率が50%未満、かつ解答回数が3回以上
          if (question.correctRate < 50 && question.answerCount >= 3) {
            weakPointsList.push({
              id: question.id,
              subjectName,
              chapterName,
              correctRate: question.correctRate || 0,
              answerCount: question.answerCount || 0,
              lastAnswered: question.lastAnswered,
              understanding: question.understanding || '未設定'
            });
          }
        });
      });
    });
    
    // 時系列データの生成（解答履歴から）
    const timeseriesData = generateTimeseriesData(filteredHistory);
    
    return {
      totalQuestions,
      answeredQuestions,
      completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      understandingPieData,
      correctRateBarData,
      intervalBarData,
      subjectStats,
      timeseriesData,
      weakPointsList
    };
  }, [subjects, filteredHistory, formatDate]);
  
  // 科目の展開/折りたたみを切り替える
  const toggleSubjectExpansion = (subjectId) => {
    setExpandedSubjectIds(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };
  
  // 苦手問題リストのソート
  const handleWeakPointsSort = (key) => {
    setWeakPointsSort(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // 苦手問題のソート済みリスト
  const sortedWeakPointsList = useMemo(() => {
    if (!stats.weakPointsList) return [];
    
    return [...stats.weakPointsList].sort((a, b) => {
      const { key, order } = weakPointsSort;
      
      if (key === 'lastAnswered') {
        const dateA = a.lastAnswered ? new Date(a.lastAnswered) : new Date(0);
        const dateB = b.lastAnswered ? new Date(b.lastAnswered) : new Date(0);
        return order === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      }
      
      const valA = a[key];
      const valB = b[key];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return order === 'asc' ? valA - valB : valB - valA;
      }
      
      // 文字列の場合
      const strA = String(valA || '');
      const strB = String(valB || '');
      return order === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  }, [stats.weakPointsList, weakPointsSort]);
  
  // グラフ表示オプション切り替え
  const toggleMovingAverage = () => {
    setChartOptions(prev => ({
      ...prev,
      showMovingAverage: !prev.showMovingAverage
    }));
  };
  
  const changeTimeseriesView = (view) => {
    setChartOptions(prev => ({
      ...prev,
      timeseriesView: view
    }));
  };
  
  // カスタム期間の切り替え
  const toggleCustomDateRange = () => {
    setCustomDateRange(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
    
    if (customDateRange.enabled) {
      // カスタム期間を無効にした場合、標準フィルターに戻す
      setPeriodFilter('all');
    }
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <BarChart2 className={styles.titleIcon} size={20} />
        学習統計
      </h2>
      
      {/* 拡張されたフィルターセクション */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>期間:</label>
          <select 
            className={styles.filterSelect}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            disabled={customDateRange.enabled}
          >
            <option value="all">全期間</option>
            <option value="week">直近1週間</option>
            <option value="month">直近1ヶ月</option>
            <option value="3months">直近3ヶ月</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>科目:</label>
          <select 
            className={styles.filterSelect}
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setChapterFilter([]);
            }}
          >
            <option value="all">全科目</option>
            {subjectOptions.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>
        
        {/* 章フィルター（科目が選択されている場合のみ表示） */}
        {subjectFilter !== 'all' && chapterOptions.length > 0 && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>章:</label>
            <select 
              className={styles.filterSelect}
              multiple
              value={chapterFilter}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setChapterFilter(selectedOptions);
              }}
              size={Math.min(3, chapterOptions.length)}
            >
              {chapterOptions.map(chapter => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>
            <div className={styles.selectHelp}>複数選択: Ctrlキーを押しながらクリック</div>
          </div>
        )}
        
        {/* カスタム期間フィルター */}
        <div className={styles.filterGroup} style={{ alignItems: 'flex-start' }}>
          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="customDateRange"
              checked={customDateRange.enabled}
              onChange={toggleCustomDateRange}
              className={styles.checkbox}
            />
            <label htmlFor="customDateRange" className={styles.checkboxLabel}>カスタム期間:</label>
          </div>
          
          {customDateRange.enabled && (
            <div className={styles.dateRangeInputs}>
              <input 
                type="date" 
                value={customDateRange.start ? customDateRange.start.split('T')[0] : ''}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className={styles.dateInput}
              />
              <span className={styles.dateSeparator}>～</span>
              <input 
                type="date" 
                value={customDateRange.end ? customDateRange.end.split('T')[0] : ''}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className={styles.dateInput}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* タブ切り替え */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BookOpen size={16} />
          概要
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'subjects' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <PieChartIcon size={16} />
          科目別
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'timeseries' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('timeseries')}
        >
          <TrendingUp size={16} />
          学習履歴
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'weakpoints' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('weakpoints')}
        >
          <Zap size={16} />
          苦手問題
        </button>
      </div>
      
      {/* 概要タブ */}
      {activeTab === 'overview' && (
        <div className={styles.overviewTab}>
          {/* 概要カード */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statTitle}>総問題数</div>
              <div className={styles.statValue}>{stats.totalQuestions || 0}</div>
              <div className={styles.statDescription}>登録されている問題の総数</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statTitle}>解答済み問題数</div>
              <div className={styles.statValue}>{stats.answeredQuestions || 0}</div>
              <div className={styles.statDescription}>1回以上解答した問題数</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statTitle}>進捗率</div>
              <div className={styles.statValue}>{stats.completionRate || 0}%</div>
              <div className={styles.statDescription}>全体の学習進捗</div>
            </div>
            
            <div className={styles.statCard}>
              <div className={styles.statTitle}>累計解答数</div>
              <div className={styles.statValue}>{filteredHistory.length || 0}</div>
              <div className={styles.statDescription}>解答した回数の合計</div>
            </div>
          </div>
          
          {/* 理解度の分布（円グラフ） */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <CheckCircle size={18} className={styles.chartIcon} />
              理解度の分布
            </h3>
            <div className={styles.chartContent}>
              {stats.understandingPieData && stats.understandingPieData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.understandingPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.understandingPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}問`, '問題数']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>データがありません</div>
              )}
            </div>
          </div>
          
          {/* 正解率の分布（棒グラフ） */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <BarChart2 size={18} className={styles.chartIcon} />
              正解率の分布
            </h3>
            <div className={styles.chartContent}>
              {stats.correctRateBarData && stats.correctRateBarData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.correctRateBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}問`, '問題数']} />
                    <Legend />
                    <Bar dataKey="value" name="問題数">
                      {stats.correctRateBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>データがありません</div>
              )}
            </div>
          </div>
          
          {/* 復習間隔の分布（新機能） */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <CalendarIcon size={18} className={styles.chartIcon} />
              復習間隔の分布
            </h3>
            <div className={styles.chartContent}>
              {stats.intervalBarData && stats.intervalBarData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.intervalBarData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}問`, '問題数']} />
                    <Legend />
                    <Bar dataKey="value" name="問題数">
                      {stats.intervalBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>データがありません</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 科目別タブ */}
      {activeTab === 'subjects' && (
        <div className={styles.subjectsTab}>
          <div className={styles.tableContainer}>
            <h3 className={styles.sectionTitle}>科目別進捗状況</h3>
            
            <div className={styles.tableWrapper}>
              <table className={styles.statsTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeader}>科目名</th>
                    <th className={styles.tableHeader}>問題数</th>
                    <th className={styles.tableHeader}>解答済</th>
                    <th className={styles.tableHeader}>進捗率</th>
                    <th className={styles.tableHeader}>正解率</th>
                    <th className={styles.tableHeader}>理解度分布</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subjectStats && stats.subjectStats.map((subject) => {
                    const isExpanded = expandedSubjectIds.includes(subject.id);
                    
                    return (
                      <React.Fragment key={subject.id}>
                        {/* 科目行 - クリック可能 */}
                        <tr 
                          className={`${styles.subjectRow} ${isExpanded ? styles.expandedRow : ''}`}
                          onClick={() => toggleSubjectExpansion(subject.id)}
                        >
                          <td className={styles.subjectCell}>
                            <div className={styles.subjectNameWithIcon}>
                              <span className={`${styles.expansionIcon} ${isExpanded ? styles.expanded : ''}`}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </span>
                              {subject.name}
                            </div>
                          </td>
                          <td>{subject.total}</td>
                          <td>{subject.answered}</td>
                          <td>{subject.completionRate}%</td>
                          <td>{subject.correctRate}%</td>
                          <td>
                            <div className={styles.miniBarContainer}>
                              <div 
                                className={styles.miniBarSegment} 
                                style={{ 
                                  width: `${subject.understanding['理解○'] / subject.total * 100}%`,
                                  backgroundColor: '#10b981'
                                }} 
                                title={`理解○: ${subject.understanding['理解○']}問`}
                              />
                              <div 
                                className={styles.miniBarSegment} 
                                style={{ 
                                  width: `${subject.understanding['曖昧△'] / subject.total * 100}%`,
                                  backgroundColor: '#f59e0b'
                                }} 
                                title={`曖昧△: ${subject.understanding['曖昧△']}問`}
                              />
                              <div 
                                className={styles.miniBarSegment} 
                                style={{ 
                                  width: `${subject.understanding['理解できていない×'] / subject.total * 100}%`,
                                  backgroundColor: '#ef4444'
                                }} 
                                title={`理解できていない×: ${subject.understanding['理解できていない×']}問`}
                              />
                              <div 
                                className={styles.miniBarSegment} 
                                style={{ 
                                  width: `${subject.understanding['未解答'] / subject.total * 100}%`,
                                  backgroundColor: '#9ca3af'
                                }} 
                                title={`未解答: ${subject.understanding['未解答']}問`}
                              />
                            </div>
                          </td>
                        </tr>
                        
                        {/* 科目が展開されている場合、章の詳細を表示 */}
                        {isExpanded && subject.chapters.map(chapter => (
                          <tr key={`chapter-${chapter.id}`} className={styles.chapterRow}>
                            <td className={styles.chapterCell}>{chapter.name}</td>
                            <td>{chapter.total}</td>
                            <td>{chapter.answered}</td>
                            <td>{chapter.completionRate}%</td>
                            <td>{chapter.correctRate}%</td>
                            <td></td> {/* 章レベルでは理解度分布を表示しない */}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 科目別正解率の棒グラフ */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <BarChart2 size={18} className={styles.chartIcon} />
              科目別正解率
            </h3>
            <div className={styles.chartContent}>
              {stats.subjectStats && stats.subjectStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={stats.subjectStats.map(subject => ({
                      name: subject.name,
                      correctRate: subject.correctRate
                    }))} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`, '正解率']} />
                    <Legend />
                    <Bar dataKey="correctRate" name="正解率" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>データがありません</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 学習履歴タブ（拡張版） */}
      {activeTab === 'timeseries' && (
        <div className={styles.timeseriesTab}>
          {/* 表示オプション */}
          <div className={styles.displayOptions}>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>表示単位:</label>
              <div className={styles.optionButtons}>
                <button 
                  className={`${styles.optionButton} ${chartOptions.timeseriesView === 'daily' ? styles.optionActive : ''}`}
                  onClick={() => changeTimeseriesView('daily')}
                >
                  日次
                </button>
                <button 
                  className={`${styles.optionButton} ${chartOptions.timeseriesView === 'weekly' ? styles.optionActive : ''}`}
                  onClick={() => changeTimeseriesView('weekly')}
                >
                  週次
                </button>
                <button 
                  className={`${styles.optionButton} ${chartOptions.timeseriesView === 'monthly' ? styles.optionActive : ''}`}
                  onClick={() => changeTimeseriesView('monthly')}
                >
                  月次
                </button>
              </div>
            </div>
            
            <div className={styles.optionGroup}>
              <label className={styles.checkboxContainer}>
                <input 
                  type="checkbox" 
                  checked={chartOptions.showMovingAverage} 
                  onChange={toggleMovingAverage}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>移動平均線（7日間）を表示</span>
              </label>
            </div>
          </div>
          
          {/* 解答数と正解率グラフ */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              {chartOptions.timeseriesView === 'daily' && <Calendar size={18} className={styles.chartIcon} />}
              {chartOptions.timeseriesView === 'weekly' && <Calendar size={18} className={styles.chartIcon} />}
              {chartOptions.timeseriesView === 'monthly' && <Calendar size={18} className={styles.chartIcon} />}
              {chartOptions.timeseriesView === 'daily' && '日別'}
              {chartOptions.timeseriesView === 'weekly' && '週別'}
              {chartOptions.timeseriesView === 'monthly' && '月別'}
              解答数と正解率
            </h3>
            <div className={styles.chartContent}>
              {stats.timeseriesData && (() => {
                let chartData = [];
                
                // 表示オプションに基づいてデータを選択
                if (chartOptions.timeseriesView === 'daily') {
                  chartData = stats.timeseriesData.daily;
                } else if (chartOptions.timeseriesView === 'weekly') {
                  chartData = stats.timeseriesData.weekly;
                } else if (chartOptions.timeseriesView === 'monthly') {
                  chartData = stats.timeseriesData.monthly;
                }
                
                const maData = stats.timeseriesData.movingAverage;
                
                if (chartData.length > 0) {
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        margin={{ top: 5, right: 30, left: 20, bottom: chartOptions.timeseriesView === 'weekly' ? 50 : 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={chartOptions.timeseriesView === 'daily' ? 'date' : 'period'} 
                          angle={chartOptions.timeseriesView === 'weekly' ? -30 : 0} 
                          textAnchor={chartOptions.timeseriesView === 'weekly' ? 'end' : 'middle'} 
                          height={chartOptions.timeseriesView === 'weekly' ? 60 : 30}
                          allowDataOverflow
                        />
                        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#10b981" />
                        <Tooltip />
                        <Legend />
                        
                        {/* メインの線 */}
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="count" 
                          name="解答数" 
                          data={chartData}
                          stroke="#4f46e5" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="correctRate" 
                          name="正解率(%)" 
                          data={chartData}
                          stroke="#10b981" 
                        />
                        
                        {/* 移動平均線（オプション） */}
                        {chartOptions.showMovingAverage && chartOptions.timeseriesView === 'daily' && (
                          <>
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="maCount" 
                              name="解答数(7日平均)" 
                              data={maData}
                              stroke="#818cf8" 
                              strokeDasharray="3 3"
                            />
                            <Line 
                              yAxisId="right" 
                              type="monotone" 
                              dataKey="maCorrectRate" 
                              name="正解率(7日平均)" 
                              data={maData}
                              stroke="#34d399" 
                              strokeDasharray="3 3"
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                } else {
                  return <div className={styles.noDataMessage}>解答履歴データがありません</div>;
                }
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* 苦手問題タブ（新機能） */}
      {activeTab === 'weakpoints' && (
        <div className={styles.weakpointsTab}>
          <div className={styles.tableContainer}>
            <h3 className={styles.sectionTitle}>
              <div className={styles.sectionTitleWithDescription}>
                <span>苦手問題リスト</span>
                <span className={styles.sectionDescription}>
                  (正解率50%未満かつ解答回数3回以上の問題)
                </span>
              </div>
            </h3>
            
            <div className={styles.tableWrapper}>
              {sortedWeakPointsList.length > 0 ? (
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('id')}
                      >
                        問題ID 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('subjectName')}
                      >
                        科目 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('chapterName')}
                      >
                        章 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('correctRate')}
                      >
                        正解率 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('answerCount')}
                      >
                        解答回数 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('lastAnswered')}
                      >
                        最終解答日 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                      <th 
                        className={styles.sortableHeader} 
                        onClick={() => handleWeakPointsSort('understanding')}
                      >
                        理解度 
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWeakPointsList.map(question => (
                      <tr key={question.id} className={styles.weakPointRow}>
                        <td>{question.id}</td>
                        <td>{question.subjectName}</td>
                        <td>{question.chapterName}</td>
                        <td className={styles.correctRateCell}>
                          <div className={styles.correctRateBar}>
                            <div 
                              className={styles.correctRateBarInner}
                              style={{ width: `${question.correctRate}%` }}
                            ></div>
                          </div>
                          <span>{question.correctRate}%</span>
                        </td>
                        <td>{question.answerCount}</td>
                        <td>{formatDate(question.lastAnswered)}</td>
                        <td className={question.understanding.startsWith('曖昧△') ? styles.ambiguousCell : ''}>
                          {question.understanding.includes(':') 
                            ? question.understanding.split(':')[0] 
                            : question.understanding}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.noDataMessage}>
                  苦手問題が見つかりませんでした。
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStatsPage;
