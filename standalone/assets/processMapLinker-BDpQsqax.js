import{n as e,r as t}from"./processCatalog-C9JSMFlk.js";document.querySelector(`#canvas`)?n():console.warn(`Process-map linker could not initialise because the modeler canvas was not found.`);function n(){let n=document.createElement(`dialog`);n.id=`process-map-link-dialog`,n.className=`process-map-link-dialog`,document.body.appendChild(n);let i=null,a=null,o=null;function s(){let t=document.querySelector(`#document-name`)?.textContent?.trim()??``,n=document.querySelector(`#process-level`)?.textContent?.trim()??``,r=Object.values(e).find(e=>e.active&&e.name===t&&e.level===n);if(r)return r;let i=Object.values(e).filter(e=>e.active&&e.name===t);return i.length===1?i[0]:null}function c(){return[...t].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code))}function l(e){let n=c();if(n.length===0)return``;if(!e)return n[0].id;let r=t.find(t=>t.id===e.layerId);return r?n.find(e=>e.sequence>r.sequence)?.id??r.id:n[0].id}function u(t){let r=n.querySelector(`#process-map-link-process`);if(!r)return;r.replaceChildren(),r.add(new Option(`Select existing process`,``));let i=s(),a=Object.values(e).filter(e=>e.active&&e.layerId===t&&e.id!==i?.id).sort((e,t)=>e.name.localeCompare(t.name));if(a.forEach(e=>{r.add(new Option(`${e.level} — ${e.name}`,e.id))}),a.length===0){let e=new Option(`No active processes in this layer`,``);e.disabled=!0,r.add(e)}}function d(e,t){o=e;let i=s(),a=c(),d=t&&a.some(e=>e.id===t)?t:l(i),p=a.map(e=>`
      <option value="${r(e.id)}"${e.id===d?` selected`:``}>
        ${r(e.code)} — ${r(e.name)}
      </option>
    `).join(``);n.innerHTML=`
      <div class="process-map-link-shell">
        <header class="process-map-link-header">
          <div>
            <div class="process-map-link-title">Link to Process</div>
            <div class="process-map-link-subtitle">
              ${r(e.name)} · ${r(e.id)}
            </div>
          </div>
          <button id="process-map-link-close" class="metadata-close-button" type="button" title="Close">×</button>
        </header>

        <div class="process-map-link-body">
          <div class="process-map-link-context">
            <span>Current process</span>
            <strong>${r(i?`${i.level} — ${i.name}`:`Custom / unresolved process`)}</strong>
          </div>

          <label class="metadata-field">
            <span>Relationship</span>
            <select id="process-map-link-type">
              <option value="drill-down">Drill down</option>
              <option value="related">Related</option>
              <option value="exception">Exception</option>
              <option value="supporting">Supporting</option>
            </select>
          </label>

          <div class="process-map-link-layer-row">
            <label class="metadata-field process-map-link-layer-field">
              <span>Target layer</span>
              <select id="process-map-link-layer"${a.length===0?` disabled`:``}>
                ${a.length>0?p:`<option value="">No active layers</option>`}
              </select>
            </label>

            <button id="process-map-new-layer" class="toolbar-button" type="button">
              + New Layer
            </button>
          </div>

          <label class="metadata-field">
            <span>Existing process</span>
            <select id="process-map-link-process"${d?``:` disabled`}>
              <option value="">Select existing process</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Link label</span>
            <input id="process-map-link-label" type="text" placeholder="Optional display label" />
          </label>

          <div class="process-map-link-actions">
            <button id="process-map-link-existing" class="toolbar-button toolbar-button-primary" type="button">
              Link Existing Process
            </button>
            <button id="process-map-create-process" class="toolbar-button" type="button"${d?``:` disabled`}>
              Create New Process
            </button>
            <button id="process-map-link-cancel" class="toolbar-button" type="button">Cancel</button>
          </div>

          <div class="metadata-help">
            Select a target layer to filter the process list. Create New Process opens the normal Process Manager with the layer and current process preselected; when saved, the new process is linked back to this node automatically.
          </div>
        </div>
      </div>
    `,d&&u(d),f(e),n.open||n.showModal()}function f(r){n.querySelector(`#process-map-link-close`)?.addEventListener(`click`,()=>n.close()),n.querySelector(`#process-map-link-cancel`)?.addEventListener(`click`,()=>n.close()),n.querySelector(`#process-map-link-layer`)?.addEventListener(`change`,e=>{let t=e.currentTarget.value;u(t);let r=n.querySelector(`#process-map-create-process`);r&&(r.disabled=!t)}),n.querySelector(`#process-map-link-existing`)?.addEventListener(`click`,()=>{let e=n.querySelector(`#process-map-link-process`)?.value??``,t=p(),i=n.querySelector(`#process-map-link-label`)?.value.trim()??``;if(!e){window.alert(`Select an existing process to link.`);return}m(r.id,e,t,i)&&n.close()}),n.querySelector(`#process-map-create-process`)?.addEventListener(`click`,()=>{let t=n.querySelector(`#process-map-link-layer`)?.value??``;if(!t){window.alert(`Select a target layer before creating a process.`);return}let a=s();i={knownProcessIds:new Set(Object.keys(e)),layerId:t,relationshipType:p(),sourceElementId:r.id},n.close(),h(t,a?.id,r.name)}),n.querySelector(`#process-map-new-layer`)?.addEventListener(`click`,()=>{a={knownLayerIds:new Set(t.map(e=>e.id))},n.close(),g()})}function p(){let e=n.querySelector(`#process-map-link-type`)?.value;return e===`related`||e===`exception`||e===`supporting`?e:`drill-down`}function m(e,t,n,r){if((document.querySelector(`#metadata-node-id`)?.value.trim()??``)!==e)return window.alert(`The original BPMN node is no longer selected. Select it again and retry the link.`),!1;let i=document.querySelector(`#metadata-link-type`),a=document.querySelector(`#metadata-link-target`),o=document.querySelector(`#metadata-link-label`),s=document.querySelector(`#metadata-link-add`);return!i||!a||!o||!s?(window.alert(`The node metadata link controls are not available.`),!1):Array.from(a.options).some(e=>e.value===t)?(i.value=n,a.value=t,o.value=r,s.click(),!0):(window.alert(`The target process is not available in the current process repository.`),!1)}async function h(e,t,n){let r=document.querySelector(`#process-manager-button`);if(!r){window.alert(`Process Manager is not available.`),i=null;return}r.click();let a=await b(`#process-manager-new-process`);if(!a){window.alert(`Unable to open the new process form.`),i=null;return}a.click();let o=await b(`#process-manager-process-layer`),s=await b(`#process-manager-process-parent`),c=await b(`#process-manager-process-name`);o&&Array.from(o.options).some(t=>t.value===e)&&(o.value=e),s&&t&&Array.from(s.options).some(e=>e.value===t)&&(s.value=t),c&&!c.value&&n?(c.value=n,c.focus(),c.select()):c?.focus()}async function g(){let e=document.querySelector(`#process-manager-button`);if(!e){window.alert(`Process Manager is not available.`),a=null;return}e.click();let t=await b(`[data-process-manager-tab="layers"]`);if(!t){window.alert(`Unable to open Process Manager layers.`),a=null;return}t.click();let n=await b(`#process-manager-new-layer`);if(!n){window.alert(`Unable to open the new layer form.`),a=null;return}n.click(),(await b(`#process-manager-layer-code`))?.focus()}function _(){if(a){let e=t.find(e=>!a?.knownLayerIds.has(e.id));if(e){a=null,y(),o&&window.setTimeout(()=>d(o,e.id),0);return}}if(i){let t=i,n=Object.values(e).find(e=>!t.knownProcessIds.has(e.id)&&e.layerId===t.layerId);n&&(i=null,y(),window.setTimeout(()=>{m(t.sourceElementId,n.id,t.relationshipType,``)},0))}}function v(e){let t=e.detail,n=t?.elementId?.trim()??``;if(!n){window.alert(`Unable to determine which BPMN node should be linked.`);return}d({id:n,name:t?.elementName?.trim()||n})}function y(){let e=document.querySelector(`.process-manager-dialog`);e?.open&&e.close()}async function b(e,t=2500){let n=performance.now();for(;performance.now()-n<t;){let t=document.querySelector(e);if(t)return t;await new Promise(e=>window.setTimeout(e,25))}return null}n.addEventListener(`click`,e=>{e.target===n&&n.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,_),document.addEventListener(`enterprise-modeler:link-process-from-context-pad`,v)}function r(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}