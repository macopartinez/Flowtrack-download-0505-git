interface QuestionScaleProps {
  steps: number;
  minLabel: string;
  maxLabel: string;
  selected: number | null;
  onSelect: (value: number) => void;
}

export function QuestionScale({ steps, minLabel, maxLabel, selected, onSelect }: QuestionScaleProps) {
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: steps }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`flex-1 py-3 rounded-xl text-base font-medium transition-all duration-300 border ${
              selected === value
                ? "bg-[#02c950]/25 border-[#02c950] shadow-[0_0_20px_rgba(2,201,80,0.3)] text-white"
                : "bg-[#1a1a1a] border-white/30 text-gray-400 hover:bg-[#222222] hover:border-white/40"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
