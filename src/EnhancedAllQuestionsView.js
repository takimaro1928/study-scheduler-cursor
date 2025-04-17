// EnhancedAllQuestionsView.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, Search, Filter, X, ChevronUp, 
  Calendar, ClipboardList, Check, AlertTriangle, CheckCircle, 
  XCircle, Clock, ArrowUpDown, Info, Settings, Edit
} from 'lucide-react';
import DatePickerCalendar from './DatePickerCalendar';
import QuestionEditModal from './QuestionEditModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const EnhancedAllQuestionsView = ({ 
  subjects, 
  expandedSubjects, 
  expandedChapters,
  toggleSubject, 
  toggleChapter, 
  setEditingQuestion,
  saveQuestionEdit,
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
  const [filters, setFilters] = useState({
    understanding: 'all', // 'all', '理解○', '曖昧△', '理解できていない×'
    correctRate: 'all',   // 'all', 'high', 'medium', 'low'
    interval: 'all',      // 'all', '1日', '3日', '7日', '14日', '1ヶ月', '2ヶ月'
    lastAnswered: 'all',  // 'all', 'today', 'week', 'month', 'older'
    nextDate: 'all',      // 'all', 'today', 'week', 'month', 'later'
  });

  // 詳細表示モーダル
  const [detailQuestion, setDetailQuestion] = useState(null);
  
  // ソート設定
  const [sort, setSort] = useState({
    field: 'id',        // 'id', 'correctRate', 'lastAnswered', 'nextDate', 'answerCount'
    direction: 'asc'    // 'asc', 'desc'
  });

  // 表示タブとフィルターパネルの状態
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'week', 'month'
  const [showFilters, setShowFilters] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  // カレンダー関連の状態
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef(null);
  
  // ドラッグ&ドロップ後の並び替え関数
  const reorderQuestions = (result) => {
    // 実際のアプリケーションでは、ここでサーバーに並び替え順を保存するなどの処理を行います
    console.log('Reordered:', result);
    // このデモでは実際の並び替えは実装しませんが、実装する場合は subjects を更新する処理が必要です
  };
  
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
      
      // 最終解答日フィルター
      if (filters.lastAnswered !== 'all') {
        const now = new Date();
        const lastAnsweredDate = new Date(question.lastAnswered);
        const diffDays = Math.floor((now - lastAnsweredDate) / (1000 * 60 * 60 * 24));
        
        if (filters.lastAnswered === 'today' && diffDays > 1) {
          return false;
        } else if (filters.lastAnswered === 'week' && diffDays > 7) {
          return false;
        } else if (filters.lastAnswered === 'month' && diffDays > 30) {
          return false;
        } else if (filters.lastAnswered === 'older' && diffDays <= 30) {
          return false;
        }
      }
      
      // 次回予定日フィルター
      if (filters.nextDate !== 'all') {
        const now = new Date();
        const nextDate = new Date(question.nextDate);
        const diffDays = Math.floor((nextDate - now) / (1000 * 60 * 60 * 24));
        
        if (filters.nextDate === 'today' && diffDays > 1) {
          return false;
        } else if (filters.nextDate === 'week' && (diffDays <= 0 || diffDays > 7)) {
          return false;
        } else if (filters.nextDate === 'month' && (diffDays <= 7 || diffDays > 30)) {
          return false;
        } else if (filters.nextDate === 'later' && diffDays <= 30) {
          return false;
        }
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

  // すべて選択/選択解除
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedQuestions([]);
    } else {
      const allQuestionIds = [];
      filteredSubjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.questions.forEach(question => {
            allQuestionIds.push(question.id);
          });
        });
      });
      setSelectedQuestions(allQuestionIds);
    }
    setSelectAll(!selectAll);
  };
  
  // クリックがカレンダーの外側で発生したときに閉じる
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarRef]);
  
  // カレンダーの表示/非表示を切り替え
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };
  
  // カレンダーから日付を選択
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };
  
  // 日付のフォーマット
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  };
  
  // 問題の詳細を表示
  const showQuestionDetails = (question) => {
    setDetailQuestion(question);
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
  
  // 問題を並べ替え
  const sortQuestions = (questions) => {
    return [...questions].sort((a, b) => {
      switch (sort.field) {
        case 'id':
          return sort.direction === 'asc' 
            ? a.id.localeCompare(b.id) 
            : b.id.localeCompare(a.id);
        case 'correctRate':
          return sort.direction === 'asc' 
            ? a.correctRate - b.correctRate 
            : b.correctRate - a.correctRate;
        case 'lastAnswered':
          return sort.direction === 'asc' 
            ? new Date(a.lastAnswered) - new Date(b.lastAnswered) 
            : new Date(b.lastAnswered) - new Date(a.lastAnswered);
        case 'nextDate':
          return sort.direction === 'asc' 
            ? new Date(a.nextDate) - new Date(b.nextDate) 
            : new Date(b.nextDate) - new Date(a.nextDate);
        case 'answerCount':
          return sort.direction === 'asc' 
            ? a.answerCount - b.answerCount 
            : b.answerCount - a.answerCount;
        default:
          return 0;
      }
    });
  };
  
  return (
    <div className="p-4 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-indigo-500" />
            全問題一覧
          </h2>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-1" />
              フィルター
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
            
            <button 
              onClick={() => setBulkEditMode(!bulkEditMode)}
              className={`px-4 py-2 rounded-lg flex items-center justify-center ${
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
              
              {/* 最終解答日フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最終解答日</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={filters.lastAnswered}
                  onChange={(e) => setFilters({...filters, lastAnswered: e.target.value})}
                >
                  <option value="all">すべて</option>
                  <option value="today">今日</option>
                  <option value="week">1週間以内</option>
                  <option value="month">1ヶ月以内</option>
                  <option value="older">1ヶ月以上前</option>
                </select>
              </div>
              
              {/* 次回予定日フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">次回予定日</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={filters.nextDate}
                  onChange={(e) => setFilters({...filters, nextDate: e.target.value})}
                >
                  <option value="all">すべて</option>
                  <option value="today">今日</option>
                  <option value="week">1週間以内</option>
                  <option value="month">1ヶ月以内</option>
                  <option value="later">1ヶ月以上先</option>
                </select>
              </div>
              
              {/* ソート設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">並べ替え</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-grow p-2 border border-gray-300 rounded-lg"
                    value={sort.field}
                    onChange={(e) => setSort({...sort, field: e.target.value})}
                  >
                    <option value="id">問題ID</option>
                    <option value="correctRate">正解率</option>
                    <option value="lastAnswered">最終解答日</option>
                    <option value="nextDate">次回予定日</option>
                    <option value="answerCount">解答回数</option>
                  </select>
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100"
                    onClick={() => setSort({...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc'})}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
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
                    lastAnswered: 'all',
                    nextDate: 'all',
                  });
                  setSort({ field: 'id', direction: 'asc' });
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
      
      {bulkEditMode && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <input 
                type="checkbox"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                checked={selectAll}
                onChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-gray-700">全て選択</span>
            </div>
            <span className="text-sm text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              {selectedQuestions.length}問選択中
            </span>
          </div>
          
          {selectedQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
                  <input
                    type="text"
                    className="px-3 py-2 outline-none text-gray-700 w-40"
                    placeholder="日付を選択"
                    value={selectedDate ? formatDate(selectedDate) : ''}
                    readOnly
                    onClick={toggleCalendar}
                  />
                  <button
                    onClick={toggleCalendar}
                    className="px-2 bg-white text-gray-600 border-l border-gray-300 h-full"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>
                
                {isCalendarOpen && (
                  <div 
                    ref={calendarRef}
                    className="absolute left-0 top-full mt-1 z-50"
                  >
                    <DatePickerCalendar
                      selectedDate={selectedDate}
                      onChange={handleDateSelect}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => saveBulkEdit(selectedDate)}
                disabled={!selectedDate}
                className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm flex items-center
                  ${selectedDate 
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                <Check className="w-4 h-4 mr-1" />
                一括設定
              </button>
            </div>
          )}
        </div>
      )}
      
      {filteredSubjects.length === 0 ? (
        <div className="bg-gray-50 p-10 rounded-lg text-center">
          <p className="text-gray-500">表示できる問題がありません</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={reorderQuestions}>
          <div className="space-y-6">
            {filteredSubjects.map(subject => (
              <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="flex items-center bg-gray-50 p-4 cursor-pointer border-b border-gray-200"
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
                      
                      // ソートを適用
                      filteredQuestions = sortQuestions(filteredQuestions);

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
                          
                          {expandedChapters[chapter.id] && filteredQuestions.length > 0 && (
                            <Droppable droppableId={`chapter-${chapter.id}`}>
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="mt-3 space-y-2 pl-4"
                                >
                                  {filteredQuestions.map((question, index) => {
                                    const understandingStyle = getUnderstandingStyle(question.understanding);
                                    
                                    return (
                                      <Draggable 
                                        key={question.id} 
                                        draggableId={question.id} 
                                        index={index}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                                          >
                                            <div className="p-3 flex flex-wrap md:flex-nowrap gap-3 items-center">
                                              {bulkEditMode && (
                                                <div className="flex items-center">
                                                  <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                    checked={selectedQuestions.includes(question.id)}
                                                    onChange={() => toggleQuestionSelection(question.id)}
                                                  />
                                                </div>
                                              )}
                                              
                                              {/* 問題ID */}
                                              <div className="font-medium text-gray-800">
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
                                              
                                              {/* 理解度 */}
                                              <div className={`flex items-center text-xs px-2 py-1 rounded-full border ${understandingStyle.className}`}>
                                                {understandingStyle.icon}
                                                <span className="ml-1">
                                                  {question.understanding.includes(':') 
                                                    ? question.understanding.split(':')[0] 
                                                    : question.understanding}
                                                </span>
                                              </div>
                                              
                                              {/* 正解率 */}
                                              <div className="flex items-center">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                  <div 
                                                    className={`h-2 rounded-full ${getCorrectRateColor(question.correctRate)}`}
                                                    style={{ width: `${question.correctRate}%` }}
                                                  ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 ml-2">{question.correctRate}%</span>
                                              </div>
                                              
                                              {/* 次回予定日 */}
                                              <div className="flex items-center text-xs text-gray-500">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {formatDate(question.nextDate)}
                                              </div>
                                              
                                              {/* アクションボタン */}
                                              <div className="flex gap-2 ml-auto">
                                                <button
                                                  onClick={() => showQuestionDetails(question)}
                                                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                  title="詳細を表示"
                                                >
                                                  <Info className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => setEditingQuestion(question)}
                                                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                                  title="編集"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
      
      {/* 問題詳細モーダル */}
      {detailQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl relative">
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setDetailQuestion(null)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4">
  <h3 className="text-lg font-bold text-gray-800 mb-1">{detailQuestion.id}</h3>
  <p className="text-gray-500 text-sm">{/* 章の名前を表示 */}章の詳細</p>
</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">理解度</div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getUnderstandingStyle(detailQuestion.understanding).className}`}>
                  {getUnderstandingStyle(detailQuestion.understanding).icon}
                  <span className="ml-1">{detailQuestion.understanding}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">正解率</div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getCorrectRateColor(detailQuestion.correctRate)}`}
                      style={{ width: `${detailQuestion.correctRate}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 font-medium">{detailQuestion.correctRate}%</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">解答回数</div>
                <div className="font-medium">{detailQuestion.answerCount}回</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">復習間隔</div>
                <div className="font-medium">{detailQuestion.interval}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">最終解答日</div>
                <div className="font-medium">{formatDate(detailQuestion.lastAnswered)}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">次回予定日</div>
                <div className="font-medium">{formatDate(detailQuestion.nextDate)}</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDetailQuestion(null);
                  setEditingQuestion(detailQuestion);
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => setDetailQuestion(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAllQuestionsView;
