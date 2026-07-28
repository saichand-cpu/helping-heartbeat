// Dynamic Razorpay SDK loader — injects the checkout script on demand.
// Resolves the global constructor from window.Razorpay once available.

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler?: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loader: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("Razorpay SDK failed to load"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export async function openRazorpay(options: RazorpayOptions) {
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay unavailable");
  const rzp = new window.Razorpay(options);
  rzp.open();
}
