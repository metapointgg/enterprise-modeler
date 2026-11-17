import {
  activateEnterpriseModelFolder,
  writeDirectoryJson,
  writeDirectoryText,
  type LocalDirectoryHandle,
} from './modelWorkspace';

export interface StarterEnterpriseModelOptions {
  name: string;
  organisationName?: string;
}

export async function createStarterEnterpriseModel(
  directory: LocalDirectoryHandle,
  options: StarterEnterpriseModelOptions,
): Promise<string> {
  const name = options.name.trim() || directory.name || 'Enterprise Model';
  const organisationName = options.organisationName?.trim() || name;
  const createdAt = new Date().toISOString();

  const rootProcessId = 'enterprise-operating-model';
  const rootBpmnProcessId = 'Process_EnterpriseOperatingModel';

  await Promise.all([
    writeDirectoryJson(directory, 'model/manifest.json', {
      schemaVersion: 1,
      name,
      organisationName,
      createdAt,
      updatedAt: createdAt,
    }),
    writeDirectoryJson(directory, 'processes/process-layers.json', {
      schemaVersion: 1,
      layers: [
        {
          id: 'layer-l0',
          code: 'L0',
          name: 'Enterprise Operating Model',
          description: 'Top-level enterprise operating model.',
          sequence: 10,
          active: true,
        },
        {
          id: 'layer-l1',
          code: 'L1',
          name: 'Business Processes',
          description: 'Top-level business process groups.',
          sequence: 20,
          active: true,
        },
      ],
    }),
    writeDirectoryJson(directory, 'processes/process-catalog.json', {
      schemaVersion: 1,
      rootProcessId,
      processes: [
        {
          id: rootProcessId,
          bpmnProcessId: rootBpmnProcessId,
          name: organisationName,
          layerId: 'layer-l0',
          filename: 'operating-model.bpmn',
          url: '/processes/operating-model.bpmn',
          metadataUrl: '/metadata/operating-model.json',
          active: true,
        },
      ],
    }),
    writeDirectoryText(directory, 'processes/operating-model.bpmn', createStarterProcessBpmn(rootBpmnProcessId, organisationName)),
    writeDirectoryJson(directory, 'metadata/operating-model.json', {
      schemaVersion: 3,
      processId: rootBpmnProcessId,
      nodes: {},
    }),
    writeDirectoryJson(directory, 'organisation/org-chart.json', {
      schemaVersion: 2,
      departments: [
        {
          id: 'department-organisation',
          name: organisationName,
        },
      ],
      teams: [],
      roles: [
        {
          id: 'role-model-owner',
          name: 'Model Owner',
          departmentId: 'department-organisation',
        },
      ],
      positions: [
        {
          id: 'position-model-owner',
          name: 'Model Owner',
          roleId: 'role-model-owner',
          departmentId: 'department-organisation',
          teamIds: [],
          active: true,
          notes: 'Initial model-owner position created with the Enterprise Model.',
        },
      ],
      people: [],
    }),
    writeDirectoryJson(directory, 'architecture/integrations.json', {
      schemaVersion: 2,
      systems: [],
      interfaces: [],
    }),
    writeDirectoryText(directory, 'architecture/solution-architecture.bpmn', createStarterArchitectureBpmn()),
    writeDirectoryJson(directory, 'data/data-catalogue.json', {
      schemaVersion: 1,
      dataObjects: [],
      dataFlows: [],
    }),
    writeDirectoryJson(directory, 'governance/process-governance.json', {
      schemaVersion: 1,
      records: [
        {
          processId: rootProcessId,
          status: 'draft',
          ownerPositionId: 'position-model-owner',
          approverPositionId: 'position-model-owner',
          version: '0.1',
          effectiveDate: '',
          reviewDate: '',
          channels: [],
          systemIds: [],
          interfaceIds: [],
          regulationIds: [],
          changeSummary: 'Initial Enterprise Model.',
          updatedAt: createdAt,
        },
      ],
    }),
    writeDirectoryJson(directory, 'governance/regulations.json', {
      schemaVersion: 1,
      regulations: [],
    }),
    writeDirectoryJson(directory, 'governance/governance-catalogue.json', {
      schemaVersion: 1,
      businessRules: [],
      controls: [],
      risks: [],
      requirements: [],
      policies: [],
    }),
    writeDirectoryJson(directory, 'model/relationships.json', {
      schemaVersion: 1,
      relationships: [],
    }),
    writeDirectoryText(directory, 'README.md', createModelReadme(name, organisationName)),
  ]);

  return activateEnterpriseModelFolder(directory);
}

