import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import {
  useCastVote,
  useConstitutionalReview,
  useFinalizeProposal,
  useMemberVote,
  useProposal,
} from "@/hooks/useConstitutionalDAO";

export default function ProposalDetailPage() {
  const { id = "" } = useParams();
  const { data: proposal } = useProposal(id);
  const { data: myVote } = useMemberVote(id);
  const review = useConstitutionalReview();
  const castVote = useCastVote();
  const finalize = useFinalizeProposal();
  const { isConnected } = useWallet();

  if (!proposal) {
    return <div className="editorial-panel">Loading proposal...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="editorial-chip">{proposal.category}</div>
              <h1 className="mt-5 text-4xl leading-none">{proposal.title}</h1>
              <p className="mt-4 text-sm uppercase tracking-[0.25em] text-muted-foreground">
                {proposal.assigned_chamber.replace("_", " ")} · {proposal.status}
              </p>
            </div>
            <div className="editorial-chip">{proposal.constitutional ? "Constitutional" : "Blocked"}</div>
          </div>
          <div className="signal-line my-6" />
          <p className="max-w-3xl whitespace-pre-wrap text-base leading-8 text-foreground/85">{proposal.description}</p>
          {proposal.action_payload ? (
            <pre className="mt-6 overflow-auto rounded-[1.5rem] border border-foreground/15 bg-foreground p-4 text-sm text-background">
              {proposal.action_payload}
            </pre>
          ) : null}
        </div>

        <div className="col-span-12 editorial-panel lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Constitutional Report</p>
          <p className="mt-4 text-sm leading-7">{proposal.constitutional_reasoning}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {proposal.violations.length ? proposal.violations.map((violation) => <span key={violation} className="editorial-chip">{violation}</span>) : <span className="editorial-chip">No violations</span>}
          </div>
          <div className="signal-line my-6" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Quorum</dt>
              <dd>{proposal.quorum}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Threshold</dt>
              <dd>{(proposal.approval_threshold_bps / 100).toFixed(0)}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Review stage</dt>
              <dd>{proposal.review_stage}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="editorial-panel">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Vote Tally</p>
              <h2 className="mt-2 text-2xl">Chamber decision board</h2>
            </div>
            {myVote ? <div className="editorial-chip">You voted {myVote}</div> : null}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-foreground p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">For</div>
              <div className="mt-2 text-3xl font-bold">{proposal.votes_for}</div>
            </div>
            <div className="rounded-[1.5rem] border border-foreground p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Against</div>
              <div className="mt-2 text-3xl font-bold">{proposal.votes_against}</div>
            </div>
            <div className="rounded-[1.5rem] border border-foreground p-4">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Abstain</div>
              <div className="mt-2 text-3xl font-bold">{proposal.votes_abstain}</div>
            </div>
          </div>
        </div>

        <div className="editorial-panel">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Actions</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={!isConnected || review.isPending || proposal.status !== "pending_review"} onClick={() => review.mutate(id)} className="rounded-full">
              Run constitutional review
            </Button>
            <Button
              variant="outline"
              disabled={!isConnected || castVote.isPending || proposal.status !== "active_vote"}
              onClick={() => castVote.mutate({ proposalId: id, vote: "FOR" })}
              className="rounded-full"
            >
              Vote for
            </Button>
            <Button
              variant="outline"
              disabled={!isConnected || castVote.isPending || proposal.status !== "active_vote"}
              onClick={() => castVote.mutate({ proposalId: id, vote: "AGAINST" })}
              className="rounded-full"
            >
              Vote against
            </Button>
            <Button
              variant="outline"
              disabled={!isConnected || castVote.isPending || proposal.status !== "active_vote"}
              onClick={() => castVote.mutate({ proposalId: id, vote: "ABSTAIN" })}
              className="rounded-full"
            >
              Abstain
            </Button>
            <Button
              variant="outline"
              disabled={!isConnected || finalize.isPending || proposal.status !== "active_vote"}
              onClick={() => finalize.mutate(id)}
              className="rounded-full"
            >
              Finalize
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
