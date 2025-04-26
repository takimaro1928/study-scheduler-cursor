/**
 * 日付をフォーマットするユーティリティ関数
 * @param {Date} date - フォーマットする日付オブジェクト
 * @param {string} format - フォーマット文字列 (例: 'yyyy/MM/dd HH:mm:ss')
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = (date, format) => {
  if (!date) return '';
  
  // Dateオブジェクトでなければ変換を試みる
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
    } catch (e) {
      console.error('Invalid date format:', date);
      return '';
    }
  }
  
  // 無効な日付の場合は空文字を返す
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // フォーマット文字列の置換
  return format
    .replace(/yyyy/g, year.toString())
    .replace(/yy/g, year.toString().slice(-2))
    .replace(/MM/g, month.toString().padStart(2, '0'))
    .replace(/M/g, month.toString())
    .replace(/dd/g, day.toString().padStart(2, '0'))
    .replace(/d/g, day.toString())
    .replace(/HH/g, hours.toString().padStart(2, '0'))
    .replace(/H/g, hours.toString())
    .replace(/mm/g, minutes.toString().padStart(2, '0'))
    .replace(/m/g, minutes.toString())
    .replace(/ss/g, seconds.toString().padStart(2, '0'))
    .replace(/s/g, seconds.toString());
};

/**
 * 日付を相対的な表現に変換する（例: "3日前", "5分前"）
 * @param {Date} date - 変換する日付
 * @returns {string} 相対的な日付表現
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  // Dateオブジェクトでなければ変換
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
    } catch (e) {
      return '';
    }
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return '今';
  } else if (diffMin < 60) {
    return `${diffMin}分前`;
  } else if (diffHour < 24) {
    return `${diffHour}時間前`;
  } else if (diffDay < 30) {
    return `${diffDay}日前`;
  } else if (diffMonth < 12) {
    return `${diffMonth}ヶ月前`;
  } else {
    return `${diffYear}年前`;
  }
};

/**
 * 指定された日数の範囲内かどうかをチェック
 * @param {Date} date - チェックする日付
 * @param {number} days - 日数
 * @returns {boolean} 指定された日数以内ならtrue
 */
export const isWithinDays = (date, days) => {
  if (!date) return false;
  
  // Dateオブジェクトでなければ変換
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
    } catch (e) {
      return false;
    }
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays <= days;
};

/**
 * 指定された日付から今日までの日数を取得
 * @param {Date} date - 日付
 * @returns {number} 経過日数
 */
export const getDaysSince = (date) => {
  if (!date) return null;
  
  // Dateオブジェクトでなければ変換
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
    } catch (e) {
      return null;
    }
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}; 
