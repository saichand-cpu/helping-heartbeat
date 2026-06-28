import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadFeedMedia, type UploadedMedia } from "@/lib/upload";

type Props = {
  value: UploadedMedia | null;
  onChange: (v: UploadedMedia | null) => void;
  /** When true, also offer a camera-capture button on mobile. */
  allowCamera?: boolean;
  accept?: string;
};

export function MediaPicker({ value, onChange, allowCamera = true, accept = "image/*,video/*" }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const m = await uploadFeedMedia(file);
      onChange(m);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy}
          onClick={() => galleryRef.current?.click()}>
          {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 mr-1" />}
          Gallery
        </Button>
        {allowCamera && (
          <Button type="button" variant="outline" size="sm" disabled={busy}
            onClick={() => cameraRef.current?.click()}>
            <Camera className="h-3.5 w-3.5 mr-1" /> Camera
          </Button>
        )}
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        )}
      </div>
      <input ref={galleryRef} type="file" accept={accept} className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      {value && (
        <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
          {value.kind === "video" ? (
            <video src={value.signedUrl} controls className="max-h-72 w-full object-cover" />
          ) : (
            <img src={value.signedUrl} alt="" className="max-h-72 w-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
