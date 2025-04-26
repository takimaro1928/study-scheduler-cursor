import React, { useState } from 'react';
import styles from '../SettingsPage.module.css';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

const DataReset = ({ onResetAnswers, onResetAll }) => {
  const [showResetAnswersConfirm, setShowResetAnswersConfirm] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);

  // 回答履歴のリセット
  const handleResetAnswers = async () => {
    try {
      setResetStatus('processing');
      await onResetAnswers();
      setResetStatus('success');
      setShowResetAnswersConfirm(false);
      
      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        setResetStatus(null);
      }, 5000);
    } catch (error) {
      console.error('回答履歴のリセットに失敗しました:', error);
      setResetStatus('error');
    }
  };

  // すべてのデータのリセット
  const handleResetAll = async () => {
    try {
      setResetStatus('processing');
      await onResetAll();
      setResetStatus('success');
      setShowResetAllConfirm(false);
      
      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        setResetStatus(null);
      }, 5000);
    } catch (error) {
      console.error('すべてのデータのリセットに失敗しました:', error);
      setResetStatus('error');
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.settingsHeading}>データリセット</h2>
      
      <div className={styles.settingsGroup}>
        <div className={styles.warningContainer}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <p>リセット操作は元に戻せません。操作前に必要に応じてバックアップを作成してください。</p>
        </div>
        
        <div className={styles.resetOption}>
          <h3 className={styles.settingsSubheading}>回答履歴のリセット</h3>
          <p className={styles.settingsDescription}>
            問題の回答履歴のみをリセットします。問題データ自体は保持されます。
          </p>
          
          {!showResetAnswersConfirm ? (
            <button 
              className={styles.resetAnswerButton} 
              onClick={() => setShowResetAnswersConfirm(true)}
            >
              <RotateCcw size={16} className="mr-2" />
              回答状況をリセット
            </button>
          ) : (
            <div className={styles.confirmationBox}>
              <p className={styles.confirmationText}>本当に回答履歴をリセットしますか？</p>
              <div className={styles.confirmationButtons}>
                <button 
                  className={styles.confirmButton} 
                  onClick={handleResetAnswers}
                  disabled={resetStatus === 'processing'}
                >
                  はい、リセットします
                </button>
                <button 
                  className={styles.cancelButton} 
                  onClick={() => setShowResetAnswersConfirm(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.resetOption}>
          <h3 className={styles.settingsSubheading}>すべてのデータのリセット</h3>
          <p className={styles.settingsDescription}>
            問題データ、回答履歴を含むすべてのデータをリセットします。
          </p>
          
          {!showResetAllConfirm ? (
            <button 
              className={styles.dangerButton} 
              onClick={() => setShowResetAllConfirm(true)}
            >
              <Trash2 size={16} className="mr-2" />
              すべてのデータを削除
            </button>
          ) : (
            <div className={styles.confirmationBox}>
              <p className={styles.confirmationText}>
                <strong>警告:</strong> すべてのデータが完全に削除されます。この操作は元に戻せません。
              </p>
              <div className={styles.confirmationButtons}>
                <button 
                  className={styles.dangerConfirmButton} 
                  onClick={handleResetAll}
                  disabled={resetStatus === 'processing'}
                >
                  はい、すべて削除します
                </button>
                <button 
                  className={styles.cancelButton} 
                  onClick={() => setShowResetAllConfirm(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
        
        {resetStatus === 'success' && (
          <div className={styles.successMessage}>
            <p>データのリセットが完了しました。</p>
          </div>
        )}
        
        {resetStatus === 'error' && (
          <div className={styles.errorMessage}>
            <p>リセット中にエラーが発生しました。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataReset; 
