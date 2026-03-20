import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ResumeInputs, type ResumeEntry } from "@/components/ResumeInputs";
import { ResultsTable } from "@/components/ResultsTable";
import { ScreeningHistory } from "@/components/ScreeningHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ScanSearch, RotateCcw, ArrowRight, Sparkles } from "lucide-react";

interface Candidate {
  resume_id: string;
  name: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  recommendation: "Strong Fit" | "Moderate Fit" | "Not Fit";
}

export default function Index() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumes, setResumes] = useState<ResumeEntry[]>([
    { id: crypto.randomUUID(), name: "", content: "" },
  ]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const canSubmit =
    jobDescription.trim().length > 20 &&
    resumes.some((r) => r.name.trim() && r.content.trim());

  const handleReset = () => {
    setJobDescription("");
    setResumes([{ id: crypto.randomUUID(), name: "", content: "" }]);
    setCandidates([]);
  };

  const handleScreen = async () => {
    const validResumes = resumes.filter((r) => r.name.trim() && r.content.trim());
    if (validResumes.length === 0) {
      toast.error("Add at least one resume with a name and content.");
      return;
    }

    setLoading(true);
    setCandidates([]);

    try {
      const { data, error } = await supabase.functions.invoke("screen-resumes", {
        body: {
          jobDescription,
          resumes: validResumes.map((r) => ({
            id: r.id,
            name: r.name,
            content: r.content,
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCandidates(data.candidates);
      toast.success(`Screened ${data.candidates.length} candidate${data.candidates.length !== 1 ? "s" : ""}`);

      const topScore = Math.max(...data.candidates.map((c: Candidate) => c.match_score));
      await supabase.from("screening_results").insert({
        job_description: jobDescription,
        candidates: data.candidates,
        resume_count: data.candidates.length,
        top_score: topScore,
      });
      setHistoryKey((k) => k + 1);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to screen resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = (entry: any) => {
    setJobDescription(entry.job_description);
    setCandidates(entry.candidates);
    setResumes([{ id: crypto.randomUUID(), name: "", content: "" }]);
    toast.success("Loaded previous screening results");
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleResumeChange = (updated: ResumeEntry[]) => {
  if (updated.length < resumes.length) {
    const removedIndex = resumes.findIndex(
      (r) => !updated.find((u) => u.id === r.id)
    );
    if (removedIndex !== -1) {
      setCandidates((prev) => {
        const newCandidates = [...prev];
        newCandidates.splice(removedIndex, 1);
        return newCandidates;
      });
    }
  }
  setResumes(updated);
};

  const hasContent =
    jobDescription.trim().length > 0 ||
    resumes.some((r) => r.name.trim() || r.content.trim());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-20">
        <div className="container max-w-5xl py-3.5 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary shadow-[0_2px_8px_hsl(215_72%_44%/0.25)]">
              <ScanSearch className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight text-foreground tracking-tight">
                Resume Screener
              </h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
                AI-Powered Screening
              </p>
            </div>
          </div>
          {(hasContent || candidates.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive active:scale-[0.96] transition-all duration-150"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Start Over</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
        {!hasContent && candidates.length === 0 && (
          <div className="text-center pt-2 pb-2 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">Powered by AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight px-4">
              Screen candidates in seconds
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-3 leading-relaxed px-4">
              Paste a job description and add resumes below. Our AI analyzes each
              candidate for strengths, gaps, and overall fit — ranked by match score.
            </p>
          </div>
        )}

        {candidates.length === 0 && (
          <ScreeningHistory key={historyKey} onLoad={handleLoadHistory} />
        )}

        <section className="space-y-4 sm:space-y-6 animate-fade-up">
          <div className="flex flex-col gap-4 sm:gap-6">
            <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
            <ResumeInputs resumes={resumes} onChange={handleResumeChange} />
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleScreen}
              disabled={!canSubmit || loading}
              size="lg"
              className="w-full sm:w-auto px-8 sm:px-10 gap-2.5 text-sm font-semibold shadow-[0_2px_12px_hsl(215_72%_44%/0.2)] hover:shadow-[0_4px_20px_hsl(215_72%_44%/0.3)] active:scale-[0.97] transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  Screen Candidates
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </section>

        {candidates.length > 0 && (
          <section className="pt-2" ref={resultsRef}>
            <ResultsTable
              candidates={candidates}
              onRemove={(resumeId) =>
                setCandidates((prev) => prev.filter((c) => c.resume_id !== resumeId))
              }
            />
          </section>
        )}
      </main>
    </div>
  );
}
