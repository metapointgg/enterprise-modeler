import{t as e}from"./Modeler-Bi03ARIg.js";import{_ as t,a as n,c as r,f as i,g as a,l as o,n as ee,s}from"./modelWorkspace-D0F3WQyF.js";import{a as te,c as ne,f as re,i as c,l,m as ie,n as ae,o as oe,p as se,r as u,s as ce,t as le,u as d}from"./organisation-Bb6brSmH.js";import{a as f,f as ue,i as de,n as p,r as fe,s as pe,t as m,u as h}from"./processCatalog-R5lrx_Qj.js";/* empty css             */function g(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function _(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var me=class{root;options;data;activeTab=`people`;selectedPersonId=null;selectedPositionId=null;selectedDepartmentId=null;selectedRoleId=null;selectedTeamId=null;constructor(e,t,n){this.root=e,this.data=structuredClone(t),this.options=n,this.render()}setData(e){this.data=structuredClone(e),this.ensureSelectionsExist(),this.render()}getData(){return structuredClone(this.data)}ensureSelectionsExist(){this.selectedPersonId&&!this.data.people.some(e=>e.id===this.selectedPersonId)&&(this.selectedPersonId=null),this.selectedPositionId&&!this.data.positions.some(e=>e.id===this.selectedPositionId)&&(this.selectedPositionId=null),this.selectedDepartmentId&&!this.data.departments.some(e=>e.id===this.selectedDepartmentId)&&(this.selectedDepartmentId=null),this.selectedRoleId&&!this.data.roles.some(e=>e.id===this.selectedRoleId)&&(this.selectedRoleId=null),this.selectedTeamId&&!this.data.teams.some(e=>e.id===this.selectedTeamId)&&(this.selectedTeamId=null)}notifyChanged(){this.options.onChange(this.getData())}render(){let e=this.selectedEntityReference();this.root.innerHTML=`
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
    `,this.bindCommonEvents(),this.bindActiveTabEvents()}renderTabButton(e,t){return`<button class="organisation-tab${this.activeTab===e?` organisation-tab-active`:``}" type="button" data-tab="${e}">${t}</button>`}renderActiveTab(){switch(this.activeTab){case`positions`:return this.renderPositions();case`departments`:return this.renderDepartments();case`roles`:return this.renderRoles();case`teams`:return this.renderTeams();default:return this.renderPeople()}}renderPeople(){let e=_(this.data.people),t=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No people have been added yet.</div>`:e.map(e=>{let t=[ne(this.data,e.positionId),d(this.data,oe(this.data,e)),c(this.data,te(this.data,e))].filter(Boolean).join(` · `)||e.email||`No position assigned`;return`
            <button class="organisation-list-item${e.id===this.selectedPersonId?` organisation-list-item-selected`:``}" type="button" data-edit-person="${g(e.id)}">
              <span class="organisation-list-primary">${g(e.name)}</span>
              <span class="organisation-list-secondary">${g(t)}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(t)}
        </div>
      </div>
    `}renderPersonForm(e){let t=_(this.data.positions).filter(t=>t.id===e?.positionId||t.active&&l(this.data,t.id).length===0).map(t=>{let n=d(this.data,t.roleId),r=c(this.data,t.departmentId),i=[t.name,n,r].filter(Boolean).join(` — `);return`<option value="${g(t.id)}"${t.id===e?.positionId?` selected`:``}>${g(i)}</option>`}).join(``),n=e?ce(this.data,e.positionId):void 0,r=n?d(this.data,n.roleId):``,i=n?c(this.data,n.departmentId):``,a=n?ne(this.data,n.managerPositionId):``,o=_(this.data.departments).map(t=>`<option value="${g(t.id)}"${t.id===e?.departmentId?` selected`:``}>${g(t.name)}</option>`).join(``),ee=_(this.data.roles).map(t=>`<option value="${g(t.id)}"${t.id===e?.roleId?` selected`:``}>${g(t.name)}</option>`).join(``),s=_(this.data.people.filter(t=>t.id!==e?.id)).map(t=>`<option value="${g(t.id)}"${t.id===e?.managerPersonId?` selected`:``}>${g(t.name)}</option>`).join(``),te=_(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${g(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${g(t.name)}</span>
        </label>
      `).join(``);return`
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit person`:`Add person`}</div>
        ${e?`<div class="organisation-record-id">${g(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${g(e?.name??``)}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${g(e?.email??``)}" />
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
            <strong>${g(n.name)}</strong><br />
            Role: ${g(r||`Not set`)}<br />
            Department: ${g(i||`Not set`)}<br />
            Reports to position: ${g(a||`Not set`)}
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
                ${s}
              </select>
            </label>

            <fieldset class="organisation-fieldset">
              <legend>Teams</legend>
              <div class="organisation-checkbox-list">
                ${te||`<span class="organisation-muted">No teams defined.</span>`}
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
          <textarea id="organisation-person-notes" rows="3">${g(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Person`:`Add Person`}</button>
          ${e?`<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderPositions(){let e=_(this.data.positions),t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No positions have been added yet.</div>`:e.map(e=>{let t=d(this.data,e.roleId),n=c(this.data,e.departmentId),r=l(this.data,e.id),i=r.length===0?`Vacant`:r.map(e=>e.name).join(`, `);return`
            <button class="organisation-list-item${e.id===this.selectedPositionId?` organisation-list-item-selected`:``}" type="button" data-edit-position="${g(e.id)}">
              <span class="organisation-list-primary">${g(e.name)}</span>
              <span class="organisation-list-secondary">${g([t,n,i].filter(Boolean).join(` · `))}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(t)}
        </div>
      </div>
    `}renderPositionForm(e){let t=_(this.data.roles).map(t=>`<option value="${g(t.id)}"${t.id===e?.roleId?` selected`:``}>${g(t.name)}</option>`).join(``),n=this.renderDepartmentOptions(e?.departmentId),r=_(this.data.positions.filter(t=>t.id!==e?.id)).map(t=>{let n=d(this.data,t.roleId),r=n?`${t.name} — ${n}`:t.name;return`<option value="${g(t.id)}"${t.id===e?.managerPositionId?` selected`:``}>${g(r)}</option>`}).join(``),i=_(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${g(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${g(t.name)}</span>
        </label>
      `).join(``),a=e?l(this.data,e.id):[];return`
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit position`:`Add position`}</div>
        ${e?`<div class="organisation-record-id">${g(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${g(e?.name??``)}" placeholder="e.g. Operations Analyst 01" />
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
            Current occupant: ${g(a.length>0?a.map(e=>e.name).join(`, `):`VACANT`)}
          </div>
        `:``}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${g(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Position`:`Add Position`}</button>
          ${e?`<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartments(){return this.renderReferenceSection(`Department`,`department`,_(this.data.departments),this.selectedDepartmentId,this.renderDepartmentForm())}renderDepartmentForm(){let e=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId)??null:null,t=_(this.data.departments.filter(t=>t.id!==e?.id)).map(t=>`<option value="${g(t.id)}"${t.id===e?.parentDepartmentId?` selected`:``}>${g(t.name)}</option>`).join(``);return`
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit department`:`Add department`}</div>
        ${e?`<div class="organisation-record-id">${g(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${g(e?.name??``)}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${t}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Department`:`Add Department`}</button>
          ${e?`<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderRoles(){return this.renderReferenceSection(`Role`,`role`,_(this.data.roles),this.selectedRoleId,this.renderRoleForm())}renderRoleForm(){let e=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit role`:`Add role`}</div>
        ${e?`<div class="organisation-record-id">${g(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${g(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Role`:`Add Role`}</button>
          ${e?`<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderTeams(){return this.renderReferenceSection(`Team`,`team`,_(this.data.teams),this.selectedTeamId,this.renderTeamForm())}renderTeamForm(){let e=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit team`:`Add team`}</div>
        ${e?`<div class="organisation-record-id">${g(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${g(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Team`:`Add Team`}</button>
          ${e?`<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartmentOptions(e){return _(this.data.departments).map(t=>`<option value="${g(t.id)}"${t.id===e?` selected`:``}>${g(t.name)}</option>`).join(``)}renderReferenceSection(e,t,n,r,i){return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${e}s</span>
            <button id="organisation-new-${t}" class="toolbar-button" type="button">New ${e}</button>
          </div>
          <div class="organisation-list">${n.length===0?`<div class="organisation-empty">No ${e.toLowerCase()}s have been added yet.</div>`:n.map(e=>`
          <button class="organisation-list-item${e.id===r?` organisation-list-item-selected`:``}" type="button" data-edit-${t}="${g(e.id)}">
            <span class="organisation-list-primary">${g(e.name)}</span>
          </button>
        `).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">${i}</div>
      </div>
    `}selectedEntityReference(){switch(this.activeTab){case`people`:return this.selectedPersonId?{type:`person`,id:this.selectedPersonId}:null;case`positions`:return this.selectedPositionId?{type:`position`,id:this.selectedPositionId}:null;case`roles`:return this.selectedRoleId?{type:`role`,id:this.selectedRoleId}:null;case`departments`:return this.selectedDepartmentId?{type:`department`,id:this.selectedDepartmentId}:null;case`teams`:return this.selectedTeamId?{type:`team`,id:this.selectedTeamId}:null;default:return null}}openSelectedInExplorer(e){let t=this.selectedEntityReference();t&&(this.options.onClose(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{...t,mode:e}})))}bindCommonEvents(){this.root.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t&&(this.activeTab=t,this.render())})}),this.root.querySelector(`#organisation-close`)?.addEventListener(`click`,this.options.onClose),this.root.querySelector(`#organisation-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#organisation-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.root.querySelector(`#organisation-export`)?.addEventListener(`click`,()=>this.options.onExport(this.getData())),this.root.querySelector(`#organisation-reset`)?.addEventListener(`click`,()=>void this.resetFromRepository())}bindActiveTabEvents(){this.activeTab===`people`?this.bindPeopleEvents():this.activeTab===`positions`?this.bindPositionEvents():this.activeTab===`departments`?this.bindDepartmentEvents():this.activeTab===`roles`?this.bindRoleEvents():this.bindTeamEvents()}bindPeopleEvents(){this.root.querySelector(`#organisation-new-person`)?.addEventListener(`click`,()=>{this.selectedPersonId=null,this.render()}),this.root.querySelectorAll(`[data-edit-person]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPersonId=e.dataset.editPerson??null,this.render()})}),this.root.querySelector(`#organisation-person-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePerson()}),this.root.querySelector(`#organisation-delete-person`)?.addEventListener(`click`,()=>this.deletePerson())}bindPositionEvents(){this.root.querySelector(`#organisation-new-position`)?.addEventListener(`click`,()=>{this.selectedPositionId=null,this.render()}),this.root.querySelectorAll(`[data-edit-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPositionId=e.dataset.editPosition??null,this.render()})}),this.root.querySelector(`#organisation-position-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePosition()}),this.root.querySelector(`#organisation-delete-position`)?.addEventListener(`click`,()=>this.deletePosition())}bindDepartmentEvents(){this.root.querySelector(`#organisation-new-department`)?.addEventListener(`click`,()=>{this.selectedDepartmentId=null,this.render()}),this.root.querySelectorAll(`[data-edit-department]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedDepartmentId=e.dataset.editDepartment??null,this.render()})}),this.root.querySelector(`#organisation-department-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveDepartment()}),this.root.querySelector(`#organisation-delete-department`)?.addEventListener(`click`,()=>this.deleteDepartment())}bindRoleEvents(){this.root.querySelector(`#organisation-new-role`)?.addEventListener(`click`,()=>{this.selectedRoleId=null,this.render()}),this.root.querySelectorAll(`[data-edit-role]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedRoleId=e.dataset.editRole??null,this.render()})}),this.root.querySelector(`#organisation-role-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveRole()}),this.root.querySelector(`#organisation-delete-role`)?.addEventListener(`click`,()=>this.deleteRole())}bindTeamEvents(){this.root.querySelector(`#organisation-new-team`)?.addEventListener(`click`,()=>{this.selectedTeamId=null,this.render()}),this.root.querySelectorAll(`[data-edit-team]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedTeamId=e.dataset.editTeam??null,this.render()})}),this.root.querySelector(`#organisation-team-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveTeam()}),this.root.querySelector(`#organisation-delete-team`)?.addEventListener(`click`,()=>this.deleteTeam())}getInputValue(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}savePerson(){let e=this.getInputValue(`organisation-person-name`);if(!e)return;let t=this.getInputValue(`organisation-person-position`)||void 0,n=this.root.querySelector(`#organisation-person-active`)?.checked??!0,r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId):void 0;if(t&&n){let e=this.data.people.find(e=>e.active&&e.positionId===t&&e.id!==r?.id);if(e){window.alert(`That position is already occupied by ${e.name}.`);return}}let i=!!t,a=i?[]:Array.from(this.root.querySelectorAll(`input[name="teamIds"]:checked`)).map(e=>e.value),o={id:r?.id??u(`person`),name:e,email:this.getInputValue(`organisation-person-email`),positionId:t,departmentId:i?void 0:this.getInputValue(`organisation-person-department`)||void 0,roleId:i?void 0:this.getInputValue(`organisation-person-role`)||void 0,managerPersonId:i?void 0:this.getInputValue(`organisation-person-manager`)||void 0,teamIds:a,active:n,notes:this.getInputValue(`organisation-person-notes`)};r?Object.assign(r,o):this.data.people.push(o),this.selectedPersonId=o.id,this.notifyChanged(),this.render()}deletePerson(){if(!this.selectedPersonId)return;let e=this.data.people.find(e=>e.id===this.selectedPersonId);!e||!window.confirm(`Delete ${e.name}? Existing process metadata references to this person will become unresolved.`)||(this.data.people=this.data.people.filter(t=>t.id!==e.id),this.data.people.forEach(t=>{t.managerPersonId===e.id&&(t.managerPersonId=void 0)}),this.selectedPersonId=null,this.notifyChanged(),this.render())}savePosition(){let e=this.getInputValue(`organisation-position-name`);if(!e)return;let t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId):void 0,n=this.getInputValue(`organisation-position-manager`)||void 0,r=t?.id??u(`position`);if(n&&this.wouldCreatePositionCycle(r,n)){window.alert(`That reporting relationship would create a circular Position hierarchy.`);return}let i=Array.from(this.root.querySelectorAll(`input[name="positionTeamIds"]:checked`)).map(e=>e.value),a=this.root.querySelector(`#organisation-position-active`)?.checked??!0,o={id:r,name:e,roleId:this.getInputValue(`organisation-position-role`)||void 0,departmentId:this.getInputValue(`organisation-position-department`)||void 0,managerPositionId:n,teamIds:i,active:a,notes:this.getInputValue(`organisation-position-notes`)};t?Object.assign(t,o):this.data.positions.push(o),this.selectedPositionId=o.id,this.notifyChanged(),this.render()}wouldCreatePositionCycle(e,t){let n=t,r=new Set;for(;n;){if(n===e||r.has(n))return!0;r.add(n),n=this.data.positions.find(e=>e.id===n)?.managerPositionId}return!1}deletePosition(){if(!this.selectedPositionId)return;let e=this.data.positions.find(e=>e.id===this.selectedPositionId);if(!e)return;let t=l(this.data,e.id),n=t.length>0?` ${t.map(e=>e.name).join(`, `)} will become unassigned.`:``;window.confirm(`Delete position ${e.name}?${n} Child positions will become top-level/unassigned.`)&&(this.data.positions=this.data.positions.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.managerPositionId===e.id&&(t.managerPositionId=void 0)}),this.data.people.forEach(t=>{t.positionId===e.id&&(t.positionId=void 0)}),this.selectedPositionId=null,this.notifyChanged(),this.render())}saveDepartment(){let e=this.getInputValue(`organisation-department-name`);if(!e)return;let t=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId):void 0,n={id:t?.id??u(`department`),name:e,parentDepartmentId:this.getInputValue(`organisation-department-parent`)||void 0};t?Object.assign(t,n):this.data.departments.push(n),this.selectedDepartmentId=n.id,this.notifyChanged(),this.render()}deleteDepartment(){if(!this.selectedDepartmentId)return;let e=this.data.departments.find(e=>e.id===this.selectedDepartmentId);!e||!window.confirm(`Delete department ${e.name}? Department references will be cleared.`)||(this.data.departments=this.data.departments.filter(t=>t.id!==e.id),this.data.departments.forEach(t=>{t.parentDepartmentId===e.id&&(t.parentDepartmentId=void 0)}),this.data.roles.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.teams.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.positions.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.people.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.selectedDepartmentId=null,this.notifyChanged(),this.render())}saveRole(){let e=this.getInputValue(`organisation-role-name`);if(!e)return;let t=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId):void 0,n={id:t?.id??u(`role`),name:e,departmentId:this.getInputValue(`organisation-role-department`)||void 0};t?Object.assign(t,n):this.data.roles.push(n),this.selectedRoleId=n.id,this.notifyChanged(),this.render()}deleteRole(){if(!this.selectedRoleId)return;let e=this.data.roles.find(e=>e.id===this.selectedRoleId);!e||!window.confirm(`Delete role ${e.name}? Role references will be cleared from positions and legacy people records.`)||(this.data.roles=this.data.roles.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.data.people.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.selectedRoleId=null,this.notifyChanged(),this.render())}saveTeam(){let e=this.getInputValue(`organisation-team-name`);if(!e)return;let t=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId):void 0,n={id:t?.id??u(`team`),name:e,departmentId:this.getInputValue(`organisation-team-department`)||void 0};t?Object.assign(t,n):this.data.teams.push(n),this.selectedTeamId=n.id,this.notifyChanged(),this.render()}deleteTeam(){if(!this.selectedTeamId)return;let e=this.data.teams.find(e=>e.id===this.selectedTeamId);!e||!window.confirm(`Delete team ${e.name}? Team references will be cleared.`)||(this.data.teams=this.data.teams.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.data.people.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.selectedTeamId=null,this.notifyChanged(),this.render())}async resetFromRepository(){if(window.confirm(`Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.`))try{let e=await this.options.onReset();this.data=structuredClone(e),this.selectedPersonId=null,this.selectedPositionId=null,this.selectedDepartmentId=null,this.selectedRoleId=null,this.selectedTeamId=null,this.notifyChanged(),this.render()}catch(e){console.error(`Unable to reset organisation data.`,e),window.alert(`Unable to reset the organisation model from the repository.`)}}},he=`<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>`,ge=document.querySelector(`#app`);if(!ge)throw Error(`Application root element #app was not found.`);ge.innerHTML=`
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
`;function v(e){let t=document.getElementById(e);if(!t)throw Error(`Required element #${e} was not found.`);return t}var _e=v(`document-name`),ve=v(`process-level`),y=v(`breadcrumbs`),b=v(`status`),ye=v(`back-button`),be=v(`new-button`),xe=v(`open-button`),Se=v(`open-model-button`),Ce=v(`home-button`),we=v(`reset-button`),Te=v(`save-button`),Ee=v(`svg-button`),De=v(`metadata-button`),Oe=v(`organisation-button`),ke=v(`undo-button`),Ae=v(`redo-button`),je=v(`zoom-out-button`),Me=v(`fit-button`),Ne=v(`zoom-in-button`),x=v(`file-input`),Pe=v(`canvas`),Fe=v(`metadata-panel`),Ie=v(`metadata-close-button`),Le=v(`metadata-empty`),S=v(`metadata-form`),Re=v(`metadata-node-name`),ze=v(`metadata-node-type`),Be=v(`metadata-node-id`),Ve=v(`metadata-called-element-row`),He=v(`metadata-called-element`),Ue=v(`metadata-status`),We=v(`metadata-description`),C=v(`metadata-owner`),w=v(`metadata-responsible`),Ge=v(`metadata-process-links`),Ke=v(`metadata-link-type`),T=v(`metadata-link-target`),qe=v(`metadata-link-label`),Je=v(`metadata-link-add`),Ye=v(`metadata-systems`),Xe=v(`metadata-controls`),Ze=v(`metadata-risks`),Qe=v(`metadata-regulations`),$e=v(`metadata-notes`),et=v(`metadata-export-button`),tt=v(`metadata-reset-button`),E=v(`organisation-dialog`),nt=v(`organisation-manager-root`),D=new e({container:Pe,keyboard:{bindTo:window}}),O=null,k=`new-process.bpmn`,A,j=!1,M=!1,rt=!1,N=null,P=L(`Process_Custom`),F=le(),I=new me(nt,F,{onChange:e=>{F=e,ie(F),Y(),R(`Organisation changes saved locally`,`success`)},onExport:e=>{ae(e),R(`Organisation JSON downloaded`,`success`)},onReset:async()=>{let e=await se();return F=e,Y(),R(`Organisation reset to repository version`,`success`),e},onClose:()=>E.close()});function it(){return{status:``,description:``,ownerPersonId:``,responsibleType:``,responsibleId:``,links:[],systems:[],controls:[],risks:[],regulations:[],notes:``}}function at(e){let t=e.type;if(t!==`drill-down`&&t!==`related`&&t!==`exception`&&t!==`supporting`)return null;let n=e.targetProcessId?.trim()??``;return n?{id:e.id||`link-${crypto.randomUUID()}`,type:t,targetProcessId:n,label:e.label?.trim()??``}:null}function ot(e){let t=it();if(!e)return t;let n=Array.isArray(e.links)?e.links.map(e=>at(e)).filter(e=>!!e):[];return{status:e.status??``,description:e.description??``,ownerPersonId:e.ownerPersonId??``,responsibleType:e.responsibleType===`role`||e.responsibleType===`team`?e.responsibleType:``,responsibleId:e.responsibleId??``,links:n,systems:Array.isArray(e.systems)?e.systems:[],controls:Array.isArray(e.controls)?e.controls:[],risks:Array.isArray(e.risks)?e.risks:[],regulations:Array.isArray(e.regulations)?e.regulations:[],notes:e.notes??``}}function st(e,t){let n=Object.fromEntries(Object.entries(e.nodes??{}).map(([e,t])=>[e,ot(t)]));return{schemaVersion:3,processId:e.processId||t,nodes:n}}function L(e){return{schemaVersion:3,processId:e,nodes:{}}}function R(e,t=`normal`){b.textContent=e,b.classList.remove(`status-success`,`status-error`),t===`success`?b.classList.add(`status-success`):t===`error`&&b.classList.add(`status-error`)}function ct(e){let t=e.trim();return t?/\.(bpmn|xml)$/i.test(t)?t:`${t}.bpmn`:`process.bpmn`}function lt(e){return e.replace(/\.(bpmn|xml)$/i,``)+`.svg`}function ut(){let e=B();return e?`${e.id}.json`:k.replace(/\.(bpmn|xml)$/i,``)+`.json`}function z(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function dt(){return D.get(`canvas`)}function ft(){return D.get(`commandStack`)}function pt(){return D.get(`elementRegistry`)}function mt(){return D.get(`overlays`)}function B(){return h(O??void 0)??null}function ht(e){let t=e.businessObject;return t?.$type!==`bpmn:CallActivity`||!t.calledElement?null:pe(t.calledElement)??null}function V(e){return P.nodes[e]??it()}function gt(e){let t=V(e).links.find(e=>e.type===`drill-down`&&h(e.targetProcessId)?.active);return t?h(t.targetProcessId)??null:null}function _t(e){return ht(e)??gt(e.id)}function vt(e){let t=[e],n=e.parentId,r=new Set([e.id]);for(;n&&!r.has(n);){let e=h(n);if(!e)break;r.add(e.id),t.unshift(e),n=e.parentId}return t}function H(){y.replaceChildren();let e=B();if(!e){ve.textContent=`Custom`,_e.textContent=k,ye.disabled=!0,we.disabled=!0;let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=k,y.appendChild(e);return}ve.textContent=e.level,_e.textContent=e.name,ye.disabled=!e.parentId,we.disabled=!1,vt(e).forEach((t,n)=>{if(n>0){let e=document.createElement(`span`);e.className=`breadcrumb-separator`,e.textContent=`›`,y.appendChild(e)}if(t.id===e.id){let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=`${t.level} ${t.name}`,y.appendChild(e);return}let r=document.createElement(`button`);r.className=`breadcrumb-button`,r.type=`button`,r.textContent=`${t.level} ${t.name}`,r.addEventListener(`click`,()=>void $(t.id)),y.appendChild(r)})}function yt(){let e=ft();ke.disabled=!e.canUndo(),Ae.disabled=!e.canRedo()}function U(){try{dt().zoom(`fit-viewport`)}catch(e){console.error(`Unable to fit BPMN diagram to viewport.`,e)}}function bt(e){let t=dt(),n=t.zoom();t.zoom(Math.max(.2,Math.min(4,n+e)))}function xt(e=O){return e?`${m}${e}.xml`:`${m}custom.xml`}function St(e=O){return e?`${m}${e}.filename`:`${m}custom.filename`}function W(e=O){return e?`${de}${e}`:`${de}custom`}function G(){if(!M)return;let e=mt();e.clear();let t=dt();pt().getAll().forEach(n=>{let r=_t(n),i=V(n.id).links.filter(e=>h(e.targetProcessId));r&&(t.addMarker(n.id,`drill-down-target`),e.add(n.id,{position:{top:-30,right:0},html:`<div class="drill-down-badge" title="Open ${K(r.name)}">↘ ${K(r.level)}</div>`}));let a=i.filter(e=>!(e.type===`drill-down`&&r?.id===e.targetProcessId)).length;a>0&&e.add(n.id,{position:{bottom:-26,right:0},html:`<div class="process-link-badge" title="${a} additional linked process${a===1?``:`es`}">↗ ${a}</div>`})})}function K(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Ct(e){rt=e,Fe.classList.toggle(`metadata-panel-hidden`,!e),De.classList.toggle(`toolbar-button-active`,e),De.setAttribute(`aria-pressed`,String(e)),window.setTimeout(()=>U(),0)}function wt(e){return e?e.replace(/^bpmn:/,``).replace(/([a-z])([A-Z])/g,`$1 $2`):`BPMN element`}function q(e){return e.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0)}function J(e){return(e??[]).join(`
`)}function Tt(e){let t=[d(F,oe(F,e)),c(F,te(F,e))].filter(Boolean);return t.length>0?`${e.name} — ${t.join(` · `)}`:e.name}function Et(e){C.replaceChildren(new Option(`Not set`,``));let t=[...F.people].filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name));t.forEach(e=>{C.add(new Option(Tt(e),e.id))}),e&&!t.some(t=>t.id===e)&&C.add(new Option(`[Missing or inactive person] ${e}`,e)),C.value=e}function Dt(e){return e.responsibleType&&e.responsibleId?`${e.responsibleType}:${e.responsibleId}`:``}function Ot(e){w.replaceChildren(new Option(`Not set`,``));let t=document.createElement(`optgroup`);t.label=`Roles`,[...F.roles].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let n=c(F,e.departmentId);t.appendChild(new Option(n?`${e.name} — ${n}`:e.name,`role:${e.id}`))});let n=document.createElement(`optgroup`);n.label=`Teams`,[...F.teams].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let t=c(F,e.departmentId);n.appendChild(new Option(t?`${e.name} — ${t}`:e.name,`team:${e.id}`))}),t.children.length>0&&w.appendChild(t),n.children.length>0&&w.appendChild(n);let r=Dt(e);r&&!Array.from(w.options).some(e=>e.value===r)&&w.add(new Option(`[Missing reference] ${r}`,r)),w.value=r}function kt(e){if(!e)return{type:``,id:``};let t=e.indexOf(`:`);if(t<1)return{type:``,id:``};let n=e.slice(0,t),r=e.slice(t+1);return n!==`role`&&n!==`team`||!r?{type:``,id:``}:{type:n,id:r}}function At(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;default:return`Related`}}function jt(){T.replaceChildren(new Option(`Select process`,``));let e=[...fe].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence),t=Object.values(p).filter(e=>e.active&&e.id!==O);e.forEach(e=>{let n=t.filter(t=>t.layerId===e.id).sort((e,t)=>e.name.localeCompare(t.name));if(n.length===0)return;let r=document.createElement(`optgroup`);r.label=`${e.code} — ${e.name}`,n.forEach(e=>{r.appendChild(new Option(e.name,e.id))}),T.appendChild(r)});let n=t.filter(e=>!fe.some(t=>t.id===e.layerId)).sort((e,t)=>e.name.localeCompare(t.name));if(n.length>0){let e=document.createElement(`optgroup`);e.label=`Unlayered`,n.forEach(t=>e.appendChild(new Option(t.name,t.id))),T.appendChild(e)}}function Mt(e){if(Ge.replaceChildren(),e.links.length===0){let e=document.createElement(`div`);e.className=`organisation-muted`,e.textContent=`No linked processes.`,Ge.appendChild(e)}else e.links.forEach(e=>{let t=h(e.targetProcessId),n=document.createElement(`div`);n.className=`process-link-row`;let r=document.createElement(`div`);r.className=`process-link-copy`,r.innerHTML=`
        <div class="process-link-primary">
          ${K(At(e.type))} → ${K(t?.name??e.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${K(t?.level??`Missing process`)}${e.label?` · ${K(e.label)}`:``}
        </div>
      `;let i=document.createElement(`button`);i.type=`button`,i.className=`process-link-remove`,i.textContent=`Remove`,i.dataset.processLinkId=e.id,i.addEventListener(`click`,()=>Ft(e.id)),n.append(r,i),Ge.appendChild(n)});jt()}function Y(){if(!N){Le.hidden=!1,S.hidden=!0;return}let e=N.businessObject,t=V(N.id);Le.hidden=!0,S.hidden=!1,Re.textContent=e?.name||N.id,ze.textContent=wt(e?.$type),Be.value=N.id,e?.calledElement?(Ve.hidden=!1,He.value=e.calledElement):(Ve.hidden=!0,He.value=``),Ue.value=t.status,We.value=t.description,Et(t.ownerPersonId),Ot(t),Mt(t),Ye.value=J(t.systems),Xe.value=J(t.controls),Ze.value=J(t.risks),Qe.value=J(t.regulations),$e.value=t.notes}function Nt(){localStorage.setItem(W(),JSON.stringify(P,null,2));let e=B();e&&a(e.metadataUrl,P)}function X(e=!0){if(!N)return;let t=kt(w.value),n=V(N.id);P.nodes[N.id]={status:Ue.value,description:We.value.trim(),ownerPersonId:C.value,responsibleType:t.type,responsibleId:t.id,links:n.links,systems:q(Ye.value),controls:q(Xe.value),risks:q(Ze.value),regulations:q(Qe.value),notes:$e.value.trim()},Nt(),G(),e&&R(`Metadata saved locally`,`success`)}function Pt(){if(!N)return;let e=T.value,t=Ke.value;if(!e||!h(e)){window.alert(`Select a target process.`);return}X(!1);let n=V(N.id);t===`drill-down`&&n.links.some(e=>e.type===`drill-down`)&&!window.confirm(`This node already has a metadata drill-down link. Add another drill-down relationship?`)||(n.links.push({id:`link-${crypto.randomUUID()}`,type:t,targetProcessId:e,label:qe.value.trim()}),P.nodes[N.id]=n,Nt(),qe.value=``,Y(),G(),R(`Process link saved locally`,`success`))}function Ft(e){if(!N)return;X(!1);let t=V(N.id);t.links=t.links.filter(t=>t.id!==e),P.nodes[N.id]=t,Nt(),Y(),G(),R(`Process link removed`,`success`)}function It(){z(ut(),`${JSON.stringify(P,null,2)}\n`,`application/json;charset=utf-8`),R(`Metadata JSON downloaded`,`success`)}async function Lt(e){return st(await r(e.metadataUrl),e.bpmnProcessId)}async function Rt(e,t){if(t&&!s()){let t=localStorage.getItem(W(e.id));if(t)try{return st(JSON.parse(t),e.bpmnProcessId)}catch(e){console.warn(`Unable to parse locally saved metadata; repository metadata will be used.`,e)}}try{return await Lt(e)}catch(t){return console.warn(`Unable to load repository metadata; using an empty metadata record.`,t),L(e.bpmnProcessId)}}async function zt(){let e=B(),t=e?`${e.level} ${e.name}`:`the current custom process`;if(window.confirm(`Reset all metadata for ${t} to the repository version? Any locally saved metadata changes for this process will be discarded.`)){if(!e){P=L(`Process_Custom`),N=null,localStorage.removeItem(W()),Y(),G(),R(`Custom metadata cleared`,`success`);return}localStorage.removeItem(W(e.id)),P=await Rt(e,!1),Y(),G(),R(`${e.level} metadata reset to repository version`,`success`)}}async function Z(){if(!(j||!M))try{let e=await D.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML while autosaving.`);localStorage.setItem(xt(),e.xml),localStorage.setItem(St(),k);let r=B();r&&await t(r.url,e.xml),R(s()?`Saved to ${n()}`:`Saved locally`,`success`)}catch(e){console.error(`Unable to autosave BPMN diagram.`,e),R(`Autosave failed`,`error`)}}function Bt(){j||(A!==void 0&&window.clearTimeout(A),R(`Unsaved changes`),A=window.setTimeout(()=>void Z(),500))}async function Q(e,t){j=!0,k=ct(t),N=null,H(),Y(),R(`Loading process…`);try{let t=await D.importXML(e);M=!0,U(),yt(),G();let n=t.warnings?.length??0;n>0?(console.warn(`BPMN import warnings:`,t.warnings),R(`Loaded with ${n} warning${n===1?``:`s`}`)):R(`Process loaded`,`success`)}catch(e){throw M=!1,console.error(`Unable to import BPMN diagram.`,e),R(`Unable to load BPMN process`,`error`),e}finally{j=!1}}async function Vt(e){return o(e.url)}async function $(e,t=!0){let n=h(e);if(!n){R(`Unknown process: ${e}`,`error`);return}M&&O!==e&&await Z(),A!==void 0&&(window.clearTimeout(A),A=void 0),O=n.id,k=n.filename,N=null,P=await Rt(n,t),H(),Y(),R(`Loading ${n.level} ${n.name}…`);try{let e=t&&!s()?localStorage.getItem(xt()):null;if(e){await Q(e,n.filename),R(`Restored ${n.level} ${n.name} from local autosave`,`success`);return}await Q(await Vt(n),n.filename)}catch(e){console.error(`Unable to load process ${n.id}.`,e),R(`Unable to load ${n.name}`,`error`)}}async function Ht(){let e=B();e&&window.confirm(`Reset ${e.level} ${e.name} to the repository BPMN? Local diagram changes will be discarded.`)&&(localStorage.removeItem(xt()),localStorage.removeItem(St()),await $(e.id,!1),R(`${e.level} ${e.name} reset to repository version`,`success`))}async function Ut(){await Z(),O=null,k=`new-process.bpmn`,P=L(`Process_Custom`),N=null,H(),Y();try{await Q(he,k)}catch(e){console.error(`Unable to create new BPMN process.`,e)}}async function Wt(){R(`Preparing BPMN…`);try{let e=await D.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML.`);if(s()){let n=B();n?await t(n.url,e.xml):z(ct(k),e.xml,`application/xml;charset=utf-8`)}else z(ct(k),e.xml,`application/xml;charset=utf-8`);await Z(),R(s()?`BPMN saved to Enterprise Model folder`:`BPMN downloaded`,`success`)}catch(e){console.error(`Unable to save BPMN file.`,e),R(`Unable to save BPMN`,`error`)}}async function Gt(){R(`Preparing SVG…`);try{let e=await D.saveSVG();if(!e.svg)throw Error(`bpmn-js returned no SVG.`);z(lt(k),e.svg,`image/svg+xml;charset=utf-8`),R(`SVG downloaded`,`success`)}catch(e){console.error(`Unable to export SVG.`,e),R(`Unable to export SVG`,`error`)}}async function Kt(e){await Z(),O=null,k=e.name,P=L(`Process_Custom`),N=null,H(),Y(),R(`Opening ${e.name}…`);try{await Q(await e.text(),e.name)}catch(t){console.error(`Unable to open ${e.name}.`,t),R(`Unable to open ${e.name}`,`error`)}}function qt(){let e=B(),t=e?.parentId;if(t&&t!==e.id&&h(t)){$(t);return}let n=h(f);n&&n.id!==e?.id&&$(n.id)}function Jt(e){if(!e.element)return;let t=_t(e.element);t&&(e.originalEvent?.preventDefault(),e.originalEvent?.stopPropagation(),$(t.id))}function Yt(e){N=e.newSelection?.[0]??null,Y();let t=N?.businessObject;document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-node-selection-changed`,{detail:N?{processId:O??``,elementId:N.id,name:t?.name||N.id,bpmnType:t?.$type||``}:null}))}function Xt(){I.setData(F),E.open||E.showModal()}function Zt(){H(),Y(),G()}function Qt(e){let t=e.detail;t?.processId&&$(t.processId)}async function $t(){try{let e=await i();await Z();let t=ee(e);await ue(!1),F=await re(!1),I.setData(F);let n=h(f)??Object.values(p).find(e=>e.active)??Object.values(p)[0];n&&await $(n.id,!1),R(`Enterprise Model opened: ${t}`,`success`)}catch(e){console.error(`Unable to open Enterprise Model folder.`,e),R(e instanceof Error?e.message:`Unable to open Enterprise Model folder`,`error`)}}async function en(){try{await ue(!0)}catch(e){console.error(`Unable to initialise process repository.`,e),R(`Unable to initialise process repository`,`error`);return}F=await re(!0),I.setData(F),H(),Y();let e=h(f)??Object.values(p).find(e=>e.active)??Object.values(p)[0];e?await $(e.id):await Ut()}ye.addEventListener(`click`,qt),be.addEventListener(`click`,()=>void Ut()),xe.addEventListener(`click`,()=>{x.value=``,x.click()}),Se.addEventListener(`click`,()=>void $t()),document.addEventListener(`enterprise-modeler:open-enterprise-model`,()=>void $t()),Ce.addEventListener(`click`,()=>{let e=h(f);e&&$(e.id)}),we.addEventListener(`click`,()=>void Ht()),Te.addEventListener(`click`,()=>void Wt()),Ee.addEventListener(`click`,()=>void Gt()),De.addEventListener(`click`,()=>Ct(!rt)),Ie.addEventListener(`click`,()=>Ct(!1)),Oe.addEventListener(`click`,Xt),ke.addEventListener(`click`,()=>ft().undo()),Ae.addEventListener(`click`,()=>ft().redo()),je.addEventListener(`click`,()=>bt(-.1)),Me.addEventListener(`click`,U),Ne.addEventListener(`click`,()=>bt(.1)),et.addEventListener(`click`,It),tt.addEventListener(`click`,()=>void zt()),Je.addEventListener(`click`,Pt),S.addEventListener(`submit`,e=>{e.preventDefault(),X()}),x.addEventListener(`change`,()=>{let e=x.files?.[0];e&&Kt(e)}),E.addEventListener(`click`,e=>{e.target===E&&E.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,Zt),document.addEventListener(`enterprise-modeler:open-process`,Qt),D.on(`commandStack.changed`,()=>{yt(),Bt()}),D.on(`element.dblclick`,Jt),D.on(`selection.changed`,Yt),window.addEventListener(`resize`,U),en();