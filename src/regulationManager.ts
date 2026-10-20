import './regulationManager.css';

import {
  exportRegistryJson,
  generateRegistryId,
  loadProcessGovernance,
  loadRegulationData,
  saveRegulationDataLocally,
  type RegulationData,
  type RegulationRecord,
} from './operatingModelRegistry';
import { getPositionName, loadOrganisation, type OrganisationData } from './organisation';

class RegulationManager {
  private readonly dialog: HTMLDialogElement;
  private readonly root: HTMLDivElement;
  private data: RegulationData = { schemaVersion: 1, regulations: [] };
  private organisation: OrganisationData | null = null;
  private selectedId = '';

  constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'regulation-manager-dialog';
    this.dialog.innerHTML = '<div id="regulation-manager-root"></div>';
    document.body.appendChild(this.dialog);
    const root = this.dialog.querySelector<HTMLDivElement>('#regulation-manager-root');
    if (!root) throw new Error('Unable to initialise Regulatory Catalogue.');
    this.root = root;
    this.dialog.addEventListener('click', (event) => { if (event.target === this.dialog) this.dialog.close(); });
    document.addEventListener('enterprise-modeler:open-regulatory-catalog', (event) => {
      this.selectedId = (event as CustomEvent<{ recordId?: string }>).detail?.recordId ?? '';
      void this.open();
    });
    this.injectEntryPoint();
    new MutationObserver(() => this.injectEntryPoint()).observe(document.body, { subtree: true, childList: true });
  }

  private injectEntryPoint(): void {
    const submenu = document.querySelector<HTMLElement>('.enterprise-modeler-sidebar-section[data-section-id="process"] .enterprise-modeler-sidebar-submenu');
    if (!submenu || submenu.querySelector('[data-regulatory-catalog-entry]')) return;
    const button = document.createElement('button');
    button.className = 'enterprise-modeler-sidebar-submenu-button'; button.type = 'button'; button.dataset.regulatoryCatalogEntry = 'true'; button.textContent = 'Regulatory Catalogue';
    button.addEventListener('click', () => void this.open()); submenu.appendChild(button);
  }

  private async open(): Promise<void> {
    [this.data, this.organisation] = await Promise.all([loadRegulationData(true), loadOrganisation()]);
    if (this.selectedId && !this.data.regulations.some((record) => record.id === this.selectedId)) this.selectedId = '';
    this.render(); if (!this.dialog.open) this.dialog.showModal();
  }

  private render(): void {
    const selected = this.data.regulations.find((record) => record.id === this.selectedId) ?? null;
    const rows = this.data.regulations.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name)).map((record)=>`<button class="regulation-list-item${record.id===this.selectedId?' regulation-list-item-selected':''}" type="button" data-regulation-id="${escapeHtml(record.id)}"><strong>${escapeHtml(record.name)}</strong><span>${escapeHtml(record.category||'Uncategorised')}${record.jurisdiction?` · ${escapeHtml(record.jurisdiction)}`:''}${record.active?'':' · Inactive'}</span></button>`).join('');
    this.root.innerHTML = `<div class="regulation-manager"><header class="regulation-manager-header"><div><div class="regulation-manager-title">Regulatory Catalogue</div><div class="regulation-manager-subtitle">Process-linked regulatory and policy obligations. Baseline entries require validation before process approval.</div></div><div class="regulation-manager-actions"><button id="regulation-export" class="toolbar-button" type="button">Export Catalogue</button><button id="regulation-close" class="metadata-close-button" type="button">×</button></div></header><div class="regulation-warning">The seeded catalogue is an operating-model baseline, not a legal conclusion. Jurisdiction and source references marked TBC must be confirmed before a process is moved to Approved or Published.</div><div class="regulation-split"><section class="regulation-list"><div class="regulation-list-heading"><span>Obligations</span><button id="regulation-new" class="toolbar-button" type="button">New Obligation</button></div>${rows||'<div class="regulation-empty">No regulatory obligations defined.</div>'}</section><section class="regulation-editor">${this.renderForm(selected)}</section></div><footer class="regulation-manager-footer">Catalogue edits are browser-local working changes until exported and committed to the repository.</footer></div>`;
    this.bindEvents();
  }

  private renderForm(record: RegulationRecord | null): string {
    return `<form id="regulation-form" class="regulation-form"><h3>${record?'Edit obligation':'Add obligation'}</h3>${record?`<small>${escapeHtml(record.id)}</small>`:''}<label class="metadata-field"><span>Name</span><input id="regulation-name" required value="${escapeHtml(record?.name??'')}" /></label><label class="metadata-field"><span>Category</span><input id="regulation-category" value="${escapeHtml(record?.category??'')}" placeholder="e.g. Data Protection, Health & Safety" /></label><label class="metadata-field"><span>Jurisdiction</span><input id="regulation-jurisdiction" value="${escapeHtml(record?.jurisdiction??'')}" placeholder="TBC until confirmed" /></label><label class="metadata-field"><span>Source reference</span><input id="regulation-source" value="${escapeHtml(record?.sourceReference??'')}" placeholder="Rulebook, law, policy or source reference" /></label><label class="metadata-field"><span>Owner position</span><select id="regulation-owner"><option value="">Unassigned</option>${this.positionOptions(record?.ownerPositionId??'')}</select></label><label class="organisation-checkbox-row"><input id="regulation-active" type="checkbox"${record?.active!==false?' checked':''}/><span>Active</span></label><label class="metadata-field"><span>Notes</span><textarea id="regulation-notes" rows="6">${escapeHtml(record?.notes??'')}</textarea></label><div class="metadata-actions"><button class="toolbar-button toolbar-button-primary" type="submit">${record?'Save Obligation':'Add Obligation'}</button>${record?'<button id="regulation-delete" class="toolbar-button toolbar-button-danger" type="button">Delete</button>':''}</div></form>`;
  }

  private bindEvents(): void {
    this.root.querySelector<HTMLButtonElement>('#regulation-close')?.addEventListener('click',()=>this.dialog.close());
    this.root.querySelector<HTMLButtonElement>('#regulation-export')?.addEventListener('click',()=>exportRegistryJson('regulations.json',this.data));
    this.root.querySelector<HTMLButtonElement>('#regulation-new')?.addEventListener('click',()=>{this.selectedId='';this.render();});
    this.root.querySelectorAll<HTMLButtonElement>('[data-regulation-id]').forEach((button)=>button.addEventListener('click',()=>{this.selectedId=button.dataset.regulationId??'';this.render();}));
    this.root.querySelector<HTMLFormElement>('#regulation-form')?.addEventListener('submit',(event)=>{event.preventDefault();this.save();});
    this.root.querySelector<HTMLButtonElement>('#regulation-delete')?.addEventListener('click',()=>void this.delete());
  }

  private save(): void {
    const name=this.value('#regulation-name'); if(!name){window.alert('Obligation name is required.');return;}
    const existing=this.data.regulations.find((record)=>record.id===this.selectedId);
    const record:RegulationRecord={id:existing?.id??generateRegistryId('regulation',name),name,category:this.value('#regulation-category'),jurisdiction:this.value('#regulation-jurisdiction'),sourceReference:this.value('#regulation-source'),ownerPositionId:this.value('#regulation-owner'),active:this.root.querySelector<HTMLInputElement>('#regulation-active')?.checked??true,notes:this.value('#regulation-notes')};
    if(existing)Object.assign(existing,record);else this.data.regulations.push(record);this.selectedId=record.id;saveRegulationDataLocally(this.data);this.render();
  }

  private async delete(): Promise<void> {
    if(!this.selectedId)return;const governance=await loadProcessGovernance(true);if(governance.records.some((record)=>record.regulationIds.includes(this.selectedId))){window.alert('This obligation is still referenced by a process and cannot be deleted. Remove those process references first.');return;}if(!window.confirm('Delete this obligation from the regulatory catalogue?'))return;this.data.regulations=this.data.regulations.filter((record)=>record.id!==this.selectedId);this.selectedId='';saveRegulationDataLocally(this.data);this.render();
  }

  private value(selector:string):string{return this.root.querySelector<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>(selector)?.value.trim()??'';}
  private positionOptions(selected:string):string{if(!this.organisation)return'';return this.organisation.positions.filter((position)=>position.active||position.id===selected).sort((a,b)=>a.name.localeCompare(b.name)).map((position)=>`<option value="${escapeHtml(position.id)}"${position.id===selected?' selected':''}>${escapeHtml(getPositionName(this.organisation as OrganisationData,position.id))}</option>`).join('');}
}

function escapeHtml(value:string):string{return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
new RegulationManager();
