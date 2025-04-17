// src/StatsPage.js
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Calendar, BookOpen, CheckCircle, AlertTriangle, XCircle, ArrowUpDown } from 'lucide-react';
import styles from './StatsPage.module.css';

const StatsPage = ({ subjects = [], answerHistory = [], formatDate }) => {
  // タブ切り替え用のステート
  const [activeTab, setActiveTab] = useState('overview');
  
  // 期間フィルター用のステート
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // 科目フィルター用のステート
  const [subjectFilter, setSubjectFilter] = useState('all');
  
  // フィルタリングされた解答履歴
  const filteredHistory = useMemo(() => {
    if (!Array.isArray(answerHistory)) return [];
    
    // 期間フィルタリング
    let filtered = [...answerHistory];
    
    if (periodFilter !== 'all') {
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
    
    // 科目フィルタリング（問題IDから該当科目を探す）
    if (subjectFilter !== 'all') {
      // 当該科目に属する問題IDのリストを作成
      const questionIdsInSubject = [];
      subjects.forEach(subject => {
        if (subject.id?.toString() === subjectFilter || subject.subjectId?.toString() === subjectFilter) {
          subject.chapters?.forEach(chapter => {
            chapter.questions?.forEach(question => {
              if (question.id) {
                questionIdsInSubject.push(question.id);
              }
            });
          });
        }
      });
      
      // フィルタリング
      filtered = filtered.filter(record => 
        questionIdsInSubject.includes(record.questionId)
      );
    }
    
    return filtered;
  }, [answerHistory, periodFilter, subjectFilter, subjects]);
  
  // 科目一覧（フィルター用）
  const subjectOptions = useMemo(() => {
    return subjects.map(subject => ({
      id: subject.id || subject.subjectId,
      name: subject.name || subject.subjectName || '未分類'
    }));
  }, [subjects]);
  
  // 時系列データの生成関数
  const generateTimeseriesData = (history) => {
    if (!Array.isArray(history) || history.length === 0) {
      return { daily: [], weekly: [] };
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
        }]
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
    
    return { daily: dailyData, weekly: weeklyData };
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
    let subjectStats = [];
    
    // 科目ごとの統計
    subjects.forEach(subject => {
      const subjectName = subject.name || subject.subjectName || '未分類';
      let subjectTotal = 0;
      let subjectAnswered = 0;
      let subjectCorrectCount = 0;
      let subjectUnderstanding = { '理解○': 0, '曖昧△': 0, '理解できていない×': 0, '未解答': 0 };
      
      subject.chapters?.forEach(chapter => {
        chapter.questions?.forEach(question => {
          totalQuestions++;
          subjectTotal++;
          
          // 理解度のカウント
          if (question.answerCount && question.answerCount > 0) {
            answeredQuestions++;
            subjectAnswered++;
            
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
            }
          } else {
            understandingCounts['未解答']++;
            subjectUnderstanding['未解答']++;
            correctRateDistribution['未解答']++;
          }
        });
      });
      
      // 科目ごとの統計を保存
      const subjectCorrectRate = subjectAnswered > 0 ? Math.round((subjectCorrectCount / subjectAnswered) * 100) : 0;
      
      subjectStats.push({
        name: subjectName,
        total: subjectTotal,
        answered: subjectAnswered,
        correctRate: subjectCorrectRate,
        understanding: subjectUnderstanding
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
    
    // 時系列データの生成（解答履歴から）
    const timeseriesData = generateTimeseriesData(filteredHistory);
    
    return {
      totalQuestions,
      answeredQuestions,
      completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      understandingPieData,
      correctRateBarData,
      subjectStats,
      timeseriesData
    };
  }, [subjects, filteredHistory, formatDate]);
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <BarChart2 className={styles.titleIcon} size={20} />
        学習統計
      </h2>
      
      {/* フィルター */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>期間:</label>
          <select 
            className={styles.filterSelect}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
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
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">全科目</option>
            {subjectOptions.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
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
                    <th onClick={() => {}}>科目名 <ArrowUpDown size={14} /></th>
                    <th onClick={() => {}}>問題数 <ArrowUpDown size={14} /></th>
                    <th onClick={() => {}}>解答済 <ArrowUpDown size={14} /></th>
                    <th onClick={() => {}}>進捗率 <ArrowUpDown size={14} /></th>
                    <th onClick={() => {}}>正解率 <ArrowUpDown size={14} /></th>
                    <th>理解度分布</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subjectStats && stats.subjectStats.map((subject, index) => (
                    <tr key={index}>
                      <td>{subject.name}</td>
                      <td>{subject.total}</td>
                      <td>{subject.answered}</td>
                      <td>{subject.total > 0 ? Math.round((subject.answered / subject.total) * 100) : 0}%</td>
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
                  ))}
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
      
      {/* 学習履歴タブ */}
      {activeTab === 'timeseries' && (
        <div className={styles.timeseriesTab}>
          {/* 日次解答数と正解率 */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <Calendar size={18} className={styles.chartIcon} />
              日別解答数と正解率
            </h3>
            <div className={styles.chartContent}>
              {stats.timeseriesData && stats.timeseriesData.daily && stats.timeseriesData.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={stats.timeseriesData.daily}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="count" name="解答数" stroke="#4f46e5" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="correctRate" name="正解率(%)" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>解答履歴データがありません</div>
              )}
            </div>
          </div>
          
          {/* 週次解答数と正解率 */}
          <div className={styles.chartContainer}>
            <h3 className={styles.chartTitle}>
              <TrendingUp size={18} className={styles.chartIcon} />
              週別解答数と正解率
            </h3>
            <div className={styles.chartContent}>
              {stats.timeseriesData && stats.timeseriesData.weekly && stats.timeseriesData.weekly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={stats.timeseriesData.weekly}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="count" name="解答数" stroke="#4f46e5" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="correctRate" name="正解率(%)" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noDataMessage}>解答履歴データがありません</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
