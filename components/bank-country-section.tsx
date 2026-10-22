"use client";

import { Bankitem } from "./bank-item";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { CountryFlag } from "./country-flag";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WeroData } from "@/app/page";
import { calculateWeroSupport } from "@/lib/bank-helper";
import { baseStatus } from "@/lib/status-helper";
import { SupportStats } from "./support-stats";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

interface BankCountrySectionProps {
  countryCode: string;
  banks: WeroData["banks"];
  defaultExpanded?: boolean;
}

export function BankCountrySection({
  countryCode,
  banks,
  defaultExpanded = true,
}: BankCountrySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [initialDefaultExpanded, setInitialDefaultExpanded] =
    useState(defaultExpanded);

  // defaultExpanded changes after the first render, based on the country resolution
  if (defaultExpanded !== initialDefaultExpanded) {
    setInitialDefaultExpanded(defaultExpanded);
    setIsOpen(defaultExpanded);
  }

  const counts = { supported: 0, announced: 0, unsupported: 0, unknown: 0 };
  for (const bank of banks) {
    counts[baseStatus(calculateWeroSupport(bank, countryCode))]++;
  }

  // The server sorts by the default name, which can differ from the country-specific one
  const sortedBanks = [...banks].sort((a, b) =>
    (a.name[countryCode] ?? a.name.default).localeCompare(
      b.name[countryCode] ?? b.name.default,
    ),
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 sm:gap-4 rounded-lg bg-secondary/50 px-3 sm:px-4 py-3 hover:bg-secondary transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <CountryFlag countryCode={countryCode} size="md" />
          <h2 className="font-semibold text-foreground text-start truncate">
            {regionNames.of(countryCode)}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SupportStats total={banks.length} unit="banks" counts={counts} />
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
        <div className="p-px">
          <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedBanks.map((bank) => (
              <Bankitem key={bank.id} bank={bank} countryCode={countryCode} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
