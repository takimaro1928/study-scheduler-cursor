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
  FLASHCARDS: 'flashcards',    // 用語暗記カード用のストア
  FLASHCARD_GENRES: 'flashcardGenres', // ジャンル管理用のストア
  FLASHCARD_TAGS: 'flashcardTags',    // タグ管理用のストア
};

// データベース接続のキャッシュ
let dbConnection = null;

// データの保存頻度制限機能を追加
let lastSaveTime = 0;
const SAVE_THROTTLE_MS = 5000; // 5秒間は同じデータの再保存を防止

/**
 * 保存処理の頻度を制限するヘルパー関数
 * @returns {boolean} 保存処理を実行すべきかどうか
 */
const shouldThrottleSave = () => {
  const now = Date.now();
  if (now - lastSaveTime < SAVE_THROTTLE_MS) {
    // console.log('保存頻度を制限しています...');
    return true;
  }
  lastSaveTime = now;
  return false;
};

/**
 * IndexedDBがサポートされているか確認
 * @returns {boolean} サポートされている場合はtrue
 */
export const isIndexedDBSupported = () => {
  return 'indexedDB' in window;
};

/**
 * データベース接続の取得または初期化
 * @returns {Promise<IDBDatabase>} データベース接続
 */
export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // すでに接続が確立されていればそれを返す（キャッシュ）
      if (dbConnection && dbConnection.readyState === 'open') {
        resolve(dbConnection);
        return;
      }
      
      if (!isIndexedDBSupported()) {
        const errorMsg = 'このブラウザはIndexedDBをサポートしていません';
        logWarning(errorMsg, CONTEXT);
        reject(new Error(errorMsg));
        return;
      }
      
      // 新しい接続を作成
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      // データベースのアップグレードが必要な場合
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
        
        // flashcardsストア - 用語暗記カードデータを保存
        if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
          const flashcardsStore = db.createObjectStore(STORES.FLASHCARDS, { keyPath: 'id' });
          // インデックスを作成して検索とソートを高速化
          flashcardsStore.createIndex('term', 'term', { unique: false });
          flashcardsStore.createIndex('genres', 'genres', { unique: false, multiEntry: true });
          flashcardsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          flashcardsStore.createIndex('createdAt', 'createdAt', { unique: false });
          flashcardsStore.createIndex('lastStudied', 'lastStudied', { unique: false });
          flashcardsStore.createIndex('studyStatus', 'studyStatus', { unique: false });
        }
        
        // ジャンル管理用のストア
        if (!db.objectStoreNames.contains(STORES.FLASHCARD_GENRES)) {
          db.createObjectStore(STORES.FLASHCARD_GENRES, { keyPath: 'id' });
        }
        
        // タグ管理用のストア
        if (!db.objectStoreNames.contains(STORES.FLASHCARD_TAGS)) {
          db.createObjectStore(STORES.FLASHCARD_TAGS, { keyPath: 'id' });
        }
      };
      
      // 接続成功
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // グローバル変数に保存
        dbConnection = db;
        
        // 接続が予期せず閉じられた場合の処理
        db.onclose = () => {
          dbConnection = null;
        };
        
        // 接続エラーが発生した場合の処理
        db.onerror = (event) => {
          console.error('データベースエラー:', event.target.error);
          logError(new Error('データベースエラー: ' + event.target.errorCode), CONTEXT);
        };
        
        resolve(db);
      };
      
      // 接続失敗
      request.onerror = (event) => {
        const error = new Error('データベース接続エラー: ' + event.target.errorCode);
        logError(error, CONTEXT);
        reject(error);
      };
    } catch (error) {
      logError(error, CONTEXT, { action: 'openDatabase' });
      reject(error);
    }
  });
};

/**
 * データベース接続を閉じる
 * メモリ最適化のために使用
 */
export const closeDatabase = () => {
  if (dbConnection) {
    dbConnection.close();
    dbConnection = null;
    console.log('IndexedDB接続を閉じました');
  }
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
        try {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          let request;
          if (key !== null) {
            // キーが指定されている場合は明示的に使用
            request = store.put({ ...data, key });
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
            // この関数内では接続を閉じない（キャッシュして再利用）
          };
        } catch (error) {
          logError(error, CONTEXT, { action: 'saveData', storeName });
          reject(error);
        }
      })
      .catch(reject);
  });
};

