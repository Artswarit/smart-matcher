import { useRef, useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload, FileText, Loader2, User, FolderUp } from "lucide-react";
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
  const [batchExtracting, setBatchExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const batchInputRef = useRef<HTMLInputElement | null>(null);

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
            ? { ...r, content: text, fileName: file.name, name: r.name || candidateName }
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

  const handleBatchUpload = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      toast.error("No PDF files found. Only .pdf files are supported.");
      return;
    }

    setBatchExtracting(true);
    const newEntries: ResumeEntry[] = [];
    let successCount = 0;

    for (const file of pdfFiles) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10 MB limit, skipped.`);
        continue;
      }
      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
          toast.error(`Could not extract text from ${file.name}, skipped.`);
          continue;
        }
        const candidateName = file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
        newEntries.push({
          id: crypto.randomUUID(),
          name: candidateName,
          content: text,
          fileName: file.name,
        });
        successCount++;
      } catch {
        toast.error(`Failed to read ${file.name}, skipped.`);
      }
    }

    if (newEntries.length > 0) {
      // Replace empty first entry or append
      const hasEmptyFirst = resumes.length === 1 && !resumes[0].name.trim() && !resumes[0].content.trim();
      onChange(hasEmptyFirst ? newEntries : [...resumes, ...newEntries]);
      toast.success(`Added ${successCount} resume${successCount !== 1 ? "s" : ""}`);
    }

    setBatchExtracting(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleBatchUpload(e.dataTransfer.files);
    }
  }, [resumes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10">
            <FileText className="h-3.5 w-3.5 text-success" />
          </div>
          <label className="text-sm font-semibold text-foreground">
            Resumes
          </label>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            ({resumes.filter(r => r.content.trim()).length}/{resumes.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={batchInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleBatchUpload(e.target.files);
              }
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={batchExtracting}
            onClick={() => batchInputRef.current?.click()}
            className="gap-1.5 text-xs font-semibold text-success hover:text-success hover:bg-success/8 active:scale-[0.96] transition-all duration-150"
          >
            {batchExtracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderUp className="h-3.5 w-3.5" />
            )}
            Batch Upload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addResume}
            className="gap-1.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/8 active:scale-[0.96] transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-border"
        }`}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FolderUp className="h-5 w-5" />
              Drop PDF files here
            </div>
          </div>
        )}

        <div className="space-y-3 p-1">
          {resumes.map((resume, idx) => {
            const isExtracting = extractingId === resume.id;
            const hasFill = resume.content.trim().length > 0;

            return (
              <div
                key={resume.id}
                className={`rounded-xl border bg-card p-4 space-y-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                  hasFill ? "border-success/30" : ""
                }`}
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                {/* Header row */}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder="Candidate name"
                    value={resume.name}
                    onChange={(e) => updateResume(resume.id, "name", e.target.value)}
                    className="h-8 text-sm font-medium bg-transparent border-0 border-b border-border/60 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                  />
                  <div className="flex items-center gap-1 shrink-0">
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
                      variant="ghost"
                      size="icon"
                      disabled={isExtracting}
                      onClick={() => fileInputRefs.current[resume.id]?.click()}
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      title="Upload PDF"
                    >
                      {isExtracting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    {resumes.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeResume(resume.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* File indicator */}
                {resume.fileName && (
                  <div className="flex items-center gap-1.5 pl-[38px]">
                    <FileText className="h-3 w-3 text-success" />
                    <span className="text-[11px] font-medium text-success truncate max-w-[200px]">
                      {resume.fileName}
                    </span>
                  </div>
                )}

                {/* Content */}
                <Textarea
                  placeholder="Paste resume content or upload a PDF…"
                  value={resume.content}
                  onChange={(e) => updateResume(resume.id, "content", e.target.value)}
                  className="min-h-[90px] resize-y text-sm leading-relaxed bg-muted/30 border-muted focus-visible:ring-1 focus-visible:ring-ring/30"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
