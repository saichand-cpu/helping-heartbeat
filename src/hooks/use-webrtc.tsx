import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Voice-only WebRTC over Supabase Realtime broadcast signaling.
// Public Google STUN — works on same network & most NATs. No TURN, so ~10-20%
// of calls behind strict NATs will not connect (expected tradeoff).

const STUN: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

export type CallStatus = "idle" | "ringing-out" | "ringing-in" | "connecting" | "connected" | "ended";

type SignalPayload =
  | { kind: "offer"; sdp: RTCSessionDescriptionInit; from: string }
  | { kind: "answer"; sdp: RTCSessionDescriptionInit; from: string }
  | { kind: "ice"; candidate: RTCIceCandidateInit; from: string }
  | { kind: "hangup"; from: string };

function channelName(a: string, b: string) {
  // call_room:<sorted-pair> — deterministic per 1:1 chat, matches Realtime spec.
  return `call_room:${[a, b].sort().join("_")}`;
}

export function useWebRTC(me: string | null) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [peerId, setPeerId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<{ sdp: RTCSessionDescriptionInit; from: string } | null>(null);

  // Attach remote audio sink lazily.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let el = document.getElementById("hl-remote-audio") as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement("audio");
      el.id = "hl-remote-audio";
      el.autoplay = true;
      el.style.display = "none";
      document.body.appendChild(el);
    }
    remoteAudioRef.current = el;
  }, []);

  const cleanup = useCallback((reason: CallStatus = "ended") => {
    try { pcRef.current?.getSenders().forEach((s) => s.track?.stop()); } catch { /* noop */ }
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingIceRef.current = [];
    pendingOfferRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setMuted(false);
    setStatus(reason);
    setTimeout(() => setStatus((s) => (s === "ended" ? "idle" : s)), 800);
    setPeerId(null);
  }, []);

  const sendSignal = useCallback((payload: SignalPayload) => {
    const ch = chanRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const createPc = useCallback((remoteId: string) => {
    const pc = new RTCPeerConnection(STUN);
    pcRef.current = pc;
    pc.onicecandidate = (e) => {
      if (e.candidate && me) sendSignal({ kind: "ice", candidate: e.candidate.toJSON(), from: me });
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (remoteAudioRef.current && stream) remoteAudioRef.current.srcObject = stream;
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setStatus("connected");
      else if (st === "failed" || st === "disconnected" || st === "closed") {
        if (peerId === remoteId || peerId === null) cleanup("ended");
      }
    };
    return pc;
  }, [me, sendSignal, cleanup, peerId]);

  // Subscribe to the pair channel whenever `me` + a peer is engaged.
  const openChannel = useCallback((otherId: string) => {
    if (!me) return null;
    if (chanRef.current) {
      supabase.removeChannel(chanRef.current);
      chanRef.current = null;
    }
    const ch = supabase.channel(channelName(me, otherId), { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
      const sig = payload as SignalPayload;
      if (!sig || sig.from === me) return;
      const pc = pcRef.current;

      if (sig.kind === "offer") {
        // Incoming ring — hold offer until user accepts.
        pendingOfferRef.current = { sdp: sig.sdp, from: sig.from };
        setPeerId(sig.from);
        setStatus("ringing-in");
      } else if (sig.kind === "answer" && pc) {
        await pc.setRemoteDescription(sig.sdp);
        setStatus("connecting");
        for (const c of pendingIceRef.current) { try { await pc.addIceCandidate(c); } catch { /* noop */ } }
        pendingIceRef.current = [];
      } else if (sig.kind === "ice") {
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(sig.candidate); } catch { /* noop */ }
        } else {
          pendingIceRef.current.push(sig.candidate);
        }
      } else if (sig.kind === "hangup") {
        cleanup("ended");
      }
    });
    ch.subscribe();
    chanRef.current = ch;
    return ch;
  }, [me, cleanup]);

  // Always keep a listening channel to a specific active peer if provided,
  // but callers can also open on-demand via startCall.
  const listenTo = useCallback((otherId: string | null) => {
    if (!me || !otherId) return;
    openChannel(otherId);
  }, [me, openChannel]);

  useEffect(() => () => {
    if (chanRef.current) supabase.removeChannel(chanRef.current);
    chanRef.current = null;
    cleanup("idle");
  }, [cleanup]);

  const startCall = useCallback(async (otherId: string) => {
    if (!me || !otherId || status !== "idle") return;
    setPeerId(otherId);
    setStatus("ringing-out");
    openChannel(otherId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const pc = createPc(otherId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      sendSignal({ kind: "offer", sdp: offer, from: me });
    } catch (e) {
      cleanup("ended");
      throw e;
    }
  }, [me, status, openChannel, createPc, sendSignal, cleanup]);

  const acceptCall = useCallback(async () => {
    const pending = pendingOfferRef.current;
    if (!pending || !me) return;
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const pc = createPc(pending.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(pending.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ kind: "answer", sdp: answer, from: me });
      for (const c of pendingIceRef.current) { try { await pc.addIceCandidate(c); } catch { /* noop */ } }
      pendingIceRef.current = [];
      pendingOfferRef.current = null;
    } catch (e) {
      cleanup("ended");
      throw e;
    }
  }, [me, createPc, sendSignal, cleanup]);

  const declineCall = useCallback(() => {
    if (me) sendSignal({ kind: "hangup", from: me });
    cleanup("ended");
  }, [me, sendSignal, cleanup]);

  const hangup = useCallback(() => {
    if (me) sendSignal({ kind: "hangup", from: me });
    cleanup("ended");
  }, [me, sendSignal, cleanup]);

  const toggleMute = useCallback(() => {
    const s = localStreamRef.current;
    if (!s) return;
    const next = !muted;
    s.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setMuted(next);
  }, [muted]);

  return { status, peerId, muted, startCall, acceptCall, declineCall, hangup, toggleMute, listenTo };
}
