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

## Status

Initial V1 genericisation and data-model expansion is in progress.


## Reference bank seed

The repository includes a comprehensive simple-bank reference model covering savings, lending and supporting banking functions. See `docs/simple-bank-reference-model.md`.

The seed is intentionally illustrative and channel-neutral. It contains sample people, systems, data, controls, risks and UK regulatory mappings so the Enterprise Relationship Explorer and Impact Analysis features can be exercised immediately.
