export function getScoreInfo(score: number) {
  if (score > 70) return { color: "bg-red-500/8 text-red-400/70 border-red-500/15", label: "ALTO RIESGO", textColor: "text-red-400/70", bgColor: "bg-red-500/10" };
  if (score >= 40) return { color: "bg-yellow-500/8 text-yellow-400/70 border-yellow-500/15", label: "SOSPECHOSO", textColor: "text-yellow-400/70", bgColor: "bg-yellow-500/10" };
  return { color: "bg-green-500/8 text-green-400/70 border-green-500/15", label: "NORMAL", textColor: "text-green-400/70", bgColor: "bg-green-500/10" };
}

export function ScoreBadge({ score, size = "default" }: { score: number; size?: "sm" | "default" | "lg" }) {
  const info = getScoreInfo(score);

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center justify-center rounded-md text-xs font-medium px-2 py-0.5 border tabular-nums ${info.color}`}>
        {score}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-lg font-light tracking-tight border tabular-nums ${info.color}`}>
          {score}
        </span>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/30">{info.label}</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-1 border tabular-nums ${info.color}`}>
      {score} — {info.label}
    </span>
  );
}

export function ScoreBadgeCompact({ score }: { score: number }) {
  const info = getScoreInfo(score);
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium border tabular-nums ${info.color}`}>
      {score}
    </span>
  );
}
