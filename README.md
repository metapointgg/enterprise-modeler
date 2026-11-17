# Enterprise Modeler

Enterprise Modeler is a generic enterprise operating-model and architecture repository built around BPMN 2.0.

It is a vendor-neutral modeler with a neutral seed repository and no client-specific process, organisation, technology or regulatory data.

## V1 scope

- Hierarchical BPMN process modelling (L0-L4)
- Organisation, people, roles, teams and positions
- Systems and integration catalogue
- Data catalogue, data flows and lineage
- Business rules
- Controls and risks
- Regulations and regulatory requirements
- Policies and standards
- Generic relationship graph across all entity types
- Entity-centric views and impact analysis
- BPMN and SVG export
- Repository versioning and optional AWS/Cognito deployment

## Core principle

BPMN is the process visualisation layer. The enterprise model underneath connects processes and process steps to people, organisation, systems, data, rules, controls, risks and regulations.

A relationship is stored once and can be navigated in either direction, enabling questions such as:

- Which people own or support this process?
- Which systems and data does this process use?
- Which processes use this data object?
- Which processes and controls are impacted by a regulatory change?
- Which processes, systems and data are connected to this person or role?

## Dependency-free standalone deployment

The repository contains a pre-built `standalone/` application distribution generated from the current `main` branch. It contains no Enterprise Model data. The machine on which Enterprise Modeler is installed does **not** need Node.js, npm, access to the npm registry, or any other dependency download.

After cloning or pulling the repository, run:

```bash
python run.py
```

Then open:

```text
http://127.0.0.1:8080
```

To expose the application on another interface or port:

```bash
python run.py --host 0.0.0.0 --port 8080
```

The launcher uses only the Python standard library. Alternatively, `standalone/` can be served directly by any static web server.

### Source development

npm is required only when changing or rebuilding the source application:

```bash
npm ci
npm run dev
```

`npm run build:aws` remains the secure deployment build and strips protected repository data. `npm run build:standalone` retains the generic reference repository for the dependency-free standalone distribution.

## Enterprise Model workspaces

Enterprise Modeler does not require a bundled reference model. Application code and model data are deliberately separate.

At startup the application:

1. restores the last Enterprise Model when browser permissions allow;
2. otherwise offers to open an existing Enterprise Model folder; or
3. offers to create a new minimal Enterprise Model in a folder chosen by the user.

A model root contains the architecture, process, metadata, organisation, data, governance and relationship domains. The application repository retains only application/runtime assets under `public/config/`.

## AI agent guidance

This repository includes instructions for AI agents that build or interrogate Enterprise Models, including Azure DevOps MCP workflows:

- `AGENTS.md` — agent entry point and model-root conventions.
- `docs/ai-model-authoring.md` — organisation, process, systems/integration, data and governance authoring rules.
- `docs/ai-model-interrogation.md` — dependency traversal, impact analysis, stakeholder discovery and data-lineage interrogation.

The guidance is designed so an agent can answer questions such as which downstream systems, data, processes and owners are affected by changing a system or integration point.

## Status

Initial V1 genericisation and data-model expansion is in progress.

## Reference bank seed

The repository includes a comprehensive simple-bank reference model covering savings, lending and supporting banking functions. See `docs/simple-bank-reference-model.md`.

The seed is intentionally illustrative and channel-neutral. It contains sample people, systems, data, controls, risks and UK regulatory mappings so the Enterprise Relationship Explorer and Impact Analysis features can be exercised immediately.
