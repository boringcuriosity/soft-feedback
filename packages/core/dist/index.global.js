var softFeedback=(function(exports){'use strict';function oe(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n)&255,t=Math.imul(t,16777619);return (t>>>0)/4294967296}function ye(){let e=new Map,t=new Set;return {emit(n){let o=e.get(n.type);if(o)for(let r of [...o])try{r(n);}catch{}for(let r of [...t])try{r(n);}catch{}},on(n,o){if(n==="*")return t.add(o),()=>t.delete(o);let r=e.get(n);return r||(r=new Set,e.set(n,r)),r.add(o),()=>{r.delete(o);}}}}var st="sf:v1:anon";function it(){try{if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID()}catch{}return `sf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`}function at(e,t){if(t)return it();let n=e.get(st);if(n)return n;let o=it();return e.set(st,o),o}function rn(){let e=typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:"",t=typeof window<"u"?window.innerWidth:0,n=/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(e),o=/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(e);if(n)return "tablet";if(o)return "mobile";if(t>0){if(t<640)return "mobile";if(t<1024)return "tablet"}return "desktop"}function sn(){try{if(typeof window<"u"&&window.location)return window.location.href}catch{}return ""}function ve(e){let t=e.locale??(typeof navigator<"u"&&navigator.language?navigator.language:void 0);return {url:sn(),device:rn(),locale:t,properties:e.properties??{},anonId:at(e.storage,e.anonymous)}}function ct(e){return e.length>1&&e.endsWith("/")?e.slice(0,-1):e}function an(e){let n=e.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".");return new RegExp(`^${n}$`)}function cn(e,t,n){switch(e){case "contains":return n.includes(t);case "exact":return ct(n)===ct(t);case "regex":try{return new RegExp(t).test(n)}catch{return  false}case "glob":try{return an(t).test(n)}catch{return  false}default:return  false}}function ln(e,t,n,o){let r=o[e];switch(t){case "eq":return r===n;case "neq":return r!==n;case "in":return Array.isArray(n)&&n.includes(r);case "gt":{let s=Number(r),i=Number(n);return Number.isFinite(s)&&Number.isFinite(i)&&s>i}case "lt":{let s=Number(r),i=Number(n);return Number.isFinite(s)&&Number.isFinite(i)&&s<i}default:return  false}}function dn(){return typeof document<"u"&&!!document.querySelector}function un(e,t){return t.device===e}function fn(e,t,n){switch(e.type){case "url":return cn(e.op,e.value,t.url);case "device":return un(e.value,t);case "selector":return dn()?!!document.querySelector(e.selector)===e.present:false;case "property":return ln(e.key,e.op,e.value,t.properties);case "rollout":{let o=`${t.anonId??""}:${n}`;return oe(o)<e.percent/100}case "predicate":try{return e.fn(t)}catch{return  false}default:return  false}}function lt(e,t,n){return !e||e.length===0?true:e.every(o=>fn(o,t,n))}function dt(e){if(!e)return;let t=Date.parse(e);return Number.isNaN(t)?void 0:t}function xe(e,t=Date.now()){if(!e)return  true;let n=dt(e.start),o=dt(e.end);return !(n!==void 0&&t<n||o!==void 0&&t>=o)}var Pe=1440*60*1e3,pn="sf:v1:survey:",ut="sf:v1:global",mn={oncePerUser:true,maxShows:1/0,cooldownDaysAfterSeen:30,cooldownDaysAfterResponse:90,globalWaitDays:3},ft={shows:0,dismissed:0,responded:0};function mt(e,t){function n(d){return pn+d}function o(d){let g=e.get(n(d));if(!g)return {...ft};try{let p=JSON.parse(g);return {lastSeen:p.lastSeen,lastResponded:p.lastResponded,shows:p.shows??0,dismissed:p.dismissed??0,responded:p.responded??0}}catch{return {...ft}}}function r(d,g){e.set(n(d),JSON.stringify(g));}function s(){let d=e.get(ut);if(!d)return {};try{return JSON.parse(d)}catch{return {}}}function i(d){e.set(ut,JSON.stringify(d));}function b(d){let g={...mn,...pt(t),...pt(d.frequency)};return (!g.maxShows||g.maxShows<=0)&&(g.maxShows=1/0),g}return {canShow(d){let g=Date.now(),p=b(d),u=o(d.id),y=s();return !(!xe(d.schedule,g)||p.oncePerUser&&u.responded>0||u.shows>=p.maxShows||u.lastResponded!==void 0&&g-u.lastResponded<p.cooldownDaysAfterResponse*Pe||u.lastSeen!==void 0&&g-u.lastSeen<p.cooldownDaysAfterSeen*Pe||y.lastAnyShown!==void 0&&g-y.lastAnyShown<p.globalWaitDays*Pe)},recordShown(d){let g=Date.now(),p=o(d);p.shows+=1,p.lastSeen=g,r(d,p);let u=s();u.lastAnyShown=g,i(u);},recordResponded(d){let g=Date.now(),p=o(d);p.responded+=1,p.lastResponded=g,r(d,p);},recordDismissed(d){let g=o(d);g.dismissed+=1,r(d,g);}}}function pt(e){if(!e)return {};let t={};for(let n of Object.keys(e))e[n]!==void 0&&(t[n]=e[n]);return t}function Ee(e){return e.filter(t=>typeof t=="number"&&Number.isFinite(t))}function ae(e){return Math.round(e)}function bt(e){return e.length===0?0:e.reduce((t,n)=>t+n,0)/e.length}function ht(e){let t=Ee(e),n=0,o=0,r=0;for(let b of t)b>=9?n+=1:b>=7?o+=1:r+=1;let s=t.length;return {score:s===0?0:ae(n/s*100-r/s*100),promoters:n,passives:o,detractors:r}}function gt(e,t=[4,5]){let n=Ee(e),o=new Set(t),r=n.filter(s=>o.has(s)).length;return {percent:n.length===0?0:ae(r/n.length*100),mean:bt(n)}}function yt(e,t=[5,6,7]){let n=Ee(e),o=new Set(t),r=n.filter(s=>o.has(s)).length;return {percent:n.length===0?0:ae(r/n.length*100),mean:bt(n)}}function vt(e,t=[1,2]){let n=Ee(e),o=new Set(t),r=n.filter(s=>o.has(s)).length;return {percent:n.length===0?0:ae(r/n.length*100)}}function xt(e){let t=e.filter(s=>typeof s=="string"&&s.length>0),n=t.length,o=t.filter(s=>s==="very").length,r=n===0?0:ae(o/n*100);return {veryDisappointedPercent:r,hasFit:r>=40}}function bn(e){return e.type==="rating"}function we(e,t){let n=e.filter(bn);return n.find(r=>typeof t[r.id]=="number")??n[0]}function ke(e){if(typeof e=="number"&&Number.isFinite(e))return e}function hn(e){if(typeof e=="string")return e;if(Array.isArray(e)&&typeof e[0]=="string")return e[0]}function gn(e){return e>=9?"promoter":e>=7?"passive":"detractor"}function Se(e,t,n){switch(e){case "nps":{let o=we(n,t),r=o?ke(t[o.id]):void 0;return r===void 0?void 0:{metric:e,value:r,bucket:gn(r)}}case "csat":{let o=we(n,t),r=o?ke(t[o.id]):void 0;if(r===void 0)return;let s=r>=4?"satisfied":r<=2?"dissatisfied":"neutral";return {metric:e,value:r,bucket:s}}case "ces":{let o=we(n,t),r=o?ke(t[o.id]):void 0;if(r===void 0)return;let s=r>=5?"low-effort":r<=3?"high-effort":"neutral";return {metric:e,value:r,bucket:s}}case "dsat":{let o=we(n,t),r=o?ke(t[o.id]):void 0;if(r===void 0)return;let s=r<=2?"dissatisfied":"satisfied";return {metric:e,value:r,bucket:s}}case "pmf":{let o=n.find(i=>i.type==="choice"||i.type==="text"),r=o?hn(t[o.id]):void 0;return r===void 0?void 0:{metric:e,value:r==="very"?1:0,bucket:r}}default:return}}var Ce=()=>{};function yn(){return typeof window<"u"}function vn(e){let t=false;return {fire(){t||(t=true,e());},fired:()=>t}}function wt(e,t,n){if(!yn())return Ce;let o=vn(n);switch(e.type){case "manual":case "event":return Ce;case "timeOnPage":{let r=window.setTimeout(o.fire,Math.max(0,e.ms));return ()=>window.clearTimeout(r)}case "scrollDepth":{let r=xn(e.percent),s=false,i=()=>{s=false,wn()>=r&&(d(),o.fire());},b=()=>{s||(s=true,window.requestAnimationFrame(i));},d=()=>{window.removeEventListener("scroll",b);};return window.addEventListener("scroll",b,{passive:true}),b(),d}case "exitIntent":{let r=b=>{!b.relatedTarget&&b.clientY<=0&&(i(),o.fire());},s=()=>{i(),o.fire();},i=()=>{document.removeEventListener("mouseout",r),window.removeEventListener("popstate",s);};return typeof document<"u"&&document.addEventListener("mouseout",r),window.addEventListener("popstate",s),i}case "idle":{let r=Math.max(0,e.ms),s=0,i=["mousemove","mousedown","keydown","touchstart","scroll","wheel"],b=()=>{window.clearTimeout(s),s=window.setTimeout(()=>{g(),o.fire();},r);},d=()=>b(),g=()=>{window.clearTimeout(s);for(let p of i)window.removeEventListener(p,d);};for(let p of i)window.addEventListener(p,d,{passive:true});return b(),g}case "elementVisible":{if(typeof document>"u")return Ce;let r=()=>{d(),e.delayMs&&e.delayMs>0?window.setTimeout(o.fire,e.delayMs):o.fire();},s,i=0,b=()=>{let g=document.querySelector(e.selector);return g&&kn(g)?(r(),true):false},d=()=>{s&&s.disconnect(),i&&window.clearInterval(i);};if(typeof IntersectionObserver<"u"){let g=document.querySelector(e.selector);g?(s=new IntersectionObserver(p=>{for(let u of p)if(u.isIntersecting){r();break}}),s.observe(g)):i=window.setInterval(()=>{b();},500);}else i=window.setInterval(()=>{b();},500);return d}case "routeChange":{let r=e.match,s=()=>{if(r)try{if(!new RegExp(r).test(window.location.href))return}catch{if(!window.location.href.includes(r))return}p(),o.fire();},i=history.pushState,b=history.replaceState,d=function(...u){let y=i.apply(this,u);return s(),y},g=function(...u){let y=b.apply(this,u);return s(),y},p=()=>{history.pushState=i,history.replaceState=b,window.removeEventListener("popstate",s),window.removeEventListener("hashchange",s);};return history.pushState=d,history.replaceState=g,window.addEventListener("popstate",s),window.addEventListener("hashchange",s),p}default:return Ce}}function xn(e){return Number.isFinite(e)?Math.min(100,Math.max(0,e)):0}function wn(){let e=document.documentElement,t=document.body,n=window.scrollY||e.scrollTop||(t?t.scrollTop:0),o=Math.max(e.scrollHeight,t?t.scrollHeight:0,e.clientHeight),r=window.innerHeight||e.clientHeight,s=o-r;return s<=0?100:n/s*100}function kn(e){let t=e.getBoundingClientRect(),n=window.innerHeight||document.documentElement.clientHeight,o=window.innerWidth||document.documentElement.clientWidth;return t.bottom>0&&t.right>0&&t.top<n&&t.left<o}function Fe(e){let{storage:t,bus:n,getContext:o,present:r}=e,s=mt(t,e.defaults?.frequency),i=new Map,b={},d=false;function g(){let l=o();return Object.keys(b).length===0?l:{...l,properties:{...b,...l.properties}}}function p(l,m){if(m)return r(l),true;let h=g();return !xe(l.schedule)||!lt(l.conditions,h,l.id)||!s.canShow(l)?false:(r(l),true)}function u(l){let m=l.trigger??{type:"manual"};if(m.type==="manual"||m.type==="event")return ()=>{};let h=g();return wt(m,h,()=>{d||p(l,false);})}let y=n.on("shown",l=>{s.recordShown(l.surveyId);}),a=n.on("sent",l=>{s.recordResponded(l.surveyId);}),c=n.on("dismissed",l=>{s.recordDismissed(l.surveyId);});return {register(l){if(d)return;let m=i.get(l.id);m&&m.cleanup();let h=u(l);i.set(l.id,{survey:l,cleanup:h});},unregister(l){let m=i.get(l);m&&(m.cleanup(),i.delete(l));},track(l){if(!d)for(let{survey:m}of i.values()){let h=m.trigger;if(!h||h.type!=="event"||h.name!==l)continue;let M=h.delayMs??0;M>0&&typeof setTimeout<"u"?setTimeout(()=>{d||p(m,false);},M):p(m,false);}},request(l,m){if(d)return  false;let h=i.get(l);return h?p(h.survey,m?.force??false):false},setProperties(l){b={...b,...l};},destroy(){d=true;for(let l of i.values())l.cleanup();i.clear(),y(),a(),c();}}}function Re(){let e=new Map;return {get(t){let n=e.get(t);return n===void 0?null:n},set(t,n){e.set(t,n);},remove(t){e.delete(t);}}}function En(){try{if(typeof window>"u"||!window.localStorage)return !1;let e="__sf_probe__";return window.localStorage.setItem(e,"1"),window.localStorage.removeItem(e),!0}catch{return  false}}function kt(){return En()?{get(e){try{return window.localStorage.getItem(e)}catch{return null}},set(e,t){try{window.localStorage.setItem(e,t);}catch{}},remove(e){try{window.localStorage.removeItem(e);}catch{}}}:Re()}function Be(){return kt()}function Sn(e,t){switch(e.op){case "any":return t!==void 0;case "eq":return Cn(t,e.value);case "in":return Array.isArray(e.value)&&Rn(t,e.value);case "lte":{let n=Ae(t),o=Ae(e.value);return n!==void 0&&o!==void 0&&n<=o}case "gte":{let n=Ae(t),o=Ae(e.value);return n!==void 0&&o!==void 0&&n>=o}default:return  false}}function Ae(e){if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"&&e.trim()!==""){let t=Number(e);if(Number.isFinite(t))return t}}function Cn(e,t){return Array.isArray(e)?typeof t!="object"&&e.includes(t):e===t}function Rn(e,t){return Array.isArray(e)?e.some(n=>t.includes(n)):e!==void 0&&t.includes(e)}function An(e,t){if(!(!e||e.length===0)){for(let n of e)if(Sn(n.when,t))return n.goto}}function ce(e,t){let n=e.questions,o={},r=n.length>0&&n[0]?[n[0].id]:[],s=new Date().toISOString(),i={index:0,responses:o,startedAt:s,progress:n.length===0?1:0,complete:n.length===0};function b(h){return n.find(M=>M.id===h)}function d(h){return n.findIndex(M=>M.id===h)}function g(){if(n.length===0){i.progress=1;return}if(i.complete){i.progress=1;return}i.progress=Math.min(i.index/n.length,1);}function p(){if(i.complete)return null;let h=r[i.index];return h===void 0?null:b(h)??null}function u(h,M){o[h]=M;}function y(){return i.complete=true,i.progress=1,null}function a(){if(i.complete)return null;let h=p();if(!h)return y();let M=o[h.id],D=An(h.branching,M),w;if(D){if(D.type==="end"||(w=b(D.id)?D.id:void 0,w===void 0))return y()}else {let k=d(h.id);if(w=(k>=0?n[k+1]:void 0)?.id,w===void 0)return y()}return i.index===r.length-1||r.splice(i.index+1),r.push(w),i.index+=1,g(),p()}function c(){return i.index<=0?i.complete&&r.length>0?(i.complete=false,i.index=0,g(),p()):null:(i.complete=false,i.index-=1,g(),p())}function l(){return i.complete}function m(){let h=new Date().toISOString(),M=n.map(k=>({id:k.id,prompt:k.prompt})),D=e.metric?Se(e.metric,o,n):void 0,w={surveyId:e.id,surveyName:e.name,anonId:t.anonId,responses:{...o},questions:M,startedAt:s,submittedAt:h,context:{url:t.url,device:t.device,locale:t.locale}};return D&&(w.score=D),w}return {survey:e,state:i,current:p,answer:u,next:a,back:c,isComplete:l,buildPayload:m}}var Mn={smooth:{stiffness:170,damping:26,mass:1},bouncy:{stiffness:320,damping:18,mass:1},subtle:{stiffness:210,damping:30,mass:1},snappy:{stiffness:420,damping:34,mass:1}};function J(){try{return typeof window>"u"||typeof window.matchMedia!="function"?!1:window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return  false}}var Tn=.001,Ln=.001,Et=1e3/240,St=64;function U(e){let{from:t,to:n,onUpdate:o,onDone:r}=e,s=e.reducedMotion??J(),i=typeof window>"u"||typeof window.requestAnimationFrame!="function";if(s||i||t===n)return o(n),r?.(),()=>{};let{stiffness:b,damping:d,mass:g}=Mn[e.preset??"smooth"],p=t,u=0,y=null,a=false,c=0,l=m=>{if(a)return;y===null&&(y=m);let h=m-y;y=m,h>St&&(h=St);let M=h;for(;M>0;){let w=Math.min(M,Et)/1e3;M-=Et;let k=p-n,v=-b*k,T=-d*u,Q=(v+T)/g;u+=Q*w,p+=u*w;}if(Math.abs(u)<Ln&&Math.abs(p-n)<Tn){o(n),r?.();return}o(p),c=window.requestAnimationFrame(l);};return c=window.requestAnimationFrame(l),()=>{a=true,typeof window<"u"&&typeof window.cancelAnimationFrame=="function"&&window.cancelAnimationFrame(c);}}function Me(e,t,n=1){let o=(e-1)*n,r=Math.max(0,e*(1+o*.4)),s=Math.max(0,e*(1-o*.4)),i=Math.min(36,Math.abs(o)*80);return {transform:`scale(${r.toFixed(4)}, ${s.toFixed(4)})`,borderRadius:`${(t+i).toFixed(2)}px`,opacity:Math.max(0,Math.min(1,e*1.5))}}var Te=`
/* ===== Tokens (light) ============================================================ */
:host {
  --sf-color-bg: #ffffff;
  --sf-color-fg: #1a1a23;
  --sf-color-muted: #6b7280;
  --sf-color-accent: #4f46e5;
  --sf-color-accent-fg: #ffffff;
  --sf-color-border: #e6e7ee;
  --sf-color-danger: #dc2626;
  --sf-color-success: #16a34a;
  --sf-color-surface: #f6f7fb;

  --sf-radius: 16px;
  --sf-radius-sm: 11px;

  --sf-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --sf-shadow: 0 12px 40px -12px rgb(16 18 35 / 0.30), 0 4px 14px -8px rgb(16 18 35 / 0.18);

  --sf-space: 16px;
  --sf-space-sm: 8px;
  --sf-space-lg: 22px;

  --sf-motion-duration: 0.28s;
  --sf-z: 2147483000;
  --sf-max-width: 384px;

  --_sf-accent-soft: color-mix(in srgb, var(--sf-color-accent) 12%, transparent);
  --_sf-focus-ring: 0 0 0 3px color-mix(in srgb, var(--sf-color-accent) 42%, transparent);

  display: block;
  box-sizing: border-box;
  color: var(--sf-color-fg);
  font-family: var(--sf-font);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
*, *::before, *::after { box-sizing: border-box; }

/* ===== Dark theme (explicit + system when auto) =================================== */
:host([data-theme="dark"]), :host([data-theme="auto"]) {
  /* placeholder so selector exists; real values below */
}
:host([data-theme="dark"]) {
  --sf-color-bg: #16161e;
  --sf-color-fg: #f3f4f8;
  --sf-color-muted: #9aa1ad;
  --sf-color-accent: #818cf8;
  --sf-color-accent-fg: #15151c;
  --sf-color-border: #2c2d38;
  --sf-color-danger: #f87171;
  --sf-color-success: #4ade80;
  --sf-color-surface: #1e1f29;
  --sf-shadow: 0 14px 46px -10px rgb(0 0 0 / 0.66), 0 4px 16px -8px rgb(0 0 0 / 0.5);
}
@media (prefers-color-scheme: dark) {
  :host([data-theme="auto"]) {
    --sf-color-bg: #16161e;
    --sf-color-fg: #f3f4f8;
    --sf-color-muted: #9aa1ad;
    --sf-color-accent: #818cf8;
    --sf-color-accent-fg: #15151c;
    --sf-color-border: #2c2d38;
    --sf-color-danger: #f87171;
    --sf-color-success: #4ade80;
    --sf-color-surface: #1e1f29;
    --sf-shadow: 0 14px 46px -10px rgb(0 0 0 / 0.66), 0 4px 16px -8px rgb(0 0 0 / 0.5);
  }
}

/* ===== Backdrop (modal) ========================================================== */
.soft-backdrop {
  position: fixed; inset: 0;
  background: rgb(12 13 24 / 0.46);
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  pointer-events: auto;
}

/* ===== Card / shell ============================================================== */
.soft-card {
  position: relative;
  box-sizing: border-box;
  width: min(var(--sf-max-width), calc(100vw - 32px));
  max-width: 100%;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: var(--sf-color-bg);
  color: var(--sf-color-fg);
  border: 1px solid var(--sf-color-border);
  border-radius: var(--sf-radius);
  box-shadow: var(--sf-shadow);
  padding: var(--sf-space-lg);
  /* Opt-in frosted glass: the glass preset sets --sf-backdrop; otherwise no-op. */
  -webkit-backdrop-filter: var(--sf-backdrop, none);
  backdrop-filter: var(--sf-backdrop, none);
  /* popover/tab host is a pass-through frame (pointer-events:none); re-enable on the card. */
  pointer-events: auto;
  font-family: var(--sf-font);
  /* Keep the gooey squash-and-stretch morph crisp and on the GPU. */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.soft-modal { width: min(var(--sf-max-width), calc(100vw - 40px)); }
.soft-inline { box-shadow: none; width: 100%; max-height: none; overflow: visible; }
.soft-banner {
  width: 100%; max-width: none; border-radius: 0;
  border-left: 0; border-right: 0; box-shadow: none;
}

/* ===== Header ==================================================================== */
.soft-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--sf-space); margin-bottom: var(--sf-space);
}
.soft-title {
  margin: 0; font-size: 1.0625rem; font-weight: 650; line-height: 1.35;
  letter-spacing: -0.01em; color: var(--sf-color-fg);
}
.soft-close {
  flex: 0 0 auto; position: relative;
  width: 30px; height: 30px; margin: -4px -4px 0 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-muted); background: transparent; border: 0; border-radius: 999px;
  cursor: pointer; transition: background-color .2s ease, color .2s ease;
}
.soft-close::after { content: ""; position: absolute; inset: -7px; } /* 44px hit area */
.soft-close:hover { background: var(--sf-color-surface); color: var(--sf-color-fg); }

