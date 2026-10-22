"use client";

import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeView: "banks" | "merchants";
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  activeView,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <InputGroup>
        <InputGroupInput
          placeholder={
            activeView === "banks"
              ? "Search banks..."
              : "Search online shops..."
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          spellCheck={false}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        {searchQuery && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear"
              title="Clear"
              size="icon-xs"
              onClick={() => onSearchChange("")}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}
