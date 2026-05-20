import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitProposal } from "@/hooks/useConstitutionalDAO";
import type { ProposalCategory } from "@/lib/contracts/ConstitutionalDAO";

const categories: { value: ProposalCategory; label: string; hint: string }[] = [
  { value: "TREASURY_SPEND", label: "Treasury Spend", hint: "Routes to Treasury Council" },
  { value: "PARAMETER_CHANGE", label: "Parameter Change", hint: "Routes to Protocol Council" },
  { value: "MEMBERSHIP_DECISION", label: "Membership Decision", hint: "Routes to Membership Council" },
  { value: "CONSTITUTION_AMENDMENT", label: "Constitutional Amendment", hint: "Routes to Protocol Council" },
];

export default function SubmitProposalPage() {
  const submitProposal = useSubmitProposal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProposalCategory>("TREASURY_SPEND");
  const [actionPayload, setActionPayload] = useState("");

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel lg:col-span-4">
          <div className="editorial-chip">Drafting Desk</div>
          <h1 className="mt-5 text-4xl leading-none">Write for the chamber you need, not the room you happen to have.</h1>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            The submission flow is category-first. Pick the governance lane up front so constitutional review can judge
            the proposal against the correct decision standard.
          </p>
        </div>

        <div className="col-span-12 editorial-panel lg:col-span-8">
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`rounded-[1.5rem] border p-4 text-left transition-colors ${
                  category === option.value ? "border-foreground bg-foreground text-background" : "border-foreground/20"
                }`}
              >
                <div className="text-xs uppercase tracking-[0.25em]">{option.hint}</div>
                <div className="mt-3 font-display text-xl">{option.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Proposal title" />
            <Textarea
              className="min-h-[180px]"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the decision, its rationale, and what changes if it passes."
            />
            <Textarea
              className="min-h-[140px]"
              value={actionPayload}
              onChange={(event) => setActionPayload(event.target.value)}
              placeholder='Optional JSON payload. Example: {"amount_usd":15000,"recipient":"Ops Guild"}'
            />
            <Button
              className="w-fit rounded-full"
              disabled={submitProposal.isPending || title.length < 5 || description.length < 20}
              onClick={() => submitProposal.mutate({ title, description, category, actionPayload })}
            >
              {submitProposal.isPending ? "Routing..." : "Route proposal to constitutional review"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
