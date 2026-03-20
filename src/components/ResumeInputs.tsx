import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ResumeEntry {
  id: string;
  name: string;
  content: string;
}

interface Props {
  resumes: ResumeEntry[];
  onChange: (resumes: ResumeEntry[]) => void;
}

export function ResumeInputs({ resumes, onChange }: Props) {
  const addResume = () => {
    onChange([
      ...resumes,
      { id: crypto.randomUUID(), name: "", content: "" },
    ]);
  };

  const removeResume = (id: string) => {
    if (resumes.length <= 1) return;
    onChange(resumes.filter((r) => r.id !== id));
  };

  const updateResume = (id: string, field: "name" | "content", value: string) => {
    onChange(resumes.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Resumes ({resumes.length})
        </label>
        <Button variant="ghost" size="sm" onClick={addResume} className="gap-1.5 text-primary">
          <Plus className="h-4 w-4" />
          Add Resume
        </Button>
      </div>

      <div className="space-y-3">
        {resumes.map((resume, idx) => (
          <div
            key={resume.id}
            className="rounded-lg border bg-card p-4 space-y-3 transition-shadow hover:shadow-md"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary font-mono">
                {idx + 1}
              </span>
              <Input
                placeholder="Candidate name"
                value={resume.name}
                onChange={(e) => updateResume(resume.id, "name", e.target.value)}
                className="h-8 text-sm font-medium bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />
              {resumes.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeResume(resume.id)}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Paste resume content here…"
              value={resume.content}
              onChange={(e) => updateResume(resume.id, "content", e.target.value)}
              className="min-h-[100px] resize-y text-sm leading-relaxed bg-muted/40"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
