# Enterprise Modeler

Enterprise Modeler is a generic enterprise operating-model and architecture repository built around BPMN 2.0.

It is derived from the proven Banxlocal Process Modeler application framework, but contains no Banxlocal process, organisation, branch, partner, or regulatory seed data.

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
