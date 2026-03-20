import { Badge } from "@/components/ui/badge";

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

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-mono font-semibold w-8 tabular-nums">{score}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const styles: Record<string, string> = {
    "Strong Fit": "bg-success/15 text-success border-success/20",
    "Moderate Fit": "bg-warning/15 text-warning border-warning/20",
    "Not Fit": "bg-destructive/15 text-destructive border-destructive/20",
  };

  return (
    <Badge variant="outline" className={`font-medium text-xs ${styles[rec] || ""}`}>
      {rec}
    </Badge>
  );
}

export function ResultsTable({ candidates }: Props) {
  if (candidates.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-up">
      <h2 className="text-xl font-bold text-foreground">
        Screening Results
      </h2>
      <p className="text-sm text-muted-foreground">
        {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} ranked by match score
      </p>

      <div className="space-y-3">
        {candidates.map((candidate, idx) => (
          <div
            key={candidate.name}
            className="rounded-xl border bg-card p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  #{idx + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                  <RecommendationBadge rec={candidate.recommendation} />
                </div>
              </div>
            </div>

            <ScoreBar score={candidate.match_score} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-success">
                  Strengths
                </p>
                <ul className="space-y-1">
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Gaps
                </p>
                <ul className="space-y-1">
                  {candidate.gaps.map((g, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
