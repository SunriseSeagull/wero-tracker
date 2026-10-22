"use client";

import { MerchantItem } from "./merchant-item";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { merchantCategoryOptions } from "@/lib/constants";
import { Merchant } from "@/db/schema/merchants";
import { baseStatus } from "@/lib/status-helper";
import { SupportStats } from "./support-stats";

interface MerchantCategorySectionProps {
  category: Merchant["category"];
  merchants: Merchant[];
  defaultExpanded?: boolean;
}

export function MerchantCategorySection({
  category: c,
  merchants,
  defaultExpanded = true,
}: MerchantCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const category = merchantCategoryOptions.find((o) => o.value === c);

  const counts = { supported: 0, announced: 0, unsupported: 0, unknown: 0 };
  for (const merchant of merchants) {
    counts[baseStatus(merchant.weroSupport)]++;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 sm:gap-4 rounded-lg bg-secondary/50 px-3 sm:px-4 py-3 hover:bg-secondary transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl" role="img" aria-label={category?.label}>
            {category?.emoji}
          </span>
          <h2 className="font-semibold text-foreground text-start truncate">
            {category?.label}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SupportStats total={merchants.length} unit="shops" counts={counts} />
          <ChevronDown
            size={20}
            className={cn(
              isOpen ? "rotate-0" : "-rotate-90",
              "transition-transform text-muted-foreground shrink-0",
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
          {merchants.map((merchant) => (
            <MerchantItem key={merchant.id} merchant={merchant} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
