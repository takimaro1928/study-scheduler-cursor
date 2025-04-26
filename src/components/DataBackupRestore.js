import React, { useState } from 'react';
import { getDatabaseStats } from '../utils/indexedDB';
import { Save, UploadCloud, Database, AlertCircle, Check } from 'lucide-react';

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
    <div className="rounded-lg shadow-lg bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
        <h2 className="text-lg font-bold flex items-center">
          <Database className="mr-2 h-5 w-5" /> データバックアップと復元
        </h2>
      </div>
      
      {/* データベース統計情報 */}
      {stats && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Database className="mr-2 h-4 w-4 text-blue-500" /> データベース状態
          </h3>
          
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
            <div>
              <div className="text-sm font-medium text-gray-800">
                合計エントリ数: <span className="text-blue-600">{stats.totalEntries}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 mt-2">
                {stats.stores && Object.entries(stats.stores).map(([store, info]) => (
                  <div key={store} className="text-xs text-gray-600 flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-400 mr-1.5"></span>
                    <span className="font-medium">{store}:</span> {info.entries}件
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {/* バックアップセクション */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Save className="mr-2 h-4 w-4 text-blue-500" /> バックアップ作成
          </h3>
          
          <p className="text-xs text-gray-600 mb-3">
            現在の学習データと解答履歴を全てバックアップします。データは端末にダウンロードされます。
          </p>
          
          <div className="flex items-center">
            <button 
              onClick={handleBackup}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out"
            >
              <Save className="mr-2 h-4 w-4" />
              バックアップ作成
            </button>
            
            {backupStatus && (
              <div className={`ml-3 flex items-center ${
                backupStatus === '完了' 
                  ? 'text-green-600 bg-green-50 px-3 py-1 rounded-full' 
                  : 'text-gray-600'
              }`}>
                {backupStatus === '完了' ? (
                  <><Check className="h-4 w-4 mr-1" /> {backupStatus}</>
                ) : (
                  backupStatus
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 復元セクション */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <UploadCloud className="mr-2 h-4 w-4 text-indigo-500" /> データ復元
          </h3>
          
          <p className="text-xs text-gray-600 mb-3">
            バックアップファイルからデータを復元します。現在のデータは上書きされます。
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                id="restore-file-input"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-100 file:text-indigo-700
                  hover:file:bg-indigo-200
                  cursor-pointer"
              />
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleRestore}
                disabled={!restoreFile}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                  restoreFile
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                復元実行
              </button>
              
              {restoreStatus && (
                <div className={`ml-3 flex items-center text-sm ${
                  restoreStatus === '復元完了' 
                    ? 'text-green-600 bg-green-50 px-3 py-1 rounded-full' 
                    : restoreStatus.includes('エラー') 
                      ? 'text-red-600 bg-red-50 px-3 py-1 rounded-full' 
                      : 'text-gray-600'
                }`}>
                  {restoreStatus === '復元完了' ? (
                    <><Check className="h-4 w-4 mr-1" /> {restoreStatus}</>
                  ) : restoreStatus.includes('エラー') ? (
                    <><AlertCircle className="h-4 w-4 mr-1" /> {restoreStatus}</>
                  ) : (
                    restoreStatus
                  )}
                </div>
              )}
            </div>
            
            {!restoreStatus && (
              <p className="text-xs text-red-500 flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                復元を実行すると現在のデータは上書きされます
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackupRestore; 
