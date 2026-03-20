import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function JobDescriptionInput({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">
        Job Description
      </label>
      <Textarea
        placeholder="Paste the full job description here — include required skills, experience level, responsibilities…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[160px] resize-y bg-card text-sm leading-relaxed"
      />
    </div>
  );
}
