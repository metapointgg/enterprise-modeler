# AI Guide — Authoring Enterprise Model Files

This guide defines how an AI agent should create or update Enterprise Model files.

The objective is not merely valid JSON or BPMN. The objective is a **cross-linked enterprise graph** in which organisation, process, systems, integrations, data and governance can be interrogated together.

## 1. Model-root structure

Keep all model data for one enterprise beneath a single Enterprise Model root:

```text
<enterprise-model-root>/
├── architecture/
│   ├── integrations.json
│   └── solution-architecture.bpmn
├── processes/
│   ├── process-layers.json
│   ├── process-catalog.json
│   └── <process BPMN files>
├── metadata/
│   └── <process metadata JSON files>
├── organisation/
│   └── org-chart.json
├── data/
│   └── data-catalogue.json
├── governance/
│   ├── process-governance.json
│   └── regulations.json
└── model/
    └── relationships.json
```

Do not spread one enterprise's model across unrelated folders.

## 2. Stable IDs

Every cross-model entity needs a stable ID.

Use lower-case, readable IDs where the schema permits:

```text
system-t24
system-salesforce
if-salesforce-t24
data-customer-profile
pos-head-lending
customer-onboarding
```

For BPMN elements, preserve the existing BPMN element ID once metadata or other files refer to it.

Rules:

- Names may change; IDs should normally not.
- Never recycle a retired ID for a different entity.
- Before creating a new entity, search for an existing record representing the same thing.
- Every foreign-key-style reference must resolve to an existing entity unless deliberately marked TBC in notes/status.

## 3. Organisation model

Canonical file:

```text
organisation/org-chart.json
```

The current schema contains:

- `departments`
- `teams`
- `roles`
- `positions`
- `people`

### Preferred ownership model

Use **positions** as the stable ownership reference.

Other model files commonly use fields such as:

- `ownerPositionId`
- `approverPositionId`
- `businessOwnerPositionId`
- `dataStewardPositionId`

This is preferable to directly storing a person's name because people can move while the organisational responsibility remains.

### Position hierarchy

A position can reference:

- `roleId`
- `departmentId`
- `managerPositionId`
- `teamIds`

Use `managerPositionId` to construct reporting lines.

People should reference `positionId` where possible.

### Agent authoring rules

When creating or changing the organisation:

1. Reuse existing departments, roles and teams where possible.
2. Create the position before referencing it elsewhere.
3. Ensure every `managerPositionId`, `roleId`, `departmentId` and team ID resolves.
4. If a person changes role, prefer changing their `positionId` rather than changing ownership fields across the whole model.
5. Keep inactive historical records rather than silently repurposing them when history matters.

## 4. Process hierarchy and BPMN

Canonical files:

```text
processes/process-layers.json
processes/process-catalog.json
processes/**/*.bpmn
metadata/**/*.json
governance/process-governance.json
```

### Process catalogue

Each process record includes fields such as:

- `id`
- `bpmnProcessId`
- `name`
- `layerId`
- `filename`
- `url`
- `metadataUrl`
- `parentId`
- `active`

The process `id` is the cross-model identifier used by governance, data-flow and relationship records.

`parentId` defines the process hierarchy.

### BPMN authoring

BPMN is the visual and execution-flow representation.

Use BPMN elements deliberately:

- Tasks/activities for work.
- Gateways for real decision/split/merge semantics.
- Events for real start/end/intermediate events.
- Sequence flows for process order.
- Pools/lanes when participant or responsibility structure is meaningful.
- Call Activities or metadata drill-down relationships for decomposition where appropriate.

Do not create decorative BPMN constructs merely for layout.

### BPMN element IDs

Process metadata can refer to exact BPMN nodes using IDs such as `Task_5`.

Therefore:

- Preserve a BPMN node ID if the node is being renamed or moved.
- If replacing a node with a materially different activity, update every metadata/data-flow reference that points to the old node.
- Never assume a displayed BPMN label is unique.

### Process metadata

Metadata files connect BPMN nodes to:

- systems
- controls
- risks
- regulations
- notes
- responsible roles/teams
- links to other processes

Where a node-level relationship is known, capture it at node level instead of only at whole-process level.

### Process governance

`governance/process-governance.json` connects a process to:

- owner position
- approver position
- lifecycle status
- channels
- systems
- interfaces
- regulations
- version/review details

Keep `systemIds`, `interfaceIds` and `regulationIds` aligned with the actual process and BPMN metadata.

## 5. Systems and integration architecture

Canonical files:

