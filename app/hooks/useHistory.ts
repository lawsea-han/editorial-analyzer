"use client";

import { useState, useEffect } from "react";

export interface HistoryItem {
  id: string;
  date: string;
  preview: string; // 사설 앞 50자
  selectedPhases: number[];
  results: Array<{ step: number; title: string; content: string }>;
}

const KEY = "editorial_history";
const MAX = 5;

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (item: Omit<HistoryItem, "id" | "date">) => {
    const next: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      date: new Date().toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    const updated = [next, ...history].slice(0, MAX);
    setHistory(updated);
    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {}
    return next.id;
  };

  const remove = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {}
  };

  const clear = () => {
    setHistory([]);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  };

  return { history, save, remove, clear };
}
