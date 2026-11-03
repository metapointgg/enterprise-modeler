import{i as e,n as t}from"./processCatalog-C9JSMFlk.js";var n=document.querySelector(`#canvas`);n?r(n):console.warn(`Process drill-down picker could not initialise because #canvas was not found.`);function r(n){let r=document.createElement(`dialog`);r.className=`process-drilldown-dialog`,document.body.appendChild(r);let a={nodes:{}},o=``;async function s(){let e=c();if(!(!e||e.id===o)){o=e.id;try{let t=await fetch(e.metadataUrl,{cache:`no-store`});a=t.ok?await t.json():{nodes:{}}}catch{a={nodes:{}}}}}function c(){let e=document.querySelector(`#document-name`)?.textContent?.trim()??``,n=document.querySelector(`#process-level`)?.textContent?.trim()??``;return Object.values(t).find(t=>t.active&&t.name===e&&t.level===n)??null}function l(t){let n=localStorage.getItem(`${e}${t.id}`);if(n)try{return JSON.parse(n)}catch{}return o===t.id?a:{nodes:{}}}function u(e){let n=c();return n?(l(n).nodes?.[e]?.links??[]).filter(e=>e.type===`drill-down`&&!!e.targetProcessId).map(e=>({process:t[e.targetProcessId??``],label:e.label?.trim()??``})).filter(e=>!!e.process?.active):[]}function d(e,t){r.innerHTML=`
      <div class="process-drilldown-shell">
        <header class="process-drilldown-header">
          <div>
            <div class="process-drilldown-title">Select Process</div>
            <div class="process-drilldown-subtitle">${i(e)}</div>
          </div>
          <button class="process-drilldown-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="process-drilldown-options">
          ${t.map(e=>`
            <button class="process-drilldown-option" type="button" data-process-id="${i(e.process.id)}">
              <span class="process-drilldown-level">${i(e.process.level)}</span>
              <span class="process-drilldown-copy">
                <strong>${i(e.process.name)}</strong>
                ${e.label?`<small>${i(e.label)}</small>`:``}
              </span>
              <span class="process-drilldown-arrow">→</span>
            </button>
          `).join(``)}
        </div>
      </div>
    `,r.querySelector(`.process-drilldown-close`)?.addEventListener(`click`,()=>r.close()),r.querySelectorAll(`[data-process-id]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.processId;t&&(r.close(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-process`,{detail:{processId:t}})))})}),r.showModal()}n.addEventListener(`dblclick`,e=>{let t=e.target instanceof Element?e.target.closest(`.djs-element.djs-shape[data-element-id]`):null,n=t?.dataset.elementId?.trim()??``;if(!n)return;let r=u(n);r.length<2||(e.preventDefault(),e.stopImmediatePropagation(),d(t?.querySelector(`.djs-label`)?.textContent?.replace(/\s+/g,` `).trim()||n,r))},!0),r.addEventListener(`click`,e=>{e.target===r&&r.close()});let f=document.querySelector(`#status`);f&&new MutationObserver(()=>{let e=f.textContent?.trim()??``;/^(Process loaded|Restored\b)/i.test(e)&&(o=``,s())}).observe(f,{subtree:!0,childList:!0,characterData:!0}),document.addEventListener(`enterprise-modeler:process-repository-changed`,()=>{o=``,s()}),window.setTimeout(()=>void s(),300)}function i(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}