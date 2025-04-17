// SimplifiedAllQuestionsView.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, Search, Filter, X, ChevronUp, 
  Calendar, Info, Check, AlertTriangle, Clock, Edit, 
  CheckCircle, XCircle
} from 'lucide-react';

const SimplifiedAllQuestionsView = ({ 
  subjects, 
  expandedSubjects, 
  expandedChapters,
  toggleSubject, 
  toggleChapter, 
  setEditingQuestion,
  setBulkEditMode,
  bulkEditMode,
  selectedQuestions,
  setSelectedQuestions,
  selectedDate,
  setSelectedDate,
  saveBulkEdit
}) => {
  // 検索とフィルタリングのための状態
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    understanding: 'all', // 'all', '理解○', '曖昧△', '理解できていない×'
    correctRate: 'all',   // 'all', 'high', 'medium', 'low'
    interval: 'all',      // 'all', '1日', '3日', '7日', '14日', '1ヶ月', '2ヶ月'
  });
  
  // 展開された問題の状態
  const [expandedQuestions, setExpandedQuestions] = useState({});
  
  // 表示タブの状態
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'week', 'month'
  
  // 日付によるフィルター関数
  const getFilteredData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1);
    
    let filteredSubjects = [...subjects];
    
    if (activeTab !== 'all') {
      filteredSubjects = subjects.map(subject => {
        const filteredChapters = subject.chapters.map(chapter => {
          const filteredQuestions = chapter.questions.filter(question => {
            const nextDate = new Date(question.nextDate);
            nextDate.setHours(0, 0, 0, 0);
            
            if (activeTab === 'today') {
              return nextDate.getTime() === today.getTime();
            } else if (activeTab === 'week') {
              return nextDate >= today && nextDate <= oneWeekLater;
            } else if (activeTab === 'month') {
              return nextDate >= today && nextDate <= oneMonthLater;
            }
            return true;
          });
          
          return { ...chapter, questions: filteredQuestions };
        }).filter(chapter => chapter.questions.length > 0);
        
        return { ...subject, chapters: filteredChapters };
      }).filter(subject => subject.chapters.length > 0);
    }
    
    return filteredSubjects;
  };

  // 詳細フィルターを適用する
  const applyDetailedFilters = (questions) => {
    return questions.filter(question => {
      // 理解度フィルター
      if (filters.understanding !== 'all' && 
          !question.understanding.startsWith(filters.understanding)) {
        return false;
      }
      
      // 正解率フィルター
      if (filters.correctRate !== 'all') {
        if (filters.correctRate === 'high' && question.correctRate < 80) {
          return false;
        } else if (filters.correctRate === 'medium' && 
                 (question.correctRate < 50 || question.correctRate >= 80)) {
          return false;
        } else if (filters.correctRate === 'low' && question.correctRate >= 50) {
          return false;
        }
      }
      
      // 間隔フィルター
      if (filters.interval !== 'all' && question.interval !== filters.interval) {
        return false;
      }
      
      return true;
    });
  };

  const filteredSubjects = getFilteredData().filter(subject => {
    // 検索フィルタリングも適用
    return subject.chapters.some(chapter => 
      chapter.questions.some(question => 
        searchTerm === '' || question.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  // 問題を選択/選択解除
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // 問題の詳細を展開/折りたたみ
  const toggleQuestionDetails = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  // 日付のフォーマット
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  };
  
  // 問題の理解度に基づくスタイルとアイコンを取得
  const getUnderstandingStyle = (understanding) => {
    if (understanding === '理解○') {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        className: 'bg-green-100 text-green-800 border-green-300',
      };
    } else if (understanding.startsWith('曖昧△')) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      };
    } else {
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        className: 'bg-red-100 text-red-800 border-red-300',
      };
    }
  };
  
  // 正解率に基づく色を取得
  const getCorrectRateColor = (rate) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-lime-500";
    if (rate >= 40) return "bg-yellow-500";
    if (rate >= 20) return "bg-orange-500";
    return "bg-red-500";
  };
  
  return (
    <div className="p-4 max-w-5xl mx-auto pb-20">
      <div className="flex items-center mb-4">
        <Info className="w-6 h-6 mr-2 text-indigo-500" />
        <h2 className="text-xl font-bold text-gray-800">全問題一覧</h2>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="問題IDで検索..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Filter className="w-4 h-4 mr-1" />
              フィルター
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
            
            <button 
              onClick={() => setBulkEditMode(!bulkEditMode)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                bulkEditMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {bulkEditMode ? '選択モード終了' : '一括編集'}
            </button>
          </div>
        </div>
        
        {/* 詳細フィルターパネル */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 理解度フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">理解度</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={filters.understanding}
                  onChange={(e) => setFilters({...filters, understanding: e.target.value})}
                >
                  <option value="all">すべて</option>
                  <option value="理解○">理解○</option>
                  <option value="曖昧△">曖昧△</option>
                  <option value="理解できていない×">理解できていない×</option>
                </select>
              </div>
              
              {/* 正解率フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">正解率</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={filters.correctRate}
                  onChange={(e) => setFilters({...filters, correctRate: e.target.value})}
                >
                  <option value="all">すべて</option>
                  <option value="high">高い (80%以上)</option>
                  <option value="medium">中間 (50-80%)</option>
                  <option value="low">低い (50%未満)</option>
                </select>
              </div>
              
              {/* 間隔フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">復習間隔</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
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
            
            {/* リセットボタン */}
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => {
                  setFilters({
                    understanding: 'all',
                    correctRate: 'all',
                    interval: 'all',
                  });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                フィルターをリセット
              </button>
            </div>
          </div>
        )}
        
        {/* タブフィルター */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            全て
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'today' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            今週
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            今月
          </button>
        </div>
      </div>
      
      {/* 一括編集時の選択数 */}
      {bulkEditMode && selectedQuestions.length > 0 && (
        <div className="bg-indigo-50 p-3 mb-4 rounded-lg border border-indigo-200">
          <p className="text-indigo-800 font-medium">
            {selectedQuestions.length}個の問題を選択中
          </p>
          <div className="mt-2 flex items-center">
            <button 
              onClick={() => saveBulkEdit(selectedDate)}
              disabled={!selectedDate}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium shadow-sm flex items-center hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              一括設定
            </button>
          </div>
        </div>
      )}
      
      {filteredSubjects.length === 0 ? (
        <div className="bg-gray-50 p-10 rounded-lg text-center">
          <p className="text-gray-500">表示できる問題がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div 
                className="flex items-center p-4 cursor-pointer border-b border-gray-200 bg-gray-50"
                onClick={() => toggleSubject(subject.id)}
              >
                <div className="mr-2 text-gray-500 transition-transform duration-200" style={{ 
                  transform: expandedSubjects[subject.id] ? 'rotate(90deg)' : 'rotate(0deg)' 
                }}>
                  <ChevronRight className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800">{subject.name}</h3>
                <div className="ml-2 text-sm bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {subject.chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0)}問
                </div>
              </div>
              
              {expandedSubjects[subject.id] && (
                <div className="p-4">
                  {subject.chapters.map(chapter => {
                    // 章内の問題をフィルタリング
                    let filteredQuestions = chapter.questions.filter(question => 
                      searchTerm === '' || question.id.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    // 詳細フィルタを適用
                    filteredQuestions = applyDetailedFilters(filteredQuestions);

                    if (filteredQuestions.length === 0) return null;

                    return (
                      <div key={chapter.id} className="mb-4 last:mb-0">
                        <div 
                          className="flex items-center bg-white p-3 rounded-lg cursor-pointer border border-gray-200 hover:bg-gray-50"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <div className="mr-2 text-gray-500 transition-transform duration-200" style={{ 
                            transform: expandedChapters[chapter.id] ? 'rotate(90deg)' : 'rotate(0deg)' 
                          }}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <h4 className="text-gray-700 font-medium">{chapter.name}</h4>
                          <div className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {filteredQuestions.length}問
                          </div>
                        </div>
                        
                        {/* 章内の問題一覧 */}
                        {expandedChapters[chapter.id] && filteredQuestions.length > 0 && (
                          <div className="mt-3 pl-4 space-y-2">
                            {filteredQuestions.map(question => {
                              const understandingStyle = getUnderstandingStyle(question.understanding);
                              
                              return (
                                <div key={question.id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                                  {/* 問題ヘッダー */}
                                  <div className="p-3 flex flex-wrap items-center gap-2">
                                    {bulkEditMode && (
                                      <div className="flex items-center mr-1">
                                        <input 
                                          type="checkbox" 
                                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                          checked={selectedQuestions.includes(question.id)}
                                          onChange={() => toggleQuestionSelection(question.id)}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* 問題ID */}
                                    <div className="font-medium text-gray-800 flex-grow">
                                      {searchTerm ? (
                                        <span dangerouslySetInnerHTML={{
                                          __html: question.id.replace(
                                            new RegExp(searchTerm, 'gi'),
                                            match => `<span class="bg-yellow-200">${match}</span>`
                                          )
                                        }} />
                                      ) : (
                                        question.id
                                      )}
                                    </div>
                                    
                                    {/* 理解度バッジ */}
                                    <div className={`flex items-center text-xs px-2 py-1 rounded-full border ${understandingStyle.className}`}>
                                      {understandingStyle.icon}
                                      <span className="ml-1">
                                        {question.understanding.includes(':') 
                                          ? question.understanding.split(':')[0] 
                                          : question.understanding}
                                      </span>
                                    </div>
                                    
                                    {/* 正解率 */}
                                    <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                                      正解率 {question.correctRate}%
                                    </div>
                                    
                                    {/* 次回予定日 */}
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDate(question.nextDate)}
                                    </div>
                                    
                                    {/* 詳細ボタン */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleQuestionDetails(question.id);
                                      }}
                                      className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full ml-auto"
                                    >
                                      {expandedQuestions[question.id] ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <Info className="w-4 h-4" />
                                      )}
                                    </button>
                                    
                                    {/* 編集ボタン */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingQuestion(question);
                                      }}
                                      className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  {/* 問題詳細（展開時） */}
                                  {expandedQuestions[question.id] && (
                                    <div className="border-t border-gray-200 p-3 bg-gray-50 animate-fadeIn">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">解答回数</div>
                                          <div className="font-medium">{question.answerCount}回</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">最終解答日</div>
                                          <div className="font-medium">{formatDate(question.lastAnswered)}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-gray-500 mb-1">復習間隔</div>
                                          <div className="font-medium">{question.interval}</div>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-3">
                                        <div className="text-xs text-gray-500 mb-1">正解率</div>
                                        <div className="flex items-center">
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full ${getCorrectRateColor(question.correctRate)}`}
                                              style={{ width: `${question.correctRate}%` }}
                                            ></div>
                                          </div>
                                          <span className="ml-2 text-sm font-medium">{question.correctRate}%</span>
                                        </div>
                                      </div>
                                      
                                      {question.understanding.includes(':') && (
                                        <div className="mt-3">
                                          <div className="text-xs text-gray-500 mb-1">理解度メモ</div>
                                          <div className="text-sm p-2 bg-white rounded border border-gray-200">
                                            {question.understanding.split(':')[1]}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
};

export default SimplifiedAllQuestionsView;
