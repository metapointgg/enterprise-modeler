# AI Guide — Interrogating the Enterprise Model

This guide defines how an AI agent should answer questions by traversing Enterprise Model files.

The intended usage includes Azure DevOps MCP, where the agent can search and read repository files without needing to run the Enterprise Modeler UI.

## 1. Find the correct Enterprise Model

Locate the model root containing:

```text
architecture/integrations.json
processes/process-catalog.json
organisation/org-chart.json
```

Then use related files under the same root.

Never combine records from two different model roots unless the user explicitly requests a comparison.

## 2. Source priority

Use the most specific domain source available.

Recommended precedence:

1. Domain record that explicitly captures the relationship.
2. BPMN/process metadata.
3. `model/relationships.json` cross-domain relationship.
4. Notes/free text.
5. Inference — only when clearly labelled as inference.

Examples:

- Interface endpoints/direction: `architecture/integrations.json`
- Data carried by an interface: `data/data-catalogue.json` data flows
- Process owner/approver: `governance/process-governance.json`
- Organisational hierarchy: `organisation/org-chart.json`
- System of record / data owner / steward: data objects
- Exact process sequence: BPMN
- Node-specific systems/controls/risks/regulations: process metadata

## 3. Always traverse by ID

Names are for presentation. IDs are for joining.

For example:

```text
if-salesforce-t24
      ↓
dataFlows[].interfaceId
      ↓
dataObjectIds[]
      ↓
dataObjects[].id
      ↓
businessOwnerPositionId / dataStewardPositionId
      ↓
organisation.positions[].id
      ↓
role / team / department / person
```

Do not join `Salesforce` to another record merely because both records contain the word Salesforce if IDs are available.

## 4. System change impact

For a question such as:

> If we change T24, which downstream owners do we need to involve as stakeholders?

Use this traversal.

### Step A — resolve the system

Find the system in:

```text
architecture/integrations.json → systems[]
```

Capture:

- system ID
- ownerPositionId
- criticality
- environments
- parent/child systems

### Step B — find directly connected interfaces

Find every interface where:

```text
sourceSystemId == systemId
OR
targetSystemId == systemId
```

Respect `direction` when classifying upstream/downstream impact.

For each interface capture:

- interface ID
- source/target
- direction
- owner
- protocol
- status
- environments

### Step C — find data flows using the system or interface

Search:

```text
data/data-catalogue.json → dataFlows[]
```

Match if any of:

- `sourceSystemId == systemId`
- `targetSystemId == systemId`
- `interfaceId` is one of the connected interface IDs

Capture:

- data object IDs
- source/target system
- process ID
- process node ID
- flow owner
- classification
- purpose/frequency/protocol

### Step D — resolve impacted data

For every `dataObjectId`, read the data object and capture:

- business owner
- data steward
- system of record
- classification
- personal/special-category flags
- criticality
- retention/residency where relevant

### Step E — resolve impacted processes

Find processes from:

- `dataFlows[].processId`
- `process-governance.json → systemIds[]`
- `process-governance.json → interfaceIds[]`
- process metadata node/system links
- relationship graph where applicable

Capture process owner and approver.

### Step F — resolve stakeholder positions

Candidate stakeholders normally include:

- changed system owner
- connected interface owners
- data-flow owners
- impacted process owners
- impacted process approvers where governance/change approval is relevant
- business owners of impacted data
- data stewards
- owner(s) of downstream systems
- regulatory owner(s) where impacted processes have regulation links

Then resolve position IDs through `organisation/org-chart.json`.

If named people occupy those positions, include them, but keep the **position** as the stable responsibility.

### Step G — report by impact level

A useful answer groups:

- **Direct technical impact**
- **Downstream system impact**
- **Process/operational impact**
- **Data impact**
- **Governance/regulatory impact**
- **Stakeholders**
- **Model gaps / TBC**

Do not dump every connected entity without explaining the path.

## 5. Integration change impact

For a question such as:

> If we change this integration point, what data is impacted?

Resolve the interface in `architecture/integrations.json`.

Then:

1. Read source/target systems and direction.
2. Find every data flow whose `interfaceId` matches.
3. Resolve all `dataObjectIds`.
4. Resolve every `processId` and `processNodeId`.
5. Resolve flow owner, interface owner and data owners/stewards.
6. Check process governance for additional processes that list the same interface.
7. Check interface status/environments before assuming production impact.

The strongest evidence for data impact is an explicit data-flow record referencing the interface.

If no data flow references the interface, say:

> The model confirms the interface exists, but it does not currently identify the data objects carried by it.

Do not guess the payload from protocol or system names.

## 6. Downstream traversal

Direction matters.

For an interface:

- `outbound` means source → target
- `inbound` means target → source
- `bidirectional` means impact can propagate both ways

For a system-change blast radius:

1. Start with direct interfaces.
2. Follow outbound edges to target systems.
3. Continue recursively only when the user asks for downstream/transitive impact.
4. Track visited system/interface IDs to avoid loops.
5. Report depth/path.

