"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kasilink-lite-mode";

export function useLiteMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = stored === "true";
    setEnabled(initial);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.lite = initial ? "true" : "false";
    }
  }, []);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      if (typeof document !== "undefined") {
        document.documentElement.dataset.lite = next ? "true" : "false";
      }
      return next;
    });
  };

  return { enabled, toggle };
}
