import{c as e,g as t,s as n,v as r,y as i}from"./modelWorkspace-D0F3WQyF.js";var a=i(`/processes/process-layers.json`),o=i(`/processes/process-catalog.json`),s=`enterprise-modeler.${r}.process-layers.v1`,c=`enterprise-modeler.${r}.process-catalog.v1`,l=`enterprise-modeler.${r}.hierarchy.v2.`,u=`enterprise-modeler.${r}.metadata.v2.`,d={},f=[],p=`enterprise-operating-model`;function m(e,t){return{id:e.id||`layer-${t}`,code:e.code||`L${t}`,name:e.name||`Layer ${t}`,description:e.description||``,sequence:Number.isFinite(e.sequence)?Number(e.sequence):t*10,active:e.active!==!1}}function h(e){return{schemaVersion:1,layers:Array.isArray(e.layers)?e.layers.map((e,t)=>m(e,t)):[]}}function g(e){return{id:e.id||`process-${crypto.randomUUID()}`,bpmnProcessId:e.bpmnProcessId||`Process_${crypto.randomUUID().replaceAll(`-`,``)}`,name:e.name||`Unnamed Process`,layerId:e.layerId||``,filename:e.filename||`process.bpmn`,url:i(e.url||`/processes/custom/process.bpmn`),metadataUrl:i(e.metadataUrl||`/metadata/custom/process.json`),parentId:e.parentId||void 0,active:e.active!==!1}}function _(e){let t=Array.isArray(e.processes)?e.processes.map(e=>g(e)):[],n=e.rootProcessId||t[0]?.id||``;return{schemaVersion:1,rootProcessId:t.some(e=>e.id===n)?n:t[0]?.id||``,processes:t}}function v(e){f=[...e.layers.layers].sort((e,t)=>e.sequence-t.sequence||e.code.localeCompare(t.code)),p=e.catalog.rootProcessId,Object.keys(d).forEach(e=>delete d[e]),e.catalog.processes.forEach(e=>{let t=f.find(t=>t.id===e.layerId);d[e.id]={...e,level:t?.code||`Unlayered`}})}async function y(t){return e(t)}async function b(){let[e,t]=await Promise.all([y(a),y(o)]);return{layers:h(e),catalog:_(t)}}async function x(e=!0){if(e&&!n()){let e=localStorage.getItem(s),t=localStorage.getItem(c);if(e&&t)try{let n={layers:h(JSON.parse(e)),catalog:_(JSON.parse(t))};return v(n),n}catch(e){console.warn(`Unable to parse locally saved process repository; repository files will be used.`,e)}}let t=await b();return v(t),t}async function S(e=!0){await x(e)}function C(e){let n={layers:h(e.layers),catalog:_(e.catalog)};localStorage.setItem(s,JSON.stringify(n.layers,null,2)),localStorage.setItem(c,JSON.stringify(n.catalog,null,2)),v(n),t(`/processes/process-layers.json`,n.layers),t(`/processes/process-catalog.json`,n.catalog)}async function w(){localStorage.removeItem(s),localStorage.removeItem(c);let e=await b();return v(e),e}function T(e){if(e)return f.find(t=>t.id===e)}function E(e){return T(e)?.code||`Unlayered`}function D(e){if(e)return d[e]}function O(e){return Object.values(d).find(t=>t.bpmnProcessId===e)}function k(e,t){let n=new Blob([`${JSON.stringify(t,null,2)}\n`],{type:`application/json;charset=utf-8`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=e,document.body.appendChild(i),i.click(),i.remove(),window.setTimeout(()=>URL.revokeObjectURL(r),0)}function A(e){let t=e.trim().toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)||`process-${crypto.randomUUID().slice(0,8)}`,n=t,r=2;for(;d[n];)n=`${t}-${r}`,r+=1;return n}function j(e,t){return(e.trim()||t.trim()||`layer-${crypto.randomUUID().slice(0,8)}`).toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).replace(/^/,`layer-`)}function M(e){return`Process_${e.split(/[^a-zA-Z0-9]+/).filter(Boolean).map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(``)||crypto.randomUUID().replaceAll(`-`,``)}`}function N(e){let t=e.id.replace(/[^a-zA-Z0-9]/g,`_`),n=`StartEvent_${t}`,r=`Lane_${t}_Internal`,i=`LaneSet_${t}_Organisation`,a=`Collaboration_${t}`,o=`Participant_${t}_ExternalActor`,s=`Participant_${t}_Organisation`,c=`Participant_${t}_ExternalPartner`;return`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_${e.bpmnProcessId}"
  targetNamespace="https://enterprise-modeler.local/bpmn">
  <bpmn:process id="${e.bpmnProcessId}" name="${F(e.name)}" isExecutable="false">
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
</bpmn:definitions>`}function P(e){localStorage.setItem(`${l}${e.id}.xml`,N(e)),localStorage.setItem(`${l}${e.id}.filename`,e.filename),localStorage.setItem(`${u}${e.id}`,JSON.stringify({schemaVersion:3,processId:e.bpmnProcessId,nodes:{}},null,2))}function F(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&apos;`)}export{M as _,p as a,j as c,E as d,S as f,P as g,C as h,u as i,A as l,w as m,d as n,k as o,x as p,f as r,O as s,l as t,D as u};