Example:

```text
T24
→ if-t24-dwh
→ Data Warehouse
→ reporting flow
→ BI platform
```

Distinguish:

- depth 1: directly connected
- depth 2+: transitive/downstream

## 7. Process impact

Use both process-level and node-level information.

Process-level:

```text
governance/process-governance.json
  systemIds[]
  interfaceIds[]
```

Node-level:

```text
metadata/<process>.json
  nodes[<bpmnElementId>]
```

Data-flow-level:

```text
dataFlows[].processId
dataFlows[].processNodeId
```

If a data flow identifies `processNodeId`, inspect the BPMN process to identify the exact activity name.

That allows an answer such as:

> The interface is used by Customer Onboarding, specifically Task_5 “Create customer record”, rather than merely saying the whole process is affected.

## 8. Stakeholder analysis

Do not equate “connected” with “stakeholder” without classifying why.

Suggested stakeholder categories:

### Required / primary

- system owner of the changed system
- interface owner of a changed interface
- process owner where the process is directly affected
- business data owner where governed data changes

### Operational / delivery

- data steward
- downstream system owner
- process approver
- flow owner
- relevant support/technology position

### Governance / assurance

- regulation owner
- risk/compliance owner when explicitly linked
- information-security owner when classification/security impact is modelled
- DPO/data-protection owner for personal/special-category data where appropriate to the model

Explain the evidence path for each stakeholder.

## 9. Data lineage questions

For:

> Where does Customer Profile data originate and where does it go?

Start at `dataObjects[].id`.

Capture:

- system of record
- business owner
- steward

Then find every data flow containing that ID.

Build a directional graph of:

```text
sourceSystemId → targetSystemId
```

Annotate each edge with:

- interface
- process/process node
- purpose
- frequency
- protocol
- classification
- owner

Do not assume that every target becomes a new master.

## 10. Organisational questions

For an owner/stakeholder position:

1. Resolve `positions[].id`.
2. Resolve role, department and team.
3. Resolve manager position if escalation/reporting line is relevant.
4. Resolve active people with matching `positionId`.

Do not use a person's name as the permanent ownership key.

## 11. Process hierarchy questions

Use `process-catalog.json`:

- `parentId` provides hierarchy.
- `layerId` identifies L0/L1/L2/etc.
- `url` points to BPMN.
- `metadataUrl` points to node metadata.

For questions about process decomposition, traverse parent/child process IDs rather than guessing from filenames.

## 12. Relationship graph usage

`model/relationships.json` is useful for broad enterprise graph traversal.

Use it to:

- discover candidate links
- traverse cross-domain relationships
- identify entity types not immediately visible in one domain file

For high-impact answers, verify important edges against the authoritative domain file where one exists.

Example:

If the relationship graph says a process uses a system and `process-governance.json` also lists that system, cite both internally as corroborating evidence.

If they disagree, report the inconsistency rather than silently choosing one.

## 13. Confidence and model gaps

Use language such as:

- **Confirmed by model** — explicit relationship exists.
- **Indirectly connected** — reached through one or more explicit edges.
- **Possible impact** — reasonable inference but not explicitly modelled.
- **Not currently modelled** — expected relationship cannot be found.
- **TBC** — source record explicitly marks the relationship/status as TBC.

A high-quality agent answer should expose model gaps because those gaps improve future model quality.

## 14. Example answer pattern

For:

> If T24 changes, which downstream owners should we involve?

Produce something like:

```text
Directly impacted
- Payments Platform — via if-t24-payments
  Owner: <position/person>
  Data: Payment Instruction, Payment Message
  Processes: Inbound Payment Processing, Outbound Payment Processing

- Data Warehouse — via if-t24-dwh
  Owner: <position/person>
  Data: Savings Account, Loan Account, Deposit Transaction, Payment Instruction
  Process: Management Information

Business/data stakeholders
- Head of Savings — owner of Savings Account data
- Head of Lending — owner of Loan Account data
- Head of Data & MI — owner of the warehouse data flow

Governance
- <process/regulatory owners discovered from affected process records>

Model gaps
- <anything not explicitly modelled>
```

The important feature is that every conclusion can be traced back through explicit IDs.

## 15. Azure DevOps MCP operating procedure

When answering through Azure DevOps MCP:

1. Identify the correct repository/project.
2. Locate the Enterprise Model root.
3. Read only the model files required for the question initially.
4. Search exact IDs across the model when following dependencies.
5. Expand to BPMN/metadata only when process-step detail is needed.
6. Expand to organisation data only after owner/steward/approver IDs have been collected.
7. Expand to regulations only when affected processes/data require governance analysis.
8. Deduplicate entities by ID.
9. Return the dependency path, not just the final names.
10. If asked to make a model change, follow `docs/ai-model-authoring.md` and update all affected cross-references coherently.

This approach keeps repository interrogation efficient while preserving traceability.
