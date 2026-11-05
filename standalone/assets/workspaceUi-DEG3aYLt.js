import{d as e,f as t,u as n}from"./organisation-CjLVZz1v.js";import{i as r,n as i}from"./processCatalog-Dye2DPES.js";var a=[{id:`home`,label:`Home`,icon:`⌂`,actions:[{label:`Home Model`,targetButtonId:`home-button`},{label:`Back`,targetButtonId:`back-button`}]},{id:`process`,label:`Process`,icon:`◇`,actions:[{label:`Process Library`,targetButtonId:`process-manager-button`},{label:`New Process`,targetButtonId:`new-button`},{label:`Open BPMN`,targetButtonId:`open-button`},{label:`Reset Current`,targetButtonId:`reset-button`},{label:`Save BPMN`,targetButtonId:`save-button`},{label:`Export SVG`,targetButtonId:`svg-button`}]},{id:`organisation`,label:`Organisation`,icon:`◎`,actions:[{label:`People & Positions`,targetButtonId:`organisation-button`},{label:`Org Chart`,targetButtonId:`org-chart-button`}]}],o=document.querySelector(`.modeler-shell`),s=document.querySelector(`.modeler-workspace`),c=document.querySelector(`#canvas`),l=document.querySelector(`#status`);!o||!s||!c||!l?console.warn(`Enterprise Modeler workspace UI could not initialise because required application elements were not found.`):u(o,s,c,l);function u(e,t,n,r){d(e),p(r),m(r),h(t),g(n),_(t,r),y(n)}function d(e){let t=document.createElement(`aside`);t.className=`enterprise-modeler-sidebar`,t.setAttribute(`aria-label`,`Application navigation`),t.innerHTML=`
    <div class="enterprise-modeler-sidebar-header">
      <button class="enterprise-modeler-sidebar-toggle" type="button" title="Collapse navigation" aria-label="Collapse navigation">
        <span class="enterprise-modeler-sidebar-toggle-icon">☰</span>
      </button>
      <div class="enterprise-modeler-sidebar-brand">Enterprise Modeler</div>
    </div>
    <nav class="enterprise-modeler-sidebar-nav">
      ${a.map(f).join(``)}
    </nav>
  `,document.body.appendChild(t),e.classList.add(`enterprise-modeler-shell-with-sidebar`);let n=t.querySelector(`.enterprise-modeler-sidebar-toggle`);n?.addEventListener(`click`,()=>{let e=document.body.classList.toggle(`enterprise-modeler-sidebar-collapsed`);n.title=e?`Expand navigation`:`Collapse navigation`,n.setAttribute(`aria-label`,n.title)}),t.querySelectorAll(`[data-sidebar-section]`).forEach(e=>{e.addEventListener(`click`,()=>{document.body.classList.contains(`enterprise-modeler-sidebar-collapsed`)&&document.body.classList.remove(`enterprise-modeler-sidebar-collapsed`);let n=e.dataset.sidebarSection;t.querySelectorAll(`.enterprise-modeler-sidebar-section`).forEach(e=>{e.classList.toggle(`enterprise-modeler-sidebar-section-open`,e.dataset.sectionId===n&&!e.classList.contains(`enterprise-modeler-sidebar-section-open`))})})}),t.querySelectorAll(`[data-target-button]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.targetButton;if(!t)return;let n=document.getElementById(t);if(!n){window.alert(`${e.textContent?.trim()||`This action`} is not available yet.`);return}n.click()})})}function f(e){return`
    <section class="enterprise-modeler-sidebar-section" data-section-id="${D(e.id)}">
      <button class="enterprise-modeler-sidebar-section-button" type="button" data-sidebar-section="${D(e.id)}">
        <span class="enterprise-modeler-sidebar-icon" aria-hidden="true">${D(e.icon)}</span>
        <span class="enterprise-modeler-sidebar-label">${D(e.label)}</span>
        <span class="enterprise-modeler-sidebar-chevron" aria-hidden="true">›</span>
      </button>
      <div class="enterprise-modeler-sidebar-submenu">
        ${e.actions.map(e=>`
          <button class="enterprise-modeler-sidebar-submenu-button" type="button" data-target-button="${D(e.targetButtonId)}">
            ${D(e.label)}
          </button>
        `).join(``)}
      </div>
    </section>
  `}function p(e){let t=document.querySelector(`.document-information`);t&&(e.classList.add(`enterprise-modeler-header-status`),t.appendChild(e))}function m(e){let t=document.querySelector(`#process-level`),n=document.querySelector(`#document-name`);if(!t||!n)return;let r=r=>{t.hidden=!r,n.hidden=!r,e.hidden=!r};document.addEventListener(`enterprise-modeler:workspace-page-changed`,e=>{let t=e.detail?.page??`process`;r(t===`process`)}),r(!0)}function h(e){let t=document.createElement(`div`);t.className=`enterprise-modeler-zoom-controls`,t.setAttribute(`aria-label`,`Diagram zoom controls`),t.innerHTML=`
    <button type="button" class="enterprise-modeler-zoom-button" data-zoom-target="fit-button" title="Fit diagram" aria-label="Fit diagram">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
    <button type="button" class="enterprise-modeler-zoom-button enterprise-modeler-zoom-symbol" data-zoom-target="zoom-in-button" title="Zoom in" aria-label="Zoom in">+</button>
    <button type="button" class="enterprise-modeler-zoom-button enterprise-modeler-zoom-symbol" data-zoom-target="zoom-out-button" title="Zoom out" aria-label="Zoom out">−</button>
  `,t.querySelectorAll(`[data-zoom-target]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.zoomTarget;t&&document.getElementById(t)?.click()})}),e.appendChild(t)}function g(e){let t=!1;function n(){t=!1;let n=e.querySelector(`.djs-palette`);if(!n)return;n.classList.add(`enterprise-modeler-palette`);let r=new Set([`create.data-object`,`create.data-store`,`create.participant-expanded`,`create.group`]);if(n.querySelectorAll(`.entry[data-action]`).forEach(e=>{let t=e.dataset.action??``;e.classList.toggle(`enterprise-modeler-palette-secondary`,r.has(t))}),!n.querySelector(`[data-action="enterprise-modeler-more-elements"]`)){let e=document.createElement(`div`);e.className=`entry enterprise-modeler-palette-more`,e.dataset.action=`enterprise-modeler-more-elements`,e.title=`Show more element types`,e.setAttribute(`role`,`button`),e.setAttribute(`tabindex`,`0`),e.setAttribute(`aria-label`,`Show more element types`),e.textContent=`•••`;let t=()=>{let t=n.classList.toggle(`enterprise-modeler-palette-expanded`);e.title=t?`Hide additional element types`:`Show more element types`,e.setAttribute(`aria-label`,e.title)};e.addEventListener(`click`,t),e.addEventListener(`keydown`,e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())}),n.appendChild(e)}}function r(){t||(t=!0,window.requestAnimationFrame(n))}new MutationObserver(r).observe(e,{subtree:!0,childList:!0}),r()}function _(e,t){let n=document.createElement(`div`);n.className=`enterprise-modeler-process-loader`,n.hidden=!0,n.innerHTML=`
    <div class="enterprise-modeler-process-loader-card">
      <div class="enterprise-modeler-process-spinner" aria-hidden="true"></div>
      <div>
        <div class="enterprise-modeler-process-loader-title">Loading process</div>
        <div class="enterprise-modeler-process-loader-subtitle">Preparing the selected process layer…</div>
      </div>
    </div>
  `,e.appendChild(n);let r=0,i,a=``,o=()=>{let e=t.textContent?.trim()??``;if(e!==a){if(a=e,/^Loading\b/i.test(e)){i!==void 0&&(window.clearTimeout(i),i=void 0),r=performance.now(),n.hidden=!1;return}if(!n.hidden){let e=performance.now()-r,t=Math.max(0,220-e);i=window.setTimeout(()=>{n.hidden=!0,i=void 0},t)}/^(Process loaded|Restored\b)/i.test(e)&&window.setTimeout(()=>v(),50)}};new MutationObserver(o).observe(t,{subtree:!0,childList:!0,characterData:!0}),o()}function v(){document.getElementById(`zoom-out-button`)?.click()}function y(e){let t=document.createElement(`div`);t.className=`enterprise-modeler-metadata-tooltip`,t.hidden=!0,document.body.appendChild(t);let n=``,r,i=0,a=0;e.addEventListener(`pointermove`,e=>{i=e.clientX,a=e.clientY;let s=e.target instanceof Element?e.target.closest(`.djs-element.djs-shape[data-element-id]`):null,c=s?.dataset.elementId?.trim()??``;if(!c){o();return}if(c===n){E(t,i,a);return}n=c,t.hidden=!0,r!==void 0&&window.clearTimeout(r);let l=s?.querySelector(`.djs-label`)?.textContent?.replace(/\s+/g,` `).trim()||c;r=window.setTimeout(()=>{b(t,c,l,i,a,()=>n)},320)}),e.addEventListener(`pointerleave`,o);function o(){n=``,t.hidden=!0,r!==void 0&&(window.clearTimeout(r),r=void 0)}}async function b(e,n,r,a,o,s){let c=x();if(!c)return;let[l,u]=await Promise.all([S(c),t(!0).catch(()=>null)]);if(s()!==n)return;let d=l.nodes?.[n],f=d?.ownerPersonId&&u?u.people.find(e=>e.id===d.ownerPersonId)?.name??d.ownerPersonId:``,p=C(d,u),m=(d?.links??[]).filter(e=>!!e.targetProcessId).map(e=>{let t=i[e.targetProcessId??``];return`${w(e.type)} → ${t?`${t.level} ${t.name}`:e.targetProcessId??`Unknown process`}${e.label?` · ${e.label}`:``}`});e.innerHTML=`
    <div class="enterprise-modeler-metadata-tooltip-title">${D(r)}</div>
    <div class="enterprise-modeler-metadata-tooltip-grid">
      ${d?.status?T(`Status`,d.status):``}
      ${f?T(`Owner`,f):``}
      ${p?T(`Responsible`,p):``}
    </div>
    ${m.length>0?`
      <div class="enterprise-modeler-metadata-tooltip-links-title">Linked processes</div>
      <div class="enterprise-modeler-metadata-tooltip-links">
        ${m.slice(0,3).map(e=>`<div>${D(e)}</div>`).join(``)}
        ${m.length>3?`<div>+ ${m.length-3} more</div>`:``}
      </div>
    `:``}
    ${!d?.status&&!f&&!p&&m.length===0?`<div class="enterprise-modeler-metadata-tooltip-empty">No key metadata recorded.</div>`:``}
  `,e.hidden=!1,E(e,a,o)}function x(){let e=document.querySelector(`#document-name`)?.textContent?.trim()??``,t=document.querySelector(`#process-level`)?.textContent?.trim()??``;return Object.values(i).find(n=>n.name===e&&n.level===t)??null}async function S(e){let t=localStorage.getItem(`${r}${e.id}`);if(t)try{return JSON.parse(t)}catch(e){console.warn(`Unable to parse local process metadata for hover card.`,e)}try{let t=await fetch(e.metadataUrl,{cache:`no-store`});if(t.ok)return await t.json()}catch(e){console.warn(`Unable to load repository process metadata for hover card.`,e)}return{nodes:{}}}function C(t,r){return!t?.responsibleId||!r?``:t.responsibleType===`role`?n(r,t.responsibleId):t.responsibleType===`team`?e(r,t.responsibleId):t.responsibleId}function w(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;case`related`:return`Related`;default:return`Linked`}}function T(e,t){return`
    <span class="enterprise-modeler-metadata-tooltip-key">${D(e)}</span>
    <span>${D(t)}</span>
  `}function E(e,t,n){let r=e.getBoundingClientRect(),i=t+14,a=n+14;i+r.width+12>window.innerWidth&&(i=t-r.width-14),a+r.height+12>window.innerHeight&&(a=n-r.height-14),e.style.left=`${Math.max(12,i)}px`,e.style.top=`${Math.max(12,a)}px`}function D(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}