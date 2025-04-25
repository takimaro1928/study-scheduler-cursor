// src/ScheduleView.jsx (表示テキスト・レイアウト改善 + モーダル対応 + CSS Modules)
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subDays, isWeekend, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { GripVertical, ChevronLeft, ChevronRight, Calendar, InfoIcon } from 'lucide-react';
import styles from './ScheduleView.module.css';
import ScheduleDetailModal from './ScheduleDetailModal';

// @dnd-kit
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// DraggableQuestion: ドラッグ可能な問題アイテムコンポーネント
const DraggableQuestion = ({ question }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: question.id,
    data: question
  });

  // スタイルを作成（isDraggingに応じて透明度を変える）
  const style = {
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  // クラス名を設定（ドラッグ中かどうかで変更）
  const itemClass = isDragging 
    ? `${styles.draggableQuestion} ${styles.draggingItem}` 
    : styles.draggableQuestion;

  // 表示するテキストを作成
  const displayText = `${question.subject || question.subjectName || ''}${question.chapter || question.chapterName ? ` ${question.chapter || question.chapterName}` : ''}-${question.number || ''}`;

  return (
    <div ref={setNodeRef} className={itemClass} style={style}>
      {/* グリップハンドルのみにドラッグリスナーを適用 */}
      <div 
        className={styles.gripHandle}
        {...listeners} 
        {...attributes}
      >
        <GripVertical size={10} strokeWidth={1.2} />
      </div>
      <span className={styles.questionText}>{displayText}</span>
    </div>
  );
};

