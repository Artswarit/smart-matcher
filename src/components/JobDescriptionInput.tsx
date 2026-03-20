import { Textarea } from "@/components/ui/textarea";
import { Briefcase } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function JobDescriptionInput({ value, onChange }: Props) {
  const charCount = value.length;
  const isShort = charCount > 0 && charCount <= 20;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
          </div>
          <label className="text-sm font-semibold text-foreground">
            Job Description
          </label>
        </div>
        {charCount > 0 && (
          <span
            className={`text-[11px] font-mono tabular-nums transition-colors ${
              isShort ? "text-destructive font-medium" : "text-muted-foreground"
            }`}
          >
            {charCount} chars{isShort ? " · min 20" : ""}
          </span>
        )}
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/20">
        <Textarea
          placeholder="Paste the full job description — required skills, experience level, responsibilities…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[220px] lg:min-h-[320px] resize-none border-0 bg-transparent text-sm leading-relaxed focus-visible:ring-0 p-4"
        />
      </div>
    </div>
  );
}
