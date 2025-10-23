"use client";
import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    // Forza sempre il tema scuro
    const root = window.document.documentElement;
    root.classList.add("dark");
    console.log("Dark mode sempre attivo");
  }, []);

  // Non renderizza nulla, il tema è sempre scuro
  return null;
}
