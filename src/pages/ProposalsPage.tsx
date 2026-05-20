import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAllProposals } from "@/hooks/useConstitutionalDAO";

const categoryOptions = ["", "TREASURY_SPEND", "PARAMETER_CHANGE", "MEMBERSHIP_DECISION", "CONSTITUTION_AMENDMENT"];

export default function ProposalsPage() {
  const { data: proposals = [] } = useAllProposals();
  const [category, setCategory] = useState("");

  const filtered = useMemo(
    () => (category ? proposals.filter((proposal) => proposal.category === category) : proposals),
    [category, proposals],
  );

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="editorial-chip">Proposal Board</div>
              <h1 className="mt-5 text-4xl leading-none sm:text-5xl">A chamber-aware board, not a generic governance backlog.</h1>
            </div>
            <div className="flex flex-wrap items-start gap-2 lg:justify-end">
              {categoryOptions.map((option) => (
                <Button
                  key={option || "all"}
                  variant="outline"
                  className={`rounded-full ${category === option ? "bg-foreground text-background" : ""}`}
                  onClick={() => setCategory(option)}
                >
                  {option || "ALL"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((proposal, index) => (
          <Link
            key={proposal.id}
            to={`/proposal/${proposal.id}`}
            className="editorial-panel transition-transform duration-200 hover:-translate-y-1"
            style={{ transform: `translateY(${index % 3 === 1 ? "1.1rem" : "0"})` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{proposal.assigned_chamber.replace("_", " ")}</p>
                <h2 className="mt-3 text-xl">{proposal.title}</h2>
              </div>
              <div className="editorial-chip">{proposal.status}</div>
            </div>
            <p className="mt-4 line-clamp-4 text-sm leading-7 text-muted-foreground">{proposal.description}</p>
            <div className="signal-line my-5" />
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span>{proposal.category}</span>
              <span>{proposal.constitutional ? "Constitutional" : "Blocked"}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
