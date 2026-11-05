import{i as e,n as t,t as n}from"./processCatalog-Dye2DPES.js";var r=`enterprise-modeler.process-versions.v1.`;i();function i(){let i=document.createElement(`dialog`);i.className=`process-versions-dialog`,document.body.appendChild(i),l(),new MutationObserver(l).observe(document.body,{subtree:!0,childList:!0});async function c(){let e=h();if(!e){window.alert(`Open a repository process before viewing version history.`);return}await p(e),u(e),i.showModal()}function l(){let e=document.querySelector(`.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu`);if(!e||e.querySelector(`[data-process-version-history]`))return;let t=document.createElement(`button`);t.className=`enterprise-modeler-sidebar-submenu-button`,t.type=`button`,t.dataset.processVersionHistory=`true`,t.textContent=`Version History`,t.addEventListener(`click`,()=>void c()),e.appendChild(t)}function u(e){let t=g(e.id).sort((e,t)=>t.revision-e.revision);i.innerHTML=`
      <div class="process-versions-shell">
        <header class="process-versions-header">
          <div>
            <div class="process-versions-title">Process Version History</div>
            <div class="process-versions-subtitle">${s(e.level)} · ${s(e.name)}</div>
          </div>
          <button class="process-versions-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="process-versions-toolbar">
          <button class="process-versions-create" type="button">Create Version</button>
          <button class="process-versions-export" type="button">Export History</button>
          <span>${t.length} version${t.length===1?``:`s`}</span>
        </div>
        <div class="process-versions-list">
          ${t.map((e,t)=>`
            <article class="process-version-card${t===0?` process-version-card-current`:``}">
              <div class="process-version-number">v${e.revision}</div>
              <div class="process-version-details">
                <strong>${s(e.label)}</strong>
                <small>${s(o(e.createdAt))}</small>
              </div>
              <div class="process-version-actions">
                <button type="button" data-download-version="${s(e.id)}">BPMN</button>
                <button type="button" data-restore-version="${s(e.id)}">Restore</button>
              </div>
            </article>
          `).join(``)}
        </div>
        <footer class="process-versions-note">
          Working history is stored locally in this browser. Published BPMN and metadata remain versioned by Git when committed to the repository.
        </footer>
      </div>
    `,i.querySelector(`.process-versions-close`)?.addEventListener(`click`,()=>i.close()),i.querySelector(`.process-versions-create`)?.addEventListener(`click`,async()=>{let t=window.prompt(`Version label / change summary:`,`Manual version`)?.trim();t&&(await f(e,t),u(e))}),i.querySelector(`.process-versions-export`)?.addEventListener(`click`,()=>b(e)),i.querySelectorAll(`[data-restore-version]`).forEach(t=>{t.addEventListener(`click`,()=>void d(e,t.dataset.restoreVersion??``))}),i.querySelectorAll(`[data-download-version]`).forEach(t=>{t.addEventListener(`click`,()=>y(e,t.dataset.downloadVersion??``))})}async function d(t,r){let a=g(t.id).find(e=>e.id===r);a&&window.confirm(`Restore ${t.name} to v${a.revision} — ${a.label}? Current working changes will first be preserved as a version.`)&&(await f(t,`Pre-restore backup before v${a.revision}`),localStorage.setItem(`${n}${t.id}.xml`,a.bpmnXml),localStorage.setItem(`${n}${t.id}.filename`,a.filename),localStorage.setItem(`${e}${t.id}`,a.metadataJson),_(t.id,{...a,id:`version-${crypto.randomUUID()}`,revision:v(t.id),createdAt:new Date().toISOString(),label:`Restored from v${a.revision}`}),i.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:t.id}})))}async function f(e,t){let n=await m(e);_(e.id,{id:`version-${crypto.randomUUID()}`,revision:v(e.id),processId:e.id,createdAt:new Date().toISOString(),label:t,filename:n.filename,bpmnXml:n.bpmnXml,metadataJson:n.metadataJson})}async function p(e){g(e.id).length>0||await f(e,`Baseline`)}async function m(t){let r=`${n}${t.id}.xml`,i=`${n}${t.id}.filename`,a=`${e}${t.id}`,o=localStorage.getItem(r)??``;if(!o){let e=await fetch(t.url,{cache:`no-store`});if(!e.ok)throw Error(`Unable to load BPMN for ${t.name}.`);o=await e.text()}let s=localStorage.getItem(a)??``;if(!s)try{let e=await fetch(t.metadataUrl,{cache:`no-store`});s=e.ok?await e.text():`{"schemaVersion":3,"nodes":{}}`}catch{s=`{"schemaVersion":3,"nodes":{}}`}return{filename:localStorage.getItem(i)||t.filename,bpmnXml:o,metadataJson:s}}function h(){let e=document.querySelector(`#document-name`)?.textContent?.trim()??``,n=document.querySelector(`#process-level`)?.textContent?.trim()??``;return Object.values(t).find(t=>t.active&&t.name===e&&t.level===n)??null}function g(e){let t=localStorage.getItem(`${r}${e}`);if(!t)return[];try{let e=JSON.parse(t);return Array.isArray(e)?e:[]}catch{return[]}}function _(e,t){let n=g(e);n.push(t),localStorage.setItem(`${r}${e}`,JSON.stringify(n))}function v(e){return Math.max(0,...g(e).map(e=>e.revision))+1}function y(e,t){let n=g(e.id).find(e=>e.id===t);n&&a(`${e.id}-v${n.revision}.bpmn`,n.bpmnXml,`application/xml;charset=utf-8`)}function b(e){a(`${e.id}-version-history.json`,`${JSON.stringify(g(e.id),null,2)}\n`,`application/json;charset=utf-8`)}i.addEventListener(`click`,e=>{e.target===i&&i.close()});let x=document.querySelector(`#status`);if(x){let e=``;new MutationObserver(()=>{let t=x.textContent?.trim()??``;if(t===e||(e=t,t!==`BPMN downloaded`))return;let n=h();n&&window.setTimeout(()=>void f(n,`Manual BPMN save`),60)}).observe(x,{subtree:!0,childList:!0,characterData:!0})}}function a(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function o(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:new Intl.DateTimeFormat(`en-GB`,{dateStyle:`medium`,timeStyle:`short`}).format(t)}function s(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}