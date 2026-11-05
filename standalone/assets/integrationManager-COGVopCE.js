import{d as e,o as t,p as n,s as r,t as i,u as a}from"./operatingModelRegistry-D6ECpnvQ.js";import{c as o,f as s}from"./organisation-CjLVZz1v.js";var c=class{dialog;root;data={schemaVersion:2,systems:[],interfaces:[]};organisation=null;selectedInterfaceId=``;constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`integration-manager-dialog`,this.dialog.innerHTML=`<div id="integration-manager-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#integration-manager-root`);if(!e)throw Error(`Unable to initialise Integration Catalogue.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-integration-catalog`,e=>{let t=e.detail;if(t?.recordKind===`system`){document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-systems-catalog`,{detail:{recordId:t.recordId??``}}));return}this.selectedInterfaceId=t?.recordKind===`interface`?t.recordId??``:``,this.open()}),this.injectEntryPoint(),new MutationObserver(()=>this.injectEntryPoint()).observe(document.body,{subtree:!0,childList:!0})}injectEntryPoint(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-integration-catalog-entry]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.integrationCatalogEntry=`true`,t.textContent=`Integration Catalogue`,t.addEventListener(`click`,()=>void this.open()),e.appendChild(t)}async open(){[this.data,this.organisation]=await Promise.all([a(!0),s()]),this.selectedInterfaceId&&!this.data.interfaces.some(e=>e.id===this.selectedInterfaceId)&&(this.selectedInterfaceId=``),this.render(),this.dialog.open||this.dialog.showModal()}render(){let e=this.data.interfaces.find(e=>e.id===this.selectedInterfaceId)??null,t=[...this.data.interfaces].sort((e,t)=>e.name.localeCompare(t.name)).map(e=>`
        <button
          class="integration-list-item${e.id===this.selectedInterfaceId?` integration-list-item-selected`:``}"
          type="button"
          data-interface-id="${u(e.id)}"
        >
          <strong>${u(e.name)}</strong>
          <span>${u(this.systemName(e.sourceSystemId))} → ${u(this.systemName(e.targetSystemId))} · ${u(e.status)}</span>
        </button>
      `).join(``);this.root.innerHTML=`
      <div class="integration-manager">
        <header class="integration-manager-header">
          <div>
            <div class="integration-manager-title">Integration Catalogue</div>
            <div class="integration-manager-subtitle">APIs and interfaces connecting systems in the Enterprise Modeler solution architecture.</div>
          </div>
          <div class="integration-manager-actions">
            <button id="integration-export" class="toolbar-button" type="button">Export Catalogue</button>
            <button id="integration-close" class="metadata-close-button" type="button">×</button>
          </div>
        </header>

        <div class="integration-manager-body">
          <div class="integration-split">
            <section class="integration-list">
              <div class="integration-list-heading">
                <span>APIs / Interfaces</span>
                <button id="integration-new-interface" class="toolbar-button" type="button">New Interface</button>
              </div>
              ${t||`<div class="integration-empty">No interfaces defined.</div>`}
            </section>
            <section class="integration-editor">${this.renderInterfaceForm(e)}</section>
          </div>
        </div>

        <footer class="integration-manager-footer">
          Systems are managed in the Systems Catalogue. Interface changes are browser-local until exported and committed to the repository.
        </footer>
      </div>
    `,this.bindEvents()}renderInterfaceForm(e){return`
      <form id="integration-interface-form" class="integration-form">
        <h3>${e?`Edit API / interface`:`Add API / interface`}</h3>
        ${e?`<small>${u(e.id)}</small>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="integration-interface-name" required value="${u(e?.name??``)}" />
        </label>

        <div class="integration-two-col">
          <label class="metadata-field">
            <span>Source</span>
            <select id="integration-interface-source" required>
              <option value="">Select system</option>
              ${this.systemOptions(e?.sourceSystemId??``)}
            </select>
          </label>
          <label class="metadata-field">
            <span>Target</span>
            <select id="integration-interface-target" required>
              <option value="">Select system</option>
              ${this.systemOptions(e?.targetSystemId??``)}
            </select>
          </label>
        </div>

        <div class="integration-two-col">
          <label class="metadata-field">
            <span>Direction</span>
            <select id="integration-interface-direction">${this.directionOptions(e?.direction??`outbound`)}</select>
          </label>
          <label class="metadata-field">
            <span>Status</span>
            <select id="integration-interface-status">${this.statusOptions(e?.status??`design`)}</select>
          </label>
        </div>

        <fieldset class="metadata-field">
          <span>Environments</span>
          <div class="organisation-checkbox-row">
            ${i.map(t=>`<label><input type="checkbox" data-interface-environment="${t.id}"${(e?.environments??[`production`]).includes(t.id)?` checked`:``} /><span>${u(t.label)}</span></label>`).join(``)}
          </div>
        </fieldset>

        <label class="metadata-field"><span>Protocol</span><input id="integration-interface-protocol" value="${u(e?.protocol??``)}" placeholder="e.g. HTTPS / JSON or TBC" /></label>
        <label class="metadata-field"><span>Authentication</span><input id="integration-interface-auth" value="${u(e?.authentication??``)}" placeholder="Configuration / mechanism or TBC" /></label>
        <label class="metadata-field"><span>Owner position</span><select id="integration-interface-owner"><option value="">Unassigned</option>${this.positionOptions(e?.ownerPositionId??``)}</select></label>
        <label class="metadata-field"><span>Criticality</span><select id="integration-interface-criticality">${this.criticalityOptions(e?.criticality??`medium`)}</select></label>
        <label class="metadata-field"><span>Documentation reference</span><input id="integration-interface-doc" value="${u(e?.documentationReference??``)}" placeholder="Specification / documentation reference" /></label>
        <label class="metadata-field"><span>Notes</span><textarea id="integration-interface-notes" rows="4">${u(e?.notes??``)}</textarea></label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Interface`:`Add Interface`}</button>
          ${e?`<button id="integration-delete-interface" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}bindEvents(){this.root.querySelector(`#integration-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#integration-export`)?.addEventListener(`click`,()=>t(`integrations.json`,this.data)),this.root.querySelector(`#integration-new-interface`)?.addEventListener(`click`,()=>{this.selectedInterfaceId=``,this.render()}),this.root.querySelectorAll(`[data-interface-id]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedInterfaceId=e.dataset.interfaceId??``,this.render()})),this.root.querySelector(`#integration-interface-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveInterface()}),this.root.querySelector(`#integration-delete-interface`)?.addEventListener(`click`,()=>void this.deleteInterface())}saveInterface(){let e=this.value(`#integration-interface-name`),t=this.value(`#integration-interface-source`),i=this.value(`#integration-interface-target`);if(!e||!t||!i){window.alert(`Interface name, source and target are required.`);return}let a=this.data.interfaces.find(e=>e.id===this.selectedInterfaceId),o=this.value(`#integration-interface-direction`),s=this.value(`#integration-interface-status`),c=this.value(`#integration-interface-criticality`),l={id:a?.id??r(`interface`,e),name:e,sourceSystemId:t,targetSystemId:i,direction:o===`inbound`||o===`bidirectional`?o:`outbound`,protocol:this.value(`#integration-interface-protocol`),authentication:this.value(`#integration-interface-auth`),environments:this.readEnvironments(),ownerPositionId:this.value(`#integration-interface-owner`),criticality:c===`low`||c===`high`?c:`medium`,status:s===`active`||s===`retired`||s===`tbc`?s:`design`,documentationReference:this.value(`#integration-interface-doc`),notes:this.value(`#integration-interface-notes`)};a?Object.assign(a,l):this.data.interfaces.push(l),this.selectedInterfaceId=l.id,n(this.data),this.render()}async deleteInterface(){if(this.selectedInterfaceId){if((await e(!0)).records.some(e=>e.interfaceIds.includes(this.selectedInterfaceId))){window.alert(`This interface is still referenced by a process and cannot be deleted. Remove the process references first.`);return}window.confirm(`Delete this interface from the catalogue?`)&&(this.data.interfaces=this.data.interfaces.filter(e=>e.id!==this.selectedInterfaceId),this.selectedInterfaceId=``,n(this.data),this.render())}}value(e){return this.root.querySelector(e)?.value.trim()??``}readEnvironments(){let e=[...this.root.querySelectorAll(`[data-interface-environment]`)].filter(e=>e.checked).map(e=>e.dataset.interfaceEnvironment??``).filter(e=>i.some(t=>t.id===e));return e.length>0?e:[`production`]}positionOptions(e){return this.organisation?this.organisation.positions.filter(t=>t.active||t.id===e).sort((e,t)=>e.name.localeCompare(t.name)).map(t=>`<option value="${u(t.id)}"${t.id===e?` selected`:``}>${u(o(this.organisation,t.id))}</option>`).join(``):``}systemOptions(e){return this.data.systems.filter(t=>t.active||t.id===e).sort((e,t)=>e.name.localeCompare(t.name)).map(t=>`<option value="${u(t.id)}"${t.id===e?` selected`:``}>${u(t.name)}</option>`).join(``)}systemName(e){return this.data.systems.find(t=>t.id===e)?.name??e}criticalityOptions(e){return[`low`,`medium`,`high`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${l(t)}</option>`).join(``)}directionOptions(e){return[`outbound`,`inbound`,`bidirectional`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${l(t)}</option>`).join(``)}statusOptions(e){return[`design`,`active`,`tbc`,`retired`].map(t=>`<option value="${t}"${t===e?` selected`:``}>${t===`tbc`?`TBC`:l(t)}</option>`).join(``)}};function l(e){return e.charAt(0).toUpperCase()+e.slice(1)}function u(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new c;