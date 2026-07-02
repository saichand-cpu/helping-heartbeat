import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PROFESSION_CHIPS = [
  "Video Editor",
  "Software Developer",
  "Community Organizer",
  "Tech Associate",
  "Student",
  "Teacher",
  "Doctor",
  "Nurse",
  "Designer",
  "Marketer",
  "Content Creator",
  "Entrepreneur",
  "Homemaker",
  "Retired",
  "Volunteer",
  "Other",
];

export function ProfessionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [custom, setCustom] = useState(value && !PROFESSION_CHIPS.includes(value) ? value : "");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PROFESSION_CHIPS.map((p) => {
          const active = value === p;
          return (
            <button
              type="button"
              key={p}
              onClick={() => {
                onChange(p);
                setCustom("");
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                active
                  ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                  : "bg-card border-border hover:border-primary/40 hover:bg-accent",
              )}
            >
              {active && <Check className="inline h-3 w-3 mr-1 -mt-0.5" />}
              {p}
            </button>
          );
        })}
      </div>
      <div>
        <Input
          placeholder="Or type a custom profession…"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            onChange(e.target.value);
          }}
        />
      </div>
      {value ? (
        <Badge variant="outline" className="text-[11px]">Selected: {value}</Badge>
      ) : (
        <p className="text-[11px] text-destructive">Profession is required.</p>
      )}
    </div>
  );
}
