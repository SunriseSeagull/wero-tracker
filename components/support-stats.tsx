import { BaseSupportStatus } from "@/lib/status-helper";

const segments: {
  status: BaseSupportStatus;
  label: string;
  className: string;
}[] = [
  { status: "supported", label: "Supported", className: "bg-status-supported" },
  { status: "announced", label: "Announced", className: "bg-status-announced" },
  {
    status: "unsupported",
    label: "Unsupported",
    className: "bg-status-unsupported",
  },
  { status: "unknown", label: "Unknown", className: "bg-status-unknown" },
];

export function SupportStats({
  total,
  unit,
  counts,
}: {
  total: number;
  unit: string;
  counts: Record<BaseSupportStatus, number>;
}) {
  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0">
      <p className="text-xs text-muted-foreground text-right whitespace-nowrap">
        <span className="sm:hidden">
          {counts.supported}/{total} supported
        </span>
        <span className="hidden sm:inline">
          {total} {unit} • {counts.supported} supported • {counts.announced}{" "}
          announced
        </span>
      </p>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={segments
          .map((s) => `${s.label}: ${counts[s.status]}`)
          .join(", ")}
      >
        {total > 0 &&
          segments.map(
            (s) =>
              counts[s.status] > 0 && (
                <div
                  key={s.status}
                  className={s.className}
                  style={{ width: `${(counts[s.status] / total) * 100}%` }}
                  title={`${s.label}: ${Math.round((counts[s.status] / total) * 100)}%`}
                />
              ),
          )}
      </div>
    </div>
  );
}
