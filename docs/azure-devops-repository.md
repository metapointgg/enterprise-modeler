# Azure DevOps Enterprise Model repositories

Enterprise Modeler can use an Azure DevOps Git repository as the live Enterprise Model workspace.

In this mode:

- the Enterprise Model remains in Azure Repos;
- Enterprise Modeler reads model files directly from the selected repository/branch;
- edits are batched and committed back to the selected branch;
- Azure DevOps branch SHA is used for optimistic concurrency, so the application fails closed if another user or agent changes the branch before a save;
- AI agents can interrogate the same repository independently through Azure DevOps MCP.

## Recommended architecture

```text
                           Azure DevOps Repo
                      client-enterprise-model
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        Enterprise Modeler              Azure DevOps MCP
        interactive editing                AI agents
                 │                           │
                 └──────── same model ───────┘
```

No local Git clone is required for normal Enterprise Modeler use when Azure DevOps repository mode is enabled.

## Authentication

Use Microsoft Entra ID delegated authentication. Do not put a Personal Access Token in the browser.

Azure DevOps resource identifier:

```text
499b84ac-1321-427f-aa17-267ca6975798
```

The Entra application used by Enterprise Modeler should be configured as a Single-page application and granted the Azure DevOps delegated Code read/write permission (`vso.code_write`).

The user still needs the appropriate Azure DevOps organisation/project/repository permissions. The Entra permission does not bypass Azure DevOps repository security.

## Entra application registration

In the client Microsoft Entra tenant:

1. Create an App registration for Enterprise Modeler.
2. Add a **Single-page application** redirect URI matching Enterprise Modeler, for example:

   ```text
   http://localhost:5173/
   ```

   or the deployed Enterprise Modeler URL.

3. Under **API permissions**, add the **Azure DevOps** delegated Code read/write permission.
4. Grant/admin-consent according to the client's policy.
5. Record:
   - Tenant ID
   - Application (client) ID

No client secret is required for the SPA PKCE flow.

## Runtime configuration

Copy the shape from:

```text
public/config/runtime.azure-devops.example.json
```

The relevant section is:

```json
{
  "azureDevOps": {
    "enabled": true,
    "tenantId": "<microsoft-entra-tenant-id>",
    "clientId": "<enterprise-modeler-entra-spa-client-id>",
    "redirectUri": "http://localhost:5173/",
    "scopes": [
      "openid",
      "profile",
      "offline_access",
      "499b84ac-1321-427f-aa17-267ca6975798/.default"
    ],
    "defaultOrganization": "<azure-devops-organisation>",
    "defaultProject": "<azure-devops-project>",
    "defaultRepository": "client-enterprise-model",
    "defaultBranch": "main",
    "defaultModelPath": ""
  }
}
```

The Azure DevOps app registration must have the delegated Azure DevOps Code read/write permission included in its configured permissions so that the `.default` scope grants it.

## Opening a model

At startup, when Azure DevOps integration is enabled, the model chooser includes an **Azure DevOps repository** section.

Supply:

- Organisation
- Project
- Repository name or ID
- Branch
- Model path within the repository

Leave **Model path** blank when the model is at repository root.

A repository can also contain the model under a subfolder, for example:

```text
enterprise-architecture/
  architecture/
  processes/
  organisation/
  data/
  governance/
  model/
```

In that case use:

```text
Model path: enterprise-architecture
```

The normal application menu also exposes:

```text
Model
→ Open Azure DevOps Repository
```

## Required model structure

The selected repository/model path is validated before activation. At minimum it must contain:

```text
processes/process-catalog.json
processes/process-layers.json
architecture/integrations.json
organisation/org-chart.json
```

Normal complete models also contain:

```text
architecture/solution-architecture.bpmn
metadata/
data/data-catalogue.json
governance/process-governance.json
governance/regulations.json
governance/governance-catalogue.json
model/relationships.json
model/manifest.json
```

## Save and commit behaviour

Enterprise Modeler coalesces nearby model writes into one Azure DevOps push rather than committing every individual autosave event.

Example commit messages:

```text
Update Enterprise Model: architecture/integrations.json
Update Enterprise Model (3 files)
```

The branch commit ID captured when the model is opened is retained.

Before a push Enterprise Modeler checks the branch head again:

```text
Opened branch SHA
       │
       ├── same SHA → create commit
       │
       └── changed SHA → stop and report conflict
```

This prevents Enterprise Modeler from silently overwriting model changes made by another person, pipeline or AI agent.

On a successful push the new branch commit ID becomes the workspace baseline.

## Relationship to Azure DevOps MCP

Azure DevOps MCP and Enterprise Modeler do not need to communicate with each other directly.

They share the repository as the source of truth:

- Enterprise Modeler authors and edits the model.
- Azure DevOps MCP gives AI agents read/write access according to their permissions.
- Git history records both human and agent changes.
- model IDs provide the cross-file joins used by agent impact analysis.

Agents should follow:

- `AGENTS.md`
- `docs/ai-model-authoring.md`
- `docs/ai-model-interrogation.md`

## Security notes

- Azure DevOps access tokens are stored only in browser session storage.
- Refresh tokens, when issued, are also session-scoped rather than persistent application configuration.
- No PAT is required or stored by Enterprise Modeler.
- The application uses OAuth 2.0 Authorization Code with PKCE.
- Azure DevOps remains responsible for project/repository authorization.
- Use least privilege and give users only the repository permissions they require.

## Current creation behaviour

Enterprise Modeler can create a new model directly in a local filesystem folder on browsers that support direct folder writes.

Azure DevOps mode currently opens and edits an existing Enterprise Model repository/path. To initialise a brand-new ADO repository, create the starter model locally and commit it once, or seed the repository through source control. Native initial creation directly into an empty Azure DevOps repository can be added separately.
