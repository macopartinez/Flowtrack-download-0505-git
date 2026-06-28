import { 
  Flame, 
  Thermometer, 
  Snowflake, 
  CheckCircle, 
  AlertCircle, 
  Crown, 
  Star, 
  Eye 
} from "lucide-react";

interface BadgeIconProps {
  iconName: string;
  className?: string;
}

export function BadgeIcon({ iconName, className = "w-3 h-3" }: BadgeIconProps) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame,
    Thermometer,
    Snowflake,
    CheckCircle,
    AlertCircle,
    Crown,
    Star,
    Eye,
  };

  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={className} />;
}
