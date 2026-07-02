import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { displayIdentity } from "@/lib/identity";

type Row = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profession: string | null;
  incognito: boolean | null;
  premium_tier: string | null;
};

export function UserSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user?.id ?? null));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const term = q.trim().replace(/[%_]/g, "");
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, profession, incognito, premium_tier" as never)
        .or(
          `full_name.ilike.%${term}%,username.ilike.%${term}%,profession.ilike.%${term}%`,
        )
        .limit(8);
      setResults(((data as unknown as Row[]) ?? []).filter((r) => r?.id));
      setLoading(false);
    }, 220);
  }, [q]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people by name, username or profession…"
          className="pl-9 h-11 rounded-2xl"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute z-50 mt-2 w-full glass rounded-2xl shadow-pop overflow-hidden border border-border">
          <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 border-b border-border">
            <Users className="h-3 w-3" /> People
          </div>
          {!loading && results.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No matches for "{q}"</div>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {results?.map((r) => {
              const id = displayIdentity(r, me);
              return (
                <li key={r.id}>
                  <Link
                    to="/profile/$userId"
                    params={{ userId: r.id }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      {id.avatar_url && <AvatarImage src={id.avatar_url} />}
                      <AvatarFallback>{id.initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{id.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.profession || "Member"}
                        {r.username ? ` · @${r.username}` : ""}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