/**
 * 学習データを保存（メモリ使用量最適化版）
 * @param {Array} subjects 科目データ
 * @returns {Promise<any>} 保存結果
 */
export const saveStudyData = (subjects) => {
  // 頻度制限をチェック
  if (shouldThrottleSave()) {
    return Promise.resolve('throttled');
  }

  // データの変化がない場合は保存をスキップする機能
  let cachedSubjectsHash = localStorage.getItem('subjectsHash');
  let currentSubjectsHash;
  
  try {
    // 簡易的なハッシュ計算（データの一部をJSONに変換）
    const sampledData = subjects.map(s => ({ 
      id: s.id, 
      count: s.chapters?.length || 0
    }));
    currentSubjectsHash = JSON.stringify(sampledData);
    
    // ハッシュが同じ場合は保存をスキップ
    if (cachedSubjectsHash === currentSubjectsHash) {
      return Promise.resolve('unchanged');
    }
  } catch (e) {
    // ハッシュ計算エラーは無視して保存を続行
  }
  
  console.log('学習データをIndexedDBに保存しました');
  
  // バックアップ用にハッシュを保存
  if (currentSubjectsHash) {
    localStorage.setItem('subjectsHash', currentSubjectsHash);
  }
  
  return saveData(STORES.STUDY_DATA, subjects);
};

/**
 * 解答履歴を保存（バッチ処理版）
 * @param {Array} history 履歴データ
 * @returns {Promise<any>} 保存結果 
 */
export const saveAnswerHistory = (history) => {
  // 頻度制限をチェック
  if (shouldThrottleSave()) {
    return Promise.resolve('throttled');
  }
  
  // データの変化がない場合は保存をスキップする機能
  let cachedHistoryLength = localStorage.getItem('historyLength');
  const currentHistoryLength = history?.length || 0;
  
  // 履歴の長さが変わっていない場合はスキップ
  if (cachedHistoryLength && parseInt(cachedHistoryLength) === currentHistoryLength) {
    return Promise.resolve('unchanged');
  }
  
  console.log('解答履歴をIndexedDBに保存しました');
  
  // バックアップ用に長さを保存
  localStorage.setItem('historyLength', currentHistoryLength.toString());
  
  return saveData(STORES.ANSWER_HISTORY, history);
};

/**
 * 設定値を保存
 * @param {string} key 設定キー
 * @param {any} value 設定値
 * @returns {Promise<any>} 保存結果
 */
export const saveSetting = (key, value) => {
  return saveData(STORES.USER_SETTINGS, { value }, key);
};

/**
 * データを取得（読み込み最適化版）
 * @param {string} storeName ストア名
 * @param {string} key キー
 * @returns {Promise<any>} 取得したデータ
 */
export const getData = (storeName, key) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);
          
          request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result);
          };
          
          request.onerror = (event) => {
            const error = event.target.error;
            logError(error, CONTEXT, { action: 'getData', storeName, key });
            reject(error);
          };
        } catch (error) {
          logError(error, CONTEXT, { action: 'getData', storeName, key });
          reject(error);
        }
      })
      .catch(reject);
  });
};

/**
 * 学習データを取得
 * @returns {Promise<any>} 学習データ
 */
export const getStudyData = () => {
  return getData(STORES.STUDY_DATA, 'main')
    .then(data => data ? data.subjects : [])
    .catch(error => {
      logError(error, CONTEXT, { action: 'getStudyData' });
      return [];
    });
};

/**
 * ページング機能付きでデータをすべて取得
 * @param {string} storeName ストア名
 * @param {Object} options 取得オプション
 * @param {number} options.pageSize ページサイズ
 * @param {number} options.page ページ番号（0から開始）
 * @returns {Promise<{data: Array, total: number, page: number, pageSize: number}>} 取得結果
 */
