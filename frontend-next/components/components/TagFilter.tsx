"use client";

import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}

export const TagFilter = ({
  tags,
  selectedTags,
  onToggleTag,
  onClear
}: TagFilterProps): JSX.Element | null => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.16em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                selected
                  ? "border-accent text-accent"
                  : "border-fg/20 text-muted hover:border-fg/40 hover:text-fg"
              )}
              onClick={() => onToggleTag(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 ? (
        <button
          type="button"
          className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted transition-colors duration-150 hover:text-accent"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
};
