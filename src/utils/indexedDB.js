/**
 * IndexedDBを操作するためのユーティリティ関数
 * 学習データの効率的な保存と読み込みを実現します
 */
import { logError, logWarning } from './error-logger';

// データベース設定
const DB_NAME = 'study-scheduler-db';
const DB_VERSION = 1;
const CONTEXT = 'IndexedDB';

// ストア（テーブル）名
const STORES = {
  STUDY_DATA: 'studyData',
  ANSWER_HISTORY: 'answerHistory',
  USER_SETTINGS: 'userSettings',
};

/**
 * IndexedDBがサポートされているか確認
 * @returns {boolean} サポートされている場合はtrue
 */
export const isIndexedDBSupported = () => {
  return 'indexedDB' in window;
};

/**
 * データベース接続を開く
 * @returns {Promise<IDBDatabase>} データベース接続
 */
export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      const errorMsg = 'このブラウザはIndexedDBをサポートしていません';
      logWarning(errorMsg, CONTEXT);
      reject(new Error(errorMsg));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // データベース構造のアップグレード（初回または新バージョン時に実行）
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // studyDataストア - 科目、チャプター、問題のデータを保存
      if (!db.objectStoreNames.contains(STORES.STUDY_DATA)) {
        db.createObjectStore(STORES.STUDY_DATA, { keyPath: 'id', autoIncrement: true });
      }
      
      // answerHistoryストア - 解答履歴を保存
      if (!db.objectStoreNames.contains(STORES.ANSWER_HISTORY)) {
        const answerHistoryStore = db.createObjectStore(STORES.ANSWER_HISTORY, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        // タイムスタンプとクエスチョンIDでインデックスを作成（検索を高速化）
        answerHistoryStore.createIndex('timestamp', 'timestamp', { unique: false });
        answerHistoryStore.createIndex('questionId', 'questionId', { unique: false });
      }
      
      // userSettingsストア - ユーザー設定を保存
      if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
        db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'key' });
      }
      
      console.log(`IndexedDB: データベース構造を初期化しました (version ${DB_VERSION})`);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('IndexedDB: データベース接続に成功しました');
      resolve(db);
    };

    request.onerror = (event) => {
      const error = event.target.error;
      logError(error, CONTEXT, { action: 'openDatabase' });
      reject(error);
    };
  });
};

/**
 * 汎用データ保存関数
 * @param {string} storeName ストア名
 * @param {any} data 保存するデータ
 * @param {string|null} key キー（省略時は自動生成）
 * @returns {Promise<any>} 保存結果
 */
export const saveData = (storeName, data, key = null) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        let request;
        if (key !== null) {
          // キーが指定されている場合は明示的に使用
          const dataWithKey = { ...data, key };
          request = store.put(dataWithKey);
        } else {
          // キーが指定されていない場合は自動生成
          request = store.put(data);
        }
        
        request.onsuccess = (event) => {
          resolve(event.target.result); // 生成されたキーまたは保存結果
        };
        
        request.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'saveData', storeName });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * 学習データを保存
 * @param {Array} subjects 科目データ
 * @returns {Promise<any>} 保存結果
 */
export const saveStudyData = (subjects) => {
  // 保存する前にコピーを作成し、必要に応じてデータを整形
  const dataToSave = { 
    subjects: JSON.parse(JSON.stringify(subjects)),
    timestamp: new Date().toISOString() 
  };
  
  return saveData(STORES.STUDY_DATA, dataToSave, 'main');
};

/**
 * 解答履歴を保存
 * @param {Array} history 履歴データ
 * @returns {Promise<any>} 保存結果 
 */
export const saveAnswerHistory = (history) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(STORES.ANSWER_HISTORY, 'readwrite');
        const store = transaction.objectStore(STORES.ANSWER_HISTORY);
        
        // 既存のデータをクリア
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          // データが空の場合は終了
          if (!Array.isArray(history) || history.length === 0) {
            resolve();
            return;
          }
          
          // すべてのデータを追加
          let completed = 0;
          let errors = 0;
          
          history.forEach((item, index) => {
            // IDは自動生成するのでコピーから削除
            const itemToSave = { ...item };
            delete itemToSave.id;
            
            const addRequest = store.add(itemToSave);
            
            addRequest.onsuccess = () => {
              completed++;
              checkComplete();
            };
            
            addRequest.onerror = (event) => {
              errors++;
              logError(event.target.error, CONTEXT, { 
                action: 'saveAnswerHistory', 
                index 
              });
              checkComplete();
            };
          });
          
          // すべての操作が終了したか確認
          function checkComplete() {
            if (completed + errors === history.length) {
              console.log(`IndexedDB: ${completed}件の解答履歴を保存しました（${errors}件のエラー）`);
              if (errors > 0) {
                reject(new Error(`${errors}件の解答履歴の保存に失敗しました`));
              } else {
                resolve();
              }
            }
          }
        };
        
        clearRequest.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'clearAnswerHistory' });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * 設定データを保存
 * @param {string} key 設定キー
 * @param {any} value 設定値
 * @returns {Promise<void>} 保存結果
 */
