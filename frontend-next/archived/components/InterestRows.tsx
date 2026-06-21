import type { Interest } from "@/content/interests";
import { cn } from "@/lib/utils";

interface InterestRowsProps {
  items: Interest[];
  className?: string;
}

export const InterestRows = ({ items, className }: InterestRowsProps): JSX.Element => {
  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item) => (
        <article
          key={item.id}
          className="group grid grid-cols-1 gap-y-3 py-6 md:grid-cols-[minmax(180px,240px)_1px_minmax(0,1fr)] md:gap-x-8 md:gap-y-0 md:py-8"
        >
          <h2 className="pt-0.5 text-[1.02rem] font-medium tracking-[-0.01em] text-fg/82 transition-colors duration-150 md:text-[1.08rem] md:group-hover:text-fg/96">
            <span className="decoration-transparent underline-offset-[0.22em] transition-colors duration-150 md:group-hover:decoration-fg/42 md:group-hover:underline">
              {item.title}
            </span>
          </h2>

          <div aria-hidden="true" className="hidden self-stretch bg-fg/14 md:block" />

          <div className="max-w-[66ch] space-y-3.5">
            <p className="text-[0.99rem] leading-[1.8] text-fg/68 md:text-[1.04rem]">{item.description}</p>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="rounded-full border border-fg/12 px-2.5 py-1 font-mono text-[0.53rem] uppercase tracking-[0.13em] text-fg/46"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
};
