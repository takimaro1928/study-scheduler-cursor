/**
 * ローカルストレージ操作のためのユーティリティ関数
 * エラーハンドリング、データ検証、フォールバック機能を実装
 */
import { logError, logWarning } from './error-logger';

// ストレージ操作のコンテキスト名（ロギング用）
const STORAGE_CONTEXT = 'LocalStorage';

/**
 * ストレージが利用可能かどうかを確認
 * @returns {boolean} ストレージが利用可能な場合はtrue
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    const result = localStorage.getItem(test) === test;
    localStorage.removeItem(test);
    return result;
  } catch (e) {
    logWarning('LocalStorage is not available', STORAGE_CONTEXT, { error: e.message });
    return false;
  }
};

/**
 * ローカルストレージからデータを取得
 * @param {string} key - 取得するデータのキー
 * @param {any} defaultValue - データが存在しない場合のデフォルト値
 * @param {Function} [validator] - データ検証用の関数 (オプション)
 * @returns {any} 取得したデータまたはデフォルト値
 */
export const getStorageItem = (key, defaultValue, validator = null) => {
  if (!isStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    
    // 項目が存在しない場合はデフォルト値を返す
    if (item === null) {
      return defaultValue;
    }
    
    // JSON形式のデータをパース
    const parsedItem = JSON.parse(item);
    
    // バリデーション関数が指定されている場合は検証を行う
    if (validator && typeof validator === 'function') {
      const isValid = validator(parsedItem);
      if (!isValid) {
        logWarning(`Invalid data format for key "${key}". Using default value instead.`, STORAGE_CONTEXT, { data: parsedItem });
        return defaultValue;
      }
    }
    
    return parsedItem;
  } catch (error) {
    // エラーが発生した場合はログに記録しデフォルト値を返す
    logError(error, STORAGE_CONTEXT, { action: 'get', key: key });
    return defaultValue;
  }
};

/**
 * ローカルストレージにデータを保存
 * @param {string} key - 保存するデータのキー
 * @param {any} value - 保存するデータ
 * @returns {boolean} 保存の成功/失敗
 */
export const setStorageItem = (key, value) => {
  if (!isStorageAvailable()) {
    logWarning('Unable to save data - localStorage is not available', STORAGE_CONTEXT, { key });
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    // エラーが発生した場合はログに記録
    logError(error, STORAGE_CONTEXT, { action: 'set', key: key, dataSize: JSON.stringify(value).length });
    
    // ストレージ容量超過の場合は特別なメッセージを表示
    if (error instanceof DOMException && 
        (error.code === 22 || error.code === 1014 || 
         error.name === 'QuotaExceededError' || 
         error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      logWarning('Local storage quota exceeded. Some data may not be saved.', STORAGE_CONTEXT, { key: key });
      
      // 重要なデータの場合、容量を確保するために古いデータを削除することも検討
      // cleanupStorage();
    }
    
    return false;
  }
};

/**
 * ローカルストレージからデータを削除
 * @param {string} key - 削除するデータのキー
 * @returns {boolean} 削除の成功/失敗
 */
export const removeStorageItem = (key) => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logError(error, STORAGE_CONTEXT, { action: 'remove', key: key });
    return false;
  }
};

/**
 * ローカルストレージの全データをクリア
 * @returns {boolean} クリアの成功/失敗
 */
export const clearStorage = () => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    logError(error, STORAGE_CONTEXT, { action: 'clear' });
    return false;
  }
};

/**
 * ストレージサイズの推定を取得
 * @returns {number} 推定されるストレージ使用量（バイト単位）
 */
export const getStorageUsage = () => {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      total += key.length + value.length;
    }
    return total * 2; // UTF-16では1文字2バイト
  } catch (error) {
    logError(error, STORAGE_CONTEXT, { action: 'getUsage' });
    return 0;
  }
};

/**
 * 重要でないデータを削除して容量を確保
 * @returns {boolean} クリーンアップの成功/失敗
 */
export const cleanupStorage = () => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    // 削除する優先順位の低いキーのリスト
    const lowPriorityKeys = ['errorLogs', 'userPreferences'];
    
    for (const key of lowPriorityKeys) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        logWarning(`Removed "${key}" to free up storage space`, STORAGE_CONTEXT);
      }
    }
    
    return true;
  } catch (error) {
    logError(error, STORAGE_CONTEXT, { action: 'cleanup' });
    return false;
  }
};

/**
 * データモデルのスキーマ検証を行う
 * 
 * 使用例:
 * const studyDataValidator = createValidator({
 *   required: ['subjects'],
 *   types: {
 *     subjects: 'array'
 *   }
 * });
 * 
 * @param {Object} schema - 検証スキーマ
 * @returns {Function} バリデータ関数
 */
export const createValidator = (schema) => {
  return (data) => {
    // nullまたはundefinedの場合は無効
    if (data == null) return false;
    
    // 必須フィールドの検証
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (data[field] === undefined) return false;
      }
    }
    
    // 型の検証
    if (schema.types && typeof schema.types === 'object') {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        if (data[field] !== undefined) {
          if (expectedType === 'array' && !Array.isArray(data[field])) {
            return false;
          } else if (expectedType !== 'array' && typeof data[field] !== expectedType) {
            return false;
          }
        }
      }
    }
    
    return true;
  };
};

// 学習データのバリデータ
export const studyDataValidator = createValidator({
  required: ['subjects'],
  types: {
    subjects: 'array'
  }
});

// 解答履歴のバリデータ
export const historyDataValidator = createValidator({
  types: {
    answerHistory: 'array'
  }
});

// エクスポートされたデータのバリデータ
export const exportDataValidator = createValidator({
  required: ['studyData', 'exportDate'],
  types: {
    studyData: 'object',
    exportDate: 'string'
  }
}); 
