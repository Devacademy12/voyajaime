import React from 'react';
import { StatusConfig } from '../../../lib/statusConfig';

interface FilterTab {
  key: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface Props {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, activeTab, onTabChange, className = "" }: Props) {
  return (
    <div className={`filter-tabs ${className}`}>
      {tabs.map(({ key, label, icon: Icon, count }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`filter-tab ${activeTab === key ? "active" : ""}`}
        >
          {Icon && <Icon size={13} strokeWidth={2} />}
          {label}
          {count !== undefined && (
            <span className="filter-tab-count">
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}