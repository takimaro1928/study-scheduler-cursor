/**
 * バリデーションルール生成ユーティリティ
 * 複雑なバリデーションルールを簡単に定義するためのヘルパー関数
 */

/**
 * 必須チェック
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const required = (message = '入力必須項目です') => {
  return (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message;
    }
    return null;
  };
};

/**
 * 最小文字数チェック
 * @param {number} min 最小文字数
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const minLength = (min, message = `${min}文字以上で入力してください`) => {
  return (value) => {
    if (value && value.length < min) {
      return message;
    }
    return null;
  };
};

/**
 * 最大文字数チェック
 * @param {number} max 最大文字数
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const maxLength = (max, message = `${max}文字以下で入力してください`) => {
  return (value) => {
    if (value && value.length > max) {
      return message;
    }
    return null;
  };
};

/**
 * パターンマッチチェック
 * @param {RegExp} pattern 正規表現パターン
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const pattern = (pattern, message = '入力形式が正しくありません') => {
  return (value) => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  };
};

/**
 * メールアドレスチェック
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const email = (message = '有効なメールアドレスを入力してください') => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(emailPattern, message);
};

/**
 * 数値チェック
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const numeric = (message = '数値を入力してください') => {
  return (value) => {
    if (value && isNaN(Number(value))) {
      return message;
    }
    return null;
  };
};

/**
 * 数値範囲チェック
 * @param {number} min 最小値
 * @param {number} max 最大値
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const range = (min, max, message = `${min}以上${max}以下の値を入力してください`) => {
  return (value) => {
    const num = Number(value);
    if (value && !isNaN(num) && (num < min || num > max)) {
      return message;
    }
    return null;
  };
};

/**
 * 一致チェック (パスワード確認など)
 * @param {string} field 比較対象のフィールド名
 * @param {string} message エラーメッセージ
 * @returns {Function} バリデーション関数
 */
export const matchField = (field, message = '入力値が一致しません') => {
  return (value, values) => {
    if (value !== values[field]) {
      return message;
    }
    return null;
  };
};

/**
 * 複数のバリデーションルールを組み合わせる
 * @param  {...Function} rules バリデーションルール関数の配列
 * @returns {Function[]} 組み合わせたバリデーションルール
 */
export const compose = (...rules) => {
  return rules;
};

/**
 * よく使うバリデーションルールのセット
 */
export const commonRules = {
  /**
   * ユーザー名バリデーション
   * - 必須
   * - 3文字以上20文字以下
   * - 英数字、アンダースコアのみ許可
   */
  username: compose(
    required('ユーザー名は必須です'),
    minLength(3, 'ユーザー名は3文字以上で入力してください'),
    maxLength(20, 'ユーザー名は20文字以下で入力してください'),
    pattern(/^[a-zA-Z0-9_]+$/, 'ユーザー名は英数字とアンダースコアのみ使用できます')
  ),

  /**
   * メールアドレスバリデーション
   * - 必須
   * - メール形式
   */
  email: compose(
    required('メールアドレスは必須です'),
    email()
  ),

  /**
   * パスワードバリデーション
   * - 必須
   * - 6文字以上
   * - 英数字記号を含む
   */
  password: compose(
    required('パスワードは必須です'),
    minLength(6, 'パスワードは6文字以上で入力してください'),
    pattern(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英字と数字を含める必要があります')
  ),

  /**
   * 年齢バリデーション
   * - 数値
   * - 0〜120の範囲
   */
  age: compose(
    numeric('年齢は数値で入力してください'),
    range(0, 120, '年齢は0〜120の範囲で入力してください')
  )
}; 
