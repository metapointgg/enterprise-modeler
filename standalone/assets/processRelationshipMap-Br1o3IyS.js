import{i as e,p as t,t as n}from"./processCatalog-Dye2DPES.js";var r=`http://www.omg.org/spec/BPMN/20100524/MODEL`,i=class{dialog;root;repository={layers:{schemaVersion:1,layers:[]},catalog:{schemaVersion:1,rootProcessId:``,processes:[]}};edges=[];focusProcessId=``;enabledTypes=new Set([`parent`,`bpmn-call`,`drill-down`,`related`]);constructor(){this.dialog=document.createElement(`dialog`),this.dialog.className=`process-relationship-dialog`,this.dialog.innerHTML=`<div id="process-relationship-root"></div>`,document.body.appendChild(this.dialog);let e=this.dialog.querySelector(`#process-relationship-root`);if(!e)throw Error(`Unable to initialise Process Relationship Map.`);this.root=e,this.dialog.addEventListener(`click`,e=>{e.target===this.dialog&&this.dialog.close()}),document.addEventListener(`enterprise-modeler:open-process-relationship-map`,e=>{let t=e.detail?.processId??``;this.open(t)}),this.injectEntryPoint(),new MutationObserver(()=>this.injectEntryPoint()).observe(document.body,{subtree:!0,childList:!0})}injectEntryPoint(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-process-relationship-entry]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.processRelationshipEntry=`true`,t.textContent=`Process Relationship Map`,t.addEventListener(`click`,()=>void this.open()),e.appendChild(t)}async open(e=``){this.renderLoading(),this.dialog.open||this.dialog.showModal(),this.repository=await t(!0),this.edges=await this.buildRelationships(),e&&this.repository.catalog.processes.some(t=>t.id===e)?this.focusProcessId=e:this.focusProcessId&&!this.repository.catalog.processes.some(e=>e.id===this.focusProcessId)&&(this.focusProcessId=``),this.render()}renderLoading(){this.root.innerHTML=`
      <div class="process-relationship-loading">
        <div class="process-relationship-spinner"></div>
        <div>Building process relationship graph…</div>
      </div>
    `}render(){let e=this.edges.filter(e=>this.enabledTypes.has(e.type)),t=this.getVisibleProcesses(e),n=new Set(t.map(e=>e.id)),r=e.filter(e=>n.has(e.sourceId)&&n.has(e.targetId)).length;this.root.innerHTML=`
      <div class="process-relationship-map">
        <header class="process-relationship-header">
          <div>
            <div class="process-relationship-title">Process Relationship Map</div>
            <div class="process-relationship-subtitle">Hierarchy, BPMN Call Activities and Enterprise Modeler process links across all process layers.</div>
          </div>
          <button id="process-relationship-close" class="metadata-close-button" type="button">×</button>
        </header>

        <div class="process-relationship-controls">
          <label>
            <span>Scope</span>
            <select id="process-relationship-focus">
              <option value="">Whole operating model</option>
              ${this.repository.catalog.processes.filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name)).map(e=>`<option value="${a(e.id)}"${e.id===this.focusProcessId?` selected`:``}>${a(e.name)}</option>`).join(``)}
            </select>
          </label>

          <fieldset>
            <legend>Relationships</legend>
            ${this.relationshipToggle(`parent`,`Primary parent`)}
            ${this.relationshipToggle(`bpmn-call`,`BPMN Call`)}
            ${this.relationshipToggle(`drill-down`,`Drill-down`)}
            ${this.relationshipToggle(`related`,`Related / exception / supporting`)}
          </fieldset>

          <div class="process-relationship-counts">
            <strong>${t.length}</strong> processes
            <span>·</span>
            <strong>${r}</strong> relationships
          </div>
        </div>

        <div class="process-relationship-legend">
          ${this.legendItem(`parent`,`Primary parent`)}
          ${this.legendItem(`bpmn-call`,`BPMN Call Activity`)}
          ${this.legendItem(`drill-down`,`Metadata drill-down`)}
          ${this.legendItem(`related`,`Related / exception / supporting`)}
          <span class="process-relationship-help">Click a process node to open its BPMN model.</span>
        </div>

        <div class="process-relationship-canvas">
          ${this.renderGraph(t,e)}
        </div>
      </div>
    `,this.bindEvents()}relationshipToggle(e,t){return`
      <label class="process-relationship-toggle">
        <input type="checkbox" data-relationship-type="${e}"${this.enabledTypes.has(e)?` checked`:``} />
        <span>${a(t)}</span>
      </label>
    `}legendItem(e,t){return`<span class="process-relationship-legend-item"><i class="relationship-swatch relationship-swatch-${e}"></i>${a(t)}</span>`}bindEvents(){this.root.querySelector(`#process-relationship-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#process-relationship-focus`)?.addEventListener(`change`,e=>{this.focusProcessId=e.currentTarget.value,this.render()}),this.root.querySelectorAll(`[data-relationship-type]`).forEach(e=>e.addEventListener(`change`,()=>{let t=e.dataset.relationshipType;t&&(e.checked?this.enabledTypes.add(t):this.enabledTypes.delete(t),this.render())})),this.root.querySelectorAll(`[data-process-relationship-node]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.processRelationshipNode;t&&(this.dialog.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:t}})))}))}getVisibleProcesses(e){let t=this.repository.catalog.processes.filter(e=>e.active);if(!this.focusProcessId)return t;let n=new Set([this.focusProcessId]);e.forEach(e=>{e.sourceId===this.focusProcessId&&n.add(e.targetId),e.targetId===this.focusProcessId&&n.add(e.sourceId)});let r=t.find(e=>e.id===this.focusProcessId);return r?.parentId&&n.add(r.parentId),t.filter(e=>e.parentId===this.focusProcessId).forEach(e=>n.add(e.id)),t.filter(e=>n.has(e.id))}renderGraph(e,t){if(e.length===0)return`<div class="process-relationship-empty">No processes are available for this view.</div>`;let n=new Set(e.map(e=>e.id)),r=t.filter(e=>n.has(e.sourceId)&&n.has(e.targetId)),i=[...this.repository.layers.layers].filter(t=>e.some(e=>e.layerId===t.id)).sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code)),o=new Map,s=1;i.forEach((t,n)=>{let r=e.filter(e=>e.layerId===t.id).sort((e,t)=>e.name.localeCompare(t.name));s=Math.max(s,r.length),r.forEach((e,t)=>{o.set(e.id,{x:70+n*310,y:90+t*96})})});let c=Math.max(1100,140+i.length*310),l=Math.max(620,90+s*96+100);return`
      <svg class="process-relationship-svg" width="${c}" height="${l}" viewBox="0 0 ${c} ${l}" role="img" aria-label="Enterprise Modeler process relationship map">
        <defs>
          <marker id="process-relationship-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 z" />
          </marker>
        </defs>
        ${i.map((e,t)=>{let n=70+t*310;return`<g class="process-layer-heading"><text x="${n}" y="42">${a(e.code)} — ${a(e.name)}</text><line x1="${n}" y1="58" x2="${n+230}" y2="58" /></g>`}).join(``)}
        <g class="process-relationship-edges">${r.map(e=>{let t=o.get(e.sourceId),n=o.get(e.targetId);if(!t||!n)return``;let r=t.x+230,i=t.y+62/2,s=n.x,c=n.y+62/2,l=``;if(Math.abs(t.x-n.x)<10){let e=t.x+230+42;l=`M ${r} ${i} C ${e} ${i}, ${e} ${c}, ${s+230} ${c}`}else{let e=(r+s)/2;l=`M ${r} ${i} C ${e} ${i}, ${e} ${c}, ${s} ${c}`}return`<path class="process-relationship-edge process-relationship-edge-${e.type}" d="${l}" marker-end="url(#process-relationship-arrow)"><title>${a(e.label)}</title></path>`}).join(``)}</g>
        <g class="process-relationship-nodes">${e.map(e=>{let t=o.get(e.id);if(!t)return``;let n=this.repository.layers.layers.find(t=>t.id===e.layerId);return`
        <g class="process-relationship-node" data-process-relationship-node="${a(e.id)}" transform="translate(${t.x},${t.y})">
          <rect width="230" height="62" rx="8" ry="8" />
          <foreignObject x="10" y="7" width="210" height="48">
            <div xmlns="http://www.w3.org/1999/xhtml" class="process-relationship-node-copy">
              <small>${a(n?.code??`Unlayered`)}</small>
              <strong>${a(e.name)}</strong>
            </div>
          </foreignObject>
          <title>${a(e.name)} · Click to open</title>
        </g>
      `}).join(``)}</g>
      </svg>
    `}async buildRelationships(){let e=[],t=this.repository.catalog.processes.filter(e=>e.active),n=new Set(t.map(e=>e.id)),r=new Map(t.map(e=>[e.bpmnProcessId,e.id]));t.forEach(t=>{t.parentId&&n.has(t.parentId)&&e.push({sourceId:t.parentId,targetId:t.id,type:`parent`,label:`Primary parent: ${this.processName(t.parentId)} → ${t.name}`})}),(await Promise.all(t.map(async e=>{let[t,i]=await Promise.all([this.loadBpmnRelationships(e,r),this.loadMetadataRelationships(e,n)]);return[...t,...i]}))).flat().forEach(t=>e.push(t));let i=new Map;return e.forEach(e=>{let t=`${e.type}:${e.sourceId}:${e.targetId}`,n=i.get(t);n?e.label&&!n.label.includes(e.label)&&(n.label+=`; ${e.label}`):i.set(t,e)}),[...i.values()]}async loadBpmnRelationships(e,t){try{let i=localStorage.getItem(`${n}${e.id}.xml`)??``;if(!i){let t=await fetch(e.url,{cache:`no-store`});if(!t.ok)return[];i=await t.text()}let a=new DOMParser().parseFromString(i,`application/xml`),o=[];return Array.from(a.getElementsByTagNameNS(r,`callActivity`)).forEach(n=>{let r=n.getAttribute(`calledElement`)??``,i=t.get(r)??``;!i||i===e.id||o.push({sourceId:e.id,targetId:i,type:`bpmn-call`,label:n.getAttribute(`name`)||`BPMN Call Activity → ${this.processName(i)}`})}),o}catch(t){return console.warn(`Unable to inspect BPMN relationships for ${e.id}.`,t),[]}}async loadMetadataRelationships(t,n){try{let r=localStorage.getItem(`${e}${t.id}`),i;if(r)i=JSON.parse(r);else{let e=await fetch(t.metadataUrl,{cache:`no-store`});if(!e.ok)return[];i=await e.json()}let a=[];return Object.entries(i.nodes??{}).forEach(([e,r])=>{(r.links??[]).forEach(r=>{let i=r.targetProcessId??``;if(!i||i===t.id||!n.has(i))return;let o=r.type===`drill-down`?`drill-down`:`related`;a.push({sourceId:t.id,targetId:i,type:o,label:`${r.label||r.type||`Process link`} · ${e}`})})}),a}catch(e){return console.warn(`Unable to inspect process metadata relationships for ${t.id}.`,e),[]}}processName(e){return this.repository.catalog.processes.find(t=>t.id===e)?.name??e}};function a(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}new i;