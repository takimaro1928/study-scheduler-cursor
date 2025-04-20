// src/SettingsPage.js
import React, { useState, useRef } from 'react';
import { 
  Settings, Trash2, AlertTriangle, RefreshCw, 
  Download, Upload, Check, X, Database
} from 'lucide-react';
import DataBackupRestore from './components/DataBackupRestore';
import styles from './SettingsPage.module.css';

const SettingsPage = ({ 
  onResetAllData,
  onResetAnswerStatusOnly,
  onImport,
  onExport,
  onBackup,
  onRestore,
  exportTimestamp,
  formatDate,
  totalQuestionCount = 0
}) => {
  // リセットボタンのハンドラ
  const handleResetClick = () => {
    onResetAllData();
  };

  // 回答状況のみリセットボタンのハンドラ
  const handleResetAnswerStatusOnly = () => {
    onResetAnswerStatusOnly();
  };

  // 新規: インポート関連の状態
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null); // ファイル入力要素の参照

  // ファイル選択時のハンドラ
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImportFile(file);
    setImportError(''); // エラーをクリア
    setImportSuccess(false); // 成功状態をリセット
  };

  // インポート実行のハンドラ
  const handleImportData = () => {
    // ファイルが選択されていない場合
    if (!importFile) {
      setImportError('ファイルを選択してください');
      return;
    }
    
    // ファイルサイズチェック (10MB上限とする)
    if (importFile.size > 10 * 1024 * 1024) {
      setImportError('ファイルサイズが大きすぎます（上限: 10MB）');
      return;
    }
    
    // FileReaderでファイルを読み込む
    const reader = new FileReader();
    
    // 読み込み完了時の処理
    reader.onload = (e) => {
      try {
        // JSON文字列をパース
        const importedData = JSON.parse(e.target.result);
        
        // 最低限の検証
        if (!importedData.subjects) {
          setImportError('無効なファイル形式です。正しい学習データファイルを選択してください。');
          return;
        }
        
        // インポート前の確認
        const confirmed = window.confirm(
          "データをインポートすると、現在のデータは上書きされます。続行しますか？"
        );
        
        if (!confirmed) {
          console.log("インポートがキャンセルされました");
          return;
        }
        
        // App.jsの関数にデータを渡す
        const success = onImport(importedData);
        
        if (success) {
          // インポート成功
          setImportSuccess(true);
          setImportFile(null);
          
          // ファイル入力をリセット
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          // インポート失敗
          setImportError('データのインポートに失敗しました。ファイル形式を確認してください。');
        }
      } catch (error) {
        console.error("インポート解析エラー:", error);
        setImportError('ファイルの解析に失敗しました。有効なJSONファイルか確認してください。');
      }
    };
    
    // 読み込みエラー時の処理
    reader.onerror = () => {
      setImportError('ファイルの読み込みに失敗しました。');
    };
    
    // ファイル読み込み開始
    reader.readAsText(importFile);
  };

  // 最終エクスポート日の表示フォーマット
  const getLastExportDate = () => {
    if (!exportTimestamp) return "なし";
    try {
      const date = new Date(parseInt(exportTimestamp, 10));
      if (isNaN(date.getTime())) return "無効な日付";
      return formatDate(date);
    } catch (e) {
      console.error("日付変換エラー:", e);
      return "エラー";
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <Settings size={20} className={styles.titleIcon} /> 設定
      </h2>

      {/* データ状態セクション */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>学習データ状態</h3>
        <div className={styles.statsContainer}>
          <div className={styles.statsItem}>
            <span className={styles.statsLabel}>総問題数</span>
            <span className={styles.statsValue}>{totalQuestionCount}問</span>
          </div>
          <div className={styles.statsItem}>
            <span className={styles.statsLabel}>最終エクスポート</span>
            <span className={styles.statsValue}>{getLastExportDate()}</span>
          </div>
        </div>
      </div>

      {/* バックアップと復元セクション */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Database size={18} className="mr-2" /> バックアップと復元
        </h3>
        <div className={styles.backupContainer}>
          <DataBackupRestore 
            onBackup={onBackup} 
            onRestore={onRestore}
          />
        </div>
      </div>

      {/* データエクスポート/インポートセクション */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>データエクスポート/インポート</h3>
        
        {/* エクスポート部分 */}
        <div className={styles.dataOption}>
          <div>
            <h4 className={styles.dataOptionTitle}>データエクスポート</h4>
            <p className={styles.description}>
              現在の学習データと解答履歴をJSONファイルとしてダウンロードします。
              バックアップとして保存したり、他のデバイスに移行する際に使用できます。
            </p>
          </div>
          <button onClick={onExport} className={styles.exportButton}>
            <Download size={16} /> データをエクスポート
          </button>
        </div>
        
        <hr className={styles.divider} />
        
        {/* インポート部分 */}
        <div className={styles.dataOption}>
          <div>
            <h4 className={styles.dataOptionTitle}>データインポート</h4>
            <p className={styles.description}>
              エクスポートしたデータファイルをアップロードして復元します。
              現在のデータは上書きされますのでご注意ください。
            </p>
            
            <div className={styles.importControls}>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              
              <button 
                onClick={handleImportData}
                disabled={!importFile}
                className={`${styles.importButton} ${!importFile ? styles.importButtonDisabled : ''}`}
              >
                <Upload size={16} /> インポートを実行
              </button>
            </div>
            
            {importError && (
              <div className={styles.importError}>
                <X size={16} className={styles.errorIcon} />
                {importError}
              </div>
            )}
            
            {importSuccess && (
              <div className={styles.importSuccess}>
                <Check size={16} className={styles.successIcon} />
                データのインポートに成功しました！
              </div>
            )}
          </div>
        </div>
      </div>

      {/* データリセットセクション */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>データリセット</h3>
        
        <div className={styles.dataOption}>
          <div>
            <h4 className={styles.dataOptionTitle}>
              <AlertTriangle size={16} className={styles.warningIcon} />
              回答状況のみリセット
            </h4>
            <p className={styles.description}>
              問題リストを維持したまま、回答状況（理解度・正解率・次回解答日）のみをリセットします。
              問題自体は削除されません。
            </p>
          </div>
          <button onClick={handleResetAnswerStatusOnly} className={styles.warningButton}>
            <RefreshCw size={16} /> 回答状況をリセット
          </button>
        </div>
        
        <hr className={styles.divider} />
        
        <div className={styles.dataOption}>
          <div>
            <h4 className={styles.dataOptionTitle}>
              <AlertTriangle size={16} className={styles.dangerIcon} />
              全データリセット
            </h4>
            <p className={styles.description}>
              すべての学習データ（科目・問題・解答履歴）を完全に削除し、初期状態に戻します。
              この操作は元に戻せません。
            </p>
          </div>
          <button onClick={handleResetClick} className={styles.dangerButton}>
            <Trash2 size={16} /> すべてのデータを削除
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
