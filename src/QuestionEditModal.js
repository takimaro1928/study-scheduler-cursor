// src/QuestionEditModal.js
// 解答回数、最終解答日入力欄を追加し、理解度UIを変更

import React, { useState, useEffect } from 'react';
import { X, Save, ArrowLeft, Calendar, Hash, Check, AlertTriangle, ChevronDown } from 'lucide-react'; // アイコン追加
import styles from './QuestionEditModal.module.css'; // CSSモジュール

// 曖昧理由リスト (TodayViewからコピー、または共通化する)
const ambiguousReasons = [
  '偶然正解した', '正解の選択肢は理解していたが、他の選択肢の意味が分かっていなかった', '合っていたが、別の理由を思い浮かべていた',
  '自信はなかったけど、これかなとは思っていた', '問題を覚えてしまっていた', 'その他'
];

const QuestionEditModal = ({ question, onSave, onCancel, formatDate }) => {
  // 編集中のデータを保持するState
  const [editData, setEditData] = useState({
      id: '',
      number: 0,
      correctRate: 0,
      lastAnswered: null, // Dateオブジェクトまたはnull
      nextDate: null,     // Dateオブジェクトまたはnull
      interval: '1日',
      answerCount: 0,
      understanding: '理解○',
      comment: '', // コメントフィールドはないが、データ構造として維持
  });
  const [isAmbiguousReasonOpen, setIsAmbiguousReasonOpen] = useState(false); // 曖昧理由リストの開閉

  // 初期データをセット
  useEffect(() => {
    if (question) {
      setEditData({
        id: question.id || '',
        number: question.number || 0,
        correctRate: question.correctRate ?? 0,
        // lastAnswered は Date オブジェクトか null で受け取る想定
        lastAnswered: question.lastAnswered instanceof Date && !isNaN(question.lastAnswered) ? question.lastAnswered : null,
        // nextDate は Date オブジェクトか null で受け取る想定
        nextDate: question.nextDate ? new Date(question.nextDate) : null, // ISO文字列からDateへ
        interval: question.interval || '1日',
        answerCount: question.answerCount ?? 0,
        understanding: question.understanding || '理解○',
        comment: question.comment || '',
      });
      // understanding が "曖昧△:理由" 形式なら理由リストを初期状態で開くか検討（今回は閉じておく）
      setIsAmbiguousReasonOpen(false);
    }
  }, [question]);

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
      // タイムゾーンの問題を避けるためUTCとして解釈し、日付のみを扱う
      const [year, month, day] = value.split('-').map(Number);
      processedValue = value ? new Date(Date.UTC(year, month - 1, day)) : null;
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

  // 保存処理
  const handleSave = () => {
    // App.js に渡す前にデータを最終調整
    const dataToSave = {
      ...editData,
      // nextDate と lastAnswered を ISO 文字列に変換して渡す (App.js側でDateにするか、文字列で持つかは要検討だが、ここではISO文字列)
      nextDate: editData.nextDate instanceof Date && !isNaN(editData.nextDate) ? editData.nextDate.toISOString() : null,
      lastAnswered: editData.lastAnswered instanceof Date && !isNaN(editData.lastAnswered) ? editData.lastAnswered.toISOString() : null,
      // answerCount と correctRate は数値のまま
      answerCount: parseInt(editData.answerCount, 10) || 0,
      correctRate: parseInt(editData.correctRate, 10) || 0,
      // understanding はそのまま渡す
    };
    console.log("Saving data:", dataToSave);
    onSave(dataToSave); // App.js の saveQuestionEdit を呼び出す
  };

  // Date オブジェクトを YYYY-MM-DD 形式の文字列に変換
  const dateToInputFormat = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    // UTC基準で年月日を取得
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>問題編集 : {editData.id}</h3>
          <button onClick={onCancel} className={styles.closeButton}> <X size={20} /> </button>
        </div>

        {/* コンテンツ (フォーム) */}
        <div className={styles.content}>
          {/* --- 解答回数 --- */}
          <div className={styles.formGroup}>
            <label htmlFor={`answerCount-${editData.id}`} className={styles.label}>
              <Hash size={14} className={styles.labelIcon} /> 解答回数
            </label>
            <input type="number" id={`answerCount-${editData.id}`} name="answerCount" min="0"
                   value={editData.answerCount} onChange={handleChange} className={styles.inputField} />
          </div>

          {/* --- 正解率 --- */}
          <div className={styles.formGroup}>
            <label htmlFor={`correctRate-${editData.id}`} className={styles.label}>
               正解率 (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input type="number" id={`correctRate-${editData.id}`} name="correctRate" min="0" max="100"
                     value={editData.correctRate} onChange={handleChange} className={styles.inputField} />
               <span className={styles.inputSuffix}>%</span>
            </div>
          </div>

          {/* --- 最終解答日 --- */}
          <div className={styles.formGroup}>
             <label htmlFor={`lastAnswered-${editData.id}`} className={styles.label}>
               <Calendar size={14} className={styles.labelIcon} /> 最終解答日
             </label>
             <input type="date" id={`lastAnswered-${editData.id}`} name="lastAnswered"
                    value={dateToInputFormat(editData.lastAnswered)} // YYYY-MM-DD形式
                    onChange={handleChange} className={styles.inputField} />
           </div>

          {/* --- 次回解答日 --- */}
          <div className={styles.formGroup}>
            <label htmlFor={`nextDate-${editData.id}`} className={styles.label}>
              <Calendar size={14} className={styles.labelIcon} /> 次回解答日
            </label>
            <input type="date" id={`nextDate-${editData.id}`} name="nextDate"
                   value={dateToInputFormat(editData.nextDate)} // YYYY-MM-DD形式
                   onChange={handleChange} className={styles.inputField} />
          </div>

          {/* --- 間隔 --- */}
          <div className={styles.formGroup}>
            <label htmlFor={`interval-${editData.id}`} className={styles.label}>
              復習間隔
            </label>
            <select id={`interval-${editData.id}`} name="interval" value={editData.interval}
                    onChange={handleChange} className={styles.selectField}>
              <option value="1日">1日</option>
              <option value="3日">3日</option>
              <option value="7日">7日</option>
              <option value="8日">8日 (曖昧)</option> {/* 曖昧用 */}
              <option value="14日">14日</option>
              <option value="1ヶ月">1ヶ月</option>
              <option value="2ヶ月">2ヶ月</option>
            </select>
          </div>

          {/* --- 理解度 --- */}
          <div className={styles.formGroup}>
             <label className={styles.label}>理解度</label>
             <div className={styles.understandingContainer}>
               {/* 理解○ ボタン */}
               <button
                 type="button"
                 onClick={() => handleUnderstandingChange('理解○')}
                 className={`${styles.understandingButton} ${editData.understanding === '理解○' ? styles.activeUnderstand : ''}`}
               >
                 <Check size={16} /> 理解○
               </button>
               {/* 曖昧△ ボタン */}
               <div style={{ position: 'relative', flex: 1 }}> {/* ドロップダウン位置調整用 */}
                 <button
                   type="button"
                   onClick={() => handleUnderstandingChange('曖昧△')} // クリックでリスト開閉トグル
                   className={`${styles.understandingButton} ${editData.understanding?.startsWith('曖昧△') ? styles.activeAmbiguous : ''}`}
                 >
                   <AlertTriangle size={16} /> 曖昧△
                   <ChevronDown size={16} className={`${styles.chevronIcon} ${isAmbiguousReasonOpen ? styles.chevronOpen : ''}`} />
                 </button>
                 {/* 曖昧理由リスト (ドロップダウン) */}
                 {isAmbiguousReasonOpen && (
                   <div className={styles.reasonListContainer}>
                     <div className={styles.reasonListHeader}>曖昧だった理由は？</div>
                     {ambiguousReasons.map((reason) => (
                       <button
                         key={reason}
                         type="button"
                         onClick={() => handleAmbiguousReasonSelect(reason)}
                         className={styles.reasonListItem}
                       >
                         {reason}
                       </button>
                     ))}
                   </div>
                 )}
               </div>
             </div>
             {/* 現在選択中の理由表示 (任意) */}
             {editData.understanding?.startsWith('曖昧△:') && (
                 <div className={styles.selectedReason}>
                   選択中の理由: {editData.understanding.split(':')[1]}
                 </div>
             )}
           </div>
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <button onClick={onCancel} className={`${styles.footerButton} ${styles.cancelButton}`}> <ArrowLeft size={16} />キャンセル </button>
          <button onClick={handleSave} className={`${styles.footerButton} ${styles.saveButton}`}> <Save size={16} />保存 </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditModal;
