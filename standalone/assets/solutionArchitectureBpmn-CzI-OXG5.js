import{t as e}from"./Modeler-Bi03ARIg.js";import{c as t,d as n,n as r,p as i,t as a,u as o}from"./operatingModelRegistry-B85z2x8K.js";import{c as s,f as c}from"./organisation-4SmD6Ce4.js";import{p as l}from"./processCatalog-C9JSMFlk.js";/* empty css             */var u=`/architecture/solution-architecture.bpmn`,d=`enterprise-modeler.solution-architecture-bpmn.v3`,f=`ArchitectureLayer_`,p=`ArchitectureProcess_`,m=`architecture-bpmn-faded`,h=`architecture-bpmn-environment-faded`,g=class{dialog;canvasHost;contextPanel;modeler;data={schemaVersion:2,systems:[],interfaces:[]};organisation=null;governanceRecords=[];repository={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};selectedElement=null;focusProcessId=``;environmentView=`production`;loaded=!1;suppressModelEvents=!1;internalRegistryWrite=!1;autosaveTimer;registrySyncTimer;constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`solution-architecture-dialog solution-architecture-bpmn-dialog`,this.dialog.innerHTML=this.renderShell(),document.body.appendChild(this.dialog);let t=this.dialog.querySelector(`#solution-architecture-bpmn-canvas`),n=this.dialog.querySelector(`#solution-architecture-bpmn-context`);if(!t||!n)throw Error(`Unable to initialise the Solution Architecture BPMN workspace.`);this.canvasHost=t,this.contextPanel=n,this.modeler=new e({container:this.canvasHost}),this.bindModelerEvents(),this.bindPageEvents(),document.addEventListener(`enterprise-modeler:open-solution-architecture-map`,e=>{let t=e.detail?.processId??``;this.open(t)}),document.addEventListener(`enterprise-modeler:operating-model-registry-changed`,e=>{e.detail?.scope!==`integrations`||this.internalRegistryWrite||this.reloadRegistryMetadata()})}renderShell(){return`
      <div class="solution-architecture-bpmn-page">
        <header class="solution-architecture-bpmn-header">
          <div>
            <div class="solution-architecture-bpmn-title">Solution Architecture Map</div>
            <div class="solution-architecture-bpmn-subtitle">Native BPMN collaboration model. Pools are architecture domains, Tasks are systems and Flows are interfaces.</div>
          </div>
          <div class="solution-architecture-bpmn-actions">
            <button id="solution-architecture-bpmn-fit" class="toolbar-button" type="button">Fit</button>
            <button id="solution-architecture-bpmn-systems" class="toolbar-button" type="button">Systems Catalogue</button>
            <button id="solution-architecture-bpmn-integrations" class="toolbar-button" type="button">Integration Catalogue</button>
            <button id="solution-architecture-bpmn-close" class="metadata-close-button" type="button" aria-label="Return to process workspace">×</button>
          </div>
        </header>

        <div class="solution-architecture-bpmn-controls">
          <label>
            <span>Highlight process dependency</span>
            <select id="solution-architecture-bpmn-focus"><option value="">Whole solution</option></select>
          </label>
          <label>
            <span>Environment layer</span>
            <select id="solution-architecture-bpmn-environment">
              <option value="production">Production</option>
              <option value="uat">UAT</option>
              <option value="dev-test">Dev / Test</option>
              <option value="all">All environments</option>
            </select>
          </label>
          <div class="solution-architecture-bpmn-help">
            Move systems and reconnect flows using the native BPMN canvas. Drag a Task into another Pool to change its architecture domain.
          </div>
        </div>

        <div class="solution-architecture-bpmn-workspace">
          <div id="solution-architecture-bpmn-canvas" class="solution-architecture-bpmn-canvas" aria-label="Enterprise Modeler solution architecture BPMN canvas"></div>
          <aside id="solution-architecture-bpmn-context" class="solution-architecture-bpmn-context"></aside>
        </div>
      </div>
    `}bindModelerEvents(){let e=this.modeler.get(`eventBus`);e.on(`selection.changed`,e=>{let t=e.newSelection??[];this.selectedElement=t[0]??null,this.renderContextPanel()}),e.on(`commandStack.changed`,()=>{this.suppressModelEvents||(this.scheduleAutosave(),this.scheduleRegistrySync())})}bindPageEvents(){this.dialog.querySelector(`#solution-architecture-bpmn-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.dialog.querySelector(`#solution-architecture-bpmn-fit`)?.addEventListener(`click`,()=>{this.modeler.get(`canvas`).zoom(`fit-viewport`)}),this.dialog.querySelector(`#solution-architecture-bpmn-systems`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-systems-catalog`))}),this.dialog.querySelector(`#solution-architecture-bpmn-integrations`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-integration-catalog`))}),this.dialog.querySelector(`#solution-architecture-bpmn-focus`)?.addEventListener(`change`,e=>{this.focusProcessId=e.currentTarget.value,this.applyProcessFocus()}),this.dialog.querySelector(`#solution-architecture-bpmn-environment`)?.addEventListener(`change`,e=>{let t=e.currentTarget.value;this.environmentView=t===`uat`||t===`dev-test`||t===`production`?t:`all`,this.applyEnvironmentFocus(),this.renderContextPanel()})}async open(e=``){this.dialog.showModal(),await this.reloadReferenceData(),e&&this.repository.catalog.processes.some(t=>t.id===e)&&(this.focusProcessId=e),this.renderFocusOptions(),this.loaded?this.applyRegistryMetadataToDiagram():(await this.loadDiagram(),this.loaded=!0),this.modeler.get(`canvas`).zoom(`fit-viewport`),this.applyProcessFocus(),this.applyEnvironmentFocus(),this.renderContextPanel()}async reloadReferenceData(){let[e,t,r,i]=await Promise.all([o(!0),c(!0),n(!0),l(!0)]);this.data=e,this.organisation=t,this.governanceRecords=r.records,this.repository=i}async reloadRegistryMetadata(){this.data=await o(!0),this.loaded&&this.applyRegistryMetadataToDiagram(),this.renderContextPanel(),this.applyProcessFocus(),this.applyEnvironmentFocus()}async loadDiagram(){let e=localStorage.getItem(d)||await this.fetchRepositoryBpmn();this.suppressModelEvents=!0;try{await this.modeler.importXML(e),this.applyRegistryMetadataToDiagram()}finally{this.suppressModelEvents=!1}}async fetchRepositoryBpmn(){let e=await fetch(u,{cache:`no-store`});if(!e.ok)throw Error(`Unable to load ${u}. HTTP ${e.status}.`);return e.text()}applyRegistryMetadataToDiagram(){if(!this.loaded&&!this.suppressModelEvents)return;let e=this.modeler.get(`elementRegistry`),t=this.modeler.get(`modeling`),n=this.suppressModelEvents;this.suppressModelEvents=!0;try{this.data.systems.forEach(n=>{let r=e.get(n.id);!r||!this.isSystemElement(r)||(r.businessObject?.name??``)!==n.name&&t.updateProperties(r,{name:n.name})}),this.data.interfaces.forEach(n=>{let r=e.get(n.id);!r||!this.isInterfaceElement(r)||(r.businessObject?.name??``)!==n.name&&t.updateProperties(r,{name:n.name})})}finally{this.suppressModelEvents=n}}scheduleAutosave(){this.autosaveTimer!==void 0&&window.clearTimeout(this.autosaveTimer),this.autosaveTimer=window.setTimeout(()=>{this.autosaveTimer=void 0,this.saveDiagramLocally()},180)}async saveDiagramLocally(){try{let e=await this.modeler.saveXML({format:!0});e.xml&&localStorage.setItem(d,e.xml)}catch(e){console.warn(`Unable to autosave the Solution Architecture BPMN model.`,e)}}scheduleRegistrySync(){this.registrySyncTimer!==void 0&&window.clearTimeout(this.registrySyncTimer),this.registrySyncTimer=window.setTimeout(()=>{this.registrySyncTimer=void 0,this.synchroniseDiagramToRegistry()},220)}synchroniseDiagramToRegistry(){let e=this.modeler.get(`elementRegistry`).getAll(),t=e.filter(e=>this.isSystemElement(e)),n=new Set(t.map(e=>e.id)),r=!1;if(t.forEach(e=>{let t=e.businessObject?.name?.trim()||`New System`,n=this.getElementArchitectureLayer(e),i=this.data.systems.find(t=>t.id===e.id);if(!i){this.data.systems.push({id:e.id,name:t,type:``,architectureLayer:n,supplier:``,environment:`Production`,environments:[`production`],dataClassification:``,integrationType:``,ownerPositionId:``,criticality:`medium`,active:!0,notes:``}),r=!0;return}(i.name!==t||i.architectureLayer!==n||!i.active)&&(i.name=t,i.architectureLayer=n,i.active=!0,r=!0)}),e.filter(e=>this.isInterfaceElement(e)).forEach(e=>{let t=e.source?.id??``,i=e.target?.id??``;if(!n.has(t)||!n.has(i))return;let a=this.data.systems.find(e=>e.id===t),o=this.data.systems.find(e=>e.id===i);if(!a||!o)return;let s=this.data.interfaces.find(t=>t.id===e.id),c=e.businessObject?.name?.trim()||`${a.name} → ${o.name}`;if(!s){this.data.interfaces.push({id:e.id,name:c,sourceSystemId:t,targetSystemId:i,direction:`outbound`,protocol:``,authentication:``,environments:[`production`],ownerPositionId:``,criticality:`medium`,status:`design`,documentationReference:``,notes:``}),r=!0;return}(s.name!==c||s.sourceSystemId!==t||s.targetSystemId!==i||s.status===`retired`)&&(s.name=c,s.sourceSystemId=t,s.targetSystemId=i,s.status===`retired`&&(s.status=`design`),r=!0)}),r){this.internalRegistryWrite=!0;try{i(this.data)}finally{this.internalRegistryWrite=!1}this.renderContextPanel()}}isSystemElement(e){if(!(e.businessObject?.$type??e.type??``).endsWith(`Task`))return!1;let t=e.parent?.businessObject?.$type??``,n=e.businessObject?.$parent?.id??``;return t===`bpmn:Participant`||n.startsWith(p)}isInterfaceElement(e){let t=e.businessObject?.$type??e.type??``;return t===`bpmn:SequenceFlow`||t===`bpmn:MessageFlow`}getElementArchitectureLayer(e){let t=e.parent,n=t?.businessObject?.$type===`bpmn:Participant`?t.id:``,i=e.businessObject?.$parent?.id??``,a=t?.businessObject?.name?.trim()??``;return this.layerFromIdentifier(n,f)||this.layerFromIdentifier(i,p)||(r.find(e=>e.label===a)?.id??`other`)}layerFromIdentifier(e,t){if(!e.startsWith(t))return null;let n=e.slice(t.length);return r.some(e=>e.id===n)?n:null}renderFocusOptions(){let e=this.dialog.querySelector(`#solution-architecture-bpmn-focus`);e&&(e.innerHTML=`
      <option value="">Whole solution</option>
      ${this.repository.catalog.processes.filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name)).map(e=>`<option value="${v(e.id)}"${e.id===this.focusProcessId?` selected`:``}>${v(e.name)}</option>`).join(``)}
    `)}applyProcessFocus(){if(!this.loaded)return;let e=this.modeler.get(`canvas`),t=this.modeler.get(`elementRegistry`);if(t.getAll().forEach(t=>e.removeMarker(t.id,m)),!this.focusProcessId)return;let n=this.governanceRecords.find(e=>e.processId===this.focusProcessId);if(!n)return;let r=new Set(n.interfaceIds),i=new Set(n.systemIds);this.data.interfaces.filter(e=>r.has(e.id)).forEach(e=>{i.add(e.sourceSystemId),i.add(e.targetSystemId)}),this.data.systems.forEach(n=>{!i.has(n.id)&&t.get(n.id)&&e.addMarker(n.id,m)}),this.data.interfaces.forEach(n=>{!r.has(n.id)&&t.get(n.id)&&e.addMarker(n.id,m)})}applyEnvironmentFocus(){if(!this.loaded)return;let e=this.modeler.get(`canvas`),t=this.modeler.get(`elementRegistry`);if(t.getAll().forEach(t=>e.removeMarker(t.id,h)),this.environmentView===`all`)return;let n=new Set(this.data.systems.filter(e=>(e.environments??[`production`]).includes(this.environmentView)).map(e=>e.id));this.data.systems.forEach(r=>{!n.has(r.id)&&t.get(r.id)&&e.addMarker(r.id,h)}),this.data.interfaces.forEach(r=>{!((r.environments??[`production`]).includes(this.environmentView)&&n.has(r.sourceSystemId)&&n.has(r.targetSystemId))&&t.get(r.id)&&e.addMarker(r.id,h)})}renderContextPanel(){let e=this.selectedElement;if(!e){this.contextPanel.innerHTML=this.renderEmptyContext();return}let n=this.data.systems.find(t=>t.id===e.id);if(n&&this.isSystemElement(e)){this.contextPanel.innerHTML=this.renderSystemContext(n,e),this.bindSystemContext(n,e);return}let r=this.data.interfaces.find(t=>t.id===e.id);if(r&&this.isInterfaceElement(e)){this.contextPanel.innerHTML=this.renderInterfaceContext(r),this.bindInterfaceContext(r,e);return}if(e.businessObject?.$type===`bpmn:Participant`){let n=this.getParticipantLayer(e);this.contextPanel.innerHTML=`
        <div class="solution-architecture-context-header">
          <div><strong>Architecture Domain</strong><small>${v(e.id)}</small></div>
        </div>
        <div class="solution-architecture-context-summary">
          <strong>${v(e.businessObject?.name??t(n))}</strong>
          <p>This BPMN Pool represents the ${v(t(n))} architecture domain.</p>
          <p>Move a System Task between Pools to change its architecture classification.</p>
        </div>
      `;return}this.contextPanel.innerHTML=`
      <div class="solution-architecture-context-header"><div><strong>BPMN Element</strong><small>${v(e.id)}</small></div></div>
      <div class="solution-architecture-context-summary">
        <strong>${v(e.businessObject?.name??e.businessObject?.$type??`Element`)}</strong>
        <p>This is a native BPMN element. System and interface catalogue metadata is available when a System Task or Interface Flow is selected.</p>
      </div>
    `}renderEmptyContext(){return`
      <div class="solution-architecture-context-header">
        <div><strong>Context</strong><small>Solution architecture</small></div>
      </div>
      <div class="solution-architecture-context-summary">
        <p>Select a System Task or Interface Flow to edit its catalogue metadata.</p>
        <p>The BPMN palette and context pad are native bpmn-js controls.</p>
      </div>
    `}renderSystemContext(e,n){let r=this.getElementArchitectureLayer(n);return`
      <div class="solution-architecture-context-header">
        <div><strong>System</strong><small>${v(e.id)}</small></div>
        <button type="button" data-architecture-clear-selection aria-label="Clear selection">×</button>
      </div>
      <form id="architecture-bpmn-system-form" class="solution-architecture-context-form">
        <label><span>Name</span><input id="architecture-bpmn-system-name" required value="${v(e.name)}" /></label>
        <label><span>Architecture domain</span><input value="${v(t(r))}" readonly /></label>
        <div class="solution-architecture-context-note">Move this BPMN Task into another architecture Pool to change its domain.</div>
        <label><span>Type</span><input id="architecture-bpmn-system-type" value="${v(e.type)}" /></label>
        <label><span>Supplier</span><input id="architecture-bpmn-system-supplier" value="${v(e.supplier)}" /></label>
        <fieldset>
          <span>Environments</span>
          ${a.map(t=>`<label class="solution-architecture-context-check"><input type="checkbox" data-architecture-system-environment="${t.id}"${(e.environments??[`production`]).includes(t.id)?` checked`:``} /><span>${v(t.label)}</span></label>`).join(``)}
        </fieldset>
        <label><span>Data classification</span><input id="architecture-bpmn-system-data" value="${v(e.dataClassification)}" /></label>
        <label><span>Integration type</span><input id="architecture-bpmn-system-integration-type" value="${v(e.integrationType)}" /></label>
        <label><span>Owner position</span><select id="architecture-bpmn-system-owner">${this.positionOptions(e.ownerPositionId)}</select></label>
        <label><span>Criticality</span><select id="architecture-bpmn-system-criticality">${this.criticalityOptions(e.criticality)}</select></label>
        <label class="solution-architecture-context-check"><input id="architecture-bpmn-system-active" type="checkbox"${e.active?` checked`:``} /><span>Active</span></label>
        <label><span>Notes</span><textarea id="architecture-bpmn-system-notes" rows="4">${v(e.notes)}</textarea></label>
        <div class="solution-architecture-context-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          <button class="toolbar-button" type="button" data-open-system-catalogue>Open Catalogue</button>
        </div>
      </form>
    `}bindSystemContext(e,t){this.bindClearSelection(),this.contextPanel.querySelector(`#architecture-bpmn-system-form`)?.addEventListener(`submit`,n=>{n.preventDefault(),e.name=this.inputValue(`#architecture-bpmn-system-name`)||e.name,e.type=this.inputValue(`#architecture-bpmn-system-type`),e.supplier=this.inputValue(`#architecture-bpmn-system-supplier`),e.environments=this.readContextEnvironments(`[data-architecture-system-environment]`),e.environment=e.environments.map(e=>a.find(t=>t.id===e)?.label??e).join(`, `),e.dataClassification=this.inputValue(`#architecture-bpmn-system-data`),e.integrationType=this.inputValue(`#architecture-bpmn-system-integration-type`),e.ownerPositionId=this.selectValue(`#architecture-bpmn-system-owner`),e.criticality=this.selectValue(`#architecture-bpmn-system-criticality`),e.active=this.contextPanel.querySelector(`#architecture-bpmn-system-active`)?.checked??!0,e.notes=this.textareaValue(`#architecture-bpmn-system-notes`),e.architectureLayer=this.getElementArchitectureLayer(t),this.internalRegistryWrite=!0;try{i(this.data)}finally{this.internalRegistryWrite=!1}this.suppressModelEvents=!0;try{this.modeler.get(`modeling`).updateProperties(t,{name:e.name})}finally{this.suppressModelEvents=!1}this.scheduleAutosave(),this.renderContextPanel()}),this.contextPanel.querySelector(`[data-open-system-catalogue]`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-systems-catalog`,{detail:{recordId:e.id}}))})}renderInterfaceContext(e){let t=this.data.systems.find(t=>t.id===e.sourceSystemId),n=this.data.systems.find(t=>t.id===e.targetSystemId);return`
      <div class="solution-architecture-context-header">
        <div><strong>Interface</strong><small>${v(e.id)}</small></div>
        <button type="button" data-architecture-clear-selection aria-label="Clear selection">×</button>
      </div>
      <form id="architecture-bpmn-interface-form" class="solution-architecture-context-form">
        <label><span>Name</span><input id="architecture-bpmn-interface-name" required value="${v(e.name)}" /></label>
        <label><span>Source</span><input value="${v(t?.name??e.sourceSystemId)}" readonly /></label>
        <label><span>Target</span><input value="${v(n?.name??e.targetSystemId)}" readonly /></label>
        <div class="solution-architecture-context-note">Reconnect the native BPMN Flow to change its source or target.</div>
        <label><span>Direction</span><select id="architecture-bpmn-interface-direction">${this.directionOptions(e.direction)}</select></label>
        <fieldset>
          <span>Environments</span>
          ${a.map(t=>`<label class="solution-architecture-context-check"><input type="checkbox" data-architecture-interface-environment="${t.id}"${(e.environments??[`production`]).includes(t.id)?` checked`:``} /><span>${v(t.label)}</span></label>`).join(``)}
        </fieldset>
        <label><span>Protocol</span><input id="architecture-bpmn-interface-protocol" value="${v(e.protocol)}" /></label>
        <label><span>Authentication</span><input id="architecture-bpmn-interface-authentication" value="${v(e.authentication)}" /></label>
        <label><span>Owner position</span><select id="architecture-bpmn-interface-owner">${this.positionOptions(e.ownerPositionId)}</select></label>
        <label><span>Criticality</span><select id="architecture-bpmn-interface-criticality">${this.criticalityOptions(e.criticality)}</select></label>
        <label><span>Status</span><select id="architecture-bpmn-interface-status">${this.interfaceStatusOptions(e.status)}</select></label>
        <label><span>Documentation reference</span><input id="architecture-bpmn-interface-documentation" value="${v(e.documentationReference)}" /></label>
        <label><span>Notes</span><textarea id="architecture-bpmn-interface-notes" rows="4">${v(e.notes)}</textarea></label>
        <div class="solution-architecture-context-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          <button class="toolbar-button" type="button" data-open-interface-catalogue>Open Catalogue</button>
        </div>
      </form>
    `}bindInterfaceContext(e,t){this.bindClearSelection(),this.contextPanel.querySelector(`#architecture-bpmn-interface-form`)?.addEventListener(`submit`,n=>{n.preventDefault(),e.name=this.inputValue(`#architecture-bpmn-interface-name`)||e.name,e.direction=this.selectValue(`#architecture-bpmn-interface-direction`),e.protocol=this.inputValue(`#architecture-bpmn-interface-protocol`),e.authentication=this.inputValue(`#architecture-bpmn-interface-authentication`),e.environments=this.readContextEnvironments(`[data-architecture-interface-environment]`),e.ownerPositionId=this.selectValue(`#architecture-bpmn-interface-owner`),e.criticality=this.selectValue(`#architecture-bpmn-interface-criticality`),e.status=this.selectValue(`#architecture-bpmn-interface-status`),e.documentationReference=this.inputValue(`#architecture-bpmn-interface-documentation`),e.notes=this.textareaValue(`#architecture-bpmn-interface-notes`),e.sourceSystemId=t.source?.id??e.sourceSystemId,e.targetSystemId=t.target?.id??e.targetSystemId,this.internalRegistryWrite=!0;try{i(this.data)}finally{this.internalRegistryWrite=!1}this.suppressModelEvents=!0;try{this.modeler.get(`modeling`).updateProperties(t,{name:e.name})}finally{this.suppressModelEvents=!1}this.scheduleAutosave(),this.renderContextPanel()}),this.contextPanel.querySelector(`[data-open-interface-catalogue]`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-integration-catalog`,{detail:{recordKind:`interface`,recordId:e.id}}))})}bindClearSelection(){this.contextPanel.querySelector(`[data-architecture-clear-selection]`)?.addEventListener(`click`,()=>{this.modeler.get(`selection`).select([])})}getParticipantLayer(e){let t=this.layerFromIdentifier(e.id,f);if(t)return t;let n=e.businessObject?.name?.trim()??``;return r.find(e=>e.label===n)?.id??`other`}positionOptions(e){return`<option value="">Unassigned</option>${(this.organisation?.positions.filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name))??[]).map(t=>`<option value="${v(t.id)}"${t.id===e?` selected`:``}>${v(s(this.organisation,t.id))}</option>`).join(``)}`}criticalityOptions(e){return[`low`,`medium`,`high`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${_(t)}</option>`).join(``)}directionOptions(e){return[[`outbound`,`Outbound`],[`inbound`,`Inbound`],[`bidirectional`,`Bidirectional`]].map(([t,n])=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}interfaceStatusOptions(e){return[[`design`,`Design`],[`active`,`Active`],[`tbc`,`TBC`],[`retired`,`Retired`]].map(([t,n])=>`<option value="${t}"${t===e?` selected`:``}>${n}</option>`).join(``)}readContextEnvironments(e){let t=[...this.contextPanel.querySelectorAll(e)].filter(e=>e.checked).map(e=>e.dataset.architectureSystemEnvironment??e.dataset.architectureInterfaceEnvironment??``).filter(e=>a.some(t=>t.id===e));return t.length>0?t:[`production`]}inputValue(e){return this.contextPanel.querySelector(e)?.value.trim()??``}selectValue(e){return this.contextPanel.querySelector(e)?.value??``}textareaValue(e){return this.contextPanel.querySelector(e)?.value.trim()??``}};function _(e){return e&&`${e.charAt(0).toUpperCase()}${e.slice(1)}`}function v(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new g;