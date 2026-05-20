# { "Depends": "py-genlayer:test" }

from dataclasses import dataclass
import json

from genlayer import *


ERROR_EXPECTED = "[EXPECTED]"
ERROR_LLM = "[LLM_ERROR]"


def _json_list(raw: str) -> list:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _member_key(chamber_id: str, member: Address) -> str:
    return chamber_id + ":" + member.as_hex


def _vote_key(proposal_id: str, member: Address) -> str:
    return proposal_id + ":" + member.as_hex


@allow_storage
@dataclass
class ChamberRule:
    chamber_id: str
    label: str
    categories_json: str
    quorum: u256
    approval_threshold_bps: u256
    review_standard: str


@allow_storage
@dataclass
class ConstitutionalTemplate:
    template_id: str
    name: str
    summary: str
    template_text: str
    tags_json: str
    created_version: u256


@allow_storage
@dataclass
class Proposal:
    id: str
    proposer: str
    title: str
    description: str
    category: str
    action_payload: str
    assigned_chamber: str
    status: str
    constitutional: bool
    constitutional_reasoning: str
    violations_json: str
    quorum: u256
    approval_threshold_bps: u256
    votes_for: u256
    votes_against: u256
    votes_abstain: u256
    review_stage: str
    template_snapshot_id: str
    finalized: bool


