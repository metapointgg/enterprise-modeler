import{t as e}from"./Modeler-Bi03ARIg.js";import{C as t,E as n,a as r,b as i,c as a,d as o,f as s,g as c,h as ee,n as te,r as ne,s as re,t as ie,u as l,w as ae,y as oe}from"./modelWorkspace-CUbotQ8L.js";import{a as se,c as ce,f as u,i as d,l as le,m as ue,n as de,o as fe,p as pe,r as f,s as me,t as he,u as p}from"./organisation-CxgG5bkw.js";import{a as m,f as h,i as ge,n as g,r as _e,s as ve,t as _,u as v}from"./processCatalog-BPh0PYgz.js";/* empty css             */import{t as ye}from"./enterpriseModelSeed-DQBrThq1.js";function y(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function b(e){return[...e].sort((e,t)=>e.name.localeCompare(t.name))}var be=class{root;options;data;activeTab=`people`;selectedPersonId=null;selectedPositionId=null;selectedDepartmentId=null;selectedRoleId=null;selectedTeamId=null;constructor(e,t,n){this.root=e,this.data=structuredClone(t),this.options=n,this.render()}setData(e){this.data=structuredClone(e),this.ensureSelectionsExist(),this.render()}getData(){return structuredClone(this.data)}ensureSelectionsExist(){this.selectedPersonId&&!this.data.people.some(e=>e.id===this.selectedPersonId)&&(this.selectedPersonId=null),this.selectedPositionId&&!this.data.positions.some(e=>e.id===this.selectedPositionId)&&(this.selectedPositionId=null),this.selectedDepartmentId&&!this.data.departments.some(e=>e.id===this.selectedDepartmentId)&&(this.selectedDepartmentId=null),this.selectedRoleId&&!this.data.roles.some(e=>e.id===this.selectedRoleId)&&(this.selectedRoleId=null),this.selectedTeamId&&!this.data.teams.some(e=>e.id===this.selectedTeamId)&&(this.selectedTeamId=null)}notifyChanged(){this.options.onChange(this.getData())}render(){let e=this.selectedEntityReference();this.root.innerHTML=`
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
    `,this.bindCommonEvents(),this.bindActiveTabEvents()}renderTabButton(e,t){return`<button class="organisation-tab${this.activeTab===e?` organisation-tab-active`:``}" type="button" data-tab="${e}">${t}</button>`}renderActiveTab(){switch(this.activeTab){case`positions`:return this.renderPositions();case`departments`:return this.renderDepartments();case`roles`:return this.renderRoles();case`teams`:return this.renderTeams();default:return this.renderPeople()}}renderPeople(){let e=b(this.data.people),t=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>People</span>
            <button id="organisation-new-person" class="toolbar-button" type="button">New Person</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No people have been added yet.</div>`:e.map(e=>{let t=[ce(this.data,e.positionId),p(this.data,fe(this.data,e)),d(this.data,se(this.data,e))].filter(Boolean).join(` · `)||e.email||`No position assigned`;return`
            <button class="organisation-list-item${e.id===this.selectedPersonId?` organisation-list-item-selected`:``}" type="button" data-edit-person="${y(e.id)}">
              <span class="organisation-list-primary">${y(e.name)}</span>
              <span class="organisation-list-secondary">${y(t)}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPersonForm(t)}
        </div>
      </div>
    `}renderPersonForm(e){let t=b(this.data.positions).filter(t=>t.id===e?.positionId||t.active&&le(this.data,t.id).length===0).map(t=>{let n=p(this.data,t.roleId),r=d(this.data,t.departmentId),i=[t.name,n,r].filter(Boolean).join(` — `);return`<option value="${y(t.id)}"${t.id===e?.positionId?` selected`:``}>${y(i)}</option>`}).join(``),n=e?me(this.data,e.positionId):void 0,r=n?p(this.data,n.roleId):``,i=n?d(this.data,n.departmentId):``,a=n?ce(this.data,n.managerPositionId):``,o=b(this.data.departments).map(t=>`<option value="${y(t.id)}"${t.id===e?.departmentId?` selected`:``}>${y(t.name)}</option>`).join(``),s=b(this.data.roles).map(t=>`<option value="${y(t.id)}"${t.id===e?.roleId?` selected`:``}>${y(t.name)}</option>`).join(``),c=b(this.data.people.filter(t=>t.id!==e?.id)).map(t=>`<option value="${y(t.id)}"${t.id===e?.managerPersonId?` selected`:``}>${y(t.name)}</option>`).join(``),ee=b(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="teamIds" value="${y(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${y(t.name)}</span>
        </label>
      `).join(``);return`
      <form id="organisation-person-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit person`:`Add person`}</div>
        ${e?`<div class="organisation-record-id">${y(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Name</span>
          <input id="organisation-person-name" type="text" required value="${y(e?.name??``)}" />
        </label>

        <label class="metadata-field">
          <span>Email</span>
          <input id="organisation-person-email" type="email" value="${y(e?.email??``)}" />
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
            <strong>${y(n.name)}</strong><br />
            Role: ${y(r||`Not set`)}<br />
            Department: ${y(i||`Not set`)}<br />
            Reports to position: ${y(a||`Not set`)}
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
                ${s}
              </select>
            </label>

            <label class="metadata-field">
              <span>Manager</span>
              <select id="organisation-person-manager">
                <option value="">Not set</option>
                ${c}
              </select>
            </label>

            <fieldset class="organisation-fieldset">
              <legend>Teams</legend>
              <div class="organisation-checkbox-list">
                ${ee||`<span class="organisation-muted">No teams defined.</span>`}
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
          <textarea id="organisation-person-notes" rows="3">${y(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Person`:`Add Person`}</button>
          ${e?`<button id="organisation-delete-person" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderPositions(){let e=b(this.data.positions),t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId)??null:null;return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>Positions</span>
            <button id="organisation-new-position" class="toolbar-button" type="button">New Position</button>
          </div>
          <div class="organisation-list">${e.length===0?`<div class="organisation-empty">No positions have been added yet.</div>`:e.map(e=>{let t=p(this.data,e.roleId),n=d(this.data,e.departmentId),r=le(this.data,e.id),i=r.length===0?`Vacant`:r.map(e=>e.name).join(`, `);return`
            <button class="organisation-list-item${e.id===this.selectedPositionId?` organisation-list-item-selected`:``}" type="button" data-edit-position="${y(e.id)}">
              <span class="organisation-list-primary">${y(e.name)}</span>
              <span class="organisation-list-secondary">${y([t,n,i].filter(Boolean).join(` · `))}${e.active?``:` · Inactive`}</span>
            </button>
          `}).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">
          ${this.renderPositionForm(t)}
        </div>
      </div>
    `}renderPositionForm(e){let t=b(this.data.roles).map(t=>`<option value="${y(t.id)}"${t.id===e?.roleId?` selected`:``}>${y(t.name)}</option>`).join(``),n=this.renderDepartmentOptions(e?.departmentId),r=b(this.data.positions.filter(t=>t.id!==e?.id)).map(t=>{let n=p(this.data,t.roleId),r=n?`${t.name} — ${n}`:t.name;return`<option value="${y(t.id)}"${t.id===e?.managerPositionId?` selected`:``}>${y(r)}</option>`}).join(``),i=b(this.data.teams).map(t=>`
        <label class="organisation-checkbox-row">
          <input type="checkbox" name="positionTeamIds" value="${y(t.id)}"${e?.teamIds.includes(t.id)?` checked`:``} />
          <span>${y(t.name)}</span>
        </label>
      `).join(``),a=e?le(this.data,e.id):[];return`
      <form id="organisation-position-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit position`:`Add position`}</div>
        ${e?`<div class="organisation-record-id">${y(e.id)}</div>`:``}

        <label class="metadata-field">
          <span>Position name</span>
          <input id="organisation-position-name" type="text" required value="${y(e?.name??``)}" placeholder="e.g. Operations Analyst 01" />
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
            Current occupant: ${y(a.length>0?a.map(e=>e.name).join(`, `):`VACANT`)}
          </div>
        `:``}

        <label class="organisation-checkbox-row organisation-active-row">
          <input id="organisation-position-active" type="checkbox"${e?.active===!1?``:` checked`} />
          <span>Active establishment position</span>
        </label>

        <label class="metadata-field">
          <span>Notes</span>
          <textarea id="organisation-position-notes" rows="3">${y(e?.notes??``)}</textarea>
        </label>

        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Position`:`Add Position`}</button>
          ${e?`<button id="organisation-delete-position" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartments(){return this.renderReferenceSection(`Department`,`department`,b(this.data.departments),this.selectedDepartmentId,this.renderDepartmentForm())}renderDepartmentForm(){let e=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId)??null:null,t=b(this.data.departments.filter(t=>t.id!==e?.id)).map(t=>`<option value="${y(t.id)}"${t.id===e?.parentDepartmentId?` selected`:``}>${y(t.name)}</option>`).join(``);return`
      <form id="organisation-department-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit department`:`Add department`}</div>
        ${e?`<div class="organisation-record-id">${y(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-department-name" type="text" required value="${y(e?.name??``)}" /></label>
        <label class="metadata-field">
          <span>Parent department</span>
          <select id="organisation-department-parent"><option value="">None</option>${t}</select>
        </label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Department`:`Add Department`}</button>
          ${e?`<button id="organisation-delete-department" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderRoles(){return this.renderReferenceSection(`Role`,`role`,b(this.data.roles),this.selectedRoleId,this.renderRoleForm())}renderRoleForm(){let e=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-role-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit role`:`Add role`}</div>
        ${e?`<div class="organisation-record-id">${y(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-role-name" type="text" required value="${y(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Default department</span><select id="organisation-role-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Role`:`Add Role`}</button>
          ${e?`<button id="organisation-delete-role" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderTeams(){return this.renderReferenceSection(`Team`,`team`,b(this.data.teams),this.selectedTeamId,this.renderTeamForm())}renderTeamForm(){let e=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId)??null:null,t=this.renderDepartmentOptions(e?.departmentId);return`
      <form id="organisation-team-form" class="organisation-form">
        <div class="organisation-editor-heading">${e?`Edit team`:`Add team`}</div>
        ${e?`<div class="organisation-record-id">${y(e.id)}</div>`:``}
        <label class="metadata-field"><span>Name</span><input id="organisation-team-name" type="text" required value="${y(e?.name??``)}" /></label>
        <label class="metadata-field"><span>Department</span><select id="organisation-team-department"><option value="">Not set</option>${t}</select></label>
        <div class="metadata-actions">
          <button class="toolbar-button toolbar-button-primary" type="submit">${e?`Save Team`:`Add Team`}</button>
          ${e?`<button id="organisation-delete-team" class="toolbar-button toolbar-button-danger" type="button">Delete</button>`:``}
        </div>
      </form>
    `}renderDepartmentOptions(e){return b(this.data.departments).map(t=>`<option value="${y(t.id)}"${t.id===e?` selected`:``}>${y(t.name)}</option>`).join(``)}renderReferenceSection(e,t,n,r,i){return`
      <div class="organisation-split">
        <div class="organisation-list-pane">
          <div class="organisation-section-heading">
            <span>${e}s</span>
            <button id="organisation-new-${t}" class="toolbar-button" type="button">New ${e}</button>
          </div>
          <div class="organisation-list">${n.length===0?`<div class="organisation-empty">No ${e.toLowerCase()}s have been added yet.</div>`:n.map(e=>`
          <button class="organisation-list-item${e.id===r?` organisation-list-item-selected`:``}" type="button" data-edit-${t}="${y(e.id)}">
            <span class="organisation-list-primary">${y(e.name)}</span>
          </button>
        `).join(``)}</div>
        </div>
        <div class="organisation-editor-pane">${i}</div>
      </div>
    `}selectedEntityReference(){switch(this.activeTab){case`people`:return this.selectedPersonId?{type:`person`,id:this.selectedPersonId}:null;case`positions`:return this.selectedPositionId?{type:`position`,id:this.selectedPositionId}:null;case`roles`:return this.selectedRoleId?{type:`role`,id:this.selectedRoleId}:null;case`departments`:return this.selectedDepartmentId?{type:`department`,id:this.selectedDepartmentId}:null;case`teams`:return this.selectedTeamId?{type:`team`,id:this.selectedTeamId}:null;default:return null}}openSelectedInExplorer(e){let t=this.selectedEntityReference();t&&(this.options.onClose(),document.dispatchEvent(new CustomEvent(`enterprise-modeler:open-enterprise-explorer`,{detail:{...t,mode:e}})))}bindCommonEvents(){this.root.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.tab;t&&(this.activeTab=t,this.render())})}),this.root.querySelector(`#organisation-close`)?.addEventListener(`click`,this.options.onClose),this.root.querySelector(`#organisation-explore`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`relationships`)),this.root.querySelector(`#organisation-impact`)?.addEventListener(`click`,()=>this.openSelectedInExplorer(`impact`)),this.root.querySelector(`#organisation-export`)?.addEventListener(`click`,()=>this.options.onExport(this.getData())),this.root.querySelector(`#organisation-reset`)?.addEventListener(`click`,()=>void this.resetFromRepository())}bindActiveTabEvents(){this.activeTab===`people`?this.bindPeopleEvents():this.activeTab===`positions`?this.bindPositionEvents():this.activeTab===`departments`?this.bindDepartmentEvents():this.activeTab===`roles`?this.bindRoleEvents():this.bindTeamEvents()}bindPeopleEvents(){this.root.querySelector(`#organisation-new-person`)?.addEventListener(`click`,()=>{this.selectedPersonId=null,this.render()}),this.root.querySelectorAll(`[data-edit-person]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPersonId=e.dataset.editPerson??null,this.render()})}),this.root.querySelector(`#organisation-person-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePerson()}),this.root.querySelector(`#organisation-delete-person`)?.addEventListener(`click`,()=>this.deletePerson())}bindPositionEvents(){this.root.querySelector(`#organisation-new-position`)?.addEventListener(`click`,()=>{this.selectedPositionId=null,this.render()}),this.root.querySelectorAll(`[data-edit-position]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedPositionId=e.dataset.editPosition??null,this.render()})}),this.root.querySelector(`#organisation-position-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.savePosition()}),this.root.querySelector(`#organisation-delete-position`)?.addEventListener(`click`,()=>this.deletePosition())}bindDepartmentEvents(){this.root.querySelector(`#organisation-new-department`)?.addEventListener(`click`,()=>{this.selectedDepartmentId=null,this.render()}),this.root.querySelectorAll(`[data-edit-department]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedDepartmentId=e.dataset.editDepartment??null,this.render()})}),this.root.querySelector(`#organisation-department-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveDepartment()}),this.root.querySelector(`#organisation-delete-department`)?.addEventListener(`click`,()=>this.deleteDepartment())}bindRoleEvents(){this.root.querySelector(`#organisation-new-role`)?.addEventListener(`click`,()=>{this.selectedRoleId=null,this.render()}),this.root.querySelectorAll(`[data-edit-role]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedRoleId=e.dataset.editRole??null,this.render()})}),this.root.querySelector(`#organisation-role-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveRole()}),this.root.querySelector(`#organisation-delete-role`)?.addEventListener(`click`,()=>this.deleteRole())}bindTeamEvents(){this.root.querySelector(`#organisation-new-team`)?.addEventListener(`click`,()=>{this.selectedTeamId=null,this.render()}),this.root.querySelectorAll(`[data-edit-team]`).forEach(e=>{e.addEventListener(`click`,()=>{this.selectedTeamId=e.dataset.editTeam??null,this.render()})}),this.root.querySelector(`#organisation-team-form`)?.addEventListener(`submit`,e=>{e.preventDefault(),this.saveTeam()}),this.root.querySelector(`#organisation-delete-team`)?.addEventListener(`click`,()=>this.deleteTeam())}getInputValue(e){return this.root.querySelector(`#${e}`)?.value.trim()??``}savePerson(){let e=this.getInputValue(`organisation-person-name`);if(!e)return;let t=this.getInputValue(`organisation-person-position`)||void 0,n=this.root.querySelector(`#organisation-person-active`)?.checked??!0,r=this.selectedPersonId?this.data.people.find(e=>e.id===this.selectedPersonId):void 0;if(t&&n){let e=this.data.people.find(e=>e.active&&e.positionId===t&&e.id!==r?.id);if(e){window.alert(`That position is already occupied by ${e.name}.`);return}}let i=!!t,a=i?[]:Array.from(this.root.querySelectorAll(`input[name="teamIds"]:checked`)).map(e=>e.value),o={id:r?.id??f(`person`),name:e,email:this.getInputValue(`organisation-person-email`),positionId:t,departmentId:i?void 0:this.getInputValue(`organisation-person-department`)||void 0,roleId:i?void 0:this.getInputValue(`organisation-person-role`)||void 0,managerPersonId:i?void 0:this.getInputValue(`organisation-person-manager`)||void 0,teamIds:a,active:n,notes:this.getInputValue(`organisation-person-notes`)};r?Object.assign(r,o):this.data.people.push(o),this.selectedPersonId=o.id,this.notifyChanged(),this.render()}deletePerson(){if(!this.selectedPersonId)return;let e=this.data.people.find(e=>e.id===this.selectedPersonId);!e||!window.confirm(`Delete ${e.name}? Existing process metadata references to this person will become unresolved.`)||(this.data.people=this.data.people.filter(t=>t.id!==e.id),this.data.people.forEach(t=>{t.managerPersonId===e.id&&(t.managerPersonId=void 0)}),this.selectedPersonId=null,this.notifyChanged(),this.render())}savePosition(){let e=this.getInputValue(`organisation-position-name`);if(!e)return;let t=this.selectedPositionId?this.data.positions.find(e=>e.id===this.selectedPositionId):void 0,n=this.getInputValue(`organisation-position-manager`)||void 0,r=t?.id??f(`position`);if(n&&this.wouldCreatePositionCycle(r,n)){window.alert(`That reporting relationship would create a circular Position hierarchy.`);return}let i=Array.from(this.root.querySelectorAll(`input[name="positionTeamIds"]:checked`)).map(e=>e.value),a=this.root.querySelector(`#organisation-position-active`)?.checked??!0,o={id:r,name:e,roleId:this.getInputValue(`organisation-position-role`)||void 0,departmentId:this.getInputValue(`organisation-position-department`)||void 0,managerPositionId:n,teamIds:i,active:a,notes:this.getInputValue(`organisation-position-notes`)};t?Object.assign(t,o):this.data.positions.push(o),this.selectedPositionId=o.id,this.notifyChanged(),this.render()}wouldCreatePositionCycle(e,t){let n=t,r=new Set;for(;n;){if(n===e||r.has(n))return!0;r.add(n),n=this.data.positions.find(e=>e.id===n)?.managerPositionId}return!1}deletePosition(){if(!this.selectedPositionId)return;let e=this.data.positions.find(e=>e.id===this.selectedPositionId);if(!e)return;let t=le(this.data,e.id),n=t.length>0?` ${t.map(e=>e.name).join(`, `)} will become unassigned.`:``;window.confirm(`Delete position ${e.name}?${n} Child positions will become top-level/unassigned.`)&&(this.data.positions=this.data.positions.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.managerPositionId===e.id&&(t.managerPositionId=void 0)}),this.data.people.forEach(t=>{t.positionId===e.id&&(t.positionId=void 0)}),this.selectedPositionId=null,this.notifyChanged(),this.render())}saveDepartment(){let e=this.getInputValue(`organisation-department-name`);if(!e)return;let t=this.selectedDepartmentId?this.data.departments.find(e=>e.id===this.selectedDepartmentId):void 0,n={id:t?.id??f(`department`),name:e,parentDepartmentId:this.getInputValue(`organisation-department-parent`)||void 0};t?Object.assign(t,n):this.data.departments.push(n),this.selectedDepartmentId=n.id,this.notifyChanged(),this.render()}deleteDepartment(){if(!this.selectedDepartmentId)return;let e=this.data.departments.find(e=>e.id===this.selectedDepartmentId);!e||!window.confirm(`Delete department ${e.name}? Department references will be cleared.`)||(this.data.departments=this.data.departments.filter(t=>t.id!==e.id),this.data.departments.forEach(t=>{t.parentDepartmentId===e.id&&(t.parentDepartmentId=void 0)}),this.data.roles.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.teams.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.positions.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.data.people.forEach(t=>{t.departmentId===e.id&&(t.departmentId=void 0)}),this.selectedDepartmentId=null,this.notifyChanged(),this.render())}saveRole(){let e=this.getInputValue(`organisation-role-name`);if(!e)return;let t=this.selectedRoleId?this.data.roles.find(e=>e.id===this.selectedRoleId):void 0,n={id:t?.id??f(`role`),name:e,departmentId:this.getInputValue(`organisation-role-department`)||void 0};t?Object.assign(t,n):this.data.roles.push(n),this.selectedRoleId=n.id,this.notifyChanged(),this.render()}deleteRole(){if(!this.selectedRoleId)return;let e=this.data.roles.find(e=>e.id===this.selectedRoleId);!e||!window.confirm(`Delete role ${e.name}? Role references will be cleared from positions and legacy people records.`)||(this.data.roles=this.data.roles.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.data.people.forEach(t=>{t.roleId===e.id&&(t.roleId=void 0)}),this.selectedRoleId=null,this.notifyChanged(),this.render())}saveTeam(){let e=this.getInputValue(`organisation-team-name`);if(!e)return;let t=this.selectedTeamId?this.data.teams.find(e=>e.id===this.selectedTeamId):void 0,n={id:t?.id??f(`team`),name:e,departmentId:this.getInputValue(`organisation-team-department`)||void 0};t?Object.assign(t,n):this.data.teams.push(n),this.selectedTeamId=n.id,this.notifyChanged(),this.render()}deleteTeam(){if(!this.selectedTeamId)return;let e=this.data.teams.find(e=>e.id===this.selectedTeamId);!e||!window.confirm(`Delete team ${e.name}? Team references will be cleared.`)||(this.data.teams=this.data.teams.filter(t=>t.id!==e.id),this.data.positions.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.data.people.forEach(t=>{t.teamIds=t.teamIds.filter(t=>t!==e.id)}),this.selectedTeamId=null,this.notifyChanged(),this.render())}async resetFromRepository(){if(window.confirm(`Reset the organisation model to the repository version? All locally saved organisation changes will be discarded.`))try{let e=await this.options.onReset();this.data=structuredClone(e),this.selectedPersonId=null,this.selectedPositionId=null,this.selectedDepartmentId=null,this.selectedRoleId=null,this.selectedTeamId=null,this.notifyChanged(),this.render()}catch(e){console.error(`Unable to reset organisation data.`,e),window.alert(`Unable to reset the organisation model from the repository.`)}}},xe=`<?xml version="1.0" encoding="UTF-8"?>
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
</bpmn:definitions>`,Se=document.querySelector(`#app`);if(!Se)throw Error(`Application root element #app was not found.`);Se.innerHTML=`
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
`;function x(e){let t=document.getElementById(e);if(!t)throw Error(`Required element #${e} was not found.`);return t}var Ce=x(`document-name`),we=x(`process-level`),S=x(`breadcrumbs`),C=x(`status`),Te=x(`back-button`),Ee=x(`new-button`),De=x(`open-button`),Oe=x(`open-model-button`),ke=x(`home-button`),Ae=x(`reset-button`),je=x(`save-button`),Me=x(`svg-button`),Ne=x(`metadata-button`),Pe=x(`organisation-button`),Fe=x(`undo-button`),Ie=x(`redo-button`),Le=x(`zoom-out-button`),Re=x(`fit-button`),ze=x(`zoom-in-button`),w=x(`file-input`),Be=x(`canvas`),Ve=x(`metadata-panel`),He=x(`metadata-close-button`),Ue=x(`metadata-empty`),We=x(`metadata-form`),Ge=x(`metadata-node-name`),Ke=x(`metadata-node-type`),qe=x(`metadata-node-id`),Je=x(`metadata-called-element-row`),Ye=x(`metadata-called-element`),Xe=x(`metadata-status`),Ze=x(`metadata-description`),T=x(`metadata-owner`),E=x(`metadata-responsible`),Qe=x(`metadata-process-links`),$e=x(`metadata-link-type`),D=x(`metadata-link-target`),et=x(`metadata-link-label`),tt=x(`metadata-link-add`),nt=x(`metadata-systems`),rt=x(`metadata-controls`),it=x(`metadata-risks`),at=x(`metadata-regulations`),ot=x(`metadata-notes`),st=x(`metadata-export-button`),ct=x(`metadata-reset-button`),O=x(`organisation-dialog`),lt=x(`organisation-manager-root`),k=new e({container:Be,keyboard:{bindTo:window}}),A=null,j=`new-process.bpmn`,M,N=!1,P=!1,ut=!1,F=null,I=z(`Process_Custom`),L=he(),R=new be(lt,L,{onChange:e=>{L=e,ue(L),Z(),B(`Organisation changes saved locally`,`success`)},onExport:e=>{de(e),B(`Organisation JSON downloaded`,`success`)},onReset:async()=>{let e=await pe();return L=e,Z(),B(`Organisation reset to repository version`,`success`),e},onClose:()=>O.close()});function dt(){return{status:``,description:``,ownerPersonId:``,responsibleType:``,responsibleId:``,links:[],systems:[],controls:[],risks:[],regulations:[],notes:``}}function ft(e){let t=e.type;if(t!==`drill-down`&&t!==`related`&&t!==`exception`&&t!==`supporting`)return null;let n=e.targetProcessId?.trim()??``;return n?{id:e.id||`link-${crypto.randomUUID()}`,type:t,targetProcessId:n,label:e.label?.trim()??``}:null}function pt(e){let t=dt();if(!e)return t;let n=Array.isArray(e.links)?e.links.map(e=>ft(e)).filter(e=>!!e):[];return{status:e.status??``,description:e.description??``,ownerPersonId:e.ownerPersonId??``,responsibleType:e.responsibleType===`role`||e.responsibleType===`team`?e.responsibleType:``,responsibleId:e.responsibleId??``,links:n,systems:Array.isArray(e.systems)?e.systems:[],controls:Array.isArray(e.controls)?e.controls:[],risks:Array.isArray(e.risks)?e.risks:[],regulations:Array.isArray(e.regulations)?e.regulations:[],notes:e.notes??``}}function mt(e,t){let n=Object.fromEntries(Object.entries(e.nodes??{}).map(([e,t])=>[e,pt(t)]));return{schemaVersion:3,processId:e.processId||t,nodes:n}}function z(e){return{schemaVersion:3,processId:e,nodes:{}}}function B(e,t=`normal`){C.textContent=e,C.classList.remove(`status-success`,`status-error`),t===`success`?C.classList.add(`status-success`):t===`error`&&C.classList.add(`status-error`)}function ht(e){let t=e.trim();return t?/\.(bpmn|xml)$/i.test(t)?t:`${t}.bpmn`:`process.bpmn`}function gt(e){return e.replace(/\.(bpmn|xml)$/i,``)+`.svg`}function _t(){let e=H();return e?`${e.id}.json`:j.replace(/\.(bpmn|xml)$/i,``)+`.json`}function V(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(i),0)}function vt(){return k.get(`canvas`)}function yt(){return k.get(`commandStack`)}function bt(){return k.get(`elementRegistry`)}function xt(){return k.get(`overlays`)}function H(){return v(A??void 0)??null}function St(e){let t=e.businessObject;return t?.$type!==`bpmn:CallActivity`||!t.calledElement?null:ve(t.calledElement)??null}function U(e){return I.nodes[e]??dt()}function Ct(e){let t=U(e).links.find(e=>e.type===`drill-down`&&v(e.targetProcessId)?.active);return t?v(t.targetProcessId)??null:null}function wt(e){return St(e)??Ct(e.id)}function Tt(e){let t=[e],n=e.parentId,r=new Set([e.id]);for(;n&&!r.has(n);){let e=v(n);if(!e)break;r.add(e.id),t.unshift(e),n=e.parentId}return t}function W(){S.replaceChildren();let e=H();if(!e){we.textContent=`Custom`,Ce.textContent=j,Te.disabled=!0,Ae.disabled=!0;let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=j,S.appendChild(e);return}we.textContent=e.level,Ce.textContent=e.name,Te.disabled=!e.parentId,Ae.disabled=!1,Tt(e).forEach((t,n)=>{if(n>0){let e=document.createElement(`span`);e.className=`breadcrumb-separator`,e.textContent=`›`,S.appendChild(e)}if(t.id===e.id){let e=document.createElement(`span`);e.className=`breadcrumb-current`,e.textContent=`${t.level} ${t.name}`,S.appendChild(e);return}let r=document.createElement(`button`);r.className=`breadcrumb-button`,r.type=`button`,r.textContent=`${t.level} ${t.name}`,r.addEventListener(`click`,()=>void $(t.id)),S.appendChild(r)})}function Et(){let e=yt();Fe.disabled=!e.canUndo(),Ie.disabled=!e.canRedo()}function G(){try{vt().zoom(`fit-viewport`)}catch(e){console.error(`Unable to fit BPMN diagram to viewport.`,e)}}function Dt(e){let t=vt(),n=t.zoom();t.zoom(Math.max(.2,Math.min(4,n+e)))}function Ot(e=A){return e?`${_}${e}.xml`:`${_}custom.xml`}function kt(e=A){return e?`${_}${e}.filename`:`${_}custom.filename`}function K(e=A){return e?`${ge}${e}`:`${ge}custom`}function q(){if(!P)return;let e=xt();e.clear();let t=vt();bt().getAll().forEach(n=>{let r=wt(n),i=U(n.id).links.filter(e=>v(e.targetProcessId));r&&(t.addMarker(n.id,`drill-down-target`),e.add(n.id,{position:{top:-30,right:0},html:`<div class="drill-down-badge" title="Open ${J(r.name)}">↘ ${J(r.level)}</div>`}));let a=i.filter(e=>!(e.type===`drill-down`&&r?.id===e.targetProcessId)).length;a>0&&e.add(n.id,{position:{bottom:-26,right:0},html:`<div class="process-link-badge" title="${a} additional linked process${a===1?``:`es`}">↗ ${a}</div>`})})}function J(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function At(e){ut=e,Ve.classList.toggle(`metadata-panel-hidden`,!e),Ne.classList.toggle(`toolbar-button-active`,e),Ne.setAttribute(`aria-pressed`,String(e)),window.setTimeout(()=>G(),0)}function jt(e){return e?e.replace(/^bpmn:/,``).replace(/([a-z])([A-Z])/g,`$1 $2`):`BPMN element`}function Y(e){return e.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0)}function X(e){return(e??[]).join(`
`)}function Mt(e){let t=[p(L,fe(L,e)),d(L,se(L,e))].filter(Boolean);return t.length>0?`${e.name} — ${t.join(` · `)}`:e.name}function Nt(e){T.replaceChildren(new Option(`Not set`,``));let t=[...L.people].filter(e=>e.active).sort((e,t)=>e.name.localeCompare(t.name));t.forEach(e=>{T.add(new Option(Mt(e),e.id))}),e&&!t.some(t=>t.id===e)&&T.add(new Option(`[Missing or inactive person] ${e}`,e)),T.value=e}function Pt(e){return e.responsibleType&&e.responsibleId?`${e.responsibleType}:${e.responsibleId}`:``}function Ft(e){E.replaceChildren(new Option(`Not set`,``));let t=document.createElement(`optgroup`);t.label=`Roles`,[...L.roles].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let n=d(L,e.departmentId);t.appendChild(new Option(n?`${e.name} — ${n}`:e.name,`role:${e.id}`))});let n=document.createElement(`optgroup`);n.label=`Teams`,[...L.teams].sort((e,t)=>e.name.localeCompare(t.name)).forEach(e=>{let t=d(L,e.departmentId);n.appendChild(new Option(t?`${e.name} — ${t}`:e.name,`team:${e.id}`))}),t.children.length>0&&E.appendChild(t),n.children.length>0&&E.appendChild(n);let r=Pt(e);r&&!Array.from(E.options).some(e=>e.value===r)&&E.add(new Option(`[Missing reference] ${r}`,r)),E.value=r}function It(e){if(!e)return{type:``,id:``};let t=e.indexOf(`:`);if(t<1)return{type:``,id:``};let n=e.slice(0,t),r=e.slice(t+1);return n!==`role`&&n!==`team`||!r?{type:``,id:``}:{type:n,id:r}}function Lt(e){switch(e){case`drill-down`:return`Drill down`;case`exception`:return`Exception`;case`supporting`:return`Supporting`;default:return`Related`}}function Rt(){D.replaceChildren(new Option(`Select process`,``));let e=[..._e].filter(e=>e.active).sort((e,t)=>e.sequence-t.sequence),t=Object.values(g).filter(e=>e.active&&e.id!==A);e.forEach(e=>{let n=t.filter(t=>t.layerId===e.id).sort((e,t)=>e.name.localeCompare(t.name));if(n.length===0)return;let r=document.createElement(`optgroup`);r.label=`${e.code} — ${e.name}`,n.forEach(e=>{r.appendChild(new Option(e.name,e.id))}),D.appendChild(r)});let n=t.filter(e=>!_e.some(t=>t.id===e.layerId)).sort((e,t)=>e.name.localeCompare(t.name));if(n.length>0){let e=document.createElement(`optgroup`);e.label=`Unlayered`,n.forEach(t=>e.appendChild(new Option(t.name,t.id))),D.appendChild(e)}}function zt(e){if(Qe.replaceChildren(),e.links.length===0){let e=document.createElement(`div`);e.className=`organisation-muted`,e.textContent=`No linked processes.`,Qe.appendChild(e)}else e.links.forEach(e=>{let t=v(e.targetProcessId),n=document.createElement(`div`);n.className=`process-link-row`;let r=document.createElement(`div`);r.className=`process-link-copy`,r.innerHTML=`
        <div class="process-link-primary">
          ${J(Lt(e.type))} → ${J(t?.name??e.targetProcessId)}
        </div>
        <div class="process-link-secondary">
          ${J(t?.level??`Missing process`)}${e.label?` · ${J(e.label)}`:``}
        </div>
      `;let i=document.createElement(`button`);i.type=`button`,i.className=`process-link-remove`,i.textContent=`Remove`,i.dataset.processLinkId=e.id,i.addEventListener(`click`,()=>Ut(e.id)),n.append(r,i),Qe.appendChild(n)});Rt()}function Z(){if(!F){Ue.hidden=!1,We.hidden=!0;return}let e=F.businessObject,t=U(F.id);Ue.hidden=!0,We.hidden=!1,Ge.textContent=e?.name||F.id,Ke.textContent=jt(e?.$type),qe.value=F.id,e?.calledElement?(Je.hidden=!1,Ye.value=e.calledElement):(Je.hidden=!0,Ye.value=``),Xe.value=t.status,Ze.value=t.description,Nt(t.ownerPersonId),Ft(t),zt(t),nt.value=X(t.systems),rt.value=X(t.controls),it.value=X(t.risks),at.value=X(t.regulations),ot.value=t.notes}function Bt(){localStorage.setItem(K(),JSON.stringify(I,null,2));let e=H();e&&oe(e.metadataUrl,I)}function Vt(e=!0){if(!F)return;let t=It(E.value),n=U(F.id);I.nodes[F.id]={status:Xe.value,description:Ze.value.trim(),ownerPersonId:T.value,responsibleType:t.type,responsibleId:t.id,links:n.links,systems:Y(nt.value),controls:Y(rt.value),risks:Y(it.value),regulations:Y(at.value),notes:ot.value.trim()},Bt(),q(),e&&B(`Metadata saved locally`,`success`)}function Ht(){if(!F)return;let e=D.value,t=$e.value;if(!e||!v(e)){window.alert(`Select a target process.`);return}Vt(!1);let n=U(F.id);t===`drill-down`&&n.links.some(e=>e.type===`drill-down`)&&!window.confirm(`This node already has a metadata drill-down link. Add another drill-down relationship?`)||(n.links.push({id:`link-${crypto.randomUUID()}`,type:t,targetProcessId:e,label:et.value.trim()}),I.nodes[F.id]=n,Bt(),et.value=``,Z(),q(),B(`Process link saved locally`,`success`))}function Ut(e){if(!F)return;Vt(!1);let t=U(F.id);t.links=t.links.filter(t=>t.id!==e),I.nodes[F.id]=t,Bt(),Z(),q(),B(`Process link removed`,`success`)}function Wt(){V(_t(),`${JSON.stringify(I,null,2)}\n`,`application/json;charset=utf-8`),B(`Metadata JSON downloaded`,`success`)}async function Gt(e){return mt(await o(e.metadataUrl),e.bpmnProcessId)}async function Kt(e,t){if(t&&!l()){let t=localStorage.getItem(K(e.id));if(t)try{return mt(JSON.parse(t),e.bpmnProcessId)}catch(e){console.warn(`Unable to parse locally saved metadata; repository metadata will be used.`,e)}}try{return await Gt(e)}catch(t){return console.warn(`Unable to load repository metadata; using an empty metadata record.`,t),z(e.bpmnProcessId)}}async function qt(){let e=H(),t=e?`${e.level} ${e.name}`:`the current custom process`;if(window.confirm(`Reset all metadata for ${t} to the repository version? Any locally saved metadata changes for this process will be discarded.`)){if(!e){I=z(`Process_Custom`),F=null,localStorage.removeItem(K()),Z(),q(),B(`Custom metadata cleared`,`success`);return}localStorage.removeItem(K(e.id)),I=await Kt(e,!1),Z(),q(),B(`${e.level} metadata reset to repository version`,`success`)}}async function Q(){if(!(N||!P))try{let e=await k.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML while autosaving.`);localStorage.setItem(Ot(),e.xml),localStorage.setItem(kt(),j);let t=H();t&&await i(t.url,e.xml),B(l()?`Saved to ${re()}`:`Saved locally`,`success`)}catch(e){console.error(`Unable to autosave BPMN diagram.`,e),B(`Autosave failed`,`error`)}}function Jt(){N||(M!==void 0&&window.clearTimeout(M),B(`Unsaved changes`),M=window.setTimeout(()=>void Q(),500))}async function Yt(e,t){N=!0,j=ht(t),F=null,W(),Z(),B(`Loading process…`);try{let t=await k.importXML(e);P=!0,G(),Et(),q();let n=t.warnings?.length??0;n>0?(console.warn(`BPMN import warnings:`,t.warnings),B(`Loaded with ${n} warning${n===1?``:`s`}`)):B(`Process loaded`,`success`)}catch(e){throw P=!1,console.error(`Unable to import BPMN diagram.`,e),B(`Unable to load BPMN process`,`error`),e}finally{N=!1}}async function Xt(e){return s(e.url)}async function $(e,t=!0){let n=v(e);if(!n){B(`Unknown process: ${e}`,`error`);return}P&&A!==e&&await Q(),M!==void 0&&(window.clearTimeout(M),M=void 0),A=n.id,j=n.filename,F=null,I=await Kt(n,t),W(),Z(),B(`Loading ${n.level} ${n.name}…`);try{let e=t&&!l()?localStorage.getItem(Ot()):null;if(e){await Yt(e,n.filename),B(`Restored ${n.level} ${n.name} from local autosave`,`success`);return}await Yt(await Xt(n),n.filename)}catch(e){console.error(`Unable to load process ${n.id}.`,e),B(`Unable to load ${n.name}`,`error`)}}async function Zt(){let e=H();e&&window.confirm(`Reset ${e.level} ${e.name} to the repository BPMN? Local diagram changes will be discarded.`)&&(localStorage.removeItem(Ot()),localStorage.removeItem(kt()),await $(e.id,!1),B(`${e.level} ${e.name} reset to repository version`,`success`))}async function Qt(){await Q(),A=null,j=`new-process.bpmn`,I=z(`Process_Custom`),F=null,W(),Z();try{await Yt(xe,j)}catch(e){console.error(`Unable to create new BPMN process.`,e)}}async function $t(){B(`Preparing BPMN…`);try{let e=await k.saveXML({format:!0});if(!e.xml)throw Error(`bpmn-js returned no XML.`);if(l()){let t=H();t?await i(t.url,e.xml):V(ht(j),e.xml,`application/xml;charset=utf-8`)}else V(ht(j),e.xml,`application/xml;charset=utf-8`);await Q(),B(l()?`BPMN saved to Enterprise Model folder`:`BPMN downloaded`,`success`)}catch(e){console.error(`Unable to save BPMN file.`,e),B(`Unable to save BPMN`,`error`)}}async function en(){B(`Preparing SVG…`);try{let e=await k.saveSVG();if(!e.svg)throw Error(`bpmn-js returned no SVG.`);V(gt(j),e.svg,`image/svg+xml;charset=utf-8`),B(`SVG downloaded`,`success`)}catch(e){console.error(`Unable to export SVG.`,e),B(`Unable to export SVG`,`error`)}}async function tn(e){await Q(),A=null,j=e.name,I=z(`Process_Custom`),F=null,W(),Z(),B(`Opening ${e.name}…`);try{await Yt(await e.text(),e.name)}catch(t){console.error(`Unable to open ${e.name}.`,t),B(`Unable to open ${e.name}`,`error`)}}function nn(){let e=H(),t=e?.parentId;if(t&&t!==e.id&&v(t)){$(t);return}let n=v(m);n&&n.id!==e?.id&&$(n.id)}function rn(e){if(!e.element)return;let t=wt(e.element);t&&(e.originalEvent?.preventDefault(),e.originalEvent?.stopPropagation(),$(t.id))}function an(e){F=e.newSelection?.[0]??null,Z();let t=F?.businessObject;document.dispatchEvent(new CustomEvent(`enterprise-modeler:process-node-selection-changed`,{detail:F?{processId:A??``,elementId:F.id,name:t?.name||F.id,bpmnType:t?.$type||``}:null}))}function on(){R.setData(L),O.open||O.showModal()}function sn(){W(),Z(),q()}function cn(e){let t=e.detail;t?.processId&&$(t.processId)}async function ln(){try{let e=c(),t=e?await ee():null,n=e?null:await r();await Q();let i=t?ne(t):await te(n??[]);await h(!1),L=await u(!1),R.setData(L);let a=v(m)??Object.values(g).find(e=>e.active)??Object.values(g)[0];a&&await $(a.id,!1),B(`Enterprise Model opened: ${i}`,`success`)}catch(e){console.error(`Unable to open Enterprise Model folder.`,e),B(e instanceof Error?e.message:`Unable to open Enterprise Model folder`,`error`)}}async function un(){if(!c()){window.alert(`Creating a filesystem-backed Enterprise Model requires a browser with direct folder access, such as Microsoft Edge or Google Chrome.`);return}try{let e=await ee(),t=window.prompt(`Enterprise Model name`,e.name||`Enterprise Model`)?.trim();if(!t)return;let n=window.prompt(`Organisation name`,t)?.trim()||t;await Q();let r=await ye(e,{name:t,organisationName:n});await h(!1),L=await u(!1),R.setData(L);let i=v(m)??Object.values(g).find(e=>e.active)??Object.values(g)[0];i&&await $(i.id,!1),B(`Enterprise Model created: ${r}`,`success`)}catch(e){console.error(`Unable to create Enterprise Model.`,e),B(e instanceof Error?e.message:`Unable to create Enterprise Model`,`error`)}}async function dn(){try{let e=await ae();if(!e.enabled){window.alert(`Azure DevOps integration is not enabled. Configure azureDevOps in public/config/runtime.json.`);return}let r=a(),i=window.prompt(`Azure DevOps organisation`,r?.organization||e.defaultOrganization)?.trim();if(!i)return;let o=window.prompt(`Azure DevOps project`,r?.project||e.defaultProject)?.trim();if(!o)return;let s=window.prompt(`Azure DevOps repository`,r?.repository||e.defaultRepository)?.trim();if(!s)return;let c={organization:i,project:o,repository:s,branch:window.prompt(`Branch`,r?.branch||e.defaultBranch||`main`)?.trim()||`main`,modelPath:window.prompt(`Model path within the repository (leave blank when the model is at repository root)`,r?.modelPath||e.defaultModelPath)?.trim()||``};if(await Q(),!n()){await t(c);return}let ee=await ie(c);await h(!1),L=await u(!1),R.setData(L);let te=v(m)??Object.values(g).find(e=>e.active)??Object.values(g)[0];te&&await $(te.id,!1),B(`Azure DevOps Enterprise Model opened: ${ee}`,`success`)}catch(e){console.error(`Unable to open Azure DevOps Enterprise Model.`,e),B(e instanceof Error?e.message:`Unable to open Azure DevOps Enterprise Model`,`error`)}}async function fn(){try{await h(!0)}catch(e){console.error(`Unable to initialise process repository.`,e),B(`Unable to initialise process repository`,`error`);return}L=await u(!0),R.setData(L),W(),Z();let e=v(m)??Object.values(g).find(e=>e.active)??Object.values(g)[0];e?await $(e.id):await Qt()}Te.addEventListener(`click`,nn),Ee.addEventListener(`click`,()=>void Qt()),De.addEventListener(`click`,()=>{w.value=``,w.click()}),Oe.addEventListener(`click`,()=>void ln()),document.addEventListener(`enterprise-modeler:open-enterprise-model`,()=>void ln()),document.addEventListener(`enterprise-modeler:create-enterprise-model`,()=>void un()),document.addEventListener(`enterprise-modeler:open-azure-devops-model`,()=>void dn()),ke.addEventListener(`click`,()=>{let e=v(m);e&&$(e.id)}),Ae.addEventListener(`click`,()=>void Zt()),je.addEventListener(`click`,()=>void $t()),Me.addEventListener(`click`,()=>void en()),Ne.addEventListener(`click`,()=>At(!ut)),He.addEventListener(`click`,()=>At(!1)),Pe.addEventListener(`click`,on),Fe.addEventListener(`click`,()=>yt().undo()),Ie.addEventListener(`click`,()=>yt().redo()),Le.addEventListener(`click`,()=>Dt(-.1)),Re.addEventListener(`click`,G),ze.addEventListener(`click`,()=>Dt(.1)),st.addEventListener(`click`,Wt),ct.addEventListener(`click`,()=>void qt()),tt.addEventListener(`click`,Ht),We.addEventListener(`submit`,e=>{e.preventDefault(),Vt()}),w.addEventListener(`change`,()=>{let e=w.files?.[0];e&&tn(e)}),O.addEventListener(`click`,e=>{e.target===O&&O.close()}),document.addEventListener(`enterprise-modeler:process-repository-changed`,sn),document.addEventListener(`enterprise-modeler:open-process`,cn),k.on(`commandStack.changed`,()=>{Et(),Jt()}),k.on(`element.dblclick`,rn),k.on(`selection.changed`,an),window.addEventListener(`resize`,G),fn();