/* ===== Progress ================================================================== */
.soft-progress {
  height: 4px; width: 100%; background: var(--sf-color-border);
  border-radius: 999px; overflow: hidden; margin-bottom: var(--sf-space);
}
.soft-progress-fill {
  height: 100%; width: 100%; transform-origin: left center; transform: scaleX(0);
  background: var(--sf-color-accent); border-radius: inherit;
}

/* ===== Content / question wrapper ================================================ */
.soft-content { position: relative; }
.soft-q { display: block; }

/* ===== Footer + buttons ========================================================= */
.soft-foot {
  display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap;
  gap: var(--sf-space-sm); margin-top: var(--sf-space-lg);
}
.soft-foot:empty { display: none; }
/* Inline optional comment revealed after a last-step rating; full-width above the button. */
.soft-inline-comment { width: 100%; min-height: 64px; margin: 0; animation: sf-rise .28s ease both; }
.soft-inline-follow-label {
  display: block; margin: 0 0 8px; font-size: 0.92em; font-weight: 600;
  color: var(--sf-color-fg); animation: sf-rise .28s ease both;
}
.soft-btn {
  min-height: 44px; min-width: 88px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px; font: inherit; font-weight: 600; text-decoration: none;
  border-radius: var(--sf-radius-sm); border: 1.5px solid transparent; cursor: pointer;
  transition: transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1),
    background-color .2s ease, box-shadow .2s ease, opacity .2s ease;
}
.soft-btn:active { transform: translateY(1px); }
.soft-btn:disabled { opacity: .5; cursor: not-allowed; }
.soft-btn-primary { background: var(--sf-color-accent); color: var(--sf-color-accent-fg); }
.soft-btn-primary:hover:not(:disabled) {
  box-shadow: 0 8px 20px -8px var(--sf-color-accent); transform: translateY(-1px);
}

/* ===== Rating: number scale ===================================================== */
.sf-scale { display: flex; flex-direction: column; gap: var(--sf-space-sm); }
.sf-scale-track, [part="rating"] {
  display: flex; flex-wrap: wrap; gap: var(--sf-space-sm); align-items: stretch;
}
.sf-rating-btn, [part="rating-button"] {
  flex: 1 1 0; min-width: 44px; min-height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px; font: inherit; font-weight: 550; color: var(--sf-color-fg);
  background: var(--sf-color-surface); border: 1.5px solid var(--sf-color-border);
  border-radius: var(--sf-radius-sm); cursor: pointer;
  transition: transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1),
    border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
}
.sf-rating-btn:hover { border-color: var(--sf-color-accent); transform: translateY(-1px); }
.sf-rating-btn.is-selected, .sf-rating-btn[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  box-shadow: inset 0 0 0 1px var(--sf-color-accent); font-weight: 700;
}
.sf-scale-anchors {
  display: flex; justify-content: space-between; gap: var(--sf-space);
  font-size: .8rem; color: var(--sf-color-muted);
}

