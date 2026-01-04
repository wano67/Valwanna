import clsx from "clsx";

type BannerProps = {
  message: string | null;
  tone: "success" | "error" | "info";
  onClose?: () => void;
};

const toneStyles: Record<BannerProps["tone"], string> = {
  success:
    "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100",
  error: "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100",
  info: "bg-blue-50 text-blue-800 border-blue-200 shadow-blue-100",
};

export function StatusBanner({ message, tone, onClose }: BannerProps) {
  if (!message) return null;

  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft",
        toneStyles[tone],
      )}
    >
      <span className="font-semibold">{message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wide text-current transition hover:opacity-70"
          aria-label="Fermer le message"
        >
          Fermer
        </button>
      ) : null}
    </div>
  );
}
