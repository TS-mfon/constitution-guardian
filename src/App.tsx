import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";
import { Navbar } from "@/components/Navbar";
import ConstitutionPage from "@/pages/ConstitutionPage";
import ProposalsPage from "@/pages/ProposalsPage";
import SubmitProposalPage from "@/pages/SubmitProposalPage";
import ProposalDetailPage from "@/pages/ProposalDetailPage";
import StatsPage from "@/pages/StatsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <main className="pt-20 pb-12 px-4 md:px-6 lg:px-8">
            <div className="container mx-auto max-w-5xl">
              <Routes>
                <Route path="/" element={<ConstitutionPage />} />
                <Route path="/proposals" element={<ProposalsPage />} />
                <Route path="/submit" element={<SubmitProposalPage />} />
                <Route path="/proposal/:id" element={<ProposalDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
