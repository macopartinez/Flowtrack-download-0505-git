interface QuestionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

export function QuestionTextarea({ value, onChange, placeholder, hint }: QuestionTextareaProps) {
  return (
    <div className="w-full max-w-2xl">
      {hint && (
        <p className="text-sm text-gray-500 mb-3">{hint}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[120px] px-5 py-4 rounded-xl bg-[#1a1a1a] border border-white/30 text-white text-base placeholder:text-gray-600 focus:outline-none focus:border-[#02c950] focus:shadow-[0_0_20px_rgba(2,201,80,0.15)] transition-all resize-vertical"
        rows={4}
      />
    </div>
  );
}
