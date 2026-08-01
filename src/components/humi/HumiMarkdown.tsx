import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-3 overflow-hidden rounded-xl border border-border bg-muted/60">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {lang || "code"}
        </span>
        <button
          type="button"
          aria-label="Copy code"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Rich markdown renderer for HUMI answers: tables, lists, code, links. */
export function HumiMarkdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-7 text-foreground [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...p }) => (
            <a {...p} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2" />
          ),
          table: ({ ...p }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-border">
              <table {...p} className="w-full text-sm" />
            </div>
          ),
          th: ({ ...p }) => <th {...p} className="bg-muted/60 px-3 py-2 text-left font-semibold" />,
          td: ({ ...p }) => <td {...p} className="border-t border-border px-3 py-2 align-top" />,
          code: ({ className, children, ...props }) => {
            const text = String(children ?? "");
            const match = /language-(\w+)/.exec(className ?? "");
            if (!match && !text.includes("\n")) {
              return (
                <code {...props} className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-medium">
                  {text}
                </code>
              );
            }
            return <CodeBlock code={text.replace(/\n$/, "")} lang={match?.[1]} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
