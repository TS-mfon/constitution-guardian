Constitutional DAO

**Track:** AI Governance
**Priority:** Tier 1 — Category Defining

## Description
A DAO governed by a natural language constitution stored onchain. Every proposal is evaluated not just on its merits, but on whether it contradicts the founding constitution. The AI checks for constitutional violations before humans vote. Unconstitutional proposals are flagged and blocked automatically. Rule of law, not just rule of majority.

## Problem Solved
Standard DAOs have no mechanism to enforce their own stated values. Wealthy wallets can vote to do things that violate the DAO's mission. This contract makes the founding document legally binding in an automated, trustless way — the constitution is enforced by AI consensus, not by moderators.

## How It Works
1. **Founding members write the constitution** — stored onchain as immutable plain text at deployment
2. **Any proposal submitted** — title, description, requested action
3. **Constitutional review runs first** — AI evaluates the proposal against every clause of the constitution, flags any violations
4. **If unconstitutional** — proposal is blocked before voting opens; a detailed explanation is published
5. **If constitutional** — voting opens normally; AI still provides a non-binding recommendation
6. **Amendment process** — changing the constitution itself requires a supermajority (75%) and a 7-day waiting period

## Contract Functions (Description Only)
- `initialize(constitution_text, founding_members)` — Deploy with constitution baked in
- `submit_proposal(title, description, action_type, action_value)` — Proposal enters constitutional review queue
- `constitutional_review(proposal_id)` — AI checks proposal against constitution clauses, returns verdict + violations list
- `vote(proposal_id, vote)` — Cast vote (only available after passing constitutional review)
- `finalize(proposal_id)` — Tally votes, execute if passed
- `propose_amendment(clause_index, new_text, rationale)` — Start amendment process
- `get_constitution()` — Return full constitution text
- `get_violations_report(proposal_id)` — Return AI's constitutional analysis

## Frontend Pages
| Page | Description |
|---|---|
| Constitution | Full text, clause-by-clause display, amendment history |
| Proposals | Active voting + pending constitutional review + rejected (unconstitutional) |
| Submit Proposal | Form with real-time constitutional check preview |
| Proposal Detail | Constitutional review result, AI recommendation, vote tally |
| Amendment Board | Active amendment proposals, supermajority tracker |
| DAO Stats | Proposals blocked, passed, rejection reasons breakdown |

## Project Dependencies
```
Frontend:         Next.js 14, Tailwind CSS, shadcn/ui
Web3:             GenLayer JS SDK, wagmi, viem
Wallet:           MetaMask, WalletConnect
State:            Zustand
Text Editor:      TipTap (rich text for constitution display)
Deployment:       Vercel
Contract:         Python, GenLayer Intelligent Contract
```




this is the contract address deployed on studionet: 0x8FEDd245572a58f4fBDc2B361a7c190Ceb73dbb5


# Constitutional DAO — Frontend Builder Guide

**Contract:** `05-constitutional-dao/contract_v2_final.py`  
**Version:** v2 (with constitution update feature)  
**Purpose:** DAO governed by mutable constitution with AI constitutional review

---

## 🎯 What This Contract Does

The Constitutional DAO enforces rule of law by having an AI check every proposal against the founding constitution before voting. Proposals that violate the constitution are blocked automatically.

**NEW in v2:** The constitution can now be updated via the `update_constitution()` method, with full version tracking.

**Core Idea:** Constitutional violations are detected by AI consensus before humans vote.

---

## 📊 Lifecycle of a Transaction

```
User submits proposal
       │
       ▼
Proposal stored as "pending" state
       │
       ▼
User calls constitutional_review()
       │
       ▼
┌──────────────────────────────────────────┐
│ AI CONSENSUS (LLM-based)                 │
│                                          │
│ Each validator:                          │
│ ├─ Gets proposal + constitution          │
│ ├─ Runs LLM: "Is this constitutional?"   │
│ ├─ AI says: yes/no + violations          │
│ └─ Compares vote with leader             │
│                                          │
│ Result: Majority agreement on vote       │
└──────────────────────────────────────────┘
       │
       ▼
Proposal status: "active" (if constitutional)
           OR
Proposal status: "blocked" (if violates constitution)
       │
       ▼
If ACTIVE: Humans vote (yes/no)
If BLOCKED: Proposal rejected (cannot vote)
```

