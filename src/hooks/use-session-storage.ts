import { useEffect, useRef, useState } from 'react';

export function useSessionStorage<T>(key: string, initialValue: T) {
  const isFirst = useRef(true);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota or serialization errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}



