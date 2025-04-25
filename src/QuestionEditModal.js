// src/QuestionEditModal.js
// 解答回数、最終解答日入力欄を追加し、理解度UIを変更

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ArrowLeft, Calendar, Hash, Check, AlertTriangle, ChevronDown } from 'lucide-react'; // アイコン追加
import styles from './QuestionEditModal.module.css'; // CSSモジュール

// 理解度に応じた色とアイコンの割り当て
const understandingStyles = [
  {
    value: '理解○',
    label: '理解○',
    color: '#22c55e', // 緑色
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    icon: <Check size={16} />
  },
  {
    value: '曖昧△',
    label: '曖昧△',
    color: '#eab308', // 黄色
    bgColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.5)',
    icon: <AlertTriangle size={16} />
  },
  {
    value: '理解できていない×',
    label: '理解できていない×',
    color: '#ef4444', // 赤色
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    icon: <X size={16} />
  }
];

// 曖昧の理由リスト
const ambiguousReasons = [
  '偶然正解した',
  '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった',
  '合っていたが、別の理由を思い浮かべていた',
  '自信はなかったけど、これかなとは思っていた',
  '問題を覚えてしまっていた',
  'その他'
];

const QuestionEditModal = ({ question, onSave, onClose, formatDate }) => {
  // 元のデータをクローン
  const [editData, setEditData] = useState({
    ...question,
    nextDate: question.nextDate 
      ? new Date(question.nextDate).toISOString().split('T')[0] 
      : '',
    lastAnswered: question.lastAnswered 
      ? new Date(question.lastAnswered).toISOString().split('T')[0]
      : ''
  });
  const [isAmbiguousReasonOpen, setIsAmbiguousReasonOpen] = useState(false);
  const [modalAnimation, setModalAnimation] = useState(''); // アニメーション状態

  // エントランスアニメーション
  useEffect(() => {
    setModalAnimation(styles.showModal);
  }, []);

  // 曖昧な理由リストの表示/非表示を制御
  const ambiguousReasonRef = useRef(null);

  // 外部クリック検知
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ambiguousReasonRef.current && !ambiguousReasonRef.current.contains(event.target)) {
        setIsAmbiguousReasonOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ambiguousReasonRef]);

  // 入力値変更ハンドラ
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    if (type === 'number') {
      processedValue = value === '' ? 0 : parseInt(value, 10); // 空なら0、そうでなければ数値
      if (isNaN(processedValue)) processedValue = 0; // 数値でなければ0
      if (processedValue < 0) processedValue = 0; // 負の数は0
      if (name === 'correctRate' && processedValue > 100) processedValue = 100; // 正解率は100まで
    } else if (type === 'date') {
      // Date Input の値 (YYYY-MM-DD) から Date オブジェクトを生成
      try {
        // 日付の文字列を直接保持する（変換はsave時のみ行う）
        processedValue = value;
        console.log(`日付入力変更: ${name} = ${value}`);
      } catch (e) {
        console.error("日付処理エラー:", e);
        processedValue = null;
      }
    } else if (name === 'interval') {
        processedValue = value;
    }
    // understanding は別のハンドラで処理

    setEditData(prev => ({ ...prev, [name]: processedValue }));
  };

  // 理解度ボタンクリックハンドラ
  const handleUnderstandingChange = (newUnderstanding) => {
    setEditData(prev => ({ ...prev, understanding: newUnderstanding }));
    setIsAmbiguousReasonOpen(false); // 理由リストを閉じる
     // 曖昧ボタンが押されたらリストを開く
    if (newUnderstanding === '曖昧△') {
        setIsAmbiguousReasonOpen(true);
    }
  };

  // 曖昧理由選択ハンドラ
  const handleAmbiguousReasonSelect = (reason) => {
    setEditData(prev => ({ ...prev, understanding: `曖昧△:${reason}` }));
    setIsAmbiguousReasonOpen(false); // 理由を選んだらリストを閉じる
  };

  // モーダルを閉じる前に終了アニメーション
  const handleCloseWithAnimation = () => {
    setModalAnimation(styles.hideModal);
    setTimeout(() => {
      onClose();
    }, 300); // アニメーション時間に合わせる
  };

  // 保存処理
  const handleSave = () => {
    // App.js に渡す前にデータを最終調整
    try {
      console.log("保存前の編集データ:", editData);
    
      // 日付文字列からDate型に変換
      let nextDateValue = null;
      if (editData.nextDate) {
        if (typeof editData.nextDate === 'string' && editData.nextDate.includes('-')) {
          // YYYY-MM-DD形式の文字列の場合
          const [year, month, day] = editData.nextDate.split('-').map(Number);
          nextDateValue = new Date(Date.UTC(year, month - 1, day));
          nextDateValue.setHours(0, 0, 0, 0);
        } else if (editData.nextDate instanceof Date) {
          // すでにDateオブジェクトの場合
          nextDateValue = new Date(editData.nextDate);
          nextDateValue.setHours(0, 0, 0, 0);
        }
      }
    
      // 最終解答日の処理
      let lastAnsweredValue = null;
      if (editData.lastAnswered) {
        if (typeof editData.lastAnswered === 'string' && editData.lastAnswered.includes('-')) {
          // YYYY-MM-DD形式の文字列の場合
          const [year, month, day] = editData.lastAnswered.split('-').map(Number);
          lastAnsweredValue = new Date(Date.UTC(year, month - 1, day));
        } else if (editData.lastAnswered instanceof Date) {
          // すでにDateオブジェクトの場合
          lastAnsweredValue = new Date(editData.lastAnswered);
        }
      }
  
      const dataToSave = {
        ...editData,
        nextDate: nextDateValue ? nextDateValue.toISOString() : null,
        lastAnswered: lastAnsweredValue ? lastAnsweredValue : null,
        answerCount: parseInt(editData.answerCount, 10) || 0,
        correctRate: parseInt(editData.correctRate, 10) || 0,
      };
      
      console.log("保存するデータ:", dataToSave);
      console.log("特に次回日付:", dataToSave.nextDate);
      
      // まず先にデータを保存し完了するまでawaitで待機
      onSave(dataToSave); // App.js の saveQuestionEdit を呼び出す
      
      // 保存成功通知
      console.log("データ保存完了 - ID:", dataToSave.id);
      
      // 保存成功後にアニメーションを表示して閉じる
      setModalAnimation(styles.successModal);
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (e) {
      console.error("保存処理中にエラーが発生しました:", e);
      alert(`保存中にエラーが発生しました: ${e.message}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleCloseWithAnimation}>
      <div className={`${styles.modal} ${modalAnimation}`} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>問題編集 : {editData.id}</h3>
          <button onClick={handleCloseWithAnimation} className={styles.closeButton}> <X size={20} /> </button>
        </div>

        {/* コンテンツ */}
        <div className={styles.content}>
          {/* 基本情報 */}
          <div className={styles.fieldSet}>
            <h4 className={styles.sectionTitle}>基本情報</h4>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>問題番号</label>
                <div className={styles.fieldInput}>{editData.number}</div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>正解率</label>
                <div className={styles.fieldInput}>
                  <input 
                    type="number" 
                    name="correctRate"
                    value={editData.correctRate || 0}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className={styles.numberInput}
                  />
                  <span className={styles.inputSuffix}>%</span>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>解答回数</label>
                <div className={styles.fieldInput}>
                  <input 
                    type="number" 
                    name="answerCount"
                    value={editData.answerCount || 0}
                    onChange={handleChange}
                    min="0"
                    className={styles.numberInput}
                  />
                  <span className={styles.inputSuffix}>回</span>
                </div>
              </div>
            </div>
          </div>

          {/* 日付と間隔 */}
          <div className={styles.fieldSet}>
            <h4 className={styles.sectionTitle}>日付と復習間隔</h4>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Calendar size={16} className={styles.fieldIcon} />
                  次回予定日
                </label>
                <div className={styles.fieldInput}>
                  <input 
                    type="date" 
                    name="nextDate"
                    value={editData.nextDate || ''}
                    onChange={handleChange}
                    className={styles.dateInput}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Calendar size={16} className={styles.fieldIcon} />
                  最終解答日
                </label>
                <div className={styles.fieldInput}>
                  <input 
                    type="date" 
                    name="lastAnswered"
                    value={editData.lastAnswered || ''}
                    onChange={handleChange}
                    className={styles.dateInput}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>復習間隔</label>
                <div className={styles.fieldInput}>
                  <select 
                    name="interval"
                    value={editData.interval || ''}
                    onChange={handleChange}
                    className={styles.selectInput}
                  >
                    <option value="">選択してください</option>
                    <option value="1日">1日</option>
                    <option value="3日">3日</option>
                    <option value="7日">7日</option>
                    <option value="14日">14日</option>
                    <option value="1ヶ月">1ヶ月</option>
                    <option value="2ヶ月">2ヶ月</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 理解度 */}
          <div className={styles.fieldSet}>
            <h4 className={styles.sectionTitle}>理解度</h4>
            <div className={styles.understandingButtons}>
              {understandingStyles.map(style => (
                <button
                  key={style.value}
                  type="button"
                  className={`${styles.understandingButton} ${editData.understanding?.startsWith(style.value) ? styles.active : ''}`}
                  style={{
                    color: style.color,
                    backgroundColor: editData.understanding?.startsWith(style.value) ? style.bgColor : 'transparent',
                    borderColor: editData.understanding?.startsWith(style.value) ? style.borderColor : '#e5e7eb'
                  }}
                  onClick={() => handleUnderstandingChange(style.value)}
                >
                  {style.icon} {style.label}
                </button>
              ))}
            </div>
            
            {/* 曖昧理由選択UI */}
            {editData.understanding?.startsWith('曖昧△') && (
              <div className={styles.ambiguousSection}>
                <div className={styles.ambiguousReason}>
                  <span className={styles.ambiguousReasonLabel}>理由:</span>
                  <span className={styles.ambiguousReasonValue}>
                    {editData.understanding.includes(':') 
                      ? editData.understanding.split(':')[1] 
                      : '未選択'}
                  </span>
                  
                  <div className={styles.ambiguousReasonSelect} ref={ambiguousReasonRef}>
                    <button
                      type="button"
                      className={styles.ambiguousReasonButton}
                      onClick={() => setIsAmbiguousReasonOpen(!isAmbiguousReasonOpen)}
                    >
                      変更 <ChevronDown size={14} />
                    </button>
                    
                    {isAmbiguousReasonOpen && (
                      <div className={styles.ambiguousReasonDropdown}>
                        {ambiguousReasons.map(reason => (
                          <div
                            key={reason}
                            className={styles.ambiguousReasonItem}
                            onClick={() => handleAmbiguousReasonSelect(reason)}
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* コメント */}
          <div className={styles.fieldSet}>
            <h4 className={styles.sectionTitle}>コメント</h4>
            <div className={styles.field}>
              <textarea
                name="comment"
                value={editData.comment || ''}
                onChange={handleChange}
                className={styles.textareaInput}
                placeholder="補足情報などを入力..."
                rows={4}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* フッター */}
        <div className={styles.footer}>
          <button onClick={handleCloseWithAnimation} className={`${styles.footerButton} ${styles.cancelButton}`}> <ArrowLeft size={16} />キャンセル </button>
          <button onClick={handleSave} className={`${styles.footerButton} ${styles.saveButton}`}> <Save size={16} />保存 </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditModal;
