"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqCategory {
  id: string;
  title: string;
  items: {
    question: string;
    answer: string;
  }[];
}

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [openKey, setOpenKey] = useState<string>("freshness-0");

  return (
    <div className="space-y-12">
      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="scroll-mt-28">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-espresso mb-5">
            {cat.title}
          </h2>
          <div className="border-t border-stone-border divide-y divide-stone-border">
            {cat.items.map((item, idx) => {
              const key = `${cat.id}-${idx}`;
              const isOpen = openKey === key;
              return (
                <div key={key} className="py-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenKey(isOpen ? "" : key)}
                    className="w-full flex items-center justify-between gap-4 text-left py-2 cursor-pointer group"
                  >
                    <span className="text-sm sm:text-base font-medium text-espresso group-hover:text-terracotta transition-colors">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-terracotta" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-2 pb-3 pr-8 text-sm text-muted leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
