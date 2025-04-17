// src/ScheduleView.jsx (表示テキスト・レイアウト改善 + モーダル対応 + CSS Modules)
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subDays, isWeekend, addMonths, subMonths, isToday } from 'date-fns';
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
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// DraggableQuestion: ドラッグ可能な問題アイテムコンポーネント
const DraggableQuestion = ({ question, listeners, attributes, isDragging, transform }) => {
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
  const displayText = `${question.subject}${question.chapter ? ` ${question.chapter}` : ''}-${question.number}`;

  return (
    <div className={itemClass} style={style}>
      {/* グリップハンドルのみにドラッグリスナーを適用 */}
      <div 
        className={styles.gripHandle}
        {...listeners} 
        {...attributes}
      >
        <GripVertical strokeWidth={1.5} />
      </div>
      <span className={styles.questionText}>{displayText}</span>
    </div>
  );
};

// DroppableDateCell: 日付セルコンポーネント（ドロップターゲット）
const DroppableDateCell = ({ 
  date, questions, isOver, scheduleQuestion, selectedDate, setSelectedDate, 
  activeId, openDetailModal 
}) => {
  // 日付のフォーマット
  const dateStr = format(date, 'yyyy/MM/dd');
  
  // 条件付きクラス名の設定
  let cellClassName = styles.dateCell;
  if (isToday(date)) cellClassName += ` ${styles.dateCellToday}`;
  if (isWeekend(date)) cellClassName += ` ${styles.dateCellWeekend}`;
  if (isOver) cellClassName += ` ${styles.dateCellOver}`;
  
  // 日付セルの内容をレンダリング
  const renderCell = () => {
    return (
      <div className={cellClassName}>
        <div className={styles.dateCellContent}>
          <div className={styles.dateNumber}>
            {format(date, 'd')}
          </div>
          <div className={styles.questionList}>
            {questions.slice(0, 3).map((q) => (
              <DraggableQuestion
                key={q.id}
                question={q}
                listeners={null}
                attributes={null}
                isDragging={activeId === q.id}
              />
            ))}
            {questions.length > 3 && (
              <div className={styles.showMore} onClick={() => {
                setSelectedDate(date);
                openDetailModal();
              }}>
                +{questions.length - 3} more
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderCell();
};

// メインのScheduleViewコンポーネント
const ScheduleView = ({ data, scheduleQuestion }) => {
  // ステート
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOverDroppable, setIsOverDroppable] = useState(false);
  const [activeDroppableId, setActiveDroppableId] = useState(null);

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
    data.questions.forEach(q => {
      if (q.nextDate) {
        const dateStr = format(new Date(q.nextDate), 'yyyy/MM/dd');
        if (!result[dateStr]) result[dateStr] = [];
        result[dateStr].push(q);
      }
    });
    return result;
  }, [data.questions]);

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
    // ドラッグしている問題のデータを保存
    const question = data.questions.find(q => q.id === active.id);
    setActiveDragData(question);
  }, [data.questions]);

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
    const { over } = event;
    
    // クリーンアップ
    setActiveId(null);
    setIsOverDroppable(false);
    setActiveDroppableId(null);
    
    if (over && activeDragData) {
      try {
        // 日付文字列から日付オブジェクトを作成
        const newDate = new Date(over.id);
        
        // スケジュール変更関数を呼び出し
        scheduleQuestion(activeDragData.id, newDate);
        
        // 成功時のフィードバック (オプション)
        console.log(`Question ${activeDragData.id} scheduled to ${over.id}`);
      } catch (error) {
        // エラー処理
        console.error('Failed to schedule question:', error);
      }
    }
    
    // ドラッグしていた問題のデータをクリア
    setActiveDragData(null);
  }, [activeDragData, scheduleQuestion]);

  // カレンダーレイアウトのレンダリング
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>スケジュール表示</h2>
        <div className={styles.controls}>
          <button onClick={prevMonth} className={styles.iconButton}><ChevronLeft size={20} /></button>
          <button onClick={goToToday} className={styles.todayButton}><Calendar size={16} />今日</button>
          <div className={styles.currentMonth}>{format(currentDate, 'yyyy年M月', { locale: ja })}</div>
          <button onClick={nextMonth} className={styles.iconButton}><ChevronRight size={20} /></button>
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
          {/* 曜日ヘッダー */}
          <div className={styles.weekdayHeader}>
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div key={index} className={`${styles.weekdayCell} ${index === 0 || index === 6 ? styles.weekend : ''}`}>
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy/MM/dd');
              const dayQuestions = questionsByDate[dateStr] || [];
              return (
                <DroppableDateCell
                  key={dateStr}
                  date={day}
                  questions={dayQuestions}
                  isOver={activeDroppableId === dateStr}
                  scheduleQuestion={scheduleQuestion}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  activeId={activeId}
                  openDetailModal={openDetailModal}
                />
              );
            })}
          </div>

          {/* ドラッグ中のオーバーレイ */}
          <DragOverlay>
            {activeId && activeDragData && (
              <div className={styles.draggableQuestionDragging}>
                <div className={styles.gripHandle}>
                  <GripVertical strokeWidth={1.5} />
                </div>
                <span className={styles.questionText}>
                  {`${activeDragData.subject}${activeDragData.chapter ? ` ${activeDragData.chapter}` : ''}-${activeDragData.number}`}
                </span>
              </div>
            )}
          </DragOverlay>
        </div>
      </DndContext>

      {/* 詳細モーダル */}
      {isDetailModalOpen && selectedDate && (
        <ScheduleDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          date={selectedDate}
          questions={questionsByDate[format(selectedDate, 'yyyy/MM/dd')] || []}
          scheduleQuestion={scheduleQuestion}
        />
      )}

      {/* 使い方ガイド (オプション) */}
      <div className={styles.helpText}>
        <InfoIcon size={14} className={styles.infoIcon} />
        <span>問題をドラッグして日付セルにドロップすると、次回の学習日を変更できます</span>
      </div>
    </div>
  );
};

export default ScheduleView;
