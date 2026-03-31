import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ConstitutionalDAOContract from "@/lib/contracts/ConstitutionalDAO";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import type { Proposal, ProposalSummary } from "@/lib/contracts/ConstitutionalDAO";
import { toast } from "sonner";

export function useDAOContract(): ConstitutionalDAOContract {
  const { address } = useWallet();
  return useMemo(() => new ConstitutionalDAOContract(address), [address]);
}

export function useConstitution() {
  const contract = useDAOContract();
  return useQuery<string, Error>({
    queryKey: ["constitution"],
    queryFn: () => contract.getConstitution(),
    staleTime: 10000,
  });
}

export function useConstitutionVersion() {
  const contract = useDAOContract();
  return useQuery<number, Error>({
    queryKey: ["constitutionVersion"],
    queryFn: () => contract.getConstitutionVersion(),
    staleTime: 10000,
  });
}

export function useAllProposals() {
  const contract = useDAOContract();
  return useQuery<ProposalSummary[], Error>({
    queryKey: ["allProposals"],
    queryFn: () => contract.getAllProposals(),
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useProposal(proposalId: string | null) {
  const contract = useDAOContract();
  return useQuery<Proposal, Error>({
    queryKey: ["proposal", proposalId],
    queryFn: () => contract.getProposal(proposalId!),
    enabled: !!proposalId,
    staleTime: 3000,
    refetchInterval: 5000,
  });
}

export function useSubmitProposal() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ title, description, actionType }: { title: string; description: string; actionType: string }) => {
      setIsSubmitting(true);
      return contract.submitProposal(title, description, actionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
      setIsSubmitting(false);
      toast.success("Proposal submitted successfully!");
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      toast.error("Failed to submit proposal", { description: err?.message });
    },
  });

  return { ...mutation, isSubmitting };
}

export function useConstitutionalReview() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  const [isReviewing, setIsReviewing] = useState(false);

  const mutation = useMutation({
    mutationFn: async (proposalId: string) => {
      setIsReviewing(true);
      return contract.constitutionalReview(proposalId);
    },
    onSuccess: (_data, proposalId) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      queryClient.invalidateQueries({ queryKey: ["allProposals"] });
      setIsReviewing(false);
      toast.success("Constitutional review complete!");
    },
    onError: (err: any) => {
      setIsReviewing(false);
      toast.error("Constitutional review failed", { description: err?.message });
    },
  });

  return { ...mutation, isReviewing };
}

export function useUpdateConstitution() {
  const contract = useDAOContract();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ newText, reason }: { newText: string; reason: string }) => {
      setIsUpdating(true);
      return contract.updateConstitution(newText, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["constitution"] });
      queryClient.invalidateQueries({ queryKey: ["constitutionVersion"] });
      setIsUpdating(false);
      toast.success("Constitution updated successfully!");
    },
    onError: (err: any) => {
      setIsUpdating(false);
      toast.error("Failed to update constitution", { description: err?.message });
    },
  });

  return { ...mutation, isUpdating };
}
