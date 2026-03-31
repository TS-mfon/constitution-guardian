# { "Depends": "py-genlayer:test" }

from genlayer import *
from dataclasses import dataclass

ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"
ERROR_TRANSIENT = "[TRANSIENT]"
ERROR_LLM = "[LLM_ERROR]"


@allow_storage
@dataclass
class Proposal:
    """DAO proposal under constitutional review."""
    id: str
    title: str
    description: str
    action_type: str
    status: str
    constitutional: bool
    votes_for: u256
    votes_against: u256


class ConstitutionalDAO(gl.Contract):
    """DAO governed by mutable constitution with constitutional review."""

    owner: Address
    constitution: str
    constitution_version: u256
    proposals: TreeMap[str, Proposal]
    proposal_order: DynArray[str]
    total_proposals: u256

    def __init__(self, constitution_text: str):
        """Initialize DAO with constitution."""
        if len(constitution_text) < 50:
            raise gl.UserError(f"{ERROR_EXPECTED} Constitution too short")
        
        self.owner = gl.message.sender_address
        self.constitution = constitution_text
        self.constitution_version = u256(1)
        self.total_proposals = u256(0)

    @gl.public.view
    def get_constitution(self) -> str:
        """Get full constitution text."""
        return self.constitution

    @gl.public.view
    def get_constitution_version(self) -> int:
        """Get current constitution version number."""
        return int(self.constitution_version)

    @gl.public.write
    def update_constitution(self, new_text: str, reason: str) -> dict:
        """Update constitution text."""
        
        # Validate parameters
        if not new_text:
            raise gl.UserError(f"{ERROR_EXPECTED} new_text is empty")
        
        if not reason:
            raise gl.UserError(f"{ERROR_EXPECTED} reason is empty")

        # Check lengths
        if len(new_text) < 50:
            raise gl.UserError(f"{ERROR_EXPECTED} new_text too short (min 50)")
        
        if len(new_text) > 10000:
            raise gl.UserError(f"{ERROR_EXPECTED} new_text too long (max 10000)")

        if len(reason) > 500:
            raise gl.UserError(f"{ERROR_EXPECTED} reason too long (max 500)")

        # Check not identical
        if new_text == self.constitution:
            raise gl.UserError(f"{ERROR_EXPECTED} identical to current constitution")

        # Perform update
        old_ver = self.constitution_version
        self.constitution = new_text
        self.constitution_version = self.constitution_version + u256(1)

        return {
            "success": True,
            "old_version": int(old_ver),
            "new_version": int(self.constitution_version),
        }

    @gl.public.write
    def submit_proposal(self, title: str, description: str, action_type: str) -> str:
        """Submit a new proposal."""
        if len(title) < 5 or len(title) > 200:
            raise gl.UserError(f"{ERROR_EXPECTED} Title must be 5-200 chars")
        if len(description) < 20:
            raise gl.UserError(f"{ERROR_EXPECTED} Description too short")

        proposal_id = f"prop_{self.total_proposals}"
        proposal = Proposal(
            id=proposal_id,
            title=title,
            description=description,
            action_type=action_type,
            status="pending",
            constitutional=True,
            votes_for=u256(0),
            votes_against=u256(0),
        )

        self.proposals[proposal_id] = proposal
        self.proposal_order.append(proposal_id)
        self.total_proposals = self.total_proposals + u256(1)

        return proposal_id

    @gl.public.write
    def constitutional_review(self, proposal_id: str) -> dict:
        """Review proposal against constitution using LLM consensus."""

        def leader_fn():
            if proposal_id not in self.proposals:
                raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found: {proposal_id}")

            proposal = self.proposals[proposal_id]

            prompt = f"""Review this proposal against the provided constitution.

CONSTITUTION:
{self.constitution}

PROPOSAL:
Title: {proposal.title}
Description: {proposal.description}
Action: {proposal.action_type}

Is this proposal constitutional? Identify any violations.
Respond in JSON:
{{
    "constitutional": true/false,
    "violations": ["violation1", "violation2"],
    "reasoning": "explanation"
}}"""

            response = gl.nondet.exec_prompt(prompt, response_format="json")

            if not isinstance(response, dict):
                raise gl.UserError(f"{ERROR_LLM} Non-dict response")

            is_constitutional = response.get("constitutional", True)
            violations = response.get("violations", [])

            return {
                "constitutional": is_constitutional,
                "violations": violations[:5],
            }

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False

            leader_const = leaders_res.calldata.get("constitutional", True)
            validator_res = leader_fn()
            validator_const = validator_res.get("constitutional", True)

            return leader_const == validator_const

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        # Update proposal with review result (OUTSIDE consensus block)
        if proposal_id in self.proposals:
            proposal = self.proposals[proposal_id]
            is_constitutional = result.get("constitutional", True)
            
            self.proposals[proposal_id] = Proposal(
                id=proposal.id,
                title=proposal.title,
                description=proposal.description,
                action_type=proposal.action_type,
                status="active" if is_constitutional else "blocked",
                constitutional=is_constitutional,
                votes_for=proposal.votes_for,
                votes_against=proposal.votes_against,
            )
        
        return result

    @gl.public.view
    def get_proposal(self, proposal_id: str) -> dict:
        """Get proposal details."""
        if proposal_id not in self.proposals:
            raise gl.UserError(f"{ERROR_EXPECTED} Proposal not found: {proposal_id}")

        proposal = self.proposals[proposal_id]
        return {
            "id": proposal.id,
            "title": proposal.title,
            "description": proposal.description,
            "status": proposal.status,
            "constitutional": proposal.constitutional,
            "votes_for": int(proposal.votes_for),
            "votes_against": int(proposal.votes_against),
        }

    @gl.public.view
    def get_all_proposals(self) -> list:
        """Get all proposals."""
        proposals = []
        for prop_id in self.proposal_order:
            if prop_id in self.proposals:
                p = self.proposals[prop_id]
                proposals.append({
                    "id": p.id,
                    "title": p.title,
                    "status": p.status,
                    "constitutional": p.constitutional,
                })
        return proposals


