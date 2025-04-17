// src/SettingsPage.js
import React, { useState, useRef } from 'react';
import { 
  Settings, Trash2, AlertTriangle, RefreshCw, 
  Download, Upload, Check, X
} from 'lucide-react';
import styles from './SettingsPage.module.css';

const SettingsPage = ({ 
  onResetData, 
  onResetAnswerStatusOnly,
  onDataImport,       // 新規: インポート関数
  subjects = [],      // 新規: エクスポート用の科目データ
  answerHistory = []  // 新規: エクスポート用の解答履歴
}) => {
  // リセットボタンのハンドラはそのまま
  const handleResetClick = () => {
    // 既存のコード
    const confirmReset = window.confirm(
      "本当にすべての学習データ（解答履歴含む）をリセットしますか？\nこの操作は元に戻せません。"
    );
    
    if (confirmReset) {
      console.log("データリセットを実行します。");
      onResetData();
    } else {
      console.log("データリセットはキャンセルされました。");
    }
  };

  // 回答状況のみリセットボタンのハンドラ
  const handleResetAnswerStatusOnly = () => {
    console.log("回答状況のみリセットを実行します。");
    onResetAnswerStatusOnly();
  };

  // 新規: インポート関連の状態
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null); // ファイル入力要素の参照

  // エクスポート機能のハンドラ
  const handleExportData = () => {
    try {
      // エクスポートするデータの準備
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0", // アプリのバージョン（任意）
        subjects: subjects,
        answerHistory: answerHistory
      };
      
      // JSONに変換
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Blobオブジェクトを作成
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // ファイル名設定（日付を含む）
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `study-scheduler-data-${dateStr}.json`;
      
      // ダウンロードを実行
      document.body.appendChild(link);
      link.click();
      
      // 後片付け
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log("データエクスポート完了");
    } catch (error) {
      console.error("エクスポート処理中にエラー:", error);
      alert("エクスポート中にエラーが発生しました。");
    }
  };

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
        const success = onDataImport(importedData);
        
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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <Settings size={20} className={styles.titleIcon} /> 設定
      </h2>

      {/* データエクスポート/インポートセクション (新規追加) */}
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
          <button onClick={handleExportData} className={styles.exportButton}>
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
                accept=".json"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              
              <button 
                onClick={handleImportData} 
                disabled={!importFile}
                className={`${styles.importButton} ${!importFile ? styles.importButtonDisabled : ''}`}
              >
                <Upload size={16} /> データをインポート
              </button>
            </div>
            
            {importError && (
              <div className={styles.errorMessage}>
                <X size={16} style={{ marginRight: '0.5rem' }} />
                {importError}
              </div>
            )}
            
            {importSuccess && (
              <div className={styles.successMessage}>
                <Check size={16} style={{ marginRight: '0.5rem' }} />
                データを正常にインポートしました！
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* 既存のデータ管理セクション */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>データ管理</h3>
        
        {/* 回答状況のみリセットボタン */}
        <div className={styles.resetOption}>
          <div>
            <h4 className={styles.resetOptionTitle}>回答状況のみリセット</h4>
            <p className={styles.description}>
              問題リストを維持したまま、解答回数、正解率、理解度、日付などの回答状況のみをリセットします。
              コメントは削除されません。
            </p>
          </div>
          <button onClick={handleResetAnswerStatusOnly} className={`${styles.resetButton} ${styles.resetAnswerButton}`}>
            <RefreshCw size={16} /> 回答状況をリセット
          </button>
        </div>
        
        <hr className={styles.divider} />
        
        {/* 完全リセットボタン */}
        <div className={styles.resetOption}>
          <div>
            <h4 className={styles.resetOptionTitle}>完全リセット</h4>
            <p className={styles.description}>
              学習データ（各問題の解答回数、日付、理解度など）と解答履歴をすべて削除し、
              アプリケーションを初期状態（全問題が「未学習」の状態）に戻します。
            </p>
          </div>
          <button onClick={handleResetClick} className={styles.resetButton}>
            <AlertTriangle size={16} /> 学習データを完全リセット
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
