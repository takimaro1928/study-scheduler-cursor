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
import SMEExamPage from './SMEExamPage';
import QuestionEditModal from './QuestionEditModal';
import ErrorBoundary from './components/ErrorBoundary';
import ReminderNotification from './ReminderNotification';
import { NotificationProvider } from './contexts/NotificationContext';
import TopNavigation from './components/TopNavigation';
import { format } from 'date-fns';
import { firestore } from './firebase';

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
  getQuestionsForDate,
  editingQuestion,
  saveQuestionEdit,
  refreshData,
  setForceUpdate
}) => {
  
  // 現在の曜日を取得する関数
  const getDayOfWeek = () => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const today = new Date();
    return days[today.getDay()];
  };

  // 問題の日付を変更する関数
  const handleQuestionDateChange = (questionId, newDate) => {
    // 日付を安全に処理
    let formattedDate;
    
    try {
      // newDateをDateオブジェクトとして扱い、フォーマット
      const dateObj = newDate instanceof Date ? newDate : new Date(newDate);
      
      if (isNaN(dateObj.getTime())) {
        throw new Error('無効な日付');
      }
      
      // フォーマット処理
      formattedDate = format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.error('日付の更新に失敗しました:', error.message);
      return;
    }
    
    // 現在の状態から問題を探す
    let updatedQuestion = null;
    
    const updateSubjects = subjects.map(subject => {
      // 科目をコピー
      const updatedSubject = { ...subject };
      
      // 章をコピー＆更新
      updatedSubject.chapters = subject.chapters.map(chapter => {
        // 章をコピー
        const updatedChapter = { ...chapter };
        
        // 問題を探して更新
        let found = false;
        updatedChapter.questions = chapter.questions.map(question => {
          if (question.id === questionId) {
            found = true;
            updatedQuestion = {
              ...question,
              nextDate: formattedDate
            };
            return updatedQuestion;
          }
          return question;
        });
        
        return updatedChapter;
      });
      
      return updatedSubject;
    });
    
    if (updatedQuestion) {
      // 状態を更新
      setSubjects(updateSubjects);
      
      // 変更をFirestoreに保存
      firestore
        .collection('users')
        .doc(uid)
        .set({
          subjects: updateSubjects
        }, { merge: true })
        .then(() => {
          console.log('問題の次回日付を更新しました');
        })
        .catch(error => {
          console.error('問題の次回日付の更新に失敗:', error);
        });
    } else {
      console.warn('指定されたIDの問題が見つかりません:', questionId);
    }
  };

  // 画面切り替え
  const renderContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <ErrorBoundary>
            <RedesignedAllQuestionsView
              subjects={subjects}
              expandedSubjects={expandedSubjects}
              expandedChapters={expandedChapters}
              toggleSubject={toggleSubject}
              toggleChapter={toggleChapter}
              setEditingQuestion={setEditingQuestion}
              bulkEditMode={bulkEditMode}
              setBulkEditMode={setBulkEditMode}
              selectedQuestions={selectedQuestions}
              toggleQuestionSelection={toggleQuestionSelection}
              saveBulkEdit={saveBulkEdit}
              saveBulkEditItems={saveBulkEditItems}
              saveComment={saveComment}
              handleQuestionDateChange={handleQuestionDateChange}
              filterText={filterText}
              setFilterText={setFilterText}
              showAnswered={showAnswered}
              setShowAnswered={setShowAnswered}
              formatDate={formatDate}
              addQuestion={addQuestion}
              answerHistory={answerHistory}
              refreshData={refreshData}
            />
          </ErrorBoundary>
        );
      case 'today':
        return (
          <ErrorBoundary>
            <TodayView
              todayQuestions={getQuestionsForDate(new Date())}
              answerHistory={answerHistory}
              recordAnswer={recordAnswer}
              saveComment={saveComment}
              formatDate={formatDate}
              refreshData={refreshData}
            />
          </ErrorBoundary>
        );
      case 'schedule':
        return (
          <ErrorBoundary>
            <ScheduleView
              data={{
                questions: getAllQuestions()
              }}
              scheduleQuestion={handleQuestionDateChange}
              refreshData={() => {
                // デバッグログを削減
                console.log("スケジュールビューのデータを更新中");
                
                // データをリフレッシュする必要がある場合はここに処理を追加
                // 必要最小限のみ更新
                setForceUpdate(prev => prev + 1);
              }}
            />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <SettingsPage
              resetAllData={resetAllData}
              resetAnswerStatusOnly={resetAnswerStatusOnly}
              handleDataImport={handleDataImport}
              handleDataExport={handleDataExport}
              handleBackupData={handleBackupData}
              handleRestoreData={handleRestoreData}
              subjects={subjects}
              getAllQuestions={getAllQuestions}
              hasStorageError={hasStorageError}
              calculateTotalQuestionCount={calculateTotalQuestionCount}
            />
          </ErrorBoundary>
        );
      case 'stats':
        return (
          <ErrorBoundary>
            <EnhancedStatsPage
              subjects={subjects}
              answerHistory={answerHistory}
              formatDate={formatDate}
            />
          </ErrorBoundary>
        );
      case 'ambiguous':
        return (
          <ErrorBoundary>
            <AmbiguousTrendsPage
              subjects={subjects}
              answerHistory={answerHistory}
              formatDate={formatDate}
            />
          </ErrorBoundary>
        );
      case 'notes':
        return (
          <ErrorBoundary>
            <NotesPage
              subjects={subjects}
              saveSubjectNote={saveSubjectNote}
            />
          </ErrorBoundary>
        );
      case 'smeExam':
        return (
          <ErrorBoundary>
            <SMEExamPage />
          </ErrorBoundary>
        );
      default:
        return <div>ページが見つかりません</div>;
    }
  };

  return (
    <NotificationProvider>
      <TopNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* メイン表示部分 */}
      <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </div>
      
      {/* 質問編集モーダル */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => {
            setEditingQuestion(null);
            // モーダルが閉じた後にデータをリフレッシュ
            setTimeout(() => {
              refreshData && refreshData();
            }, 100);
          }}
          onSave={saveQuestionEdit}
          formatDate={formatDate}
        />
      )}
      
      {/* リマインダー通知 */}
      <ReminderNotification />
    </NotificationProvider>
  );
};

export default MainView; 
