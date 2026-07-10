import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CallStatus } from "@/hooks/use-webrtc";

type Props = {
  status: CallStatus;
  peerName?: string | null;
  peerAvatar?: string | null;
  muted: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
};

export function CallOverlay({ status, peerName, peerAvatar, muted, onAccept, onDecline, onHangup, onToggleMute }: Props) {
  const visible = status !== "idle";
  const label =
    status === "ringing-in" ? "Incoming call" :
    status === "ringing-out" ? "Calling…" :
    status === "connecting" ? "Connecting…" :
    status === "connected" ? "In call" :
    status === "ended" ? "Call ended" : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-black/90 p-8 text-center shadow-[0_0_60px_-15px_rgba(251,191,36,0.5)]"
          >
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-3xl font-bold overflow-hidden shadow-glow">
              {peerAvatar
                ? <img src={peerAvatar} alt="" className="h-full w-full object-cover" />
                : (peerName || "U").charAt(0)}
            </div>
            <div className="mt-5 text-lg font-semibold text-white truncate">{peerName || "User"}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2">
              {(status === "ringing-out" || status === "connecting") && <Loader2 className="h-3 w-3 animate-spin" />}
              {status === "connected" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              {label}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              {status === "ringing-in" ? (
                <>
                  <Button
                    onClick={onDecline}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)]"
                    aria-label="Decline"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    onClick={onAccept}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                    aria-label="Accept"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </>
              ) : (
                <>
                  {(status === "connected" || status === "connecting") && (
                    <Button
                      onClick={onToggleMute}
                      size="icon"
                      variant="outline"
                      className="h-12 w-12 rounded-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      aria-label={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  )}
                  <Button
                    onClick={onHangup}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)]"
                    aria-label="Hang up"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {status === "connected" && (
              <div className="mt-6 text-[10px] text-muted-foreground">
                Encrypted peer-to-peer · powered by WebRTC
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
