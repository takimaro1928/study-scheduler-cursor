import React from 'react';
import useFormValidation from '../hooks/useFormValidation';
import { useNotification } from '../contexts/NotificationContext';
import { validateRequired, validateNumber, validateMin, validateMax } from '../utils/validation';
import styles from './EnhancedForm.module.css';

// 入力フィールドコンポーネント
const FormField = ({ label, name, type = 'text', value, onChange, onBlur, error, touched }) => {
  const showError = touched && error;
  
  return (
    <div className={styles['form-field']}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        className={showError ? styles.error : ''}
      />
      {showError && <div className={styles['error-message']}>{error}</div>}
    </div>
  );
};

/**
 * 強化されたフォームコンポーネント例
 * バリデーションと通知機能を備えたフォーム
 */
const EnhancedForm = ({ onSubmitSuccess }) => {
  const { showSuccess, showError } = useNotification();

  // 初期値の設定
  const initialValues = {
    name: '',
    email: '',
    age: '',
    message: ''
  };

  // バリデーションルールの定義
  const validationRules = {
    name: [(value) => validateRequired(value, '名前')],
    email: [(value) => validateRequired(value, 'メールアドレス')],
    age: [
      (value) => validateNumber(value, '年齢'),
      (value) => validateMin(value, 18, '年齢'),
      (value) => validateMax(value, 120, '年齢')
    ],
    message: [(value) => validateRequired(value, 'メッセージ')]
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (values) => {
    try {
      // APIリクエストなどの非同期処理をここに記述
      console.log('送信されたデータ:', values);
      
      // 送信成功
      showSuccess('フォームが正常に送信されました！');
      
      if (onSubmitSuccess) {
        onSubmitSuccess(values);
      }
      
      // フォームをリセット
      resetForm();
    } catch (error) {
      console.error('送信エラー:', error);
      showError('フォームの送信中にエラーが発生しました。もう一度お試しください。');
      throw error; // フックでキャッチできるようにエラーを再スロー
    }
  };

  // バリデーションフックの使用
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit: submitForm,
    resetForm
  } = useFormValidation(initialValues, validationRules, handleSubmit);

  return (
    <form onSubmit={submitForm} className={styles['enhanced-form']}>
      <h2>お問い合わせフォーム</h2>
      
      <FormField
        label="名前"
        name="name"
        value={values.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
      />
      
      <FormField
        label="メールアドレス"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
      />
      
      <FormField
        label="年齢"
        name="age"
        type="number"
        value={values.age}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.age}
        touched={touched.age}
      />
      
      <div className={styles['form-field']}>
        <label htmlFor="message">メッセージ</label>
        <textarea
          id="message"
          name="message"
          value={values.message || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={touched.message && errors.message ? styles.error : ''}
        />
        {touched.message && errors.message && (
          <div className={styles['error-message']}>{errors.message}</div>
        )}
      </div>
      
      <div className={styles['form-actions']}>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={styles['submit-button']}
        >
          {isSubmitting ? '送信中...' : '送信する'}
        </button>
        
        <button
          type="button"
          onClick={() => resetForm()}
          className={styles['reset-button']}
        >
          リセット
        </button>
      </div>
      
      {!isValid && Object.keys(touched).length > 0 && (
        <div className={styles['form-error-summary']}>
          フォームに入力エラーがあります。修正してください。
        </div>
      )}
    </form>
  );
};

export default EnhancedForm; 
