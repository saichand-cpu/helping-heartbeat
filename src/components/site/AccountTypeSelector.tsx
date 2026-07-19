import { Building2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORG_TYPES, type AccountType, type OrgType } from "@/lib/org-types";

export function AccountTypeSelector({
  accountType,
  orgType,
  onAccountTypeChange,
  onOrgTypeChange,
}: {
  accountType: AccountType;
  orgType: OrgType | null;
  onAccountTypeChange: (v: AccountType) => void;
  onOrgTypeChange: (v: OrgType | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: "individual" as const, label: "Individual", Icon: UserIcon, hint: "Personal account" },
          { v: "business" as const, label: "Business / Org", Icon: Building2, hint: "Team, NGO, service" },
        ].map(({ v, label, Icon, hint }) => {
          const active = accountType === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                onAccountTypeChange(v);
                if (v === "individual") onOrgTypeChange(null);
              }}
              className={cn(
                "text-left rounded-2xl border p-3 transition-all",
                active
                  ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent",
              )}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Icon className="h-4 w-4" /> {label}
              </div>
              <div className={cn("text-[11px] mt-0.5", active ? "text-primary-foreground/85" : "text-muted-foreground")}>
                {hint}
              </div>
            </button>
          );
        })}
      </div>

      {accountType === "business" && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Organization type
          </div>
          <div className="grid gap-2">
            {ORG_TYPES.map((o) => {
              const active = orgType === o.value;
              const ngoAccent = o.pinKind === "ngo";
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onOrgTypeChange(o.value)}
                  className={cn(
                    "text-left rounded-2xl border p-3 transition-all",
                    active
                      ? ngoAccent
                        ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_18px_-4px_rgba(16,185,129,0.5)]"
                        : "border-amber-500 bg-amber-500/10 shadow-[0_0_18px_-4px_rgba(245,158,11,0.5)]"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{o.label}</span>
                    {active && (
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                          ngoAccent ? "bg-emerald-500 text-black" : "bg-amber-500 text-black",
                        )}
                      >
                        {o.short}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{o.examples}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
