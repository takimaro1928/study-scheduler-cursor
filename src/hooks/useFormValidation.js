import { useState, useCallback, useEffect } from 'react';
import notificationService from '../services/notification';
import { validateForm } from '../utils/validation';

/**
 * フォームバリデーション用カスタムフック
 * 
 * @param {Object} initialValues - フォームの初期値
 * @param {Object} validationRules - バリデーションルール
 * @param {Function} onSubmit - 送信時のコールバック関数
 * @returns {Object} フォーム操作用のオブジェクト
 */
const useFormValidation = (initialValues = {}, validationRules = {}, onSubmit = () => {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // フォームの値変更ハンドラ
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: fieldValue
    }));
    
    // フィールドがタッチされたことを記録
    if (!touched[name]) {
      setTouched(prevTouched => ({
        ...prevTouched,
        [name]: true
      }));
    }
  }, [touched]);

  // 直接値を設定するメソッド
  const setValue = useCallback((name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // フィールドがタッチされたことを記録
    if (!touched[name]) {
      setTouched(prevTouched => ({
        ...prevTouched,
        [name]: true
      }));
    }
  }, [touched]);

  // フォームの複数値を一度に設定
  const setMultipleValues = useCallback((newValues) => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues
    }));
    
    // タッチされたフィールドを更新
    const newTouched = { ...touched };
    Object.keys(newValues).forEach(key => {
      newTouched[key] = true;
    });
    
    setTouched(newTouched);
  }, [touched]);

  // フィールドのブラー処理
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    // 単一フィールドのバリデーション
    if (validationRules[name]) {
      const fieldErrors = validateForm({ [name]: values[name] }, { [name]: validationRules[name] });
      setErrors(prevErrors => ({
        ...prevErrors,
        ...fieldErrors
      }));
    }
  }, [values, validationRules]);

  // 特定のフィールドのバリデーションを実行
  const validateField = useCallback((name) => {
    if (validationRules[name]) {
      const fieldErrors = validateForm({ [name]: values[name] }, { [name]: validationRules[name] });
      
      setErrors(prevErrors => ({
        ...prevErrors,
        ...fieldErrors
      }));
      
      return !fieldErrors[name];
    }
    return true;
  }, [values, validationRules]);

  // 全フォームのバリデーションを実行
  const validateAllFields = useCallback(() => {
    const formErrors = validateForm(values, validationRules);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);

  // フォーム送信ハンドラ
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // すべてのフィールドをタッチ済みとしてマーク
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // バリデーション実行
    const isFormValid = validateAllFields();
    
    if (isFormValid) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        notificationService.success('フォームが正常に送信されました');
      } catch (error) {
        console.error('フォーム送信エラー:', error);
        notificationService.error('フォーム送信中にエラーが発生しました');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      notificationService.warning('入力内容に問題があります。修正してください。');
    }
  }, [values, validateAllFields, onSubmit]);

  // フォームのリセット
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // バリデーション状態の更新
  useEffect(() => {
    const formErrors = validateForm(values, validationRules);
    const valid = Object.keys(formErrors).length === 0;
    setIsValid(valid);
  }, [values, validationRules]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    validateField,
    validateAllFields,
    resetForm
  };
};

export default useFormValidation; 
