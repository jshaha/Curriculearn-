"use client";

import { useState } from "react";

import type { AccordionEntry } from "@/content/sections";
import { AccordionItem } from "@/components/AccordionItem";

interface AccordionListProps {
  items: AccordionEntry[];
  sectionKey: "experience" | "leadership";
}

export const AccordionList = ({ items, sectionKey }: AccordionListProps): JSX.Element => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={isOpen}
            onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
            controlsId={`${sectionKey}-accordion-panel-${item.id}`}
          />
        );
      })}
    </div>
  );
};
