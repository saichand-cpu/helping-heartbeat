import { cn } from "@/lib/utils";
import { SEGMENT_OPTIONS, type UserType } from "@/lib/user-type";

export type SegmentValue = "all" | UserType;

/**
 * Horizontal segmented filter: All / Personal Needs / Verified Businesses.
 * Reusable across Dashboard, Feed, and Requests.
 */
export function SegmentFilter({
  value,
  onChange,
  className,
}: {
  value: SegmentValue;
  onChange: (v: SegmentValue) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by user type"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card/60 backdrop-blur px-1 py-1 shadow-soft",
        className,
      )}
    >
      {SEGMENT_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", opt.dot)} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
