import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, Clock, Users, Trophy, ChevronRight, Trash2 } from "lucide-react";

interface HistoryEntry {
  id: string;
  job_description: string;
  candidates: any[];
  resume_count: number;
  top_score: number | null;
  created_at: string;
}

interface Props {
  onLoad: (entry: HistoryEntry) => void;
}

export function ScreeningHistory({ onLoad }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("screening_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setEntries(data as HistoryEntry[]);
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!confirm("Clear all screening history? This cannot be undone.")) return;
    const { error } = await supabase
      .from("screening_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (!error) {
      setEntries([]);
    }
  };

  if (loading || entries.length === 0) return null;

  const displayed = expanded ? entries : entries.slice(0, 3);

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <History className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Recent Screenings</h3>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            ({entries.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground"
            >
              {expanded ? "Show less" : `Show all ${entries.length}`}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        {displayed.map((entry) => {
          const jdPreview = entry.job_description.slice(0, 80).trim();
          const date = new Date(entry.created_at);
          const timeAgo = getTimeAgo(date);

          return (
            <button
              key={entry.id}
              onClick={() => onLoad(entry)}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {jdPreview}…
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {entry.resume_count} candidate{entry.resume_count !== 1 ? "s" : ""}
                  </span>
                  {entry.top_score !== null && (
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Top: {entry.top_score}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
