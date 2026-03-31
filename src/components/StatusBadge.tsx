import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  constitutional?: boolean;
}

export function StatusBadge({ status, constitutional }: StatusBadgeProps) {
  if (status === "active") {
    return (
      <Badge className="status-constitutional gap-1">
        <Shield className="w-3 h-3" />
        Open for Voting
      </Badge>
    );
  }

  if (status === "blocked") {
    return (
      <Badge className="status-blocked gap-1">
        <ShieldAlert className="w-3 h-3" />
        Blocked
      </Badge>
    );
  }

  return (
    <Badge className="status-pending gap-1">
      <Clock className="w-3 h-3" />
      Pending Review
    </Badge>
  );
}