export const getAllDataPaged = (storeName, { pageSize = 100, page = 0 } = {}) => {
  return new Promise((resolve, reject) => {
    openDatabase()
      .then(db => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          
          // 総件数を取得
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            const total = countRequest.result;
            
            // データがなければ空配列を返す
            if (total === 0) {
              resolve({
                data: [],
                total: 0,
                page,
                pageSize
              });
              return;
            }
            
            const start = page * pageSize;
            const results = [];
            
            // 指定範囲のデータを取得
            const cursorRequest = store.openCursor();
            let counter = 0;
            
            cursorRequest.onsuccess = (event) => {
              const cursor = event.target.result;
              
              if (!cursor) {
                // 取得完了
                resolve({
                  data: results,
                  total,
                  page,
                  pageSize
                });
                return;
              }
              
              // 開始位置まではスキップ
              if (counter < start) {
                counter++;
                cursor.continue();
                return;
              }
              
              // 指定件数取得したら終了
              if (counter >= start + pageSize) {
                resolve({
                  data: results,
                  total,
                  page,
                  pageSize
                });
                return;
              }
              
              // データを追加
              results.push(cursor.value);
              counter++;
              cursor.continue();
            };
            
            cursorRequest.onerror = (event) => {
              const error = event.target.error;
              logError(error, CONTEXT, { action: 'getAllDataPaged', storeName });
              reject(error);
            };
          };
          
          countRequest.onerror = (event) => {
            const error = event.target.error;
            logError(error, CONTEXT, { action: 'getAllDataPaged', storeName });
            reject(error);
          };
        } catch (error) {
          logError(error, CONTEXT, { action: 'getAllDataPaged', storeName });
          reject(error);
        }
      })
      .catch(reject);
  });
};

/**
 * 指定した日数よりも古い解答履歴を削除する
 * パフォーマンス向上のため実装を強化
 * @param {number} maxDays - 保持する最大日数 (デフォルト: 90日)
 * @returns {Promise<number>} - 削除されたレコード数
 */
export const cleanupOldAnswerHistory = async (maxDays = 90) => {
  console.log(`${maxDays}日以上前の解答履歴を削除します...`);
  
  try {
    const db = await openDatabase();
    const tx = db.transaction(['answerHistory'], 'readwrite');
    const store = tx.objectStore('answerHistory');
    
    // 現在の日付からmaxDays日前の日付を計算
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);
    cutoffDate.setHours(0, 0, 0, 0);
    const cutoffTime = cutoffDate.getTime();
    
    // 削除カウンター
    let deletedCount = 0;
    
    // 効率的な削除のため、バッチ処理を行う
    return new Promise((resolve, reject) => {
      const getAllKeysRequest = store.getAllKeys();
      
      getAllKeysRequest.onsuccess = async (event) => {
        const allKeys = event.target.result;
        const keysToDelete = [];
        
        // 削除対象のキーを特定するループ
        for (const key of allKeys) {
          const getRequest = store.get(key);
          
          await new Promise(resolveGet => {
            getRequest.onsuccess = (e) => {
              const record = e.target.result;
              if (record && record.timestamp) {
                const recordDate = new Date(record.timestamp);
                if (recordDate.getTime() < cutoffTime) {
                  keysToDelete.push(key);
                }
              }
              resolveGet();
            };
            
            getRequest.onerror = (e) => {
              console.error('レコード取得エラー:', e.target.error);
              resolveGet();
            };
          });
        }
        
        // 特定したキーを削除
        if (keysToDelete.length > 0) {
          console.log(`${keysToDelete.length}件の古い解答履歴を削除します`);
          
          // バッチサイズを設定して削除処理
          const BATCH_SIZE = 100;
          let processedCount = 0;
          
          while (processedCount < keysToDelete.length) {
            const batch = keysToDelete.slice(processedCount, processedCount + BATCH_SIZE);
            
            // 各バッチを処理
            await Promise.all(batch.map(key => {
              return new Promise(resolveDelete => {
                const deleteRequest = store.delete(key);
                
                deleteRequest.onsuccess = () => {
                  deletedCount++;
                  resolveDelete();
                };
                
                deleteRequest.onerror = (e) => {
                  console.error('レコード削除エラー:', e.target.error);
                  resolveDelete();
                };
              });
            }));
            
            processedCount += batch.length;
          }
        }
        
        tx.oncomplete = () => {
          console.log(`クリーンアップ完了: ${deletedCount}件の古い解答履歴を削除しました`);
          
          // LocalStorageのバックアップも更新
          try {
            updateHistoryBackupAfterCleanup(maxDays);
          } catch (e) {
            console.warn('LocalStorageのバックアップ更新に失敗しました', e);
          }
          
          resolve(deletedCount);
        };
        
        tx.onerror = (e) => {
          console.error('トランザクションエラー:', e.target.error);
          reject(e.target.error);
        };
      };
      
      getAllKeysRequest.onerror = (e) => {
        console.error('キー取得エラー:', e.target.error);
        reject(e.target.error);
      };
    });
  } catch (error) {
    console.error('解答履歴クリーンアップエラー:', error);
    return 0;
  }
};

