import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChambers, useChamberMembers, useSetChamberMember } from "@/hooks/useConstitutionalDAO";

export default function ChambersPage() {
  const { data: chambers = [] } = useChambers();
  const [selectedChamber, setSelectedChamber] = useState<string>("treasury_council");
  const { data: members = [] } = useChamberMembers(selectedChamber);
  const setMember = useSetChamberMember();
  const [memberAddress, setMemberAddress] = useState("");

  const activeChamber = useMemo(
    () => chambers.find((chamber) => chamber.chamber_id === selectedChamber) || chambers[0],
    [chambers, selectedChamber],
  );

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel lg:col-span-5">
          <div className="editorial-chip">Governance Architecture</div>
          <h1 className="mt-5 text-4xl leading-none">Three chambers, three review standards, one constitutional spine.</h1>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            Each chamber has its own quorum, approval threshold, and decision domain. This prevents treasury logic from
            inheriting membership risk and keeps amendments under a stricter burden of proof.
          </p>
        </div>

        <div className="col-span-12 grid gap-4 lg:col-span-7 md:grid-cols-3">
          {chambers.map((chamber) => (
            <button
              key={chamber.chamber_id}
              type="button"
              onClick={() => setSelectedChamber(chamber.chamber_id)}
              className={`editorial-panel text-left ${selectedChamber === chamber.chamber_id ? "bg-foreground text-background" : ""}`}
            >
              <div className="text-xs uppercase tracking-[0.25em]">{chamber.chamber_id.replace("_", " ")}</div>
              <div className="mt-4 font-display text-2xl">{chamber.label}</div>
              <div className="mt-4 text-sm leading-7">{chamber.review_standard}</div>
            </button>
          ))}
        </div>
      </section>

      {activeChamber ? (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="editorial-panel">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Current Rule Set</p>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Categories</div>
                <div className="mt-2 space-y-2">
                  {activeChamber.categories.map((category) => (
                    <div key={category} className="editorial-chip">{category}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Quorum</div>
                <div className="mt-2 text-3xl font-bold">{activeChamber.quorum}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Approval</div>
                <div className="mt-2 text-3xl font-bold">{(activeChamber.approval_threshold_bps / 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          <div className="editorial-panel">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Membership Control</p>
            <div className="mt-5 space-y-3">
              <Input value={memberAddress} onChange={(event) => setMemberAddress(event.target.value)} placeholder="0x committee member" />
              <div className="flex gap-2">
                <Button
                  className="rounded-full"
                  disabled={setMember.isPending || !memberAddress}
                  onClick={() => setMember.mutate({ chamberId: activeChamber.chamber_id, memberAddress, allowed: true })}
                >
                  Add member
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={setMember.isPending || !memberAddress}
                  onClick={() => setMember.mutate({ chamberId: activeChamber.chamber_id, memberAddress, allowed: false })}
                >
                  Remove
                </Button>
              </div>
              <div className="signal-line my-4" />
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member} className="rounded-2xl border border-foreground/15 px-4 py-3 text-sm">
                    {member}
                  </div>
                ))}
                {!members.length ? <p className="text-sm text-muted-foreground">No explicit members registered yet.</p> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