export const saveSetting = (key, value) => {
  const data = { key, value, updatedAt: new Date().toISOString() };
  return saveData(STORES.USER_SETTINGS, data);
};

/**
 * データを取得する
 * @param {string} storeName ストア名
 * @param {string|number} key 取得するデータのキー
 * @returns {Promise<any>} 取得したデータ
 */
export const getData = (storeName, key) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = (event) => {
          const data = event.target.result;
          resolve(data);
        };
        
        request.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'getData', storeName, key });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * 学習データを取得
 * @returns {Promise<Array>} 科目データ配列
 */
export const getStudyData = () => {
  return new Promise((resolve, reject) => {
    getData(STORES.STUDY_DATA, 'main')
      .then(data => {
        if (data && data.subjects) {
          resolve(data.subjects);
        } else {
          // データがない場合は空配列を返す
          resolve([]);
        }
      })
      .catch(error => {
        logError(error, CONTEXT, { action: 'getStudyData' });
        reject(error);
      });
  });
};

/**
 * 解答履歴を取得
 * @returns {Promise<Array>} 解答履歴の配列
 */
export const getAnswerHistory = () => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(STORES.ANSWER_HISTORY, 'readonly');
        const store = transaction.objectStore(STORES.ANSWER_HISTORY);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
          const history = event.target.result || [];
          resolve(history);
        };
        
        request.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'getAnswerHistory' });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * 設定値を取得
 * @param {string} key 設定キー
 * @param {any} defaultValue デフォルト値
 * @returns {Promise<any>} 設定値
 */
export const getSetting = (key, defaultValue = null) => {
  return new Promise((resolve, reject) => {
    getData(STORES.USER_SETTINGS, key)
      .then(data => {
        if (data && data.value !== undefined) {
          resolve(data.value);
        } else {
          resolve(defaultValue);
        }
      })
      .catch(error => {
        logError(error, CONTEXT, { action: 'getSetting', key });
        // エラーが発生してもデフォルト値を返す
        resolve(defaultValue);
      });
  });
};

/**
 * ストア内のすべてのデータを取得
 * @param {string} storeName ストア名
 * @returns {Promise<Array>} データの配列
 */
export const getAllData = (storeName) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
          const data = event.target.result || [];
          resolve(data);
        };
        
        request.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'getAllData', storeName });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * 指定された条件に合致する解答履歴を検索
 * @param {Object} criteria 検索条件
 * @param {Date} [criteria.startDate] 開始日
 * @param {Date} [criteria.endDate] 終了日
 * @param {string} [criteria.questionId] 問題ID
 * @returns {Promise<Array>} 検索結果の配列
 */
export const searchAnswerHistory = (criteria = {}) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const transaction = db.transaction(STORES.ANSWER_HISTORY, 'readonly');
        const store = transaction.objectStore(STORES.ANSWER_HISTORY);
        
        // 検索条件に応じたインデックスまたはストア全体を使用
        let request;
        
        if (criteria.questionId) {
          // 問題IDで検索
          const index = store.index('questionId');
          request = index.getAll(criteria.questionId);
        } else {
          // すべての履歴を取得
          request = store.getAll();
        }
        
        request.onsuccess = (event) => {
          let results = event.target.result || [];
          
          // 日付範囲でフィルタリング
          if (criteria.startDate || criteria.endDate) {
            results = results.filter(item => {
              const timestamp = new Date(item.timestamp);
              
              if (criteria.startDate && timestamp < criteria.startDate) {
                return false;
              }
              
              if (criteria.endDate && timestamp > criteria.endDate) {
                return false;
              }
              
              return true;
            });
          }
          
          resolve(results);
        };
        
        request.onerror = (event) => {
          const error = event.target.error;
          logError(error, CONTEXT, { action: 'searchAnswerHistory', criteria });
          reject(error);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * データベース内のすべてのデータを削除
 * @returns {Promise<void>} 削除完了を示すPromise
 */
export const clearAllData = () => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        const storeNames = Object.values(STORES);
        const transaction = db.transaction(storeNames, 'readwrite');
        
        let completed = 0;
        let errors = 0;
        
        storeNames.forEach(storeName => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            completed++;
            checkComplete();
          };
          
          request.onerror = (event) => {
            errors++;
            logError(event.target.error, CONTEXT, { action: 'clearStore', storeName });
            checkComplete();
          };
        });
        
        function checkComplete() {
          if (completed + errors === storeNames.length) {
            console.log(`IndexedDB: ${completed}個のストアをクリアしました（${errors}個のエラー）`);
            if (errors > 0) {
              reject(new Error(`${errors}個のストアのクリアに失敗しました`));
            } else {
              resolve();
            }
          }
        }
        
        transaction.oncomplete = () => {
          db.close();
        };
      })
      .catch(reject);
  });
};

