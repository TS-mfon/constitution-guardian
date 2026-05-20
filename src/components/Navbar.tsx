import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { formatAddress } from "@/lib/genlayer/client";
import { Button } from "@/components/ui/button";
import { Landmark, LibraryBig, Network, PanelTopClose, Wallet, X, Menu } from "lucide-react";

const navItems = [
  { path: "/", label: "Charter", icon: Landmark },
  { path: "/chambers", label: "Chambers", icon: Network },
  { path: "/standards", label: "Standards", icon: LibraryBig },
  { path: "/proposals", label: "Proposals", icon: PanelTopClose },
  { path: "/submit", label: "Draft", icon: Landmark },
];

export function Navbar() {
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet, isLoading } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between rounded-full border border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground bg-accent text-accent-foreground">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="leading-none">
            <div className="font-display text-sm uppercase tracking-[0.35em] text-muted-foreground">Studionet</div>
            <div className="font-display text-lg font-bold">Constitutional DAO</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  className={active ? "rounded-full border border-foreground bg-foreground text-background" : "rounded-full"}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="hidden rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground md:block">
                {formatAddress(address, 18)}
              </div>
              <Button variant="outline" className="rounded-full" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button className="rounded-full" onClick={() => connectWallet()} disabled={isLoading}>
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? "Connecting" : "Connect"}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="rounded-full lg:hidden" onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="mx-4 mt-2 rounded-3xl border border-border bg-background/95 p-3 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map(({ path, label }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-2xl ${location.pathname === path ? "bg-foreground text-background" : ""}`}
                >
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
