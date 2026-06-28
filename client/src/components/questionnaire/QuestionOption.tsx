import { QuestionOption as QuestionOptionType } from "@/types/questionnaire";

interface QuestionOptionProps {
  option: QuestionOptionType | string;
  selected: boolean;
  onClick: () => void;
}

export function QuestionOption({ option, selected, onClick }: QuestionOptionProps) {
  const isObject = typeof option === 'object';
  const main = isObject ? option.main : option;
  const sub = isObject ? option.sub : undefined;

  return (
    <button
      onClick={onClick}
      className={`w-full px-6 py-4 rounded-xl text-left transition-all duration-300 border ${
        selected
          ? "bg-[#02c950]/25 border-[#02c950] shadow-[0_0_20px_rgba(2,201,80,0.3)] text-white"
          : "bg-[#1a1a1a] border-white/30 text-gray-400 hover:bg-[#222222] hover:border-white/40"
      }`}
    >
      <div className="font-medium text-base">{main}</div>
      {sub && (
        <div className="text-sm text-gray-500 mt-1">{sub}</div>
      )}
    </button>
  );
}
