import{a as e,f as t,i as n,l as r,o as i,u as a}from"./organisation-CjLVZz1v.js";function o(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function s(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var c=class{organisationButton;chartButton;dialog;root;data=null;viewMode=`hierarchy`;colourByDepartment=!1;showVacancies=!1;constructor(e){this.organisationButton=e,this.chartButton=document.createElement(`button`),this.chartButton.id=`org-chart-button`,this.chartButton.className=`toolbar-button`,this.chartButton.type=`button`,this.chartButton.textContent=`Org Chart`,this.organisationButton.insertAdjacentElement(`afterend`,this.chartButton),this.dialog=document.createElement(`dialog`),this.dialog.className=`org-chart-dialog`,this.dialog.innerHTML=`<div id="org-chart-view-root"></div>`,document.body.appendChild(this.dialog);let t=this.dialog.querySelector(`#org-chart-view-root`);if(!t)throw Error(`Unable to initialise org chart root.`);this.root=t,this.chartButton.addEventListener(`click`,()=>void this.open())}async open(){this.data=await t(!0),this.render(),this.dialog.open||this.dialog.showModal()}render(){let e=this.data;if(!e)return;let t=e.positions.some(e=>e.active);this.root.innerHTML=`
      <div class="org-chart-view">
        <header class="org-chart-header">
          <div>
            <div class="org-chart-title">Organisation Chart</div>
            <div class="org-chart-subtitle">
              ${t?`Establishment hierarchy: Role → Position → Person`:`Legacy people hierarchy — add Positions to activate establishment-based views`}
            </div>
          </div>

          <div class="org-chart-header-actions">
            <button id="org-chart-refresh" class="toolbar-button" type="button">Refresh</button>
            <button id="org-chart-close" class="metadata-close-button" type="button" title="Close org chart">×</button>
          </div>
        </header>

        <div class="org-chart-controls">
          <div class="org-chart-view-toggle" role="group" aria-label="Org chart view">
            <button
              class="org-chart-control-button${this.viewMode===`hierarchy`?` org-chart-control-button-active`:``}"
              type="button"
              data-org-chart-mode="hierarchy"
            >
              Hierarchy View
            </button>
            <button
              class="org-chart-control-button${this.viewMode===`department`?` org-chart-control-button-active`:``}"
              type="button"
              data-org-chart-mode="department"
            >
              Department View
            </button>
          </div>


          <label class="org-chart-option">
            <input id="org-chart-colour-departments" type="checkbox"${this.colourByDepartment?` checked`:``} />
            <span>Colour cards by department</span>
          </label>

          <label class="org-chart-option">
            <input id="org-chart-show-vacancies" type="checkbox"${this.showVacancies?` checked`:``} />
            <span>${t?`Show vacant positions`:`Show vacant roles`}</span>
          </label>

          ${this.showVacancies?`<span class="org-chart-control-note">${t?`Vacant = active Position with no active Person assigned.`:`Legacy mode: vacant = Role with no active Person assigned.`}</span>`:``}
        </div>

        <div class="org-chart-help">
          ${this.renderHelp(t)}
          Click an occupied card to edit the Person; click a vacancy to edit the Position/Role.
        </div>

        <div class="org-chart-scroll">
          ${t?this.viewMode===`hierarchy`?this.renderPositionHierarchyView(e):this.renderPositionDepartmentView(e):this.viewMode===`hierarchy`?this.renderLegacyHierarchyView(e):this.renderLegacyDepartmentView(e)}
        </div>
      </div>
    `,this.bindEvents()}renderHelp(e){return e?this.viewMode===`hierarchy`?`Whole-organisation reporting lines are derived from Position → Reports to Position.`:`Whole-organisation Positions are grouped by Department.`:this.viewMode===`hierarchy`?`Legacy reporting lines are derived from each person's Manager field.`:`Legacy people and unfilled roles are grouped by Department.`}bindEvents(){this.root.querySelector(`#org-chart-close`)?.addEventListener(`click`,()=>this.dialog.close()),this.root.querySelector(`#org-chart-refresh`)?.addEventListener(`click`,()=>void this.refresh()),this.root.querySelectorAll(`[data-org-chart-mode]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.orgChartMode;t!==`hierarchy`&&t!==`department`||(this.viewMode=t,this.render())})}),this.root.querySelector(`#org-chart-colour-departments`)?.addEventListener(`change`,e=>{this.colourByDepartment=e.currentTarget.checked,this.render()}),this.root.querySelector(`#org-chart-show-vacancies`)?.addEventListener(`change`,e=>{this.showVacancies=e.currentTarget.checked,this.render()}),this.root.querySelectorAll(`[data-org-person], [data-org-role], [data-org-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.dialog.close(),this.organisationButton.click()})})}async refresh(){this.data=await t(!0),this.render()}getActivePositions(e){return e.positions.filter(e=>e.active)}renderPositionHierarchyView(e){let t=this.getActivePositions(e),n=this.buildPositionRoots(t);if(n.length===0)return`<div class="org-chart-empty">No active positions are available.</div>`;let r=new Set(t.map(e=>e.id)),i=n.map(e=>this.renderPositionNode(e,r,new Set)).filter(Boolean).join(``);return i?`<div class="org-chart-roots">${i}</div>`:`<div class="org-chart-empty">No occupied positions are available. Enable Show vacant positions to display the establishment.</div>`}renderPositionDepartmentView(e){let t=this.getActivePositions(e),n=new Set(e.departments.map(e=>e.id)),i=[];s(e.departments).forEach(n=>{let a=s(t.filter(e=>e.departmentId===n.id)).filter(t=>this.showVacancies||r(e,t.id).length>0);a.length!==0&&i.push(this.renderPositionDepartmentSection(n.id,n.name,a))});let a=s(t.filter(e=>!e.departmentId||!n.has(e.departmentId))).filter(t=>this.showVacancies||r(e,t.id).length>0);a.length>0&&i.push(this.renderPositionDepartmentSection(``,`Unassigned Department`,a));let o=s(e.people.filter(e=>e.active&&!e.positionId));return o.length>0&&i.push(`
        <section class="org-chart-department-section">
          <header class="org-chart-department-header org-chart-department-colour-unassigned">
            <div>
              <div class="org-chart-department-name">Unpositioned people</div>
              <div class="org-chart-department-summary">${o.length} active person${o.length===1?``:`s`} still using legacy organisation fields</div>
            </div>
          </header>
          <div class="org-chart-department-grid">
            ${o.map(e=>this.renderLegacyDepartmentPersonCard(e)).join(``)}
          </div>
        </section>
      `),i.length>0?`<div class="org-chart-department-view">${i.join(``)}</div>`:`<div class="org-chart-empty">No occupied positions are available. Enable Show vacant positions to display vacant establishment slots.</div>`}renderPositionDepartmentSection(e,t,n){let i=this.data;if(!i)return``;let a=n.filter(e=>r(i,e.id).length===0).length,s=this.getDepartmentColourClass(e);return`
      <section class="org-chart-department-section">
        <header class="org-chart-department-header${this.colourByDepartment?` ${s}`:``}">
          <div>
            <div class="org-chart-department-name">${o(t)}</div>
            <div class="org-chart-department-summary">
              ${n.length} position${n.length===1?``:`s`}${this.showVacancies?` · ${a} vacant`:``}
            </div>
          </div>
        </header>

        <div class="org-chart-department-grid">
          ${n.map(e=>this.renderPositionCard(e,!1)).join(``)}
        </div>
      </section>
    `}buildPositionRoots(e){let t=new Map(e.map(e=>[e.id,e])),n=new Map,r=[];e.forEach(e=>{let i=e.managerPositionId;if(i&&i!==e.id&&t.has(i)){let t=n.get(i)??[];t.push(e),n.set(i,t)}else r.push(e)});let i=(e,t)=>{if(t.has(e.id))return{position:e,children:[]};let r=new Set(t);return r.add(e.id),{position:e,children:s(n.get(e.id)??[]).map(e=>i(e,r))}};return r.length===0&&e.length>0?s(e).map(e=>i(e,new Set)):s(r).map(e=>i(e,new Set))}renderPositionNode(e,t,n){if(n.has(e.position.id))return`
        <div class="org-chart-node">
          <div class="org-chart-cycle">Circular position reference: ${o(e.position.name)}</div>
        </div>
      `;let i=this.data;if(!i)return``;let a=r(i,e.position.id).length===0,s=new Set(n);s.add(e.position.id);let c=e.children.map(e=>this.renderPositionNode(e,t,s)).filter(Boolean).join(``);return a&&!this.showVacancies?c:`
      <div class="org-chart-node">
        ${this.renderPositionCard(e.position,!0,t)}
        ${c?`<div class="org-chart-children">${c}</div>`:``}
      </div>
    `}renderPositionCard(e,t,i){let s=this.data;if(!s)return``;let c=r(s,e.id),l=c[0],u=c.length===0,d=a(s,e.roleId),f=n(s,e.departmentId),p=this.getDepartmentColourClass(e.departmentId),m=s.positions.filter(t=>t.active&&t.managerPositionId===e.id&&(!i||i.has(t.id))).length;return`
      <button
        class="org-chart-card${u?` org-chart-vacancy-card`:``}${this.colourByDepartment?` ${p}`:``}"
        type="button"
        ${l?`data-org-person="${o(l.id)}"`:`data-org-position="${o(e.id)}"`}
      >
        ${u?`<div class="org-chart-vacancy-label">VACANT POSITION</div>`:``}
        <div class="org-chart-person-name">${o(l?.name??e.name)}</div>
        ${l?`<div class="org-chart-person-meta">${o(e.name)}</div>`:``}
        <div class="org-chart-person-meta">${o([d,f].filter(Boolean).join(` · `)||`No role / department`)}</div>
        ${l?.email?`<div class="org-chart-person-meta">${o(l.email)}</div>`:``}
        ${c.length>1?`<div class="org-chart-warning">${c.length} active occupants assigned — review Position data</div>`:``}
        ${t?`<div class="org-chart-card-footer">${m} reporting position${m===1?``:`s`} in scope</div>`:``}
      </button>
    `}renderLegacyHierarchyView(e){let t=this.buildLegacyRoots(e),n=this.showVacancies?this.getLegacyVacantRoles(e):[];return t.length===0&&n.length===0?`<div class="org-chart-empty">No active people or vacant roles are available to display.</div>`:`
      ${t.length>0?`<div class="org-chart-roots">${t.map(e=>this.renderLegacyNode(e,new Set)).join(``)}</div>`:`<div class="org-chart-empty">No active people are available to display.</div>`}

      ${n.length>0?`
          <section class="org-chart-vacancy-section">
            <div class="org-chart-section-title">Legacy vacant roles</div>
            <div class="org-chart-vacancy-grid">
              ${n.map(e=>this.renderLegacyVacantRoleCard(e)).join(``)}
            </div>
          </section>
        `:``}
    `}renderLegacyDepartmentView(t){let n=t.people.filter(e=>e.active),r=this.showVacancies?this.getLegacyVacantRoles(t):[],i=new Set(t.departments.map(e=>e.id)),a=[];s(t.departments).forEach(i=>{let o=s(n.filter(n=>e(t,n)===i.id)),c=r.filter(e=>e.departmentId===i.id);o.length===0&&c.length===0||a.push(this.renderLegacyDepartmentSection(i.id,i.name,o,c))});let o=s(n.filter(n=>{let r=e(t,n);return!r||!i.has(r)})),c=r.filter(e=>!e.departmentId||!i.has(e.departmentId));return(o.length>0||c.length>0)&&a.push(this.renderLegacyDepartmentSection(``,`Unassigned`,o,c)),a.length===0?`<div class="org-chart-empty">No active people or vacant roles are available to display by department.</div>`:`<div class="org-chart-department-view">${a.join(``)}</div>`}renderLegacyDepartmentSection(e,t,n,r){let i=this.getDepartmentColourClass(e);return`
      <section class="org-chart-department-section">
        <header class="org-chart-department-header${this.colourByDepartment?` ${i}`:``}">
          <div>
            <div class="org-chart-department-name">${o(t)}</div>
            <div class="org-chart-department-summary">
              ${n.length} active person${n.length===1?``:`s`}${this.showVacancies?` · ${r.length} vacant role${r.length===1?``:`s`}`:``}
            </div>
          </div>
        </header>

        <div class="org-chart-department-grid">
          ${n.map(e=>this.renderLegacyDepartmentPersonCard(e)).join(``)}
          ${r.map(e=>this.renderLegacyVacantRoleCard(e)).join(``)}
        </div>
      </section>
    `}renderLegacyDepartmentPersonCard(t){let r=this.data;if(!r)return``;let s=a(r,i(r,t)),c=e(r,t),l=n(r,c),u=t.managerPersonId?r.people.find(e=>e.id===t.managerPersonId)?.name??``:``,d=this.getDepartmentColourClass(c);return`
      <button
        class="org-chart-card org-chart-department-person-card${this.colourByDepartment?` ${d}`:``}"
        type="button"
        data-org-person="${o(t.id)}"
      >
        <div class="org-chart-person-name">${o(t.name)}</div>
        <div class="org-chart-person-meta">${o(s||`No role assigned`)}</div>
        ${l?`<div class="org-chart-person-meta">${o(l)}</div>`:``}
        ${u?`<div class="org-chart-person-meta">Reports to: ${o(u)}</div>`:``}
        ${t.email?`<div class="org-chart-person-meta">${o(t.email)}</div>`:``}
      </button>
    `}buildLegacyRoots(e){let t=e.people.filter(e=>e.active),n=new Map(t.map(e=>[e.id,e])),r=new Map,i=[];t.forEach(e=>{let t=e.managerPersonId;if(t&&t!==e.id&&n.has(t)){let n=r.get(t)??[];n.push(e),r.set(t,n)}else i.push(e)});let a=(e,t)=>{if(t.has(e.id))return{person:e,children:[]};let n=new Set(t);return n.add(e.id),{person:e,children:s(r.get(e.id)??[]).map(e=>a(e,n))}};return i.length===0&&t.length>0?s(t).map(e=>a(e,new Set)):s(i).map(e=>a(e,new Set))}getLegacyVacantRoles(e){let t=new Set(e.people.filter(t=>t.active&&i(e,t)).map(t=>i(e,t)));return s(e.roles.filter(e=>!t.has(e.id)))}renderLegacyNode(t,r){let s=this.data;if(!s)return``;if(r.has(t.person.id))return`
        <div class="org-chart-node">
          <div class="org-chart-cycle">Circular manager reference: ${o(t.person.name)}</div>
        </div>
      `;let c=new Set(r);c.add(t.person.id);let l=a(s,i(s,t.person)),u=e(s,t.person),d=n(s,u),f=t.children.length,p=this.getDepartmentColourClass(u);return`
      <div class="org-chart-node">
        <button
          class="org-chart-card${this.colourByDepartment?` ${p}`:``}"
          type="button"
          data-org-person="${o(t.person.id)}"
        >
          <div class="org-chart-person-name">${o(t.person.name)}</div>
          <div class="org-chart-person-meta">${o([l,d].filter(Boolean).join(` · `)||`No role / department`)}</div>
          ${t.person.email?`<div class="org-chart-person-meta">${o(t.person.email)}</div>`:``}
          <div class="org-chart-card-footer">${f} direct report${f===1?``:`s`}</div>
        </button>

        ${t.children.length>0?`<div class="org-chart-children">${t.children.map(e=>this.renderLegacyNode(e,c)).join(``)}</div>`:``}
      </div>
    `}renderLegacyVacantRoleCard(e){let t=this.data;if(!t)return``;let r=n(t,e.departmentId),i=this.getDepartmentColourClass(e.departmentId);return`
      <button
        class="org-chart-card org-chart-vacancy-card${this.colourByDepartment?` ${i}`:``}"
        type="button"
        data-org-role="${o(e.id)}"
      >
        <div class="org-chart-vacancy-label">LEGACY VACANT ROLE</div>
        <div class="org-chart-person-name">${o(e.name)}</div>
        <div class="org-chart-person-meta">${o(r||`No department`)}</div>
      </button>
    `}getDepartmentColourClass(e){let t=this.data;if(!t||!e)return`org-chart-department-colour-unassigned`;let n=s(t.departments).findIndex(t=>t.id===e);return n<0?`org-chart-department-colour-unassigned`:`org-chart-department-colour-${n%8}`}};function l(){let e=document.querySelector(`#organisation-button`);if(!e){console.warn(`Organisation button was not found; org chart view was not initialised.`);return}new c(e)}l();