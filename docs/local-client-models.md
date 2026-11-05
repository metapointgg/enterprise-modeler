# Local client model repository

Enterprise Modeler application code can be updated from Git without overwriting client-specific BPMN, architecture or model data.

## Local folder

Client model files should live under:

```
public/client-models/
```

That folder is ignored by Git.

The folder mirrors the normal `public/` model structure:

```
public/client-models/
  architecture/
    integrations.json
    solution-architecture.bpmn
  processes/
    process-layers.json
    process-catalog.json
    ...
  metadata/
    ...
  organisation/
    org-chart.json
  governance/
    process-governance.json
    regulations.json
```

## Select the local model repository

Create a local file named `.env.local` in the repository root:

```
VITE_MODEL_ROOT=/client-models
```

`.env.local` is ignored by Git.

Restart `npm run dev` after changing it.

With no `VITE_MODEL_ROOT`, Enterprise Modeler continues to load the generic sample data from the normal `public/` folders.

## One-time migration for an existing client checkout

Before resetting or pulling over client-modified model files, copy the current client data into `public/client-models`.

PowerShell example:

```powershell
New-Item -ItemType Directory -Force public/client-models | Out-Null

$folders = @(
  "architecture",
  "processes",
  "metadata",
  "organisation",
  "governance"
)

foreach ($folder in $folders) {
  if (Test-Path "public/$folder") {
    Copy-Item "public/$folder" "public/client-models/$folder" -Recurse -Force
  }
}

@"
VITE_MODEL_ROOT=/client-models
"@ | Set-Content .env.local
```

Confirm the client models load correctly before reverting any tracked model-file changes.

After migration, application functionality can be updated independently with normal Git pulls while client model files remain local and untouched.
