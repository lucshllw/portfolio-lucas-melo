"use client";
import { useLayoutEffect } from "react";
// Dialogs keep their own internal scroll; the page and its smooth conductor stop.
export function useDialogLock(open: boolean) {
  useLayoutEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow,
      y = window.scrollY;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("lm-dialog", { detail: true }));
    return () => {
      document.body.style.overflow = before;
      window.scrollTo({ top: y, behavior: "instant" });
      window.dispatchEvent(new CustomEvent("lm-dialog", { detail: false }));
    };
  }, [open]);
}