class ConstitutionalDAO(gl.Contract):
    owner: Address
    constitution: str
    constitution_version: u256
    active_template_id: str
    total_proposals: u256
    total_templates: u256
    proposals: TreeMap[str, Proposal]
    proposal_order: DynArray[str]
    templates: TreeMap[str, ConstitutionalTemplate]
    template_order: DynArray[str]
    chamber_rules: TreeMap[str, ChamberRule]
    chamber_order: DynArray[str]
    chamber_members: TreeMap[str, bool]
    chamber_member_order: DynArray[str]
    member_votes: TreeMap[str, str]

    def __init__(self, constitution_text: str):
        if len(constitution_text) < 50:
            raise gl.UserError(f"{ERROR_EXPECTED} Constitution too short")

        self.owner = gl.message.sender_address
        self.constitution = constitution_text[:12000]
        self.constitution_version = u256(1)
        self.total_proposals = u256(0)
        self.total_templates = u256(0)
        self.active_template_id = "template-0"

        self._seed_chambers()
        self._register_template_internal(
            "Founding Charter",
            "The original constitutional text adopted at launch.",
            self.constitution,
            json.dumps(["founding", "default"]),
        )

    def _seed_chambers(self) -> None:
        self._set_chamber_rule_internal(
            "treasury_council",
            "Treasury Council",
            json.dumps(["TREASURY_SPEND"]),
            3,
            6500,
            "Budget safety, mission alignment, treasury prudence",
        )
        self._set_chamber_rule_internal(
            "protocol_council",
            "Protocol Council",
            json.dumps(["PARAMETER_CHANGE", "CONSTITUTION_AMENDMENT"]),
            3,
            7000,
            "Long-term constitutional consistency and parameter risk",
        )
        self._set_chamber_rule_internal(
            "membership_council",
            "Membership Council",
            json.dumps(["MEMBERSHIP_DECISION"]),
            2,
            6000,
            "Reputation, conduct, and collective trust",
        )

    def _set_chamber_rule_internal(
        self,
        chamber_id: str,
        label: str,
        categories_json: str,
        quorum: int,
        approval_threshold_bps: int,
        review_standard: str,
    ) -> None:
        if chamber_id not in self.chamber_rules:
            self.chamber_order.append(chamber_id)
        self.chamber_rules[chamber_id] = ChamberRule(
            chamber_id=chamber_id,
            label=label[:80],
            categories_json=categories_json,
            quorum=u256(quorum),
            approval_threshold_bps=u256(approval_threshold_bps),
            review_standard=review_standard[:500],
        )

    def _register_template_internal(self, name: str, summary: str, template_text: str, tags_json: str) -> str:
        template_id = "template-" + str(int(self.total_templates))
        self.total_templates += 1
        self.templates[template_id] = ConstitutionalTemplate(
            template_id=template_id,
            name=name[:80],
            summary=summary[:280],
            template_text=template_text[:12000],
            tags_json=tags_json[:1200],
            created_version=self.constitution_version,
        )
        self.template_order.append(template_id)
        return template_id

    def _resolve_chamber_for_category(self, category: str) -> str:
        for chamber_id in self.chamber_order:
            rule = self.chamber_rules[chamber_id]
            if category in _json_list(rule.categories_json):
                return chamber_id
        raise gl.UserError(f"{ERROR_EXPECTED} Unknown category")

    def _is_member(self, chamber_id: str, member: Address) -> bool:
        if member == self.owner:
            return True
        key = _member_key(chamber_id, member)
        return key in self.chamber_members and bool(self.chamber_members[key])

    def _proposal_to_dict(self, proposal: Proposal) -> dict:
        return {
            "id": proposal.id,
            "proposer": proposal.proposer,
            "title": proposal.title,
            "description": proposal.description,
            "category": proposal.category,
            "action_payload": proposal.action_payload,
            "assigned_chamber": proposal.assigned_chamber,
            "status": proposal.status,
            "constitutional": proposal.constitutional,
            "constitutional_reasoning": proposal.constitutional_reasoning,
            "violations": _json_list(proposal.violations_json),
            "quorum": int(proposal.quorum),
            "approval_threshold_bps": int(proposal.approval_threshold_bps),
            "votes_for": int(proposal.votes_for),
            "votes_against": int(proposal.votes_against),
            "votes_abstain": int(proposal.votes_abstain),
            "review_stage": proposal.review_stage,
            "template_snapshot_id": proposal.template_snapshot_id,
            "finalized": proposal.finalized,
        }

    @gl.public.view
    def get_constitution(self) -> str:
        return self.constitution

    @gl.public.view
    def get_constitution_version(self) -> int:
        return int(self.constitution_version)

    @gl.public.view
    def get_governance_overview(self) -> dict:
        return {
            "constitution_version": int(self.constitution_version),
            "active_template_id": self.active_template_id,
            "total_proposals": int(self.total_proposals),
            "total_templates": int(self.total_templates),
        }

    @gl.public.view
    def get_chambers(self) -> list:
        items = []
        for chamber_id in self.chamber_order:
            rule = self.chamber_rules[chamber_id]
            items.append(
                {
                    "chamber_id": rule.chamber_id,
                    "label": rule.label,
                    "categories": _json_list(rule.categories_json),
                    "quorum": int(rule.quorum),
                    "approval_threshold_bps": int(rule.approval_threshold_bps),
                    "review_standard": rule.review_standard,
                }
            )
        return items

    @gl.public.view
    def get_chamber_members(self, chamber_id: str) -> list:
        items = []
        prefix = chamber_id + ":"
        for member_key in self.chamber_member_order:
            if not member_key.startswith(prefix):
                continue
            if self.chamber_members.get(member_key, False):
                items.append(member_key[len(prefix):])
        return items

    @gl.public.view
    def get_templates(self) -> list:
        items = []
        for template_id in self.template_order:
            template = self.templates[template_id]
            items.append(
                {
                    "template_id": template.template_id,
                    "name": template.name,
                    "summary": template.summary,
                    "template_text": template.template_text,
                    "tags": _json_list(template.tags_json),
                    "created_version": int(template.created_version),
                }
            )
        return items

    @gl.public.view
    def get_template(self, template_id: str) -> dict:
        if template_id not in self.templates:
            raise gl.UserError(f"{ERROR_EXPECTED} Template not found")
        template = self.templates[template_id]
        return {
            "template_id": template.template_id,
            "name": template.name,
            "summary": template.summary,
            "template_text": template.template_text,
            "tags": _json_list(template.tags_json),
            "created_version": int(template.created_version),
        }

    @gl.public.write
    def set_chamber_rule(
        self,
        chamber_id: str,
        label: str,
        categories_json: str,
        quorum: u256,
        approval_threshold_bps: u256,
        review_standard: str,
    ) -> bool:
        if gl.message.sender_address != self.owner:
            raise gl.UserError(f"{ERROR_EXPECTED} Only owner")
        self._set_chamber_rule_internal(
            chamber_id[:60],
            label,
            categories_json,
            int(quorum),
            int(approval_threshold_bps),
            review_standard,
        )
        return True

    @gl.public.write
    def set_chamber_member(self, chamber_id: str, member_address: str, allowed: bool) -> bool:
        if gl.message.sender_address != self.owner:
            raise gl.UserError(f"{ERROR_EXPECTED} Only owner")
        member = Address(member_address)
        key = _member_key(chamber_id, member)
        if key not in self.chamber_members:
            self.chamber_member_order.append(key)
        self.chamber_members[key] = allowed
        return True

    @gl.public.write
    def register_template(self, name: str, summary: str, template_text: str, tags_json: str) -> str:
        if gl.message.sender_address != self.owner:
            raise gl.UserError(f"{ERROR_EXPECTED} Only owner")
        if len(template_text) < 50:
            raise gl.UserError(f"{ERROR_EXPECTED} Template text too short")
        return self._register_template_internal(name, summary, template_text, tags_json)

    @gl.public.write
    def adopt_template(self, template_id: str, rationale: str) -> dict:
        if gl.message.sender_address != self.owner:
            raise gl.UserError(f"{ERROR_EXPECTED} Only owner")
        if template_id not in self.templates:
            raise gl.UserError(f"{ERROR_EXPECTED} Template not found")
        template = self.templates[template_id]
        self.constitution = template.template_text
        self.constitution_version += 1
        self.active_template_id = template_id
        return {
            "success": True,
            "template_id": template_id,
            "constitution_version": int(self.constitution_version),
            "rationale": rationale[:500],
        }

    @gl.public.write
    def update_constitution(self, new_text: str, reason: str) -> dict:
        if gl.message.sender_address != self.owner:
            raise gl.UserError(f"{ERROR_EXPECTED} Only owner")
        if len(new_text) < 50:
            raise gl.UserError(f"{ERROR_EXPECTED} new_text too short")
        old_version = self.constitution_version
        self.constitution = new_text[:12000]
        self.constitution_version += 1
        self.active_template_id = self._register_template_internal(
            "Direct Amendment v" + str(int(self.constitution_version)),
            reason[:280],
            self.constitution,
            json.dumps(["amendment", "direct-update"]),
        )
        return {
            "success": True,
            "old_version": int(old_version),
            "new_version": int(self.constitution_version),
        }

    @gl.public.write
    def submit_proposal(self, title: str, description: str, category: str, action_payload: str = "") -> str:
        if len(title) < 5 or len(title) > 200:
            raise gl.UserError(f"{ERROR_EXPECTED} Title must be 5-200 chars")
        if len(description) < 20 or len(description) > 4000:
            raise gl.UserError(f"{ERROR_EXPECTED} Description must be 20-4000 chars")

        chamber_id = self._resolve_chamber_for_category(category)
        chamber = self.chamber_rules[chamber_id]
        proposal_id = "prop_" + str(int(self.total_proposals))
        self.total_proposals += 1
        self.proposals[proposal_id] = Proposal(
            id=proposal_id,
            proposer=gl.message.sender_address.as_hex,
            title=title,
            description=description,
            category=category,
            action_payload=action_payload[:2000],
            assigned_chamber=chamber_id,
            status="pending_review",
            constitutional=True,
            constitutional_reasoning="Awaiting constitutional review.",
            violations_json="[]",
            quorum=chamber.quorum,
            approval_threshold_bps=chamber.approval_threshold_bps,
            votes_for=u256(0),
            votes_against=u256(0),
            votes_abstain=u256(0),
            review_stage="queued",
            template_snapshot_id=self.active_template_id,
            finalized=False,
        )
        self.proposal_order.append(proposal_id)
        return proposal_id

    @gl.public.write
    def constitutional_review(self, proposal_id: str) -> dict:
        if proposal_id not in self.proposals:
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found")
        proposal = self.proposals[proposal_id]
        chamber = self.chamber_rules[proposal.assigned_chamber]

        def leader_fn():
            prompt = f"""You are reviewing a DAO proposal against a constitutional charter.

CONSTITUTION:
{self.constitution}

PROPOSAL CATEGORY:
{proposal.category}

ASSIGNED CHAMBER:
{chamber.label}

CHAMBER STANDARD:
{chamber.review_standard}

PROPOSAL TITLE:
{proposal.title}

PROPOSAL DESCRIPTION:
{proposal.description}

ACTION PAYLOAD:
{proposal.action_payload}

Return JSON only:
{{
  "constitutional": true,
  "reasoning": "A concise explanation",
  "violations": ["optional issue"]
}}
"""
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            if not isinstance(result, dict):
                raise gl.vm.UserError(f"{ERROR_LLM} Non-dict response")
            reasoning = str(result.get("reasoning", "")).strip()[:1200]
            if not reasoning:
                raise gl.vm.UserError(f"{ERROR_LLM} missing reasoning")
            violations = result.get("violations", [])
            if not isinstance(violations, list):
                violations = []
            return {
                "constitutional": bool(result.get("constitutional", True)),
                "reasoning": reasoning,
                "violations": [str(item)[:160] for item in violations[:5]],
            }

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            validator = leader_fn()
            leader = leaders_res.calldata
            return bool(leader.get("constitutional", True)) == bool(validator.get("constitutional", True))

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.proposals[proposal_id] = Proposal(
            id=proposal.id,
            proposer=proposal.proposer,
            title=proposal.title,
            description=proposal.description,
            category=proposal.category,
            action_payload=proposal.action_payload,
            assigned_chamber=proposal.assigned_chamber,
            status="active_vote" if result.get("constitutional", True) else "blocked",
            constitutional=bool(result.get("constitutional", True)),
            constitutional_reasoning=str(result.get("reasoning", ""))[:1200],
            violations_json=json.dumps(result.get("violations", []), sort_keys=True),
            quorum=proposal.quorum,
            approval_threshold_bps=proposal.approval_threshold_bps,
            votes_for=proposal.votes_for,
            votes_against=proposal.votes_against,
            votes_abstain=proposal.votes_abstain,
            review_stage="complete",
            template_snapshot_id=proposal.template_snapshot_id,
            finalized=proposal.finalized,
        )
        return result

    @gl.public.write
    def cast_vote(self, proposal_id: str, vote: str) -> str:
        if proposal_id not in self.proposals:
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found")
        proposal = self.proposals[proposal_id]
        if proposal.status != "active_vote":
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not open for voting")
        if not self._is_member(proposal.assigned_chamber, gl.message.sender_address):
            raise gl.UserError(f"{ERROR_EXPECTED} Not a chamber member")

        vote_key = _vote_key(proposal_id, gl.message.sender_address)
        if vote_key in self.member_votes:
            raise gl.UserError(f"{ERROR_EXPECTED} Already voted")

        normalized = vote.strip().upper()
        if normalized not in ["FOR", "AGAINST", "ABSTAIN"]:
            raise gl.UserError(f"{ERROR_EXPECTED} Invalid vote")
        self.member_votes[vote_key] = normalized

        if normalized == "FOR":
            proposal.votes_for += 1
        elif normalized == "AGAINST":
            proposal.votes_against += 1
        else:
            proposal.votes_abstain += 1
        self.proposals[proposal_id] = proposal
        return "vote-recorded"

    @gl.public.write
    def finalize_proposal(self, proposal_id: str) -> dict:
        if proposal_id not in self.proposals:
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found")
        proposal = self.proposals[proposal_id]
        if proposal.status != "active_vote":
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not in voting stage")
        total_votes = int(proposal.votes_for) + int(proposal.votes_against) + int(proposal.votes_abstain)
        if total_votes < int(proposal.quorum):
            proposal.status = "lapsed"
            proposal.finalized = True
            self.proposals[proposal_id] = proposal
            return {"status": "lapsed", "reason": "quorum_not_met"}

        approval_rate_bps = 0
        if int(proposal.votes_for) + int(proposal.votes_against) > 0:
            approval_rate_bps = int(proposal.votes_for) * 10000 // (
                int(proposal.votes_for) + int(proposal.votes_against)
            )
        passed = approval_rate_bps >= int(proposal.approval_threshold_bps)
        proposal.status = "passed" if passed else "rejected"
        proposal.finalized = True
        self.proposals[proposal_id] = proposal
        return {
            "status": proposal.status,
            "approval_rate_bps": approval_rate_bps,
            "required_threshold_bps": int(proposal.approval_threshold_bps),
        }

    @gl.public.view
    def get_proposal(self, proposal_id: str) -> dict:
        if proposal_id not in self.proposals:
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found")
        return self._proposal_to_dict(self.proposals[proposal_id])

    @gl.public.view
    def get_all_proposals(self) -> list:
        items = []
        for proposal_id in self.proposal_order:
            items.append(self._proposal_to_dict(self.proposals[proposal_id]))
        return items

    @gl.public.view
    def get_proposals_by_category(self, category: str) -> list:
        items = []
        for proposal_id in self.proposal_order:
            proposal = self.proposals[proposal_id]
            if proposal.category == category:
                items.append(self._proposal_to_dict(proposal))
        return items

    @gl.public.view
    def get_member_vote(self, proposal_id: str, member_address: str) -> str:
        return self.member_votes.get(_vote_key(proposal_id, Address(member_address)), "")


