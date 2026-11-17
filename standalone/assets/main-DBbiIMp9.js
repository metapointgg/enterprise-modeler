import{t as e}from"./Modeler-Bi03ARIg.js";import{_ as t,a as n,c as r,f as i,g as a,i as o,l as ee,n as te,p as ne,s,t as re}from"./modelWorkspace-DD0bVxoc.js";import{a as ie,c as ae,f as c,i as l,l as u,m as oe,n as se,o as ce,p as le,r as d,s as ue,t as de,u as f}from"./organisation-BhQG2K4b.js";import{a as p,f as fe,i as pe,n as m,r as me,s as he,t as h,u as g}from"./processCatalog-BmTP23tp.js";/* empty css             */import{t as ge}from"./enterpriseModelSeed-C0-59N-D.js";function _(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function v(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var _e=class{root;options;data;activeTab=`people`;selectedPersonId=null;selectedPositionId=null;selectedDepartmentId=null;selectedRoleId=null;selectedTeamId=null;constructor(e,t,n){this.root=e,this.data=structuredClone(t),this.options=n,this.render()}setData(e){this.data=structuredClone(e),this.ensureSelectionsExist(),this.render()}getData(){return structuredClone(this.data)}ensureSelectionsExist(){this.selectedPersonId&&!this.data.people.some(e=>e.id===this.selectedPersonId)&&(this.selectedPersonId=null),this.selectedPositionId&&!this.data.positions.some(e=>e.id===this.selectedPositionId)&&(this.selectedPositionId=null),this.selectedDepartmentId&&!this.data.departments.some(e=>e.id===this.selectedDepartmentId)&&(this.selectedDepartmentId=null),this.selectedRoleId&&!this.data.roles.some(e=>e.id===this.selectedRoleId)&&(this.selectedRoleId=null),this.selectedTeamId&&!this.data.teams.some(e=>e.id===this.selectedTeamId)&&(this.selectedTeamId=null)}notifyChanged(){this.options.onChange(this.getData())}render(){let e=this.selectedEntityReference();this.root.innerHTML=`
      <div class="organisation-manager">
        <div class="organisation-header">
          <div>
            <div class="organisation-title">Organisation</div>
            <div class="organisation-subtitle">Repository-backed people, positions, roles, teams and departments</div>
          </div>
          <div class="organisation-header-actions">
            ${e?`<button id="organisation-explore" class="toolbar-button" type="button">Explore Relationships</button><button id="organisation-impact" class="toolbar-button" type="button">Impact Analysis</button>`:``}
            <button id="organisation-export" class="toolbar-button" type="button">Export JSON</button>
            <button id="organisation-reset" class="toolbar-button" type="button">Reset</button>
            <button id="organisation-close" class="metadata-close-button" type="button" title="Close organisation manager">×</button>
          </div>
        </div>

        <div class="organisation-tabs">
          ${this.renderTabButton(`people`,`People`)}
          ${this.renderTabButton(`positions`,`Positions`)}
          ${this.renderTabButton(`roles`,`Roles`)}
          ${this.renderTabButton(`departments`,`Departments`)}
          ${this.renderTabButton(`teams`,`Teams`)}
        </div>

        <div class="organisation-content">
          ${this.renderActiveTab()}
        </div>

        <div class="organisation-footer-note">
          Position is the establishment/headcount layer between Role and Person. Changes are saved locally while editing. Export <strong>org-chart.json</strong> and commit it to publish the organisation model.
        </div>
      </div>
    `,this.bindCommonEvents(),this.bindActiveTabEvents()}renderTabButton(e,t){return`<button class="organisation-tab${this.activeTab===e?` organisation-tab-active`:``}" type="button" data-tab="${e}">${t}</button>`}renderActiveTab(){switch(this.activeTab){case`positions`:return this.renderPositions();case`departments`:return this.renderDepartments();case`roles`:return this.renderRoles();case`teams`:return this.renderTeams();default:return this.renderPeople()}}renderPeople(){let e=v(this.data.people),t=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No people have been added yet.</div>`:e.map(e=>{let t=[ae(this.data,e.positionId),f(this.data,ce(this.data,e)),l(this.data,ie(this.data,e))].filter(Boolean).join(` · `)||e.email||`No position assigned`;return`
            <button class="organisation-list-item${e.id===this.selectedPersonId?` organisation-list-item-selected`:``}" type="button" data-edit-person="${_(e.id)}">
              <span class="organisation-list-primary">${_(e.name)}</span>
              <span class="organisation-list-secondary">${_(t)}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(t)}
        </div>
      </div>
    `}renderPersonForm(e){let t=v(this.data.positions).filter(t=>t.id===e?.positionId||t.active&&u(this.data,t.id).length===0).map(t=>{let n=f(this.data,t.roleId),r=l(this.data,t.departmentId),i=[t.name,n,r].filter(Boolean).join(` — `);return`<option value="${_(t.id)}"${t.id===e?.positionId?` selected`:``}>${_(i)}</option>`}).join(``),n=e?ue(this.data,e.positionId):void 0,r=n?f(this.data,n.roleId):``,i=n?l(this.data,n.departmentId):``,a=n?ae(this.data,n.managerPositionId):``,o=v(this.data.departments).map(t=>`<option value="${_(t.id)}"${t.id===e?.departmentId?` selected`:``}>${_(t.name)}</option>`).join(``),ee=v(this.data.roles).map(t=>`<option value="${_(t.id)}"${t.id===e?.roleId?` selected`:``}>${_(t.name)}</option>`).join(``),te=v(this.data.people.filter(t=>t.id!==e?.id)).map(t=>`<option value="${_(t.id)}"${t.id===e?.managerPersonId?` selected`:``}>${_(t.name)}</option>`).join(``),ne=v(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${_(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${_(t.name)}</span>
        </label>
      `).join(``);return`
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit person`:`Add person`}</div>
        ${e?`<div class="organisation-record-id">${_(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${_(e?.name??``)}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${_(e?.email??``)}" />
        </label>

        <label class="metadata-field">
          <span>Position</span>
          <select id="organisation-person-position">
            <option value="">Not set</option>
            ${t}
          </select>
        </label>

        ${n?`
          <div class="metadata-help">
            <strong>${_(n.name)}</strong><br />
            Role: ${_(r||`Not set`)}<br />
            Department: ${_(i||`Not set`)}<br />
            Reports to position: ${_(a||`Not set`)}
          </div>
        `:`
          <fieldset class="organisation-fieldset">
            <legend>Legacy structure fallback</legend>
            <div class="organisation-muted" style="margin-bottom:8px">Used only while this person has no Position assigned.</div>

            <label class="metadata-field">
              <span>Department</span>
              <select id="organisation-person-department">
                <option value="">Not set</option>
                ${o}
              </select>
            </label>

            <label class="metadata-field">
              <span>Role</span>
              <select id="organisation-person-role">
                <option value="">Not set</option>
                ${ee}
              </select>
            </label>

            <label class="metadata-field">
              <span>Manager</span>
              <select id="organisation-person-manager">
                <option value="">Not set</option>
                ${te}
              </select>
            </label>

            <fieldset class="organisation-fieldset">
              <legend>Teams</legend>
              <div class="organisation-checkbox-list">
                ${ne||`<span class="organisation-muted">No teams defined.</span>`}
              </div>
            </fieldset>
          </fieldset>
        `}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-person-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-person-notes" rows="3">${_(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Person`:`Add Person`}</button>
          ${e?`<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderPositions(){let e=v(this.data.positions),t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No positions have been added yet.</div>`:e.map(e=>{let t=f(this.data,e.roleId),n=l(this.data,e.departmentId),r=u(this.data,e.id),i=r.length===0?`Vacant`:r.map(e=>e.name).join(`, `);return`
            <button class="organisation-list-item${e.id===this.selectedPositionId?` organisation-list-item-selected`:``}" type="button" data-edit-position="${_(e.id)}">
              <span class="organisation-list-primary">${_(e.name)}</span>
              <span class="organisation-list-secondary">${_([t,n,i].filter(Boolean).join(` · `))}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(t)}
        </div>
      </div>
    `}renderPositionForm(e){let t=v(this.data.roles).map(t=>`<option value="${_(t.id)}"${t.id===e?.roleId?` selected`:``}>${_(t.name)}</option>`).join(``),n=this.renderDepartmentOptions(e?.departmentId),r=v(this.data.positions.filter(t=>t.id!==e?.id)).map(t=>{let n=f(this.data,t.roleId),r=n?`${t.name} — ${n}`:t.name;return`<option value="${_(t.id)}"${t.id===e?.managerPositionId?` selected`:``}>${_(r)}</option>`}).join(``),i=v(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${_(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${_(t.name)}</span>
        </label>
      `).join(``),a=e?u(this.data,e.id):[];return`
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit position`:`Add position`}</div>
        ${e?`<div class="organisation-record-id">${_(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${_(e?.name??``)}" placeholder="e.g. Operations Analyst 01" />
        </label>

        <label class="metadata-field">
          <span>Role</span>
          <select id="organisation-position-role">
            <option value="">Not set</option>
            ${t}
          </select>
        </label>

        <label class="metadata-field">
          <span>Department</span>
          <select id="organisation-position-department">
            <option value="">Not set</option>
            ${n}
          </select>
        </label>

        <label class="metadata-field">
          <span>Reports to position</span>
          <select id="organisation-position-manager">
            <option value="">Top level / not set</option>
            ${r}
          </select>
        </label>

        <fieldset class="organisation-fieldset">
          <legend>Teams</legend>
          <div class="organisation-checkbox-list">
            ${i||`<span class="organisation-muted">No teams defined.</span>`}
          </div>
        </fieldset>

        ${e?`
          <div class="metadata-help">
            Current occupant: ${_(a.length>0?a.map(e=>e.name).join(`, `):`VACANT`)}
          </div>
        `:``}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${_(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Position`:`Add Position`}</button>
          ${e?`<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartments(){return this.renderReferenceSection(`Department`,`department`,v(this.data.departments),this.selectedDepartmentId,this.renderDepartmentForm())}renderDepartmentForm(){let e=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId)??null:null,t=v(this.data.departments.filter(t=>t.id!==e?.id)).map(t=>`<option value="${_(t.id)}"${t.id===e?.parentDepartmentId?` selected`:``}>${_(t.name)}</option>`).join(``);return`
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit department`:`Add department`}</div>
        ${e?`<div class="organisation-record-id">${_(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${_(e?.name??``)}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${t}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Department`:`Add Department`}</button>
          ${e?`<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderRoles(){return this.renderReferenceSection(`Role`,`role`,v(this.data.roles),this.selectedRoleId,this.renderRoleForm())}renderRoleForm(){let e=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit role`:`Add role`}</div>
        ${e?`<div class="organisation-record-id">${_(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${_(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Role`:`Add Role`}</button>
          ${e?`<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderTeams(){return this.renderReferenceSection(`Team`,`team`,v(this.data.teams),this.selectedTeamId,this.renderTeamForm())}renderTeamForm(){let e=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit team`:`Add team`}</div>
        ${e?`<div class="organisation-record-id">${_(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${_(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Team`:`Add Team`}</button>
          ${e?`<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartmentOptions(e){return v(this.data.departments).map(t=>`<option value="${_(t.id)}"${t.id===e?` selected`:``}>${_(t.name)}</option>`).join(``)}renderReferenceSection(e,t,n,r,i){return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${e}s</span>
            <button id="organisation-new-${t}" class="toolbar-button" type="button">New ${e}</button>
          </div>
          <div class="organisation-list">${n.length===0?`<div class="organisation-empty">No ${e.toLowerCase()}s have been added yet.</div>`:n.map(e=>`
          <button class="organisation-list-item${e.id===r?` organisation-list-item-selected`:``}" type="button" data-edit-${t}="${_(e.id)}">
            <span class="organisation-list-primary">${_(e.name)}</span>
          </button>
        `).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">${i}</div>
      </div>
    `}selectedEntityReference(){switch(this.activeTab){case`people`:return this.selectedPersonId?{type:`person`,id:this.selectedPersonId}:null;case`positions`:return this.selectedPositionId?{type:`position`,id:this.selectedPositionId}:null;case`roles`:return this.selectedRoleId?{type:`role`,id:this.selectedRoleId}:null;case`departments`:return this.selectedDepartmentId?{type:`department`,id:this.selectedDepartmentId}:null;case`teams`:return this.selectedTeamId?{type:`team`,id:this.selectedTeamId}:null;default:return null}}openSelectedInExplorer(e){let t=this.selectedEntityReference();t&&(this.options.onClose(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{...t,mode:e}})))}bindCommonEvents(){this.root.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t&&(this.activeTab=t,this.render())})}),this.root.querySelector(`#organisation-close`)?.addEventListener(`click`,this.options.onClose),this.root.querySelector(`#organisation-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#organisation-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.root.querySelector(`#organisation-export`)?.addEventListener(`click`,()=>this.options.onExport(this.getData())),this.root.querySelector(`#organisation-reset`)?.addEventListener(`click`,()=>void this.resetFromRepository())}bindActiveTabEvents(){this.activeTab===`people`?this.bindPeopleEvents():this.activeTab===`positions`?this.bindPositionEvents():this.activeTab===`departments`?this.bindDepartmentEvents():this.activeTab===`roles`?this.bindRoleEvents():this.bindTeamEvents()}bindPeopleEvents(){this.root.querySelector(`#organisation-new-person`)?.addEventListener(`click`,()=>{this.selectedPersonId=null,this.render()}),this.root.querySelectorAll(`[data-edit-person]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPersonId=e.dataset.editPerson??null,this.render()})}),this.root.querySelector(`#organisation-person-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePerson()}),this.root.querySelector(`#organisation-delete-person`)?.addEventListener(`click`,()=>this.deletePerson())}bindPositionEvents(){this.root.querySelector(`#organisation-new-position`)?.addEventListener(`click`,()=>{this.selectedPositionId=null,this.render()}),this.root.querySelectorAll(`[data-edit-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPositionId=e.dataset.editPosition??null,this.render()})}),this.root.querySelector(`#organisation-position-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePosition()}),this.root.querySelector(`#organisation-delete-position`)?.addEventListener(`click`,()=>this.deletePosition())}bindDepartmentEvents(){this.root.querySelector(`#organisation-new-department`)?.addEventListener(`click`,()=>{this.selectedDepartmentId=null,this.render()}),this.root.querySelectorAll(`[data-edit-department]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedDepartmentId=e.dataset.editDepartment??null,this.render()})}),this.root.querySelector(`#organisation-department-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveDepartment()}),this.root.querySelector(`#organisation-delete-department`)?.addEventListener(`click`,()=>this.deleteDepartment())}bindRoleEvents(){this.root.querySelector(`#organisation-new-role`)?.addEventListener(`click`,()=>{this.selectedRoleId=null,this.render()}),this.root.querySelectorAll(`[data-edit-role]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedRoleId=e.dataset.editRole??null,this.render()})}),this.root.querySelector(`#organisation-role-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveRole()}),this.root.querySelector(`#organisation-delete-role`)?.addEventListener(`click`,()=>this.deleteRole())}bindTeamEvents(){this.root.querySelector(`#organisation-new-team`)?.addEventListener(`click`,()=>{this.selectedTeamId=null,this.render()}),this.root.querySelectorAll(`[data-edit-team]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedTeamId=e.dataset.editTeam??null,this.render()})}),this.root.querySelector(`#organisation-team-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveTeam()}),this.root.querySelector(`#organisation-delete-team`)?.addEventListener(`click`,()=>this.deleteTeam())}getInputValue(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}savePerson(){let e=this.getInputValue(`organisation-person-name`);if(!e)return;let t=this.getInputValue(`organisation-person-position`)||void 0,n=this.root.querySelector(`#organisation-person-active`)?.checked??!0,r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId):void 0;if(t&&n){let e=this.data.people.find(e=>e.active&&e.positionId===t&&e.id!==r?.id);if(e){window.alert(`That position is already occupied by ${e.name}.`);return}}let i=!!t,a=i?[]:Array.from(this.root.querySelectorAll(`input[name="teamIds"]:checked`)).map(e=>e.value),o={id:r?.id??d(`person`),name:e,email:this.getInputValue(`organisation-person-email`),positionId:t,departmentId:i?void 0:this.getInputValue(`organisation-person-department`)||void 0,roleId:i?void 0:this.getInputValue(`organisation-person-role`)||void 0,managerPersonId:i?void 0:this.getInputValue(`organisation-person-manager`)||void 0,teamIds:a,active:n,notes:this.getInputValue(`organisation-person-notes`)};r?Object.assign(r,o):this.data.people.push(o),this.selectedPersonId=o.id,this.notifyChanged(),this.render()}deletePerson(){if(!this.selectedPersonId)return;let e=this.data.people.find(e=>e.id===this.selectedPersonId);!e||!window.confirm(`Delete ${e.name}? Existing process metadata references to this person will become unresolved.`)||(this.data.people=this.data.people.filter(t=>t.id!==e.id),this.data.people.forEach(t=>{t.managerPersonId===e.id&&(t.managerPersonId=void 0)}),this.selectedPersonId=null,this.notifyChanged(),this.render())}savePosition(){let e=this.getInputValue(`organisation-position-name`);if(!e)return;let t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId):void 0,n=this.getInputValue(`organisation-position-manager`)||void 0,r=t?.id??d(`position`);if(n&&this.wouldCreatePositionCycle(r,n)){window.alert(`That reporting relationship would create a circular Position hierarchy.`);return}let i=Array.from(this.root.querySelectorAll(`input[name="positionTeamIds"]:checked`)).map(e=>e.value),a=this.root.querySelector(`#organisation-position-active`)?.checked??!0,o={id:r,name:e,roleId:this.getInputValue(`organisation-position-role`)||void 0,departmentId:this.getInputValue(`organisation-position-department`)||void 0,managerPositionId:n,teamIds:i,active:a,notes:this.getInputValue(`organisation-position-notes`)};t?Object.assign(t,o):this.data.positions.push(o),this.selectedPositionId=o.id,this.notifyChanged(),this.render()}wouldCreatePositionCycle(e,t){let n=t,r=new Set;for(;n;){if(n===e||r.has(n))return!0;r.add(n),n=this.data.positions.find(e=>e.id===n)?.managerPositionId}return!1}deletePosition(){if(!this.selectedPositionId)return;let e=this.data.positions.find(e=>e.id===this.selectedPositionId);if(!e)return;let t=u(this.data,e.id),n=t.length>0?` ${t.map(e=>e.name).join(`, `)} will become unassigned.`:``;window.confirm(`Delete position ${e.name}?${n} Child positions will become top-level/unassigned.`)&&(this.data.positions=this.data.positions.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.managerPositionId===e.id&&(t.managerPositionId=void 0)}),this.data.people.forEach(t=>{t.positionId===e.id&&(t.positionId=void 0)}),this.selectedPositionId=null,this.notifyChanged(),this.render())}saveDepartment(){let e=this.getInputValue(`organisation-department-name`);if(!e)return;let t=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId):void 0,n={id:t?.id??d(`department`),name:e,parentDepartmentId:this.getInputValue(`organisation-department-parent`)||void 0};t?Object.assign(t,n):this.data.departments.push(n),this.selectedDepartmentId=n.id,this.notifyChanged(),this.render()}deleteDepartment(){if(!this.selectedDepartmentId)return;let e=this.data.departments.find(e=>e.id===this.selectedDepartmentId);!e||!window.confirm(`Delete department ${e.name}? Department references will be cleared.`)||(this.data.departments=this.data.departments.filter(t=>t.id!==e.id),this.data.departments.forEach(t=>{t.parentDepartmentId===e.id&&(t.parentDepartmentId=void 0)}),this.data.roles.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.teams.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.positions.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.people.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.selectedDepartmentId=null,this.notifyChanged(),this.render())}saveRole(){let e=this.getInputValue(`organisation-role-name`);if(!e)return;let t=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId):void 0,n={id:t?.id??d(`role`),name:e,departmentId:this.getInputValue(`organisation-role-department`)||void 0};t?Object.assign(t,n):this.data.roles.push(n),this.selectedRoleId=n.id,this.notifyChanged(),this.render()}deleteRole(){if(!this.selectedRoleId)return;let e=this.data.roles.find(e=>e.id===this.selectedRoleId);!e||!window.confirm(`Delete role ${e.name}? Role references will be cleared from positions and legacy people records.`)||(this.data.roles=this.data.roles.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.data.people.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.selectedRoleId=null,this.notifyChanged(),this.render())}saveTeam(){let e=this.getInputValue(`organisation-team-name`);if(!e)return;let t=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId):void 0,n={id:t?.id??d(`team`),name:e,departmentId:this.getInputValue(`organisation-team-department`)||void 0};t?Object.assign(t,n):this.data.teams.push(n),this.selectedTeamId=n.id,this.notifyChanged(),this.render()}deleteTeam(){if(!this.selectedTeamId)return;let e=this.data.teams.find(e=>e.id===this.selectedTeamId);!e||!window.confirm(`Delete team ${e.name}? Team references will be cleared.`)||(this.data.teams=this.data.teams.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.data.people.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.selectedTeamId=null,this.notifyChanged(),this.render())}async resetFromRepository(){if(window.confirm(`Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.`))try{let e=await this.options.onReset();this.data=structuredClone(e),this.selectedPersonId=null,this.selectedPositionId=null,this.selectedDepartmentId=null,this.selectedRoleId=null,this.selectedTeamId=null,this.notifyChanged(),this.render()}catch(e){console.error(`Unable to reset organisation data.`,e),window.alert(`Unable to reset the organisation model from the repository.`)}}},ve=`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_EnterpriseModeler"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="Process_EnterpriseModeler" name="New Process" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_EnterpriseModeler">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="180" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,ye=document.querySelector(`#app`);if(!ye)throw Error(`Application root element #app was not found.`);ye.innerHTML=`
  <div class="modeler-shell">
    <header class="application-header">
      <div class="application-brand">
        <div class="application-title">Enterprise Modeler</div>
        <div class="application-subtitle">Repository-backed hierarchical BPMN 2.0 modeler</div>
      </div>

      <div class="document-information">
        <span id="process-level" class="process-level">—</span>
        <span id="document-name" class="document-name">Initialising…</span>
      </div>
    </header>

    <div class="process-navigation">
      <button id="back-button" class="navigation-button" type="button">← Back</button>
      <div id="breadcrumbs" class="breadcrumbs"></div>
      <div class="navigation-hint">Double-click a ↘ process link or BPMN Call Activity to drill down</div>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <button id="new-button" class="toolbar-button" type="button">New</button>
        <button id="open-button" class="toolbar-button" type="button">Open BPMN</button>
        <button id="open-model-button" class="toolbar-button" type="button">Open Enterprise Model</button>
        <button id="home-button" class="toolbar-button" type="button">Home Model</button>
        <button id="reset-button" class="toolbar-button" type="button">Reset Current</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="save-button" class="toolbar-button toolbar-button-primary" type="button">Save BPMN</button>
        <button id="svg-button" class="toolbar-button" type="button">Export SVG</button>
        <button id="metadata-button" class="toolbar-button" type="button" aria-pressed="false">Metadata</button>
        <button id="organisation-button" class="toolbar-button" type="button">Organisation</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="undo-button" class="toolbar-button" type="button">Undo</button>
        <button id="redo-button" class="toolbar-button" type="button">Redo</button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button id="zoom-out-button" class="toolbar-button toolbar-button-square" type="button" title="Zoom out">−</button>
        <button id="fit-button" class="toolbar-button" type="button">Fit</button>
        <button id="zoom-in-button" class="toolbar-button toolbar-button-square" type="button" title="Zoom in">+</button>
      </div>

      <div class="toolbar-spacer"></div>
      <div id="status" class="status">Initialising…</div>
    </div>

    <main class="modeler-workspace">
      <div id="canvas"></div>

      <aside id="metadata-panel" class="metadata-panel metadata-panel-hidden">
        <div class="metadata-header">
          <div>
            <div class="metadata-title">Node metadata</div>
            <div class="metadata-subtitle">Vendor-neutral Enterprise Modeler metadata</div>
          </div>
          <button id="metadata-close-button" class="metadata-close-button" type="button" title="Close metadata">×</button>
        </div>

        <div id="metadata-empty" class="metadata-empty">
          Select a BPMN element to view or edit its metadata.
        </div>

        <form id="metadata-form" class="metadata-form" hidden>
          <div class="metadata-identity">
            <div id="metadata-node-name" class="metadata-node-name"></div>
            <div id="metadata-node-type" class="metadata-node-type"></div>
          </div>

          <label class="metadata-field">
            <span>Element ID</span>
            <input id="metadata-node-id" type="text" readonly />
          </label>

          <label id="metadata-called-element-row" class="metadata-field" hidden>
            <span>BPMN called process</span>
            <input id="metadata-called-element" type="text" readonly />
          </label>

          <label class="metadata-field">
            <span>Status</span>
            <select id="metadata-status">
              <option value="">Not set</option>
              <option value="Draft">Draft</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Description</span>
            <textarea id="metadata-description" rows="3"></textarea>
          </label>

          <label class="metadata-field">
            <span>Owner</span>
            <select id="metadata-owner">
              <option value="">Not set</option>
            </select>
          </label>

          <label class="metadata-field">
            <span>Responsible role / team</span>
            <select id="metadata-responsible">
              <option value="">Not set</option>
            </select>
          </label>

          <div class="process-links-panel">
            <div class="process-links-title">Linked processes</div>
            <div id="metadata-process-links" class="process-links-list"></div>

            <div class="process-link-add-grid">
              <select id="metadata-link-type" title="Link type">
                <option value="drill-down">Drill down</option>
                <option value="related">Related</option>
                <option value="exception">Exception</option>
                <option value="supporting">Supporting</option>
              </select>

              <select id="metadata-link-target" title="Target process">
                <option value="">Select process</option>
              </select>

              <input
                id="metadata-link-label"
                class="process-link-label-input"
                type="text"
                placeholder="Optional display label"
              />

              <button id="metadata-link-add" class="toolbar-button process-link-add-button" type="button">
                + Link Process
              </button>
            </div>
          </div>

          <label class="metadata-field">
            <span>Systems</span>
            <textarea id="metadata-systems" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Controls</span>
            <textarea id="metadata-controls" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Risks</span>
            <textarea id="metadata-risks" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Regulations / policies</span>
            <textarea id="metadata-regulations" rows="3" placeholder="One per line"></textarea>
          </label>

          <label class="metadata-field">
            <span>Notes</span>
            <textarea id="metadata-notes" rows="4"></textarea>
          </label>

          <div class="metadata-actions">
            <button class="toolbar-button toolbar-button-primary" type="submit">Save Metadata</button>
            <button id="metadata-export-button" class="toolbar-button" type="button">Export JSON</button>
            <button id="metadata-reset-button" class="toolbar-button" type="button">Reset Metadata</button>
          </div>

          <div class="metadata-help">
            BPMN Call Activities remain the portable semantic process relationship. Linked Processes add Enterprise Modeler navigation and related-process relationships without changing BPMN semantics.
          </div>
        </form>
      </aside>
    </main>

    <footer class="application-footer">
      <span>BPMN, metadata, process catalogue and organisation drafts are autosaved separately in this browser.</span>
      <span>Repository files remain the system of record.</span>
    </footer>

    <input
      id="file-input"
      type="file"
      accept=".bpmn,.xml,text/xml,application/xml"
      hidden
    />

    <dialog id="organisation-dialog" class="organisation-dialog">
      <div id="organisation-manager-root"></div>
    </dialog>
  </div>
`;function y(e){let t=document.getElementById(e);if(!t)throw Error(`Required element #${e} was not found.`);return t}var be=y(`document-name`),xe=y(`process-level`),b=y(`breadcrumbs`),x=y(`status`),Se=y(`back-button`),Ce=y(`new-button`),we=y(`open-button`),Te=y(`open-model-button`),Ee=y(`home-button`),De=y(`reset-button`),Oe=y(`save-button`),ke=y(`svg-button`),S=y(`metadata-button`),Ae=y(`organisation-button`),je=y(`undo-button`),Me=y(`redo-button`),Ne=y(`zoom-out-button`),Pe=y(`fit-button`),Fe=y(`zoom-in-button`),C=y(`file-input`),Ie=y(`canvas`),Le=y(`metadata-panel`),Re=y(`metadata-close-button`),ze=y(`metadata-empty`),Be=y(`metadata-form`),Ve=y(`metadata-node-name`),He=y(`metadata-node-type`),Ue=y(`metadata-node-id`),We=y(`metadata-called-element-row`),Ge=y(`metadata-called-element`),Ke=y(`metadata-status`),qe=y(`metadata-description`),w=y(`metadata-owner`),T=y(`metadata-responsible`),Je=y(`metadata-process-links`),Ye=y(`metadata-link-type`),E=y(`metadata-link-target`),Xe=y(`metadata-link-label`),Ze=y(`metadata-link-add`),Qe=y(`metadata-systems`),$e=y(`metadata-controls`),et=y(`metadata-risks`),tt=y(`metadata-regulations`),nt=y(`metadata-notes`),rt=y(`metadata-export-button`),it=y(`metadata-reset-button`),D=y(`organisation-dialog`),at=y(`organisation-manager-root`),O=new e({container:Ie,keyboard:{bindTo:window}}),k=null,A=`new-process.bpmn`,j,M=!1,N=!1,ot=!1,P=null,F=R(`Process_Custom`),I=de(),L=new _e(at,I,{onChange:e=>{I=e,oe(I),X(),z(`Organisation changes saved locally`,`success`)},onExport:e=>{se(e),z(`Organisation JSON downloaded`,`success`)},onReset:async()=>{let e=await le();return I=e,X(),z(`Organisation reset to repository version`,`success`),e},onClose:()=>D.close()});function st(){return{status:``,description:``,ownerPersonId:``,responsibleType:``,responsibleId:``,links:[],systems:[],controls:[],risks:[],regulations:[],notes:``}}function ct(e){let t=e.type;if(t!==`drill-down`&&t!==`related`&&t!==`exception`&&t!==`supporting`)return null;let n=e.targetProcessId?.trim()??``;return n?{id:e.id||`link-${crypto.randomUUID()}`,type:t,targetProcessId:n,label:e.label?.trim()??``}:null}function lt(e){let t=st();if(!e)return t;let n=Array.isArray(e.links)?e.links.map(e=>ct(e)).filter(e=>!!e):[];return{status:e.status??``,description:e.description??``,ownerPersonId:e.ownerPersonId??``,responsibleType:e.responsibleType===`role`||e.responsibleType===`team`?e.responsibleType:``,responsibleId:e.responsibleId??``,links:n,systems:Array.isArray(e.systems)?e.systems:[],controls:Array.isArray(e.controls)?e.controls:[],risks:Array.isArray(e.risks)?e.risks:[],regulations:Array.isArray(e.regulations)?e.regulations:[],notes:e.notes??``}}function ut(e,t){let n=Object.fromEntries(Object.entries(e.nodes??{}).map(([e,t])=>[e,lt(t)]));return{schemaVersion:3,processId:e.processId||t,nodes:n}}function R(e){return{schemaVersion:3,processId:e,nodes:{}}}function z(e,t=`normal`){x.textContent=e,x.classList.remove(`status-success`,`status-error`),t===`success`?x.classList.add(`status-success`):t===`error`&&x.classList.add(`status-error`)}function dt(e){let t=e.trim();return t?/\.(bpmn|xml)$/i.test(t)?t:`${t}.bpmn`:`process.bpmn`}function ft(e){return e.replace(/\.(bpmn|xml)$/i,``)+`.svg`}function pt(){let e=V();return e?`${e.id}.json`:A.replace(/\.(bpmn|xml)$/i,``)+`.json`}function B(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function mt(){return O.get(`canvas`)}function ht(){return O.get(`commandStack`)}function gt(){return O.get(`elementRegistry`)}function _t(){return O.get(`overlays`)}function V(){return g(k??void 0)??null}function vt(e){let t=e.businessObject;return t?.$type!==`bpmn:CallActivity`||!t.calledElement?null:he(t.calledElement)??null}function H(e){return F.nodes[e]??st()}function yt(e){let t=H(e).links.find(e=>e.type===`drill-down`&&g(e.targetProcessId)?.active);return t?g(t.targetProcessId)??null:null}function bt(e){return vt(e)??yt(e.id)}function xt(e){let t=[e],n=e.parentId,r=new Set([e.id]);for(;n&&!r.has(n);){let e=g(n);if(!e)break;r.add(e.id),t.unshift(e),n=e.parentId}return t}function U(){b.replaceChildren();let e=V();if(!e){xe.textContent=`Custom`,be.textContent=A,Se.disabled=!0,De.disabled=!0;let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=A,b.appendChild(e);return}xe.textContent=e.level,be.textContent=e.name,Se.disabled=!e.parentId,De.disabled=!1,xt(e).forEach((t,n)=>{if(n>0){let e=document.createElement(`span`);e.className=`breadcrumb-separator`,e.textContent=`›`,b.appendChild(e)}if(t.id===e.id){let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=`${t.level} ${t.name}`,b.appendChild(e);return}let r=document.createElement(`button`);r.className=`breadcrumb-button`,r.type=`button`,r.textContent=`${t.level} ${t.name}`,r.addEventListener(`click`,()=>void $(t.id)),b.appendChild(r)})}function St(){let e=ht();je.disabled=!e.canUndo(),Me.disabled=!e.canRedo()}function W(){try{mt().zoom(`fit-viewport`)}catch(e){console.error(`Unable to fit BPMN diagram to viewport.`,e)}}function Ct(e){let t=mt(),n=t.zoom();t.zoom(Math.max(.2,Math.min(4,n+e)))}function wt(e=k){return e?`${h}${e}.xml`:`${h}custom.xml`}function Tt(e=k){return e?`${h}${e}.filename`:`${h}custom.filename`}function G(e=k){return e?`${pe}${e}`:`${pe}custom`}function K(){if(!N)return;let e=_t();e.clear();let t=mt();gt().getAll().forEach(n=>{let r=bt(n),i=H(n.id).links.filter(e=>g(e.targetProcessId));r&&(t.addMarker(n.id,`drill-down-target`),e.add(n.id,{position:{top:-30,right:0},html:`<div class="drill-down-badge" title="Open ${q(r.name)}">↘ ${q(r.level)}</div>`}));let a=i.filter(e=>!(e.type===`drill-down`&&r?.id===e.targetProcessId)).length;a>0&&e.add(n.id,{position:{bottom:-26,right:0},html:`<div class="process-link-badge" title="${a} additional linked process${a===1?``:`es`}">↗ ${a}</div>`})})}function q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Et(e){ot=e,Le.classList.toggle(`metadata-panel-hidden`,!e),S.classList.toggle(`toolbar-button-active`,e),S.setAttribute(`aria-pressed`,String(e)),window.setTimeout(()=>W(),0)}function Dt(e){return e?e.replace(/^bpmn:/,``).replace(/([a-z])([A-Z])/g,`$1 $2`):`BPMN element`}function J(e){return e.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0)}function Y(e){return(e??[]).join(`
`)}function Ot(e){let t=[f(I,ce(I,e)),l(I,ie(I,e))].filter(Boolean);return t.length>0?`${e.name} — ${t.join(` · `)}`:e.name}function kt(e){w.replaceChildren(new Option(`Not set`,``));let t=[...I.people].filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name));t.forEach(e=>{w.add(new Option(Ot(e),e.id))}),e&&!t.some(t=>t.id===e)&&w.add(new Option(`[Missing or inactive person] ${e}`,e)),w.value=e}function At(e){return e.responsibleType&&e.responsibleId?`${e.responsibleType}:${e.responsibleId}`:``}function jt(e){T.replaceChildren(new Option(`Not set`,``));let t=document.createElement(`optgroup`);t.label=`Roles`,[...I.roles].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let n=l(I,e.departmentId);t.appendChild(new Option(n?`${e.name} — ${n}`:e.name,`role:${e.id}`))});let n=document.createElement(`optgroup`);n.label=`Teams`,[...I.teams].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let t=l(I,e.departmentId);n.appendChild(new Option(t?`${e.name} — ${t}`:e.name,`team:${e.id}`))}),t.children.length>0&&T.appendChild(t),n.children.length>0&&T.appendChild(n);let r=At(e);r&&!Array.from(T.options).some(e=>e.value===r)&&T.add(new Option(`[Missing reference] ${r}`,r)),T.value=r}function Mt(e){if(!e)return{type:``,id:``};let t=e.indexOf(`:`);if(t<1)return{type:``,id:``};let n=e.slice(0,t),r=e.slice(t+1);return n!==`role`&&n!==`team`||!r?{type:``,id:``}:{type:n,id:r}}function Nt(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;default:return`Related`}}function Pt(){E.replaceChildren(new Option(`Select process`,``));let e=[...me].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence),t=Object.values(m).filter(e=>e.active&&e.id!==k);e.forEach(e=>{let n=t.filter(t=>t.layerId===e.id).sort((e,t)=>e.name.localeCompare(t.name));if(n.length===0)return;let r=document.createElement(`optgroup`);r.label=`${e.code} — ${e.name}`,n.forEach(e=>{r.appendChild(new Option(e.name,e.id))}),E.appendChild(r)});let n=t.filter(e=>!me.some(t=>t.id===e.layerId)).sort((e,t)=>e.name.localeCompare(t.name));if(n.length>0){let e=document.createElement(`optgroup`);e.label=`Unlayered`,n.forEach(t=>e.appendChild(new Option(t.name,t.id))),E.appendChild(e)}}function Ft(e){if(Je.replaceChildren(),e.links.length===0){let e=document.createElement(`div`);e.className=`organisation-muted`,e.textContent=`No linked processes.`,Je.appendChild(e)}else e.links.forEach(e=>{let t=g(e.targetProcessId),n=document.createElement(`div`);n.className=`process-link-row`;let r=document.createElement(`div`);r.className=`process-link-copy`,r.innerHTML=`
        <div class="process-link-primary">
          ${q(Nt(e.type))} → ${q(t?.name??e.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${q(t?.level??`Missing process`)}${e.label?` · ${q(e.label)}`:``}
        </div>
      `;let i=document.createElement(`button`);i.type=`button`,i.className=`process-link-remove`,i.textContent=`Remove`,i.dataset.processLinkId=e.id,i.addEventListener(`click`,()=>zt(e.id)),n.append(r,i),Je.appendChild(n)});Pt()}function X(){if(!P){ze.hidden=!1,Be.hidden=!0;return}let e=P.businessObject,t=H(P.id);ze.hidden=!0,Be.hidden=!1,Ve.textContent=e?.name||P.id,He.textContent=Dt(e?.$type),Ue.value=P.id,e?.calledElement?(We.hidden=!1,Ge.value=e.calledElement):(We.hidden=!0,Ge.value=``),Ke.value=t.status,qe.value=t.description,kt(t.ownerPersonId),jt(t),Ft(t),Qe.value=Y(t.systems),$e.value=Y(t.controls),et.value=Y(t.risks),tt.value=Y(t.regulations),nt.value=t.notes}function It(){localStorage.setItem(G(),JSON.stringify(F,null,2));let e=V();e&&a(e.metadataUrl,F)}function Lt(e=!0){if(!P)return;let t=Mt(T.value),n=H(P.id);F.nodes[P.id]={status:Ke.value,description:qe.value.trim(),ownerPersonId:w.value,responsibleType:t.type,responsibleId:t.id,links:n.links,systems:J(Qe.value),controls:J($e.value),risks:J(et.value),regulations:J(tt.value),notes:nt.value.trim()},It(),K(),e&&z(`Metadata saved locally`,`success`)}function Rt(){if(!P)return;let e=E.value,t=Ye.value;if(!e||!g(e)){window.alert(`Select a target process.`);return}Lt(!1);let n=H(P.id);t===`drill-down`&&n.links.some(e=>e.type===`drill-down`)&&!window.confirm(`This node already has a metadata drill-down link. Add another drill-down relationship?`)||(n.links.push({id:`link-${crypto.randomUUID()}`,type:t,targetProcessId:e,label:Xe.value.trim()}),F.nodes[P.id]=n,It(),Xe.value=``,X(),K(),z(`Process link saved locally`,`success`))}function zt(e){if(!P)return;Lt(!1);let t=H(P.id);t.links=t.links.filter(t=>t.id!==e),F.nodes[P.id]=t,It(),X(),K(),z(`Process link removed`,`success`)}function Bt(){B(pt(),`${JSON.stringify(F,null,2)}\n`,`application/json;charset=utf-8`),z(`Metadata JSON downloaded`,`success`)}async function Vt(e){return ut(await r(e.metadataUrl),e.bpmnProcessId)}async function Ht(e,t){if(t&&!s()){let t=localStorage.getItem(G(e.id));if(t)try{return ut(JSON.parse(t),e.bpmnProcessId)}catch(e){console.warn(`Unable to parse locally saved metadata; repository metadata will be used.`,e)}}try{return await Vt(e)}catch(t){return console.warn(`Unable to load repository metadata; using an empty metadata record.`,t),R(e.bpmnProcessId)}}async function Ut(){let e=V(),t=e?`${e.level} ${e.name}`:`the current custom process`;if(window.confirm(`Reset all metadata for ${t} to the repository version? Any locally saved metadata changes for this process will be discarded.`)){if(!e){F=R(`Process_Custom`),P=null,localStorage.removeItem(G()),X(),K(),z(`Custom metadata cleared`,`success`);return}localStorage.removeItem(G(e.id)),F=await Ht(e,!1),X(),K(),z(`${e.level} metadata reset to repository version`,`success`)}}async function Z(){if(!(M||!N))try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML while autosaving.`);localStorage.setItem(wt(),e.xml),localStorage.setItem(Tt(),A);let r=V();r&&await t(r.url,e.xml),z(s()?`Saved to ${n()}`:`Saved locally`,`success`)}catch(e){console.error(`Unable to autosave BPMN diagram.`,e),z(`Autosave failed`,`error`)}}function Wt(){M||(j!==void 0&&window.clearTimeout(j),z(`Unsaved changes`),j=window.setTimeout(()=>void Z(),500))}async function Q(e,t){M=!0,A=dt(t),P=null,U(),X(),z(`Loading process…`);try{let t=await O.importXML(e);N=!0,W(),St(),K();let n=t.warnings?.length??0;n>0?(console.warn(`BPMN import warnings:`,t.warnings),z(`Loaded with ${n} warning${n===1?``:`s`}`)):z(`Process loaded`,`success`)}catch(e){throw N=!1,console.error(`Unable to import BPMN diagram.`,e),z(`Unable to load BPMN process`,`error`),e}finally{M=!1}}async function Gt(e){return ee(e.url)}async function $(e,t=!0){let n=g(e);if(!n){z(`Unknown process: ${e}`,`error`);return}N&&k!==e&&await Z(),j!==void 0&&(window.clearTimeout(j),j=void 0),k=n.id,A=n.filename,P=null,F=await Ht(n,t),U(),X(),z(`Loading ${n.level} ${n.name}…`);try{let e=t&&!s()?localStorage.getItem(wt()):null;if(e){await Q(e,n.filename),z(`Restored ${n.level} ${n.name} from local autosave`,`success`);return}await Q(await Gt(n),n.filename)}catch(e){console.error(`Unable to load process ${n.id}.`,e),z(`Unable to load ${n.name}`,`error`)}}async function Kt(){let e=V();e&&window.confirm(`Reset ${e.level} ${e.name} to the repository BPMN? Local diagram changes will be discarded.`)&&(localStorage.removeItem(wt()),localStorage.removeItem(Tt()),await $(e.id,!1),z(`${e.level} ${e.name} reset to repository version`,`success`))}async function qt(){await Z(),k=null,A=`new-process.bpmn`,F=R(`Process_Custom`),P=null,U(),X();try{await Q(ve,A)}catch(e){console.error(`Unable to create new BPMN process.`,e)}}async function Jt(){z(`Preparing BPMN…`);try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML.`);if(s()){let n=V();n?await t(n.url,e.xml):B(dt(A),e.xml,`application/xml;charset=utf-8`)}else B(dt(A),e.xml,`application/xml;charset=utf-8`);await Z(),z(s()?`BPMN saved to Enterprise Model folder`:`BPMN downloaded`,`success`)}catch(e){console.error(`Unable to save BPMN file.`,e),z(`Unable to save BPMN`,`error`)}}async function Yt(){z(`Preparing SVG…`);try{let e=await O.saveSVG();if(!e.svg)throw Error(`bpmn-js returned no SVG.`);B(ft(A),e.svg,`image/svg+xml;charset=utf-8`),z(`SVG downloaded`,`success`)}catch(e){console.error(`Unable to export SVG.`,e),z(`Unable to export SVG`,`error`)}}async function Xt(e){await Z(),k=null,A=e.name,F=R(`Process_Custom`),P=null,U(),X(),z(`Opening ${e.name}…`);try{await Q(await e.text(),e.name)}catch(t){console.error(`Unable to open ${e.name}.`,t),z(`Unable to open ${e.name}`,`error`)}}function Zt(){let e=V(),t=e?.parentId;if(t&&t!==e.id&&g(t)){$(t);return}let n=g(p);n&&n.id!==e?.id&&$(n.id)}function Qt(e){if(!e.element)return;let t=bt(e.element);t&&(e.originalEvent?.preventDefault(),e.originalEvent?.stopPropagation(),$(t.id))}function $t(e){P=e.newSelection?.[0]??null,X();let t=P?.businessObject;document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-node-selection-changed`,{detail:P?{processId:k??``,elementId:P.id,name:t?.name||P.id,bpmnType:t?.$type||``}:null}))}function en(){L.setData(I),D.open||D.showModal()}function tn(){U(),X(),K()}function nn(e){let t=e.detail;t?.processId&&$(t.processId)}async function rn(){try{let e=ne(),t=e?await i():null,n=e?null:await o();await Z();let r=t?te(t):await re(n??[]);await fe(!1),I=await c(!1),L.setData(I);let a=g(p)??Object.values(m).find(e=>e.active)??Object.values(m)[0];a&&await $(a.id,!1),z(`Enterprise Model opened: ${r}`,`success`)}catch(e){console.error(`Unable to open Enterprise Model folder.`,e),z(e instanceof Error?e.message:`Unable to open Enterprise Model folder`,`error`)}}async function an(){if(!ne()){window.alert(`Creating a filesystem-backed Enterprise Model requires a browser with direct folder access, such as Microsoft Edge or Google Chrome.`);return}try{let e=await i(),t=window.prompt(`Enterprise Model name`,e.name||`Enterprise Model`)?.trim();if(!t)return;let n=window.prompt(`Organisation name`,t)?.trim()||t;await Z();let r=await ge(e,{name:t,organisationName:n});await fe(!1),I=await c(!1),L.setData(I);let a=g(p)??Object.values(m).find(e=>e.active)??Object.values(m)[0];a&&await $(a.id,!1),z(`Enterprise Model created: ${r}`,`success`)}catch(e){console.error(`Unable to create Enterprise Model.`,e),z(e instanceof Error?e.message:`Unable to create Enterprise Model`,`error`)}}async function on(){try{await fe(!0)}catch(e){console.error(`Unable to initialise process repository.`,e),z(`Unable to initialise process repository`,`error`);return}I=await c(!0),L.setData(I),U(),X();let e=g(p)??Object.values(m).find(e=>e.active)??Object.values(m)[0];e?await $(e.id):await qt()}Se.addEventListener(`click`,Zt),Ce.addEventListener(`click`,()=>void qt()),we.addEventListener(`click`,()=>{C.value=``,C.click()}),Te.addEventListener(`click`,()=>void rn()),document.addEventListener(`enterprise-modeler:open-enterprise-model`,()=>void rn()),document.addEventListener(`enterprise-modeler:create-enterprise-model`,()=>void an()),Ee.addEventListener(`click`,()=>{let e=g(p);e&&$(e.id)}),De.addEventListener(`click`,()=>void Kt()),Oe.addEventListener(`click`,()=>void Jt()),ke.addEventListener(`click`,()=>void Yt()),S.addEventListener(`click`,()=>Et(!ot)),Re.addEventListener(`click`,()=>Et(!1)),Ae.addEventListener(`click`,en),je.addEventListener(`click`,()=>ht().undo()),Me.addEventListener(`click`,()=>ht().redo()),Ne.addEventListener(`click`,()=>Ct(-.1)),Pe.addEventListener(`click`,W),Fe.addEventListener(`click`,()=>Ct(.1)),rt.addEventListener(`click`,Bt),it.addEventListener(`click`,()=>void Ut()),Ze.addEventListener(`click`,Rt),Be.addEventListener(`submit`,e=>{e.preventDefault(),Lt()}),C.addEventListener(`change`,()=>{let e=C.files?.[0];e&&Xt(e)}),D.addEventListener(`click`,e=>{e.target===D&&D.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,tn),document.addEventListener(`enterprise-modeler:open-process`,nn),O.on(`commandStack.changed`,()=>{St(),Wt()}),O.on(`element.dblclick`,Qt),O.on(`selection.changed`,$t),window.addEventListener(`resize`,W),on();