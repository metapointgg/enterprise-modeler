import{C as e,E as t,T as n,a as r,c as i,g as a,h as o,i as s,l as c,m as l,n as u,p as d,r as f,t as p,w as m}from"./modelWorkspace-CUbotQ8L.js";import{t as h}from"./enterpriseModelSeed-DQBrThq1.js";async function g(e){let t=null;try{let e=await n();if(e){await p(e);return}}catch(e){console.error(`Unable to complete Azure DevOps authentication.`,e),t=e}if(e.remoteRepositoryEnabled){s();return}await l()||await _(t)}async function _(n=null){let s=await m(),l=i(),g={organization:l?.organization||s.defaultOrganization,project:l?.project||s.defaultProject,repository:l?.repository||s.defaultRepository,branch:l?.branch||s.defaultBranch||`main`,modelPath:l?.modelPath||s.defaultModelPath};return new Promise(i=>{let l=document.createElement(`div`);l.id=`enterprise-model-workspace-chooser`,l.style.cssText=[`position:fixed`,`inset:0`,`z-index:2147483000`,`display:grid`,`place-items:center`,`padding:28px`,`background:#f8fafc`,`font-family:Inter,Arial,sans-serif`,`color:#0f172a`].join(`;`);let m=c(),_=a();l.innerHTML=`
      <section style="width:min(680px,100%);border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 18px 55px rgba(15,23,42,.12);overflow:hidden">
        <div style="padding:26px 28px 18px;border-bottom:1px solid #e2e8f0">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">Enterprise Modeler</div>
          <h1 style="margin:7px 0 8px;font-size:24px">Choose an Enterprise Model</h1>
          <p style="margin:0;color:#475569;line-height:1.55">Enterprise Modeler keeps application code separate from model data. Open an existing model folder or create a new model in a folder you choose.</p>
        </div>
        <div style="display:grid;gap:14px;padding:22px 28px 28px">
          ${m&&_?`
            <button id="workspace-reopen" type="button" style="${v()}">
              Reopen ${S(m)}
            </button>
          `:``}
          <button id="workspace-open" type="button" style="${y()}">
            Open existing Enterprise Model
          </button>
          ${s.enabled?`
            <div style="height:1px;background:#e2e8f0;margin:4px 0"></div>
            <div style="font-size:13px;font-weight:700;color:#0f172a">Azure DevOps repository</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
                Organisation
                <input id="workspace-ado-organisation" value="${S(g.organization)}" placeholder="contoso" style="${x()}" />
              </label>
              <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
                Project
                <input id="workspace-ado-project" value="${S(g.project)}" placeholder="Enterprise Architecture" style="${x()}" />
              </label>
              <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
                Repository
                <input id="workspace-ado-repository" value="${S(g.repository)}" placeholder="client-enterprise-model" style="${x()}" />
              </label>
              <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
                Branch
                <input id="workspace-ado-branch" value="${S(g.branch)}" placeholder="main" style="${x()}" />
              </label>
            </div>
            <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
              Model path in repository
              <input id="workspace-ado-model-path" value="${S(g.modelPath)}" placeholder="Leave blank when the model is at repository root" style="${x()}" />
            </label>
            <button id="workspace-ado-connect" type="button" style="${v()}">
              ${t()?`Open Azure DevOps Enterprise Model`:`Sign in and open Azure DevOps Enterprise Model`}
            </button>
            <p style="margin:0;color:#64748b;font-size:11px;line-height:1.45">Uses Microsoft Entra delegated access. Enterprise Model changes are committed to the selected branch; no PAT is stored in the browser.</p>
          `:``}
          <div style="height:1px;background:#e2e8f0;margin:4px 0"></div>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            New model name
            <input id="workspace-model-name" value="Enterprise Model" style="${x()}" />
          </label>
          <label style="display:grid;gap:6px;font-size:12px;font-weight:600;color:#334155">
            Organisation name
            <input id="workspace-organisation-name" value="" placeholder="Organisation name" style="${x()}" />
          </label>
          <button id="workspace-create" type="button" style="${_?v():b()}" ${_?``:`disabled`}>
            Create new Enterprise Model
          </button>
          ${_?`<p style="margin:0;color:#64748b;font-size:11px;line-height:1.45">Choose the folder that will become the model root. The application creates the architecture, process, organisation, data, governance and relationship files inside it.</p>`:`<p style="margin:0;color:#92400e;font-size:11px;line-height:1.45">This browser can open an existing model folder, but cannot create or write directly to arbitrary folders. Use Edge or Chrome to create a new filesystem-backed model. Existing folders opened here are retained as a browser workspace.</p>`}
          <div id="workspace-error" role="alert" style="display:none;padding:10px 12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:12px"></div>
        </div>
      </section>
    `,document.body.appendChild(l);let C=l.querySelector(`#workspace-error`),w=e=>{C&&(C.style.display=`block`,C.textContent=e instanceof Error?e.message:String(e))},T=()=>{l.remove(),i()};n&&w(n),l.querySelector(`#workspace-reopen`)?.addEventListener(`click`,()=>{(async()=>{try{await d()?T():w(`The previous model folder could not be reopened. Choose it again.`)}catch(e){w(e)}})()}),l.querySelector(`#workspace-open`)?.addEventListener(`click`,()=>{(async()=>{try{a()?f(await o()):await u(await r()),T()}catch(e){w(e)}})()}),l.querySelector(`#workspace-ado-connect`)?.addEventListener(`click`,()=>{(async()=>{try{let n={organization:l.querySelector(`#workspace-ado-organisation`)?.value.trim()??``,project:l.querySelector(`#workspace-ado-project`)?.value.trim()??``,repository:l.querySelector(`#workspace-ado-repository`)?.value.trim()??``,branch:l.querySelector(`#workspace-ado-branch`)?.value.trim()||`main`,modelPath:l.querySelector(`#workspace-ado-model-path`)?.value.trim()??``};if(!t()){await e(n);return}await p(n),T()}catch(e){w(e)}})()}),l.querySelector(`#workspace-create`)?.addEventListener(`click`,()=>{(async()=>{try{let e=l.querySelector(`#workspace-model-name`)?.value.trim()||`Enterprise Model`,t=l.querySelector(`#workspace-organisation-name`)?.value.trim()||e;await h(await o(),{name:e,organisationName:t}),T()}catch(e){w(e)}})()})})}function v(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #1d4ed8`,`border-radius:8px`,`background:#2563eb`,`color:#fff`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function y(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #cbd5e1`,`border-radius:8px`,`background:#fff`,`color:#0f172a`,`font:inherit`,`font-weight:700`,`cursor:pointer`].join(`;`)}function b(){return[`width:100%`,`padding:11px 14px`,`border:1px solid #e2e8f0`,`border-radius:8px`,`background:#f1f5f9`,`color:#94a3b8`,`font:inherit`,`font-weight:700`,`cursor:not-allowed`].join(`;`)}function x(){return[`width:100%`,`box-sizing:border-box`,`padding:9px 10px`,`border:1px solid #cbd5e1`,`border-radius:7px`,`font:inherit`,`color:#0f172a`].join(`;`)}function S(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}export{g as initialiseEnterpriseModelWorkspace};