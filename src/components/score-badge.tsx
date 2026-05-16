export function getScoreInfo(score: number) {
  if (score > 70) return { color: "bg-red-500/20 text-red-400 border-red-500/30", label: "ALTO RIESGO", textColor: "text-red-400", bgColor: "bg-red-500" };
  if (score >= 40) return { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "SOSPECHOSO", textColor: "text-yellow-400", bgColor: "bg-yellow-500" };
  return { color: "bg-green-500/20 text-green-400 border-green-500/30", label: "NORMAL", textColor: "text-green-400", bgColor: "bg-green-500" };
}

export function ScoreBadge({ score, size = "default" }: { score: number; size?: "sm" | "default" | "lg" }) {
  const info = getScoreInfo(score);

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2 py-0.5 border ${info.color}`}>
        {score}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-lg font-bold border ${info.color}`}>
          {score}
        </span>
        <span className="text-xs font-semibold tracking-wide uppercase">{info.label}</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold px-2.5 py-1 border ${info.color}`}>
      {score} — {info.label}
    </span>
  );
}

export function ScoreBadgeCompact({ score }: { score: number }) {
  const info = getScoreInfo(score);
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${info.color}`}>
      {score}
    </span>
  );
}
