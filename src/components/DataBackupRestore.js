import React, { useState } from 'react';
import { getDatabaseStats } from '../utils/indexedDB';

const DataBackupRestore = ({ onBackup, onRestore }) => {
  const [backupStatus, setBackupStatus] = useState(null);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);

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
  React.useEffect(() => {
    loadStats();
  }, []);

  // バックアップを実行
  const handleBackup = async () => {
    try {
      setBackupStatus('実行中...');
      await onBackup();
      setBackupStatus('完了');
      
      // 成功メッセージを5秒後に消す
      setTimeout(() => {
        setBackupStatus(null);
      }, 5000);
    } catch (error) {
      console.error('バックアップに失敗しました:', error);
      setBackupStatus('失敗: ' + error.message);
    }
  };

  // 復元ファイル選択
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRestoreFile(file);
      setRestoreStatus(null);
    }
  };

  // 復元を実行
  const handleRestore = async () => {
    if (!restoreFile) {
      setRestoreStatus('ファイルを選択してください');
      return;
    }

    try {
      setRestoreStatus('読み込み中...');
      
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
          setRestoreStatus('復元完了');
          
          // ステータスリセット
          setTimeout(() => {
            setRestoreStatus(null);
            setRestoreFile(null);
            // ファイル入力をリセット
            document.getElementById('restore-file-input').value = '';
            // 統計情報を更新
            loadStats();
          }, 5000);
        } catch (error) {
          console.error('データ復元中にエラーが発生しました:', error);
          setRestoreStatus('エラー: ' + error.message);
        }
      };

      reader.onerror = () => {
        setRestoreStatus('ファイル読み込みエラー');
      };

      reader.readAsText(restoreFile);
    } catch (error) {
      console.error('復元処理中にエラーが発生しました:', error);
      setRestoreStatus('エラー: ' + error.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-4">データバックアップと復元</h2>
      
      {/* データベース統計情報 */}
      {stats && (
        <div className="mb-4 p-2 bg-gray-50 rounded">
          <h3 className="font-medium text-sm mb-1">データベース状態</h3>
          <p className="text-xs text-gray-700">
            合計エントリ数: {stats.totalEntries}
          </p>
          <div className="text-xs text-gray-600 mt-1">
            {Object.entries(stats.stores).map(([store, info]) => (
              <div key={store}>
                {store}: {info.entries}件
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* バックアップセクション */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button 
            onClick={handleBackup}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            バックアップ作成
          </button>
          {backupStatus && (
            <span className={`ml-3 text-sm ${backupStatus === '完了' ? 'text-green-600' : 'text-gray-600'}`}>
              {backupStatus}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          現在の学習データと解答履歴を全てバックアップします。
        </p>
      </div>
      
      {/* 復元セクション */}
      <div>
        <h3 className="font-medium text-sm mb-2">データ復元</h3>
        <div className="flex flex-col gap-2">
          <div>
            <input
              id="restore-file-input"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="text-xs"
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={handleRestore}
              disabled={!restoreFile}
              className={`text-sm px-3 py-1 rounded ${
                restoreFile
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              復元実行
            </button>
            {restoreStatus && (
              <span className={`ml-3 text-sm ${
                restoreStatus === '復元完了' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {restoreStatus}
              </span>
            )}
          </div>
          <p className="text-xs text-red-500 mt-1">
            ※復元を実行すると現在のデータは上書きされます
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataBackupRestore; 
