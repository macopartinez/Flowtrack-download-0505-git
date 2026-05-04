import { WarningBox as WarningBoxType } from "@/types/questionnaire";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface WarningBoxProps {
  warning: WarningBoxType;
}

export function WarningBox({ warning }: WarningBoxProps) {
  const { type, title, content } = warning;

  const styles = {
    warning: {
      bg: "bg-[#2a1f1a]",
      border: "border-orange-500/50",
      icon: AlertTriangle,
      iconColor: "text-orange-500"
    },
    success: {
      bg: "bg-[#1a2a1f]",
      border: "border-[#02c950]/50",
      icon: CheckCircle,
      iconColor: "text-[#02c950]"
    },
    info: {
      bg: "bg-[#1a1f2a]",
      border: "border-blue-500/50",
      icon: Info,
      iconColor: "text-blue-500"
    }
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-5 mb-4`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div>
          <h4 className="font-semibold text-white mb-2">{title}</h4>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      </div>
    </div>
  );
}
