import React from 'react';
import { AlertTriangle } from 'lucide-react';
import RedesignedAllQuestionsView from './RedesignedAllQuestionsView';
import TodayView from './TodayView';
import ScheduleView from './ScheduleView';
import SettingsPage from './SettingsPage';
import StatsPage from './StatsPage';
import EnhancedStatsPage from './EnhancedStatsPage';
import AmbiguousTrendsPage from './AmbiguousTrendsPage';
import NotesPage from './NotesPage';
import QuestionEditModal from './QuestionEditModal';
import ErrorBoundary from './components/ErrorBoundary';
import ReminderNotification from './ReminderNotification';
import { NotificationProvider } from './contexts/NotificationContext';
import TopNavigation from './components/TopNavigation';

// ★ メインビュー切り替え ★
const MainView = ({ 
  subjects,
  setSubjects,
  answerHistory,
  activeTab, 
  setActiveTab, 
  expandedSubjects,
  expandedChapters,
  setEditingQuestion, 
  bulkEditMode, 
  setBulkEditMode, 
  selectedQuestions,
  toggleQuestionSelection,
  saveBulkEdit,
  saveBulkEditItems,
  saveComment,
  handleQuestionDateChange,
  toggleSubject,
  toggleChapter,
  filterText,
  setFilterText,
  showAnswered,
  setShowAnswered,
  resetAllData,
  resetAnswerStatusOnly,
  formatDate,
  handleDataImport,
  handleDataExport,
  handleBackupData,
  handleRestoreData,
  getAllQuestions,
  addQuestion,
  saveSubjectNote,
  calculateTotalQuestionCount,
  hasStorageError,
  recordAnswer,
  getQuestionsForDate
}) => {
  const Views = {
    today: <TodayView 
      todayQuestions={getQuestionsForDate(new Date())} 
      formatDate={formatDate} 
      recordAnswer={recordAnswer} 
      answerHistory={answerHistory}
    />,
    all: <RedesignedAllQuestionsView 
      subjects={subjects} 
      formatDate={formatDate} 
      expandedSubjects={expandedSubjects} 
      expandedChapters={expandedChapters} 
      toggleSubject={toggleSubject} 
      toggleChapter={toggleChapter} 
      setEditingQuestion={setEditingQuestion}
      setBulkEditMode={setBulkEditMode}
      bulkEditMode={bulkEditMode}
      selectedQuestions={selectedQuestions}
      toggleQuestionSelection={toggleQuestionSelection} 
      onDateChange={handleQuestionDateChange} 
      saveBulkEdit={saveBulkEdit}
      onToggleBulkEdit={() => setBulkEditMode(!bulkEditMode)} 
      onSaveBulkEditItems={saveBulkEditItems}
      onAddQuestion={addQuestion}
      filterText={filterText}
      setFilterText={setFilterText}
      showAnswered={showAnswered}
      setShowAnswered={setShowAnswered}
    />,
    schedule: <ScheduleView 
      data={{ questions: getAllQuestions(subjects) }} 
      scheduleQuestion={handleQuestionDateChange} 
    />,
    settings: <SettingsPage 
      onResetAllData={resetAllData} 
      onResetAnswerStatusOnly={resetAnswerStatusOnly} 
      onImport={handleDataImport} 
      onExport={handleDataExport}
      onBackup={handleBackupData}
      onRestore={handleRestoreData}
      exportTimestamp={localStorage.getItem('lastExportTimestamp')} 
      formatDate={formatDate} 
      totalQuestionCount={calculateTotalQuestionCount(subjects)} 
    />,
    stats: <StatsPage 
      subjects={subjects} 
      formatDate={formatDate} 
      answerHistory={answerHistory} 
    />,
    enhanced: <EnhancedStatsPage 
      subjects={subjects} 
      formatDate={formatDate} 
      answerHistory={answerHistory} 
      saveComment={saveComment} 
    />,
    ambiguous: <AmbiguousTrendsPage 
      subjects={subjects} 
      formatDate={formatDate} 
      answerHistory={answerHistory} 
      saveComment={saveComment} 
      saveBulkEditItems={saveBulkEditItems} 
      setEditingQuestion={setEditingQuestion} 
    />,
    notes: <ErrorBoundary>
      <NotesPage 
        subjects={subjects} 
        saveSubjectNote={saveSubjectNote} 
      />
    </ErrorBoundary>,
  };

  return (
    <NotificationProvider>
      <div className="app-container">
        <TopNavigation activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab)} />
        
        {/* ストレージエラー通知 */}
        {hasStorageError && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-4 mt-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>
                ローカルストレージにアクセスできないため、データが保存されません。
                シークレットモードを使用している場合は通常モードに切り替えるか、ブラウザの設定を確認してください。
              </p>
            </div>
          </div>
        )}
        
        <div className="p-0 sm:p-4">
          {Views[activeTab] || Views.today}
          {/* 編集モーダル */}
        </div>
        <div id="notification-area" className="fixed bottom-4 right-4 z-30"></div>
      </div>
    </NotificationProvider>
  );
};

export default MainView; 
