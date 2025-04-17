// src/CommentEditModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare } from 'lucide-react'; // アイコン変更
import styles from './CommentEditModal.module.css'; // 専用のCSSモジュール

const CommentEditModal = ({ question, onSave, onCancel }) => {
  // モーダル内で編集中のコメントを保持するstate
  const [commentText, setCommentText] = useState(question?.comment || '');

  // question が変わったら state も更新 (モーダルが再利用される場合のため)
  useEffect(() => {
    setCommentText(question?.comment || '');
  }, [question]);

  // 保存ボタンが押されたときの処理
  const handleSave = () => {
    if (question) {
      onSave(question.id, commentText); // App.js の saveComment を呼び出す
    }
    onCancel(); // モーダルを閉じる
  };

  // テキストエリアの変更ハンドラ
  const handleChange = (e) => {
    setCommentText(e.target.value);
  };

  // モーダルが開いていない場合は何も表示しない
  if (!question) {
    return null;
  }

  return (
    // オーバーレイ (クリックでキャンセル)
    <div className={styles.overlay} onClick={onCancel}>
      {/* モーダル本体 (クリックイベントの伝播を停止) */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
             <MessageSquare size={18} style={{ marginRight: '8px' }} />
             コメント編集 ({question.id})
          </h3>
          <button onClick={onCancel} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ (テキストエリア) */}
        <div className={styles.content}>
          <textarea
            className={styles.textarea}
            value={commentText}
            onChange={handleChange}
            placeholder="問題に関するメモや対策などを入力..."
            rows={6} // 表示行数
            autoFocus // モーダル表示時にフォーカス
          />
        </div>

        {/* フッター */}
        <div className={styles.footer}>
          <button onClick={onCancel} className={`${styles.footerButton} ${styles.cancelButton}`}>
             キャンセル
          </button>
          <button onClick={handleSave} className={`${styles.footerButton} ${styles.saveButton}`}>
            <Save size={16} style={{ marginRight: '4px' }}/> 保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentEditModal;