/* ===== Rating: stars ============================================================ */
.sf-stars { display: flex; gap: 4px; justify-content: center; }
.sf-star {
  background: none; border: 0; padding: 4px; line-height: 0; cursor: pointer;
  /* Unfilled stars: a soft tint of the text colour so they stay visible on light,
     dark, and glass (where --sf-color-border is near-white and would vanish). */
  color: color-mix(in srgb, var(--sf-color-fg) 26%, transparent);
  transition: transform .15s ease, color .15s ease;
}
.sf-star .sf-star-icon { width: 34px; height: 34px; display: block; }
.sf-star:hover { transform: scale(1.12); }
.sf-star.is-filled, .sf-star.is-selected, .sf-star[aria-checked="true"], .sf-star[data-filled="true"] { color: #f5b301; }

/* ===== Rating: emoji row ======================================================== */
.sf-emoji-row { display: flex; gap: var(--sf-space-sm); justify-content: space-between; }
.sf-emoji-btn {
  flex: 1 1 0; background: none; border: 0; cursor: pointer; padding: 7px 5px;
  line-height: 1; border-radius: var(--sf-radius-sm);
  transition: transform .18s cubic-bezier(.22,1,.36,1), background-color .18s ease;
}
.sf-emoji-btn:hover { transform: translateY(-2px) scale(1.08); }
.sf-emoji-btn.is-selected, .sf-emoji-btn[aria-checked="true"] { transform: scale(1.16); }

/* ===== Rating: thumbs =========================================================== */
.sf-scale--thumbs .sf-scale-track, .sf-thumbs {
  display: flex; gap: var(--sf-space); justify-content: center; flex-wrap: nowrap;
}
.sf-thumbs button, .sf-thumb {
  flex: 0 0 auto; width: 60px; height: 60px; min-width: 0; padding: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-muted);
  background: var(--sf-color-surface); border: 1.5px solid var(--sf-color-border);
  border-radius: 50%; cursor: pointer;
  transition: transform .18s ease, border-color .2s ease, background-color .2s ease, color .2s ease;
}
.sf-thumb-emoji { font-size: 30px; line-height: 1; display: block; }
.sf-thumbs button:hover, .sf-thumb:hover {
  transform: translateY(-2px); border-color: var(--sf-color-accent); color: var(--sf-color-fg);
}
.sf-thumb--up:hover { color: var(--sf-color-success); }
.sf-thumb--down:hover { color: var(--sf-color-danger); }
.sf-thumbs button.is-selected, .sf-thumbs button[aria-checked="true"],
.sf-thumb.is-selected, .sf-thumb[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  color: var(--sf-color-accent); transform: scale(1.06);
}

/* ===== Hero: emoji dial ========================================================= */
.sf-dial { display: flex; flex-direction: column; align-items: center; gap: var(--sf-space); }
.sf-dial-emoji {
  height: 96px; display: flex; align-items: center; justify-content: center;
  font-size: 80px; line-height: 1; user-select: none;
}
.sf-dial-track {
  position: relative; width: 100%; height: 44px; display: flex; align-items: center;
  cursor: pointer; touch-action: none;
}
.sf-dial-track::before {
  content: ""; position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
  height: 8px; border-radius: 999px; background: var(--sf-color-border);
}
.sf-dial-fill {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 8px; width: 50%; border-radius: 999px; background: var(--sf-color-accent);
  pointer-events: none;
}
.sf-dial-ticks { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 8px; pointer-events: none; }
.sf-dial-tick {
  position: absolute; top: 50%; width: 2px; height: 8px; transform: translate(-50%, -50%);
  background: color-mix(in srgb, var(--sf-color-bg) 70%, transparent); border-radius: 1px;
}
.sf-dial-thumb {
  position: absolute; top: 50%; left: 50%; width: 26px; height: 26px;
  transform: translate(-50%, -50%); border-radius: 50%;
  background: var(--sf-color-bg); border: 3px solid var(--sf-color-accent);
  box-shadow: var(--sf-shadow); cursor: grab;
}
.sf-dial-thumb:active { cursor: grabbing; }
.sf-dial-track:focus-visible { outline: none; }
.sf-dial-track:focus-visible .sf-dial-thumb { outline: 2px solid var(--sf-color-accent); outline-offset: 3px; }
.sf-dial-anchors { display: flex; justify-content: space-between; width: 100%; font-size: .8rem; color: var(--sf-color-muted); }

/* ===== Choice =================================================================== */
.sf-choice-group { display: flex; flex-direction: column; gap: var(--sf-space-sm); }
.sf-option {
  display: flex; align-items: center; gap: var(--sf-space-sm); width: 100%;
  min-height: 44px; padding: 11px var(--sf-space); text-align: start; font: inherit;
  color: var(--sf-color-fg); background: var(--sf-color-surface);
  border: 1.5px solid var(--sf-color-border); border-radius: var(--sf-radius-sm); cursor: pointer;
  transition: border-color .2s ease, background-color .2s ease, transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1);
}
.sf-option:hover { border-color: var(--sf-color-accent); transform: translateY(-1px); }
.sf-option.is-selected, .sf-option[aria-checked="true"] {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft); font-weight: 600;
}
.sf-option-box {
  flex: 0 0 auto; width: 19px; height: 19px;
  /* A fraction of the text color so the control stays visible on any surface,
     including translucent presets (glass) where --sf-color-border is near-white. */
  border: 2px solid color-mix(in srgb, var(--sf-color-fg) 34%, transparent);
  border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  color: var(--sf-color-accent-fg);
}
.sf-option[role="checkbox"] .sf-option-box { border-radius: 6px; }
.sf-option.is-selected .sf-option-box, .sf-option[aria-checked="true"] .sf-option-box {
  border-color: var(--sf-color-accent); background: var(--sf-color-accent);
}
.sf-option-label { flex: 1 1 auto; }
.sf-choice-other { margin-top: var(--sf-space-sm); }

/* ===== Text ==================================================================== */
.sf-text { display: flex; flex-direction: column; gap: 6px; }
.sf-text-label { font-size: .9rem; color: var(--sf-color-muted); }
.sf-textarea, .sf-input {
  width: 100%; min-height: 44px; padding: 11px var(--sf-space); font: inherit;
  color: var(--sf-color-fg); background: var(--sf-color-bg);
  /* A tint of the text colour, not --sf-color-border (which is near-white on glass and
     left the field looking borderless). Stays visible on light, dark, and glass. */
  border: 1.5px solid color-mix(in srgb, var(--sf-color-fg) 30%, transparent);
  border-radius: var(--sf-radius-sm);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.sf-textarea { min-height: 96px; resize: vertical; line-height: 1.5; }
.sf-textarea::placeholder, .sf-input::placeholder { color: var(--sf-color-muted); }
.sf-textarea:hover, .sf-input:hover { border-color: var(--sf-color-accent); }
.sf-input--other { margin-top: 6px; }
.sf-text-counter { font-size: .75rem; text-align: end; color: var(--sf-color-muted); }

/* ===== Link ==================================================================== */
.sf-link { display: flex; justify-content: center; }
.sf-link-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 11px 20px; font: inherit; font-weight: 600; text-decoration: none;
  border-radius: var(--sf-radius-sm); background: var(--sf-color-accent); color: var(--sf-color-accent-fg);
  cursor: pointer; transition: box-shadow .2s ease, transform var(--sf-motion-duration) cubic-bezier(.22,1,.36,1);
}
.sf-link-btn:hover { box-shadow: 0 8px 20px -8px var(--sf-color-accent); transform: translateY(-1px); }

/* ===== Thank-you =============================================================== */
.soft-thankyou {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: var(--sf-space-sm); padding: var(--sf-space) 0;
}
.soft-thankyou-mark {
  width: 56px; height: 56px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--sf-color-success);
  background: color-mix(in srgb, var(--sf-color-success) 16%, transparent);
  transform-origin: center; backface-visibility: hidden;
}
.soft-thankyou-check { will-change: stroke-dashoffset; }
.soft-thankyou-title { margin: 0; font-size: 1.1rem; font-weight: 650; }
.soft-thankyou-desc { margin: 0; color: var(--sf-color-muted); font-size: .9rem; }

/* ===== Badge =================================================================== */
.soft-badge {
  display: block; margin-top: var(--sf-space); text-align: center;
  font-size: .7rem; color: var(--sf-color-muted); text-decoration: none;
}
.soft-badge:hover { color: var(--sf-color-fg); }

/* ===== SR-only ================================================================= */
.soft-sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ===== Focus =================================================================== */
:host :focus-visible { outline: 2px solid var(--sf-color-accent); outline-offset: 2px; }
.sf-textarea:focus-visible, .sf-input:focus-visible {
  outline: none; border-color: var(--sf-color-accent); box-shadow: var(--_sf-focus-ring);
}

/* ============================================================================
   Polish layer \u2014 refined states, selection "pops", and per-component delight.
   Declared after the base rules (later-wins) but BEFORE the reduced-motion and
   forced-colors blocks, so those (which use !important) always have the final
   say. Every motion here is a transition/animation the reduced-motion block
   neutralizes automatically.
   ============================================================================ */
