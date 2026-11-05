# Client architecture baseline

This branch contains the first-pass architecture model transcribed from the supplied whiteboard photographs.

## Modelling rules

- The whiteboards are treated as the **Production** topology.
- A **pink dot** on a system means a **Dev / Test** instance is represented.
- A **green dot** on a system means a **UAT** instance is represented.
- Systems remain canonical records and are not duplicated by environment.
- Environment views are filters over the same topology.
- Interface availability outside Production is initially inferred from the environments available at both endpoints unless the whiteboard explicitly states otherwise.
- Refreshes, copies and manual transfers between environments are recorded separately as `environmentOperations`; they are not treated as ordinary business interfaces.
- Unclear names, directions, protocols or environment coverage are retained as **TBC** rather than guessed.

## Canonical join points

The model intentionally treats these as single shared systems across the complete ecosystem:

- T24
- Salesforce
- BRAGI
- JADE
- eMortgages
- BIP

## Environment operations captured from the whiteboards

- Salesforce UAT: ad hoc refresh; note indicates refresh is allowed once monthly; data scrambled.
- Salesforce Dev: ad hoc refresh; data scrambled.
- T24 UAT: ad hoc refresh; not scrambled.
- T24 Dev: ad hoc refresh; not scrambled.
- GFS UAT: ad hoc refresh; not scrambled.
- GFS Dev: ad hoc refresh; not scrambled.
- BIP UAT: ad hoc refresh; not scrambled.
- T24 UAT → BIP UAT: manual transfer, with the whiteboard noting no SFTP.
- T24 UAT/Dev → GFS UAT/Dev: manual transfer.

## Open validation questions

1. Does Broker Portal have a distinct Dev/Test environment?
2. Confirm exact non-production coverage for JADE and eMortgages.
3. FCM has been corrected to Production + UAT + Dev/Test after confirming both green and pink markers in the supplied photograph.
4. Confirm SIO/HID environment coverage.
5. Confirm the precise role and ownership of BRAGI and the SQL staging component.
6. Confirm T24 → BRAGI database-sync mechanics and schedule.
7. Confirm HSBC SFTP server / connection ownership.
8. Confirm BIP ↔ HSBC PAIN/CAMT message types and directions.
9. Confirm FCM ↔ T24 direction and protocol.
10. Confirm the Indulge Customer Portal integration path.
11. Confirm the role and production topology, if any, for GFS.
12. Confirm whether NABU is a system, data store, or conceptual holding area.
13. Confirm which non-production interfaces actually exist; endpoint presence does not guarantee interface parity.
14. Confirm the dotted dependency visible around the eMortgages / BRAGI / T24 area before adding it as a formal interface.

## Files

- `public/architecture/integrations.json` — canonical systems, interfaces, environment availability and cross-environment operations.
- `public/architecture/solution-architecture.bpmn` — single joined architecture topology used by the Solution Architecture Map.

This baseline should be validated with client SMEs before any TBC records are promoted to confirmed architecture.