// DateCell: 日付セルコンポーネント（ドロップターゲット）
const DateCell = ({ date, dayQuestions, onDateClick }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `date-${date.toISOString()}`,
    data: { date },
  });
  
  // セルのクラス名を設定
  const cellClasses = `${styles.dateCell} 
    ${isToday(date) ? styles.dateCellToday : ''} 
    ${(date.getDay() === 0 || date.getDay() === 6) ? styles.dateCellWeekend : ''} 
    ${isOver ? styles.dateCellOver : ''}`;
  
  return (
    <div 
      ref={setNodeRef}
      className={cellClasses}
      onClick={() => onDateClick(date)}
    >
      <div className={styles.dateCellContent}>
        <div className={styles.dateHeader}>
          <div className={styles.dateNumber}>
            {date.getDate()}
          </div>
          {dayQuestions.length > 0 && (
            <div className={styles.questionBadge} title={`${dayQuestions.length}問のスケジュール`}>
              {dayQuestions.length}
            </div>
          )}
        </div>
        <div className={styles.questionList}>
          {dayQuestions.slice(0, 3).map(question => (
            <DraggableQuestion 
              key={question.id} 
              question={question} 
            />
          ))}
          {dayQuestions.length > 3 && (
            <div className={styles.showMore} onClick={(e) => {
              e.stopPropagation();
              onDateClick(date);
            }}>
              他 {dayQuestions.length - 3} 件
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// メインのScheduleViewコンポーネント
const ScheduleView = ({ data, scheduleQuestion, refreshData }) => {
  // ステート
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOverDroppable, setIsOverDroppable] = useState(false);
  const [activeDroppableId, setActiveDroppableId] = useState(null);
  const [dateQuestions, setDateQuestions] = useState([]);

  // コンポーネントマウント時に最新データを読み込む
  useEffect(() => {
    refreshData && refreshData();
  }, [refreshData]);

  // カレンダーの日付を計算
  const calendarDays = useMemo(() => {
    // 月の開始日と終了日
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = subDays(monthStart, monthStart.getDay());
    const endDate = addDays(monthEnd, 6 - monthEnd.getDay());
    
    // 日付の配列を作成
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  // 日付ごとの問題を整理
  const questionsByDate = useMemo(() => {
    const result = {};
    // データが存在しない場合や、questionsが存在しない場合は空のオブジェクトを返す
    if (!data || !data.questions) {
      console.warn('Invalid data: data or data.questions is undefined');
      return result;
    }
    
    data.questions.forEach(q => {
      if (q.nextDate) {
        try {
          const dateStr = format(new Date(q.nextDate), 'yyyy/MM/dd');
          if (!result[dateStr]) result[dateStr] = [];
          result[dateStr].push(q);
        } catch (error) {
          console.error('Date formatting error for question:', q, error);
        }
      }
    });
    return result;
  }, [data?.questions]);

  // 詳細モーダルの開閉処理
  const openDetailModal = useCallback(() => setIsDetailModalOpen(true), []);
  const closeDetailModal = useCallback(() => setIsDetailModalOpen(false), []);

  // 月を変更する処理
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // センサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px以上動かさないとドラッグ開始しない
      },
    })
  );

  // ドラッグ開始時の処理
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    // データチェック
    if (!data || !data.questions) {
      console.warn('Invalid data: data or data.questions is undefined');
      return;
    }
    // ドラッグしている問題のデータを保存
    const question = data.questions.find(q => q.id === active.id);
    setActiveDragData(question);
  }, [data?.questions]);

  // ドラッグ中の処理
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    // ドロップ可能な領域上にあるか
    setIsOverDroppable(!!over);
    // アクティブなドロップ対象のID（日付文字列）を保存
    setActiveDroppableId(over ? over.id : null);
  }, []);

  // ドラッグ終了時の処理
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    // クリーンアップ
    setActiveId(null);
    setIsOverDroppable(false);
    setActiveDroppableId(null);
    
    if (over && active) {
      try {
        // 日付文字列からnewDateを作成（"date-"というプレフィックスを削除）
        const dateString = over.id.replace('date-', '');
        const newDate = new Date(dateString);
        
        // ドラッグしていた問題のID
        const questionId = active.id;
        
        // スケジュール変更関数を呼び出し
        scheduleQuestion(questionId, newDate);
        
        // 変更後にデータをリフレッシュ
        setTimeout(() => {
          refreshData && refreshData();
        }, 100);
        
        console.log(`Question ${questionId} scheduled to ${format(newDate, 'yyyy/MM/dd')}`);
      } catch (error) {
        console.error('Failed to schedule question:', error);
      }
    }
    
    // ドラッグしていた問題のデータをクリア
    setActiveDragData(null);
  }, [scheduleQuestion, refreshData]);

  // 日付クリック時の処理
  const handleDateClick = (date) => {
    // 日付の形式を修正
    const dateStr = format(date, 'yyyy/MM/dd');
    
    // その日付に割り当てられた問題をフィルタリング
    const filteredQuestions = questionsByDate[dateStr] || [];
    
    setSelectedDate(date);
    setDateQuestions(filteredQuestions);
    openDetailModal(); // モーダルを開く
  };

  // 詳細モーダルを閉じる
  const closeDetailView = () => {
    setSelectedDate(null);
    setDateQuestions([]);
    closeDetailModal();
  };

  // 曜日の配列
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.controls}>
          <button className={styles.iconButton} onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            <Calendar size={14} />
            <span>今日</span>
          </button>
          <button className={styles.iconButton} onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className={styles.currentMonth}>
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </div>
        <div className={styles.helpText}>
          <InfoIcon className={styles.infoIcon} size={16} />
          <span>問題を日付にドラッグすると予定を変更できます</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className={styles.calendarWrapper}>
          <div className={styles.weekdayHeader}>
            {weekdays.map((day, index) => (
              <div 
                key={day} 
                className={`${styles.weekdayCell} ${index === 0 || index === 6 ? styles.weekend : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className={styles.calendarGrid}>
            {calendarDays.map(day => {
              const dateStr = format(day, 'yyyy/MM/dd');
              const dayQuestions = questionsByDate[dateStr] || [];
              
              return (
                <DateCell
                  key={dateStr}
                  date={day}
                  dayQuestions={dayQuestions}
                  onDateClick={handleDateClick}
                />
              );
            })}
          </div>
        </div>
        
        {/* ドラッグ中のオーバーレイ */}
        <DragOverlay>
          {activeId && activeDragData ? (
            <div className={`${styles.draggableQuestion} ${styles.draggingOverlay}`}>
              <div className={styles.gripHandle}>
                <GripVertical size={10} strokeWidth={1.2} />
              </div>
              <span className={styles.questionText}>
                {`${activeDragData.subject || ''} ${activeDragData.chapter || ''}-${activeDragData.number || ''}`}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* 日付詳細モーダル */}
      <ScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailView}
        date={selectedDate}
        questions={dateQuestions}
        scheduleQuestion={scheduleQuestion}
        refreshData={refreshData}
      />
    </div>
  );
};

export default ScheduleView;
