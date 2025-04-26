import React from 'react';
import { RefreshCw, AlertTriangle, Terminal } from 'lucide-react';
import { logError, showErrorRecoveryUI } from '../utils/error-logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false // 詳細表示の切り替え用
    };
  }

  static getDerivedStateFromError(error) {
    // エラー発生時に状態を更新
    // ErrorBoundaryによるエラーキャッチを記録
    window.__errorBoundaryCaught = true;
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // エラー情報をログに記録
    console.error("アプリケーションエラー:", error);
    console.error("コンポーネントスタック:", errorInfo.componentStack);
    
    this.setState({
      errorInfo: errorInfo
    });
    
    // エラーロガーを使用して構造化ログを記録
    logError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      component: this.props.name || 'Unknown'
    });
    
    // エラータイプに基づいたカスタム処理
    this.handleSpecificErrors(error);
  }
  
  // 特定のエラータイプに対する特別な処理
  handleSpecificErrors(error) {
    // ストレージ関連エラーの特別処理
    if (error && (
      error.name === 'QuotaExceededError' || 
      (error.message && (
        error.message.includes('quota') || 
        error.message.includes('storage') ||
        error.message.includes('indexedDB')
      ))
    )) {
      // データストレージ関連のエラーの場合、リセットオプションを表示
      this.setState({ isStorageError: true });
    }
  }

  handleReload = () => {
    // ページをリロード
    window.location.reload();
  }
  
  handleReset = () => {
    if (window.confirm('本当にデータをリセットしますか？この操作は元に戻せません。')) {
      try {
        localStorage.clear();
        // IndexedDBの削除はブラウザAPIを直接使用
        if (window.indexedDB) {
          window.indexedDB.deleteDatabase('studySchedulerDB');
        }
        window.location.reload();
      } catch (err) {
        console.error('データリセット中にエラーが発生しました:', err);
        alert('データリセット中にエラーが発生しました。ページをリロードします。');
        window.location.reload();
      }
    }
  }
  
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  }

  render() {
    // エラーが発生した場合はフォールバックUIを表示
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, isStorageError } = this.state;
      
      return (
        <div style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '36rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#ef4444',
            fontSize: '3rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={48} />
          </div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            {isStorageError 
              ? 'ストレージエラーが発生しました'
              : 'エラーが発生しました'}
          </h2>
          <p style={{
            color: '#4b5563',
            marginBottom: '1.5rem'
          }}>
            {isStorageError 
              ? 'ブラウザのストレージ容量が不足しているか、アクセスできません。不要なデータを削除するか、ブラウザの設定を確認してください。'
              : '申し訳ありません、予期せぬエラーが発生しました。ページを再読み込みすることで解決する場合があります。'}
          </p>
          
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <button 
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <RefreshCw size={18} />
              ページを再読み込み
            </button>
            
            {isStorageError && (
              <button 
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                データをリセット
              </button>
            )}
          </div>
          
          {/* 詳細表示トグルボタン */}
          <button
            onClick={this.toggleDetails}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              backgroundColor: 'transparent',
              color: '#6b7280',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Terminal size={16} />
            {showDetails ? 'エラー詳細を隠す' : 'エラー詳細を表示'}
          </button>
          
          {/* エラーの詳細情報を表示 */}
          {showDetails && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '0.875rem',
              color: '#4b5563'
            }}>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>エラー詳細:</p>
              <p style={{ color: '#ef4444' }}>{error && error.toString()}</p>
              {errorInfo && (
                <pre style={{ 
                  marginTop: '1rem',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem'
                }}>
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    // エラーがなければ子コンポーネントを通常通り表示
    return this.props.children;
  }
}

export default ErrorBoundary; 