---

## 🔢 Input Character Limits & Validation Rules

**CRITICAL:** Frontend must enforce these limits to prevent transaction errors.

### submit_proposal() Limits

| Field | Minimum | Maximum | Example |
|-------|---------|---------|---------|
| `title` | **5 chars** | **200 chars** | ✅ "Grant" (5) / ❌ "Fund" (4) |
| `description` | **20 chars** | **No limit** | ✅ "Allocate funds to Python compiler development project" |
| `action_type` | **1 char** | **No limit** | ✅ "fund_allocation" |

**Common Error:**
```
Title: "fund" → ERROR (only 4 chars, need 5+)
Title: "grant" → SUCCESS (5 chars)
```

### update_constitution() Limits

| Field | Minimum | Maximum | Example |
|-------|---------|---------|---------|
| `new_text` | **50 chars** | **10,000 chars** | Full constitution document |
| `reason` | **1 char** | **500 chars** | "Adaptive governance model" |

## 🤖 AI Validator Profiles (Internal to Consensus Logic)

Each validator independently:

1. **Reads the proposal** (title, description, action_type)
2. **Reads the constitution**
3. **Runs LLM prompt:**
   ```
   "Review this proposal against the provided constitution.
   
   CONSTITUTION: [full constitution text]
   
   PROPOSAL:
   Title: [title]
   Description: [description]
   Action: [action_type]
   
   Identify any violations. Response format:
   {
     "constitutional": true/false,
     "violations": ["violation1", "violation2"],
     "reasoning": "explanation"
   }"
   ```
4. **Compares vote with leader validator:**
   - If leader vote == my vote → AGREE ✅
   - If leader vote != my vote → DISPUTE ❌

5. **Consensus result:** Majority determines outcome
   - If 4/5 validators agree → Result is locked
   - If validators disagree → Retries until consensus

---

## 🏗️ Frontend Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND UI                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Screen 1: Constitution Management                  │
│  ├─ Display: Current constitution text              │
│  ├─ Display: Version number (v2.get_version())      │
│  ├─ Button: "Update Constitution"                   │
│  │    └─ Modal: New text (min 50 chars) + reason    │
│  │    └─ Calls: update_constitution()               │
│  └─ Show: Character counter (50-10,000)             │
│                                                      │
│  Screen 2: Submit Proposal Form                     │
│  ├─ Input: Title (5-200 chars) [Show counter]       │
│  ├─ Input: Description (20+ chars) [Show counter]   │
│  ├─ Input: Action Type (1+ chars)                   │
│  └─ Button: "Submit to DAO"                         │
│       └─ Calls: submit_proposal()                   │
│                                                      │
│  Screen 3: Proposal Details                         │
│  ├─ Show: Proposal ID, Title, Status                │
│  ├─ Show: Constitutional status                     │
│  ├─ If status="pending": Button "Trigger AI Review" │
│  │    └─ Calls: constitutional_review()             │
│  ├─ Show: AI's violations list (if any)             │
│  ├─ If status="active": Show voting form            │
│  └─ If status="blocked": Show "Blocked by AI" badge │
│                                                      │
│  Screen 4: All Proposals List                       │
│  ├─ Shows all proposals with status                 │
│  └─ Calls: get_all_proposals()                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Key UI Moments

### Moment 1: After Submission
```
User clicks "Submit to Proposal"
↓
Frontend calls: submit_proposal(title, description, action_type)
↓
Contract returns: proposal_id (e.g., "prop_0")
↓
UI shows: "✅ Proposal submitted! ID: prop_0"
↓
UI shows: Button "Review with AI"
```

### Moment 2: During Constitutional Review
```
User clicks "Review with AI"
↓
Frontend calls: constitutional_review(proposal_id)
↓
Contract runs: AI consensus (5-30 seconds)
↓
UI shows: 🔄 "Validators reviewing against constitution..."
↓
Network reaches consensus
↓
Contract returns: {"constitutional": true/false, "violations": [...]}
↓
If TRUE:
  └─ UI shows: "✅ CONSTITUTIONAL - Proposal approved for voting"
If FALSE:
  └─ UI shows: "❌ BLOCKED - Violates constitution"
     └─ Show violations list to user
```

