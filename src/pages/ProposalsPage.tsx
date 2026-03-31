import { useAllProposals } from "@/hooks/useConstitutionalDAO";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Loader2, ArrowRight } from "lucide-react";

export default function ProposalsPage() {
  const { data: proposals, isLoading, error } = useAllProposals();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-gold-text flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Proposals
        </h1>
        <p className="text-muted-foreground mt-1">All proposals submitted to the DAO</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="brand-card">
          <CardContent className="pt-6 text-center text-destructive">
            Failed to load proposals: {error.message}
          </CardContent>
        </Card>
      ) : !proposals?.length ? (
        <Card className="brand-card">
          <CardContent className="pt-6 text-center text-muted-foreground py-16">
            No proposals yet. Be the first to submit one!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Link key={p.id} to={`/proposal/${p.id}`}>
              <Card className="brand-card group cursor-pointer">
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{p.id}</span>
                    <span className="font-medium truncate">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={p.status} constitutional={p.constitutional} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