```text
architecture/integrations.json
architecture/solution-architecture.bpmn
```

### Systems

Typical system fields include:

- `id`
- `name`
- `type`
- `architectureLayer`
- `supplier`
- `environments`
- `dataClassification`
- `integrationType`
- `ownerPositionId`
- `criticality`
- `active`
- `notes`
- optional `parentSystemId`
- optional `isContainer`

Use `parentSystemId` for application suites/components, for example:

```text
EFS
├── LN
├── DM
└── BPM
```

Do not create a second duplicate system merely because it exists in multiple environments. Use `environments`.

### Interfaces

Typical interface fields include:

- `id`
- `name`
- `sourceSystemId`
- `targetSystemId`
- `direction`
- `protocol`
- `authentication`
- `lineStyle`
- `environments`
- `ownerPositionId`
- `criticality`
- `status`
- `documentationReference`
- `notes`

Direction is semantic, not decorative:

- `outbound`: source → target
- `inbound`: source ← target
- `bidirectional`: source ↔ target

For impact analysis, record the real direction wherever known.

### Solution Architecture BPMN

The BPMN file is the visual layout of systems and interfaces.

Keep system and interface BPMN IDs aligned with the catalogue IDs where the application expects this.

Architecture lanes represent broad architecture domains. System containers represent product/application suites within those lanes.

## 6. Data architecture

Canonical file:

```text
data/data-catalogue.json
```

The current model contains at least two important collections:

- `dataObjects`
- `dataFlows`

### Data objects

Typical fields include:

- `id`
- `name`
- `description`
- `domain`
- `businessOwnerPositionId`
- `dataStewardPositionId`
- `classification`
- `personalData`
- `specialCategoryData`
- `systemOfRecordId`
- `retentionPeriod`
- `dataResidency`
- `criticality`
- `active`
- `notes`

Use `systemOfRecordId` to identify the authoritative master where known.

Do not infer a system of record simply because a system consumes or displays the data.

### Data flows

A data-flow record can connect data, systems, interfaces and processes in one place.

Typical fields include:

- `id`
- `name`
- `sourceSystemId`
- `targetSystemId`
- `dataObjectIds`
- `processId`
- `processNodeId`
- `interfaceId`
- `direction`
- `frequency`
- `protocol`
- `classification`
- `encryption`
- `purpose`
- `ownerPositionId`
- `active`
- `notes`

This is one of the most important structures for impact analysis.

When modelling an integration that transports business data, create or update the corresponding data-flow record rather than documenting the payload only in prose.

A good data flow answers:

- where the data originates
- where it goes
- what data objects move
- which interface carries it
- which process/process step uses it
- who owns the flow
- why it exists
- how frequently it moves
- what protocol/security applies

## 7. Regulations and governance

Canonical file:

```text
governance/regulations.json
```

Regulation records include an `ownerPositionId`.

Link regulations to processes via process governance and/or node metadata rather than relying solely on free-text notes.

An agent should not invent regulatory applicability. Add a relationship only when supported by source material or explicit user instruction.

## 8. Cross-domain relationship graph

Canonical file:

```text
model/relationships.json
```

Each relationship has:

- `id`
- `type`
- `source.type`
- `source.id`
- `target.type`
- `target.id`
- description/owner/status fields

Use this graph to represent relationships that are not already sufficiently captured by a domain file, and as a cross-domain navigation/index layer.

Do not allow it to contradict the authoritative domain files.

If a relationship can be verified from a stronger domain record — for example a data flow or interface — that domain record takes precedence.

## 9. Authoring workflow for an AI agent

Before changing model data:

1. Locate the Enterprise Model root.
2. Read the relevant canonical file(s).
3. Search existing IDs to avoid duplicates.
4. Identify every downstream reference to the entity being changed.
5. Make the smallest coherent set of edits.
6. Validate all referenced IDs.
7. Check BPMN IDs against metadata/data-flow node references.
8. Check process/system/interface/data ownership positions exist in `org-chart.json`.
9. Check interface/data-flow directions agree.
10. Summarise assumptions and unresolved TBC items rather than silently guessing.

## 10. Minimum completeness for useful impact analysis

For a system change to be meaningfully interrogable, aim to capture:

- system owner
- inbound/outbound interfaces
- interface owners
- data flows over those interfaces
- data objects in each flow
- affected processes/process nodes
- process owners/approvers
- data owners/stewards
- system of record
- relevant regulations where known

The richer these joins are, the better an AI agent can answer stakeholder and change-impact questions.
