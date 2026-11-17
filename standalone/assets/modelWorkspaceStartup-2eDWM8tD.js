import{d as e,f as t,h as n,i as r,m as i,n as a,o,p as s,r as c,t as l,u}from"./modelWorkspace-D0F3WQyF.js";async function d(e,t){let r=t.name.trim()||e.name||`Enterprise Model`,o=t.organisationName?.trim()||r,s=new Date().toISOString(),c=`enterprise-operating-model`,l=`Process_EnterpriseOperatingModel`;return await Promise.all([i(e,`model/manifest.json`,{schemaVersion:1,name:r,organisationName:o,createdAt:s,updatedAt:s}),i(e,`processes/process-layers.json`,{schemaVersion:1,layers:[{id:`layer-l0`,code:`L0`,name:`Enterprise Operating Model`,description:`Top-level enterprise operating model.`,sequence:10,active:!0},{id:`layer-l1`,code:`L1`,name:`Business Processes`,description:`Top-level business process groups.`,sequence:20,active:!0}]}),i(e,`processes/process-catalog.json`,{schemaVersion:1,rootProcessId:c,processes:[{id:c,bpmnProcessId:l,name:o,layerId:`layer-l0`,filename:`operating-model.bpmn`,url:`/processes/operating-model.bpmn`,metadataUrl:`/metadata/operating-model.json`,active:!0}]}),n(e,`processes/operating-model.bpmn`,f(l,o)),i(e,`metadata/operating-model.json`,{schemaVersion:3,processId:l,nodes:{}}),i(e,`organisation/org-chart.json`,{schemaVersion:2,departments:[{id:`department-organisation`,name:o}],teams:[],roles:[{id:`role-model-owner`,name:`Model Owner`,departmentId:`department-organisation`}],positions:[{id:`position-model-owner`,name:`Model Owner`,roleId:`role-model-owner`,departmentId:`department-organisation`,teamIds:[],active:!0,notes:`Initial model-owner position created with the Enterprise Model.`}],people:[]}),i(e,`architecture/integrations.json`,{schemaVersion:2,systems:[],interfaces:[]}),n(e,`architecture/solution-architecture.bpmn`,p()),i(e,`data/data-catalogue.json`,{schemaVersion:1,dataObjects:[],dataFlows:[]}),i(e,`governance/process-governance.json`,{schemaVersion:1,records:[{processId:c,status:`draft`,ownerPositionId:`position-model-owner`,approverPositionId:`position-model-owner`,version:`0.1`,effectiveDate:``,reviewDate:``,channels:[],systemIds:[],interfaceIds:[],regulationIds:[],changeSummary:`Initial Enterprise Model.`,updatedAt:s}]}),i(e,`governance/regulations.json`,{schemaVersion:1,regulations:[]}),i(e,`governance/governance-catalogue.json`,{schemaVersion:1,businessRules:[],controls:[],risks:[],requirements:[],policies:[]}),i(e,`model/relationships.json`,{schemaVersion:1,relationships:[]}),n(e,`README.md`,m(r,o))]),a(e)}function f(e,t){return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_EnterpriseOperatingModel"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${e}" name="${h(t)}" isExecutable="false">
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
</bpmn:definitions>`}function p(){let e=[[`channel`,`Channels & Experience`],[`integration`,`API & Integration`],[`platform`,`Core Platforms & Data`],[`security`,`Identity, Security & Control`],[`partner`,`External Providers`]];return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_SolutionArchitecture"
  targetNamespace="https://enterprise-modeler.local/architecture">
${e.map(([e,t])=>`  <bpmn:process id="ArchitectureProcess_${e}" name="${h(t)}" isExecutable="false" />`).join(`
`)}
  <bpmn:collaboration id="Collaboration_SolutionArchitecture">
${e.map(([e,t])=>`    <bpmn:participant id="ArchitectureLayer_${e}" name="${h(t)}" processRef="ArchitectureProcess_${e}" />`).join(`
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
</bpmn:definitions>`}function m(e,t){return`# ${e}

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
`}function h(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&apos;`)}async function g(t){if(t.remoteRepositoryEnabled){c();return}await e()||await _()}async function _(){return new Promise(e=>{let n=document.createElement(`div`);n.id=`enterprise-model-workspace-chooser`,n.style.cssText=[`position:fixed`,`inset:0`,`z-index:2147483000`,`display:grid`,`place-items:center`,`padding:28px`,`background:#f8fafc`,`font-family:Inter,Arial,sans-serif`,`color:#0f172a`].join(`;`);let i=o(),c=s();n.innerHTML=`
      <section style="width:min(680px,100%);border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 18px 55px rgba(15,23,42,.12);overflow:hidden">
        <div style="padding:26px 28px 18px;border-bottom:1px solid #e2e8f0">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Enterprise Modeler</div>
          <h1 style="margin:7px 0 8px;font-size:24px">Choose an Enterprise Model</h1>
          <p style="margin:0;color:#475569;line-height:1.55">Enterprise Modeler keeps application code separate from model data. Open an existing model folder or create a new model in a folder you choose.</p>
        </div>
        <div style="display:grid;gap:14px;padding:22px 28px 28px">
          ${i&&c?`
            <button id="workspace-reopen" type="button" style="${v()}">
              Reopen ${S(i)}
            </button>
          `:``}
          <button id="workspace-open" type="button" style="${y()}">
            Open existing Enterprise Model
          </button>
          <div style="height:1px;background:#e2e8f0;margin:4px 0"></div>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            New model name
            <input id="workspace-model-name" value="Enterprise Model" style="${x()}" />
          </label>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            Organisation name
            <input id="workspace-organisation-name" value="" placeholder="Organisation name" style="${x()}" />
          </label>
          <button id="workspace-create" type="button" style="${c?v():b()}" ${c?``:`disabled`}>
            Create new Enterprise Model
          </button>
          ${c?`<p style="margin:0;color:#64748b;font-size:11px;line-height:1.45">Choose the folder that will become the model root. The application creates the architecture, process, organisation, data, governance and relationship files inside it.</p>`:`<p style="margin:0;color:#92400e;font-size:11px;line-height:1.45">This browser can open an existing model folder, but cannot create or write directly to arbitrary folders. Use Edge or Chrome to create a new filesystem-backed model. Existing folders opened here are retained as a browser workspace.</p>`}
          <div id="workspace-error" role="alert" style="display:none;padding:10px 12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:12px"></div>
        </div>
      </section>
    `,document.body.appendChild(n);let f=n.querySelector(`#workspace-error`),p=e=>{f&&(f.style.display=`block`,f.textContent=e instanceof Error?e.message:String(e))},m=()=>{n.remove(),e()};n.querySelector(`#workspace-reopen`)?.addEventListener(`click`,()=>{(async()=>{try{await u()?m():p(`The previous model folder could not be reopened. Choose it again.`)}catch(e){p(e)}})()}),n.querySelector(`#workspace-open`)?.addEventListener(`click`,()=>{(async()=>{try{s()?a(await t()):await l(await r()),m()}catch(e){p(e)}})()}),n.querySelector(`#workspace-create`)?.addEventListener(`click`,()=>{(async()=>{try{let e=n.querySelector(`#workspace-model-name`)?.value.trim()||`Enterprise Model`,r=n.querySelector(`#workspace-organisation-name`)?.value.trim()||e;await d(await t(),{name:e,organisationName:r}),m()}catch(e){p(e)}})()})})}function v(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #1d4ed8`,`border-radius:8px`,`background:#2563eb`,`color:#fff`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function y(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #cbd5e1`,`border-radius:8px`,`background:#fff`,`color:#0f172a`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function b(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #e2e8f0`,`border-radius:8px`,`background:#f1f5f9`,`color:#94a3b8`,`font:inherit`,`font-weight:700`,`cursor:not-allowed`].join(`;`)}function x(){return[`width:100%`,`box-sizing:border-box`,`padding:9px 10px`,`border:1px solid #cbd5e1`,`border-radius:7px`,`font:inherit`,`color:#0f172a`].join(`;`)}function S(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}export{g as initialiseEnterpriseModelWorkspace};