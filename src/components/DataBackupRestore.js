import React, { useState, useEffect, useRef } from 'react';
import { getDatabaseStats, getAllDataCount } from '../utils/indexedDB';
import { Save, UploadCloud, Database, AlertCircle, Check, Download, Upload, Info } from 'lucide-react';
import styles from '../SettingsPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faCheck, faExclamationTriangle, faSpinner, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../utils/dateUtils';

const DataBackupRestore = ({ onBackup, onRestore, loadDBStats, userData, userSettings, executeBackup, loadFromFile, getLastExportDate, formatLastExportDate }) => {
  const [backupStatus, setBackupStatus] = useState(null);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [dataCounts, setDataCounts] = useState({ studyData: 0, answerHistory: 0, userSettings: 0, flashcards: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastExportedDate, setLastExportedDate] = useState(null);

  // データベース統計情報を取得
  const loadStats = async () => {
    try {
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
    } catch (error) {
      console.error('データベース情報の取得に失敗しました:', error);
    }
  };

  // コンポーネントマウント時に統計情報を読み込む
  useEffect(() => {
    loadStats();
    updateDataCount();
    const storedDate = localStorage.getItem('lastExportDate');
    if (storedDate) {
      setLastExportedDate(new Date(storedDate));
    }
  }, []);

  const updateDataCount = async () => {
    try {
      const counts = await getAllDataCount();
      setDataCounts(counts);
    } catch (error) {
      console.error('Error getting data counts:', error);
    }
  };

  // バックアップを実行
  const handleBackup = async () => {
    try {
      setBackupStatus('processing');
      await onBackup();
      setBackupStatus('success');
      
      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        setBackupStatus(null);
      }, 5000);
    } catch (error) {
      console.error('バックアップに失敗しました:', error);
      setBackupStatus('error');
    }
  };

  // 復元ファイル選択
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setRestoreStatus(null);
    }
  };

  // 復元を実行
  const handleRestore = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setRestoreStatus('processing');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // データの検証
          if (!data.subjects || !Array.isArray(data.subjects)) {
            throw new Error('無効なバックアップファイルです');
          }

          // 復元実行
          await onRestore(data);
          setRestoreStatus('success');
          
          // ステータスリセット
          setTimeout(() => {
            setRestoreStatus(null);
            setSelectedFile(null);
            // ファイル入力をリセット
            if (fileInputRef.current) fileInputRef.current.value = '';
            // 統計情報を更新
            loadStats();
          }, 5000);
        } catch (error) {
          console.error('データ復元中にエラーが発生しました:', error);
          setRestoreStatus('error');
        }
      };

      reader.onerror = () => {
        setRestoreStatus('error');
      };

      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('復元処理中にエラーが発生しました:', error);
      setRestoreStatus('error');
    }
  };

  const handleRestoreClick = () => {
    if (selectedFile) {
      handleRestore();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setErrorMessage('');

    try {
      const exportData = {
        studyData: await exportStore('studyData'),
        answerHistory: await exportStore('answerHistory'),
        userSettings: await exportStore('userSettings'),
        flashcards: await exportStore('flashcards'),
        flashcardGenres: await exportStore('flashcardGenres'),
        flashcardTags: await exportStore('flashcardTags'),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const now = new Date();
      const dateStr = formatDate(now, 'yyyyMMdd_HHmmss');
      
      link.href = url;
      link.download = `study_scheduler_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      localStorage.setItem('lastExportDate', now.toISOString());
      setLastExportedDate(now);
      setExportSuccess(true);
      
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
      
      await updateDataCount();
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('エクスポート中にエラーが発生しました: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportStore = (storeName) => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('StudySchedulerDB');
      
      openRequest.onerror = () => reject(new Error(`Failed to open database: ${openRequest.error}`));
      
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(new Error(`Failed to get ${storeName} data: ${request.error}`));
        
        request.onsuccess = () => resolve(request.result);
      };
    });
  };

  const importStore = (storeName, data) => {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('StudySchedulerDB');
      
      openRequest.onerror = () => reject(new Error(`Failed to open database: ${openRequest.error}`));
      
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // 既存のデータを削除
        const clearRequest = store.clear();
        
        clearRequest.onerror = () => reject(new Error(`Failed to clear ${storeName}: ${clearRequest.error}`));
        
        clearRequest.onsuccess = () => {
          // 新しいデータを追加
          let completed = 0;
          let errors = 0;
          
          if (data.length === 0) {
            resolve();
            return;
          }
          
          data.forEach((item) => {
            const addRequest = store.add(item);
            
            addRequest.onerror = () => {
              console.error(`Failed to add item to ${storeName}:`, addRequest.error);
              errors++;
              if (completed + errors === data.length) {
                if (errors > 0) {
                  reject(new Error(`${errors} errors occurred while importing ${storeName}`));
                } else {
                  resolve();
                }
              }
            };
            
            addRequest.onsuccess = () => {
              completed++;
              if (completed + errors === data.length) {
                resolve();
              }
            };
          });
        };
      };
    });
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      
      reader.readAsText(file);
    });
  };

  return (
    <div>
      {/* データ統計情報表示 */}
      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.statsItem}>
            <span className={styles.statsLabel}>合計エントリ数</span>
            <span className={styles.statsValue}>{stats.totalEntries}</span>
          </div>
          {stats.stores && Object.entries(stats.stores).map(([store, info]) => (
            <div key={store} className={styles.statsItem}>
              <span className={styles.statsLabel}>{store}</span>
              <span className={styles.statsValue}>{info.entries}件</span>
            </div>
          ))}
        </div>
      )}
      
      <p className={styles.settingsDescription}>
        アプリのデータをファイルに保存/復元できます。定期的なバックアップをお勧めします。
      </p>
      
      {getLastExportDate && (
        <p className={styles.lastExportDate}>
          <FontAwesomeIcon icon={faDatabase} className="mr-1" />
          前回のバックアップ：{formatLastExportDate(getLastExportDate())}
        </p>
      )}
      
      <div className={styles.actionGroup}>
        {/* バックアップボタン */}
        <button 
          className={styles.exportButton} 
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin />
              バックアップ中...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              データをバックアップ
            </>
          )}
        </button>
        
        {/* 復元セクション */}
        <div className={styles.fileInputWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className={styles.fileInput}
            accept=".json"
            id="restore-file"
          />
          
          <label htmlFor="restore-file" className={styles.fileInputLabel}>
            {selectedFile ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-1" /> 
                {selectedFile.name}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUpload} className="mr-1" /> 
                バックアップファイルを選択
              </>
            )}
          </label>
          
          <button 
            className={`${styles.importButton} ${!selectedFile ? styles.importButtonDisabled : ''}`} 
            onClick={handleRestoreClick}
            disabled={restoreStatus === 'processing'}
          >
            {restoreStatus === 'processing' ? (
              <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
            ) : (
              <FontAwesomeIcon icon={selectedFile ? faDatabase : faUpload} className="mr-1" />
            )}
            {selectedFile 
              ? (restoreStatus === 'processing' 
                  ? '復元中...' 
                  : restoreStatus === 'success' 
                    ? '復元完了' 
                    : restoreStatus === 'error' 
                      ? '復元失敗' 
                      : '復元実行') 
              : '選択して復元'}
          </button>
        </div>
      </div>
      
      {/* 状態メッセージ */}
      {restoreStatus === 'error' && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} className={styles.errorIcon} />
          <p>復元に失敗しました。ファイル形式が正しくないか、データが破損している可能性があります。</p>
        </div>
      )}
      
      {restoreStatus === 'success' && (
        <div className={styles.successMessage}>
          <Check size={16} className={styles.successIcon} />
          <p>データの復元が完了しました。</p>
        </div>
      )}
      
      {backupStatus === 'error' && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} className={styles.errorIcon} />
          <p>バックアップの作成に失敗しました。</p>
        </div>
      )}
      
      {exportSuccess && (
        <div className={styles.successMessage}>
          <Check size={16} className={styles.successIcon} />
          <p>データのバックアップが完了しました</p>
        </div>
      )}
      
      {errorMessage && (
        <div className={styles.errorMessage}>
          <AlertCircle className={styles.errorIcon} size={18} />
          <div>{errorMessage}</div>
        </div>
      )}
    </div>
  );
};

export default DataBackupRestore; 
