import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { formatAddress } from "@/lib/genlayer/client";
import { Button } from "@/components/ui/button";
import { ScrollText, FileText, PlusCircle, BarChart3, Wallet, LogOut, Menu, X } from "lucide-react";

const navItems = [
  { path: "/", label: "Constitution", icon: ScrollText },
  { path: "/proposals", label: "Proposals", icon: FileText },
  { path: "/submit", label: "Submit", icon: PlusCircle },
  { path: "/stats", label: "Stats", icon: BarChart3 },
];

export function Navbar() {
  const location = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet, isLoading } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" />
          <span className="font-display text-lg font-bold gradient-gold-text hidden sm:inline">
            Constitutional DAO
          </span>
          <span className="font-display text-lg font-bold gradient-gold-text sm:hidden">
            CDAO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Button
                variant={location.pathname === path ? "secondary" : "ghost"}
                size="sm"
                className={location.pathname === path ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                {formatAddress(address, 14)}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => connectWallet()}
              disabled={isLoading}
              className="gradient-gold text-primary-foreground font-semibold"
            >
              <Wallet className="w-4 h-4 mr-1.5" />
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={location.pathname === path ? "secondary" : "ghost"}
                  size="sm"
                  className={`w-full justify-start ${location.pathname === path ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