@keyframes sf-pop {
  0% { transform: scale(1); }
  45% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes sf-check-in {
  0% { transform: rotate(45deg) scale(0); opacity: 0; }
  60% { transform: rotate(45deg) scale(1.18); opacity: 1; }
  100% { transform: rotate(45deg) scale(1); opacity: 1; }
}
@keyframes sf-dot-in {
  0% { transform: scale(0); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes sf-rise {
  from { opacity: 0; transform: translateY(7px); }
  to { opacity: 1; transform: none; }
}
@keyframes sf-glow {
  from { opacity: 0.85; transform: scale(0.55); }
  to { opacity: 0; transform: scale(1.35); }
}

/* ---- Number scale: one connected, premium scale (NPS / CES) --------------- */
.sf-scale--number .sf-scale-track {
  flex-wrap: nowrap; gap: 0; border-radius: var(--sf-radius-sm); overflow: hidden;
  border: 1.5px solid var(--sf-color-border);
  background: linear-gradient(90deg,
    color-mix(in srgb, #ef4444 42%, transparent),
    color-mix(in srgb, #f59e0b 40%, transparent) 50%,
    color-mix(in srgb, #22c55e 46%, transparent));
}
.sf-scale--number .sf-rating-btn {
  flex: 1 1 0; min-width: 0; height: 48px; padding: 0;
  border: none; border-right: 1px solid var(--sf-color-border); border-radius: 0;
  background: transparent; color: var(--sf-color-fg);
  font-weight: 600; font-size: .95rem; font-variant-numeric: tabular-nums;
  transition: background-color .14s ease, color .14s ease;
}
.sf-scale--number .sf-rating-btn:last-child { border-right: none; }
.sf-scale--number .sf-rating-btn:hover { background: var(--_sf-accent-soft); transform: none; box-shadow: none; }
.sf-scale--number .sf-rating-btn.is-selected,
.sf-scale--number .sf-rating-btn[aria-checked="true"] {
  background: var(--sf-color-accent); color: var(--sf-color-accent-fg);
  box-shadow: none; transform: none; animation: none;
}

/* ---- Stars: warm gold, glow, springy fill -------------------------------- */
.sf-star { transition: transform .18s cubic-bezier(.34,1.56,.64,1), color .16s ease, filter .2s ease; }
.sf-star.is-filled .sf-star-icon { filter: drop-shadow(0 2px 6px rgba(245,179,1,.45)); }
.sf-star:hover, .sf-star:focus-visible { transform: scale(1.16) rotate(-5deg); }
.sf-star.is-selected { animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1); }

/* ---- Thumbs: emoji \u{1F44D} / \u{1F44E}, tactile success/danger selection ------------- */
.sf-thumb { width: 66px; height: 66px; }
.sf-thumb-emoji { transition: transform .18s cubic-bezier(.34,1.56,.64,1); }
.sf-thumb:hover .sf-thumb-emoji { transform: scale(1.14); }
.sf-thumb--up.is-selected, .sf-thumb--up[aria-checked="true"] {
  border-color: var(--sf-color-success);
  background: color-mix(in srgb, var(--sf-color-success) 16%, transparent);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-thumb--up:hover { border-color: var(--sf-color-success); background: color-mix(in srgb, var(--sf-color-success) 9%, transparent); }
.sf-thumb--down.is-selected, .sf-thumb--down[aria-checked="true"] {
  border-color: var(--sf-color-danger);
  background: color-mix(in srgb, var(--sf-color-danger) 16%, transparent);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-thumb--down:hover { border-color: var(--sf-color-danger); background: color-mix(in srgb, var(--sf-color-danger) 9%, transparent); }

/* ---- Emoji row: full-color real emoji, clear selection ------------------- */
.sf-emoji-glyph { font-size: 34px; line-height: 1; display: block; }
.sf-emoji-btn { transition: transform .2s cubic-bezier(.34,1.56,.64,1), background-color .2s ease; }
.sf-emoji-btn:hover { transform: translateY(-3px) scale(1.12); background: color-mix(in srgb, var(--sf-color-accent) 7%, transparent); }
.sf-emoji-btn.is-selected, .sf-emoji-btn[aria-checked="true"] {
  background: var(--_sf-accent-soft);
  animation: sf-pop .5s cubic-bezier(.34,1.56,.64,1);
}
.sf-emoji-btn.is-selected .sf-emoji-glyph, .sf-emoji-btn[aria-checked="true"] .sf-emoji-glyph {
  filter: drop-shadow(0 5px 10px rgba(30,30,55,.2));
}

/* ---- Choice options: crisp rows, clear selection, animated check/dot ------ */
.sf-choice-group { gap: 10px; }
.sf-option {
  background: var(--sf-color-bg); gap: 12px; padding: 13px 15px; font-weight: 500;
  box-shadow: 0 1px 2px rgba(20,22,45,.04);
}
.sf-option:hover {
  border-color: var(--sf-color-accent); background: var(--_sf-accent-soft);
  box-shadow: 0 6px 16px -8px rgba(20,22,45,.22);
}
.sf-option.is-selected, .sf-option[aria-checked="true"] {
  background: var(--_sf-accent-soft); border-color: var(--sf-color-accent);
  box-shadow: 0 1px 2px rgba(20,22,45,.04);
  animation: sf-pop .4s cubic-bezier(.34,1.56,.64,1);
}
.sf-option-box { width: 20px; height: 20px; border-width: 2px; }
.sf-option-box { position: relative; }
.sf-option-box::after { content: ""; position: absolute; }
.sf-option[role="checkbox"] .sf-option-box::after {
  width: 5px; height: 9px; left: 50%; top: 46%; margin: -5px 0 0 -2.5px;
  border: solid var(--sf-color-accent-fg); border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0); opacity: 0;
}
.sf-option[role="checkbox"].is-selected .sf-option-box::after,
.sf-option[role="checkbox"][aria-checked="true"] .sf-option-box::after {
  animation: sf-check-in .3s cubic-bezier(.34,1.56,.64,1) forwards;
}
.sf-option[role="radio"] .sf-option-box::after {
  inset: 0; margin: auto; width: 8px; height: 8px; border-radius: 50%;
  background: var(--sf-color-accent-fg); transform: scale(0);
}
.sf-option[role="radio"].is-selected .sf-option-box::after,
.sf-option[role="radio"][aria-checked="true"] .sf-option-box::after {
  animation: sf-dot-in .28s cubic-bezier(.34,1.56,.64,1) forwards;
}
.sf-choice-group .sf-option { animation: sf-rise .34s ease both; }
.sf-choice-group .sf-option:nth-child(1) { animation-delay: .02s; }
.sf-choice-group .sf-option:nth-child(2) { animation-delay: .07s; }
.sf-choice-group .sf-option:nth-child(3) { animation-delay: .12s; }
.sf-choice-group .sf-option:nth-child(4) { animation-delay: .17s; }
.sf-choice-group .sf-option:nth-child(5) { animation-delay: .22s; }
.sf-choice-group .sf-option:nth-child(n+6) { animation-delay: .27s; }

/* ---- Dial: big emoji face that snaps + pops, premium rail ----------------- */
.sf-dial { gap: 20px; }
.sf-dial-emoji { filter: drop-shadow(0 6px 10px rgba(20,20,40,.14)); will-change: transform; }
@keyframes sf-dial-emoji-pop { 0% { transform: scale(.74); } 55% { transform: scale(1.14); } 100% { transform: scale(1); } }
.sf-dial-emoji--pop { animation: sf-dial-emoji-pop .42s cubic-bezier(.34,1.56,.64,1); }
.sf-dial-track { height: 40px; }
.sf-dial-ticks { display: none; }
/* Rail = a fraction of the text color so the unfilled track is clearly visible on
   any surface (light, dark, or a translucent glass preset). */
.sf-dial-track::before { height: 10px; background: color-mix(in srgb, var(--sf-color-fg) 18%, transparent); box-shadow: none; }
.sf-dial-fill { height: 10px; background: linear-gradient(90deg, color-mix(in srgb, var(--sf-color-accent) 78%, #fff), var(--sf-color-accent)); }
/* Thumb = a solid accent disc with a card-colored ring, so it reads on every theme
   (a bg-colored center used to vanish into a dark card). */
.sf-dial-thumb {
  width: 28px; height: 28px; border: 3px solid var(--sf-color-bg);
  background: var(--sf-color-accent);
  box-shadow: 0 3px 10px rgba(20,22,45,.35), 0 0 0 0 var(--_sf-accent-soft);
  transition: box-shadow .18s ease, transform .12s ease;
}
.sf-dial-track:hover .sf-dial-thumb { box-shadow: 0 4px 12px rgba(20,22,45,.3), 0 0 0 6px var(--_sf-accent-soft); }
.sf-dial-track:active .sf-dial-thumb {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 5px 14px rgba(20,22,45,.32), 0 0 0 9px var(--_sf-accent-soft);
}

/* ---- Card & header: softer shell, calmer hierarchy ----------------------- */
.soft-card { border-radius: 18px; padding: 22px 24px 24px; box-shadow: 0 1px 2px rgba(20,22,45,.05), 0 20px 50px -18px rgba(20,22,45,.30); }
.soft-head { margin-bottom: 20px; }
.soft-title { font-size: 1.075rem; font-weight: 700; letter-spacing: -0.012em; line-height: 1.32; }
.soft-close { width: 32px; height: 32px; border-radius: 10px; margin: -4px -6px 0 0; }
.soft-close:hover { background: var(--sf-color-surface); color: var(--sf-color-fg); }

/* ---- Progress: rounded, gradient, soft glow ------------------------------ */
.soft-progress { height: 5px; margin-bottom: 20px; }
.soft-progress-fill {
  background: linear-gradient(90deg, color-mix(in srgb, var(--sf-color-accent) 72%, var(--sf-color-accent-fg)), var(--sf-color-accent));
  box-shadow: 0 0 8px -2px var(--sf-color-accent);
}

/* ---- Primary button: gradient + lift ------------------------------------- */
.soft-btn-primary {
  background: linear-gradient(180deg, color-mix(in srgb, var(--sf-color-accent) 90%, #fff), var(--sf-color-accent));
  box-shadow: 0 4px 12px -6px var(--sf-color-accent);
}
.soft-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px -8px var(--sf-color-accent); }

/* ---- Thank-you: a soft glow burst behind the mark ------------------------ */
.soft-thankyou-mark { position: relative; }
.soft-thankyou-mark::before {
  content: ""; position: absolute; inset: -10px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, color-mix(in srgb, var(--sf-color-success) 34%, transparent), transparent 70%);
  animation: sf-glow .9s ease forwards;
}

/* ---- Text: accent the label while focused -------------------------------- */
.sf-text:focus-within .sf-text-label { color: var(--sf-color-accent); }

/* ---- Focus refinements: shape-appropriate rings -------------------------- */
/* Number cells live inside an overflow:hidden track, so an outline would clip.
   Use an inset ring that reads cleanly within the connected scale. */
.sf-scale--number .sf-rating-btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--sf-color-accent);
}
/* The dial communicates focus through its thumb ring, not a rectangle around the rail. */
.sf-dial-track:focus-visible { outline: none; }

/* ===== Reduced motion ========================================================== */
@media (prefers-reduced-motion: reduce) {
  :host * {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
  .soft-card, .sf-rating-btn, .sf-option, .soft-btn, .sf-emoji-btn { transform: none !important; }
}

/* ===== Forced colors =========================================================== */
@media (forced-colors: active) {
  .soft-card, .sf-rating-btn, .sf-option, .sf-input, .sf-textarea, .soft-btn { border-color: CanvasText; }
  .sf-rating-btn[aria-checked="true"], .sf-option[aria-checked="true"], .sf-rating-btn.is-selected, .sf-option.is-selected { outline: 2px solid Highlight; }
  :host :focus-visible { outline: 2px solid Highlight; }
}
`;var Ct={minimal:{"color-accent":"#111827","color-accent-fg":"#ffffff","color-surface":"#ffffff","color-border":"#ececef",radius:"8px","radius-sm":"6px",shadow:"0 1px 2px rgb(16 18 35 / 0.06), 0 6px 16px -10px rgb(16 18 35 / 0.18)"},soft:{"color-accent":"#6366f1","color-accent-fg":"#ffffff","color-surface":"#f5f5ff","color-border":"#e6e6f5",radius:"18px","radius-sm":"12px",space:"18px","space-lg":"26px",shadow:"0 14px 50px -12px rgb(79 70 229 / 0.28), 0 4px 14px -8px rgb(16 18 35 / 0.14)"},glass:{"color-bg":"rgba(255, 255, 255, 0.42)","color-fg":"#1a1726","color-muted":"#4b475a","color-surface":"rgba(255, 255, 255, 0.28)","color-border":"rgba(255, 255, 255, 0.65)","color-accent":"#7c3aed","color-accent-fg":"#ffffff",radius:"22px","radius-sm":"14px",backdrop:"blur(12px) saturate(1.4)",shadow:"0 24px 70px -24px rgb(16 18 35 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.7), inset 0 0 0 1px rgb(255 255 255 / 0.22)"},"glass-dark":{"color-bg":"rgba(28, 28, 40, 0.5)","color-fg":"#f4f4f8","color-muted":"#aeb2c2","color-surface":"rgba(255, 255, 255, 0.09)","color-border":"rgba(255, 255, 255, 0.16)","color-accent":"#a78bfa","color-accent-fg":"#16131f",radius:"22px","radius-sm":"14px",backdrop:"blur(12px) saturate(1.4)",shadow:"0 26px 70px -22px rgb(0 0 0 / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(255 255 255 / 0.07)"},"high-contrast":{"color-bg":"#ffffff","color-fg":"#000000","color-muted":"#1f1f1f","color-accent":"#0000ee","color-accent-fg":"#ffffff","color-border":"#000000","color-surface":"#ffffff","color-danger":"#b00000","color-success":"#006400",radius:"6px","radius-sm":"4px",shadow:"none"}};var At=["color-bg","color-fg","color-muted","color-accent","color-accent-fg","color-border","color-danger","color-success","color-surface","radius","radius-sm","font","shadow","space","space-sm","space-lg","motion-duration","z","max-width"];new Set(At);var Hn={"color-bg":"#ffffff","color-fg":"#1a1a23","color-muted":"#6b7280","color-accent":"#4f46e5","color-accent-fg":"#ffffff","color-border":"#e5e7eb","color-danger":"#dc2626","color-success":"#16a34a","color-surface":"#f7f7fb",radius:"14px","radius-sm":"9px",font:"inherit",shadow:"0 10px 38px -10px rgb(16 18 35 / 0.28), 0 4px 12px -6px rgb(16 18 35 / 0.16)",space:"16px","space-sm":"8px","space-lg":"24px","motion-duration":"0.28s",z:"2147483000","max-width":"380px"},Nn=new Set(["color-bg","color-fg","color-muted","color-accent","color-accent-fg","color-border","color-danger","color-success","color-surface"]);function Dn(e){return Nn.has(e)?"color":e==="shadow"?"shadow":e==="font"?"fontFamily":e==="motion-duration"?"duration":e==="radius"||e==="radius-sm"||e.startsWith("space")||e==="max-width"?"dimension":"other"}(()=>{let e={};for(let t of At){let n=Hn[t];n!==void 0&&(e[t]={$type:Dn(t),$value:n});}return {$description:"soft-feedback default light theme",tokens:e}})();function Le(e,t,n){let o=t.startsWith("--sf-")?t:`--sf-${t}`;e.style.setProperty(o,n);}function Rt(e,t){if(t)for(let[n,o]of Object.entries(t))typeof o=="string"&&o.length>0&&Le(e,n,o);}function Mt(e,t,n){if(!e||typeof e.setAttribute!="function")return;let o=t?.theme??(typeof n=="string"?n:"auto");e.setAttribute("data-theme",o),n&&typeof n!="string"&&Rt(e,n.tokens),Rt(e,t?.tokens),typeof t?.maxWidth=="number"&&Number.isFinite(t.maxWidth)&&Le(e,"max-width",`${t.maxWidth}px`),typeof t?.zIndex=="number"&&Number.isFinite(t.zIndex)&&Le(e,"z",String(t.zIndex)),typeof t?.fontFamily=="string"&&t.fontFamily.length>0&&Le(e,"font",t.fontFamily),t?.position&&e.setAttribute("data-position",t.position);}function Qn(e){return e.type==="rating"}function qe(e){let t=e.question;if(!Qn(t))throw new Error("rating-number: expected a rating question");let n=Math.round(t.scale.min),o=Math.round(t.scale.max),r=Math.max(0,o-n)+1,s=document.createElement("div");s.className="sf-scale sf-scale--number";let i=document.createElement("div");i.className="sf-scale-track",i.setAttribute("role","radiogroup"),i.setAttribute("aria-label",t.prompt),i.setAttribute("part","rating");let b=typeof e.value=="number"?e.value:void 0,d=[],g=a=>{if(a===n&&t.labels?.min)return `${a}, ${t.labels.min}`;if(a===o&&t.labels?.max)return `${a}, ${t.labels.max}`;let c=a-n+1;return `${a}, ${c} of ${r}`},p=()=>{d.forEach((a,c)=>{let l=n+c,m=b===l;a.setAttribute("aria-checked",m?"true":"false"),a.classList.toggle("is-selected",m);let h=m||b===void 0&&c===0;a.tabIndex=h?0:-1;});},u=(a,c,l)=>{b=a,p(),l&&d[a-n]?.focus(),e.onChange(a),c&&e.onCommit?.(a);},y=a=>{let c=Math.max(0,Math.min(r-1,a));u(n+c,false,true);};for(let a=0;a<r;a++){let c=n+a,l=document.createElement("button");l.type="button",l.className="sf-rating-btn",l.setAttribute("role","radio"),l.setAttribute("part","rating-button"),l.setAttribute("aria-label",g(c)),l.setAttribute("aria-checked","false"),l.textContent=String(c),l.addEventListener("click",()=>u(c,true,false)),l.addEventListener("keydown",m=>{switch(m.key){case "ArrowRight":case "ArrowDown":m.preventDefault(),y(a+1);break;case "ArrowLeft":case "ArrowUp":m.preventDefault(),y(a-1);break;case "Home":m.preventDefault(),y(0);break;case "End":m.preventDefault(),y(r-1);break;case "Enter":case " ":m.preventDefault(),u(c,true,false);break;}}),d.push(l),i.appendChild(l);}if(s.appendChild(i),t.labels?.min||t.labels?.max){let a=document.createElement("div");a.className="sf-scale-anchors",a.setAttribute("part","rating-anchors"),a.setAttribute("aria-hidden","true");let c=document.createElement("span");c.className="sf-scale-anchor sf-scale-anchor--min",c.textContent=t.labels?.min??"";let l=document.createElement("span");l.className="sf-scale-anchor sf-scale-anchor--max",l.textContent=t.labels?.max??"",a.append(c,l),s.appendChild(a);}return p(),{el:s,focus(){(d.find(c=>c.tabIndex===0)??d[0])?.focus();},destroy(){s.remove();}}}function In(e){return e.type==="rating"}function On(){let e="http://www.w3.org/2000/svg",t=document.createElementNS(e,"svg");t.setAttribute("viewBox","0 0 24 24"),t.setAttribute("class","sf-star-icon"),t.setAttribute("aria-hidden","true"),t.setAttribute("focusable","false");let n=document.createElementNS(e,"path");return n.setAttribute("d","M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.9l-5.84 3.07 1.11-6.5-4.72-4.6 6.53-.95L12 2.5z"),n.setAttribute("fill","currentColor"),t.appendChild(n),t}function Tt(e){let t=e.question;if(!In(t))throw new Error("rating-stars: expected a rating question");let n=1,o=Math.min(5,Math.max(1,Math.round(t.scale.max))),r=o,s=document.createElement("div");s.className="sf-scale sf-scale--stars";let i=document.createElement("div");i.className="sf-scale-track sf-stars",i.setAttribute("role","radiogroup"),i.setAttribute("aria-label",t.prompt),i.setAttribute("part","rating");let b=typeof e.value=="number"?e.value:void 0,d=[],g=c=>c===r&&t.labels?.max?`${c} of ${o} stars, ${t.labels.max}`:c===n&&t.labels?.min?`${c} of ${o} stars, ${t.labels.min}`:`${c} of ${o} stars`,p=c=>{d.forEach((l,m)=>{l.classList.toggle("is-filled",c!==void 0&&m+1<=c);});},u=()=>{d.forEach((c,l)=>{let m=l+1,h=b===m;c.setAttribute("aria-checked",h?"true":"false"),c.classList.toggle("is-selected",h),c.tabIndex=h||b===void 0&&l===0?0:-1;}),p(b);},y=(c,l,m)=>{b=c,u(),m&&d[c-1]?.focus(),e.onChange(c),l&&e.onCommit?.(c);},a=c=>{let l=Math.max(0,Math.min(o-1,c));y(l+1,false,true);};for(let c=0;c<o;c++){let l=c+1,m=document.createElement("button");m.type="button",m.className="sf-rating-btn sf-star",m.setAttribute("role","radio"),m.setAttribute("part","rating-button"),m.setAttribute("aria-label",g(l)),m.setAttribute("aria-checked","false"),m.appendChild(On()),m.addEventListener("click",()=>y(l,true,false)),m.addEventListener("mouseenter",()=>p(l)),m.addEventListener("mouseleave",()=>p(b)),m.addEventListener("focus",()=>p(l)),m.addEventListener("blur",()=>p(b)),m.addEventListener("keydown",h=>{switch(h.key){case "ArrowRight":case "ArrowUp":h.preventDefault(),a(c+1);break;case "ArrowLeft":case "ArrowDown":h.preventDefault(),a(c-1);break;case "Home":h.preventDefault(),a(0);break;case "End":h.preventDefault(),a(o-1);break;case "Enter":case " ":h.preventDefault(),y(l,true,false);break;}}),d.push(m),i.appendChild(m);}return s.appendChild(i),u(),{el:s,focus(){(d.find(l=>l.tabIndex===0)??d[0])?.focus();},destroy(){s.remove();}}}function Pn(e){return e.type==="rating"}var He=["Very dissatisfied","Dissatisfied","Neutral","Satisfied","Very satisfied"],je=["\u{1F621}","\u{1F641}","\u{1F610}","\u{1F642}","\u{1F60D}"];function Fn(e){let t=e<0?0:e>1?1:e,n=Math.round(t*(je.length-1));return je[Math.max(0,Math.min(je.length-1,n))]}function Bn(e){let t=document.createElement("span");return t.className="sf-emoji-glyph",t.setAttribute("aria-hidden","true"),t.textContent=Fn(e),t}function Lt(e){let t=e.question;if(!Pn(t))throw new Error("rating-emoji: expected a rating question");let n=Math.round(t.scale.min),o=Math.round(t.scale.max),r=Math.max(1,o-n+1),s=document.createElement("div");s.className="sf-scale sf-scale--emoji";let i=document.createElement("div");i.className="sf-scale-track sf-emoji-row",i.setAttribute("role","radiogroup"),i.setAttribute("aria-label",t.prompt),i.setAttribute("part","rating");let b=typeof e.value=="number"?e.value:void 0,d=[],g=c=>{if(c===0&&t.labels?.min)return t.labels.min;if(c===r-1&&t.labels?.max)return t.labels.max;if(r===1)return t.midpointLabel??He[2];let l=(r-1)/2;if(Math.abs(c-l)<.5&&t.midpointLabel)return t.midpointLabel;let m=Math.round(c/(r-1)*(He.length-1));return He[Math.max(0,Math.min(He.length-1,m))]},p=c=>{let l=n+c;return `${g(c)} (${l} of ${o})`},u=()=>{d.forEach((c,l)=>{let m=n+l,h=b===m;c.setAttribute("aria-checked",h?"true":"false"),c.classList.toggle("is-selected",h),c.tabIndex=h||b===void 0&&l===0?0:-1;});},y=(c,l,m)=>{let h=n+c;b=h,u(),m&&d[c]?.focus(),e.onChange(h),l&&e.onCommit?.(h);},a=c=>{y(Math.max(0,Math.min(r-1,c)),false,true);};for(let c=0;c<r;c++){let l=r===1?.5:c/(r-1),m=document.createElement("button");m.type="button",m.className="sf-rating-btn sf-emoji-btn",m.setAttribute("role","radio"),m.setAttribute("part","rating-button"),m.setAttribute("aria-label",p(c)),m.setAttribute("aria-checked","false"),m.appendChild(Bn(l)),m.addEventListener("click",()=>y(c,true,false)),m.addEventListener("keydown",h=>{switch(h.key){case "ArrowRight":case "ArrowUp":h.preventDefault(),a(c+1);break;case "ArrowLeft":case "ArrowDown":h.preventDefault(),a(c-1);break;case "Home":h.preventDefault(),a(0);break;case "End":h.preventDefault(),a(r-1);break;case "Enter":case " ":h.preventDefault(),y(c,true,false);break;}}),d.push(m),i.appendChild(m);}if(s.appendChild(i),t.labels?.min||t.labels?.max){let c=document.createElement("div");c.className="sf-scale-anchors",c.setAttribute("part","rating-anchors"),c.setAttribute("aria-hidden","true");let l=document.createElement("span");l.className="sf-scale-anchor sf-scale-anchor--min",l.textContent=t.labels?.min??"";let m=document.createElement("span");m.className="sf-scale-anchor sf-scale-anchor--max",m.textContent=t.labels?.max??"",c.append(l,m),s.appendChild(c);}return u(),{el:s,focus(){(d.find(l=>l.tabIndex===0)??d[0])?.focus();},destroy(){s.remove();}}}function qn(e){return e.type==="rating"}function jn(e){let t=document.createElement("span");return t.className="sf-thumb-emoji",t.setAttribute("aria-hidden","true"),t.textContent=e?"\u{1F44D}":"\u{1F44E}",t}function Ht(e){let t=e.question;if(!qn(t))throw new Error("rating-thumbs: expected a rating question");let n=Math.round(t.scale.min),o=Math.round(t.scale.max),r=document.createElement("div");r.className="sf-scale sf-scale--thumbs";let s=document.createElement("div");s.className="sf-scale-track sf-thumbs",s.setAttribute("role","radiogroup"),s.setAttribute("aria-label",t.prompt),s.setAttribute("part","rating");let i=typeof e.value=="number"?e.value:void 0,b=[{value:n,up:false,label:t.labels?.min??"No, not helpful"},{value:o,up:true,label:t.labels?.max??"Yes, helpful"}],d=[],g=()=>{d.forEach((y,a)=>{let c=b[a],l=i===c.value;y.setAttribute("aria-checked",l?"true":"false"),y.classList.toggle("is-selected",l),y.tabIndex=l||i===void 0&&a===0?0:-1;});},p=(y,a,c)=>{let l=b[y];i=l.value,g(),c&&d[y]?.focus(),e.onChange(l.value),a&&e.onCommit?.(l.value);},u=y=>{p(Math.max(0,Math.min(b.length-1,y)),false,true);};return b.forEach((y,a)=>{let c=document.createElement("button");c.type="button",c.className=y.up?"sf-rating-btn sf-thumb sf-thumb--up":"sf-rating-btn sf-thumb sf-thumb--down",c.setAttribute("role","radio"),c.setAttribute("part","rating-button"),c.setAttribute("aria-label",y.label),c.setAttribute("aria-checked","false"),c.appendChild(jn(y.up)),c.addEventListener("click",()=>p(a,true,false)),c.addEventListener("keydown",l=>{switch(l.key){case "ArrowRight":case "ArrowDown":l.preventDefault(),u(a+1);break;case "ArrowLeft":case "ArrowUp":l.preventDefault(),u(a-1);break;case "Home":l.preventDefault(),u(0);break;case "End":l.preventDefault(),u(b.length-1);break;case "Enter":case " ":l.preventDefault(),p(a,true,false);break;}}),d.push(c),s.appendChild(c);}),r.appendChild(s),g(),{el:r,focus(){(d.find(a=>a.tabIndex===0)??d[0])?.focus();},destroy(){r.remove();}}}function $n(e){return e.type==="rating"}var le=e=>e<0?0:e>1?1:e,$e=["\u{1F61E}","\u{1F641}","\u{1F610}","\u{1F642}","\u{1F604}"];function Nt(e){let t=Math.round(le(e)*($e.length-1));return $e[Math.max(0,Math.min($e.length-1,t))]}function Dt(e){let t=e.question;if(!$n(t))throw new Error("emoji-dial: expected a rating question");let n=Math.round(t.scale.min),o=Math.round(t.scale.max),r=Math.max(1,o-n),s=r,i=J(),b=x=>le((x-n)/r),d=x=>n+Math.round(le(x)*r),g=typeof e.value=="number"?e.value:void 0,p=g!==void 0?b(g):.5,u=document.createElement("div");u.className="sf-dial";let y=document.createElement("div");y.className="sf-dial-emoji",y.setAttribute("aria-hidden","true"),y.textContent=Nt(p);let a=document.createElement("div");a.className="sf-dial-track",a.setAttribute("part","dial"),a.setAttribute("role","slider"),a.setAttribute("tabindex","0"),a.setAttribute("aria-label",t.prompt),a.setAttribute("aria-valuemin",String(n)),a.setAttribute("aria-valuemax",String(o));let c=document.createElement("div");c.className="sf-dial-fill",c.setAttribute("aria-hidden","true");let l=document.createElement("div");l.className="sf-dial-thumb",l.setAttribute("part","dial-thumb"),l.setAttribute("aria-hidden","true");let m=document.createElement("div");m.className="sf-dial-ticks",m.setAttribute("aria-hidden","true");for(let x=0;x<=s;x++){let R=document.createElement("span");R.className="sf-dial-tick",R.style.left=`${x/s*100}%`,m.appendChild(R);}a.append(m,c,l);let h=document.createElement("div");h.className="sf-dial-anchors",h.setAttribute("aria-hidden","true");let M=document.createElement("span");M.className="sf-dial-anchor sf-dial-anchor--min",M.textContent=t.labels?.min??"";let D=document.createElement("span");D.className="sf-dial-anchor sf-dial-anchor--max",D.textContent=t.labels?.max??"",h.append(M,D),u.append(y,a,h);let w=["Very dissatisfied","Dissatisfied","Neutral","Satisfied","Very satisfied"],k=x=>{if(x===n&&t.labels?.min)return t.labels.min;if(x===o&&t.labels?.max)return t.labels.max;if(t.midpointLabel&&x===Math.round((n+o)/2))return t.midpointLabel;let R=(x-n)/r,A=Math.round(R*(w.length-1));return w[Math.max(0,Math.min(w.length-1,A))]},v="",T=x=>{let R=Nt(x);R!==v&&(v=R,y.textContent=R,i||(y.classList.remove("sf-dial-emoji--pop"),y.offsetWidth,y.classList.add("sf-dial-emoji--pop")));let A=le(x)*100;l.style.left=`${A}%`,c.style.width=`${A}%`;},Q=x=>{a.setAttribute("aria-valuenow",String(x)),a.setAttribute("aria-valuetext",k(x));},N=null,B=()=>{N&&(N(),N=null);},me=(x,R=e.motion)=>{B(),N=U({from:p,to:x,preset:R,reducedMotion:i,onUpdate:A=>{p=A,T(p);},onDone:()=>{p=x,T(p),N=null;}});},W=()=>{try{let x=navigator;typeof x.vibrate=="function"&&x.vibrate(8);}catch{}},O=(x,R)=>{let A=Math.max(n,Math.min(o,Math.round(x))),G=A!==g;g=A,Q(A);let te=b(A);R.animate&&!i?me(te):(B(),p=te,T(p)),G&&(W(),e.onChange(A)),R.commit&&e.onCommit?.(A);},z=false,q,X=x=>{let R=a.getBoundingClientRect();if(R.width<=0)return p;let A=getComputedStyle(a).direction==="rtl",G=(x-R.left)/R.width;return A&&(G=1-G),le(G)},ie=x=>{if(!z)return;x.preventDefault();let R=X(x.clientX);B(),p=R,T(p);let A=d(R);A!==q&&(q=A,A!==g&&(g=A,Q(A),W(),e.onChange(A)));},K=x=>{if(!z)return;z=false;try{a.releasePointerCapture(x.pointerId);}catch{}window.removeEventListener("pointermove",ie),window.removeEventListener("pointerup",K),window.removeEventListener("pointercancel",K);let R=d(p);O(R,{commit:true,animate:true}),q=void 0;},be=x=>{if(x.button!==void 0&&x.button!==0)return;x.preventDefault(),a.focus(),z=true,q=void 0;try{a.setPointerCapture(x.pointerId);}catch{}window.addEventListener("pointermove",ie),window.addEventListener("pointerup",K),window.addEventListener("pointercancel",K);let R=X(x.clientX);p=R,T(p);let A=d(R);A!==g&&(g=A,Q(A),W(),e.onChange(A)),q=A;};a.addEventListener("pointerdown",be);let Z=x=>{let R=g??d(p);O(R+x,{commit:false,animate:true});},ee=x=>{switch(x.key){case "ArrowRight":case "ArrowUp":x.preventDefault(),Z(1);break;case "ArrowLeft":case "ArrowDown":x.preventDefault(),Z(-1);break;case "PageUp":x.preventDefault(),Z(+Math.max(1,Math.round(s/4)));break;case "PageDown":x.preventDefault(),Z(-Math.max(1,Math.round(s/4)));break;case "Home":x.preventDefault(),O(n,{commit:false,animate:true});break;case "End":x.preventDefault(),O(o,{commit:false,animate:true});break;case "Enter":case " ":x.preventDefault(),O(g??d(p),{commit:true,animate:false});break;}};return a.addEventListener("keydown",ee),g!==void 0?Q(g):(a.setAttribute("aria-valuenow",String(d(.5))),a.setAttribute("aria-valuetext",k(d(.5)))),T(p),{el:u,focus(){a.focus();},destroy(){B(),a.removeEventListener("pointerdown",be),a.removeEventListener("keydown",ee),window.removeEventListener("pointermove",ie),window.removeEventListener("pointerup",K),window.removeEventListener("pointercancel",K),u.remove();}}}function Un(e){return e.type==="choice"}var F="other";function Vn(e){for(let t=e.length-1;t>0;t--){let n=Math.floor(Math.random()*(t+1)),o=e[t];e[t]=e[n],e[n]=o;}return e}function Qt(e){let t=e.question;if(!Un(t))throw new Error("choice: expected a choice question");let n=t.multiple===true,o=document.createElement("div");o.className=n?"sf-choice sf-choice--multi":"sf-choice sf-choice--single";let r=document.createElement("div");r.className="sf-choice-group",r.setAttribute("part","choice"),r.setAttribute("role",n?"group":"radiogroup"),r.setAttribute("aria-label",t.prompt);let s=t.options.slice();t.shuffle&&Vn(s),t.allowOther&&s.push({id:F,label:"Other"});let i=()=>typeof e.value=="string"?e.value:void 0,b=new Set(Array.isArray(e.value)?e.value.map(w=>w.split(":")[0]):[]),d=n?void 0:i(),g="",p=null,u=null,y=[],a=()=>n?b.has(F):d===F,c=w=>{u&&(u.hidden=!w,w&&p?.focus());},l=()=>{if(n){let w=[];for(let k of s)b.has(k.id)&&(k.id===F?w.push(g?`${F}:${g}`:F):w.push(k.id));e.onChange(w);}else {if(d===void 0)return;let w=d===F&&g?`${F}:${g}`:d;e.onChange(w);}},m=()=>{y.forEach((w,k)=>{let v=s[k].id,T=d===v;w.setAttribute("aria-checked",T?"true":"false"),w.classList.toggle("is-selected",T),w.tabIndex=T||d===void 0&&k===0?0:-1;});},h=(w,k,v)=>{let T=s[w];d=T.id,m(),c(T.id===F),k&&y[w]?.focus(),l(),v&&T.id!==F&&e.onCommit?.(T.id);},M=w=>{h(Math.max(0,Math.min(s.length-1,w)),true,false);},D=w=>{let k=s[w],v=y[w];b.has(k.id)?(b.delete(k.id),v.setAttribute("aria-checked","false"),v.classList.remove("is-selected")):(b.add(k.id),v.setAttribute("aria-checked","true"),v.classList.add("is-selected")),k.id===F&&c(b.has(F)),l();};return s.forEach((w,k)=>{let v=document.createElement("button");v.type="button",v.className="sf-option",v.setAttribute("part","choice-option"),v.setAttribute("role",n?"checkbox":"radio"),v.setAttribute("aria-checked","false"),n&&(v.tabIndex=0);let T=document.createElement("span");T.className="sf-option-box",T.setAttribute("aria-hidden","true");let Q=document.createElement("span");Q.className="sf-option-label",Q.textContent=w.label,v.append(T,Q),n?(v.addEventListener("click",()=>D(k)),v.addEventListener("keydown",N=>{(N.key==="Enter"||N.key===" ")&&(N.preventDefault(),D(k));})):(v.addEventListener("click",()=>h(k,false,true)),v.addEventListener("keydown",N=>{switch(N.key){case "ArrowDown":case "ArrowRight":N.preventDefault(),M(k+1);break;case "ArrowUp":case "ArrowLeft":N.preventDefault(),M(k-1);break;case "Home":N.preventDefault(),M(0);break;case "End":N.preventDefault(),M(s.length-1);break;case "Enter":case " ":N.preventDefault(),h(k,false,true);break;}})),y.push(v),r.appendChild(v);}),o.appendChild(r),t.allowOther&&(u=document.createElement("div"),u.className="sf-choice-other",u.hidden=!a(),p=document.createElement("input"),p.type="text",p.className="sf-input sf-input--other",p.setAttribute("part","choice-other-input"),p.setAttribute("aria-label","Other, please specify"),p.placeholder="Please specify\u2026",p.value="",p.addEventListener("input",()=>{g=p.value.trim(),l();}),u.appendChild(p),o.appendChild(u)),n?(y.forEach((w,k)=>{let v=b.has(s[k].id);w.setAttribute("aria-checked",v?"true":"false"),w.classList.toggle("is-selected",v);}),c(a())):(m(),c(a())),{el:o,focus(){n?y[0]?.focus():(y.find(k=>k.tabIndex===0)??y[0])?.focus();},destroy(){o.remove();}}}function Wn(e){return e.type==="text"}var _n=0;function It(e){let t=e.question;if(!Wn(t))throw new Error("text: expected a text question");let n=`sf-text-${++_n}`,o=document.createElement("div");o.className="sf-text";let r=document.createElement("label");r.className="sf-text-label",r.setAttribute("for",n),r.setAttribute("part","text-label"),r.textContent=t.prompt;let s=document.createElement("textarea");s.id=n,s.className="sf-input sf-textarea",s.setAttribute("part","text-input"),s.rows=3,t.placeholder&&(s.placeholder=t.placeholder),typeof t.maxLength=="number"&&t.maxLength>0&&(s.maxLength=t.maxLength),t.optional!==false&&t.optional&&s.setAttribute("aria-required","false"),typeof e.value=="string"&&(s.value=e.value),o.append(r,s);let i=null;if(typeof t.maxLength=="number"&&t.maxLength>0){i=document.createElement("div"),i.className="sf-text-counter",i.setAttribute("part","text-counter"),i.setAttribute("aria-live","polite"),i.setAttribute("aria-atomic","true");let b=()=>{let d=t.maxLength-s.value.length;i.textContent=`${d} characters left`;};b(),s.addEventListener("input",b),o.appendChild(i);}return s.addEventListener("input",()=>{e.onChange(s.value);}),{el:o,focus(){s.focus();},destroy(){o.remove();}}}function zn(e){return e.type==="link"}function Ot(e){let t=e.question;if(!zn(t))throw new Error("link: expected a link question");let n=document.createElement("div");n.className="sf-link";let o=document.createElement("a");o.className="sf-link-btn",o.setAttribute("part","link-button"),o.href=t.href,o.target="_blank",o.rel="noopener noreferrer",o.textContent=t.buttonLabel;let r=()=>{e.onChange(t.href),e.onCommit?.(t.href);};return o.addEventListener("click",()=>r()),n.appendChild(o),{el:n,focus(){o.focus();},destroy(){n.remove();}}}var Yn={number:qe,stars:Tt,emoji:Lt,thumbs:Ht,"emoji-dial":Dt};function Ue(e){switch(e.type){case "rating":return Yn[e.display]??qe;case "choice":return Qt;case "text":return It;case "link":return Ot;default:{let t=e;throw new Error(`No component for question type: ${JSON.stringify(t)}`)}}}function V(){return typeof window<"u"&&typeof document<"u"&&typeof customElements<"u"}var Ve="soft-survey",Ne=null;function Kn(){if(Ne)return Ne;class e extends HTMLElement{constructor(){super(),this.shadow=this.attachShadow({mode:"open"});}}return Ne=e,Ne}function We(){V()&&(customElements.get(Ve)||customElements.define(Ve,Kn()));}function Gn(e){let t=typeof Document<"u"?Document.prototype:void 0;if(typeof CSSStyleSheet=="function"&&"replaceSync"in CSSStyleSheet.prototype&&t!==void 0&&"adoptedStyleSheets"in e)try{let r=new CSSStyleSheet;r.replaceSync(Te),e.adoptedStyleSheets=[...e.adoptedStyleSheets,r];return}catch{}let o=document.createElement("style");o.textContent=Te,e.appendChild(o);}var Xn='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';function Pt(e){return Array.from(e.querySelectorAll(Xn)).filter(t=>t.offsetParent!==null||t.getClientRects().length>0)}function Jn(e,t){if(e.includes("banner"))return {origin:"center",intensity:.35};if(e.includes("inline"))return {origin:"center top",intensity:.6};if(e.includes("modal"))return {origin:"center",intensity:.85};switch(t){case "bottom-left":return {origin:"left bottom",intensity:1};case "bottom-center":return {origin:"center bottom",intensity:1};case "top":return {origin:"right top",intensity:1};case "center":return {origin:"center",intensity:.9};default:return {origin:"right bottom",intensity:1}}}function Ft(e){try{let t=getComputedStyle(e).borderTopLeftRadius,n=parseFloat(t);return Number.isFinite(n)?n:16}catch{return 16}}function _(e,t){We();let{runtime:n,bus:o,context:r}=e,s=n.survey,i=s.appearance,b=J(),d=Jn(t.variant,t.position),g=t.inlineContainer!=null,p=i?.theme,u=document.createElement(Ve),y=u.shadow;if(Gn(y),Mt(u,i,p),t.backdrop){let f=document.createElement("div");f.className="soft-backdrop",f.setAttribute("part","backdrop"),f.addEventListener("click",()=>Oe()),y.appendChild(f);}let a=document.createElement("div");a.className=`soft-card ${t.variant}`,a.setAttribute("part","card"),a.setAttribute("role","dialog"),a.setAttribute("aria-modal",t.modal?"true":"false"),a.setAttribute("tabindex","-1"),t.position&&a.setAttribute("data-position",t.position),a.style.transformOrigin=d.origin;let c=document.createElement("div");c.className="soft-head",c.setAttribute("part","head");let l=document.createElement("h2");l.className="soft-title",l.setAttribute("part","title"),l.id=`soft-title-${s.id}`,l.textContent=s.name,a.setAttribute("aria-labelledby",l.id);let m=document.createElement("button");m.type="button",m.className="soft-close",m.setAttribute("part","close"),m.setAttribute("aria-label","Close"),m.innerHTML='<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',m.addEventListener("click",()=>Oe()),c.appendChild(l),c.appendChild(m);let h=document.createElement("div");h.className="soft-progress",h.setAttribute("part","progress"),h.setAttribute("role","progressbar"),h.setAttribute("aria-valuemin","0"),h.setAttribute("aria-valuemax","100");let M=document.createElement("div");M.className="soft-progress-fill",h.appendChild(M);let D=document.createElement("div");D.className="soft-content",D.setAttribute("part","content");let w=document.createElement("div");w.className="soft-foot",w.setAttribute("part","foot");let k=document.createElement("div");if(k.className="soft-sr-only",k.setAttribute("aria-live","polite"),k.setAttribute("aria-atomic","true"),a.appendChild(c),a.appendChild(h),a.appendChild(D),a.appendChild(w),a.appendChild(k),i?.badge){let f=document.createElement("a");f.className="soft-badge",f.setAttribute("part","badge"),f.href="https://github.com/soft-feedback/soft-feedback",f.target="_blank",f.rel="noopener noreferrer",f.textContent="Made with soft-feedback",a.appendChild(f);}y.appendChild(a);let v={contentEl:D,footerEl:w,progressFill:M,progressBar:h,liveRegion:k,titleEl:l},T=null,Q=null,N=false,B=false,me=false,W=null,O=null,z=null,q=null,X=()=>new Date().toISOString();function ie(){o.emit({type:"shown",surveyId:s.id,at:X()});}function K(){let f=n.buildPayload();o.emit({type:"sent",surveyId:s.id,at:X(),payload:f});}function be(){Object.keys(n.state.responses).length>0?o.emit({type:"abandoned",surveyId:s.id,at:X(),partial:{surveyId:s.id,surveyName:s.name,responses:{...n.state.responses},startedAt:n.state.startedAt,context:{url:r.url,device:r.device,locale:r.locale}}}):o.emit({type:"dismissed",surveyId:s.id,at:X()});}function Z(){let f=Math.round(Math.max(0,Math.min(1,n.state.progress))*100);if(h.setAttribute("aria-valuenow",String(f)),h.style.display=n.state.index>0?"":"none",b)v.progressFill.style.transform=`scaleX(${f/100})`;else {let E=parseFloat(v.progressFill.dataset.pct??"0");U({from:E,to:f,preset:e.motion,reducedMotion:b,onUpdate:C=>{v.progressFill.style.transform=`scaleX(${C/100})`;}});}v.progressFill.dataset.pct=String(f);}function ee(f){return f.type==="text"||f.type==="link"||f.type==="choice"&&f.multiple?true:f.type==="rating"?f.display==="emoji-dial"||Ze(f):false}function x(f,E){if(v.footerEl.replaceChildren(),v.footerEl.style.display="",z=null,!ee(f))return;let C=f.type==="rating",H=n.state.responses[f.id]!==void 0;if(C&&E){let j=f.type==="rating"?f.inlineFollowUp:void 0,$=j?j.id:`${f.id}:comment`,S=document.createElement("textarea");S.className="sf-input sf-textarea soft-inline-comment",S.rows=2,S.setAttribute("part","inline-comment");let Y=n.state.responses[$];if(typeof Y=="string"&&(S.value=Y),S.addEventListener("input",()=>{n.answer($,S.value);}),j){let ne=document.createElement("label");ne.className="soft-inline-follow-label";let ge=`${$}-input`;S.id=ge,ne.htmlFor=ge,S.placeholder="Optional",z=()=>{let P=n.state.responses[f.id],rt=typeof P=="number"&&P<=j.threshold?j.lowPrompt:j.highPrompt;ne.textContent=rt,S.setAttribute("aria-label",rt);},z(),v.footerEl.appendChild(ne);}else S.placeholder="Anything to add? (optional)",S.setAttribute("aria-label","Optional comment");v.footerEl.appendChild(S);}let L=document.createElement("button");L.type="button",L.className="soft-btn soft-btn-primary",L.setAttribute("part","submit"),L.textContent=E?"Submit":"Continue",C&&(L.disabled=!H),L.addEventListener("click",()=>et()),v.footerEl.appendChild(L),C&&!H&&(v.footerEl.style.display="none");}function R(){v.footerEl.style.display="",z?.();let f=v.footerEl.querySelector("button.soft-btn");f&&(f.disabled=false);}function A(f,E){O?.();let C=Ue(f)({question:f,value:n.state.responses[f.id],motion:e.motion,onChange:P=>{n.answer(f.id,P),ee(f)&&R();},onCommit:P=>{n.answer(f.id,P),ee(f)?R():et();}}),H=C.el;H.classList.add("soft-q");let L=T;T=C;let j=Ze(f);if(x(f,j),Z(),v.titleEl.textContent=f.prompt,b||E===0||!L){L?.el.remove(),L?.destroy(),v.contentEl.replaceChildren(H),g&&E===0||G(C),te(f.prompt);return}let $=E===1?24:-24,S=L.el,Y=v.contentEl.offsetHeight;H.style.opacity="0",H.style.transform=`translateX(${$}px)`,v.contentEl.appendChild(H),S.style.position="absolute",S.style.top="0",S.style.left="0",S.style.width="100%";let ne=v.contentEl.offsetHeight;v.contentEl.style.height=`${Y}px`,v.contentEl.style.overflow="hidden";let ge=()=>{S.remove(),L.destroy(),H.style.transform="",H.style.opacity="",v.contentEl.style.height="",v.contentEl.style.overflow="";};O=U({from:0,to:1,preset:e.motion,reducedMotion:b,onUpdate:P=>{v.contentEl.style.height=`${Y+(ne-Y)*P}px`,S.style.opacity=String(1-P),S.style.transform=`translateX(${-$*P}px)`,H.style.opacity=String(P),H.style.transform=`translateX(${$*(1-P)}px)`;},onDone:()=>{ge(),G(C),te(f.prompt),O=null;}});}function G(f,E){try{f.focus();}catch{v.footerEl.querySelector("button")?.focus();}}function te(f){v.liveRegion.textContent="",window.setTimeout(()=>{v.liveRegion.textContent=f;},30);}function Ze(f){let E=s.questions,C=E[E.length-1];return !f.branching&&C!==void 0&&C.id===f.id}function et(){if(B)return;let f=n.next();if(f===null||n.isComplete()){tt();return}A(f,1);}function Xt(){let f=n.current();if(f===null||n.isComplete()){tt();return}A(f,0);}function tt(){N||B||(N=true,K(),Jt(s.closing));}function Jt(f){O?.(),T?.el.remove(),T?.destroy(),T=null,v.footerEl.replaceChildren(),v.progressBar.setAttribute("aria-valuenow","100"),v.progressFill.style.transform="scaleX(1)";let E=document.createElement("div");E.className="soft-thankyou",E.setAttribute("part","thankyou");let C=document.createElement("div");C.className="soft-thankyou-mark",C.setAttribute("aria-hidden","true"),C.innerHTML='<svg viewBox="0 0 24 24" width="40" height="40"><path class="soft-thankyou-check" d="M4 12.5l5 5L20 6.5" pathLength="1" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';let H=document.createElement("h2");if(H.className="soft-thankyou-title",H.textContent=f?.thankYou?.title??"Thank you!",E.appendChild(C),E.appendChild(H),f?.thankYou?.description){let S=document.createElement("p");S.className="soft-thankyou-desc",S.textContent=f.thankYou.description,E.appendChild(S);}if(f?.cta){let S=document.createElement("a");S.className="soft-btn soft-btn-primary",S.setAttribute("part","cta"),S.href=f.cta.href,S.target="_blank",S.rel="noopener noreferrer",S.textContent=f.cta.label,E.appendChild(S);}v.contentEl.replaceChildren(E),v.titleEl.textContent=f?.thankYou?.title??"Thank you!",te(f?.thankYou?.title??"Thank you!");let L=C.querySelector(".soft-thankyou-check");b||(C.style.willChange="transform, border-radius",U({from:0,to:1,preset:"bouncy",reducedMotion:b,onUpdate:S=>{let Y=Me(S,28,1);C.style.transform=Y.transform,C.style.borderRadius=Y.borderRadius;},onDone:()=>{C.style.transform="",C.style.borderRadius="",C.style.willChange="";}}),L&&(L.style.strokeDasharray="1",L.style.strokeDashoffset="1",U({from:1,to:0,preset:"smooth",reducedMotion:b,onUpdate:S=>{L.style.strokeDashoffset=String(S);},onDone:()=>{L.style.strokeDashoffset="0";}})));let j=E.querySelector("a.soft-btn");j?j.focus():(E.setAttribute("tabindex","-1"),E.focus());let $=f?.autoDismissMs;typeof $=="number"&&$>0&&(W=setTimeout(()=>he("sent"),$));}function Oe(f){B||he(N?"sent":"dismissed");}function he(f){if(B)return;B=true,W!==null&&(clearTimeout(W),W=null),O?.(),f!=="sent"&&!N&&be(),ot();let E=()=>{nt(),Zt();};if(b){E();return}let C=Ft(a);a.style.willChange="transform, border-radius, opacity",U({from:1,to:0,preset:"snappy",reducedMotion:b,onUpdate:H=>{let L=Me(H,C,d.intensity);a.style.opacity=String(L.opacity),a.style.transform=L.transform,a.style.borderRadius=L.borderRadius;},onDone:E});}function nt(){T?.destroy(),T=null,u.remove();}function Zt(){let f=Q;Q=null,f&&typeof f.focus=="function"&&document.contains(f)&&f.focus();}function en(){q=f=>{if(f.key==="Escape"&&(t.dismissibleOnEsc??true)){f.preventDefault(),f.stopPropagation(),Oe();return}f.key==="Tab"&&t.modal&&tn(f);},u.addEventListener("keydown",q,true);}function ot(){q&&(u.removeEventListener("keydown",q,true),q=null);}function tn(f){let E=Pt(a);if(E.length===0){f.preventDefault(),a.focus();return}let C=E[0],H=E[E.length-1],L=y.activeElement;f.shiftKey?(L===C||L===null||L===a)&&(f.preventDefault(),H.focus()):L===H&&(f.preventDefault(),C.focus());}function nn(){if(me||B)return;if(me=true,Q=document.activeElement instanceof HTMLElement?document.activeElement:null,(t.inlineContainer??document.body).appendChild(u),t.decorateHost?.(u),Xt(),en(),ie(),g||on(),!b){let E=Ft(a);a.style.opacity="0",a.style.willChange="transform, border-radius, opacity",U({from:0,to:1,preset:e.motion,reducedMotion:b,onUpdate:C=>{let H=Me(C,E,d.intensity);a.style.opacity=String(H.opacity),a.style.transform=H.transform,a.style.borderRadius=H.borderRadius;},onDone:()=>{a.style.transform="",a.style.borderRadius="",a.style.opacity="",a.style.willChange="";}});}}function on(){let f=y.activeElement;if(f&&f!==a)return;let E=Pt(a);E.length>0?E[0].focus():a.focus();}return {host:u,open:nn,close:he,destroy(){ot(),W!==null&&clearTimeout(W),O?.(),nt();}}}function re(e,t){let n=e.runtime.survey;return n.render?.position??n.appearance?.position??t}function I(){return {open(){},close(){},destroy(){}}}var _e={mount(e){if(!V())return I();let t=re(e,"bottom-right");return _(e,{modal:false,variant:"soft-popover",position:t,backdrop:false,dismissibleOnEsc:true,decorateHost:n=>{n.style.position="fixed",n.style.zIndex="var(--soft-z, 2147483000)",Zn(n,t),n.style.pointerEvents="none";}})}};function Zn(e,t){let n="16px";switch(e.style.top="",e.style.bottom="",e.style.left="",e.style.right="",t){case "bottom-left":e.style.bottom=n,e.style.left=n;break;case "bottom-center":e.style.bottom=n,e.style.left="50%",e.style.transform="translateX(-50%)";break;case "top":e.style.top=n,e.style.right=n;break;case "center":e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%)";break;default:e.style.bottom=n,e.style.right=n;break}}var Bt={mount(e){if(!V())return I();let t=e.runtime.survey.render?.selector;if(!t)return console.warn("[soft-feedback] inline renderer requires `render.selector`; nothing was mounted."),I();let n=null;try{n=document.querySelector(t);}catch{return console.warn(`[soft-feedback] inline renderer: invalid selector "${t}".`),I()}return n instanceof HTMLElement?_(e,{modal:false,variant:"soft-inline",backdrop:false,dismissibleOnEsc:true,inlineContainer:n,decorateHost:o=>{o.style.display="block",o.style.position="relative",o.style.width="100%";}}):(console.warn(`[soft-feedback] inline renderer: no element matched selector "${t}"; nothing was mounted.`),I())}};var qt={mount(e){if(!V())return I();We();let t=re(e,"bottom-right"),n=t.includes("left"),o=e.runtime.survey.appearance?.tokens?.["color-accent"]??"#4f46e5",r=null,s=null,i=false;function b(){let u=document.createElement("button");return u.type="button",u.className="soft-tab-button",u.setAttribute("aria-haspopup","dialog"),u.setAttribute("aria-expanded","false"),u.textContent="Feedback",u.style.cssText=["position:fixed","bottom:0",n?"left:24px":"right:24px","z-index:2147483000","margin:0","padding:10px 18px","font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif","color:#fff",`background:${o}`,"border:0","border-radius:12px 12px 0 0","box-shadow:0 -6px 24px -8px rgb(16 18 35 / .35)","cursor:pointer","transform-origin:center bottom","will-change:transform,border-radius","transition:transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s ease, border-radius .22s cubic-bezier(.22,1,.36,1)"].join(";"),u.addEventListener("mouseenter",()=>{u.style.transform="translateY(-3px) scale(1.04)",u.style.borderRadius="16px 16px 6px 6px",u.style.boxShadow="0 -12px 30px -8px rgb(16 18 35 / .42)";}),u.addEventListener("mouseleave",()=>{u.style.transform="translateY(0) scale(1)",u.style.borderRadius="12px 12px 0 0",u.style.boxShadow="0 -6px 24px -8px rgb(16 18 35 / .35)";}),u.addEventListener("pointerdown",()=>{u.style.transform="translateY(0) scale(.96)";}),u.addEventListener("pointerup",()=>{u.style.transform="translateY(-3px) scale(1.04)";}),u.addEventListener("click",()=>g()),u}function d(u){J()||U({from:0,to:1,preset:"bouncy",onUpdate:y=>{u.style.transform=`translateY(${(1-y)*120}%)`;},onDone:()=>{u.style.transform="translateY(0) scale(1)";}});}function g(){if(s){s.close("dismissed");return}p();}function p(){if(s||i)return;let u=_(e,{modal:false,variant:"soft-tab-panel",position:t,backdrop:false,dismissibleOnEsc:true,decorateHost:c=>{c.style.position="fixed",c.style.zIndex="2147483000",c.style.bottom="64px",n?c.style.left="24px":c.style.right="24px",c.style.pointerEvents="none";}});s=u,r?.setAttribute("aria-expanded","true");let y=u.close;u.close=c=>{y(c);};let a=new MutationObserver(()=>{document.contains(u.host)||(s=null,r?.setAttribute("aria-expanded","false"),a.disconnect());});a.observe(document.body,{childList:true,subtree:true}),u.open();}return {open(){i||r||(r=b(),document.body.appendChild(r),d(r));},close(u){s?.close(u==="auto"?"dismissed":u),s=null,r?.remove(),r=null;},destroy(){i=true,s?.destroy(),s=null,r?.remove(),r=null;}}}};var jt={mount(e){return V()?_(e,{modal:true,variant:"soft-modal",position:"center",backdrop:true,dismissibleOnEsc:true,decorateHost:t=>{t.style.position="fixed",t.style.inset="0",t.style.zIndex="var(--sf-z, 2147483000)",t.style.display="flex",t.style.alignItems="center",t.style.justifyContent="center",t.style.padding="20px";}}):I()}};var $t={mount(e){if(!V())return I();let n=re(e,"bottom-center")==="top";return _(e,{modal:false,variant:n?"soft-banner soft-banner-top":"soft-banner soft-banner-bottom",position:n?"top":"bottom-center",backdrop:false,dismissibleOnEsc:true,decorateHost:o=>{o.style.position="fixed",o.style.left="0",o.style.right="0",o.style.zIndex="var(--soft-z, 2147483000)",n?o.style.top="0":o.style.bottom="0";}})}};var De={mount(e){let{runtime:t,bus:n,context:o}=e,r=t.survey,s=()=>new Date().toISOString(),i=false,b=false,d=false;function g(){Object.keys(t.state.responses).length>0?n.emit({type:"abandoned",surveyId:r.id,at:s(),partial:{surveyId:r.id,surveyName:r.name,responses:{...t.state.responses},startedAt:t.state.startedAt,context:{url:o.url,device:o.device,locale:o.locale}}}):n.emit({type:"dismissed",surveyId:r.id,at:s()});}return {runtime:t,bus:n,open(){i||d||(i=true,n.emit({type:"shown",surveyId:r.id,at:s()}));},close(u){if(!d){if(d=true,u==="sent"){b||(b=true,n.emit({type:"sent",surveyId:r.id,at:s(),payload:t.buildPayload()}));return}b||g();}},destroy(){d=true;}}}};var eo={popover:_e,inline:Bt,tab:qt,modal:jt,banner:$t,headless:De};function ze(e){return eo[e]??_e}function to(){return typeof navigator<"u"&&typeof navigator.sendBeacon=="function"}function Ut(e,t={}){let{headers:n,transform:o,events:r}=t;return s=>{if(r&&!r.includes(s.type))return;let i=JSON.stringify(o?o(s):s);if(!n&&to())try{let b=new Blob([i],{type:"application/json"});if(navigator.sendBeacon(e,b))return}catch{}typeof fetch=="function"&&fetch(e,{method:"POST",headers:{"content-type":"application/json",...n},body:i,keepalive:true}).catch(()=>{});}}function Vt(e,t){return n=>{typeof fetch=="function"&&fetch(e,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(n),keepalive:true,...t}).catch(()=>{});}}function Wt(e="[soft-feedback]"){return t=>{try{console.log(e,t.type,t);}catch{}}}var _t=null,se=null,Ye=null,zt=false,Yt=null,Ke="subtle",de="auto";function no(e){try{if(typeof window<"u"&&window.location)return window.location.href}catch{}return e}function Ge(){let e=Yt??{url:"",device:"desktop",properties:{}};return {...e,url:no(e.url),properties:{...e.properties}}}function Kt(e){let t=e?.theme??(typeof de=="string"?de:"auto"),o={...typeof de=="object"?de.tokens:void 0,...e?.tokens};return {...e,theme:t,...Object.keys(o).length?{tokens:o}:{}}}function oo(e){if(!se)return;let t=Ge(),n={...e,appearance:Kt(e.appearance)},o=ce(n,t),r=ze(n.render?.pattern??"popover"),s=n.render?.motion??Ke;r.mount({runtime:o,bus:se,context:t,motion:s}).open();}function Gt(e={}){Ye=e.storage??Be();let t=e.anonymous??true;Ke=e.motion??"subtle",de=e.theme??"auto",se=ye();let n=e.sinks??[];se.on("*",o=>{for(let r of n)try{let s=r(o);s&&typeof s.then=="function"&&s.catch(()=>{});}catch{}if(e.onEvent)try{e.onEvent(o);}catch{}}),Yt=ve({storage:Ye,anonymous:t,...e.locale!==void 0?{locale:e.locale}:{},...e.properties!==void 0?{properties:e.properties}:{}}),_t=Fe({storage:Ye,bus:se,getContext:Ge,present:oo,...e.defaults?{defaults:e.defaults}:{}}),zt=true;}function Xe(){zt||Gt();}function ue(){return Xe(),_t}function Je(){return Xe(),se}function Qe(e,t){return `sf:${e}:${oe(t).toString(36).slice(2,8)}`}function ro(){return {thankYou:{title:"Thanks for the feedback!",description:"We really appreciate it."},autoDismissMs:3500}}function so(e,t){return {pattern:e.render?.pattern??t,...e.render?.position!==void 0?{position:e.render.position}:{},...e.render?.selector!==void 0?{selector:e.render.selector}:{},...e.render?.motion!==void 0?{motion:e.render.motion}:{}}}function Ie(e,t,n,o,r,s){return {id:e,name:t,metric:n,questions:o,trigger:r.trigger??{type:"manual"},...r.conditions?{conditions:r.conditions}:{},...r.frequency?{frequency:r.frequency}:{},render:so(r,s),...r.appearance?{appearance:r.appearance}:{},closing:r.closing??ro()}}function io(e,t,n,o,r){if(t.followUp===false)return {extra:[]};if(typeof t.followUp=="string")return {extra:[{id:`${e}:why`,type:"text",prompt:t.followUp,optional:true,placeholder:"Optional"}]};let s={id:`${e}:low`,type:"text",prompt:n,optional:true,placeholder:"Optional",branching:[{when:{op:"any"},goto:{type:"end"}}]},i={id:`${e}:high`,type:"text",prompt:o,optional:true,placeholder:"Optional"},b=[{when:{op:"lte",value:r},goto:{type:"question",id:s.id}},{when:{op:"gte",value:r+1},goto:{type:"question",id:i.id}}];return {extra:[s,i],ratingBranching:b}}function fe(e,t){let n=[],o=Je();if(t.onSubmit){let r=t.onSubmit;n.push(o.on("sent",s=>{s.surveyId===e.id&&s.type==="sent"&&r(s.payload);}));}if(t.onEvent){let r=t.onEvent;n.push(o.on("*",s=>{s.surveyId===e.id&&r(s);}));}return ue().register(e),{id:e.id,survey:e,show:(r=false)=>ue().request(e.id,{force:r}),destroy:()=>{ue().unregister(e.id);for(let r of n)r();}}}function pe(e,t,n,o){let r=o.question??n.question,s=o.id??Qe(e,r),i=o.scale??n.scale,b=Math.floor((i.min+i.max)/2),d=n.followUpDefault!==void 0&&o.followUp===void 0?{...o,followUp:n.followUpDefault}:o,g=o.followUpInline!==false,p=[],u,y;if(g)y=d.followUp===false?void 0:{id:`${s}:why`,lowPrompt:typeof d.followUp=="string"?d.followUp:n.low,highPrompt:typeof d.followUp=="string"?d.followUp:n.high,threshold:b};else {let l=io(s,d,n.low,n.high,b);p=l.extra,u=l.ratingBranching;}let a={id:`${s}:rating`,type:"rating",prompt:r,display:o.display??n.display,scale:i,labels:o.labels??n.labels,...u?{branching:u}:{},...y?{inlineFollowUp:y}:{}},c=Ie(s,t,e,[a,...p],o,n.pattern);return fe(c,o)}function ao(e={}){return pe("csat","CSAT",{question:"How would you rate your experience?",display:"emoji-dial",scale:{min:1,max:5},labels:{min:"Very dissatisfied",max:"Very satisfied"},low:"What could we improve?",high:"What did you love most?",pattern:"popover"},e)}function co(e={}){return pe("nps","NPS",{question:"How likely are you to recommend us to a friend or colleague?",display:"number",scale:{min:0,max:10},labels:{min:"Not at all likely",max:"Extremely likely"},low:"What's the main reason for your score?",high:"What do you love most about us?",pattern:"popover"},e)}function lo(e={}){return pe("ces","CES",{question:"How easy was it to complete your task?",display:"number",scale:{min:1,max:7},labels:{min:"Very difficult",max:"Very easy"},low:"What made it difficult?",high:"What made it easy?",pattern:"popover"},e)}function uo(e={}){return pe("csat","Helpful",{question:"Was this helpful?",display:"thumbs",scale:{min:0,max:1},labels:{min:"No",max:"Yes"},low:"What was missing or wrong?",high:"Glad it helped! Anything to add?",pattern:"inline"},e)}function fo(e={}){return pe("csat","Reaction",{question:"How do you feel about this?",display:"emoji",scale:{min:1,max:5},labels:{min:"Hated it",max:"Loved it"},low:"What would make it better?",high:"What did you love?",pattern:"popover",followUpDefault:false},e)}function po(e={}){let t=e.question??"How would you feel if you could no longer use this product?",n=e.id??Qe("pmf",t),o=e.options??[{id:"very",label:"Very disappointed"},{id:"somewhat",label:"Somewhat disappointed"},{id:"not",label:"Not disappointed"},{id:"na",label:"N/A, I no longer use it"}],r={id:`${n}:pmf`,type:"choice",prompt:t,options:o},s=e.followUp===false?[]:[{id:`${n}:why`,type:"text",prompt:typeof e.followUp=="string"?e.followUp:"What is the main benefit you receive from this product?",optional:true,placeholder:"Optional"}],i=Ie(n,"PMF","pmf",[r,...s],e,"popover");return fe(i,e)}function mo(e={}){let t=e.question??"What's the main reason you're leaving?",n=e.id??Qe("churn",t),o=e.options??[{id:"too-expensive",label:"Too expensive"},{id:"missing-features",label:"Missing features I need"},{id:"too-hard",label:"Too difficult to use"},{id:"found-better",label:"Found a better product"},{id:"no-longer-needed",label:"No longer needed"}],r={id:`${n}:reason`,type:"choice",prompt:t,options:o,allowOther:e.allowOther??true},s=e.followUp===false?[]:[{id:`${n}:comment`,type:"text",prompt:typeof e.followUp=="string"?e.followUp:"Anything we could have done better?",optional:true,placeholder:"Optional"}],i=Ie(n,"Churn","custom",[r,...s],e,"popover");return fe(i,e)}function bo(e={}){let t=e.question??"What kind of feedback do you have?",n=e.id??Qe("tab",t),o=e.options??[{id:"bug",label:"\u{1F41E} Something is broken"},{id:"idea",label:"\u{1F4A1} I have an idea"},{id:"praise",label:"\u2764\uFE0F I love something"},{id:"other",label:"\u{1F4AC} Other"}],r={id:`${n}:category`,type:"choice",prompt:t,options:o},s={id:`${n}:message`,type:"text",prompt:"Tell us more",placeholder:"Your feedback\u2026"},i=Ie(n,"Feedback Tab","custom",[r,s],e,"tab"),b=fe(i,e);return b.show(true),b}function ho(e,t){return fe(e,{...t})}function go(e,t){ue().track(e,t);}function yo(e){ue().setProperties(e);}function vo(e){Xe();let t=Ge(),n={...e,appearance:Kt(e.appearance)},o=ce(n,t),r=Je(),s=De.mount({runtime:o,bus:r,context:t,motion:Ke});return s.open(),{runtime:o,bus:r,close:(i="dismissed")=>s.close(i)}}function xo(e){return Je().on("*",e)}var wo={init:Gt,csat:ao,nps:co,ces:lo,helpful:uo,reaction:fo,pmf:po,churn:mo,tab:bo,survey:ho,headless:vo,track:go,setProperties:yo,on:xo},os=wo;
exports.THEME_PRESETS=Ct;exports.buildContext=ve;exports.ces=lo;exports.churn=mo;exports.consoleSink=Wt;exports.createBus=ye;exports.createMemoryStorageAdapter=Re;exports.createRuntime=ce;exports.csat=ao;exports.default=os;exports.defaultStorage=Be;exports.getRenderer=ze;exports.hash01=oe;exports.headless=vo;exports.helpful=uo;exports.http=Vt;exports.init=Gt;exports.nps=co;exports.on=xo;exports.pmf=po;exports.reaction=fo;exports.scoreCes=yt;exports.scoreCsat=gt;exports.scoreDsat=vt;exports.scoreForMetric=Se;exports.scoreNps=ht;exports.scorePmf=xt;exports.setProperties=yo;exports.soft=wo;exports.survey=ho;exports.tab=bo;exports.track=go;exports.webhook=Ut;Object.defineProperty(exports,'__esModule',{value:true});return exports;})({});//# sourceMappingURL=index.global.js.map
//# sourceMappingURL=index.global.js.map