### Moment 3: Voting Available
```
If proposal marked as "active"
↓
UI shows: Voting form
  ├─ Radio: Yes
  ├─ Radio: No
  └─ Button: Vote
↓
User cannot vote if status is "blocked"
```

### Moment 4: Constitution Update
```
User clicks "Update Constitution" button
↓
UI shows: Modal with form
  ├─ Textarea: New constitution text (50-10,000 chars)
  ├─ Input: Update reason (1-500 chars)
  └─ Character counters displayed
↓
User fills form and clicks "Update"
↓
Frontend calls: update_constitution(new_text, reason)
↓
Contract validates and updates
↓
Contract returns: {"success": true, "old_version": 1, "new_version": 2}
↓
UI shows: "✅ Constitution updated to v2"
↓
UI refreshes constitution display
```

---


---

## ⚙️ Consensus Process Explained

### How LLM Consensus Works

**Scenario:** 5 validators, proposal about "cutting DAO funding in half"

```
Leader (Validator 0):
├─ Reads: Constitution says "funds must support development"
├─ Reads: Proposal says "cut funding 50%"
├─ LLM decides: "Violates clause 1" → constitutional: FALSE
└─ Proposes to network: {"constitutional": false, ...}

Validator 1:
├─ Runs same LLM analysis
├─ LLM decides: "Violates funding requirement" → constitutional: FALSE
├─ Compares: false == false ✅
└─ AGREES

Validator 2:
├─ LLM decides: "Maybe ok if reinvested" → constitutional: TRUE
├─ Compares: true != false ❌
└─ DISPUTES (starts over)

Validator 3 & 4:
├─ LLM decides: constitutional: FALSE
├─ Compare: false == false ✅
└─ AGREE

RESULT: 4/5 validators agree → FALSE (not constitutional) ✅
Proposal is BLOCKED from voting
```

---

## 🎮 How Users Use the Contract

### User Flow 1: Update Constitution

```
Step 1: User navigates to "Constitution" page
        └─ Current constitution displayed
        └─ Version number shown (e.g., "v1")

Step 2: User clicks "Update Constitution" button
        └─ Modal/form appears

Step 3: User fills in:
        ├─ New Constitution Text: (minimum 50 chars, max 10,000)
        │   └─ Live character counter shows: "86/10000 (min 50)"
        └─ Update Reason: (minimum 1 char, max 500)
            └─ Live character counter shows: "24/500"

Step 4: User clicks "Update"
        └─ Frontend validates:
            ├─ new_text.length >= 50 ✅
            └─ new_text != current_constitution ✅
        └─ Frontend calls: update_constitution(new_text, reason)

Step 5: Contract returns: {"success": true, "old_version": 1, "new_version": 2}
        └─ UI shows: "✅ Constitution updated to v2"
        └─ UI refreshes to show new constitution
```

### User Flow 2: Submit a Proposal

```
Step 1: User navigates to "Submit Proposal"
        └─ Form appears

Step 2: User fills in:
        ├─ Title: (5-200 chars) "Grant for Python development"
        │   └─ Character counter: "29/200 (min 5)"
        ├─ Description: (20+ chars) "We should fund the Python core team..."
        │   └─ Character counter: "47 characters (min 20)"
        └─ Action Type: (1+ chars) "fund_allocation"

Step 3: User clicks "Submit"
        └─ Frontend validates:
            ├─ title.length >= 5 && <= 200 ✅
            └─ description.length >= 20 ✅
        └─ Frontend calls: submit_proposal(title, desc, action_type)

Step 4: Contract returns: proposal_id = "prop_5"
        └─ UI shows: "✅ Submitted! ID: prop_5"

Step 5: User sees button "Trigger Constitutional Review"
```

### User Flow 2: Trigger AI Review

