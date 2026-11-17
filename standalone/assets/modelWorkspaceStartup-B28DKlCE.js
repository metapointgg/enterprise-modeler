import{d as e,f as t,i as n,n as r,o as i,p as a,r as o,t as s,u as c}from"./modelWorkspace-B5QW7P22.js";import{t as l}from"./enterpriseModelSeed-BX8hhp5z.js";async function u(t){if(t.remoteRepositoryEnabled){o();return}await e()||await d()}async function d(){return new Promise(e=>{let o=document.createElement(`div`);o.id=`enterprise-model-workspace-chooser`,o.style.cssText=[`position:fixed`,`inset:0`,`z-index:2147483000`,`display:grid`,`place-items:center`,`padding:28px`,`background:#f8fafc`,`font-family:Inter,Arial,sans-serif`,`color:#0f172a`].join(`;`);let u=i(),d=a();o.innerHTML=`
      <section style="width:min(680px,100%);border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 18px 55px rgba(15,23,42,.12);overflow:hidden">
        <div style="padding:26px 28px 18px;border-bottom:1px solid #e2e8f0">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Enterprise Modeler</div>
          <h1 style="margin:7px 0 8px;font-size:24px">Choose an Enterprise Model</h1>
          <p style="margin:0;color:#475569;line-height:1.55">Enterprise Modeler keeps application code separate from model data. Open an existing model folder or create a new model in a folder you choose.</p>
        </div>
        <div style="display:grid;gap:14px;padding:22px 28px 28px">
          ${u&&d?`
            <button id="workspace-reopen" type="button" style="${f()}">
              Reopen ${g(u)}
            </button>
          `:``}
          <button id="workspace-open" type="button" style="${p()}">
            Open existing Enterprise Model
          </button>
          <div style="height:1px;background:#e2e8f0;margin:4px 0"></div>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            New model name
            <input id="workspace-model-name" value="Enterprise Model" style="${h()}" />
          </label>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            Organisation name
            <input id="workspace-organisation-name" value="" placeholder="Organisation name" style="${h()}" />
          </label>
          <button id="workspace-create" type="button" style="${d?f():m()}" ${d?``:`disabled`}>
            Create new Enterprise Model
          </button>
          ${d?`<p style="margin:0;color:#64748b;font-size:11px;line-height:1.45">Choose the folder that will become the model root. The application creates the architecture, process, organisation, data, governance and relationship files inside it.</p>`:`<p style="margin:0;color:#92400e;font-size:11px;line-height:1.45">This browser can open an existing model folder, but cannot create or write directly to arbitrary folders. Use Edge or Chrome to create a new filesystem-backed model. Existing folders opened here are retained as a browser workspace.</p>`}
          <div id="workspace-error" role="alert" style="display:none;padding:10px 12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:12px"></div>
        </div>
      </section>
    `,document.body.appendChild(o);let _=o.querySelector(`#workspace-error`),v=e=>{_&&(_.style.display=`block`,_.textContent=e instanceof Error?e.message:String(e))},y=()=>{o.remove(),e()};o.querySelector(`#workspace-reopen`)?.addEventListener(`click`,()=>{(async()=>{try{await c()?y():v(`The previous model folder could not be reopened. Choose it again.`)}catch(e){v(e)}})()}),o.querySelector(`#workspace-open`)?.addEventListener(`click`,()=>{(async()=>{try{a()?r(await t()):await s(await n()),y()}catch(e){v(e)}})()}),o.querySelector(`#workspace-create`)?.addEventListener(`click`,()=>{(async()=>{try{let e=o.querySelector(`#workspace-model-name`)?.value.trim()||`Enterprise Model`,n=o.querySelector(`#workspace-organisation-name`)?.value.trim()||e;await l(await t(),{name:e,organisationName:n}),y()}catch(e){v(e)}})()})})}function f(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #1d4ed8`,`border-radius:8px`,`background:#2563eb`,`color:#fff`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function p(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #cbd5e1`,`border-radius:8px`,`background:#fff`,`color:#0f172a`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function m(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #e2e8f0`,`border-radius:8px`,`background:#f1f5f9`,`color:#94a3b8`,`font:inherit`,`font-weight:700`,`cursor:not-allowed`].join(`;`)}function h(){return[`width:100%`,`box-sizing:border-box`,`padding:9px 10px`,`border:1px solid #cbd5e1`,`border-radius:7px`,`font:inherit`,`color:#0f172a`].join(`;`)}function g(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}export{u as initialiseEnterpriseModelWorkspace};