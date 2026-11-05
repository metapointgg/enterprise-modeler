import{c as e,d as t,n,o as r,p as i,s as a,t as o,u as s}from"./operatingModelRegistry-D6ECpnvQ.js";import{c,f as l}from"./organisation-CjLVZz1v.js";import{p as u}from"./processCatalog-Dye2DPES.js";var d=class{dialog;root;data={schemaVersion:2,systems:[],interfaces:[]};governance={schemaVersion:1,records:[]};repository={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};organisation=null;selectedId=``;filters={query:``,criticality:``,architectureLayer:``,state:`active`};constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`systems-catalog-dialog`,this.dialog.innerHTML=`<div id="systems-catalog-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#systems-catalog-root`);if(!e)throw Error(`Unable to initialise Systems Catalogue.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-systems-catalog`,e=>{this.selectedId=e.detail?.recordId??``,this.open()}),document.addEventListener(`enterprise-modeler:operating-model-registry-changed`,()=>{this.dialog.open&&this.open(this.selectedId)}),this.injectEntryPoint(),new MutationObserver(()=>this.injectEntryPoint()).observe(document.body,{subtree:!0,childList:!0})}injectEntryPoint(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-systems-catalog-entry]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.systemsCatalogEntry=`true`,t.textContent=`Systems Catalogue`,t.addEventListener(`click`,()=>void this.open()),e.appendChild(t)}async open(e=``){let[n,r,i,a]=await Promise.all([s(!0),t(!0),u(!0),l()]);this.data=n,this.governance=r,this.repository=i,this.organisation=a,e&&n.systems.some(t=>t.id===e)?this.selectedId=e:this.selectedId&&!n.systems.some(e=>e.id===this.selectedId)&&(this.selectedId=``),this.render(),this.dialog.open||this.dialog.showModal()}render(){let e=this.filteredSystems(),t=this.data.systems.find(e=>e.id===this.selectedId)??null,r=new Set(this.data.systems.filter(e=>this.usedByProcesses(e.id).length>0).map(e=>e.id));this.root.innerHTML=`
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
          ${this.summaryCard(`Used by Processes`,r.size)}
        </div>

        <div class="systems-catalog-filters">
          <input id="systems-filter-query" type="search" value="${p(this.filters.query)}" placeholder="Search systems…" />
          <select id="systems-filter-layer">
            <option value="">All architecture layers</option>
            ${n.map(e=>`<option value="${e.id}"${e.id===this.filters.architectureLayer?` selected`:``}>${p(e.label)}</option>`).join(``)}
          </select>
          <select id="systems-filter-criticality">
            <option value="">All criticalities</option>
            ${[`high`,`medium`,`low`].map(e=>`<option value="${e}"${e===this.filters.criticality?` selected`:``}>${f(e)}</option>`).join(``)}
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
    `,this.bindEvents()}summaryCard(e,t){return`<div class="systems-summary-card"><strong>${t}</strong><span>${p(e)}</span></div>`}renderTable(t){return t.length===0?`<div class="systems-catalog-empty">No systems match the current filters.</div>`:`
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
          ${t.map(t=>{let n=this.organisation?c(this.organisation,t.ownerPositionId):t.ownerPositionId,r=this.usedByProcesses(t.id).length,i=this.connectedInterfaces(t.id).length;return`
              <tr class="${t.id===this.selectedId?`systems-catalog-row-selected`:``}" data-system-row="${p(t.id)}">
                <td><strong>${p(t.name)}</strong>${t.active?``:`<small>Inactive</small>`}</td>
                <td>${p(t.type||`—`)}</td>
                <td>${p(e(t.architectureLayer))}</td>
                <td>${p(n||`Unassigned`)}</td>
                <td><span class="systems-criticality systems-criticality-${t.criticality}">${f(t.criticality)}</span></td>
                <td>${p(t.supplier||`—`)}</td>
                <td>${r}</td>
                <td>${i}</td>
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
        ${t.length===0?`<div class="systems-catalog-empty-inline">No process currently references this system or one of its interfaces.</div>`:t.map(e=>`<button class="systems-impact-link" type="button" data-open-process="${p(e.id)}"><span>${p(e.name)}</span><small>${p(e.id)}</small></button>`).join(``)}
      </section>

      <section class="systems-impact-section">
        <h3>Connected Interfaces</h3>
        ${n.length===0?`<div class="systems-catalog-empty-inline">No interfaces currently connect this system.</div>`:n.map(e=>`<button class="systems-impact-link" type="button" data-open-interface="${p(e.id)}"><span>${p(e.name)}</span><small>${p(this.systemName(e.sourceSystemId))} → ${p(this.systemName(e.targetSystemId))}</small></button>`).join(``)}
      </section>
    `}renderForm(e){return`
      <form id="systems-catalog-form" class="systems-catalog-form">
        <div class="systems-detail-heading">
          <div>
            <h3>${e?`System details`:`Add system`}</h3>
            ${e?`<small>${p(e.id)}</small>`:``}
          </div>
          ${e?`<button id="systems-catalog-delete" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>

        <label class="metadata-field"><span>Name</span><input id="systems-name" required value="${p(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Type</span><input id="systems-type" value="${p(e?.type??``)}" placeholder="e.g. CRM, ERP, workflow platform" /></label>
        <label class="metadata-field"><span>Architecture layer</span><select id="systems-layer">${this.architectureLayerOptions(e?.architectureLayer??`other`)}</select></label>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Supplier</span><input id="systems-supplier" value="${p(e?.supplier??``)}" placeholder="Supplier / owner or TBC" /></label>
          <fieldset class="metadata-field">
            <span>Environments</span>
            <div class="organisation-checkbox-row">
              ${o.map(t=>`<label><input type="checkbox" data-system-environment="${t.id}"${(e?.environments??[`production`]).includes(t.id)?` checked`:``} /><span>${p(t.label)}</span></label>`).join(``)}
            </div>
          </fieldset>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Data classification</span><input id="systems-data-classification" value="${p(e?.dataClassification??``)}" placeholder="Classification or TBC" /></label>
          <label class="metadata-field"><span>Integration type</span><input id="systems-integration-type" value="${p(e?.integrationType??``)}" placeholder="e.g. API consumer, partner API" /></label>
        </div>

        <div class="systems-two-col">
          <label class="metadata-field"><span>Owner position</span><select id="systems-owner"><option value="">Unassigned</option>${this.positionOptions(e?.ownerPositionId??``)}</select></label>
          <label class="metadata-field"><span>Criticality</span><select id="systems-criticality">${this.criticalityOptions(e?.criticality??`medium`)}</select></label>
        </div>

        <label class="organisation-checkbox-row"><input id="systems-active" type="checkbox"${e?.active===!1?``:` checked`} /><span>Active</span></label>
        <label class="metadata-field"><span>Notes</span><textarea id="systems-notes" rows="4">${p(e?.notes??``)}</textarea></label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save System`:`Add System`}</button>
        </div>
      </form>
    `}bindEvents(){this.root.querySelector(`#systems-catalog-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#systems-catalog-export`)?.addEventListener(`click`,()=>r(`integrations.json`,this.data)),this.root.querySelector(`#systems-catalog-new`)?.addEventListener(`click`,()=>{this.selectedId=``,this.render()}),this.root.querySelector(`#systems-catalog-delete`)?.addEventListener(`click`,()=>void this.deleteSelected()),this.root.querySelector(`#systems-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#systems-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.bindFilter(`#systems-filter-query`,`query`),this.bindFilter(`#systems-filter-layer`,`architectureLayer`),this.bindFilter(`#systems-filter-criticality`,`criticality`),this.bindFilter(`#systems-filter-state`,`state`),this.root.querySelectorAll(`[data-system-row]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedId=e.dataset.systemRow??``,this.render()})),this.root.querySelector(`#systems-catalog-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveSelected()}),this.root.querySelectorAll(`[data-open-process]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.openProcess;t&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:t}})))})),this.root.querySelectorAll(`[data-open-interface]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.openInterface;t&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-integration-catalog`,{detail:{recordKind:`interface`,recordId:t}})))}))}openSelectedInExplorer(e){this.selectedId&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:`system`,id:this.selectedId,mode:e}})))}bindFilter(e,t){let n=this.root.querySelector(e);n?.addEventListener(`input`,()=>{let r=n.value;if(this.filters[t]=r,this.render(),t===`query`){let t=this.root.querySelector(e);t?.focus(),t?.setSelectionRange(r.length,r.length)}})}saveSelected(){let e=this.value(`#systems-name`);if(!e){window.alert(`System name is required.`);return}let t=this.data.systems.find(e=>e.id===this.selectedId),r=this.value(`#systems-criticality`),s=this.value(`#systems-layer`),c=n.some(e=>e.id===s)?s:`other`,l={id:t?.id??a(`system`,e),name:e,type:this.value(`#systems-type`),architectureLayer:c,supplier:this.value(`#systems-supplier`),environment:this.readEnvironments().map(e=>o.find(t=>t.id===e)?.label??e).join(`, `),environments:this.readEnvironments(),dataClassification:this.value(`#systems-data-classification`),integrationType:this.value(`#systems-integration-type`),ownerPositionId:this.value(`#systems-owner`),criticality:r===`low`||r===`high`?r:`medium`,active:this.root.querySelector(`#systems-active`)?.checked??!0,notes:this.value(`#systems-notes`)};t?Object.assign(t,l):this.data.systems.push(l),this.selectedId=l.id,i(this.data),this.render()}async deleteSelected(){if(!this.selectedId)return;let e=this.data.interfaces.some(e=>e.sourceSystemId===this.selectedId||e.targetSystemId===this.selectedId),t=this.governance.records.some(e=>e.systemIds.includes(this.selectedId));if(e||t){window.alert(`This system is still referenced by an interface or process and cannot be deleted. Remove those references first.`);return}window.confirm(`Delete this system from the Systems Catalogue?`)&&(this.data.systems=this.data.systems.filter(e=>e.id!==this.selectedId),this.selectedId=``,i(this.data),this.render())}filteredSystems(){let e=this.filters.query.trim().toLowerCase();return[...this.data.systems].filter(t=>{let n=!e||[t.name,t.id,t.type,t.supplier,t.environment,(t.environments??[`production`]).join(` `),t.dataClassification,t.integrationType,t.notes].join(` `).toLowerCase().includes(e),r=!this.filters.criticality||t.criticality===this.filters.criticality,i=!this.filters.architectureLayer||t.architectureLayer===this.filters.architectureLayer,a=this.filters.state===`all`||this.filters.state===`active`&&t.active||this.filters.state===`inactive`&&!t.active;return n&&r&&i&&a}).sort((e,t)=>(n.find(t=>t.id===e.architectureLayer)?.sequence??999)-(n.find(e=>e.id===t.architectureLayer)?.sequence??999)||e.name.localeCompare(t.name))}usedByProcesses(e){let t=new Set(this.data.interfaces.filter(t=>t.sourceSystemId===e||t.targetSystemId===e).map(e=>e.id)),n=new Set(this.governance.records.filter(n=>n.systemIds.includes(e)||n.interfaceIds.some(e=>t.has(e))).map(e=>e.processId));return this.repository.catalog.processes.filter(e=>n.has(e.id)).sort((e,t)=>e.name.localeCompare(t.name))}connectedInterfaces(e){return this.data.interfaces.filter(t=>t.sourceSystemId===e||t.targetSystemId===e).sort((e,t)=>e.name.localeCompare(t.name))}systemName(e){return this.data.systems.find(t=>t.id===e)?.name??e}value(e){return this.root.querySelector(e)?.value.trim()??``}readEnvironments(){let e=[...this.root.querySelectorAll(`[data-system-environment]`)].filter(e=>e.checked).map(e=>e.dataset.systemEnvironment??``).filter(e=>o.some(t=>t.id===e));return e.length>0?e:[`production`]}architectureLayerOptions(e){return n.map(t=>`<option value="${t.id}"${t.id===e?` selected`:``}>${p(t.label)}</option>`).join(``)}criticalityOptions(e){return[`low`,`medium`,`high`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${f(t)}</option>`).join(``)}positionOptions(e){return this.organisation?this.organisation.positions.filter(t=>t.active||t.id===e).sort((e,t)=>e.name.localeCompare(t.name)).map(t=>`<option value="${p(t.id)}"${t.id===e?` selected`:``}>${p(c(this.organisation,t.id))}</option>`).join(``):``}};function f(e){return e.charAt(0).toUpperCase()+e.slice(1)}function p(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new d;