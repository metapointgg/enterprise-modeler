import{t as e}from"./Modeler-Bi03ARIg.js";import{a as t,i as n,n as r,o as i,r as a,s as o,t as ee}from"./modelWorkspace-7JVn5QeO.js";import{a as te,c as ne,f as re,i as s,l as c,m as ie,n as ae,o as oe,p as se,r as l,s as ce,t as le,u}from"./organisation-BBYfIWRJ.js";import{a as d,f as ue,i as de,n as f,r as fe,s as pe,t as p,u as m}from"./processCatalog-CK1Cozcb.js";/* empty css             */function h(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function g(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var me=class{root;options;data;activeTab=`people`;selectedPersonId=null;selectedPositionId=null;selectedDepartmentId=null;selectedRoleId=null;selectedTeamId=null;constructor(e,t,n){this.root=e,this.data=structuredClone(t),this.options=n,this.render()}setData(e){this.data=structuredClone(e),this.ensureSelectionsExist(),this.render()}getData(){return structuredClone(this.data)}ensureSelectionsExist(){this.selectedPersonId&&!this.data.people.some(e=>e.id===this.selectedPersonId)&&(this.selectedPersonId=null),this.selectedPositionId&&!this.data.positions.some(e=>e.id===this.selectedPositionId)&&(this.selectedPositionId=null),this.selectedDepartmentId&&!this.data.departments.some(e=>e.id===this.selectedDepartmentId)&&(this.selectedDepartmentId=null),this.selectedRoleId&&!this.data.roles.some(e=>e.id===this.selectedRoleId)&&(this.selectedRoleId=null),this.selectedTeamId&&!this.data.teams.some(e=>e.id===this.selectedTeamId)&&(this.selectedTeamId=null)}notifyChanged(){this.options.onChange(this.getData())}render(){let e=this.selectedEntityReference();this.root.innerHTML=`
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
    `,this.bindCommonEvents(),this.bindActiveTabEvents()}renderTabButton(e,t){return`<button class="organisation-tab${this.activeTab===e?` organisation-tab-active`:``}" type="button" data-tab="${e}">${t}</button>`}renderActiveTab(){switch(this.activeTab){case`positions`:return this.renderPositions();case`departments`:return this.renderDepartments();case`roles`:return this.renderRoles();case`teams`:return this.renderTeams();default:return this.renderPeople()}}renderPeople(){let e=g(this.data.people),t=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No people have been added yet.</div>`:e.map(e=>{let t=[ne(this.data,e.positionId),u(this.data,oe(this.data,e)),s(this.data,te(this.data,e))].filter(Boolean).join(` · `)||e.email||`No position assigned`;return`
            <button class="organisation-list-item${e.id===this.selectedPersonId?` organisation-list-item-selected`:``}" type="button" data-edit-person="${h(e.id)}">
              <span class="organisation-list-primary">${h(e.name)}</span>
              <span class="organisation-list-secondary">${h(t)}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(t)}
        </div>
      </div>
    `}renderPersonForm(e){let t=g(this.data.positions).filter(t=>t.id===e?.positionId||t.active&&c(this.data,t.id).length===0).map(t=>{let n=u(this.data,t.roleId),r=s(this.data,t.departmentId),i=[t.name,n,r].filter(Boolean).join(` — `);return`<option value="${h(t.id)}"${t.id===e?.positionId?` selected`:``}>${h(i)}</option>`}).join(``),n=e?ce(this.data,e.positionId):void 0,r=n?u(this.data,n.roleId):``,i=n?s(this.data,n.departmentId):``,a=n?ne(this.data,n.managerPositionId):``,o=g(this.data.departments).map(t=>`<option value="${h(t.id)}"${t.id===e?.departmentId?` selected`:``}>${h(t.name)}</option>`).join(``),ee=g(this.data.roles).map(t=>`<option value="${h(t.id)}"${t.id===e?.roleId?` selected`:``}>${h(t.name)}</option>`).join(``),te=g(this.data.people.filter(t=>t.id!==e?.id)).map(t=>`<option value="${h(t.id)}"${t.id===e?.managerPersonId?` selected`:``}>${h(t.name)}</option>`).join(``),re=g(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${h(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${h(t.name)}</span>
        </label>
      `).join(``);return`
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit person`:`Add person`}</div>
        ${e?`<div class="organisation-record-id">${h(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${h(e?.name??``)}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${h(e?.email??``)}" />
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
            <strong>${h(n.name)}</strong><br />
            Role: ${h(r||`Not set`)}<br />
            Department: ${h(i||`Not set`)}<br />
            Reports to position: ${h(a||`Not set`)}
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
                ${re||`<span class="organisation-muted">No teams defined.</span>`}
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
          <textarea id="organisation-person-notes" rows="3">${h(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Person`:`Add Person`}</button>
          ${e?`<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderPositions(){let e=g(this.data.positions),t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No positions have been added yet.</div>`:e.map(e=>{let t=u(this.data,e.roleId),n=s(this.data,e.departmentId),r=c(this.data,e.id),i=r.length===0?`Vacant`:r.map(e=>e.name).join(`, `);return`
            <button class="organisation-list-item${e.id===this.selectedPositionId?` organisation-list-item-selected`:``}" type="button" data-edit-position="${h(e.id)}">
              <span class="organisation-list-primary">${h(e.name)}</span>
              <span class="organisation-list-secondary">${h([t,n,i].filter(Boolean).join(` · `))}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(t)}
        </div>
      </div>
    `}renderPositionForm(e){let t=g(this.data.roles).map(t=>`<option value="${h(t.id)}"${t.id===e?.roleId?` selected`:``}>${h(t.name)}</option>`).join(``),n=this.renderDepartmentOptions(e?.departmentId),r=g(this.data.positions.filter(t=>t.id!==e?.id)).map(t=>{let n=u(this.data,t.roleId),r=n?`${t.name} — ${n}`:t.name;return`<option value="${h(t.id)}"${t.id===e?.managerPositionId?` selected`:``}>${h(r)}</option>`}).join(``),i=g(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${h(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${h(t.name)}</span>
        </label>
      `).join(``),a=e?c(this.data,e.id):[];return`
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit position`:`Add position`}</div>
        ${e?`<div class="organisation-record-id">${h(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${h(e?.name??``)}" placeholder="e.g. Operations Analyst 01" />
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
            Current occupant: ${h(a.length>0?a.map(e=>e.name).join(`, `):`VACANT`)}
          </div>
        `:``}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${h(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Position`:`Add Position`}</button>
          ${e?`<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartments(){return this.renderReferenceSection(`Department`,`department`,g(this.data.departments),this.selectedDepartmentId,this.renderDepartmentForm())}renderDepartmentForm(){let e=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId)??null:null,t=g(this.data.departments.filter(t=>t.id!==e?.id)).map(t=>`<option value="${h(t.id)}"${t.id===e?.parentDepartmentId?` selected`:``}>${h(t.name)}</option>`).join(``);return`
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit department`:`Add department`}</div>
        ${e?`<div class="organisation-record-id">${h(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${h(e?.name??``)}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${t}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Department`:`Add Department`}</button>
          ${e?`<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderRoles(){return this.renderReferenceSection(`Role`,`role`,g(this.data.roles),this.selectedRoleId,this.renderRoleForm())}renderRoleForm(){let e=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit role`:`Add role`}</div>
        ${e?`<div class="organisation-record-id">${h(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${h(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Role`:`Add Role`}</button>
          ${e?`<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderTeams(){return this.renderReferenceSection(`Team`,`team`,g(this.data.teams),this.selectedTeamId,this.renderTeamForm())}renderTeamForm(){let e=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit team`:`Add team`}</div>
        ${e?`<div class="organisation-record-id">${h(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${h(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Team`:`Add Team`}</button>
          ${e?`<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartmentOptions(e){return g(this.data.departments).map(t=>`<option value="${h(t.id)}"${t.id===e?` selected`:``}>${h(t.name)}</option>`).join(``)}renderReferenceSection(e,t,n,r,i){return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${e}s</span>
            <button id="organisation-new-${t}" class="toolbar-button" type="button">New ${e}</button>
          </div>
          <div class="organisation-list">${n.length===0?`<div class="organisation-empty">No ${e.toLowerCase()}s have been added yet.</div>`:n.map(e=>`
          <button class="organisation-list-item${e.id===r?` organisation-list-item-selected`:``}" type="button" data-edit-${t}="${h(e.id)}">
            <span class="organisation-list-primary">${h(e.name)}</span>
          </button>
        `).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">${i}</div>
      </div>
    `}selectedEntityReference(){switch(this.activeTab){case`people`:return this.selectedPersonId?{type:`person`,id:this.selectedPersonId}:null;case`positions`:return this.selectedPositionId?{type:`position`,id:this.selectedPositionId}:null;case`roles`:return this.selectedRoleId?{type:`role`,id:this.selectedRoleId}:null;case`departments`:return this.selectedDepartmentId?{type:`department`,id:this.selectedDepartmentId}:null;case`teams`:return this.selectedTeamId?{type:`team`,id:this.selectedTeamId}:null;default:return null}}openSelectedInExplorer(e){let t=this.selectedEntityReference();t&&(this.options.onClose(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{...t,mode:e}})))}bindCommonEvents(){this.root.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t&&(this.activeTab=t,this.render())})}),this.root.querySelector(`#organisation-close`)?.addEventListener(`click`,this.options.onClose),this.root.querySelector(`#organisation-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#organisation-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.root.querySelector(`#organisation-export`)?.addEventListener(`click`,()=>this.options.onExport(this.getData())),this.root.querySelector(`#organisation-reset`)?.addEventListener(`click`,()=>void this.resetFromRepository())}bindActiveTabEvents(){this.activeTab===`people`?this.bindPeopleEvents():this.activeTab===`positions`?this.bindPositionEvents():this.activeTab===`departments`?this.bindDepartmentEvents():this.activeTab===`roles`?this.bindRoleEvents():this.bindTeamEvents()}bindPeopleEvents(){this.root.querySelector(`#organisation-new-person`)?.addEventListener(`click`,()=>{this.selectedPersonId=null,this.render()}),this.root.querySelectorAll(`[data-edit-person]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPersonId=e.dataset.editPerson??null,this.render()})}),this.root.querySelector(`#organisation-person-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePerson()}),this.root.querySelector(`#organisation-delete-person`)?.addEventListener(`click`,()=>this.deletePerson())}bindPositionEvents(){this.root.querySelector(`#organisation-new-position`)?.addEventListener(`click`,()=>{this.selectedPositionId=null,this.render()}),this.root.querySelectorAll(`[data-edit-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPositionId=e.dataset.editPosition??null,this.render()})}),this.root.querySelector(`#organisation-position-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePosition()}),this.root.querySelector(`#organisation-delete-position`)?.addEventListener(`click`,()=>this.deletePosition())}bindDepartmentEvents(){this.root.querySelector(`#organisation-new-department`)?.addEventListener(`click`,()=>{this.selectedDepartmentId=null,this.render()}),this.root.querySelectorAll(`[data-edit-department]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedDepartmentId=e.dataset.editDepartment??null,this.render()})}),this.root.querySelector(`#organisation-department-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveDepartment()}),this.root.querySelector(`#organisation-delete-department`)?.addEventListener(`click`,()=>this.deleteDepartment())}bindRoleEvents(){this.root.querySelector(`#organisation-new-role`)?.addEventListener(`click`,()=>{this.selectedRoleId=null,this.render()}),this.root.querySelectorAll(`[data-edit-role]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedRoleId=e.dataset.editRole??null,this.render()})}),this.root.querySelector(`#organisation-role-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveRole()}),this.root.querySelector(`#organisation-delete-role`)?.addEventListener(`click`,()=>this.deleteRole())}bindTeamEvents(){this.root.querySelector(`#organisation-new-team`)?.addEventListener(`click`,()=>{this.selectedTeamId=null,this.render()}),this.root.querySelectorAll(`[data-edit-team]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedTeamId=e.dataset.editTeam??null,this.render()})}),this.root.querySelector(`#organisation-team-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveTeam()}),this.root.querySelector(`#organisation-delete-team`)?.addEventListener(`click`,()=>this.deleteTeam())}getInputValue(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}savePerson(){let e=this.getInputValue(`organisation-person-name`);if(!e)return;let t=this.getInputValue(`organisation-person-position`)||void 0,n=this.root.querySelector(`#organisation-person-active`)?.checked??!0,r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId):void 0;if(t&&n){let e=this.data.people.find(e=>e.active&&e.positionId===t&&e.id!==r?.id);if(e){window.alert(`That position is already occupied by ${e.name}.`);return}}let i=!!t,a=i?[]:Array.from(this.root.querySelectorAll(`input[name="teamIds"]:checked`)).map(e=>e.value),o={id:r?.id??l(`person`),name:e,email:this.getInputValue(`organisation-person-email`),positionId:t,departmentId:i?void 0:this.getInputValue(`organisation-person-department`)||void 0,roleId:i?void 0:this.getInputValue(`organisation-person-role`)||void 0,managerPersonId:i?void 0:this.getInputValue(`organisation-person-manager`)||void 0,teamIds:a,active:n,notes:this.getInputValue(`organisation-person-notes`)};r?Object.assign(r,o):this.data.people.push(o),this.selectedPersonId=o.id,this.notifyChanged(),this.render()}deletePerson(){if(!this.selectedPersonId)return;let e=this.data.people.find(e=>e.id===this.selectedPersonId);!e||!window.confirm(`Delete ${e.name}? Existing process metadata references to this person will become unresolved.`)||(this.data.people=this.data.people.filter(t=>t.id!==e.id),this.data.people.forEach(t=>{t.managerPersonId===e.id&&(t.managerPersonId=void 0)}),this.selectedPersonId=null,this.notifyChanged(),this.render())}savePosition(){let e=this.getInputValue(`organisation-position-name`);if(!e)return;let t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId):void 0,n=this.getInputValue(`organisation-position-manager`)||void 0,r=t?.id??l(`position`);if(n&&this.wouldCreatePositionCycle(r,n)){window.alert(`That reporting relationship would create a circular Position hierarchy.`);return}let i=Array.from(this.root.querySelectorAll(`input[name="positionTeamIds"]:checked`)).map(e=>e.value),a=this.root.querySelector(`#organisation-position-active`)?.checked??!0,o={id:r,name:e,roleId:this.getInputValue(`organisation-position-role`)||void 0,departmentId:this.getInputValue(`organisation-position-department`)||void 0,managerPositionId:n,teamIds:i,active:a,notes:this.getInputValue(`organisation-position-notes`)};t?Object.assign(t,o):this.data.positions.push(o),this.selectedPositionId=o.id,this.notifyChanged(),this.render()}wouldCreatePositionCycle(e,t){let n=t,r=new Set;for(;n;){if(n===e||r.has(n))return!0;r.add(n),n=this.data.positions.find(e=>e.id===n)?.managerPositionId}return!1}deletePosition(){if(!this.selectedPositionId)return;let e=this.data.positions.find(e=>e.id===this.selectedPositionId);if(!e)return;let t=c(this.data,e.id),n=t.length>0?` ${t.map(e=>e.name).join(`, `)} will become unassigned.`:``;window.confirm(`Delete position ${e.name}?${n} Child positions will become top-level/unassigned.`)&&(this.data.positions=this.data.positions.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.managerPositionId===e.id&&(t.managerPositionId=void 0)}),this.data.people.forEach(t=>{t.positionId===e.id&&(t.positionId=void 0)}),this.selectedPositionId=null,this.notifyChanged(),this.render())}saveDepartment(){let e=this.getInputValue(`organisation-department-name`);if(!e)return;let t=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId):void 0,n={id:t?.id??l(`department`),name:e,parentDepartmentId:this.getInputValue(`organisation-department-parent`)||void 0};t?Object.assign(t,n):this.data.departments.push(n),this.selectedDepartmentId=n.id,this.notifyChanged(),this.render()}deleteDepartment(){if(!this.selectedDepartmentId)return;let e=this.data.departments.find(e=>e.id===this.selectedDepartmentId);!e||!window.confirm(`Delete department ${e.name}? Department references will be cleared.`)||(this.data.departments=this.data.departments.filter(t=>t.id!==e.id),this.data.departments.forEach(t=>{t.parentDepartmentId===e.id&&(t.parentDepartmentId=void 0)}),this.data.roles.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.teams.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.positions.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.people.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.selectedDepartmentId=null,this.notifyChanged(),this.render())}saveRole(){let e=this.getInputValue(`organisation-role-name`);if(!e)return;let t=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId):void 0,n={id:t?.id??l(`role`),name:e,departmentId:this.getInputValue(`organisation-role-department`)||void 0};t?Object.assign(t,n):this.data.roles.push(n),this.selectedRoleId=n.id,this.notifyChanged(),this.render()}deleteRole(){if(!this.selectedRoleId)return;let e=this.data.roles.find(e=>e.id===this.selectedRoleId);!e||!window.confirm(`Delete role ${e.name}? Role references will be cleared from positions and legacy people records.`)||(this.data.roles=this.data.roles.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.data.people.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.selectedRoleId=null,this.notifyChanged(),this.render())}saveTeam(){let e=this.getInputValue(`organisation-team-name`);if(!e)return;let t=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId):void 0,n={id:t?.id??l(`team`),name:e,departmentId:this.getInputValue(`organisation-team-department`)||void 0};t?Object.assign(t,n):this.data.teams.push(n),this.selectedTeamId=n.id,this.notifyChanged(),this.render()}deleteTeam(){if(!this.selectedTeamId)return;let e=this.data.teams.find(e=>e.id===this.selectedTeamId);!e||!window.confirm(`Delete team ${e.name}? Team references will be cleared.`)||(this.data.teams=this.data.teams.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.data.people.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.selectedTeamId=null,this.notifyChanged(),this.render())}async resetFromRepository(){if(window.confirm(`Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.`))try{let e=await this.options.onReset();this.data=structuredClone(e),this.selectedPersonId=null,this.selectedPositionId=null,this.selectedDepartmentId=null,this.selectedRoleId=null,this.selectedTeamId=null,this.notifyChanged(),this.render()}catch(e){console.error(`Unable to reset organisation data.`,e),window.alert(`Unable to reset the organisation model from the repository.`)}}},he=`<?xml version="1.0" encoding="UTF-8"?>
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
`;function _(e){let t=document.getElementById(e);if(!t)throw Error(`Required element #${e} was not found.`);return t}var _e=_(`document-name`),ve=_(`process-level`),v=_(`breadcrumbs`),y=_(`status`),ye=_(`back-button`),be=_(`new-button`),xe=_(`open-button`),Se=_(`open-model-button`),Ce=_(`home-button`),b=_(`reset-button`),we=_(`save-button`),Te=_(`svg-button`),x=_(`metadata-button`),Ee=_(`organisation-button`),De=_(`undo-button`),Oe=_(`redo-button`),ke=_(`zoom-out-button`),Ae=_(`fit-button`),je=_(`zoom-in-button`),S=_(`file-input`),Me=_(`canvas`),Ne=_(`metadata-panel`),Pe=_(`metadata-close-button`),Fe=_(`metadata-empty`),C=_(`metadata-form`),Ie=_(`metadata-node-name`),Le=_(`metadata-node-type`),Re=_(`metadata-node-id`),ze=_(`metadata-called-element-row`),Be=_(`metadata-called-element`),Ve=_(`metadata-status`),He=_(`metadata-description`),w=_(`metadata-owner`),T=_(`metadata-responsible`),Ue=_(`metadata-process-links`),We=_(`metadata-link-type`),E=_(`metadata-link-target`),Ge=_(`metadata-link-label`),Ke=_(`metadata-link-add`),qe=_(`metadata-systems`),Je=_(`metadata-controls`),Ye=_(`metadata-risks`),Xe=_(`metadata-regulations`),Ze=_(`metadata-notes`),Qe=_(`metadata-export-button`),$e=_(`metadata-reset-button`),D=_(`organisation-dialog`),et=_(`organisation-manager-root`),O=new e({container:Me,keyboard:{bindTo:window}}),k=null,A=`new-process.bpmn`,j,M=!1,N=!1,tt=!1,P=null,F=R(`Process_Custom`),I=le(),L=new me(et,I,{onChange:e=>{I=e,ie(I),X(),z(`Organisation changes saved locally`,`success`)},onExport:e=>{ae(e),z(`Organisation JSON downloaded`,`success`)},onReset:async()=>{let e=await se();return I=e,X(),z(`Organisation reset to repository version`,`success`),e},onClose:()=>D.close()});function nt(){return{status:``,description:``,ownerPersonId:``,responsibleType:``,responsibleId:``,links:[],systems:[],controls:[],risks:[],regulations:[],notes:``}}function rt(e){let t=e.type;if(t!==`drill-down`&&t!==`related`&&t!==`exception`&&t!==`supporting`)return null;let n=e.targetProcessId?.trim()??``;return n?{id:e.id||`link-${crypto.randomUUID()}`,type:t,targetProcessId:n,label:e.label?.trim()??``}:null}function it(e){let t=nt();if(!e)return t;let n=Array.isArray(e.links)?e.links.map(e=>rt(e)).filter(e=>!!e):[];return{status:e.status??``,description:e.description??``,ownerPersonId:e.ownerPersonId??``,responsibleType:e.responsibleType===`role`||e.responsibleType===`team`?e.responsibleType:``,responsibleId:e.responsibleId??``,links:n,systems:Array.isArray(e.systems)?e.systems:[],controls:Array.isArray(e.controls)?e.controls:[],risks:Array.isArray(e.risks)?e.risks:[],regulations:Array.isArray(e.regulations)?e.regulations:[],notes:e.notes??``}}function at(e,t){let n=Object.fromEntries(Object.entries(e.nodes??{}).map(([e,t])=>[e,it(t)]));return{schemaVersion:3,processId:e.processId||t,nodes:n}}function R(e){return{schemaVersion:3,processId:e,nodes:{}}}function z(e,t=`normal`){y.textContent=e,y.classList.remove(`status-success`,`status-error`),t===`success`?y.classList.add(`status-success`):t===`error`&&y.classList.add(`status-error`)}function ot(e){let t=e.trim();return t?/\.(bpmn|xml)$/i.test(t)?t:`${t}.bpmn`:`process.bpmn`}function st(e){return e.replace(/\.(bpmn|xml)$/i,``)+`.svg`}function ct(){let e=V();return e?`${e.id}.json`:A.replace(/\.(bpmn|xml)$/i,``)+`.json`}function B(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function lt(){return O.get(`canvas`)}function ut(){return O.get(`commandStack`)}function dt(){return O.get(`elementRegistry`)}function ft(){return O.get(`overlays`)}function V(){return m(k??void 0)??null}function pt(e){let t=e.businessObject;return t?.$type!==`bpmn:CallActivity`||!t.calledElement?null:pe(t.calledElement)??null}function H(e){return F.nodes[e]??nt()}function mt(e){let t=H(e).links.find(e=>e.type===`drill-down`&&m(e.targetProcessId)?.active);return t?m(t.targetProcessId)??null:null}function ht(e){return pt(e)??mt(e.id)}function gt(e){let t=[e],n=e.parentId,r=new Set([e.id]);for(;n&&!r.has(n);){let e=m(n);if(!e)break;r.add(e.id),t.unshift(e),n=e.parentId}return t}function U(){v.replaceChildren();let e=V();if(!e){ve.textContent=`Custom`,_e.textContent=A,ye.disabled=!0,b.disabled=!0;let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=A,v.appendChild(e);return}ve.textContent=e.level,_e.textContent=e.name,ye.disabled=!e.parentId,b.disabled=!1,gt(e).forEach((t,n)=>{if(n>0){let e=document.createElement(`span`);e.className=`breadcrumb-separator`,e.textContent=`›`,v.appendChild(e)}if(t.id===e.id){let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=`${t.level} ${t.name}`,v.appendChild(e);return}let r=document.createElement(`button`);r.className=`breadcrumb-button`,r.type=`button`,r.textContent=`${t.level} ${t.name}`,r.addEventListener(`click`,()=>void $(t.id)),v.appendChild(r)})}function _t(){let e=ut();De.disabled=!e.canUndo(),Oe.disabled=!e.canRedo()}function W(){try{lt().zoom(`fit-viewport`)}catch(e){console.error(`Unable to fit BPMN diagram to viewport.`,e)}}function vt(e){let t=lt(),n=t.zoom();t.zoom(Math.max(.2,Math.min(4,n+e)))}function yt(e=k){return e?`${p}${e}.xml`:`${p}custom.xml`}function bt(e=k){return e?`${p}${e}.filename`:`${p}custom.filename`}function G(e=k){return e?`${de}${e}`:`${de}custom`}function K(){if(!N)return;let e=ft();e.clear();let t=lt();dt().getAll().forEach(n=>{let r=ht(n),i=H(n.id).links.filter(e=>m(e.targetProcessId));r&&(t.addMarker(n.id,`drill-down-target`),e.add(n.id,{position:{top:-30,right:0},html:`<div class="drill-down-badge" title="Open ${q(r.name)}">↘ ${q(r.level)}</div>`}));let a=i.filter(e=>!(e.type===`drill-down`&&r?.id===e.targetProcessId)).length;a>0&&e.add(n.id,{position:{bottom:-26,right:0},html:`<div class="process-link-badge" title="${a} additional linked process${a===1?``:`es`}">↗ ${a}</div>`})})}function q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function xt(e){tt=e,Ne.classList.toggle(`metadata-panel-hidden`,!e),x.classList.toggle(`toolbar-button-active`,e),x.setAttribute(`aria-pressed`,String(e)),window.setTimeout(()=>W(),0)}function St(e){return e?e.replace(/^bpmn:/,``).replace(/([a-z])([A-Z])/g,`$1 $2`):`BPMN element`}function J(e){return e.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0)}function Y(e){return(e??[]).join(`
`)}function Ct(e){let t=[u(I,oe(I,e)),s(I,te(I,e))].filter(Boolean);return t.length>0?`${e.name} — ${t.join(` · `)}`:e.name}function wt(e){w.replaceChildren(new Option(`Not set`,``));let t=[...I.people].filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name));t.forEach(e=>{w.add(new Option(Ct(e),e.id))}),e&&!t.some(t=>t.id===e)&&w.add(new Option(`[Missing or inactive person] ${e}`,e)),w.value=e}function Tt(e){return e.responsibleType&&e.responsibleId?`${e.responsibleType}:${e.responsibleId}`:``}function Et(e){T.replaceChildren(new Option(`Not set`,``));let t=document.createElement(`optgroup`);t.label=`Roles`,[...I.roles].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let n=s(I,e.departmentId);t.appendChild(new Option(n?`${e.name} — ${n}`:e.name,`role:${e.id}`))});let n=document.createElement(`optgroup`);n.label=`Teams`,[...I.teams].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let t=s(I,e.departmentId);n.appendChild(new Option(t?`${e.name} — ${t}`:e.name,`team:${e.id}`))}),t.children.length>0&&T.appendChild(t),n.children.length>0&&T.appendChild(n);let r=Tt(e);r&&!Array.from(T.options).some(e=>e.value===r)&&T.add(new Option(`[Missing reference] ${r}`,r)),T.value=r}function Dt(e){if(!e)return{type:``,id:``};let t=e.indexOf(`:`);if(t<1)return{type:``,id:``};let n=e.slice(0,t),r=e.slice(t+1);return n!==`role`&&n!==`team`||!r?{type:``,id:``}:{type:n,id:r}}function Ot(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;default:return`Related`}}function kt(){E.replaceChildren(new Option(`Select process`,``));let e=[...fe].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence),t=Object.values(f).filter(e=>e.active&&e.id!==k);e.forEach(e=>{let n=t.filter(t=>t.layerId===e.id).sort((e,t)=>e.name.localeCompare(t.name));if(n.length===0)return;let r=document.createElement(`optgroup`);r.label=`${e.code} — ${e.name}`,n.forEach(e=>{r.appendChild(new Option(e.name,e.id))}),E.appendChild(r)});let n=t.filter(e=>!fe.some(t=>t.id===e.layerId)).sort((e,t)=>e.name.localeCompare(t.name));if(n.length>0){let e=document.createElement(`optgroup`);e.label=`Unlayered`,n.forEach(t=>e.appendChild(new Option(t.name,t.id))),E.appendChild(e)}}function At(e){if(Ue.replaceChildren(),e.links.length===0){let e=document.createElement(`div`);e.className=`organisation-muted`,e.textContent=`No linked processes.`,Ue.appendChild(e)}else e.links.forEach(e=>{let t=m(e.targetProcessId),n=document.createElement(`div`);n.className=`process-link-row`;let r=document.createElement(`div`);r.className=`process-link-copy`,r.innerHTML=`
        <div class="process-link-primary">
          ${q(Ot(e.type))} → ${q(t?.name??e.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${q(t?.level??`Missing process`)}${e.label?` · ${q(e.label)}`:``}
        </div>
      `;let i=document.createElement(`button`);i.type=`button`,i.className=`process-link-remove`,i.textContent=`Remove`,i.dataset.processLinkId=e.id,i.addEventListener(`click`,()=>Pt(e.id)),n.append(r,i),Ue.appendChild(n)});kt()}function X(){if(!P){Fe.hidden=!1,C.hidden=!0;return}let e=P.businessObject,t=H(P.id);Fe.hidden=!0,C.hidden=!1,Ie.textContent=e?.name||P.id,Le.textContent=St(e?.$type),Re.value=P.id,e?.calledElement?(ze.hidden=!1,Be.value=e.calledElement):(ze.hidden=!0,Be.value=``),Ve.value=t.status,He.value=t.description,wt(t.ownerPersonId),Et(t),At(t),qe.value=Y(t.systems),Je.value=Y(t.controls),Ye.value=Y(t.risks),Xe.value=Y(t.regulations),Ze.value=t.notes}function jt(){localStorage.setItem(G(),JSON.stringify(F,null,2));let e=V();e&&i(e.metadataUrl,F)}function Mt(e=!0){if(!P)return;let t=Dt(T.value),n=H(P.id);F.nodes[P.id]={status:Ve.value,description:He.value.trim(),ownerPersonId:w.value,responsibleType:t.type,responsibleId:t.id,links:n.links,systems:J(qe.value),controls:J(Je.value),risks:J(Ye.value),regulations:J(Xe.value),notes:Ze.value.trim()},jt(),K(),e&&z(`Metadata saved locally`,`success`)}function Nt(){if(!P)return;let e=E.value,t=We.value;if(!e||!m(e)){window.alert(`Select a target process.`);return}Mt(!1);let n=H(P.id);t===`drill-down`&&n.links.some(e=>e.type===`drill-down`)&&!window.confirm(`This node already has a metadata drill-down link. Add another drill-down relationship?`)||(n.links.push({id:`link-${crypto.randomUUID()}`,type:t,targetProcessId:e,label:Ge.value.trim()}),F.nodes[P.id]=n,jt(),Ge.value=``,X(),K(),z(`Process link saved locally`,`success`))}function Pt(e){if(!P)return;Mt(!1);let t=H(P.id);t.links=t.links.filter(t=>t.id!==e),F.nodes[P.id]=t,jt(),X(),K(),z(`Process link removed`,`success`)}function Ft(){B(ct(),`${JSON.stringify(F,null,2)}\n`,`application/json;charset=utf-8`),z(`Metadata JSON downloaded`,`success`)}async function It(e){return at(await n(e.metadataUrl),e.bpmnProcessId)}async function Lt(e,t){if(t&&!r()){let t=localStorage.getItem(G(e.id));if(t)try{return at(JSON.parse(t),e.bpmnProcessId)}catch(e){console.warn(`Unable to parse locally saved metadata; repository metadata will be used.`,e)}}try{return await It(e)}catch(t){return console.warn(`Unable to load repository metadata; using an empty metadata record.`,t),R(e.bpmnProcessId)}}async function Rt(){let e=V(),t=e?`${e.level} ${e.name}`:`the current custom process`;if(window.confirm(`Reset all metadata for ${t} to the repository version? Any locally saved metadata changes for this process will be discarded.`)){if(!e){F=R(`Process_Custom`),P=null,localStorage.removeItem(G()),X(),K(),z(`Custom metadata cleared`,`success`);return}localStorage.removeItem(G(e.id)),F=await Lt(e,!1),X(),K(),z(`${e.level} metadata reset to repository version`,`success`)}}async function Z(){if(!(M||!N))try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML while autosaving.`);localStorage.setItem(yt(),e.xml),localStorage.setItem(bt(),A);let t=V();t&&await o(t.url,e.xml),z(r()?`Saved to ${ee()}`:`Saved locally`,`success`)}catch(e){console.error(`Unable to autosave BPMN diagram.`,e),z(`Autosave failed`,`error`)}}function zt(){M||(j!==void 0&&window.clearTimeout(j),z(`Unsaved changes`),j=window.setTimeout(()=>void Z(),500))}async function Q(e,t){M=!0,A=ot(t),P=null,U(),X(),z(`Loading process…`);try{let t=await O.importXML(e);N=!0,W(),_t(),K();let n=t.warnings?.length??0;n>0?(console.warn(`BPMN import warnings:`,t.warnings),z(`Loaded with ${n} warning${n===1?``:`s`}`)):z(`Process loaded`,`success`)}catch(e){throw N=!1,console.error(`Unable to import BPMN diagram.`,e),z(`Unable to load BPMN process`,`error`),e}finally{M=!1}}async function Bt(e){return t(e.url)}async function $(e,t=!0){let n=m(e);if(!n){z(`Unknown process: ${e}`,`error`);return}N&&k!==e&&await Z(),j!==void 0&&(window.clearTimeout(j),j=void 0),k=n.id,A=n.filename,P=null,F=await Lt(n,t),U(),X(),z(`Loading ${n.level} ${n.name}…`);try{let e=t&&!r()?localStorage.getItem(yt()):null;if(e){await Q(e,n.filename),z(`Restored ${n.level} ${n.name} from local autosave`,`success`);return}await Q(await Bt(n),n.filename)}catch(e){console.error(`Unable to load process ${n.id}.`,e),z(`Unable to load ${n.name}`,`error`)}}async function Vt(){let e=V();e&&window.confirm(`Reset ${e.level} ${e.name} to the repository BPMN? Local diagram changes will be discarded.`)&&(localStorage.removeItem(yt()),localStorage.removeItem(bt()),await $(e.id,!1),z(`${e.level} ${e.name} reset to repository version`,`success`))}async function Ht(){await Z(),k=null,A=`new-process.bpmn`,F=R(`Process_Custom`),P=null,U(),X();try{await Q(he,A)}catch(e){console.error(`Unable to create new BPMN process.`,e)}}async function Ut(){z(`Preparing BPMN…`);try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML.`);if(r()){let t=V();t?await o(t.url,e.xml):B(ot(A),e.xml,`application/xml;charset=utf-8`)}else B(ot(A),e.xml,`application/xml;charset=utf-8`);await Z(),z(r()?`BPMN saved to Enterprise Model folder`:`BPMN downloaded`,`success`)}catch(e){console.error(`Unable to save BPMN file.`,e),z(`Unable to save BPMN`,`error`)}}async function Wt(){z(`Preparing SVG…`);try{let e=await O.saveSVG();if(!e.svg)throw Error(`bpmn-js returned no SVG.`);B(st(A),e.svg,`image/svg+xml;charset=utf-8`),z(`SVG downloaded`,`success`)}catch(e){console.error(`Unable to export SVG.`,e),z(`Unable to export SVG`,`error`)}}async function Gt(e){await Z(),k=null,A=e.name,F=R(`Process_Custom`),P=null,U(),X(),z(`Opening ${e.name}…`);try{await Q(await e.text(),e.name)}catch(t){console.error(`Unable to open ${e.name}.`,t),z(`Unable to open ${e.name}`,`error`)}}function Kt(){let e=V(),t=e?.parentId;if(t&&t!==e.id&&m(t)){$(t);return}let n=m(d);n&&n.id!==e?.id&&$(n.id)}function qt(e){if(!e.element)return;let t=ht(e.element);t&&(e.originalEvent?.preventDefault(),e.originalEvent?.stopPropagation(),$(t.id))}function Jt(e){P=e.newSelection?.[0]??null,X();let t=P?.businessObject;document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-node-selection-changed`,{detail:P?{processId:k??``,elementId:P.id,name:t?.name||P.id,bpmnType:t?.$type||``}:null}))}function Yt(){L.setData(I),D.open||D.showModal()}function Xt(){U(),X(),K()}function Zt(e){let t=e.detail;t?.processId&&$(t.processId)}async function Qt(){try{await Z();let e=await a();await ue(!1),I=await re(!1),L.setData(I);let t=m(d)??Object.values(f).find(e=>e.active)??Object.values(f)[0];t&&await $(t.id,!1),z(`Enterprise Model opened: ${e}`,`success`)}catch(e){console.error(`Unable to open Enterprise Model folder.`,e),z(e instanceof Error?e.message:`Unable to open Enterprise Model folder`,`error`)}}async function $t(){try{await ue(!0)}catch(e){console.error(`Unable to initialise process repository.`,e),z(`Unable to initialise process repository`,`error`);return}I=await re(!0),L.setData(I),U(),X();let e=m(d)??Object.values(f).find(e=>e.active)??Object.values(f)[0];e?await $(e.id):await Ht()}ye.addEventListener(`click`,Kt),be.addEventListener(`click`,()=>void Ht()),xe.addEventListener(`click`,()=>{S.value=``,S.click()}),Se.addEventListener(`click`,()=>void Qt()),Ce.addEventListener(`click`,()=>{let e=m(d);e&&$(e.id)}),b.addEventListener(`click`,()=>void Vt()),we.addEventListener(`click`,()=>void Ut()),Te.addEventListener(`click`,()=>void Wt()),x.addEventListener(`click`,()=>xt(!tt)),Pe.addEventListener(`click`,()=>xt(!1)),Ee.addEventListener(`click`,Yt),De.addEventListener(`click`,()=>ut().undo()),Oe.addEventListener(`click`,()=>ut().redo()),ke.addEventListener(`click`,()=>vt(-.1)),Ae.addEventListener(`click`,W),je.addEventListener(`click`,()=>vt(.1)),Qe.addEventListener(`click`,Ft),$e.addEventListener(`click`,()=>void Rt()),Ke.addEventListener(`click`,Nt),C.addEventListener(`submit`,e=>{e.preventDefault(),Mt()}),S.addEventListener(`change`,()=>{let e=S.files?.[0];e&&Gt(e)}),D.addEventListener(`click`,e=>{e.target===D&&D.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,Xt),document.addEventListener(`enterprise-modeler:open-process`,Zt),O.on(`commandStack.changed`,()=>{_t(),zt()}),O.on(`element.dblclick`,qt),O.on(`selection.changed`,Jt),window.addEventListener(`resize`,W),$t();