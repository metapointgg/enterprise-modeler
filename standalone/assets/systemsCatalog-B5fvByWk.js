import{a as e,f as t,l as n,o as r,s as i,t as a,u as o}from"./operatingModelRegistry-B6jlmvai.js";import{c as s,f as c}from"./organisation-4SmD6Ce4.js";import{p as l}from"./processCatalog-C9JSMFlk.js";var u=class{dialog;root;data={schemaVersion:2,systems:[],interfaces:[]};governance={schemaVersion:1,records:[]};repository={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};organisation=null;selectedId=``;filters={query:``,criticality:``,architectureLayer:``,state:`active`};constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`systems-catalog-dialog`,this.dialog.innerHTML=`<div id="systems-catalog-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#systems-catalog-root`);if(!e)throw Error(`Unable to initialise Systems Catalogue.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-systems-catalog`,e=>{this.selectedId=e.detail?.recordId??``,this.open()}),document.addEventListener(`enterprise-modeler:operating-model-registry-changed`,()=>{this.dialog.open&&this.open(this.selectedId)}),this.injectEntryPoint(),new MutationObserver(()=>this.injectEntryPoint()).observe(document.body,{subtree:!0,childList:!0})}injectEntryPoint(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-systems-catalog-entry]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.systemsCatalogEntry=`true`,t.textContent=`Systems Catalogue`,t.addEventListener(`click`,()=>void this.open()),e.appendChild(t)}async open(e=``){let[t,r,i,a]=await Promise.all([n(!0),o(!0),l(!0),c()]);this.data=t,this.governance=r,this.repository=i,this.organisation=a,e&&t.systems.some(t=>t.id===e)?this.selectedId=e:this.selectedId&&!t.systems.some(e=>e.id===this.selectedId)&&(this.selectedId=``),this.render(),this.dialog.open||this.dialog.showModal()}render(){let e=this.filteredSystems(),t=this.data.systems.find(e=>e.id===this.selectedId)??null,n=new Set(this.data.systems.filter(e=>this.usedByProcesses(e.id).length>0).map(e=>e.id));this.root.innerHTML=`
      <div class="systems-catalog">
        <header class="systems-catalog-header">
          <div>
            <div class="systems-catalog-title">Systems Catalogue</div>
            <div class="systems-catalog-subtitle">Application and partner inventory linked to processes, interfaces and solution architecture.</div>
          </div>
          <div class="systems-catalog-actions">
            <button id="systems-catalog-export" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="systems-catalog-close" class="metadata-close-button" type="button">×</button>
          </div>
        </header>

        <div class="systems-catalog-summary">
          ${this.summaryCard(`Systems`,this.data.systems.length)}
          ${this.summaryCard(`Active`,this.data.systems.filter(e=>e.active).length)}
          ${this.summaryCard(`High Criticality`,this.data.systems.filter(e=>e.active&&e.criticality===`high`).length)}
          ${this.summaryCard(`Used by Processes`,n.size)}
        </div>

        <div class="systems-catalog-filters">
          <input id="systems-filter-query" type="search" value="${f(this.filters.query)}" placeholder="Search systems…" />
          <select id="systems-filter-layer">
            <option value="">All architecture layers</option>
            ${a.map(e=>`<option value="${e.id}"${e.id===this.filters.architectureLayer?` selected`:``}>${f(e.label)}</option>`).join(``)}
          </select>
          <select id="systems-filter-criticality">
            <option value="">All criticalities</option>
            ${[`high`,`medium`,`low`].map(e=>`<option value="${e}"${e===this.filters.criticality?` selected`:``}>${d(e)}</option>`).join(``)}
          </select>
          <select id="systems-filter-state">
            <option value="active"${this.filters.state===`active`?` selected`:``}>Active</option>
            <option value="all"${this.filters.state===`all`?` selected`:``}>Active & inactive</option>
            <option value="inactive"${this.filters.state===`inactive`?` selected`:``}>Inactive only</option>
          </select>
          <button id="systems-catalog-new" class="toolbar-button toolbar-button-primary" type="button">New System</button>
        </div>

        <div class="systems-catalog-body">
          <div class="systems-catalog-table-pane">${this.renderTable(e)}</div>
          <aside class="systems-catalog-detail-pane">${this.renderDetails(t)}</aside>
        </div>
      </div>
    `,this.bindEvents()}summaryCard(e,t){return`<div class="systems-summary-card"><strong>${t}</strong><span>${f(e)}</span></div>`}renderTable(e){return e.length===0?`<div class="systems-catalog-empty">No systems match the current filters.</div>`:`
      <table class="systems-catalog-table">
        <thead>
          <tr>
            <th>System</th>
            <th>Type</th>
            <th>Architecture Layer</th>
            <th>Owner</th>
            <th>Criticality</th>
            <th>Supplier</th>
            <th>Processes</th>
            <th>Interfaces</th>
          </tr>
        </thead>
        <tbody>
          ${e.map(e=>{let t=this.organisation?s(this.organisation,e.ownerPositionId):e.ownerPositionId,n=this.usedByProcesses(e.id).length,r=this.connectedInterfaces(e.id).length;return`
              <tr class="${e.id===this.selectedId?`systems-catalog-row-selected`:``}" data-system-row="${f(e.id)}">
                <td><strong>${f(e.name)}</strong>${e.active?``:`<small>Inactive</small>`}</td>
                <td>${f(e.type||`—`)}</td>
                <td>${f(i(e.architectureLayer))}</td>
                <td>${f(t||`Unassigned`)}</td>
                <td><span class="systems-criticality systems-criticality-${e.criticality}">${d(e.criticality)}</span></td>
                <td>${f(e.supplier||`—`)}</td>
                <td>${n}</td>
                <td>${r}</td>
              </tr>
            `}).join(``)}
        </tbody>
      </table>
    `}renderDetails(e){if(!e&&this.selectedId)return`<div class="systems-catalog-empty">The selected system no longer exists.</div>`;if(!e)return this.renderForm(null);let t=this.usedByProcesses(e.id),n=this.connectedInterfaces(e.id);return`
      ${this.renderForm(e)}

      <section class="systems-impact-section">
        <h3>Enterprise Context</h3>
        <div class="metadata-actions">
          <button class="toolbar-button" id="systems-explore" type="button">Explore Relationships</button>
          <button class="toolbar-button" id="systems-impact" type="button">Impact Analysis</button>
        </div>
      </section>

      <section class="systems-impact-section">
        <h3>Process Usage</h3>
        ${t.length===0?`<div class="systems-catalog-empty-inline">No process currently references this system or one of its interfaces.</div>`:t.map(e=>`<button class="systems-impact-link" type="button" data-open-process="${f(e.id)}"><span>${f(e.name)}</span><small>${f(e.id)}</small></button>`).join(``)}
      </section>

      <section class="systems-impact-section">
        <h3>Connected Interfaces</h3>
        ${n.length===0?`<div class="systems-catalog-empty-inline">No interfaces currently connect this system.</div>`:n.map(e=>`<button class="systems-impact-link" type="button" data-open-interface="${f(e.id)}"><span>${f(e.name)}</span><small>${f(this.systemName(e.sourceSystemId))} → ${f(this.systemName(e.targetSystemId))}</small></button>`).join(``)}
      </section>
    `}renderForm(e){return`
      <form id="systems-catalog-form" class="systems-catalog-form">
        <div class="systems-detail-heading">
          <div>
            <h3>${e?`System details`:`Add system`}</h3>
            ${e?`<small>${f(e.id)}</small>`:``}
          </div>
          ${e?`<button id="systems-catalog-delete" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>

        <label class="metadata-field"><span>Name</span><input id="systems-name" required value="${f(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Type</span><input id="systems-type" value="${f(e?.type??``)}" placeholder="e.g. CRM, ERP, workflow platform" /></label>
        <label class="metadata-field"><span>Architecture layer</span><select id="systems-layer">${this.architectureLayerOptions(e?.architectureLayer??`other`)}</select></label>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Supplier</span><input id="systems-supplier" value="${f(e?.supplier??``)}" placeholder="Supplier / owner or TBC" /></label>
          <label class="metadata-field"><span>Environment</span><input id="systems-environment" value="${f(e?.environment??``)}" placeholder="e.g. Production / multi-environment / TBC" /></label>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Data classification</span><input id="systems-data-classification" value="${f(e?.dataClassification??``)}" placeholder="Classification or TBC" /></label>
          <label class="metadata-field"><span>Integration type</span><input id="systems-integration-type" value="${f(e?.integrationType??``)}" placeholder="e.g. API consumer, partner API" /></label>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Owner position</span><select id="systems-owner"><option value="">Unassigned</option>${this.positionOptions(e?.ownerPositionId??``)}</select></label>
          <label class="metadata-field"><span>Criticality</span><select id="systems-criticality">${this.criticalityOptions(e?.criticality??`medium`)}</select></label>
        </div>

        <label class="organisation-checkbox-row"><input id="systems-active" type="checkbox"${e?.active===!1?``:` checked`} /><span>Active</span></label>
        <label class="metadata-field"><span>Notes</span><textarea id="systems-notes" rows="4">${f(e?.notes??``)}</textarea></label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save System`:`Add System`}</button>
        </div>
      </form>
    `}bindEvents(){this.root.querySelector(`#systems-catalog-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#systems-catalog-export`)?.addEventListener(`click`,()=>e(`integrations.json`,this.data)),this.root.querySelector(`#systems-catalog-new`)?.addEventListener(`click`,()=>{this.selectedId=``,this.render()}),this.root.querySelector(`#systems-catalog-delete`)?.addEventListener(`click`,()=>void this.deleteSelected()),this.root.querySelector(`#systems-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#systems-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.bindFilter(`#systems-filter-query`,`query`),this.bindFilter(`#systems-filter-layer`,`architectureLayer`),this.bindFilter(`#systems-filter-criticality`,`criticality`),this.bindFilter(`#systems-filter-state`,`state`),this.root.querySelectorAll(`[data-system-row]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedId=e.dataset.systemRow??``,this.render()})),this.root.querySelector(`#systems-catalog-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveSelected()}),this.root.querySelectorAll(`[data-open-process]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.openProcess;t&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:t}})))})),this.root.querySelectorAll(`[data-open-interface]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.openInterface;t&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-integration-catalog`,{detail:{recordKind:`interface`,recordId:t}})))}))}openSelectedInExplorer(e){this.selectedId&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:`system`,id:this.selectedId,mode:e}})))}bindFilter(e,t){let n=this.root.querySelector(e);n?.addEventListener(`input`,()=>{let r=n.value;if(this.filters[t]=r,this.render(),t===`query`){let t=this.root.querySelector(e);t?.focus(),t?.setSelectionRange(r.length,r.length)}})}saveSelected(){let e=this.value(`#systems-name`);if(!e){window.alert(`System name is required.`);return}let n=this.data.systems.find(e=>e.id===this.selectedId),i=this.value(`#systems-criticality`),o=this.value(`#systems-layer`),s=a.some(e=>e.id===o)?o:`other`,c={id:n?.id??r(`system`,e),name:e,type:this.value(`#systems-type`),architectureLayer:s,supplier:this.value(`#systems-supplier`),environment:this.value(`#systems-environment`),dataClassification:this.value(`#systems-data-classification`),integrationType:this.value(`#systems-integration-type`),ownerPositionId:this.value(`#systems-owner`),criticality:i===`low`||i===`high`?i:`medium`,active:this.root.querySelector(`#systems-active`)?.checked??!0,notes:this.value(`#systems-notes`)};n?Object.assign(n,c):this.data.systems.push(c),this.selectedId=c.id,t(this.data),this.render()}async deleteSelected(){if(!this.selectedId)return;let e=this.data.interfaces.some(e=>e.sourceSystemId===this.selectedId||e.targetSystemId===this.selectedId),n=this.governance.records.some(e=>e.systemIds.includes(this.selectedId));if(e||n){window.alert(`This system is still referenced by an interface or process and cannot be deleted. Remove those references first.`);return}window.confirm(`Delete this system from the Systems Catalogue?`)&&(this.data.systems=this.data.systems.filter(e=>e.id!==this.selectedId),this.selectedId=``,t(this.data),this.render())}filteredSystems(){let e=this.filters.query.trim().toLowerCase();return[...this.data.systems].filter(t=>{let n=!e||[t.name,t.id,t.type,t.supplier,t.environment,t.dataClassification,t.integrationType,t.notes].join(` `).toLowerCase().includes(e),r=!this.filters.criticality||t.criticality===this.filters.criticality,i=!this.filters.architectureLayer||t.architectureLayer===this.filters.architectureLayer,a=this.filters.state===`all`||this.filters.state===`active`&&t.active||this.filters.state===`inactive`&&!t.active;return n&&r&&i&&a}).sort((e,t)=>(a.find(t=>t.id===e.architectureLayer)?.sequence??999)-(a.find(e=>e.id===t.architectureLayer)?.sequence??999)||e.name.localeCompare(t.name))}usedByProcesses(e){let t=new Set(this.data.interfaces.filter(t=>t.sourceSystemId===e||t.targetSystemId===e).map(e=>e.id)),n=new Set(this.governance.records.filter(n=>n.systemIds.includes(e)||n.interfaceIds.some(e=>t.has(e))).map(e=>e.processId));return this.repository.catalog.processes.filter(e=>n.has(e.id)).sort((e,t)=>e.name.localeCompare(t.name))}connectedInterfaces(e){return this.data.interfaces.filter(t=>t.sourceSystemId===e||t.targetSystemId===e).sort((e,t)=>e.name.localeCompare(t.name))}systemName(e){return this.data.systems.find(t=>t.id===e)?.name??e}value(e){return this.root.querySelector(e)?.value.trim()??``}architectureLayerOptions(e){return a.map(t=>`<option value="${t.id}"${t.id===e?` selected`:``}>${f(t.label)}</option>`).join(``)}criticalityOptions(e){return[`low`,`medium`,`high`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${d(t)}</option>`).join(``)}positionOptions(e){return this.organisation?this.organisation.positions.filter(t=>t.active||t.id===e).sort((e,t)=>e.name.localeCompare(t.name)).map(t=>`<option value="${f(t.id)}"${t.id===e?` selected`:``}>${f(s(this.organisation,t.id))}</option>`).join(``):``}};function d(e){return e.charAt(0).toUpperCase()+e.slice(1)}function f(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new u;