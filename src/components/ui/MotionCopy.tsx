"use client";
import { Children, cloneElement, isValidElement, useEffect, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/shell/context";

const textTags = new Set(["h1", "h2", "h3", "h4", "p", "a", "button", "span", "strong", "em", "small", "li", "label"]);
/** Declarative splitting keeps React in charge of text when a tab or locale changes. */
export function motionCopy(node: ReactNode, textual = false, letterMode = false): ReactNode {
  return Children.map(node, child => {
    if (typeof child === "string" && textual && child.trim().length > 1) {
      let order = 0;
      const short = letterMode && child.length < 75;
      return <span className="motion-copy" data-copy key={child}>
        <span className="sr-only">{child}</span>
        <span aria-hidden="true">{child.split(/(\s+)/).map((word, i) => /\s/.test(word) ? word :
          <span className="copy-word" key={i}>{(short ? Array.from(word) : [word]).map((part, j) =>
            <span className="copy-unit" style={{ "--copy-delay": `${Math.min(order++ * (short ? 13 : 27), 360)}ms` } as CSSProperties} key={j}>{part}</span>)}</span>)}</span>
      </span>;
    }
    if (!isValidElement<{ children?: ReactNode; className?: string }>(child)) return child;
    if (typeof child.type === "string" && ["svg", "textarea", "input", "select", "option", "script", "style"].includes(child.type)) return child;
    if (child.props.className?.includes("motion-copy")) return child;
    if (child.props.className?.includes("sr-only")) return child;
    const letters = typeof child.type === "string" && (["h1", "h2", "h3"].includes(child.type) || (["span", "em", "strong", "small"].includes(child.type) && letterMode));
    return cloneElement(child, { children: motionCopy(child.props.children, typeof child.type === "string" && textTags.has(child.type), letters) });
  });
}

export function MotionObserver() {
  const { gate } = useShell();
  const path = usePathname();
  useEffect(() => {
    if (gate !== "portfolio") return;
    const observed = new Set<HTMLElement>();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("copy-entered");
      observer.unobserve(entry.target);
      observed.delete(entry.target as HTMLElement);
    }), { rootMargin: "0px 0px -18px 0px", threshold: 0 });
    const scan = (root: ParentNode) => root.querySelectorAll<HTMLElement>("[data-copy]:not(.copy-entered)").forEach(el => {
      if (observed.has(el)) return;
      el.classList.add("copy-ready"); observed.add(el); observer.observe(el);
    });
    scan(document);
    const mutation = new MutationObserver(records => {
      observed.forEach(el => { if (!el.isConnected) { observer.unobserve(el); observed.delete(el); } });
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node.parentElement || node);
      }));
    });
    mutation.observe(document.querySelector("[data-content]") || document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutation.disconnect(); observed.forEach(el => el.classList.remove("copy-ready")); };
  }, [gate, path]);
  return null;
}
