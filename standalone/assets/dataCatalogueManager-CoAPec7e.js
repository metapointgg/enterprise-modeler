/* empty css                          */import{n as e,t}from"./dataCatalogue-CbEshlSI.js";import{l as n}from"./operatingModelRegistry-B6jlmvai.js";import{f as r}from"./organisation-4SmD6Ce4.js";import{p as i}from"./processCatalog-C9JSMFlk.js";var a=class{dialog;root;data={schemaVersion:1,dataObjects:[],dataFlows:[]};integrations={schemaVersion:2,systems:[],interfaces:[]};organisation=null;processes={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};tab=`objects`;selectedId=``;query=``;constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`enterprise-catalog-dialog`,this.dialog.innerHTML=`<div id="enterprise-data-catalog-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#enterprise-data-catalog-root`);if(!e)throw Error(`Unable to initialise Data Catalogue.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-data-catalogue`,()=>void this.open())}async open(){[this.data,this.integrations,this.organisation,this.processes]=await Promise.all([t(!0),n(!0),r(!0),i(!0)]),this.ensureSelection(),this.render(),this.dialog.open||this.dialog.showModal()}ensureSelection(){let e=this.tab===`objects`?this.data.dataObjects:this.data.dataFlows;this.selectedId&&!e.some(e=>e.id===this.selectedId)&&(this.selectedId=``),!this.selectedId&&e.length>0&&(this.selectedId=e[0].id)}render(){let e=(this.tab===`objects`?this.data.dataObjects:this.data.dataFlows).filter(e=>!this.query||e.name.toLowerCase().includes(this.query.toLowerCase()));this.root.innerHTML=`
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Data Catalogue</div>
            <div class="enterprise-catalog-subtitle">Data objects, ownership, systems of record and data flows.</div>
          </div>
          <div class="enterprise-catalog-actions">
            <button class="toolbar-button" id="data-catalog-export" type="button">Export JSON</button>
            <button class="metadata-close-button" id="data-catalog-close" type="button">×</button>
          </div>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-tabs">
              <button class="enterprise-catalog-tab ${this.tab===`objects`?`enterprise-catalog-tab-active`:``}" data-data-tab="objects" type="button">Data Objects</button>
              <button class="enterprise-catalog-tab ${this.tab===`flows`?`enterprise-catalog-tab-active`:``}" data-data-tab="flows" type="button">Data Flows</button>
            </div>
            <div class="enterprise-catalog-toolbar">
              <input id="data-catalog-search" type="search" placeholder="Search…" value="${d(this.query)}" />
              <button class="toolbar-button" id="data-catalog-new" type="button">New</button>
            </div>
            <div class="enterprise-catalog-list">
              ${e.length?e.map(e=>`
                <button type="button" class="enterprise-catalog-item ${e.id===this.selectedId?`enterprise-catalog-item-selected`:``}" data-data-record="${d(e.id)}">
                  <div class="enterprise-catalog-item-name">${d(e.name)}</div>
                  <div class="enterprise-catalog-item-meta">${this.tab===`objects`?d(e.domain||`Data Object`):`Data Flow`}</div>
                </button>
              `).join(``):`<div class="enterprise-empty">No records.</div>`}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${this.tab===`objects`?this.renderObjectForm():this.renderFlowForm()}
          </main>
        </div>
      </div>
    `,this.bindEvents()}renderObjectForm(){let e=this.data.dataObjects.find(e=>e.id===this.selectedId),t=this.organisation?.positions??[];return`
      <form class="enterprise-catalog-form" id="data-object-form">
        <h2>${e?`Edit Data Object`:`New Data Object`}</h2>
        <div class="enterprise-catalog-form-grid">
          ${o(`Name`,`data-name`,e?.name??``,!0)}
          ${o(`Data domain`,`data-domain`,e?.domain??``)}
          ${c(`Classification`,`data-classification`,[`public`,`internal`,`confidential`,`restricted`,`tbc`],e?.classification??`tbc`)}
          ${l(`System of record`,`data-system`,this.integrations.systems.map(e=>[e.id,e.name]),e?.systemOfRecordId??``)}
          ${l(`Business owner`,`data-owner`,t.map(e=>[e.id,e.name]),e?.businessOwnerPositionId??``)}
          ${l(`Data steward`,`data-steward`,t.map(e=>[e.id,e.name]),e?.dataStewardPositionId??``)}
          ${o(`Retention period`,`data-retention`,e?.retentionPeriod??``)}
          ${o(`Data residency`,`data-residency`,e?.dataResidency??``)}
          ${c(`Criticality`,`data-criticality`,[`low`,`medium`,`high`],e?.criticality??`medium`)}
        </div>
        ${s(`Description`,`data-description`,e?.description??``)}
        <label class="enterprise-catalog-check"><input id="data-personal" type="checkbox" ${e?.personalData?`checked`:``}/> Personal data</label>
        <label class="enterprise-catalog-check"><input id="data-special" type="checkbox" ${e?.specialCategoryData?`checked`:``}/> Special-category / sensitive personal data</label>
        <label class="enterprise-catalog-check"><input id="data-active" type="checkbox" ${e?.active===!1?``:`checked`}/> Active</label>
        ${s(`Notes`,`data-notes`,e?.notes??``)}
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          ${e?`<button class="toolbar-button" id="data-explore" type="button">Explore Relationships</button><button class="toolbar-button" id="data-impact" type="button">Impact Analysis</button><button class="toolbar-button toolbar-button-danger" id="data-delete" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderFlowForm(){let e=this.data.dataFlows.find(e=>e.id===this.selectedId),t=this.organisation?.positions??[],n=this.integrations.systems.map(e=>[e.id,e.name]),r=this.integrations.interfaces.map(e=>[e.id,e.name]),i=this.processes.catalog.processes.map(e=>[e.id,e.name]);return`
      <form class="enterprise-catalog-form" id="data-flow-form">
        <h2>${e?`Edit Data Flow`:`New Data Flow`}</h2>
        <div class="enterprise-catalog-form-grid">
          ${o(`Name`,`flow-name`,e?.name??``,!0)}
          ${l(`Source system`,`flow-source`,n,e?.sourceSystemId??``)}
          ${l(`Target system`,`flow-target`,n,e?.targetSystemId??``)}
          ${l(`Process`,`flow-process`,i,e?.processId??``)}
          ${o(`BPMN node ID`,`flow-node`,e?.processNodeId??``)}
          ${l(`Interface`,`flow-interface`,r,e?.interfaceId??``)}
          ${c(`Direction`,`flow-direction`,[`outbound`,`inbound`,`bidirectional`],e?.direction??`outbound`)}
          ${o(`Frequency`,`flow-frequency`,e?.frequency??``)}
          ${o(`Protocol`,`flow-protocol`,e?.protocol??``)}
          ${c(`Classification`,`flow-classification`,[`public`,`internal`,`confidential`,`restricted`,`tbc`],e?.classification??`tbc`)}
          ${o(`Encryption`,`flow-encryption`,e?.encryption??``)}
          ${l(`Owner`,`flow-owner`,t.map(e=>[e.id,e.name]),e?.ownerPositionId??``)}
        </div>
        ${s(`Purpose`,`flow-purpose`,e?.purpose??``)}
        <label class="enterprise-catalog-field"><span>Data objects</span>
          <select id="flow-data-objects" multiple size="6">
            ${this.data.dataObjects.map(t=>`<option value="${d(t.id)}" ${e?.dataObjectIds.includes(t.id)?`selected`:``}>${d(t.name)}</option>`).join(``)}
          </select>
        </label>
        <label class="enterprise-catalog-check"><input id="flow-active" type="checkbox" ${e?.active===!1?``:`checked`}/> Active</label>
        ${s(`Notes`,`flow-notes`,e?.notes??``)}
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">Save</button>
          ${e?`<button class="toolbar-button" id="data-explore" type="button">Explore Relationships</button><button class="toolbar-button" id="data-impact" type="button">Impact Analysis</button><button class="toolbar-button toolbar-button-danger" id="data-delete" type="button">Delete</button>`:``}
        </div>
      </form>
    `}bindEvents(){this.root.querySelector(`#data-catalog-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#data-catalog-export`)?.addEventListener(`click`,()=>u(`data-catalogue.json`,this.data)),this.root.querySelectorAll(`[data-data-tab]`).forEach(e=>e.addEventListener(`click`,()=>{this.tab=e.dataset.dataTab===`flows`?`flows`:`objects`,this.selectedId=``,this.ensureSelection(),this.render()})),this.root.querySelector(`#data-catalog-search`)?.addEventListener(`input`,e=>{this.query=e.target.value,this.render()}),this.root.querySelector(`#data-catalog-new`)?.addEventListener(`click`,()=>{this.selectedId=``,this.render()}),this.root.querySelectorAll(`[data-data-record]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedId=e.dataset.dataRecord??``,this.render()})),this.root.querySelector(`#data-object-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveObject()}),this.root.querySelector(`#data-flow-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveFlow()}),this.root.querySelector(`#data-delete`)?.addEventListener(`click`,()=>this.deleteSelected()),this.root.querySelector(`#data-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#data-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`))}openSelectedInExplorer(e){if(!this.selectedId)return;let t=this.tab===`flows`?`data-flow`:`data-object`;this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:t,id:this.selectedId,mode:e}}))}value(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}saveObject(){let t=this.value(`data-name`);if(!t)return;let n=this.data.dataObjects.find(e=>e.id===this.selectedId),r={id:n?.id??`data-${crypto.randomUUID()}`,name:t,description:this.value(`data-description`),domain:this.value(`data-domain`),businessOwnerPositionId:this.value(`data-owner`),dataStewardPositionId:this.value(`data-steward`),classification:this.value(`data-classification`),personalData:this.root.querySelector(`#data-personal`)?.checked??!1,specialCategoryData:this.root.querySelector(`#data-special`)?.checked??!1,systemOfRecordId:this.value(`data-system`),retentionPeriod:this.value(`data-retention`),dataResidency:this.value(`data-residency`),criticality:this.value(`data-criticality`),active:this.root.querySelector(`#data-active`)?.checked??!0,notes:this.value(`data-notes`)};n?Object.assign(n,r):this.data.dataObjects.push(r),this.selectedId=r.id,e(this.data),this.render()}saveFlow(){let t=this.value(`flow-name`);if(!t)return;let n=this.data.dataFlows.find(e=>e.id===this.selectedId),r=Array.from(this.root.querySelector(`#flow-data-objects`)?.selectedOptions??[]).map(e=>e.value),i={id:n?.id??`data-flow-${crypto.randomUUID()}`,name:t,sourceSystemId:this.value(`flow-source`),targetSystemId:this.value(`flow-target`),dataObjectIds:r,processId:this.value(`flow-process`),processNodeId:this.value(`flow-node`),interfaceId:this.value(`flow-interface`),direction:this.value(`flow-direction`),frequency:this.value(`flow-frequency`),protocol:this.value(`flow-protocol`),classification:this.value(`flow-classification`),encryption:this.value(`flow-encryption`),purpose:this.value(`flow-purpose`),ownerPositionId:this.value(`flow-owner`),active:this.root.querySelector(`#flow-active`)?.checked??!0,notes:this.value(`flow-notes`)};n?Object.assign(n,i):this.data.dataFlows.push(i),this.selectedId=i.id,e(this.data),this.render()}deleteSelected(){!this.selectedId||!window.confirm(`Delete this catalogue record?`)||(this.tab===`objects`?(this.data.dataObjects=this.data.dataObjects.filter(e=>e.id!==this.selectedId),this.data.dataFlows.forEach(e=>{e.dataObjectIds=e.dataObjectIds.filter(e=>e!==this.selectedId)})):this.data.dataFlows=this.data.dataFlows.filter(e=>e.id!==this.selectedId),this.selectedId=``,e(this.data),this.ensureSelection(),this.render())}};function o(e,t,n,r=!1){return`<label class="enterprise-catalog-field"><span>${d(e)}</span><input id="${t}" value="${d(n)}" ${r?`required`:``}/></label>`}function s(e,t,n){return`<label class="enterprise-catalog-field"><span>${d(e)}</span><textarea id="${t}" rows="3">${d(n)}</textarea></label>`}function c(e,t,n,r){return l(e,t,n.map(e=>[e,e]),r)}function l(e,t,n,r){return`<label class="enterprise-catalog-field"><span>${d(e)}</span><select id="${t}"><option value="">—</option>${n.map(([e,t])=>`<option value="${d(e)}" ${e===r?`selected`:``}>${d(t)}</option>`).join(``)}</select></label>`}function u(e,t){let n=URL.createObjectURL(new Blob([`${JSON.stringify(t,null,2)}\n`],{type:`application/json;charset=utf-8`})),r=document.createElement(`a`);r.href=n,r.download=e,document.body.appendChild(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),0)}function d(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new a;