/* empty css                          */import{i as e,n as t,r as n,t as r}from"./entityIndex-BkFmObN5.js";var i=`owns.stewards.approves.supports.occupies.member-of.part-of.performs.manages.reports-to.uses.depends-on.reads.creates.updates.deletes.stores.transmits.contains.integrates-with.governed-by.subject-to.implements.implemented-by.controls.mitigates.impacts.located-at.related-to`.split(`.`),a=class{dialog;root;snapshot=null;selectedKey=``;query=``;typeFilter=``;mode=`relationships`;constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`enterprise-explorer-dialog`,this.dialog.innerHTML=`<div id="enterprise-explorer-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#enterprise-explorer-root`);if(!e)throw Error(`Unable to initialise Enterprise Explorer.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-enterprise-explorer`,e=>{this.open(e.detail??{})}),document.addEventListener(`enterprise-modeler:open-impact-analysis`,()=>{this.open({mode:`impact`})})}async open(e){if(this.snapshot=await n(),this.mode=e.mode===`impact`?`impact`:`relationships`,e.type&&e.id){let t=r(e.type,e.id);this.snapshot.entities.some(e=>e.key===t)||this.snapshot.entities.push({key:t,type:e.type,id:e.id,name:e.name||e.id,subtitle:e.subtitle||s(e.type)}),this.selectedKey=t}else!this.selectedKey&&this.snapshot.entities.length&&(this.selectedKey=this.snapshot.entities[0].key);this.render(),this.dialog.open||this.dialog.showModal()}render(){if(!this.snapshot)return;let e=this.snapshot.entities.filter(e=>(!this.typeFilter||e.type===this.typeFilter)&&(!this.query||`${e.name} ${e.subtitle} ${e.id}`.toLowerCase().includes(this.query.toLowerCase()))),t=this.snapshot.entities.find(e=>e.key===this.selectedKey)??null,n=[...new Set(this.snapshot.entities.map(e=>e.type))].sort();this.root.innerHTML=`
      <div class="enterprise-catalog-shell">
        <header class="enterprise-catalog-header">
          <div>
            <div class="enterprise-catalog-title">Enterprise Relationship Explorer</div>
            <div class="enterprise-catalog-subtitle">Navigate processes, people, systems, data and governance as one connected model.</div>
          </div>
          <div class="enterprise-catalog-actions">
            <button class="toolbar-button ${this.mode===`relationships`?`toolbar-button-primary`:``}" data-explorer-mode="relationships" type="button">Relationships</button>
            <button class="toolbar-button ${this.mode===`impact`?`toolbar-button-primary`:``}" data-explorer-mode="impact" type="button">Impact Analysis</button>
            <button class="metadata-close-button" id="explorer-close" type="button">×</button>
          </div>
        </header>
        <div class="enterprise-catalog-body">
          <aside class="enterprise-catalog-list-pane">
            <div class="enterprise-catalog-toolbar">
              <input id="explorer-search" type="search" placeholder="Search entities…" value="${c(this.query)}"/>
              <select id="explorer-type"><option value="">All types</option>${n.map(e=>`<option value="${e}" ${this.typeFilter===e?`selected`:``}>${c(s(e))}</option>`).join(``)}</select>
            </div>
            <div class="enterprise-catalog-list">
              ${e.slice(0,400).map(e=>`<button class="enterprise-catalog-item ${e.key===this.selectedKey?`enterprise-catalog-item-selected`:``}" data-entity-key="${c(e.key)}" type="button"><div class="enterprise-catalog-item-name">${c(e.name)}</div><div class="enterprise-catalog-item-meta">${c(s(e.type))} · ${c(e.subtitle)}</div></button>`).join(``)||`<div class="enterprise-empty">No matching entities.</div>`}
            </div>
          </aside>
          <main class="enterprise-catalog-detail-pane">
            ${t?this.renderSelected(t):`<div class="enterprise-empty">Select an entity.</div>`}
          </main>
        </div>
      </div>
    `,this.bindEvents()}renderSelected(e){if(!this.snapshot)return``;let t=this.snapshot.relationships.relationships.filter(t=>t.active&&(r(t.source.type,t.source.id)===e.key||r(t.target.type,t.target.id)===e.key));return`
      <div>
        <div class="enterprise-catalog-item-meta">${c(s(e.type))}</div>
        <h2>${c(e.name)}</h2>
        <div class="enterprise-muted">${c(e.id)}</div>
        ${e.type===`process`?`<button class="toolbar-button" id="explorer-open-process" type="button">Open BPMN Process</button>`:``}
        ${this.mode===`impact`?this.renderImpact(e):this.renderRelationships(e,t)}
      </div>
    `}renderRelationships(e,n){return this.snapshot?`
      <div class="enterprise-catalog-section">
        <h3>Connected entities</h3>
        ${n.length?n.map(n=>{let i=r(n.source.type,n.source.id)===e.key,a=i?n.target:n.source,l=this.resolveEntity(a.type,a.id);return`<div class="enterprise-relationship-row">
            <button class="enterprise-catalog-item" data-entity-key="${c(r(a.type,a.id))}" type="button">
              <div class="enterprise-relationship-type">${i?`→`:`←`} ${c(o(n.type))}</div>
              <div class="enterprise-catalog-item-name">${c(l?.name||a.id)}</div>
              <div class="enterprise-relationship-meta">${c(s(l?l.type:a.type))}${n.description?` · ${c(n.description)}`:``}</div>
            </button>
            ${t(n)?`<span class="enterprise-catalog-item-meta">Derived</span>`:`<button class="toolbar-button" data-remove-relationship="${c(n.id)}" type="button">Remove</button>`}
          </div>`}).join(``):`<div class="enterprise-empty">No relationships recorded yet.</div>`}
      </div>
      <div class="enterprise-catalog-section">
        <h3>Add relationship</h3>
        <form class="enterprise-catalog-form" id="relationship-add-form">
          <div class="enterprise-catalog-form-grid">
            <label class="enterprise-catalog-field"><span>Relationship</span><select id="relationship-type">${i.map(e=>`<option value="${e}">${c(o(e))}</option>`).join(``)}</select></label>
            <label class="enterprise-catalog-field"><span>Target entity</span><select id="relationship-target"><option value="">Select…</option>${this.snapshot.entities.filter(t=>t.key!==e.key).map(e=>`<option value="${c(e.key)}">${c(s(e.type))} — ${c(e.name)}</option>`).join(``)}</select></label>
          </div>
          <label class="enterprise-catalog-field"><span>Description</span><input id="relationship-description"/></label>
          <button class="toolbar-button toolbar-button-primary" type="submit">Add Relationship</button>
        </form>
      </div>
    `:``}renderImpact(e){let t=this.getImpact(e),n=new Map;return t.forEach(e=>{let t=n.get(e.entity.type)??[];t.push(e),n.set(e.entity.type,t)}),`
      <div class="enterprise-catalog-section">
        <h3>Impact radius</h3>
        <p class="enterprise-muted">Connected entities up to three relationship hops from the selected item. This is deliberately relationship-driven rather than hard-coded by entity type.</p>
        <div class="enterprise-impact-grid">
          ${[...n.entries()].map(([e,t])=>`<div class="enterprise-impact-card"><strong>${c(s(e))}</strong><div class="enterprise-catalog-list">${t.sort((e,t)=>e.depth-t.depth||e.entity.name.localeCompare(t.entity.name)).map(e=>`<button class="enterprise-catalog-item" data-entity-key="${c(e.entity.key)}" type="button"><div class="enterprise-catalog-item-name">${c(e.entity.name)}</div><div class="enterprise-catalog-item-meta">Distance ${e.depth}</div></button>`).join(``)}</div></div>`).join(``)||`<div class="enterprise-empty">No downstream impact is mapped yet.</div>`}
        </div>
      </div>
    `}getImpact(e){if(!this.snapshot)return[];let t=new Map(this.snapshot.entities.map(e=>[e.key,e])),n=new Map([[e.key,0]]),i=[e.key];for(let e=1;e<=3&&i.length;e+=1){let t=[];for(let a of i)for(let i of this.snapshot.relationships.relationships.filter(e=>e.active)){let o=r(i.source.type,i.source.id),s=r(i.target.type,i.target.id),c=o===a?s:s===a?o:``;c&&!n.has(c)&&(n.set(c,e),t.push(c))}i=t}return[...n.entries()].filter(([t])=>t!==e.key).map(([e,n])=>({entity:t.get(e),depth:n})).filter(e=>!!e.entity)}resolveEntity(e,t){return this.snapshot?.entities.find(n=>n.key===r(e,t))}bindEvents(){this.root.querySelector(`#explorer-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelectorAll(`[data-explorer-mode]`).forEach(e=>e.addEventListener(`click`,()=>{this.mode=e.dataset.explorerMode===`impact`?`impact`:`relationships`,this.render()})),this.root.querySelector(`#explorer-search`)?.addEventListener(`input`,e=>{this.query=e.target.value,this.render()}),this.root.querySelector(`#explorer-type`)?.addEventListener(`change`,e=>{this.typeFilter=e.target.value,this.render()}),this.root.querySelectorAll(`[data-entity-key]`).forEach(e=>e.addEventListener(`click`,()=>{this.selectedKey=e.dataset.entityKey??``,this.render()})),this.root.querySelector(`#explorer-open-process`)?.addEventListener(`click`,()=>{let e=this.snapshot?.entities.find(e=>e.key===this.selectedKey);e?.type===`process`&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:e.id}})))}),this.root.querySelector(`#relationship-add-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.addRelationship()}),this.root.querySelectorAll(`[data-remove-relationship]`).forEach(e=>e.addEventListener(`click`,()=>{this.removeRelationship(e.dataset.removeRelationship??``)}))}addRelationship(){if(!this.snapshot)return;let e=this.snapshot.entities.find(e=>e.key===this.selectedKey),t=this.root.querySelector(`#relationship-target`)?.value??``,n=this.snapshot.entities.find(e=>e.key===t),r=this.root.querySelector(`#relationship-type`)?.value;if(!e||!n||!r)return;let i={id:`relationship-${crypto.randomUUID()}`,type:r,source:{type:e.type,id:e.id},target:{type:n.type,id:n.id},description:this.root.querySelector(`#relationship-description`)?.value.trim()??``,ownerPositionId:``,active:!0,notes:``};this.snapshot.relationships.relationships.push(i),this.persistExplicitRelationships(),this.render()}removeRelationship(e){if(!this.snapshot||!e)return;let n=this.snapshot.relationships.relationships.find(t=>t.id===e);!n||t(n)||window.confirm(`Remove this relationship?`)&&(this.snapshot.relationships.relationships=this.snapshot.relationships.relationships.filter(t=>t.id!==e),this.persistExplicitRelationships(),this.render())}persistExplicitRelationships(){this.snapshot&&e({schemaVersion:1,relationships:this.snapshot.relationships.relationships.filter(e=>!t(e))})}};function o(e){return e.split(`-`).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(` `)}function s(e){return e.split(`-`).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(` `)}function c(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new a;