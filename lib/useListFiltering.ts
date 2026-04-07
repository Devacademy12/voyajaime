import { useState, useMemo } from 'react';

export interface FilterConfig<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterKey?: keyof T;
  secondaryFilters?: Record<string, any>;
}

export function useListFiltering<T extends Record<string, any>>(config: FilterConfig<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = config.data;

    // Primary filter
    if (config.filterKey && filter !== "all") {
      list = list.filter((item) => item[config.filterKey!] === filter);
    }

    // Secondary filters
    if (config.secondaryFilters) {
      Object.entries(config.secondaryFilters).forEach(([key, value]) => {
        if (value !== "all") {
          list = list.filter((item) => item[key] === value);
        }
      });
    }

    // City filter (common pattern)
    if (cityFilter !== "all") {
      list = list.filter((item) => item.city === cityFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const fields = config.searchFields || [];
      list = list.filter(item =>
        fields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(q);
        })
      );
    }

    return list;
  }, [config.data, filter, search, cityFilter, config]);

  const cities = useMemo(() => {
    const set = new Set(
      config.data.map((item) => item.city).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [config.data]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    cityFilter,
    setCityFilter,
    filtered,
    cities,
  };
}