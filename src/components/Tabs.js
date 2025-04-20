import React, { createContext, useContext, useState } from 'react';
import styles from './Tabs.module.css';

// タブの状態を管理するためのコンテキスト
const TabContext = createContext(null);

// タブコンテナ
export function Tabs({ children, defaultTab = 0 }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={styles.tabContainer}>
        {children}
      </div>
    </TabContext.Provider>
  );
}

// タブリスト
export function TabList({ children }) {
  return (
    <div className={styles.tabList}>
      {children}
    </div>
  );
}

// 個別タブ
export function Tab({ children, index, onClick }) {
  const { activeTab, setActiveTab } = useContext(TabContext);
  
  const handleClick = () => {
    setActiveTab(index);
    if (onClick) onClick();
  };

  return (
    <button
      className={`${styles.tab} ${activeTab === index ? styles.tabActive : ''}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

// タブパネル
export function TabPanel({ children, index }) {
  const { activeTab } = useContext(TabContext);
  
  if (activeTab !== index) return null;
  
  return (
    <div className={styles.tabPanel}>
      {children}
    </div>
  );
}

export default { Tabs, TabList, Tab, TabPanel }; 
