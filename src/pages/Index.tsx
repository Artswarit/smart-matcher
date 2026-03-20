import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JobDescriptionInput } from "@/components/JobDescriptionInput";
import { ResumeInputs, type ResumeEntry } from "@/components/ResumeInputs";
import { ResultsTable } from "@/components/ResultsTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ScanSearch, RotateCcw, FileText, Briefcase } from "lucide-react";

interface Candidate {
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

  const canSubmit =
    jobDescription.trim().length > 20 &&
    resumes.some((r) => r.name.trim() && r.content.trim());

  const handleReset = () => {
    setJobDescription("");
    setResumes([{ id: crypto.randomUUID(), name: "", content: "" }]);
    setCandidates([]);
    toast.info("Cleared all inputs");
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
          resumes: validResumes.map((r) => ({ name: r.name, content: r.content })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCandidates(data.candidates);
      toast.success(`Screened ${data.candidates.length} candidates`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to screen resumes");
    } finally {
      setLoading(false);
    }
  };

  const hasContent = jobDescription.trim().length > 0 || resumes.some((r) => r.name.trim() || r.content.trim());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ScanSearch className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                Resume Screener
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-powered candidate screening
              </p>
            </div>
          </div>
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-muted-foreground hover:text-destructive active:scale-[0.97] transition-transform"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-8">
        {/* Empty state guidance */}
        {!hasContent && candidates.length === 0 && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="flex justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-foreground">Screen candidates in seconds</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Paste a job description, add resumes (or upload PDFs), and get AI-powered scoring with strengths, gaps, and fit recommendations.
              </p>
            </div>
          </div>
        )}

        <section className="space-y-6 animate-fade-up">
          <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
          <ResumeInputs resumes={resumes} onChange={setResumes} />

          <Button
            onClick={handleScreen}
            disabled={!canSubmit || loading}
            size="lg"
            className="w-full active:scale-[0.98] transition-transform"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing resumes…
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                Screen Candidates
              </>
            )}
          </Button>
        </section>

        {candidates.length > 0 && (
          <section>
            <ResultsTable candidates={candidates} />
          </section>
        )}
      </main>
    </div>
  );
}
