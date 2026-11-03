/* empty css                          */import{t as e}from"./governanceCatalogueRegistry-D2d8Tb70.js";var t=[{id:`businessRules`,label:`Business Rules`,type:`business-rule`},{id:`controls`,label:`Controls`,type:`control`},{id:`risks`,label:`Risks`,type:`risk`},{id:`requirements`,label:`Requirements`,type:`requirement`},{id:`policies`,label:`Policies & Standards`,type:`policy`}],n=class{dialog;root;data=null;tab=`businessRules`;selectedId=``;query=``;constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`enterprise-catalog-dialog`,this.dialog.innerHTML=`<div id="enterprise-governance-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#enterprise-governance-root`);if(!e)throw Error(`Unable to initialise Governance Catalogue.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-governance-catalogue`,()=>void this.open())}async open(){this.data=await e(!0),this.ensureSelection(),this.render(),this.dialog.open||this.dialog.showModal()}records(){return this.data?this.data[this.tab]:[]}ensureSelection(){let e=this.records();this.selectedId&&!e.some(e=>e.id===this.selectedId)&&(this.selectedId=``),!this.selectedId&&e.length&&(this.selectedId=e[0].id)}render(){let e=this.records().filter(e=>!this.query||e.name.toLowerCase().includes(this.query.toLowerCase())),n=this.records().find(e=>e.id===this.selectedId),i=t.find(e=>e.id===this.tab)??t[0];this.root.innerHTML=`
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Governance Catalogue</div>
            <div class="enterprise-catalog-subtitle">Business rules, controls, risks, requirements, policies and standards.</div>
          </div>
          <button class="metadata-close-button" id="governance-close" type="button">×</button>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-tabs">
              ${t.map(e=>`<button class="enterprise-catalog-tab ${e.id===this.tab?`enterprise-catalog-tab-active`:``}" data-governance-tab="${e.id}" type="button">${r(e.label)}</button>`).join(``)}
            </div>
            <div class="enterprise-catalog-toolbar"><input id="governance-search" type="search" placeholder="Search…" value="${r(this.query)}"/></div>
            <div class="enterprise-catalog-list">
              ${e.length?e.map(e=>`<button class="enterprise-catalog-item ${e.id===this.selectedId?`enterprise-catalog-item-selected`:``}" data-governance-record="${r(e.id)}" type="button"><div class="enterprise-catalog-item-name">${r(e.name)}</div><div class="enterprise-catalog-item-meta">${e.active===!1?`Inactive`:r(i.label.slice(0,-1))}</div></button>`).join(``):`<div class="enterprise-empty">No records yet.</div>`}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${n?`
              <h2>${r(n.name)}</h2>
              <p>${r(n.description||`No description recorded.`)}</p>
              ${n.notes?`<div class="enterprise-catalog-section"><h3>Notes</h3><p>${r(n.notes)}</p></div>`:``}
              <div class="enterprise-catalog-section">
                <button class="toolbar-button" id="governance-explore" type="button">Explore Relationships</button>
                <button class="toolbar-button toolbar-button-primary" id="governance-impact" type="button">Open Impact Analysis</button>
              </div>
            `:`<div class="enterprise-empty">Select a governance record.</div>`}
          </main>
        </div>
      </div>
    `,this.bindEvents(i.type)}bindEvents(e){this.root.querySelector(`#governance-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelectorAll(`[data-governance-tab]`).forEach(e=>e.addEventListener(`click`,()=>{this.tab=e.dataset.governanceTab||`businessRules`,this.selectedId=``,this.ensureSelection(),this.render()})),this.root.querySelector(`#governance-search`)?.addEventListener(`input`,e=>{this.query=e.target.value,this.render()}),this.root.querySelectorAll(`[data-governance-record]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedId=e.dataset.governanceRecord??``,this.render()})),this.root.querySelector(`#governance-explore`)?.addEventListener(`click`,()=>{this.selectedId&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:e,id:this.selectedId,mode:`relationships`}})))}),this.root.querySelector(`#governance-impact`)?.addEventListener(`click`,()=>{this.selectedId&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:e,id:this.selectedId,mode:`impact`}})))})}};function r(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new n;