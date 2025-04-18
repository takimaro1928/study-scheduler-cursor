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
import ErrorBoundary from './utils/ErrorBoundary';
import ReminderNotification from './ReminderNotification';
import { NotificationProvider } from './contexts/NotificationContext';
import TopNavigation from './components/TopNavigation';

// ★ メインビュー切り替え ★
const MainView = ({ 
  subjects, 
  activeTab, 
  setActiveTab, 
  expandedSubjects, 
  setExpandedSubjects, 
  expandedChapters, 
  setExpandedChapters, 
  editingQuestion, 
  setEditingQuestion, 
  bulkEditMode, 
  setBulkEditMode, 
  selectedQuestions, 
  setSelectedQuestions,
  selectedDate,
  setSelectedDate,
  answerHistory, 
  setAnswerHistory, 
  showExportReminder, 
  setShowExportReminder, 
  daysSinceLastExport, 
  formatDate,
  saveQuestionEdit,
  saveBulkEdit,
  saveBulkEditItems,
  saveComment,
  handleQuestionDateChange,
  toggleSubject,
  toggleChapter,
  toggleQuestionSelection,
  handleGoToSettings,
  handleDismissReminder,
  resetAllData,
  resetAnswerStatusOnly,
  handleDataImport,
  handleDataExport,
  getAllQuestions,
  addQuestion,
  saveSubjectNote,
  calculateTotalQuestionCount,
  hasStorageError,
  recordAnswer
}) => {
  const Views = {
    today: <TodayView subjects={subjects} formatDate={formatDate} handleQuestionEdit={handleQuestionDateChange} onRecordAnswer={recordAnswer} answerHistory={answerHistory} />,
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
      setSelectedQuestions={setSelectedQuestions}
      onDateChange={handleQuestionDateChange} 
      saveBulkEdit={saveBulkEdit}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      toggleQuestionSelection={toggleQuestionSelection} 
      onToggleBulkEdit={() => setBulkEditMode(!bulkEditMode)} 
      onSaveBulkEditItems={saveBulkEditItems}
      onAddQuestion={addQuestion}
    />,
    schedule: <ScheduleView data={{ questions: getAllQuestions(subjects) }} scheduleQuestion={handleQuestionDateChange} />,
    settings: <SettingsPage onResetAllData={resetAllData} onResetAnswerStatusOnly={resetAnswerStatusOnly} onImport={handleDataImport} onExport={handleDataExport} exportTimestamp={localStorage.getItem('lastExportTimestamp')} formatDate={formatDate} totalQuestionCount={calculateTotalQuestionCount(subjects)} />,
    stats: <StatsPage subjects={subjects} formatDate={formatDate} answerHistory={answerHistory} />,
    enhanced: <EnhancedStatsPage subjects={subjects} formatDate={formatDate} answerHistory={answerHistory} saveComment={saveComment} />,
    ambiguous: <AmbiguousTrendsPage subjects={subjects} formatDate={formatDate} answerHistory={answerHistory} saveComment={saveComment} saveBulkEditItems={saveBulkEditItems} setEditingQuestion={setEditingQuestion} />,
    notes: <ErrorBoundary><NotesPage subjects={subjects} saveSubjectNote={saveSubjectNote} /></ErrorBoundary>,
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
        
        {showExportReminder && (
          <ReminderNotification 
            daysSinceLastExport={daysSinceLastExport}
            onGoToSettings={handleGoToSettings}
            onDismiss={handleDismissReminder}
          />
        )}
        <div className="p-0 sm:p-4">
          {Views[activeTab] || Views.today}
          {editingQuestion && (
            <QuestionEditModal
              question={editingQuestion}
              onSave={saveQuestionEdit}
              onCancel={() => setEditingQuestion(null)}
              formatDate={formatDate}
            />
          )}
        </div>
        <div id="notification-area" className="fixed bottom-4 right-4 z-30"></div>
      </div>
    </NotificationProvider>
  );
};

export default MainView; 
