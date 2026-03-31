import { useParams } from "react-router-dom";
import { useProposal, useConstitutionalReview } from "@/hooks/useConstitutionalDAO";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Loader2, ShieldCheck, ShieldAlert, Brain, ThumbsUp, ThumbsDown } from "lucide-react";

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: proposal, isLoading, error } = useProposal(id || null);
  const { mutate: triggerReview, isReviewing } = useConstitutionalReview();
  const { isConnected } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <Card className="brand-card animate-fade-in">
        <CardContent className="pt-6 text-center text-destructive py-16">
          {error?.message || "Proposal not found"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">{proposal.id}</p>
          <h1 className="text-2xl font-display font-bold">{proposal.title}</h1>
        </div>
        <StatusBadge status={proposal.status} constitutional={proposal.constitutional} />
      </div>

      {/* Description */}
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-body">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{proposal.description}</p>
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <span>Action: <span className="text-foreground font-mono">{proposal.action_type}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Constitutional Review */}
      <Card className="brand-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-body flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Constitutional Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposal.status === "pending" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                This proposal has not been reviewed against the constitution yet.
                {isReviewing && " AI validators are analyzing the proposal..."}
              </p>
              {isConnected && (
                <Button
                  onClick={() => id && triggerReview(id)}
                  disabled={isReviewing}
                  className="gradient-gold text-primary-foreground font-semibold"
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI Reviewing... (5-30s)
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Trigger Constitutional Review
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : proposal.status === "active" ? (
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-constitutional shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-constitutional">Constitutional — Approved for Voting</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI validators determined this proposal does not violate the constitution.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-blocked shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blocked">Blocked — Violates Constitution</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI validators found constitutional violations. This proposal cannot proceed to voting.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting */}
      {proposal.status === "active" && (
        <Card className="brand-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-body">Voting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-constitutional" />
                <span className="text-2xl font-display font-bold">{proposal.votes_for}</span>
                <span className="text-sm text-muted-foreground">For</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-blocked" />
                <span className="text-2xl font-display font-bold">{proposal.votes_against}</span>
                <span className="text-sm text-muted-foreground">Against</span>
              </div>
            </div>
            {(proposal.votes_for + proposal.votes_against) > 0 && (
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-constitutional rounded-full transition-all"
                  style={{ width: `${(proposal.votes_for / (proposal.votes_for + proposal.votes_against)) * 100}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
