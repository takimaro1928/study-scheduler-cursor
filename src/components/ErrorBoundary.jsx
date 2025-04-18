import React, { Component } from 'react';

/**
 * エラーバウンダリコンポーネント
 * アプリケーション内のJavaScriptエラーをキャッチし、フォールバックUIを表示します
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * 子コンポーネントでエラーが発生した時に呼び出される
   * 次のレンダリングでフォールバックUIを表示するために状態を更新
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * エラー情報をキャッチして保存
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // エラーを記録（本番環境ではエラー追跡サービスに送信するなど）
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  /**
   * アプリケーションをリセット
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * ページをリロード
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    // エラーが発生した場合はフォールバックUIを表示
    if (this.state.hasError) {
      const errorStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box'
      };
      
      const errorContainerStyle = {
        maxWidth: '600px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        textAlign: 'center'
      };
      
      const headingStyle = {
        fontSize: '1.8rem',
        marginBottom: '16px',
        color: '#e74c3c'
      };
      
      const paragraphStyle = {
        fontSize: '1rem',
        marginBottom: '20px',
        color: '#333'
      };
      
      const detailsStyle = {
        margin: '20px 0',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        textAlign: 'left'
      };
      
      const actionsStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '24px'
      };
      
      const buttonStyle = {
        padding: '10px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        border: 'none',
        fontWeight: '500',
        fontSize: '1rem'
      };
      
      const resetButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#f1f1f1',
        color: '#333'
      };
      
      const reloadButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#3498db',
        color: 'white'
      };

      return (
        <div style={errorStyle} className="error-boundary">
          <div style={errorContainerStyle} className="error-container">
            <h2 style={headingStyle}>エラーが発生しました</h2>
            <p style={paragraphStyle}>申し訳ありません。予期しないエラーが発生しました。</p>
            
            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={detailsStyle}>
                <summary>エラー詳細</summary>
                <p style={{ margin: '10px 0' }}>{this.state.error.toString()}</p>
                <p style={{ margin: '10px 0' }}>コンポーネントスタック:</p>
                <pre style={{ overflowX: 'auto', padding: '8px', backgroundColor: '#eee', borderRadius: '4px' }}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={actionsStyle} className="error-actions">
              <button onClick={this.handleReset} style={resetButtonStyle} className="reset-button">
                エラーをリセット
              </button>
              <button onClick={this.handleReload} style={reloadButtonStyle} className="reload-button">
                ページをリロード
              </button>
            </div>
          </div>
        </div>
      );
    }

    // エラーがなければ子コンポーネントを表示
    return this.props.children;
  }
}

export default ErrorBoundary; 
