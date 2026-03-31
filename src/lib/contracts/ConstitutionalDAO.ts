import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "./client";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  action_type: string;
  status: string;
  constitutional: boolean;
  votes_for: number;
  votes_against: number;
}

export interface ProposalSummary {
  id: string;
  title: string;
  status: string;
  constitutional: boolean;
}

export interface ConstitutionalReviewResult {
  constitutional: boolean;
  violations: string[];
  reasoning?: string;
}

export interface UpdateConstitutionResult {
  success: boolean;
  old_version: number;
  new_version: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  [key: string]: any;
}

class ConstitutionalDAOContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(address?: string | null) {
    this.contractAddress = CONTRACT_ADDRESS as `0x${string}`;
    const config: any = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({ chain: studionet, account: address as `0x${string}` });
  }

  async getConstitution(): Promise<string> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_constitution",
        args: [],
      });
      return String(result);
    } catch (error) {
      console.error("Error fetching constitution:", error);
      throw new Error("Failed to fetch constitution");
    }
  }

  async getConstitutionVersion(): Promise<number> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_constitution_version",
        args: [],
      });
      return Number(result);
    } catch (error) {
      console.error("Error fetching version:", error);
      throw new Error("Failed to fetch constitution version");
    }
  }

  async updateConstitution(newText: string, reason: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "update_constitution",
        args: [newText, reason],
        value: BigInt(0),
      });
      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });
      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error updating constitution:", error);
      throw error;
    }
  }

  async submitProposal(title: string, description: string, actionType: string): Promise<string> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_proposal",
        args: [title, description, actionType],
        value: BigInt(0),
      });
      const receipt: any = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });
      // The proposal ID is returned from the contract
      return receipt?.result || `prop_${Date.now()}`;
    } catch (error) {
      console.error("Error submitting proposal:", error);
      throw error;
    }
  }

  async constitutionalReview(proposalId: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "constitutional_review",
        args: [proposalId],
        value: BigInt(0),
      });
      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 48,
        interval: 5000,
      });
      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error during constitutional review:", error);
      throw error;
    }
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_proposal",
        args: [proposalId],
      });
      
      // Handle Map response from genlayer-js
      if (result instanceof Map) {
        const obj: any = {};
        result.forEach((v: any, k: any) => { obj[k] = v; });
        return {
          id: String(obj.id || proposalId),
          title: String(obj.title || ""),
          description: String(obj.description || ""),
          action_type: String(obj.action_type || ""),
          status: String(obj.status || "pending"),
          constitutional: Boolean(obj.constitutional),
          votes_for: Number(obj.votes_for || 0),
          votes_against: Number(obj.votes_against || 0),
        };
      }
      
      return {
        id: String(result.id || proposalId),
        title: String(result.title || ""),
        description: String(result.description || ""),
        action_type: String(result.action_type || ""),
        status: String(result.status || "pending"),
        constitutional: Boolean(result.constitutional),
        votes_for: Number(result.votes_for || 0),
        votes_against: Number(result.votes_against || 0),
      };
    } catch (error) {
      console.error("Error fetching proposal:", error);
      throw error;
    }
  }

  async getAllProposals(): Promise<ProposalSummary[]> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_proposals",
        args: [],
      });

      if (Array.isArray(result)) {
        return result.map((p: any) => {
          if (p instanceof Map) {
            const obj: any = {};
            p.forEach((v: any, k: any) => { obj[k] = v; });
            return {
              id: String(obj.id || ""),
              title: String(obj.title || ""),
              status: String(obj.status || "pending"),
              constitutional: Boolean(obj.constitutional),
            };
          }
          return {
            id: String(p.id || ""),
            title: String(p.title || ""),
            status: String(p.status || "pending"),
            constitutional: Boolean(p.constitutional),
          };
        });
      }

      return [];
    } catch (error) {
      console.error("Error fetching proposals:", error);
      throw new Error("Failed to fetch proposals");
    }
  }
}

export default ConstitutionalDAOContract;