/**
 * クリーンアップ後にLocalStorageのバックアップを更新する
 * @param {number} maxDays - 保持する最大日数
 */
const updateHistoryBackupAfterCleanup = async (maxDays) => {
  try {
    // 最新の履歴データを取得
    const history = await getAnswerHistory();
    
    if (history && Array.isArray(history)) {
      // 最新の100件だけをバックアップ
      const limitedHistory = history.slice(-100);
      localStorage.setItem('answerHistory_backup', JSON.stringify(limitedHistory));
    }
  } catch (e) {
    console.warn('バックアップ更新エラー:', e);
  }
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
 * データベース使用状況の統計を取得
 * @returns {Promise<Object>} 統計情報
 */
export const getDatabaseStats = async () => {
  try {
    const db = await openDatabase();
    const stats = {};
    
    // すべてのストアの統計を取得
    for (const storeName of Object.values(STORES)) {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      // レコード数を取得
      const countRequest = store.count();
      const count = await new Promise((resolve, reject) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = (event) => reject(event.target.error);
      });
      
      stats[storeName] = { count };
    }
    
    // メモリ使用状況（Performance APIがある場合のみ）
    if (window.performance && window.performance.memory) {
      stats.memory = {
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        usedJSHeapSize: window.performance.memory.usedJSHeapSize
      };
    }
    
    return stats;
  } catch (error) {
    logError(error, CONTEXT, { action: 'getDatabaseStats' });
    return { error: error.message };
  }
};

/**
 * フラッシュカードの学習状態を更新する
 * @param {string} cardId - カードのID
 * @param {string} studyStatus - 新しい学習状態 ('unlearned' または 'learned')
 * @returns {Promise<void>}
 */
export const updateFlashcardStudyStatus = async (cardId, studyStatus) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARDS, 'readwrite');
    const store = transaction.objectStore(STORES.FLASHCARDS);
    
    // カードを取得
    const request = store.get(cardId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const card = event.target.result;
        if (!card) {
          reject(new Error(`カードが見つかりません: ${cardId}`));
          return;
        }
        
        // 更新情報を設定
        card.studyStatus = studyStatus;
        card.lastStudied = new Date().toISOString();
        
        // 更新したカードを保存
        const updateRequest = store.put(card);
        
        updateRequest.onsuccess = () => {
          resolve();
        };
        
        updateRequest.onerror = (e) => {
          reject(e.target.error);
        };
      };
      
      request.onerror = (e) => {
        reject(e.target.error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'updateFlashcardStudyStatus' });
    throw error;
  }
};

/**
 * すべてのフラッシュカードを取得する
 * @returns {Promise<Array>} フラッシュカードの配列
 */
export const getAllFlashcards = async () => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARDS, 'readonly');
    const store = transaction.objectStore(STORES.FLASHCARDS);

    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cards = event.target.result || [];
        resolve(cards);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'getAllFlashcards' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'getAllFlashcards' });
    throw error;
  }
};

/**
 * すべてのフラッシュカードジャンルを取得する
 * @returns {Promise<Array>} ジャンルの配列
 */
export const getAllFlashcardGenres = async () => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARD_GENRES, 'readonly');
    const store = transaction.objectStore(STORES.FLASHCARD_GENRES);

    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const genres = event.target.result || [];
        resolve(genres);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'getAllFlashcardGenres' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'getAllFlashcardGenres' });
    throw error;
  }
};

