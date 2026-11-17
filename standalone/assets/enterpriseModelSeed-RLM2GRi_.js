import{h as e,m as t,n}from"./modelWorkspace-D0F3WQyF.js";async function r(r,s){let c=s.name.trim()||r.name||`Enterprise Model`,l=s.organisationName?.trim()||c,u=new Date().toISOString(),d=`enterprise-operating-model`,f=`Process_EnterpriseOperatingModel`;return await Promise.all([t(r,`model/manifest.json`,{schemaVersion:1,name:c,organisationName:l,createdAt:u,updatedAt:u}),t(r,`processes/process-layers.json`,{schemaVersion:1,layers:[{id:`layer-l0`,code:`L0`,name:`Enterprise Operating Model`,description:`Top-level enterprise operating model.`,sequence:10,active:!0},{id:`layer-l1`,code:`L1`,name:`Business Processes`,description:`Top-level business process groups.`,sequence:20,active:!0}]}),t(r,`processes/process-catalog.json`,{schemaVersion:1,rootProcessId:d,processes:[{id:d,bpmnProcessId:f,name:l,layerId:`layer-l0`,filename:`operating-model.bpmn`,url:`/processes/operating-model.bpmn`,metadataUrl:`/metadata/operating-model.json`,active:!0}]}),e(r,`processes/operating-model.bpmn`,i(f,l)),t(r,`metadata/operating-model.json`,{schemaVersion:3,processId:f,nodes:{}}),t(r,`organisation/org-chart.json`,{schemaVersion:2,departments:[{id:`department-organisation`,name:l}],teams:[],roles:[{id:`role-model-owner`,name:`Model Owner`,departmentId:`department-organisation`}],positions:[{id:`position-model-owner`,name:`Model Owner`,roleId:`role-model-owner`,departmentId:`department-organisation`,teamIds:[],active:!0,notes:`Initial model-owner position created with the Enterprise Model.`}],people:[]}),t(r,`architecture/integrations.json`,{schemaVersion:2,systems:[],interfaces:[]}),e(r,`architecture/solution-architecture.bpmn`,a()),t(r,`data/data-catalogue.json`,{schemaVersion:1,dataObjects:[],dataFlows:[]}),t(r,`governance/process-governance.json`,{schemaVersion:1,records:[{processId:d,status:`draft`,ownerPositionId:`position-model-owner`,approverPositionId:`position-model-owner`,version:`0.1`,effectiveDate:``,reviewDate:``,channels:[],systemIds:[],interfaceIds:[],regulationIds:[],changeSummary:`Initial Enterprise Model.`,updatedAt:u}]}),t(r,`governance/regulations.json`,{schemaVersion:1,regulations:[]}),t(r,`governance/governance-catalogue.json`,{schemaVersion:1,businessRules:[],controls:[],risks:[],requirements:[],policies:[]}),t(r,`model/relationships.json`,{schemaVersion:1,relationships:[]}),e(r,`README.md`,o(c,l))]),n(r)}function i(e,t){return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_EnterpriseOperatingModel"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${e}" name="${s(t)}" isExecutable="false">
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
    <bpmndi:BPMNPlane id="BPMNPlane_OperatingModel" bpmnElement="${e}">
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
</bpmn:definitions>`}function a(){let e=[[`channel`,`Channels & Experience`],[`integration`,`API & Integration`],[`platform`,`Core Platforms & Data`],[`security`,`Identity, Security & Control`],[`partner`,`External Providers`]];return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_SolutionArchitecture"
  targetNamespace="https://enterprise-modeler.local/architecture">
${e.map(([e,t])=>`  <bpmn:process id="ArchitectureProcess_${e}" name="${s(t)}" isExecutable="false" />`).join(`
`)}
  <bpmn:collaboration id="Collaboration_SolutionArchitecture">
${e.map(([e,t])=>`    <bpmn:participant id="ArchitectureLayer_${e}" name="${s(t)}" processRef="ArchitectureProcess_${e}" />`).join(`
`)}
  </bpmn:collaboration>
  <bpmndi:BPMNDiagram id="BPMNDiagram_SolutionArchitecture">
    <bpmndi:BPMNPlane id="BPMNPlane_SolutionArchitecture" bpmnElement="Collaboration_SolutionArchitecture">
${e.map(([e],t)=>`      <bpmndi:BPMNShape id="ArchitectureLayer_${e}_di" bpmnElement="ArchitectureLayer_${e}" isHorizontal="true">
        <dc:Bounds x="80" y="${70+t*145}" width="1200" height="120" />
      </bpmndi:BPMNShape>`).join(`
`)}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`}function o(e,t){return`# ${e}

Enterprise Model for ${t}.

This folder is the source of truth for Enterprise Modeler.

## Structure

- \`architecture/\` — systems, interfaces and Solution Architecture BPMN
- \`processes/\` — process hierarchy and BPMN
- \`metadata/\` — process-node metadata
- \`organisation/\` — organisation, roles, positions and people
- \`data/\` — data objects and data flows
- \`governance/\` — process governance, regulations, controls, risks and policies
- \`model/\` — cross-domain relationships and model manifest
`}function s(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&apos;`)}export{r as t};