function createStarterProcessBpmn(processId: string, name: string): string {
  const safeName = escapeXml(name);
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_EnterpriseOperatingModel"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${processId}" name="${safeName}" isExecutable="false">
    <bpmn:startEvent id="StartEvent_OperatingModel" name="Start">
      <bpmn:outgoing>Flow_Start_To_Model</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_OperatingModel" name="Define operating model">
      <bpmn:incoming>Flow_Start_To_Model</bpmn:incoming>
      <bpmn:outgoing>Flow_Model_To_End</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_OperatingModel" name="Complete">
      <bpmn:incoming>Flow_Model_To_End</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Start_To_Model" sourceRef="StartEvent_OperatingModel" targetRef="Task_OperatingModel" />
    <bpmn:sequenceFlow id="Flow_Model_To_End" sourceRef="Task_OperatingModel" targetRef="EndEvent_OperatingModel" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_OperatingModel">
    <bpmndi:BPMNPlane id="BPMNPlane_OperatingModel" bpmnElement="${processId}">
      <bpmndi:BPMNShape id="StartEvent_OperatingModel_di" bpmnElement="StartEvent_OperatingModel">
        <dc:Bounds x="180" y="182" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_OperatingModel_di" bpmnElement="Task_OperatingModel">
        <dc:Bounds x="285" y="160" width="130" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_OperatingModel_di" bpmnElement="EndEvent_OperatingModel">
        <dc:Bounds x="490" y="182" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Start_To_Model_di" bpmnElement="Flow_Start_To_Model">
        <di:waypoint x="216" y="200" />
        <di:waypoint x="285" y="200" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Model_To_End_di" bpmnElement="Flow_Model_To_End">
        <di:waypoint x="415" y="200" />
        <di:waypoint x="490" y="200" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function createStarterArchitectureBpmn(): string {
  const lanes = [
    ['channel', 'Channels & Experience'],
    ['integration', 'API & Integration'],
    ['platform', 'Core Platforms & Data'],
    ['security', 'Identity, Security & Control'],
    ['partner', 'External Providers'],
  ] as const;

  const processes = lanes
    .map(([id, label]) => `  <bpmn:process id="ArchitectureProcess_${id}" name="${escapeXml(label)}" isExecutable="false" />`)
    .join('\n');

  const participants = lanes
    .map(([id, label]) => `    <bpmn:participant id="ArchitectureLayer_${id}" name="${escapeXml(label)}" processRef="ArchitectureProcess_${id}" />`)
    .join('\n');

  const shapes = lanes
    .map(([id], index) => {
      const y = 70 + (index * 145);
      return `      <bpmndi:BPMNShape id="ArchitectureLayer_${id}_di" bpmnElement="ArchitectureLayer_${id}" isHorizontal="true">
        <dc:Bounds x="80" y="${y}" width="1200" height="120" />
      </bpmndi:BPMNShape>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_SolutionArchitecture"
  targetNamespace="https://enterprise-modeler.local/architecture">
${processes}
  <bpmn:collaboration id="Collaboration_SolutionArchitecture">
${participants}
  </bpmn:collaboration>
  <bpmndi:BPMNDiagram id="BPMNDiagram_SolutionArchitecture">
    <bpmndi:BPMNPlane id="BPMNPlane_SolutionArchitecture" bpmnElement="Collaboration_SolutionArchitecture">
${shapes}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function createModelReadme(name: string, organisationName: string): string {
  return `# ${name}

Enterprise Model for ${organisationName}.

This folder is the source of truth for Enterprise Modeler.

## Structure

- \`architecture/\` — systems, interfaces and Solution Architecture BPMN
- \`processes/\` — process hierarchy and BPMN
- \`metadata/\` — process-node metadata
- \`organisation/\` — organisation, roles, positions and people
- \`data/\` — data objects and data flows
- \`governance/\` — process governance, regulations, controls, risks and policies
- \`model/\` — cross-domain relationships and model manifest
`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
