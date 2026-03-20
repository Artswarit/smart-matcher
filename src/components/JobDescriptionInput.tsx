import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function JobDescriptionInput({ value, onChange }: Props) {
  const charCount = value.length;
  const isShort = charCount > 0 && charCount <= 20;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          Job Description
        </label>
        <span className={`text-xs tabular-nums ${isShort ? "text-destructive" : "text-muted-foreground"}`}>
          {charCount > 0 && (
            <>
              {charCount} chars
              {isShort && " — too short"}
            </>
          )}
        </span>
      </div>
      <Textarea
        placeholder="Paste the full job description here — include required skills, experience level, responsibilities…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[160px] resize-y bg-card text-sm leading-relaxed"
      />
    </div>
  );
}
