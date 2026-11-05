import{t as e}from"./Modeler-Bi03ARIg.js";import{a as t,c as n,f as r,i,l as a,m as o,n as ee,o as s,p as te,r as c,s as ne,t as re,u as l}from"./organisation-CjLVZz1v.js";import{a as u,f as ie,i as ae,n as d,r as oe,s as se,t as f,u as p}from"./processCatalog-Dye2DPES.js";/* empty css             */function m(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function h(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var ce=class{root;options;data;activeTab=`people`;selectedPersonId=null;selectedPositionId=null;selectedDepartmentId=null;selectedRoleId=null;selectedTeamId=null;constructor(e,t,n){this.root=e,this.data=structuredClone(t),this.options=n,this.render()}setData(e){this.data=structuredClone(e),this.ensureSelectionsExist(),this.render()}getData(){return structuredClone(this.data)}ensureSelectionsExist(){this.selectedPersonId&&!this.data.people.some(e=>e.id===this.selectedPersonId)&&(this.selectedPersonId=null),this.selectedPositionId&&!this.data.positions.some(e=>e.id===this.selectedPositionId)&&(this.selectedPositionId=null),this.selectedDepartmentId&&!this.data.departments.some(e=>e.id===this.selectedDepartmentId)&&(this.selectedDepartmentId=null),this.selectedRoleId&&!this.data.roles.some(e=>e.id===this.selectedRoleId)&&(this.selectedRoleId=null),this.selectedTeamId&&!this.data.teams.some(e=>e.id===this.selectedTeamId)&&(this.selectedTeamId=null)}notifyChanged(){this.options.onChange(this.getData())}render(){let e=this.selectedEntityReference();this.root.innerHTML=`
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
    `,this.bindCommonEvents(),this.bindActiveTabEvents()}renderTabButton(e,t){return`<button class="organisation-tab${this.activeTab===e?` organisation-tab-active`:``}" type="button" data-tab="${e}">${t}</button>`}renderActiveTab(){switch(this.activeTab){case`positions`:return this.renderPositions();case`departments`:return this.renderDepartments();case`roles`:return this.renderRoles();case`teams`:return this.renderTeams();default:return this.renderPeople()}}renderPeople(){let e=h(this.data.people),r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No people have been added yet.</div>`:e.map(e=>{let r=[n(this.data,e.positionId),l(this.data,s(this.data,e)),i(this.data,t(this.data,e))].filter(Boolean).join(` · `)||e.email||`No position assigned`;return`
            <button class="organisation-list-item${e.id===this.selectedPersonId?` organisation-list-item-selected`:``}" type="button" data-edit-person="${m(e.id)}">
              <span class="organisation-list-primary">${m(e.name)}</span>
              <span class="organisation-list-secondary">${m(r)}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(r)}
        </div>
      </div>
    `}renderPersonForm(e){let t=h(this.data.positions).filter(t=>t.id===e?.positionId||t.active&&a(this.data,t.id).length===0).map(t=>{let n=l(this.data,t.roleId),r=i(this.data,t.departmentId),a=[t.name,n,r].filter(Boolean).join(` — `);return`<option value="${m(t.id)}"${t.id===e?.positionId?` selected`:``}>${m(a)}</option>`}).join(``),r=e?ne(this.data,e.positionId):void 0,o=r?l(this.data,r.roleId):``,ee=r?i(this.data,r.departmentId):``,s=r?n(this.data,r.managerPositionId):``,te=h(this.data.departments).map(t=>`<option value="${m(t.id)}"${t.id===e?.departmentId?` selected`:``}>${m(t.name)}</option>`).join(``),c=h(this.data.roles).map(t=>`<option value="${m(t.id)}"${t.id===e?.roleId?` selected`:``}>${m(t.name)}</option>`).join(``),re=h(this.data.people.filter(t=>t.id!==e?.id)).map(t=>`<option value="${m(t.id)}"${t.id===e?.managerPersonId?` selected`:``}>${m(t.name)}</option>`).join(``),u=h(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${m(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${m(t.name)}</span>
        </label>
      `).join(``);return`
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit person`:`Add person`}</div>
        ${e?`<div class="organisation-record-id">${m(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${m(e?.name??``)}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${m(e?.email??``)}" />
        </label>

        <label class="metadata-field">
          <span>Position</span>
          <select id="organisation-person-position">
            <option value="">Not set</option>
            ${t}
          </select>
        </label>

        ${r?`
          <div class="metadata-help">
            <strong>${m(r.name)}</strong><br />
            Role: ${m(o||`Not set`)}<br />
            Department: ${m(ee||`Not set`)}<br />
            Reports to position: ${m(s||`Not set`)}
          </div>
        `:`
          <fieldset class="organisation-fieldset">
            <legend>Legacy structure fallback</legend>
            <div class="organisation-muted" style="margin-bottom:8px">Used only while this person has no Position assigned.</div>

            <label class="metadata-field">
              <span>Department</span>
              <select id="organisation-person-department">
                <option value="">Not set</option>
                ${te}
              </select>
            </label>

            <label class="metadata-field">
              <span>Role</span>
              <select id="organisation-person-role">
                <option value="">Not set</option>
                ${c}
              </select>
            </label>

            <label class="metadata-field">
              <span>Manager</span>
              <select id="organisation-person-manager">
                <option value="">Not set</option>
                ${re}
              </select>
            </label>

            <fieldset class="organisation-fieldset">
              <legend>Teams</legend>
              <div class="organisation-checkbox-list">
                ${u||`<span class="organisation-muted">No teams defined.</span>`}
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
          <textarea id="organisation-person-notes" rows="3">${m(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Person`:`Add Person`}</button>
          ${e?`<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderPositions(){let e=h(this.data.positions),t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No positions have been added yet.</div>`:e.map(e=>{let t=l(this.data,e.roleId),n=i(this.data,e.departmentId),r=a(this.data,e.id),o=r.length===0?`Vacant`:r.map(e=>e.name).join(`, `);return`
            <button class="organisation-list-item${e.id===this.selectedPositionId?` organisation-list-item-selected`:``}" type="button" data-edit-position="${m(e.id)}">
              <span class="organisation-list-primary">${m(e.name)}</span>
              <span class="organisation-list-secondary">${m([t,n,o].filter(Boolean).join(` · `))}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(t)}
        </div>
      </div>
    `}renderPositionForm(e){let t=h(this.data.roles).map(t=>`<option value="${m(t.id)}"${t.id===e?.roleId?` selected`:``}>${m(t.name)}</option>`).join(``),n=this.renderDepartmentOptions(e?.departmentId),r=h(this.data.positions.filter(t=>t.id!==e?.id)).map(t=>{let n=l(this.data,t.roleId),r=n?`${t.name} — ${n}`:t.name;return`<option value="${m(t.id)}"${t.id===e?.managerPositionId?` selected`:``}>${m(r)}</option>`}).join(``),i=h(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${m(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${m(t.name)}</span>
        </label>
      `).join(``),o=e?a(this.data,e.id):[];return`
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit position`:`Add position`}</div>
        ${e?`<div class="organisation-record-id">${m(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${m(e?.name??``)}" placeholder="e.g. Operations Analyst 01" />
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
            Current occupant: ${m(o.length>0?o.map(e=>e.name).join(`, `):`VACANT`)}
          </div>
        `:``}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${m(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Position`:`Add Position`}</button>
          ${e?`<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartments(){return this.renderReferenceSection(`Department`,`department`,h(this.data.departments),this.selectedDepartmentId,this.renderDepartmentForm())}renderDepartmentForm(){let e=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId)??null:null,t=h(this.data.departments.filter(t=>t.id!==e?.id)).map(t=>`<option value="${m(t.id)}"${t.id===e?.parentDepartmentId?` selected`:``}>${m(t.name)}</option>`).join(``);return`
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit department`:`Add department`}</div>
        ${e?`<div class="organisation-record-id">${m(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${m(e?.name??``)}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${t}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Department`:`Add Department`}</button>
          ${e?`<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderRoles(){return this.renderReferenceSection(`Role`,`role`,h(this.data.roles),this.selectedRoleId,this.renderRoleForm())}renderRoleForm(){let e=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit role`:`Add role`}</div>
        ${e?`<div class="organisation-record-id">${m(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${m(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Role`:`Add Role`}</button>
          ${e?`<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderTeams(){return this.renderReferenceSection(`Team`,`team`,h(this.data.teams),this.selectedTeamId,this.renderTeamForm())}renderTeamForm(){let e=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit team`:`Add team`}</div>
        ${e?`<div class="organisation-record-id">${m(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${m(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Team`:`Add Team`}</button>
          ${e?`<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartmentOptions(e){return h(this.data.departments).map(t=>`<option value="${m(t.id)}"${t.id===e?` selected`:``}>${m(t.name)}</option>`).join(``)}renderReferenceSection(e,t,n,r,i){return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${e}s</span>
            <button id="organisation-new-${t}" class="toolbar-button" type="button">New ${e}</button>
          </div>
          <div class="organisation-list">${n.length===0?`<div class="organisation-empty">No ${e.toLowerCase()}s have been added yet.</div>`:n.map(e=>`
          <button class="organisation-list-item${e.id===r?` organisation-list-item-selected`:``}" type="button" data-edit-${t}="${m(e.id)}">
            <span class="organisation-list-primary">${m(e.name)}</span>
          </button>
        `).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">${i}</div>
      </div>
    `}selectedEntityReference(){switch(this.activeTab){case`people`:return this.selectedPersonId?{type:`person`,id:this.selectedPersonId}:null;case`positions`:return this.selectedPositionId?{type:`position`,id:this.selectedPositionId}:null;case`roles`:return this.selectedRoleId?{type:`role`,id:this.selectedRoleId}:null;case`departments`:return this.selectedDepartmentId?{type:`department`,id:this.selectedDepartmentId}:null;case`teams`:return this.selectedTeamId?{type:`team`,id:this.selectedTeamId}:null;default:return null}}openSelectedInExplorer(e){let t=this.selectedEntityReference();t&&(this.options.onClose(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{...t,mode:e}})))}bindCommonEvents(){this.root.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t&&(this.activeTab=t,this.render())})}),this.root.querySelector(`#organisation-close`)?.addEventListener(`click`,this.options.onClose),this.root.querySelector(`#organisation-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#organisation-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.root.querySelector(`#organisation-export`)?.addEventListener(`click`,()=>this.options.onExport(this.getData())),this.root.querySelector(`#organisation-reset`)?.addEventListener(`click`,()=>void this.resetFromRepository())}bindActiveTabEvents(){this.activeTab===`people`?this.bindPeopleEvents():this.activeTab===`positions`?this.bindPositionEvents():this.activeTab===`departments`?this.bindDepartmentEvents():this.activeTab===`roles`?this.bindRoleEvents():this.bindTeamEvents()}bindPeopleEvents(){this.root.querySelector(`#organisation-new-person`)?.addEventListener(`click`,()=>{this.selectedPersonId=null,this.render()}),this.root.querySelectorAll(`[data-edit-person]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPersonId=e.dataset.editPerson??null,this.render()})}),this.root.querySelector(`#organisation-person-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePerson()}),this.root.querySelector(`#organisation-delete-person`)?.addEventListener(`click`,()=>this.deletePerson())}bindPositionEvents(){this.root.querySelector(`#organisation-new-position`)?.addEventListener(`click`,()=>{this.selectedPositionId=null,this.render()}),this.root.querySelectorAll(`[data-edit-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPositionId=e.dataset.editPosition??null,this.render()})}),this.root.querySelector(`#organisation-position-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePosition()}),this.root.querySelector(`#organisation-delete-position`)?.addEventListener(`click`,()=>this.deletePosition())}bindDepartmentEvents(){this.root.querySelector(`#organisation-new-department`)?.addEventListener(`click`,()=>{this.selectedDepartmentId=null,this.render()}),this.root.querySelectorAll(`[data-edit-department]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedDepartmentId=e.dataset.editDepartment??null,this.render()})}),this.root.querySelector(`#organisation-department-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveDepartment()}),this.root.querySelector(`#organisation-delete-department`)?.addEventListener(`click`,()=>this.deleteDepartment())}bindRoleEvents(){this.root.querySelector(`#organisation-new-role`)?.addEventListener(`click`,()=>{this.selectedRoleId=null,this.render()}),this.root.querySelectorAll(`[data-edit-role]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedRoleId=e.dataset.editRole??null,this.render()})}),this.root.querySelector(`#organisation-role-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveRole()}),this.root.querySelector(`#organisation-delete-role`)?.addEventListener(`click`,()=>this.deleteRole())}bindTeamEvents(){this.root.querySelector(`#organisation-new-team`)?.addEventListener(`click`,()=>{this.selectedTeamId=null,this.render()}),this.root.querySelectorAll(`[data-edit-team]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedTeamId=e.dataset.editTeam??null,this.render()})}),this.root.querySelector(`#organisation-team-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveTeam()}),this.root.querySelector(`#organisation-delete-team`)?.addEventListener(`click`,()=>this.deleteTeam())}getInputValue(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}savePerson(){let e=this.getInputValue(`organisation-person-name`);if(!e)return;let t=this.getInputValue(`organisation-person-position`)||void 0,n=this.root.querySelector(`#organisation-person-active`)?.checked??!0,r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId):void 0;if(t&&n){let e=this.data.people.find(e=>e.active&&e.positionId===t&&e.id!==r?.id);if(e){window.alert(`That position is already occupied by ${e.name}.`);return}}let i=!!t,a=i?[]:Array.from(this.root.querySelectorAll(`input[name="teamIds"]:checked`)).map(e=>e.value),o={id:r?.id??c(`person`),name:e,email:this.getInputValue(`organisation-person-email`),positionId:t,departmentId:i?void 0:this.getInputValue(`organisation-person-department`)||void 0,roleId:i?void 0:this.getInputValue(`organisation-person-role`)||void 0,managerPersonId:i?void 0:this.getInputValue(`organisation-person-manager`)||void 0,teamIds:a,active:n,notes:this.getInputValue(`organisation-person-notes`)};r?Object.assign(r,o):this.data.people.push(o),this.selectedPersonId=o.id,this.notifyChanged(),this.render()}deletePerson(){if(!this.selectedPersonId)return;let e=this.data.people.find(e=>e.id===this.selectedPersonId);!e||!window.confirm(`Delete ${e.name}? Existing process metadata references to this person will become unresolved.`)||(this.data.people=this.data.people.filter(t=>t.id!==e.id),this.data.people.forEach(t=>{t.managerPersonId===e.id&&(t.managerPersonId=void 0)}),this.selectedPersonId=null,this.notifyChanged(),this.render())}savePosition(){let e=this.getInputValue(`organisation-position-name`);if(!e)return;let t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId):void 0,n=this.getInputValue(`organisation-position-manager`)||void 0,r=t?.id??c(`position`);if(n&&this.wouldCreatePositionCycle(r,n)){window.alert(`That reporting relationship would create a circular Position hierarchy.`);return}let i=Array.from(this.root.querySelectorAll(`input[name="positionTeamIds"]:checked`)).map(e=>e.value),a=this.root.querySelector(`#organisation-position-active`)?.checked??!0,o={id:r,name:e,roleId:this.getInputValue(`organisation-position-role`)||void 0,departmentId:this.getInputValue(`organisation-position-department`)||void 0,managerPositionId:n,teamIds:i,active:a,notes:this.getInputValue(`organisation-position-notes`)};t?Object.assign(t,o):this.data.positions.push(o),this.selectedPositionId=o.id,this.notifyChanged(),this.render()}wouldCreatePositionCycle(e,t){let n=t,r=new Set;for(;n;){if(n===e||r.has(n))return!0;r.add(n),n=this.data.positions.find(e=>e.id===n)?.managerPositionId}return!1}deletePosition(){if(!this.selectedPositionId)return;let e=this.data.positions.find(e=>e.id===this.selectedPositionId);if(!e)return;let t=a(this.data,e.id),n=t.length>0?` ${t.map(e=>e.name).join(`, `)} will become unassigned.`:``;window.confirm(`Delete position ${e.name}?${n} Child positions will become top-level/unassigned.`)&&(this.data.positions=this.data.positions.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.managerPositionId===e.id&&(t.managerPositionId=void 0)}),this.data.people.forEach(t=>{t.positionId===e.id&&(t.positionId=void 0)}),this.selectedPositionId=null,this.notifyChanged(),this.render())}saveDepartment(){let e=this.getInputValue(`organisation-department-name`);if(!e)return;let t=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId):void 0,n={id:t?.id??c(`department`),name:e,parentDepartmentId:this.getInputValue(`organisation-department-parent`)||void 0};t?Object.assign(t,n):this.data.departments.push(n),this.selectedDepartmentId=n.id,this.notifyChanged(),this.render()}deleteDepartment(){if(!this.selectedDepartmentId)return;let e=this.data.departments.find(e=>e.id===this.selectedDepartmentId);!e||!window.confirm(`Delete department ${e.name}? Department references will be cleared.`)||(this.data.departments=this.data.departments.filter(t=>t.id!==e.id),this.data.departments.forEach(t=>{t.parentDepartmentId===e.id&&(t.parentDepartmentId=void 0)}),this.data.roles.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.teams.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.positions.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.people.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.selectedDepartmentId=null,this.notifyChanged(),this.render())}saveRole(){let e=this.getInputValue(`organisation-role-name`);if(!e)return;let t=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId):void 0,n={id:t?.id??c(`role`),name:e,departmentId:this.getInputValue(`organisation-role-department`)||void 0};t?Object.assign(t,n):this.data.roles.push(n),this.selectedRoleId=n.id,this.notifyChanged(),this.render()}deleteRole(){if(!this.selectedRoleId)return;let e=this.data.roles.find(e=>e.id===this.selectedRoleId);!e||!window.confirm(`Delete role ${e.name}? Role references will be cleared from positions and legacy people records.`)||(this.data.roles=this.data.roles.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.data.people.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.selectedRoleId=null,this.notifyChanged(),this.render())}saveTeam(){let e=this.getInputValue(`organisation-team-name`);if(!e)return;let t=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId):void 0,n={id:t?.id??c(`team`),name:e,departmentId:this.getInputValue(`organisation-team-department`)||void 0};t?Object.assign(t,n):this.data.teams.push(n),this.selectedTeamId=n.id,this.notifyChanged(),this.render()}deleteTeam(){if(!this.selectedTeamId)return;let e=this.data.teams.find(e=>e.id===this.selectedTeamId);!e||!window.confirm(`Delete team ${e.name}? Team references will be cleared.`)||(this.data.teams=this.data.teams.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.data.people.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.selectedTeamId=null,this.notifyChanged(),this.render())}async resetFromRepository(){if(window.confirm(`Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.`))try{let e=await this.options.onReset();this.data=structuredClone(e),this.selectedPersonId=null,this.selectedPositionId=null,this.selectedDepartmentId=null,this.selectedRoleId=null,this.selectedTeamId=null,this.notifyChanged(),this.render()}catch(e){console.error(`Unable to reset organisation data.`,e),window.alert(`Unable to reset the organisation model from the repository.`)}}},le=`<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>`,ue=document.querySelector(`#app`);if(!ue)throw Error(`Application root element #app was not found.`);ue.innerHTML=`
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
        <button id="open-button" class="toolbar-button" type="button">Open</button>
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
`;function g(e){let t=document.getElementById(e);if(!t)throw Error(`Required element #${e} was not found.`);return t}var de=g(`document-name`),fe=g(`process-level`),_=g(`breadcrumbs`),v=g(`status`),pe=g(`back-button`),me=g(`new-button`),he=g(`open-button`),ge=g(`home-button`),y=g(`reset-button`),_e=g(`save-button`),ve=g(`svg-button`),b=g(`metadata-button`),ye=g(`organisation-button`),be=g(`undo-button`),xe=g(`redo-button`),Se=g(`zoom-out-button`),Ce=g(`fit-button`),we=g(`zoom-in-button`),x=g(`file-input`),Te=g(`canvas`),Ee=g(`metadata-panel`),De=g(`metadata-close-button`),Oe=g(`metadata-empty`),S=g(`metadata-form`),ke=g(`metadata-node-name`),Ae=g(`metadata-node-type`),je=g(`metadata-node-id`),Me=g(`metadata-called-element-row`),Ne=g(`metadata-called-element`),Pe=g(`metadata-status`),Fe=g(`metadata-description`),C=g(`metadata-owner`),w=g(`metadata-responsible`),T=g(`metadata-process-links`),Ie=g(`metadata-link-type`),E=g(`metadata-link-target`),Le=g(`metadata-link-label`),Re=g(`metadata-link-add`),ze=g(`metadata-systems`),Be=g(`metadata-controls`),Ve=g(`metadata-risks`),He=g(`metadata-regulations`),Ue=g(`metadata-notes`),We=g(`metadata-export-button`),Ge=g(`metadata-reset-button`),D=g(`organisation-dialog`),Ke=g(`organisation-manager-root`),O=new e({container:Te,keyboard:{bindTo:window}}),k=null,A=`new-process.bpmn`,j,M=!1,N=!1,qe=!1,P=null,F=L(`Process_Custom`),I=re(),Je=new ce(Ke,I,{onChange:e=>{I=e,o(I),X(),R(`Organisation changes saved locally`,`success`)},onExport:e=>{ee(e),R(`Organisation JSON downloaded`,`success`)},onReset:async()=>{let e=await te();return I=e,X(),R(`Organisation reset to repository version`,`success`),e},onClose:()=>D.close()});function Ye(){return{status:``,description:``,ownerPersonId:``,responsibleType:``,responsibleId:``,links:[],systems:[],controls:[],risks:[],regulations:[],notes:``}}function Xe(e){let t=e.type;if(t!==`drill-down`&&t!==`related`&&t!==`exception`&&t!==`supporting`)return null;let n=e.targetProcessId?.trim()??``;return n?{id:e.id||`link-${crypto.randomUUID()}`,type:t,targetProcessId:n,label:e.label?.trim()??``}:null}function Ze(e){let t=Ye();if(!e)return t;let n=Array.isArray(e.links)?e.links.map(e=>Xe(e)).filter(e=>!!e):[];return{status:e.status??``,description:e.description??``,ownerPersonId:e.ownerPersonId??``,responsibleType:e.responsibleType===`role`||e.responsibleType===`team`?e.responsibleType:``,responsibleId:e.responsibleId??``,links:n,systems:Array.isArray(e.systems)?e.systems:[],controls:Array.isArray(e.controls)?e.controls:[],risks:Array.isArray(e.risks)?e.risks:[],regulations:Array.isArray(e.regulations)?e.regulations:[],notes:e.notes??``}}function Qe(e,t){let n=Object.fromEntries(Object.entries(e.nodes??{}).map(([e,t])=>[e,Ze(t)]));return{schemaVersion:3,processId:e.processId||t,nodes:n}}function L(e){return{schemaVersion:3,processId:e,nodes:{}}}function R(e,t=`normal`){v.textContent=e,v.classList.remove(`status-success`,`status-error`),t===`success`?v.classList.add(`status-success`):t===`error`&&v.classList.add(`status-error`)}function $e(e){let t=e.trim();return t?/\.(bpmn|xml)$/i.test(t)?t:`${t}.bpmn`:`process.bpmn`}function et(e){return e.replace(/\.(bpmn|xml)$/i,``)+`.svg`}function tt(){let e=V();return e?`${e.id}.json`:A.replace(/\.(bpmn|xml)$/i,``)+`.json`}function z(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function B(){return O.get(`canvas`)}function nt(){return O.get(`commandStack`)}function rt(){return O.get(`elementRegistry`)}function it(){return O.get(`overlays`)}function V(){return p(k??void 0)??null}function at(e){let t=e.businessObject;return t?.$type!==`bpmn:CallActivity`||!t.calledElement?null:se(t.calledElement)??null}function H(e){return F.nodes[e]??Ye()}function ot(e){let t=H(e).links.find(e=>e.type===`drill-down`&&p(e.targetProcessId)?.active);return t?p(t.targetProcessId)??null:null}function st(e){return at(e)??ot(e.id)}function ct(e){let t=[e],n=e.parentId,r=new Set([e.id]);for(;n&&!r.has(n);){let e=p(n);if(!e)break;r.add(e.id),t.unshift(e),n=e.parentId}return t}function U(){_.replaceChildren();let e=V();if(!e){fe.textContent=`Custom`,de.textContent=A,pe.disabled=!0,y.disabled=!0;let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=A,_.appendChild(e);return}fe.textContent=e.level,de.textContent=e.name,pe.disabled=!e.parentId,y.disabled=!1,ct(e).forEach((t,n)=>{if(n>0){let e=document.createElement(`span`);e.className=`breadcrumb-separator`,e.textContent=`›`,_.appendChild(e)}if(t.id===e.id){let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=`${t.level} ${t.name}`,_.appendChild(e);return}let r=document.createElement(`button`);r.className=`breadcrumb-button`,r.type=`button`,r.textContent=`${t.level} ${t.name}`,r.addEventListener(`click`,()=>void $(t.id)),_.appendChild(r)})}function lt(){let e=nt();be.disabled=!e.canUndo(),xe.disabled=!e.canRedo()}function W(){try{B().zoom(`fit-viewport`)}catch(e){console.error(`Unable to fit BPMN diagram to viewport.`,e)}}function ut(e){let t=B(),n=t.zoom();t.zoom(Math.max(.2,Math.min(4,n+e)))}function dt(e=k){return e?`${f}${e}.xml`:`${f}custom.xml`}function ft(e=k){return e?`${f}${e}.filename`:`${f}custom.filename`}function G(e=k){return e?`${ae}${e}`:`${ae}custom`}function K(){if(!N)return;let e=it();e.clear();let t=B();rt().getAll().forEach(n=>{let r=st(n),i=H(n.id).links.filter(e=>p(e.targetProcessId));r&&(t.addMarker(n.id,`drill-down-target`),e.add(n.id,{position:{top:-30,right:0},html:`<div class="drill-down-badge" title="Open ${q(r.name)}">↘ ${q(r.level)}</div>`}));let a=i.filter(e=>!(e.type===`drill-down`&&r?.id===e.targetProcessId)).length;a>0&&e.add(n.id,{position:{bottom:-26,right:0},html:`<div class="process-link-badge" title="${a} additional linked process${a===1?``:`es`}">↗ ${a}</div>`})})}function q(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function pt(e){qe=e,Ee.classList.toggle(`metadata-panel-hidden`,!e),b.classList.toggle(`toolbar-button-active`,e),b.setAttribute(`aria-pressed`,String(e)),window.setTimeout(()=>W(),0)}function mt(e){return e?e.replace(/^bpmn:/,``).replace(/([a-z])([A-Z])/g,`$1 $2`):`BPMN element`}function J(e){return e.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0)}function Y(e){return(e??[]).join(`
`)}function ht(e){let n=[l(I,s(I,e)),i(I,t(I,e))].filter(Boolean);return n.length>0?`${e.name} — ${n.join(` · `)}`:e.name}function gt(e){C.replaceChildren(new Option(`Not set`,``));let t=[...I.people].filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name));t.forEach(e=>{C.add(new Option(ht(e),e.id))}),e&&!t.some(t=>t.id===e)&&C.add(new Option(`[Missing or inactive person] ${e}`,e)),C.value=e}function _t(e){return e.responsibleType&&e.responsibleId?`${e.responsibleType}:${e.responsibleId}`:``}function vt(e){w.replaceChildren(new Option(`Not set`,``));let t=document.createElement(`optgroup`);t.label=`Roles`,[...I.roles].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let n=i(I,e.departmentId);t.appendChild(new Option(n?`${e.name} — ${n}`:e.name,`role:${e.id}`))});let n=document.createElement(`optgroup`);n.label=`Teams`,[...I.teams].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let t=i(I,e.departmentId);n.appendChild(new Option(t?`${e.name} — ${t}`:e.name,`team:${e.id}`))}),t.children.length>0&&w.appendChild(t),n.children.length>0&&w.appendChild(n);let r=_t(e);r&&!Array.from(w.options).some(e=>e.value===r)&&w.add(new Option(`[Missing reference] ${r}`,r)),w.value=r}function yt(e){if(!e)return{type:``,id:``};let t=e.indexOf(`:`);if(t<1)return{type:``,id:``};let n=e.slice(0,t),r=e.slice(t+1);return n!==`role`&&n!==`team`||!r?{type:``,id:``}:{type:n,id:r}}function bt(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;default:return`Related`}}function xt(){E.replaceChildren(new Option(`Select process`,``));let e=[...oe].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence),t=Object.values(d).filter(e=>e.active&&e.id!==k);e.forEach(e=>{let n=t.filter(t=>t.layerId===e.id).sort((e,t)=>e.name.localeCompare(t.name));if(n.length===0)return;let r=document.createElement(`optgroup`);r.label=`${e.code} — ${e.name}`,n.forEach(e=>{r.appendChild(new Option(e.name,e.id))}),E.appendChild(r)});let n=t.filter(e=>!oe.some(t=>t.id===e.layerId)).sort((e,t)=>e.name.localeCompare(t.name));if(n.length>0){let e=document.createElement(`optgroup`);e.label=`Unlayered`,n.forEach(t=>e.appendChild(new Option(t.name,t.id))),E.appendChild(e)}}function St(e){if(T.replaceChildren(),e.links.length===0){let e=document.createElement(`div`);e.className=`organisation-muted`,e.textContent=`No linked processes.`,T.appendChild(e)}else e.links.forEach(e=>{let t=p(e.targetProcessId),n=document.createElement(`div`);n.className=`process-link-row`;let r=document.createElement(`div`);r.className=`process-link-copy`,r.innerHTML=`
        <div class="process-link-primary">
          ${q(bt(e.type))} → ${q(t?.name??e.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${q(t?.level??`Missing process`)}${e.label?` · ${q(e.label)}`:``}
        </div>
      `;let i=document.createElement(`button`);i.type=`button`,i.className=`process-link-remove`,i.textContent=`Remove`,i.dataset.processLinkId=e.id,i.addEventListener(`click`,()=>Et(e.id)),n.append(r,i),T.appendChild(n)});xt()}function X(){if(!P){Oe.hidden=!1,S.hidden=!0;return}let e=P.businessObject,t=H(P.id);Oe.hidden=!0,S.hidden=!1,ke.textContent=e?.name||P.id,Ae.textContent=mt(e?.$type),je.value=P.id,e?.calledElement?(Me.hidden=!1,Ne.value=e.calledElement):(Me.hidden=!0,Ne.value=``),Pe.value=t.status,Fe.value=t.description,gt(t.ownerPersonId),vt(t),St(t),ze.value=Y(t.systems),Be.value=Y(t.controls),Ve.value=Y(t.risks),He.value=Y(t.regulations),Ue.value=t.notes}function Ct(){localStorage.setItem(G(),JSON.stringify(F,null,2))}function wt(e=!0){if(!P)return;let t=yt(w.value),n=H(P.id);F.nodes[P.id]={status:Pe.value,description:Fe.value.trim(),ownerPersonId:C.value,responsibleType:t.type,responsibleId:t.id,links:n.links,systems:J(ze.value),controls:J(Be.value),risks:J(Ve.value),regulations:J(He.value),notes:Ue.value.trim()},Ct(),K(),e&&R(`Metadata saved locally`,`success`)}function Tt(){if(!P)return;let e=E.value,t=Ie.value;if(!e||!p(e)){window.alert(`Select a target process.`);return}wt(!1);let n=H(P.id);t===`drill-down`&&n.links.some(e=>e.type===`drill-down`)&&!window.confirm(`This node already has a metadata drill-down link. Add another drill-down relationship?`)||(n.links.push({id:`link-${crypto.randomUUID()}`,type:t,targetProcessId:e,label:Le.value.trim()}),F.nodes[P.id]=n,Ct(),Le.value=``,X(),K(),R(`Process link saved locally`,`success`))}function Et(e){if(!P)return;wt(!1);let t=H(P.id);t.links=t.links.filter(t=>t.id!==e),F.nodes[P.id]=t,Ct(),X(),K(),R(`Process link removed`,`success`)}function Dt(){z(tt(),`${JSON.stringify(F,null,2)}\n`,`application/json;charset=utf-8`),R(`Metadata JSON downloaded`,`success`)}async function Ot(e){let t=await fetch(e.metadataUrl,{cache:`no-store`});if(!t.ok)throw Error(`Unable to load metadata for ${e.name}. HTTP ${t.status}.`);return Qe(await t.json(),e.bpmnProcessId)}async function kt(e,t){if(t){let t=localStorage.getItem(G(e.id));if(t)try{return Qe(JSON.parse(t),e.bpmnProcessId)}catch(e){console.warn(`Unable to parse locally saved metadata; repository metadata will be used.`,e)}}try{return await Ot(e)}catch(t){return console.warn(`Unable to load repository metadata; using an empty metadata record.`,t),L(e.bpmnProcessId)}}async function At(){let e=V(),t=e?`${e.level} ${e.name}`:`the current custom process`;if(window.confirm(`Reset all metadata for ${t} to the repository version? Any locally saved metadata changes for this process will be discarded.`)){if(!e){F=L(`Process_Custom`),P=null,localStorage.removeItem(G()),X(),K(),R(`Custom metadata cleared`,`success`);return}localStorage.removeItem(G(e.id)),F=await kt(e,!1),X(),K(),R(`${e.level} metadata reset to repository version`,`success`)}}async function Z(){if(!(M||!N))try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML while autosaving.`);localStorage.setItem(dt(),e.xml),localStorage.setItem(ft(),A),R(`Saved locally`,`success`)}catch(e){console.error(`Unable to autosave BPMN diagram.`,e),R(`Autosave failed`,`error`)}}function jt(){M||(j!==void 0&&window.clearTimeout(j),R(`Unsaved changes`),j=window.setTimeout(()=>void Z(),500))}async function Q(e,t){M=!0,A=$e(t),P=null,U(),X(),R(`Loading process…`);try{let t=await O.importXML(e);N=!0,W(),lt(),K();let n=t.warnings?.length??0;n>0?(console.warn(`BPMN import warnings:`,t.warnings),R(`Loaded with ${n} warning${n===1?``:`s`}`)):R(`Process loaded`,`success`)}catch(e){throw N=!1,console.error(`Unable to import BPMN diagram.`,e),R(`Unable to load BPMN process`,`error`),e}finally{M=!1}}async function Mt(e){let t=await fetch(e.url,{cache:`no-store`});if(!t.ok)throw Error(`Unable to load ${e.name}. HTTP ${t.status}.`);return t.text()}async function $(e,t=!0){let n=p(e);if(!n){R(`Unknown process: ${e}`,`error`);return}N&&k!==e&&await Z(),j!==void 0&&(window.clearTimeout(j),j=void 0),k=n.id,A=n.filename,P=null,F=await kt(n,t),U(),X(),R(`Loading ${n.level} ${n.name}…`);try{let e=t?localStorage.getItem(dt()):null;if(e){await Q(e,n.filename),R(`Restored ${n.level} ${n.name} from local autosave`,`success`);return}await Q(await Mt(n),n.filename)}catch(e){console.error(`Unable to load process ${n.id}.`,e),R(`Unable to load ${n.name}`,`error`)}}async function Nt(){let e=V();e&&window.confirm(`Reset ${e.level} ${e.name} to the repository BPMN? Local diagram changes will be discarded.`)&&(localStorage.removeItem(dt()),localStorage.removeItem(ft()),await $(e.id,!1),R(`${e.level} ${e.name} reset to repository version`,`success`))}async function Pt(){await Z(),k=null,A=`new-process.bpmn`,F=L(`Process_Custom`),P=null,U(),X();try{await Q(le,A)}catch(e){console.error(`Unable to create new BPMN process.`,e)}}async function Ft(){R(`Preparing BPMN…`);try{let e=await O.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML.`);z($e(A),e.xml,`application/xml;charset=utf-8`),await Z(),R(`BPMN downloaded`,`success`)}catch(e){console.error(`Unable to save BPMN file.`,e),R(`Unable to save BPMN`,`error`)}}async function It(){R(`Preparing SVG…`);try{let e=await O.saveSVG();if(!e.svg)throw Error(`bpmn-js returned no SVG.`);z(et(A),e.svg,`image/svg+xml;charset=utf-8`),R(`SVG downloaded`,`success`)}catch(e){console.error(`Unable to export SVG.`,e),R(`Unable to export SVG`,`error`)}}async function Lt(e){await Z(),k=null,A=e.name,F=L(`Process_Custom`),P=null,U(),X(),R(`Opening ${e.name}…`);try{await Q(await e.text(),e.name)}catch(t){console.error(`Unable to open ${e.name}.`,t),R(`Unable to open ${e.name}`,`error`)}}function Rt(){let e=V(),t=e?.parentId;if(t&&t!==e.id&&p(t)){$(t);return}let n=p(u);n&&n.id!==e?.id&&$(n.id)}function zt(e){if(!e.element)return;let t=st(e.element);t&&(e.originalEvent?.preventDefault(),e.originalEvent?.stopPropagation(),$(t.id))}function Bt(e){P=e.newSelection?.[0]??null,X();let t=P?.businessObject;document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-node-selection-changed`,{detail:P?{processId:k??``,elementId:P.id,name:t?.name||P.id,bpmnType:t?.$type||``}:null}))}function Vt(){Je.setData(I),D.open||D.showModal()}function Ht(){U(),X(),K()}function Ut(e){let t=e.detail;t?.processId&&$(t.processId)}async function Wt(){try{await ie(!0)}catch(e){console.error(`Unable to initialise process repository.`,e),R(`Unable to initialise process repository`,`error`);return}I=await r(!0),Je.setData(I),U(),X();let e=p(u)??Object.values(d).find(e=>e.active)??Object.values(d)[0];e?await $(e.id):await Pt()}pe.addEventListener(`click`,Rt),me.addEventListener(`click`,()=>void Pt()),he.addEventListener(`click`,()=>{x.value=``,x.click()}),ge.addEventListener(`click`,()=>{let e=p(u);e&&$(e.id)}),y.addEventListener(`click`,()=>void Nt()),_e.addEventListener(`click`,()=>void Ft()),ve.addEventListener(`click`,()=>void It()),b.addEventListener(`click`,()=>pt(!qe)),De.addEventListener(`click`,()=>pt(!1)),ye.addEventListener(`click`,Vt),be.addEventListener(`click`,()=>nt().undo()),xe.addEventListener(`click`,()=>nt().redo()),Se.addEventListener(`click`,()=>ut(-.1)),Ce.addEventListener(`click`,W),we.addEventListener(`click`,()=>ut(.1)),We.addEventListener(`click`,Dt),Ge.addEventListener(`click`,()=>void At()),Re.addEventListener(`click`,Tt),S.addEventListener(`submit`,e=>{e.preventDefault(),wt()}),x.addEventListener(`change`,()=>{let e=x.files?.[0];e&&Lt(e)}),D.addEventListener(`click`,e=>{e.target===D&&D.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,Ht),document.addEventListener(`enterprise-modeler:open-process`,Ut),O.on(`commandStack.changed`,()=>{lt(),jt()}),O.on(`element.dblclick`,zt),O.on(`selection.changed`,Bt),window.addEventListener(`resize`,W),Wt();