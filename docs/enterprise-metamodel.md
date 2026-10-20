# Enterprise Modeler metamodel

## Principle

The BPMN diagram is a view of process behaviour. Enterprise context is held in catalogues and explicit relationships so that every entity can be navigated in both directions.

## First-class entities

- Process and BPMN process node
- Person, role, position, team and department
- System and interface
- Data object and data flow
- Business rule
- Control
- Risk
- Regulation and requirement
- Policy / standard / procedure / guideline
- Asset and location

## Relationship examples

- Person **owns** Process
- Role **performs** Process Node
- Process **uses** System
- Process Node **reads / creates / updates** Data Object
- System **stores** Data Object
- Data Flow **transmits** Data Object
- Process **subject-to** Regulation
- Regulation **contains** Requirement
- Control **implements** Requirement
- Control **mitigates** Risk
- Process Node **governed-by** Business Rule

The relationship is stored once. Reverse views are derived at query time.

## Impact analysis

Impact analysis begins with any entity and traverses the relationship graph. A regulatory change can therefore identify requirements, controls, processes, process steps, systems, data and accountable people without maintaining separate duplicate mappings.
