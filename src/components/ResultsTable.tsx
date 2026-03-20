import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Candidate {
  name: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  recommendation: "Strong Fit" | "Moderate Fit" | "Not Fit";
}

interface Props {
  candidates: Candidate[];
}

function ScoreRing({ score, rank }: { score: number; rank: number }) {
  const circumference = 2 * Math.PI * 28;
  const filled = (score / 100) * circumference;
  const color =
    score >= 75
      ? "stroke-success"
      : score >= 50
        ? "stroke-warning"
        : "stroke-destructive";

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
        <circle
          cx="34"
          cy="34"
          r="28"
          fill="none"
          className="stroke-muted"
          strokeWidth="5"
        />
        <circle
          cx="34"
          cy="34"
          r="28"
          fill="none"
          className={`${color} animate-fill-bar`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ animationDelay: `${rank * 100}ms` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold font-mono tabular-nums text-foreground leading-none">
          {score}
        </span>
      </div>
    </div>
  );
}

function getRecConfig(rec: string) {
  const configs: Record<string, { class: string; icon?: string }> = {
    "Strong Fit": { class: "bg-success/12 text-success border-success/25" },
    "Moderate Fit": { class: "bg-warning/12 text-warning border-warning/25" },
    "Not Fit": { class: "bg-destructive/12 text-destructive border-destructive/25" },
  };
  return configs[rec] || { class: "" };
}

function exportCSV(candidates: Candidate[]) {
  const header = "Rank,Name,Score,Recommendation,Strengths,Gaps";
  const rows = candidates.map((c, i) =>
    [
      i + 1,
      `"${c.name}"`,
      c.match_score,
      `"${c.recommendation}"`,
      `"${c.strengths.join("; ")}"`,
      `"${c.gaps.join("; ")}"`,
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `screening-results-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Results exported");
}

export function ResultsTable({ candidates }: Props) {
  if (candidates.length === 0) return null;

  const topScore = Math.max(...candidates.map((c) => c.match_score));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Screening Results
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} · top score{" "}
            <span className="font-mono font-semibold text-foreground tabular-nums">{topScore}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCSV(candidates)}
          className="gap-1.5 text-xs font-medium active:scale-[0.96] transition-all duration-150 shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {candidates.map((candidate, idx) => {
          const recConfig = getRecConfig(candidate.recommendation);
          const isTop = idx === 0 && candidate.match_score >= 70;

          return (
            <div
              key={candidate.name}
              className={`group rounded-2xl border bg-card p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-up ${
                isTop ? "ring-1 ring-success/20 border-success/30" : ""
              }`}
              style={{ animationDelay: `${idx * 100 + 100}ms` }}
            >
              {/* Top row: rank + name + badge + score ring */}
              <div className="flex items-center gap-4">
                {/* Rank chip */}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-mono shrink-0 ${
                    idx === 0
                      ? "bg-primary text-primary-foreground shadow-[0_1px_6px_hsl(215_72%_44%/0.3)]"
                      : idx === 1
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Name + badge */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate text-[15px]">
                    {candidate.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`mt-0.5 font-medium text-[11px] px-2 py-0 h-5 ${recConfig.class}`}
                  >
                    {candidate.recommendation}
                  </Badge>
                </div>

                {/* Score ring */}
                <ScoreRing score={candidate.match_score} rank={idx} />
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 pt-5 border-t border-border/60">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-success">
                      Strengths
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {candidate.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground leading-snug flex items-start gap-2 animate-slide-in-right"
                        style={{ animationDelay: `${idx * 100 + i * 60 + 200}ms` }}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success/60 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-destructive">
                      Gaps
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {candidate.gaps.map((g, i) => (
                      <li
                        key={i}
                        className="text-[13px] text-foreground leading-snug flex items-start gap-2 animate-slide-in-right"
                        style={{ animationDelay: `${idx * 100 + i * 60 + 200}ms` }}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/60 shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
