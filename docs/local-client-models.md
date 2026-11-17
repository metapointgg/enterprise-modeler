# External Enterprise Model workspaces

Enterprise Modeler application code and Enterprise Model data are separate repositories/folders.

## Recommended local layout

```text
C:\\ProjectsGit\\
├── enterprise-modeler\\
│   └── public\\config\\
│       ├── runtime.json
│       └── runtime.standalone.json
└── client-enterprise-model\\
    ├── architecture\\
    ├── processes\\
    ├── metadata\\
    ├── organisation\\
    ├── data\\
    ├── governance\\
    └── model\\
```

Do not place client model data under `enterprise-modeler/public/`.

## Startup behaviour

Enterprise Modeler attempts to restore the last model workspace. If it cannot, it presents a chooser to open an existing model or create a new one.

Creating a new model generates a minimal but valid set of model files including:

- a root L0 process and BPMN file;
- a minimal organisation and model-owner position;
- an empty systems/integration catalogue and valid Solution Architecture BPMN;
- empty data catalogue;
- initial process governance;
- empty regulations, governance catalogue and relationship graph;
- `model/manifest.json`.

## Browser storage

Chromium browsers can retain a directory handle in browser storage. On restart, the browser may require permission to reopen it.

Browsers without direct File System Access can open an existing folder as a browser-backed workspace. They cannot write arbitrary filesystem folders directly, so filesystem-backed model creation requires a browser/platform that provides directory write access.

## Application files

Only application runtime configuration belongs under `enterprise-modeler/public/`:

```text
public/config/
  runtime.json
  runtime.standalone.json
```

All model-domain folders belong in the selected Enterprise Model repository.
