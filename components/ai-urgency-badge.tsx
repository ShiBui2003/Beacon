"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getUrgencyBadgeColor, getUrgencyEmoji, type AIUrgency } from "@/lib/aiUrgency";

interface AIUrgencyBadgeProps {
  urgency?: AIUrgency | null;
  confidence?: number | null;
  isLoading?: boolean;
  showConfidence?: boolean;
  className?: string;
}

export default function AIUrgencyBadge({ 
  urgency, 
  confidence, 
  isLoading = false, 
  showConfidence = false,
  className = "" 
}: AIUrgencyBadgeProps) {
  if (isLoading) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">Detecting urgency...</span>
      </Badge>
    );
  }

  if (!urgency) {
    return (
      <Badge variant="outline" className={`bg-gray-100 text-gray-600 border-gray-200 ${className}`}>
        <span className="text-xs">⚪ Unknown</span>
      </Badge>
    );
  }

  const emoji = getUrgencyEmoji(urgency);
  const colorClass = getUrgencyBadgeColor(urgency);
  const urgencyText = urgency.charAt(0).toUpperCase() + urgency.slice(1);

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${colorClass} ${className}`}
    >
      <span className="text-xs">{emoji}</span>
      <span className="text-xs font-medium">{urgencyText}</span>
      {showConfidence && confidence && (
        <span className="text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </Badge>
  );
}
