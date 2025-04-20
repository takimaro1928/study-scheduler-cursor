import { saveStudyData, getStudyData, getAnswerHistory, saveAnswerHistory, clearAllData } from './indexedDB';
import { logError } from './error-logger';

const CONTEXT = 'BackupRestore';

/**
 * 現在のデータをバックアップしてJSONファイルとしてダウンロード
 * @returns {Promise<void>}
 */
export const createBackup = async () => {
  try {
    // 学習データとアンサー履歴を取得
    const subjects = await getStudyData();
    const answerHistory = await getAnswerHistory();

    // バックアップデータを構築
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      subjects,
      answerHistory
    };

    // JSONに変換
    const jsonData = JSON.stringify(backupData, null, 2);
    
    // ファイル名を生成（日付を含める）
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `study-scheduler-backup-${dateStr}.json`;

    // ファイルダウンロードを実行
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    // クリーンアップ
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('バックアップが正常に作成されました');
    return Promise.resolve();
  } catch (error) {
    logError(error, CONTEXT, { action: 'createBackup' });
    return Promise.reject(new Error('バックアップの作成に失敗しました: ' + error.message));
  }
};

/**
 * バックアップからデータを復元
 * @param {Object} backupData バックアップデータ
 * @returns {Promise<void>}
 */
export const restoreFromBackup = async (backupData) => {
  if (!backupData) {
    return Promise.reject(new Error('バックアップデータが指定されていません'));
  }

  try {
    // バックアップデータの検証
    if (!backupData.subjects || !Array.isArray(backupData.subjects)) {
      return Promise.reject(new Error('無効なバックアップデータ: 科目データがありません'));
    }

    // 現在のデータをクリア
    await clearAllData();
    
    // データの復元
    await saveStudyData(backupData.subjects);
    
    // 解答履歴がある場合は復元
    if (backupData.answerHistory && Array.isArray(backupData.answerHistory)) {
      await saveAnswerHistory(backupData.answerHistory);
    }
    
    console.log('データの復元が完了しました');
    return Promise.resolve();
  } catch (error) {
    logError(error, CONTEXT, { action: 'restoreFromBackup' });
    return Promise.reject(new Error('データの復元中にエラーが発生しました: ' + error.message));
  }
};

/**
 * バックアップデータの検証
 * @param {Object} data バックアップデータ
 * @returns {boolean} 有効なバックアップデータならtrue
 */
export const validateBackupData = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // 必須フィールドの確認
  if (!data.subjects || !Array.isArray(data.subjects)) {
    return false;
  }
  
  // バージョン確認（将来的な互換性のため）
  if (!data.version || data.version < 1) {
    return false;
  }
  
  return true;
}; 
