// src/EnhancedStatsPage.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart2, PieChartIcon, TrendingUp, Calendar, BookOpen, CheckCircle, AlertTriangle, XCircle, ArrowUpDown, ChevronDown, ChevronRight, Filter, Calendar as CalendarIcon, X, RefreshCw, BookOpenCheck, Zap, Brain, Info } from 'lucide-react';
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

  // 知識保持曲線のオプション
  const [retentionOptions, setRetentionOptions] = useState({
    modelType: 'ebbinghaus', // 'ebbinghaus', 'personalized'
    timeScale: 'days', // 'hours', 'days', 'weeks'
    questionType: 'all' // 'all', 'difficult', 'medium', 'easy'
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

  // 知識保持曲線の計算
  const retentionCurveData = useMemo(() => {
    console.log("知識保持曲線データの計算中...");
    
    // 時間単位の設定
    const timeUnitInHours = 
      retentionOptions.timeScale === 'hours' ? 1 :
      retentionOptions.timeScale === 'days' ? 24 : 
      retentionOptions.timeScale === 'weeks' ? 168 : 24;
    
    const timeUnitLabel = 
      retentionOptions.timeScale === 'hours' ? '時間' :
      retentionOptions.timeScale === 'days' ? '日' : 
      retentionOptions.timeScale === 'weeks' ? '週間' : '日';
    
    // エビングハウスの忘却曲線のパラメータ
    const S = 100; // 最初の記憶強度 (100%)
    const R = 0.9; // 安定度係数 (一般的なモデルでは0.9程度)
    
    // 難易度別の安定度係数
    const difficultyFactors = {
      'easy': 0.95,      // 簡単な問題は忘れにくい
      'medium': 0.9,     // 普通の問題
      'difficult': 0.85  // 難しい問題は忘れやすい
    };
    
    // 個人化モデルのパラメータ計算
    let personalizedR = R; // デフォルト値
    
    if (retentionOptions.modelType === 'personalized' && Array.isArray(answerHistory) && answerHistory.length > 0) {
      // 同じ問題に対する時間経過と正答率のパターンを分析
      const questionPerformance = {};
      
      answerHistory.forEach(record => {
        if (!record.questionId || !record.timestamp) return;
        
        if (!questionPerformance[record.questionId]) {
          questionPerformance[record.questionId] = [];
        }
        
        questionPerformance[record.questionId].push({
          timestamp: new Date(record.timestamp),
          isCorrect: record.isCorrect
        });
      });
      
      // 各問題の学習後の経過時間と正答率の関係を計算
      let totalDifficultyFactor = 0;
      let validQuestionCount = 0;
      
      Object.keys(questionPerformance).forEach(qId => {
        const records = questionPerformance[qId];
        if (records.length < 2) return; // 最低2回以上解答されている問題のみ分析
        
        // 時間順にソート
        records.sort((a, b) => a.timestamp - b.timestamp);
        
        // 前回の学習からの経過時間と正答率の関係を計算
        let correctAfterDelay = 0;
        let totalAfterDelay = 0;
        
        for (let i = 1; i < records.length; i++) {
          const prevTime = records[i-1].timestamp;
          const currTime = records[i].timestamp;
          const hoursDiff = (currTime - prevTime) / (1000 * 60 * 60);
          
          // 前回の学習から一定時間（1時間以上）経過している場合のみカウント
          if (hoursDiff >= 1) {
            totalAfterDelay++;
            if (records[i].isCorrect) {
              correctAfterDelay++;
            }
          }
        }
        
        if (totalAfterDelay > 0) {
          // 時間経過後の正答率から安定度係数を推定
          const correctRate = correctAfterDelay / totalAfterDelay;
          
          // 安定度係数の調整（難しい問題ほど係数が小さくなる）
          let difficultyFactor;
          if (correctRate >= 0.8) {
            difficultyFactor = difficultyFactors.easy;
          } else if (correctRate >= 0.5) {
            difficultyFactor = difficultyFactors.medium;
          } else {
            difficultyFactor = difficultyFactors.difficult;
          }
          
          totalDifficultyFactor += difficultyFactor;
          validQuestionCount++;
        }
      });
      
      // 平均の安定度係数を計算
      if (validQuestionCount > 0) {
        personalizedR = totalDifficultyFactor / validQuestionCount;
      }
      
      console.log(`パーソナライズされた安定度係数: ${personalizedR.toFixed(4)}`);
    }
    
    // 難易度別のフィルタリング
    let selectedR = personalizedR;
    
    if (retentionOptions.questionType !== 'all') {
      selectedR = difficultyFactors[retentionOptions.questionType];
    }
    
    // エビングハウスの忘却曲線の数式: R(t) = S * e^(-t/S)
    // ここで、R(t)は時間tにおける記憶保持率、Sは安定度
    const calculateRetention = (t, stability) => {
      return S * Math.pow(Math.E, -t / (S * stability));
    };
    
    // グラフ用のデータポイントを生成（最大30ポイント）
    const dataPoints = [];
    const maxTimeUnits = 30;
    
    // 初期値 (学習直後 = 100%)
    dataPoints.push({
      time: 0,
      label: `0${timeUnitLabel}`,
      retention: 100
    });
    
    // 各時間ポイントでの記憶保持率を計算
    for (let i = 1; i <= maxTimeUnits; i++) {
      const timeValue = i;
      const retention = calculateRetention(timeValue, selectedR);
      
      dataPoints.push({
        time: timeValue,
        label: `${timeValue}${timeUnitLabel}`,
        retention: Math.max(0, Math.min(100, Math.round(retention)))
      });
    }
    
    // 復習ポイントを計算（記憶保持率が70%を下回るタイミング）
    const reviewPoints = [];
    let lastPoint = dataPoints[0];
    
    for (let i = 1; i < dataPoints.length; i++) {
      const currentPoint = dataPoints[i];
      
      if (lastPoint.retention >= 70 && currentPoint.retention < 70) {
        reviewPoints.push({
          time: currentPoint.time,
          retention: currentPoint.retention,
          label: `${currentPoint.time}${timeUnitLabel}後に復習`
        });
      }
      
      lastPoint = currentPoint;
    }
    
    return {
      curve: dataPoints,
      reviewPoints: reviewPoints,
      modelType: retentionOptions.modelType,
      stabilityFactor: selectedR.toFixed(4)
    };
  }, [retentionOptions, answerHistory]);

  // 知識保持曲線モデルの変更ハンドラ
  const handleRetentionModelChange = (e) => {
    setRetentionOptions(prev => ({
      ...prev,
      modelType: e.target.value
    }));
  };
  
  // 知識保持曲線の時間スケール変更ハンドラ
  const handleTimeScaleChange = (e) => {
    setRetentionOptions(prev => ({
      ...prev,
      timeScale: e.target.value
    }));
  };
  
  // 問題難易度フィルターの変更ハンドラ
  const handleQuestionTypeChange = (e) => {
    setRetentionOptions(prev => ({
      ...prev,
      questionType: e.target.value
    }));
  };

  // 知識保持曲線タブの内容
  const renderRetentionCurveTab = () => {
    return (
      <div className={styles.retentionCurveContainer}>
        <div className={styles.retentionControls}>
          <div className={styles.controlGroup}>
            <label htmlFor="modelType">モデルタイプ:</label>
            <select
              id="modelType"
              value={retentionOptions.modelType}
              onChange={handleRetentionModelChange}
              className={styles.controlSelect}
            >
              <option value="ebbinghaus">エビングハウス (標準)</option>
              <option value="personalized">パーソナライズ (学習履歴ベース)</option>
            </select>
          </div>
          
          <div className={styles.controlGroup}>
            <label htmlFor="timeScale">時間スケール:</label>
            <select
              id="timeScale"
              value={retentionOptions.timeScale}
              onChange={handleTimeScaleChange}
              className={styles.controlSelect}
            >
              <option value="hours">時間単位</option>
              <option value="days">日単位</option>
              <option value="weeks">週単位</option>
            </select>
          </div>
          
          <div className={styles.controlGroup}>
            <label htmlFor="questionType">問題タイプ:</label>
            <select
              id="questionType"
              value={retentionOptions.questionType}
              onChange={handleQuestionTypeChange}
              className={styles.controlSelect}
            >
              <option value="all">すべての問題</option>
              <option value="easy">簡単な問題</option>
              <option value="medium">標準的な問題</option>
              <option value="difficult">難しい問題</option>
            </select>
          </div>
        </div>
        
        <div className={styles.retentionChartContainer}>
          <h3 className={styles.chartTitle}>
            <Brain size={18} className={styles.chartIcon} />
            知識保持曲線
            <span className={styles.modelInfo}>
              (安定度係数: {retentionCurveData.stabilityFactor})
            </span>
          </h3>
          
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={retentionCurveData.curve}
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  label={{ 
                    value: `学習後の経過${retentionOptions.timeScale === 'hours' ? '時間' : retentionOptions.timeScale === 'days' ? '日数' : '週数'}`, 
                    position: 'insideBottom',
                    offset: -10
                  }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  label={{ 
                    value: '記憶保持率 (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' } 
                  }} 
                />
                <Tooltip formatter={(value) => [`${value}%`, '記憶保持率']} />
                <Area 
                  type="monotone" 
                  dataKey="retention" 
                  stroke="#4f46e5" 
                  fill="#e0e7ff" 
                  name="記憶保持率"
                />
                {/* 復習推奨ライン (70%) */}
                <Line
                  type="monotone"
                  dataKey="retention"
                  data={[
                    { time: 0, retention: 70, label: "" },
                    { time: 30, retention: 70, label: "" }
                  ]}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  name="復習推奨ライン"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* 復習タイミングの推奨 */}
          <div className={styles.reviewRecommendations}>
            <h4 className={styles.recommendationTitle}>
              <RefreshCw size={16} className={styles.recommendationIcon} />
              復習タイミングの推奨
            </h4>
            
            {retentionCurveData.reviewPoints.length > 0 ? (
              <div className={styles.recommendationBox}>
                <p>
                  記憶保持率が70%を下回る前に復習することをお勧めします。
                </p>
                <ul className={styles.recommendationList}>
                  {retentionCurveData.reviewPoints.map((point, index) => (
                    <li key={index} className={styles.recommendationItem}>
                      <span className={styles.recommendationHighlight}>
                        学習から{point.label}
                      </span>
                      のタイミングで復習すると効果的です
                      <span className={styles.recommendationDetail}>
                        (記憶保持率: 約{point.retention}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.noRecommendation}>
                選択した期間内では、記憶保持率が70%を下回るタイミングが見つかりませんでした。
              </p>
            )}
          </div>
          
          <div className={styles.curveExplanation}>
            <h4 className={styles.explanationTitle}>
              <Info size={16} className={styles.explanationIcon} />
              知識保持曲線について
            </h4>
            <p>
              知識保持曲線は、学習後の時間経過に伴う記憶の定着度を示すモデルです。
              エビングハウスの忘却曲線をベースに、{retentionOptions.modelType === 'personalized' ? 'あなたの学習履歴から計算されたパーソナライズされた' : '一般的な'}忘却パターンを予測しています。
              効率的な学習のために、記憶保持率が70%を下回る前の復習がおすすめです。
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>
          <BarChart2 size={24} className={styles.titleIcon} />
          学習統計・分析
        </h2>
        <p className={styles.pageDescription}>
          学習状況や習熟度をデータ分析し、効率的な学習戦略のための情報を提供します。
        </p>
      </div>

      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 size={18} />
          学習概要
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'progress' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <TrendingUp size={18} />
          進捗推移
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'weakPoints' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('weakPoints')}
        >
          <AlertTriangle size={18} />
          苦手分析
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'retention' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <Brain size={18} />
          知識保持曲線
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'weakPoints' && renderWeakPointsTab()}
        {activeTab === 'retention' && renderRetentionCurveTab()}
      </div>
    </div>
  );
};

export default EnhancedStatsPage;
