import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { toast } from "sonner";

export interface ResumeEntry {
  id: string;
  name: string;
  content: string;
  fileName?: string;
}

interface Props {
  resumes: ResumeEntry[];
  onChange: (resumes: ResumeEntry[]) => void;
}

export function ResumeInputs({ resumes, onChange }: Props) {
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleFileUpload = async (id: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }

    setExtractingId(id);
    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        toast.error("Could not extract text. The PDF may be image-based.");
        return;
      }

      const candidateName = file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
      onChange(
        resumes.map((r) =>
          r.id === id
            ? {
                ...r,
                content: text,
                fileName: file.name,
                name: r.name || candidateName,
              }
            : r
        )
      );
      toast.success(`Extracted text from ${file.name}`);
    } catch (e) {
      console.error("PDF extraction error:", e);
      toast.error("Failed to read PDF. Try pasting the text instead.");
    } finally {
      setExtractingId(null);
    }
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
        {resumes.map((resume, idx) => {
          const isExtracting = extractingId === resume.id;
          return (
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

              {/* Upload button */}
              <div className="flex items-center gap-2">
                <input
                  ref={(el) => { fileInputRefs.current[resume.id] = el; }}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(resume.id, file);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isExtracting}
                  onClick={() => fileInputRefs.current[resume.id]?.click()}
                  className="gap-1.5 text-xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Extracting…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      Upload PDF
                    </>
                  )}
                </Button>
                {resume.fileName && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {resume.fileName}
                  </span>
                )}
              </div>

              <Textarea
                placeholder="Paste resume content here or upload a PDF above…"
                value={resume.content}
                onChange={(e) => updateResume(resume.id, "content", e.target.value)}
                className="min-h-[100px] resize-y text-sm leading-relaxed bg-muted/40"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