def test_constitutional_dao():
    """Direct mode tests."""
    constitution = """
    This DAO is dedicated to supporting open-source software development.
    1. All treasury funds must support software development or research.
    2. No funds may be used for political purposes.
    3. Decisions require 50% quorum.
    4. Amendments require 75% supermajority.
    """

    contract = ConstitutionalDAO(constitution)

    # Test 1: Constitution update
    new_constitution = "The DAO operates based on market conditions with continuous monitoring and adaptive governance frameworks for optimal decision-making."
    result = contract.update_constitution(new_constitution, "Adaptive governance model")
    assert result["success"] == True
    assert result["new_version"] == 2
    print("✓ update_constitution works")

    # Test 2: Submit proposal
    prop_id = contract.submit_proposal(
        "Fund Python project",
        "Allocate funds to Python compiler development",
        "fund_allocation"
    )
    assert prop_id == "prop_0"
    
    prop = contract.get_proposal(prop_id)
    assert prop["status"] == "pending"
    print("✓ submit_proposal works")

    # Test 3: Constitutional review (LLM consensus)
    review_result = contract.constitutional_review(prop_id)
    assert "constitutional" in review_result
    print("✓ constitutional_review works")

    # Test 4: Verify proposal was updated
    prop_after = contract.get_proposal(prop_id)
    assert prop_after["status"] in ["active", "blocked"]
    print(f"✓ Proposal status after review: {prop_after['status']}")

    # Test 5: Get all proposals
    all_props = contract.get_all_proposals()
    assert len(all_props) == 1
    print("✓ get_all_proposals works")

    print("\n✓ All Constitutional DAO tests passed!")


if __name__ == "__main__":
    test_constitutional_dao()
