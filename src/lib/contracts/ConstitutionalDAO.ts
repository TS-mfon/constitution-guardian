import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export type ChamberId = "treasury_council" | "protocol_council" | "membership_council" | string;
export type ProposalCategory =
  | "TREASURY_SPEND"
  | "PARAMETER_CHANGE"
  | "MEMBERSHIP_DECISION"
  | "CONSTITUTION_AMENDMENT"
  | string;

export interface ChamberRule {
  chamber_id: ChamberId;
  label: string;
  categories: ProposalCategory[];
  quorum: number;
  approval_threshold_bps: number;
  review_standard: string;
}

export interface ConstitutionalTemplate {
  template_id: string;
  name: string;
  summary: string;
  template_text: string;
  tags: string[];
  created_version: number;
}

export interface Proposal {
  id: string;
  proposer: string;
  title: string;
  description: string;
  category: ProposalCategory;
  action_payload: string;
  assigned_chamber: ChamberId;
  status: string;
  constitutional: boolean;
  constitutional_reasoning: string;
  violations: string[];
  quorum: number;
  approval_threshold_bps: number;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  review_stage: string;
  template_snapshot_id: string;
  finalized: boolean;
}

export interface GovernanceOverview {
  constitution_version: number;
  active_template_id: string;
  total_proposals: number;
  total_templates: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  [key: string]: unknown;
}

class ConstitutionalDAOContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(address?: string | null) {
    this.contractAddress = CONTRACT_ADDRESS as `0x${string}`;
    const config: { chain: typeof studionet; account?: `0x${string}` } = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  private parseResult<T>(raw: unknown): T {
    if (raw instanceof Map) {
      const obj: Record<string, unknown> = {};
      raw.forEach((value, key) => {
        obj[String(key)] = this.parseResult(value);
      });
      return obj as T;
    }
    if (Array.isArray(raw)) {
      return raw.map((value) => this.parseResult(value)) as T;
    }
    return raw as T;
  }

  private async waitForAccepted(hash: `0x${string}`) {
    return this.client.waitForTransactionReceipt({
      hash: hash as never,
      status: "ACCEPTED" as never,
      retries: 48,
      interval: 5000,
    }) as Promise<TransactionReceipt>;
  }

  async getConstitution(): Promise<string> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_constitution",
      args: [],
    });
    return String(result || "");
  }

  async getConstitutionVersion(): Promise<number> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_constitution_version",
      args: [],
    });
    return Number(result || 0);
  }

  async getGovernanceOverview(): Promise<GovernanceOverview> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_governance_overview",
      args: [],
    });
    return this.parseResult<GovernanceOverview>(result);
  }

  async getChambers(): Promise<ChamberRule[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_chambers",
      args: [],
    });
    return this.parseResult<ChamberRule[]>(result);
  }

  async getChamberMembers(chamberId: string): Promise<string[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_chamber_members",
      args: [chamberId],
    });
    return this.parseResult<string[]>(result);
  }

  async getTemplates(): Promise<ConstitutionalTemplate[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_templates",
      args: [],
    });
    return this.parseResult<ConstitutionalTemplate[]>(result);
  }

  async getTemplate(templateId: string): Promise<ConstitutionalTemplate> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_template",
      args: [templateId],
    });
    return this.parseResult<ConstitutionalTemplate>(result);
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_proposal",
      args: [proposalId],
    });
    return this.parseResult<Proposal>(result);
  }

  async getAllProposals(): Promise<Proposal[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_all_proposals",
      args: [],
    });
    return this.parseResult<Proposal[]>(result);
  }

  async getProposalsByCategory(category: ProposalCategory): Promise<Proposal[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_proposals_by_category",
      args: [category],
    });
    return this.parseResult<Proposal[]>(result);
  }

  async getMemberVote(proposalId: string, memberAddress: string): Promise<string> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_member_vote",
      args: [proposalId, memberAddress],
    });
    return String(result || "");
  }

  async submitProposal(title: string, description: string, category: ProposalCategory, actionPayload: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "submit_proposal",
      args: [title, description, category, actionPayload],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async constitutionalReview(proposalId: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "constitutional_review",
      args: [proposalId],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async castVote(proposalId: string, vote: "FOR" | "AGAINST" | "ABSTAIN") {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "cast_vote",
      args: [proposalId, vote],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async finalizeProposal(proposalId: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "finalize_proposal",
      args: [proposalId],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async updateConstitution(newText: string, reason: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "update_constitution",
      args: [newText, reason],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async registerTemplate(name: string, summary: string, templateText: string, tagsJson: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "register_template",
      args: [name, summary, templateText, tagsJson],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async adoptTemplate(templateId: string, rationale: string) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "adopt_template",
      args: [templateId, rationale],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }

  async setChamberMember(chamberId: string, memberAddress: string, allowed: boolean) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "set_chamber_member",
      args: [chamberId, memberAddress, allowed],
      value: BigInt(0),
    });
    return this.waitForAccepted(hash);
  }
}

export default ConstitutionalDAOContract;