/**
 * IndexedDBからLocalStorageへのフォールバック
 * IndexedDBが利用できない場合に自動的にLocalStorageを使用
 */
export const getStudyDataWithFallback = () => {
  return new Promise((resolve) => {
    // まずIndexedDBから取得を試みる
    getStudyData()
      .then(data => {
        // データがある場合はそれを返す
        if (Array.isArray(data) && data.length > 0) {
          resolve(data);
        } else {
          // IndexedDBにデータがない場合はLocalStorageを確認
          try {
            const localData = localStorage.getItem('studyData');
            if (localData) {
              const parsedData = JSON.parse(localData);
              resolve(parsedData);
              
              // LocalStorageのデータをIndexedDBに移行（バックグラウンドで実行）
              saveStudyData(parsedData).catch(err => {
                console.error('LocalStorage→IndexedDBへの移行中にエラーが発生しました:', err);
              });
            } else {
              // どちらにもデータがない場合は空配列
              resolve([]);
            }
          } catch (error) {
            console.error('LocalStorageの読み込み中にエラーが発生しました:', error);
            resolve([]);
          }
        }
      })
      .catch(error => {
        console.error('IndexedDBからのデータ読み込み中にエラーが発生しました:', error);
        
        // エラーが発生した場合はLocalStorageにフォールバック
        try {
          const localData = localStorage.getItem('studyData');
          if (localData) {
            resolve(JSON.parse(localData));
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('LocalStorageの読み込み中にエラーが発生しました:', error);
          resolve([]);
        }
      });
  });
};

/**
 * 解答履歴のフォールバック取得
 */
export const getAnswerHistoryWithFallback = () => {
  return new Promise((resolve) => {
    // まずIndexedDBから取得を試みる
    getAnswerHistory()
      .then(data => {
        // データがある場合はそれを返す
        if (Array.isArray(data) && data.length > 0) {
          resolve(data);
        } else {
          // IndexedDBにデータがない場合はLocalStorageを確認
          try {
            const localData = localStorage.getItem('studyHistory');
            if (localData) {
              const parsedData = JSON.parse(localData);
              resolve(parsedData);
              
              // LocalStorageのデータをIndexedDBに移行（バックグラウンドで実行）
              saveAnswerHistory(parsedData).catch(err => {
                console.error('LocalStorage→IndexedDBへの解答履歴移行中にエラーが発生しました:', err);
              });
            } else {
              // どちらにもデータがない場合は空配列
              resolve([]);
            }
          } catch (error) {
            console.error('LocalStorageの解答履歴読み込み中にエラーが発生しました:', error);
            resolve([]);
          }
        }
      })
      .catch(error => {
        console.error('IndexedDBからの解答履歴読み込み中にエラーが発生しました:', error);
        
        // エラーが発生した場合はLocalStorageにフォールバック
        try {
          const localData = localStorage.getItem('studyHistory');
          if (localData) {
            resolve(JSON.parse(localData));
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error('LocalStorageの解答履歴読み込み中にエラーが発生しました:', error);
          resolve([]);
        }
      });
  });
};

/**
 * データベース全体の使用状況を取得
 * @returns {Promise<Object>} データベース使用状況の情報
 */
export const getDatabaseStats = () => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      resolve({
        supported: false,
        stores: {},
        totalEntries: 0
      });
      return;
    }
    
    openDatabase()
      .then(async (db) => {
        const stats = {
          supported: true,
          stores: {},
          totalEntries: 0
        };
        
        const storeNames = Object.values(STORES);
        
        // 各ストアのエントリ数を取得
        for (const storeName of storeNames) {
          try {
            const count = await countEntries(db, storeName);
            stats.stores[storeName] = { entries: count };
            stats.totalEntries += count;
          } catch (error) {
            logError(error, CONTEXT, { action: 'getDatabaseStats', storeName });
            stats.stores[storeName] = { entries: 0, error: error.message };
          }
        }
        
        db.close();
        resolve(stats);
      })
      .catch(error => {
        logError(error, CONTEXT, { action: 'getDatabaseStats' });
        reject(error);
      });
  });
};

// ストア内のエントリ数を取得するヘルパー関数
const countEntries = (db, storeName) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      resolve(countRequest.result);
    };
    
    countRequest.onerror = (event) => {
      reject(event.target.error);
    };
  });
}; 
