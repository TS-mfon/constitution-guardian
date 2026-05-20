import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ConstitutionalDAOContract, {
  type ProposalCategory,
  type Proposal,
} from "@/lib/contracts/ConstitutionalDAO";
import { useWallet } from "@/lib/genlayer/WalletProvider";

export function useDAOContract() {
  const { address } = useWallet();
  return useMemo(() => new ConstitutionalDAOContract(address), [address]);
}

export function useConstitution() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["constitution"],
    queryFn: () => contract.getConstitution(),
    staleTime: 10000,
  });
}

export function useConstitutionVersion() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["constitutionVersion"],
    queryFn: () => contract.getConstitutionVersion(),
    staleTime: 10000,
  });
}

export function useGovernanceOverview() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["governanceOverview"],
    queryFn: () => contract.getGovernanceOverview(),
    staleTime: 10000,
  });
}

export function useChambers() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["chambers"],
    queryFn: () => contract.getChambers(),
    staleTime: 10000,
  });
}

export function useChamberMembers(chamberId: string | null) {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["chamberMembers", chamberId],
    queryFn: () => contract.getChamberMembers(chamberId || ""),
    enabled: !!chamberId,
    staleTime: 10000,
  });
}

export function useTemplates() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => contract.getTemplates(),
    staleTime: 10000,
  });
}

export function useAllProposals() {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["allProposals"],
    queryFn: () => contract.getAllProposals(),
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useProposalsByCategory(category: ProposalCategory | "") {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["proposalsByCategory", category],
    queryFn: () => (category ? contract.getProposalsByCategory(category) : contract.getAllProposals()),
    staleTime: 5000,
  });
}

export function useProposal(proposalId: string | null) {
  const contract = useDAOContract();
  return useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: () => contract.getProposal(proposalId || ""),
    enabled: !!proposalId,
    staleTime: 3000,
    refetchInterval: (query) => {
      const proposal = query.state.data as Proposal | undefined;
      return proposal && ["pending_review", "active_vote"].includes(proposal.status) ? 5000 : false;
    },
  });
}

export function useMemberVote(proposalId: string | null) {
  const contract = useDAOContract();
  const { address } = useWallet();
  return useQuery({
    queryKey: ["proposalVote", proposalId, address],
    queryFn: () => contract.getMemberVote(proposalId || "", address || ""),
    enabled: !!proposalId && !!address,
  });
}

export function useSubmitProposal() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      description,
      category,
      actionPayload,
    }: {
      title: string;
      description: string;
      category: ProposalCategory;
      actionPayload: string;
    }) => contract.submitProposal(title, description, category, actionPayload),
    onSuccess: () => {
      toast.success("Proposal routed to chamber review.");
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
      queryClient.invalidateQueries({ queryKey: ["governanceOverview"] });
    },
    onError: (error: Error) => toast.error("Proposal submission failed", { description: error.message }),
  });
}

export function useConstitutionalReview() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => contract.constitutionalReview(proposalId),
    onSuccess: () => {
      toast.success("Constitutional review complete.");
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
    },
    onError: (error: Error) => toast.error("Review failed", { description: error.message }),
  });
}

export function useCastVote() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ proposalId, vote }: { proposalId: string; vote: "FOR" | "AGAINST" | "ABSTAIN" }) =>
      contract.castVote(proposalId, vote),
    onSuccess: () => {
      toast.success("Vote recorded.");
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
    },
    onError: (error: Error) => toast.error("Vote failed", { description: error.message }),
  });
}

export function useFinalizeProposal() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (proposalId: string) => contract.finalizeProposal(proposalId),
    onSuccess: () => {
      toast.success("Proposal finalized.");
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
    },
    onError: (error: Error) => toast.error("Finalize failed", { description: error.message }),
  });
}

export function useUpdateConstitution() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newText, reason }: { newText: string; reason: string }) =>
      contract.updateConstitution(newText, reason),
    onSuccess: () => {
      toast.success("Constitution updated.");
      queryClient.invalidateQueries({ queryKey: ["constitution"] });
      queryClient.invalidateQueries({ queryKey: ["constitutionVersion"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });
}

export function useRegisterTemplate() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      summary,
      templateText,
      tagsJson,
    }: {
      name: string;
      summary: string;
      templateText: string;
      tagsJson: string;
    }) => contract.registerTemplate(name, summary, templateText, tagsJson),
    onSuccess: () => {
      toast.success("Template registered.");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["governanceOverview"] });
    },
    onError: (error: Error) => toast.error("Template registration failed", { description: error.message }),
  });
}

export function useAdoptTemplate() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, rationale }: { templateId: string; rationale: string }) =>
      contract.adoptTemplate(templateId, rationale),
    onSuccess: () => {
      toast.success("Template adopted as the active constitution.");
      queryClient.invalidateQueries({ queryKey: ["constitution"] });
      queryClient.invalidateQueries({ queryKey: ["constitutionVersion"] });
      queryClient.invalidateQueries({ queryKey: ["governanceOverview"] });
    },
    onError: (error: Error) => toast.error("Template adoption failed", { description: error.message }),
  });
}

export function useSetChamberMember() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chamberId,
      memberAddress,
      allowed,
    }: {
      chamberId: string;
      memberAddress: string;
      allowed: boolean;
    }) => contract.setChamberMember(chamberId, memberAddress, allowed),
    onSuccess: () => {
      toast.success("Chamber membership updated.");
      queryClient.invalidateQueries({ queryKey: ["chamberMembers"] });
    },
    onError: (error: Error) => toast.error("Membership update failed", { description: error.message }),
  });
}
