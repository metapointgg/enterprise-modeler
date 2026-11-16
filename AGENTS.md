# Enterprise Modeler — AI Agent Instructions

This repository contains both application code and enterprise-model data.

For agent work, treat the **enterprise model as the primary source of organisational truth** and the application code as the implementation that reads and edits it.

## Start here

Read these two guides before creating, editing, or interrogating model data:

- `docs/ai-model-authoring.md` — how to build and maintain organisation, process, systems/integration and data models.
- `docs/ai-model-interrogation.md` — how to answer impact, ownership, dependency, lineage and stakeholder questions from the model.

## Enterprise Model root

An Enterprise Model is one folder containing the related model domains:

```text
<enterprise-model-root>/
├── architecture/
│   ├── integrations.json
│   └── solution-architecture.bpmn
├── processes/
│   ├── process-layers.json
│   ├── process-catalog.json
│   └── ...
├── metadata/
│   └── ...
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

When using Azure DevOps MCP or another repository connector, locate the Enterprise Model root by finding a folder that contains at least:

- `processes/process-catalog.json`
- `architecture/integrations.json`
- `organisation/org-chart.json`

If multiple Enterprise Model roots are present, do not mix them. Determine which model the user means before traversing relationships.

## Core modelling rule

**IDs are the contract between files.**

Never join models by display name when a stable ID is available.

Examples:

- `system-t24`
- `if-salesforce-t24`
- `customer-onboarding`
- `Task_5`
- `data-customer-profile`
- `pos-head-customer-ops`

Do not change an existing ID merely because a label or name changes.

## Evidence discipline

When answering questions from the model:

1. Read the relevant source model files.
2. Follow explicit IDs and relationships.
3. Distinguish **direct model evidence** from **inference**.
4. Do not invent missing ownership, data lineage, interface direction or process dependency.
5. Treat records marked inactive, retired, design or TBC according to their explicit status.
6. If the model is incomplete, state the gap and identify the file/relationship that should be added.

## Azure DevOps MCP usage

When this repository is hosted in Azure DevOps:

- Use repository search/list/read operations to locate model files.
- Prefer targeted reads of JSON/BPMN files over broad code search.
- Traverse IDs across files rather than relying on filename similarity.
- Use source-control history only when the user asks what changed, who changed it, or how the model evolved.
- Do not treat application TypeScript as authoritative business-model data unless the model schema itself is being investigated.
- For impact analysis, verify important relationships in their domain source files even if `model/relationships.json` provides a convenient cross-domain edge.

## Typical questions this model should support

Examples include:

- If system X changes, which downstream systems, processes and owners are affected?
- If interface Y changes, what data crosses it and which process steps rely on it?
- Which business owners and data stewards should be stakeholders in a change?
- Where is a data object mastered and where does it flow?
- Which processes use a system or interface?
- Which regulations are attached to an impacted process?
- Which teams or named people sit behind the impacted positions?
- What is the blast radius of retiring a system, interface or process?

Use the traversal recipes in `docs/ai-model-interrogation.md` for these questions.
