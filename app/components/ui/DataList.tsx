import React from 'react';
import { Search } from 'lucide-react';

interface DataListProps<T> {
  items: T[];
  isEmpty: boolean;
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  className?: string;
  gap?: number;
}

export function DataList<T>({
  items,
  isEmpty,
  emptyMessage,
  renderItem,
  className = '',
  gap = 10,
}: DataListProps<T>) {
  if (isEmpty) {
    return (
      <div className="data-list-empty">
        <div className="data-list-empty-icon">
          <Search size={26} strokeWidth={1.5} />
        </div>
        <p className="data-list-empty-message">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`data-list ${className}`}
      style={{ gap }}
    >
      {items.map(renderItem)}
    </div>
  );
}
