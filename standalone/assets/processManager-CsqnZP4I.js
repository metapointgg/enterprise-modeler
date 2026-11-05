import{_ as e,c as t,d as n,g as r,h as i,l as a,m as o,o as s,p as c}from"./processCatalog-Dye2DPES.js";function l(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function u(e){return[...e].sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code))}function d(e,t){return e.querySelector(`#${t}`)?.value.trim()??``}function f(){document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-repository-changed`))}var p=class{anchorButton;button;dialog;root;snapshot={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};activeTab=`library`;selectedProcessId=null;selectedLayerId=null;constructor(e){this.anchorButton=e,this.button=document.createElement(`button`),this.button.id=`process-manager-button`,this.button.className=`toolbar-button`,this.button.type=`button`,this.button.textContent=`Processes`,this.anchorButton.insertAdjacentElement(`afterend`,this.button),this.dialog=document.createElement(`dialog`),this.dialog.className=`process-manager-dialog`,this.dialog.innerHTML=`<div id="process-manager-root"></div>`,document.body.appendChild(this.dialog);let t=this.dialog.querySelector(`#process-manager-root`);if(!t)throw Error(`Unable to initialise Process Manager root.`);this.root=t,this.button.addEventListener(`click`,()=>void this.open()),this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()})}async open(){this.snapshot=await c(!0),this.ensureSelectionsExist(),this.render(),this.dialog.open||this.dialog.showModal()}ensureSelectionsExist(){this.selectedProcessId&&!this.snapshot.catalog.processes.some(e=>e.id===this.selectedProcessId)&&(this.selectedProcessId=null),this.selectedLayerId&&!this.snapshot.layers.layers.some(e=>e.id===this.selectedLayerId)&&(this.selectedLayerId=null)}persist(){i(this.snapshot),f()}render(){this.root.innerHTML=`
      <div class="process-manager">
        <header class="process-manager-header">
          <div>
            <div class="organisation-title">Process Manager</div>
            <div class="organisation-subtitle">
              Repository-backed process catalogue, configurable layers and process navigation.
            </div>
          </div>

          <div class="organisation-header-actions">
            <button id="process-manager-export-catalog" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="process-manager-export-layers" class="toolbar-button" type="button">Export Layers</button>
            <button id="process-manager-reset" class="toolbar-button" type="button">Reset</button>
            <button id="process-manager-close" class="metadata-close-button" type="button" title="Close">×</button>
          </div>
        </header>

        <div class="process-manager-tabs">
          ${this.renderTabButton(`library`,`Process Library`)}
          ${this.renderTabButton(`layers`,`Layers`)}
        </div>

        <div class="process-manager-content">
          ${this.activeTab===`library`?this.renderLibrary():this.renderLayers()}
        </div>

        <footer class="organisation-footer-note">
          Catalogue and layer edits are browser-local working changes until exported and committed to the repository.
          Newly created processes receive a local starter BPMN and metadata record so they can be opened immediately.
        </footer>
      </div>
    `,this.bindCommonEvents(),this.activeTab===`library`?this.bindLibraryEvents():this.bindLayerEvents()}renderTabButton(e,t){return`
      <button
        class="process-manager-tab${this.activeTab===e?` process-manager-tab-active`:``}"
        type="button"
        data-process-manager-tab="${e}"
      >
        ${t}
      </button>
    `}renderLibrary(){let e=new Map(this.snapshot.layers.layers.map(e=>[e.id,e])),t=[...this.snapshot.catalog.processes].sort((t,n)=>{let r=e.get(t.layerId),i=e.get(n.layerId);return(r?.sequence??9999)-(i?.sequence??9999)||t.name.localeCompare(n.name)}),n=this.selectedProcessId?this.snapshot.catalog.processes.find(e=>e.id===this.selectedProcessId)??null:null;return`
      <div class="process-manager-split">
        <div class="process-manager-list-pane">
          <div class="organisation-section-heading">
            <span>Processes</span>
            <button id="process-manager-new-process" class="toolbar-button" type="button">New Process</button>
          </div>
          <div class="organisation-list">${t.length===0?`<div class="organisation-empty">No processes are defined.</div>`:t.map(t=>{let n=e.get(t.layerId),r=t.parentId?this.snapshot.catalog.processes.find(e=>e.id===t.parentId):void 0;return`
            <button
              class="organisation-list-item${t.id===this.selectedProcessId?` organisation-list-item-selected`:``}"
              type="button"
              data-edit-process="${l(t.id)}"
            >
              <span class="organisation-list-primary">
                ${l(t.name)}
                ${t.id===this.snapshot.catalog.rootProcessId?`<span class="process-manager-pill">HOME</span>`:``}
              </span>
              <span class="organisation-list-secondary">
                ${l(n?.code||`Unlayered`)} · ${l(n?.name||`Layer not found`)}
                ${r?` · Parent: ${l(r.name)}`:``}
                ${t.active?``:` · Inactive`}
              </span>
            </button>
          `}).join(``)}</div>
        </div>

        <div class="process-manager-editor-pane">
          ${this.renderProcessForm(n)}
        </div>
      </div>
    `}renderProcessForm(e){let t=u(this.snapshot.layers.layers),r=e?.layerId||t.find(e=>e.active)?.id||``,i=t.map(e=>`
        <option value="${l(e.id)}"${e.id===r?` selected`:``}>
          ${l(e.code)} — ${l(e.name)}${e.active?``:` (inactive)`}
        </option>
      `).join(``),a=this.snapshot.catalog.processes.filter(t=>t.id!==e?.id&&t.active).sort((e,t)=>e.name.localeCompare(t.name)).map(t=>`
        <option value="${l(t.id)}"${t.id===e?.parentId?` selected`:``}>
          ${l(n(t.layerId))} — ${l(t.name)}
        </option>
      `).join(``),o=e?.id===this.snapshot.catalog.rootProcessId;return`
      <form id="process-manager-process-form" class="organisation-form process-manager-form">
        <div class="organisation-editor-heading">${e?`Edit process`:`Add process`}</div>
        ${e?`<div class="organisation-record-id">${l(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="process-manager-process-name" type="text" required value="${l(e?.name??``)}" placeholder="e.g. Order Fulfilment" />
        </label>

        <label class="metadata-field">
          <span>Layer</span>
          <select id="process-manager-process-layer" required>
            <option value="">Select layer</option>
            ${i}
          </select>
        </label>

        <label class="metadata-field">
          <span>Primary parent process</span>
          <select id="process-manager-process-parent">
            <option value="">None / top level</option>
            ${a}
          </select>
        </label>

        <label class="metadata-field">
          <span>BPMN process ID</span>
          <input id="process-manager-process-bpmn-id" type="text" value="${l(e?.bpmnProcessId??``)}" placeholder="Generated from name when blank" />
        </label>

        <label class="metadata-field">
          <span>BPMN filename</span>
          <input id="process-manager-process-filename" type="text" value="${l(e?.filename??``)}" placeholder="Generated from process ID when blank" />
        </label>

        <label class="metadata-field">
          <span>BPMN repository URL</span>
          <input id="process-manager-process-url" type="text" value="${l(e?.url??``)}" placeholder="/processes/custom/process-name.bpmn" />
        </label>

        <label class="metadata-field">
          <span>Metadata repository URL</span>
          <input id="process-manager-process-metadata-url" type="text" value="${l(e?.metadataUrl??``)}" placeholder="/metadata/custom/process-name.json" />
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-process-home" type="checkbox"${o?` checked`:``} />
          <span>Home / root process</span>
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-process-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active</span>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Process`:`Add Process`}</button>
          ${e?`<button id="process-manager-open-process" class="toolbar-button" type="button">Open Process</button>`:``}
        </div>

        <div class="metadata-help">
          Primary parent controls breadcrumbs only. Semantic BPMN drill-down remains defined by callActivity.calledElement;
          additional process relationships are maintained on node metadata.
        </div>
      </form>
    `}renderLayers(){let e=u(this.snapshot.layers.layers),t=this.selectedLayerId?this.snapshot.layers.layers.find(e=>e.id===this.selectedLayerId)??null:null;return`
      <div class="process-manager-split">
        <div class="process-manager-list-pane">
          <div class="organisation-section-heading">
            <span>Layers</span>
            <button id="process-manager-new-layer" class="toolbar-button" type="button">New Layer</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No process layers are defined.</div>`:e.map(e=>{let t=this.snapshot.catalog.processes.filter(t=>t.layerId===e.id).length;return`
            <button
              class="organisation-list-item${e.id===this.selectedLayerId?` organisation-list-item-selected`:``}"
              type="button"
              data-edit-process-layer="${l(e.id)}"
            >
              <span class="organisation-list-primary">
                ${l(e.code)} — ${l(e.name)}
              </span>
              <span class="organisation-list-secondary">
                Sequence ${e.sequence} · ${t} process${t===1?``:`es`}${e.active?``:` · Inactive`}
              </span>
            </button>
          `}).join(``)}</div>
        </div>

        <div class="process-manager-editor-pane">
          ${this.renderLayerForm(t)}
        </div>
      </div>
    `}renderLayerForm(e){return`
      <form id="process-manager-layer-form" class="organisation-form process-manager-form">
        <div class="organisation-editor-heading">${e?`Edit layer`:`Add layer`}</div>
        ${e?`<div class="organisation-record-id">${l(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Code</span>
          <input id="process-manager-layer-code" type="text" required value="${l(e?.code??``)}" placeholder="e.g. L3" />
        </label>

        <label class="metadata-field">
          <span>Name</span>
          <input id="process-manager-layer-name" type="text" required value="${l(e?.name??``)}" placeholder="e.g. Operational procedure" />
        </label>

        <label class="metadata-field">
          <span>Description</span>
          <textarea id="process-manager-layer-description" rows="4">${l(e?.description??``)}</textarea>
        </label>

        <label class="metadata-field">
          <span>Sequence</span>
          <input id="process-manager-layer-sequence" type="number" step="1" value="${e?.sequence??this.getNextLayerSequence()}" />
        </label>

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="process-manager-layer-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active</span>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Layer`:`Add Layer`}</button>
          ${e?`<button id="process-manager-delete-layer" class="toolbar-button toolbar-button-danger" type="button">Delete Layer</button>`:``}
        </div>
      </form>
    `}getNextLayerSequence(){let e=this.snapshot.layers.layers.map(e=>e.sequence);return e.length===0?0:Math.max(...e)+10}bindCommonEvents(){this.root.querySelectorAll(`[data-process-manager-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.processManagerTab;t!==`library`&&t!==`layers`||(this.activeTab=t,this.render())})}),this.root.querySelector(`#process-manager-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#process-manager-export-catalog`)?.addEventListener(`click`,()=>{s(`process-catalog.json`,this.snapshot.catalog)}),this.root.querySelector(`#process-manager-export-layers`)?.addEventListener(`click`,()=>{s(`process-layers.json`,this.snapshot.layers)}),this.root.querySelector(`#process-manager-reset`)?.addEventListener(`click`,()=>void this.reset())}bindLibraryEvents(){this.root.querySelector(`#process-manager-new-process`)?.addEventListener(`click`,()=>{this.selectedProcessId=null,this.render()}),this.root.querySelectorAll(`[data-edit-process]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedProcessId=e.dataset.editProcess??null,this.render()})}),this.root.querySelector(`#process-manager-process-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveProcess()}),this.root.querySelector(`#process-manager-open-process`)?.addEventListener(`click`,()=>{if(!this.selectedProcessId)return;let e=this.selectedProcessId;this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:e}}))})}saveProcess(){let t=d(this.root,`process-manager-process-name`),n=d(this.root,`process-manager-process-layer`);if(!t||!n){window.alert(`Process name and layer are required.`);return}let i=this.selectedProcessId?this.snapshot.catalog.processes.find(e=>e.id===this.selectedProcessId):void 0,o=i?.id??a(t),s=d(this.root,`process-manager-process-filename`)||`${o}.bpmn`,c=d(this.root,`process-manager-process-bpmn-id`)||e(o),l=d(this.root,`process-manager-process-url`)||`/processes/custom/${s}`,u=d(this.root,`process-manager-process-metadata-url`)||`/metadata/custom/${o}.json`,f=d(this.root,`process-manager-process-parent`)||void 0,p=this.root.querySelector(`#process-manager-process-active`)?.checked??!0,m=this.root.querySelector(`#process-manager-process-home`)?.checked??!1;if(this.snapshot.catalog.processes.some(e=>e.id!==o&&e.bpmnProcessId===c)){window.alert(`BPMN process ID ${c} is already used by another process.`);return}let h={id:o,bpmnProcessId:c,name:t,layerId:n,filename:s,url:l,metadataUrl:u,parentId:f,active:p};i?Object.assign(i,h):(this.snapshot.catalog.processes.push(h),r(h)),m||!this.snapshot.catalog.rootProcessId?this.snapshot.catalog.rootProcessId=h.id:this.snapshot.catalog.rootProcessId===h.id&&!p&&(window.alert(`The home process cannot be made inactive. Select another home process first.`),h.active=!0),this.selectedProcessId=h.id,this.persist(),this.render()}bindLayerEvents(){this.root.querySelector(`#process-manager-new-layer`)?.addEventListener(`click`,()=>{this.selectedLayerId=null,this.render()}),this.root.querySelectorAll(`[data-edit-process-layer]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedLayerId=e.dataset.editProcessLayer??null,this.render()})}),this.root.querySelector(`#process-manager-layer-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveLayer()}),this.root.querySelector(`#process-manager-delete-layer`)?.addEventListener(`click`,()=>this.deleteLayer())}saveLayer(){let e=d(this.root,`process-manager-layer-code`),n=d(this.root,`process-manager-layer-name`);if(!e||!n){window.alert(`Layer code and name are required.`);return}let r=this.selectedLayerId?this.snapshot.layers.layers.find(e=>e.id===this.selectedLayerId):void 0;if(this.snapshot.layers.layers.some(t=>t.id!==r?.id&&t.code.toLowerCase()===e.toLowerCase())){window.alert(`Layer code ${e} already exists.`);return}let i=d(this.root,`process-manager-layer-sequence`),a=Number(i),o={id:r?.id??t(e,n),code:e,name:n,description:d(this.root,`process-manager-layer-description`),sequence:Number.isFinite(a)?a:this.getNextLayerSequence(),active:this.root.querySelector(`#process-manager-layer-active`)?.checked??!0};r?Object.assign(r,o):this.snapshot.layers.layers.push(o),this.selectedLayerId=o.id,this.persist(),this.render()}deleteLayer(){if(!this.selectedLayerId)return;let e=this.snapshot.layers.layers.find(e=>e.id===this.selectedLayerId);if(!e)return;let t=this.snapshot.catalog.processes.filter(t=>t.layerId===e.id);if(t.length>0){window.alert(`${e.code} cannot be deleted because ${t.length} process${t.length===1?``:`es`} still reference it. Reassign those processes first.`);return}window.confirm(`Delete process layer ${e.code} — ${e.name}?`)&&(this.snapshot.layers.layers=this.snapshot.layers.layers.filter(t=>t.id!==e.id),this.selectedLayerId=null,this.persist(),this.render())}async reset(){if(window.confirm(`Reset the process catalogue and layer definitions to the repository versions? Local process-library changes will be discarded.`))try{this.snapshot=await o(),this.selectedProcessId=null,this.selectedLayerId=null,f(),this.render()}catch(e){console.error(`Unable to reset process repository.`,e),window.alert(`Unable to reset the process repository.`)}}};function m(){let e=document.querySelector(`#metadata-button`);if(!e){console.warn(`Metadata button was not found; Process Manager was not initialised.`);return}new p(e)}m();