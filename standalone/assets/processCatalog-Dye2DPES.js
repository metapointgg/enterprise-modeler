import{n as e,t}from"./modelRepository-DIUFCfls.js";var n=e(`/processes/process-layers.json`),r=e(`/processes/process-catalog.json`),i=`enterprise-modeler.${t}.process-layers.v1`,a=`enterprise-modeler.${t}.process-catalog.v1`,o=`enterprise-modeler.${t}.hierarchy.v2.`,s=`enterprise-modeler.${t}.metadata.v2.`,c={},l=[],u=`enterprise-operating-model`;function d(e,t){return{id:e.id||`layer-${t}`,code:e.code||`L${t}`,name:e.name||`Layer ${t}`,description:e.description||``,sequence:Number.isFinite(e.sequence)?Number(e.sequence):t*10,active:e.active!==!1}}function f(e){return{schemaVersion:1,layers:Array.isArray(e.layers)?e.layers.map((e,t)=>d(e,t)):[]}}function p(t){return{id:t.id||`process-${crypto.randomUUID()}`,bpmnProcessId:t.bpmnProcessId||`Process_${crypto.randomUUID().replaceAll(`-`,``)}`,name:t.name||`Unnamed Process`,layerId:t.layerId||``,filename:t.filename||`process.bpmn`,url:e(t.url||`/processes/custom/process.bpmn`),metadataUrl:e(t.metadataUrl||`/metadata/custom/process.json`),parentId:t.parentId||void 0,active:t.active!==!1}}function m(e){let t=Array.isArray(e.processes)?e.processes.map(e=>p(e)):[],n=e.rootProcessId||t[0]?.id||``;return{schemaVersion:1,rootProcessId:t.some(e=>e.id===n)?n:t[0]?.id||``,processes:t}}function h(e){l=[...e.layers.layers].sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code)),u=e.catalog.rootProcessId,Object.keys(c).forEach(e=>delete c[e]),e.catalog.processes.forEach(e=>{let t=l.find(t=>t.id===e.layerId);c[e.id]={...e,level:t?.code||`Unlayered`}})}async function g(e){let t=await fetch(e,{cache:`no-store`});if(!t.ok)throw Error(`Unable to load ${e}. HTTP ${t.status}.`);return t.json()}async function _(){let[e,t]=await Promise.all([g(n),g(r)]);return{layers:f(e),catalog:m(t)}}async function v(e=!0){if(e){let e=localStorage.getItem(i),t=localStorage.getItem(a);if(e&&t)try{let n={layers:f(JSON.parse(e)),catalog:m(JSON.parse(t))};return h(n),n}catch(e){console.warn(`Unable to parse locally saved process repository; repository files will be used.`,e)}}let t=await _();return h(t),t}async function y(e=!0){await v(e)}function b(e){let t={layers:f(e.layers),catalog:m(e.catalog)};localStorage.setItem(i,JSON.stringify(t.layers,null,2)),localStorage.setItem(a,JSON.stringify(t.catalog,null,2)),h(t)}async function x(){localStorage.removeItem(i),localStorage.removeItem(a);let e=await _();return h(e),e}function S(e){if(e)return l.find(t=>t.id===e)}function C(e){return S(e)?.code||`Unlayered`}function w(e){if(e)return c[e]}function T(e){return Object.values(c).find(t=>t.bpmnProcessId===e)}function E(e,t){let n=new Blob([`${JSON.stringify(t,null,2)}\n`],{type:`application/json;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,document.body.appendChild(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),0)}function D(e){let t=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`process-${crypto.randomUUID().slice(0,8)}`,n=t,r=2;for(;c[n];)n=`${t}-${r}`,r+=1;return n}function O(e,t){return(e.trim()||t.trim()||`layer-${crypto.randomUUID().slice(0,8)}`).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).replace(/^/,`layer-`)}function k(e){return`Process_${e.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(``)||crypto.randomUUID().replaceAll(`-`,``)}`}function A(e){let t=e.id.replace(/[^a-zA-Z0-9]/g,`_`),n=`StartEvent_${t}`,r=`Lane_${t}_Internal`,i=`LaneSet_${t}_Organisation`,a=`Collaboration_${t}`,o=`Participant_${t}_ExternalActor`,s=`Participant_${t}_Organisation`,c=`Participant_${t}_ExternalPartner`;return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_${e.bpmnProcessId}"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${e.bpmnProcessId}" name="${M(e.name)}" isExecutable="false">
    <bpmn:laneSet id="${i}">
      <bpmn:lane id="${r}" name="Organisation — Department / Team">
        <bpmn:flowNodeRef>${n}</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="${n}" name="Start" />
  </bpmn:process>
  <bpmn:collaboration id="${a}">
    <bpmn:participant id="${o}" name="External Actor" />
    <bpmn:participant id="${s}" name="Organisation" processRef="${e.bpmnProcessId}" />
    <bpmn:participant id="${c}" name="External Party / Service Provider" />
  </bpmn:collaboration>
  <bpmndi:BPMNDiagram id="BPMNDiagram_${e.bpmnProcessId}">
    <bpmndi:BPMNPlane id="BPMNPlane_${e.bpmnProcessId}" bpmnElement="${a}">
      <bpmndi:BPMNShape id="${o}_di" bpmnElement="${o}" isHorizontal="true">
        <dc:Bounds x="80" y="70" width="1000" height="110" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${s}_di" bpmnElement="${s}" isHorizontal="true">
        <dc:Bounds x="80" y="210" width="1000" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${r}_di" bpmnElement="${r}" isHorizontal="true">
        <dc:Bounds x="110" y="210" width="970" height="200" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${n}_di" bpmnElement="${n}">
        <dc:Bounds x="180" y="292" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${c}_di" bpmnElement="${c}" isHorizontal="true">
        <dc:Bounds x="80" y="440" width="1000" height="110" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`}function j(e){localStorage.setItem(`${o}${e.id}.xml`,A(e)),localStorage.setItem(`${o}${e.id}.filename`,e.filename),localStorage.setItem(`${s}${e.id}`,JSON.stringify({schemaVersion:3,processId:e.bpmnProcessId,nodes:{}},null,2))}function M(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&apos;`)}export{k as _,u as a,O as c,C as d,y as f,j as g,b as h,s as i,D as l,x as m,c as n,E as o,v as p,l as r,T as s,o as t,w as u};