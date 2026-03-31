import { useAllProposals } from "@/hooks/useConstitutionalDAO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Shield, ShieldAlert, Clock, Loader2 } from "lucide-react";

export default function StatsPage() {
  const { data: proposals, isLoading } = useAllProposals();

  const total = proposals?.length || 0;
  const active = proposals?.filter(p => p.status === "active").length || 0;
  const blocked = proposals?.filter(p => p.status === "blocked").length || 0;
  const pending = proposals?.filter(p => p.status === "pending").length || 0;

  const stats = [
    { label: "Total Proposals", value: total, icon: BarChart3, color: "text-primary" },
    { label: "Active (Voting)", value: active, icon: Shield, color: "text-constitutional" },
    { label: "Blocked", value: blocked, icon: ShieldAlert, color: "text-blocked" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-pending" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-gold-text flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          DAO Stats
        </h1>
        <p className="text-muted-foreground mt-1">Overview of DAO governance activity</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="brand-card">
                <CardContent className="pt-6 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
                  <p className="text-3xl font-display font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {total > 0 && (
            <Card className="brand-card">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground font-body">Constitutional Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full h-4 bg-secondary rounded-full overflow-hidden flex">
                      {active > 0 && (
                        <div
                          className="h-full bg-constitutional"
                          style={{ width: `${(active / Math.max(active + blocked, 1)) * 100}%` }}
                        />
                      )}
                      {blocked > 0 && (
                        <div
                          className="h-full bg-blocked"
                          style={{ width: `${(blocked / Math.max(active + blocked, 1)) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {active + blocked > 0
                      ? `${Math.round((active / (active + blocked)) * 100)}% pass rate`
                      : "No reviewed proposals"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
