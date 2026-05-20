import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useConstitution,
  useConstitutionVersion,
  useGovernanceOverview,
  useTemplates,
  useUpdateConstitution,
} from "@/hooks/useConstitutionalDAO";
import { useWallet } from "@/lib/genlayer/WalletProvider";

export default function ConstitutionPage() {
  const { data: constitution } = useConstitution();
  const { data: version } = useConstitutionVersion();
  const { data: overview } = useGovernanceOverview();
  const { data: templates = [] } = useTemplates();
  const updateConstitution = useUpdateConstitution();
  const { isConnected } = useWallet();

  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel lg:col-span-7">
          <div className="editorial-chip mb-6">Active Charter</div>
          <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr]">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.35em] text-muted-foreground">Version {version ?? 0}</p>
              <h1 className="max-w-2xl text-4xl leading-none sm:text-5xl">
                Constitutional governance that routes each decision to the right chamber.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">
                Treasury spends, protocol changes, membership calls, and amendments no longer share a single review lane.
                The charter now acts like a living operating manual, not a static text blob.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/proposals">
                  <Button className="rounded-full">Open proposal board</Button>
                </Link>
                <Link to="/standards">
                  <Button variant="outline" className="rounded-full">
                    Browse constitutional library
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-foreground bg-foreground p-5 text-background">
              <div className="text-xs uppercase tracking-[0.25em] text-background/70">Snapshot</div>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-background/60">Active Template</dt>
                  <dd className="mt-1 text-xl font-semibold">{overview?.active_template_id || "template-0"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-background/60">Templates</dt>
                  <dd className="mt-1 text-xl font-semibold">{overview?.total_templates ?? templates.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-background/60">Proposals Routed</dt>
                  <dd className="mt-1 text-xl font-semibold">{overview?.total_proposals ?? 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="col-span-12 editorial-panel lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Current Text</p>
              <h2 className="mt-2 text-2xl">Clause stack</h2>
            </div>
            {isConnected ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    Amend
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Update constitution</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      className="min-h-[220px]"
                      value={newText}
                      onChange={(event) => setNewText(event.target.value)}
                      placeholder="Paste the revised constitutional text."
                    />
                    <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for the amendment" />
                    <Button
                      className="rounded-full"
                      disabled={updateConstitution.isPending || newText.length < 50 || reason.length < 3}
                      onClick={() =>
                        updateConstitution.mutate(
                          { newText, reason },
                          {
                            onSuccess: () => {
                              setOpen(false);
                              setNewText("");
                              setReason("");
                            },
                          },
                        )
                      }
                    >
                      {updateConstitution.isPending ? "Submitting..." : "Publish amendment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>

          <div className="signal-line my-5" />
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-foreground/85">
            {constitution || "No constitution loaded."}
          </pre>
        </div>
      </section>
    </div>
  );
}
