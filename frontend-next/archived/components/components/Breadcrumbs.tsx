"use client";

import Link from "next/link";

import { useUIStore } from "@/lib/store";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }): JSX.Element => {
  const setHover = useUIStore((state) => state.setHover);

  if (items.length === 0) {
    return <></>;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg/52">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/") {
                      setHover(null);
                    }
                  }}
                  className="underline decoration-transparent underline-offset-[0.22em] transition-colors duration-150 hover:text-accent hover:decoration-accent/75"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-fg/82" : "text-fg/52"}>{item.label}</span>
              )}

              {!isLast ? <span className="text-fg/28">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
