import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

type StatePanelProps = {
  variant: "empty" | "loading" | "error";
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function StatePanel({ variant, title, description, action }: StatePanelProps) {
  const Icon = variant === "loading" ? Loader2 : variant === "error" ? AlertTriangle : Inbox;
  const tone =
    variant === "error"
      ? "border-coral/25 bg-coral/8 text-coral"
      : variant === "loading"
        ? "border-sky/25 bg-sky/8 text-sky"
        : "border-line/80 bg-paper/70 text-ink/55";

  return (
    <div className={`rounded-lg border p-6 text-center ${tone}`}>
      <Icon
        className={`mx-auto h-8 w-8 ${variant === "loading" ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/62">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
