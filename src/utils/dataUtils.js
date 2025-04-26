import { getSetting } from './indexedDB';
import { getAnswerHistory } from './indexedDB';

/**
 * 全データの数を取得する
 * @returns {Promise<Object>} 各データタイプの数
 */
export const getAllDataCount = async () => {
  try {
    // IndexedDBから直接データを取得
    let dataCounts = {
      questionCount: 0,
      answerHistoryCount: 0,
      settingsCount: 0,
      flashcardCount: 0,
      genreCount: 0,
      tagCount: 0,
      totalCount: 0
    };
    
    // 解答履歴の数を取得
    const answerHistory = await getAnswerHistory();
    dataCounts.answerHistoryCount = answerHistory?.length || 0;
    
    // その他のアイテム数は直接IndexedDBから取得
    dataCounts.totalCount = dataCounts.answerHistoryCount;
    
    return dataCounts;
  } catch (error) {
    console.error('データ数の取得に失敗しました:', error);
    return {
      questionCount: 0,
      answerHistoryCount: 0,
      settingsCount: 0,
      flashcardCount: 0,
      genreCount: 0,
      tagCount: 0,
      totalCount: 0
    };
  }
};

/**
 * データオブジェクトをJSONファイルとしてエクスポート
 * @param {Object} data - エクスポートするデータ
 * @param {string} filename - ファイル名
 */
export const exportDataToJson = (data, filename) => {
  try {
    // JSONデータの作成
    const jsonData = JSON.stringify(data, null, 2);
    
    // Blobの作成
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // ダウンロードリンクの作成
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // リンクをクリックしてダウンロード
    document.body.appendChild(link);
    link.click();
    
    // クリーンアップ
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('データのエクスポートに失敗しました:', error);
    return false;
  }
};

/**
 * JSONファイルからデータをインポート
 * @param {File} file - インポートするJSONファイル
 * @returns {Promise<Object>} インポートしたデータ
 */
export const importDataFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        console.error('JSONの解析に失敗しました:', error);
        reject(new Error('ファイルの解析に失敗しました。有効なJSONファイルを選択してください。'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました。'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * データの妥当性をチェック
 * @param {Object} data - チェックするデータ
 * @returns {boolean} データが有効な場合はtrue
 */
export const validateImportData = (data) => {
  // 必要なデータ構造が存在するかチェック
  if (!data) return false;
  
  // 基本的な構造チェック
  const hasStudyData = data.studyData && Array.isArray(data.studyData.subjects);
  const hasAnswerHistory = !data.answerHistory || Array.isArray(data.answerHistory);
  const hasUserSettings = !data.userSettings || typeof data.userSettings === 'object';
  const hasFlashcards = !data.flashcards || Array.isArray(data.flashcards);
  
  return hasStudyData && hasAnswerHistory && hasUserSettings && hasFlashcards;
}; 
