import { useAllProposals, useChambers } from "@/hooks/useConstitutionalDAO";

export default function StatsPage() {
  const { data: proposals = [] } = useAllProposals();
  const { data: chambers = [] } = useChambers();

  return (
    <div className="space-y-6">
      <div className="editorial-panel">
        <div className="editorial-chip">Legacy Stats Route</div>
        <h1 className="mt-5 text-4xl leading-none">Governance snapshot</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-foreground p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Proposals</div>
            <div className="mt-3 text-3xl font-bold">{proposals.length}</div>
          </div>
          <div className="rounded-[1.5rem] border border-foreground p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Chambers</div>
            <div className="mt-3 text-3xl font-bold">{chambers.length}</div>
          </div>
          <div className="rounded-[1.5rem] border border-foreground p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Active Votes</div>
            <div className="mt-3 text-3xl font-bold">{proposals.filter((proposal) => proposal.status === "active_vote").length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
