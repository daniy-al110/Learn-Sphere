"use client";

import { useEffect } from "react";

/** app.js: apply the saved theme on load. */
export default function ThemeSync() {
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
  }, []);
  return null;
}
