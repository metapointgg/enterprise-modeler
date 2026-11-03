var e=`enterprise-modeler.process-layers.v1`,t=`enterprise-modeler.process-catalog.v1`,n=`enterprise-modeler.hierarchy.v2.`,r=`enterprise-modeler.metadata.v2.`,i={},a=[],o=`enterprise-operating-model`;function s(e,t){return{id:e.id||`layer-${t}`,code:e.code||`L${t}`,name:e.name||`Layer ${t}`,description:e.description||``,sequence:Number.isFinite(e.sequence)?Number(e.sequence):t*10,active:e.active!==!1}}function c(e){return{schemaVersion:1,layers:Array.isArray(e.layers)?e.layers.map((e,t)=>s(e,t)):[]}}function l(e){return{id:e.id||`process-${crypto.randomUUID()}`,bpmnProcessId:e.bpmnProcessId||`Process_${crypto.randomUUID().replaceAll(`-`,``)}`,name:e.name||`Unnamed Process`,layerId:e.layerId||``,filename:e.filename||`process.bpmn`,url:e.url||`/processes/custom/process.bpmn`,metadataUrl:e.metadataUrl||`/metadata/custom/process.json`,parentId:e.parentId||void 0,active:e.active!==!1}}function u(e){let t=Array.isArray(e.processes)?e.processes.map(e=>l(e)):[],n=e.rootProcessId||t[0]?.id||``;return{schemaVersion:1,rootProcessId:t.some(e=>e.id===n)?n:t[0]?.id||``,processes:t}}function d(e){a=[...e.layers.layers].sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code)),o=e.catalog.rootProcessId,Object.keys(i).forEach(e=>delete i[e]),e.catalog.processes.forEach(e=>{let t=a.find(t=>t.id===e.layerId);i[e.id]={...e,level:t?.code||`Unlayered`}})}async function f(e){let t=await fetch(e,{cache:`no-store`});if(!t.ok)throw Error(`Unable to load ${e}. HTTP ${t.status}.`);return t.json()}async function p(){let[e,t]=await Promise.all([f(`/processes/process-layers.json`),f(`/processes/process-catalog.json`)]);return{layers:c(e),catalog:u(t)}}async function m(n=!0){if(n){let n=localStorage.getItem(e),r=localStorage.getItem(t);if(n&&r)try{let e={layers:c(JSON.parse(n)),catalog:u(JSON.parse(r))};return d(e),e}catch(e){console.warn(`Unable to parse locally saved process repository; repository files will be used.`,e)}}let r=await p();return d(r),r}async function h(e=!0){await m(e)}function g(n){let r={layers:c(n.layers),catalog:u(n.catalog)};localStorage.setItem(e,JSON.stringify(r.layers,null,2)),localStorage.setItem(t,JSON.stringify(r.catalog,null,2)),d(r)}async function _(){localStorage.removeItem(e),localStorage.removeItem(t);let n=await p();return d(n),n}function v(e){if(e)return a.find(t=>t.id===e)}function y(e){return v(e)?.code||`Unlayered`}function b(e){if(e)return i[e]}function x(e){return Object.values(i).find(t=>t.bpmnProcessId===e)}function S(e,t){let n=new Blob([`${JSON.stringify(t,null,2)}\n`],{type:`application/json;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,document.body.appendChild(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),0)}function C(e){let t=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`process-${crypto.randomUUID().slice(0,8)}`,n=t,r=2;for(;i[n];)n=`${t}-${r}`,r+=1;return n}function w(e,t){return(e.trim()||t.trim()||`layer-${crypto.randomUUID().slice(0,8)}`).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).replace(/^/,`layer-`)}function T(e){return`Process_${e.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(``)||crypto.randomUUID().replaceAll(`-`,``)}`}function E(e){let t=e.id.replace(/[^a-zA-Z0-9]/g,`_`),n=`StartEvent_${t}`,r=`Lane_${t}_Internal`,i=`LaneSet_${t}_Organisation`,a=`Collaboration_${t}`,o=`Participant_${t}_ExternalActor`,s=`Participant_${t}_Organisation`,c=`Participant_${t}_ExternalPartner`;return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_${e.bpmnProcessId}"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${e.bpmnProcessId}" name="${O(e.name)}" isExecutable="false">
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
</bpmn:definitions>`}function D(e){localStorage.setItem(`${n}${e.id}.xml`,E(e)),localStorage.setItem(`${n}${e.id}.filename`,e.filename),localStorage.setItem(`${r}${e.id}`,JSON.stringify({schemaVersion:3,processId:e.bpmnProcessId,nodes:{}},null,2))}function O(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&apos;`)}export{T as _,o as a,w as c,y as d,h as f,D as g,g as h,r as i,C as l,_ as m,i as n,S as o,m as p,a as r,x as s,n as t,b as u};