```
Step 1: User clicks "Trigger Constitutional Review"
        └─ UI shows: 🔄 "AI is reviewing..."

Step 2: Frontend calls: constitutional_review(proposal_id)
        └─ Sends to network, validators start consensus

Step 3: Wait 5-30 seconds for consensus
        └─ UI polls get_proposal() every 2-3 seconds

Step 4: When consensus complete:
        └─ If CONSTITUTIONAL (true):
            └─ UI shows: ✅ "CONSTITUTIONAL - Approved for voting!"
            └─ Proposal status: "active"
            └─ Shows voting form
        └─ If VIOLATES (false):
            └─ UI shows: ❌ "BLOCKED - Violates constitution"
            └─ Proposal status: "blocked"
            └─ Lists violations
            └─ Hides voting form
```

### User Flow 3: View All Proposals

```
Step 1: User clicks "All Proposals" in menu

Step 2: Frontend calls: get_all_proposals()

Step 3: Contract returns list of all proposals with status

Step 4: UI displays:
        ┌───────────────────────────────────────┐
        │ prop_0 | Fund Python | 🗳️ Active     │
        │ prop_1 | Cut Budget  | ❌ Blocked    │
        │ prop_2 | New Dev     | 🔄 Pending    │
        └───────────────────────────────────────┘

Step 5: User clicks on a proposal to see details
```

---

## 📋 Contract Methods Summary

### Write Methods (Change State)

| Method | Input Parameters | Character Limits | Returns | When to Call |
|--------|-----------------|------------------|---------|--------------|
| `update_constitution()` | new_text, reason | new_text: 50-10,000 chars
reason: 1-500 chars | {success, old_version, new_version} | Update DAO constitution |
| `submit_proposal()` | title, description, action_type | title: 5-200 chars
description: 20+ chars
action_type: 1+ chars | proposal_id | User creates new proposal |
| `constitutional_review()` | proposal_id | N/A | {constitutional, violations} | User triggers AI review |

### View Methods (Read Only)

| Method | Input | Returns | When to Call |
|--------|-------|---------|--------------|
| `get_constitution()` | (none) | full constitution text | Display constitution to user |
| `get_constitution_version()` | (none) | version number (int) | Show current constitution version |
| `get_proposal()` | proposal_id | proposal details | Poll for status updates |
| `get_all_proposals()` | (none) | list of proposals | Load proposals dashboard |

---

## 🔄 Complete Frontend Flow Diagram

```
Frontend Start
    │
    ├─ Load Constitution Page
    │  ├─ Call: get_constitution()
    │  ├─ Call: get_constitution_version()
    │  ├─ Display: Constitution text (v1, v2, etc.)
    │  └─ Button: "Update Constitution"
    │     │
    │     └─ User clicks
    │        └─ Show: Modal with form
    │           ├─ Textarea: New constitution (50-10,000 chars) [counter]
    │           ├─ Input: Reason (1-500 chars) [counter]
    │           └─ Button: "Update"
    │              │
    │              └─ Call: update_constitution(new_text, reason)
    │                 └─ Get: {success, old_version, new_version}
    │                 └─ Show: "✅ Updated to v2"
    │                 └─ Refresh constitution display
    │
    ├─ Display: "Submit Proposal" button
    │  └─ User clicks
    │  └─ Show: Submission form
    │     ├─ Input: Title (5-200 chars) [counter shows "15/200 (min 5)"]
    │     ├─ Input: Description (20+ chars) [counter shows "45 chars (min 20)"]
    │     ├─ Input: Action Type (1+ chars)
    │     └─ Button: "Submit" (disabled if validation fails)
    │        │
    │        └─ Call: submit_proposal(title, desc, action)
    │           └─ Get: proposal_id
    │           └─ Store: proposal_id
    │           └─ Show: "Submitted! ID: prop_X"
    │           └─ Show: "Trigger Review" button
    │
    ├─ User clicks: "Trigger Review"
    │  │
    │  └─ Call: constitutional_review(proposal_id)
    │     │
    │     ├─ Show: 🔄 "AI validators reviewing..."
    │     │
    │     └─ Poll: get_proposal(proposal_id) every 2s
    │        │
    │        ├─ If status = "active"
    │        │  └─ Show: ✅ "Constitutional!"
    │        │  └─ Show: Voting form
    │        │     └─ User votes
    │        │
    │        └─ If status = "blocked"
    │           └─ Show: ❌ "Violates constitution"
    │           └─ Show: Violations list
    │
    └─ Load: "All Proposals" page
       └─ Call: get_all_proposals()
       └─ Display: List of all proposals with status badges
```

---

