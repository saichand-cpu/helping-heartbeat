import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmark } from "@/hooks/use-bookmark";
import { toast } from "sonner";

export function BookmarkButton({ postId }: { postId: string }) {
  const { saved, busy, toggle, canBookmark } = useBookmark(postId);
  if (!canBookmark) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => {
        toggle();
        toast(saved ? "Removed from saved" : "Saved");
      }}
      className={saved ? "text-amber-500" : "text-muted-foreground"}
      aria-label={saved ? "Remove bookmark" : "Save post"}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </Button>
  );
}
