import{p as e}from"./processCatalog-C9JSMFlk.js";import{r as t}from"./entityIndex-CvCADRT9.js";var n=class{dialog;root;items=[];constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`global-search-dialog`,this.dialog.innerHTML=`<div id="global-search-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#global-search-root`);if(!e)throw Error(`Unable to initialise global search.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`keydown`,e=>{(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`k`&&(e.preventDefault(),this.open())}),this.injectEntryPoint(),new MutationObserver(()=>this.injectEntryPoint()).observe(document.body,{subtree:!0,childList:!0})}injectEntryPoint(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="home"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-global-search-entry]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.globalSearchEntry=`true`,t.textContent=`Global Search`,t.title=`Global Search (Ctrl+K)`,t.addEventListener(`click`,()=>void this.open()),e.appendChild(t)}async open(){this.renderLoading(),this.dialog.open||this.dialog.showModal(),this.items=await this.buildIndex(),this.render(``),window.setTimeout(()=>this.root.querySelector(`#global-search-input`)?.focus(),0)}renderLoading(){this.root.innerHTML=`
      <div class="global-search-shell">
        <header class="global-search-header">
          <strong>Global Search</strong>
          <button class="global-search-close" type="button">×</button>
        </header>
        <div class="global-search-loading">Building enterprise model search index…</div>
      </div>
    `,this.root.querySelector(`.global-search-close`)?.addEventListener(`click`,()=>this.dialog.close())}render(e){let t=this.search(e);this.root.innerHTML=`
      <div class="global-search-shell">
        <header class="global-search-header">
          <div>
            <strong>Global Search</strong>
            <small>Processes, people, systems, data, rules, controls, risks and regulations</small>
          </div>
          <button class="global-search-close" type="button" aria-label="Close">×</button>
        </header>

        <div class="global-search-input-row">
          <input
            id="global-search-input"
            type="search"
            value="${i(e)}"
            placeholder="Search the enterprise model…"
            autocomplete="off"
          />
          <span>Ctrl K</span>
        </div>

        <div class="global-search-results">
          ${t.length===0?`<div class="global-search-empty">No matching enterprise-model records.</div>`:t.map(e=>`
              <button type="button" class="global-search-result" data-search-id="${i(e.id)}">
                <span class="global-search-category">${i(e.category)}</span>
                <span class="global-search-result-copy">
                  <strong>${i(e.title)}</strong>
                  <small>${i(e.subtitle)}</small>
                </span>
                <span class="global-search-arrow">→</span>
              </button>
            `).join(``)}
        </div>

        <footer class="global-search-footer">
          ${t.length} result${t.length===1?``:`s`} · Select an entity to open its relationships.
        </footer>
      </div>
    `;let n=this.root.querySelector(`#global-search-input`);n?.addEventListener(`input`,()=>{let e=n.value;this.render(e);let t=this.root.querySelector(`#global-search-input`);t?.focus(),t?.setSelectionRange(e.length,e.length)}),this.root.querySelector(`.global-search-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelectorAll(`[data-search-id]`).forEach(e=>e.addEventListener(`click`,()=>{let t=this.items.find(t=>t.id===e.dataset.searchId);t&&this.activate(t.action)}))}search(e){let t=e.toLowerCase().trim().split(/\s+/).filter(Boolean);return this.items.map(e=>{if(t.length===0)return{item:e,score:e.action.kind===`explorer`&&e.action.entityType===`process`?4:1};let n=e.title.toLowerCase(),r=`${e.title} ${e.subtitle} ${e.keywords} ${e.category}`.toLowerCase();return t.every(e=>r.includes(e))?{item:e,score:(t.some(e=>n===e)?20:0)+(t.some(e=>n.startsWith(e))?10:0)+t.filter(e=>n.includes(e)).length*4+1}:{item:e,score:-1}}).filter(e=>e.score>=0).sort((e,t)=>t.score-e.score||e.item.category.localeCompare(t.item.category)||e.item.title.localeCompare(t.item.title)).slice(0,100).map(e=>e.item)}async buildIndex(){let[n,r]=await Promise.all([e(!0),t()]),i=r.entities.map(e=>this.entitySearchItem(e)),a=(await Promise.all(n.catalog.processes.filter(e=>e.active).map(e=>this.indexProcessActivities(e)))).flat();return i.push(...a),i}entitySearchItem(e){return{id:`entity:${e.key}`,category:r(e.type),title:e.name,subtitle:e.subtitle,keywords:`${e.id} ${e.type}`,action:{kind:`explorer`,entityType:e.type,entityId:e.id}}}async indexProcessActivities(e){try{let t=localStorage.getItem(`enterprise-modeler.hierarchy.v2.${e.id}.xml`)??``;if(!t){let n=await fetch(e.url,{cache:`no-store`});if(!n.ok)return[];t=await n.text()}let n=new DOMParser().parseFromString(t,`application/xml`),r=new Set([`task`,`userTask`,`serviceTask`,`manualTask`,`scriptTask`,`businessRuleTask`,`callActivity`,`subProcess`,`startEvent`,`endEvent`,`exclusiveGateway`,`parallelGateway`,`inclusiveGateway`,`eventBasedGateway`,`lane`,`participant`,`dataObjectReference`,`dataStoreReference`]);return Array.from(n.querySelectorAll(`[id][name]`)).filter(e=>r.has(e.localName)).map(t=>({id:`bpmn:${e.id}:${t.getAttribute(`id`)??crypto.randomUUID()}`,category:t.localName===`lane`?`Swimlane`:t.localName===`participant`?`Pool / Participant`:t.localName===`dataObjectReference`||t.localName===`dataStoreReference`?`BPMN Data`:`Process Step`,title:t.getAttribute(`name`)??t.getAttribute(`id`)??`BPMN element`,subtitle:e.name,keywords:`${t.getAttribute(`id`)??``} ${e.id} ${t.localName}`,action:{kind:`process`,processId:e.id}}))}catch(t){return console.warn(`Unable to index BPMN activities for ${e.id}.`,t),[]}}activate(e){if(this.dialog.close(),e.kind===`process`){document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:e.processId}}));return}document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{type:e.entityType,id:e.entityId,mode:e.mode??`relationships`}}))}};function r(e){return e.split(`-`).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(` `)}function i(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new n;