/**
 * すべてのフラッシュカードタグを取得する
 * @returns {Promise<Array>} タグの配列
 */
export const getAllFlashcardTags = async () => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARD_TAGS, 'readonly');
    const store = transaction.objectStore(STORES.FLASHCARD_TAGS);

    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const tags = event.target.result || [];
        resolve(tags);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'getAllFlashcardTags' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'getAllFlashcardTags' });
    throw error;
  }
};

/**
 * カード数のカウントを取得する
 * @returns {Promise<Object>} 各ステータスごとのカード数
 */
export const getFlashcardCounts = async () => {
  try {
    const cards = await getAllFlashcards();
    
    const counts = {
      total: cards.length,
      learned: cards.filter(card => card.studyStatus === 'learned').length,
      unlearned: cards.filter(card => card.studyStatus === 'unlearned' || !card.studyStatus).length,
      learning: cards.filter(card => card.studyStatus === 'learning').length
    };
    
    // ジャンルごとのカード数
    const genreCounts = {};
    cards.forEach(card => {
      const genres = card.genres || [];
      genres.forEach(genreId => {
        if (!genreCounts[genreId]) {
          genreCounts[genreId] = {
            total: 0,
            learned: 0,
            unlearned: 0,
            learning: 0
          };
        }
        
        genreCounts[genreId].total++;
        if (card.studyStatus === 'learned') {
          genreCounts[genreId].learned++;
        } else if (card.studyStatus === 'learning') {
          genreCounts[genreId].learning++;
        } else {
          genreCounts[genreId].unlearned++;
        }
      });
    });
    
    counts.byGenre = genreCounts;
    
    return counts;
  } catch (error) {
    logError(error, CONTEXT, { action: 'getFlashcardCounts' });
    return {
      total: 0,
      learned: 0,
      unlearned: 0,
      learning: 0,
      byGenre: {}
    };
  }
};

/**
 * 条件に基づいてフラッシュカードを検索する
 * @param {Object} options - 検索オプション
 * @param {string} [options.searchTerm] - 検索キーワード
 * @param {Array<string>} [options.genres] - ジャンルでフィルタリング
 * @param {Array<string>} [options.tags] - タグでフィルタリング
 * @param {string} [options.studyStatus] - 学習状態でフィルタリング
 * @param {string} [options.sortBy] - ソート項目
 * @param {boolean} [options.sortAsc] - 昇順/降順
 * @returns {Promise<Array>} フィルタリング・ソートされたカードの配列
 */
export const searchFlashcards = async (options = {}) => {
  try {
    const cards = await getAllFlashcards();
    
    // フィルタリング
    let filtered = [...cards];
    
    // 検索キーワードでフィルタリング
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.term?.toLowerCase().includes(term) || 
        card.definition?.toLowerCase().includes(term)
      );
    }
    
    // ジャンルでフィルタリング
    if (options.genres && options.genres.length > 0) {
      filtered = filtered.filter(card => {
        const cardGenres = card.genres || [];
        return options.genres.some(genre => cardGenres.includes(genre));
      });
    }
    
    // タグでフィルタリング
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(card => {
        const cardTags = card.tags || [];
        return options.tags.some(tag => cardTags.includes(tag));
      });
    }
    
    // 学習状態でフィルタリング
    if (options.studyStatus) {
      filtered = filtered.filter(card => card.studyStatus === options.studyStatus);
    }
    
    // ソート
    if (options.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortAsc ? 1 : -1;
      
      filtered.sort((a, b) => {
        // 日本語の場合は自然順でソート
        if (typeof a[sortField] === 'string' && 
            typeof b[sortField] === 'string' && 
            /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(a[sortField])) {
          return sortOrder * a[sortField].localeCompare(b[sortField], 'ja');
        }
        
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });
    }
    
    // ランダムソート
    if (options.random) {
      filtered.sort(() => Math.random() - 0.5);
    }
    
    return filtered;
  } catch (error) {
    logError(error, CONTEXT, { action: 'searchFlashcards' });
    throw error;
  }
};

/**
 * フラッシュカードを保存する
 * @param {Object} card - 保存するカード
 * @returns {Promise<string>} 保存されたカードのID
 */