def test_constitutional_dao() -> None:
    constitution = """
    The DAO exists to steward public digital institutions.
    Treasury outflows must serve member value and mission continuity.
    Membership decisions must uphold conduct, legitimacy, and due process.
    Constitutional amendments require a higher burden of proof than ordinary decisions.
    """

    contract = ConstitutionalDAO(constitution)

    chambers = contract.get_chambers()
    assert len(chambers) == 3

    prop_id = contract.submit_proposal(
        "Allocate audit budget",
        "Approve a treasury spend for a third-party smart contract security audit.",
        "TREASURY_SPEND",
        '{"amount_usd": 15000}',
    )
    proposal = contract.get_proposal(prop_id)
    assert proposal["assigned_chamber"] == "treasury_council"

    template_id = contract.register_template(
        "Emergency Charter",
        "A stress-tested template for emergency governance.",
        constitution + " Emergency powers must sunset automatically.",
        json.dumps(["emergency", "treasury"]),
    )
    contract.adopt_template(template_id, "Adopt an emergency-ready template")
    assert contract.get_constitution_version() == 2

    review = contract.constitutional_review(prop_id)
    assert "constitutional" in review

    contract.set_chamber_member("treasury_council", contract.owner.as_hex, True)
    contract.cast_vote(prop_id, "FOR")
    result = contract.finalize_proposal(prop_id)
    assert result["status"] in ["passed", "rejected", "lapsed"]


if __name__ == "__main__":
    test_constitutional_dao()
