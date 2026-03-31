import { useState } from "react";
import { useSubmitProposal } from "@/hooks/useConstitutionalDAO";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACTION_TYPES = [
  { value: "fund_allocation", label: "Fund Allocation" },
  { value: "governance_change", label: "Governance Change" },
  { value: "partnership", label: "Partnership" },
  { value: "technical", label: "Technical Update" },
  { value: "other", label: "Other" },
];

export default function SubmitProposalPage() {
  const { isConnected } = useWallet();
  const { mutate: submitProposal, isSubmitting } = useSubmitProposal();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("fund_allocation");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const titleError = title.length > 0 && title.length < 5 ? `Need ${5 - title.length} more characters` : title.length > 200 ? "Too long" : null;
  const descError = description.length > 0 && description.length < 20 ? `Need ${20 - description.length} more characters` : null;
  const canSubmit = title.length >= 5 && title.length <= 200 && description.length >= 20 && isConnected && !isSubmitting;

  const handleSubmit = () => {
    submitProposal({ title, description, actionType }, {
      onSuccess: (proposalId) => {
        setSubmitted(typeof proposalId === 'string' ? proposalId : 'submitted');
      },
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="brand-card max-w-xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-constitutional mx-auto" />
            <h2 className="text-2xl font-display font-bold">Proposal Submitted!</h2>
            <p className="text-muted-foreground">
              Your proposal <span className="font-mono text-primary">{submitted}</span> has been submitted and is pending constitutional review.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate("/proposals")} className="border-border">
                View All Proposals
              </Button>
              <Button onClick={() => { setSubmitted(null); setTitle(""); setDescription(""); }} className="gradient-gold text-primary-foreground">
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-gold-text flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" />
          Submit Proposal
        </h1>
        <p className="text-muted-foreground mt-1">Submit a new proposal for constitutional review</p>
      </div>

      {!isConnected ? (
        <Card className="brand-card">
          <CardContent className="pt-6 text-center text-muted-foreground py-16">
            Please connect your wallet to submit a proposal.
          </CardContent>
        </Card>
      ) : (
        <Card className="brand-card max-w-2xl">
          <CardHeader>
            <CardTitle className="font-display">New Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title (5-200 characters)"
                className="bg-secondary border-border"
              />
              <div className="flex justify-between mt-1">
                {titleError && <p className="text-xs text-destructive">{titleError}</p>}
                <p className="text-xs text-muted-foreground ml-auto">{title.length}/200</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of your proposal (min 20 characters)"
                className="min-h-[150px] bg-secondary border-border"
              />
              <div className="flex justify-between mt-1">
                {descError && <p className="text-xs text-destructive">{descError}</p>}
                <p className="text-xs text-muted-foreground ml-auto">{description.length} characters</p>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Action Type</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gradient-gold text-primary-foreground font-semibold">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Proposal"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
