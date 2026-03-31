import { useConstitution, useConstitutionVersion, useUpdateConstitution } from "@/hooks/useConstitutionalDAO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollText, Edit, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/genlayer/WalletProvider";

export default function ConstitutionPage() {
  const { data: constitution, isLoading } = useConstitution();
  const { data: version } = useConstitutionVersion();
  const { mutate: updateConstitution, isUpdating } = useUpdateConstitution();
  const { isConnected } = useWallet();

  const [open, setOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [reason, setReason] = useState("");

  const handleUpdate = () => {
    updateConstitution({ newText, reason }, {
      onSuccess: () => { setOpen(false); setNewText(""); setReason(""); },
    });
  };

  const textValid = newText.length >= 50 && newText.length <= 10000;
  const reasonValid = reason.length >= 1 && reason.length <= 500;
  const canSubmit = textValid && reasonValid && !isUpdating;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-gold-text flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-primary" />
            Constitution
          </h1>
          <p className="text-muted-foreground mt-1">
            The founding document governing this DAO
            {version !== undefined && (
              <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">v{version}</span>
            )}
          </p>
        </div>

        {isConnected && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                <Edit className="w-4 h-4 mr-1.5" />
                Propose Amendment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Update Constitution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">New Constitution Text</label>
                  <Textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter new constitution text (min 50 characters)..."
                    className="min-h-[200px] bg-secondary border-border"
                  />
                  <p className={`text-xs mt-1 ${newText.length < 50 ? "text-destructive" : "text-muted-foreground"}`}>
                    {newText.length}/10,000 characters {newText.length < 50 && `(need ${50 - newText.length} more)`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Reason for Update</label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this change needed?"
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs mt-1 text-muted-foreground">{reason.length}/500 characters</p>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={!canSubmit}
                  className="w-full gradient-gold text-primary-foreground font-semibold"
                >
                  {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update Constitution"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="brand-card">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-body bg-transparent border-0 p-0">
                {constitution || "No constitution loaded."}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