export const saveFlashcard = async (card) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARDS, 'readwrite');
    const store = transaction.objectStore(STORES.FLASHCARDS);

    // 新しいカードの場合はIDを生成
    if (!card.id) {
      card.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      card.createdAt = new Date().toISOString();
    }

    // 更新日時を設定
    card.updatedAt = new Date().toISOString();
    
    // 学習状態が設定されていない場合は「未学習」をデフォルトに
    if (!card.studyStatus) {
      card.studyStatus = 'unlearned'; // 'unlearned' または 'learned'
    }

    const request = store.put(card);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(card.id);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'saveFlashcard' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'saveFlashcard' });
    throw error;
  }
};

/**
 * フラッシュカードを削除する
 * @param {string} cardId - 削除するカードのID
 * @returns {Promise<void>}
 */
export const deleteFlashcard = async (cardId) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARDS, 'readwrite');
    const store = transaction.objectStore(STORES.FLASHCARDS);

    const request = store.delete(cardId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'deleteFlashcard' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'deleteFlashcard' });
    throw error;
  }
};

/**
 * フラッシュカードジャンルを保存する
 * @param {Object} genre - 保存するジャンル
 * @returns {Promise<string>} 保存されたジャンルのID
 */
export const saveFlashcardGenre = async (genre) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARD_GENRES, 'readwrite');
    const store = transaction.objectStore(STORES.FLASHCARD_GENRES);

    // 新しいジャンルの場合はIDを生成
    if (!genre.id) {
      genre.id = `genre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      genre.createdAt = new Date().toISOString();
    }

    // 更新日時を設定
    genre.updatedAt = new Date().toISOString();
    
    const request = store.put(genre);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(genre.id);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'saveFlashcardGenre' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'saveFlashcardGenre' });
    throw error;
  }
};

/**
 * フラッシュカードタグを保存する
 * @param {Object} tag - 保存するタグ
 * @returns {Promise<string>} 保存されたタグのID
 */
export const saveFlashcardTag = async (tag) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORES.FLASHCARD_TAGS, 'readwrite');
    const store = transaction.objectStore(STORES.FLASHCARD_TAGS);

    // 新しいタグの場合はIDを生成
    if (!tag.id) {
      tag.id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      tag.createdAt = new Date().toISOString();
    }

    // 更新日時を設定
    tag.updatedAt = new Date().toISOString();
    
    const request = store.put(tag);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(tag.id);
      };
      
      request.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'saveFlashcardTag' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'saveFlashcardTag' });
    throw error;
  }
};

/**
 * フラッシュカードジャンルを削除する
 * @param {string} genreId - 削除するジャンルのID
 * @returns {Promise<void>}
 */
export const deleteFlashcardGenre = async (genreId) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.FLASHCARD_GENRES, STORES.FLASHCARDS], 'readwrite');
    const genreStore = transaction.objectStore(STORES.FLASHCARD_GENRES);
    const cardStore = transaction.objectStore(STORES.FLASHCARDS);

    // ジャンルを削除
    const deleteRequest = genreStore.delete(genreId);
    
    // このジャンルを持つすべてのカードを取得
    const cards = await getAllFlashcards();
    const cardsWithGenre = cards.filter(card => {
      const cardGenres = card.genres || [];
      return cardGenres.includes(genreId);
    });
    
    // カードからジャンルを削除
    const updatePromises = cardsWithGenre.map(card => {
      card.genres = (card.genres || []).filter(id => id !== genreId);
      card.updatedAt = new Date().toISOString();
      return cardStore.put(card);
    });
    
    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        Promise.all(updatePromises.map(req => new Promise(res => {
          req.onsuccess = res;
        }))).then(() => resolve());
      };
      
      deleteRequest.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'deleteFlashcardGenre' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'deleteFlashcardGenre' });
    throw error;
  }
};

/**
 * フラッシュカードタグを削除する
 * @param {string} tagId - 削除するタグのID
 * @returns {Promise<void>}
 */
export const deleteFlashcardTag = async (tagId) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.FLASHCARD_TAGS, STORES.FLASHCARDS], 'readwrite');
    const tagStore = transaction.objectStore(STORES.FLASHCARD_TAGS);
    const cardStore = transaction.objectStore(STORES.FLASHCARDS);

    // タグを削除
    const deleteRequest = tagStore.delete(tagId);
    
    // このタグを持つすべてのカードを取得
    const cards = await getAllFlashcards();
    const cardsWithTag = cards.filter(card => {
      const cardTags = card.tags || [];
      return cardTags.includes(tagId);
    });
    
    // カードからタグを削除
    const updatePromises = cardsWithTag.map(card => {
      card.tags = (card.tags || []).filter(id => id !== tagId);
      card.updatedAt = new Date().toISOString();
      return cardStore.put(card);
    });
    
    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        Promise.all(updatePromises.map(req => new Promise(res => {
          req.onsuccess = res;
        }))).then(() => resolve());
      };
      
      deleteRequest.onerror = (event) => {
        const error = event.target.error;
        logError(error, CONTEXT, { action: 'deleteFlashcardTag' });
        reject(error);
      };
      
      transaction.oncomplete = () => {
        // db.close(); // 接続を閉じない（キャッシュ再利用のため）
      };
    });
  } catch (error) {
    logError(error, CONTEXT, { action: 'deleteFlashcardTag' });
    throw error;
  }
};

/**
 * フラッシュカードのデータをJSON形式でエクスポートする
 * @returns {Promise<Object>} エクスポートされたデータ
 */
export const exportFlashcardData = async () => {
  try {
    const cards = await getAllFlashcards();
    const genres = await getAllFlashcardGenres();
    const tags = await getAllFlashcardTags();
    
    const exportData = {
      cards,
      genres,
      tags,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return exportData;
  } catch (error) {
    logError(error, CONTEXT, { action: 'exportFlashcardData' });
    throw error;
  }
};

/**
 * エクスポートされたデータからフラッシュカードデータをインポートする
 * @param {Object} importData - インポートするデータ
 * @param {boolean} clearExisting - 既存のデータをクリアするかどうか
 * @returns {Promise<Object>} インポート結果
 */
export const importFlashcardData = async (importData, clearExisting = false) => {
  try {
    if (!importData || !importData.cards) {
      throw new Error('インポートデータが不正です');
    }
    
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORES.FLASHCARDS, STORES.FLASHCARD_GENRES, STORES.FLASHCARD_TAGS],
      'readwrite'
    );
    
    const cardStore = transaction.objectStore(STORES.FLASHCARDS);
    const genreStore = transaction.objectStore(STORES.FLASHCARD_GENRES);
    const tagStore = transaction.objectStore(STORES.FLASHCARD_TAGS);
    
    // 既存データのクリア
    if (clearExisting) {
      await cardStore.clear();
      await genreStore.clear();
      await tagStore.clear();
    }
    
    // ジャンルのインポート
    const genreResults = [];
    if (importData.genres && Array.isArray(importData.genres)) {
      for (const genre of importData.genres) {
        const request = genreStore.put(genre);
        genreResults.push(new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(genre.id);
          request.onerror = (event) => reject(event.target.error);
        }));
      }
    }
    
    // タグのインポート
    const tagResults = [];
    if (importData.tags && Array.isArray(importData.tags)) {
      for (const tag of importData.tags) {
        const request = tagStore.put(tag);
        tagResults.push(new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(tag.id);
          request.onerror = (event) => reject(event.target.error);
        }));
      }
    }
    
    // カードのインポート
    const cardResults = [];
    for (const card of importData.cards) {
      const request = cardStore.put(card);
      cardResults.push(new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(card.id);
        request.onerror = (event) => reject(event.target.error);
      }));
    }
    
    // すべてのインポート操作の完了を待機
    const [genreIds, tagIds, cardIds] = await Promise.all([
      Promise.all(genreResults),
      Promise.all(tagResults),
      Promise.all(cardResults)
    ]);
    
    return {
      success: true,
      totalImported: {
        cards: cardIds.length,
        genres: genreIds.length,
        tags: tagIds.length
      }
    };
  } catch (error) {
    logError(error, CONTEXT, { action: 'importFlashcardData' });
    throw error;
  }
}; 
