import { StatusDot } from "./status-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BaseSupportStatus } from "@/lib/status-helper";

const items: { status: BaseSupportStatus; label: string }[] = [
  { status: "supported", label: "Supported" },
  { status: "announced", label: "Announced" },
  { status: "unsupported", label: "Unsupported" },
  { status: "unknown", label: "Unknown" },
];

export function Legend({
  selectedStatuses,
  onStatusChange,
}: {
  selectedStatuses: BaseSupportStatus[];
  onStatusChange: (statuses: BaseSupportStatus[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card px-4 py-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Status:
      </span>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={selectedStatuses}
        onValueChange={(value) => onStatusChange(value as BaseSupportStatus[])}
        className="flex-wrap"
        aria-label="Filter by status"
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.status}
            value={item.status}
            className="gap-2 text-muted-foreground data-[state=on]:text-foreground"
          >
            <StatusDot status={item.status} />
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
