const t=window,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),o=new WeakMap;let s=class{constructor(t,e,o){if(this._$cssResult$=!0,o!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=o.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o.set(i,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new s(o,t,i)},r=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,i))(e)})(t):t;var n;const l=window,d=l.trustedTypes,c=d?d.emptyScript:"",h=l.reactiveElementPolyfillSupport,u={toAttribute(t,e){switch(e){case Boolean:t=t?c:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},p=(t,e)=>e!==t&&(e==e||t==t),m={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:p},g="finalized";let _=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const o=this._$Ep(i,e);void 0!==o&&(this._$Ev.set(o,i),t.push(o))}),t}static createProperty(t,e=m){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,o=this.getPropertyDescriptor(t,i,e);void 0!==o&&Object.defineProperty(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(o){const s=this[t];this[e]=o,this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||m}static finalize(){if(this.hasOwnProperty(g))return!1;this[g]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var i;const o=null!==(i=this.shadowRoot)&&void 0!==i?i:this.attachShadow(this.constructor.shadowRootOptions);return((i,o)=>{e?i.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):o.forEach(e=>{const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=e.cssText,i.appendChild(o)})})(o,this.constructor.elementStyles),o}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=m){var o;const s=this.constructor._$Ep(t,i);if(void 0!==s&&!0===i.reflect){const a=(void 0!==(null===(o=i.converter)||void 0===o?void 0:o.toAttribute)?i.converter:u).toAttribute(e,i.type);this._$El=t,null==a?this.removeAttribute(s):this.setAttribute(s,a),this._$El=null}}_$AK(t,e){var i;const o=this.constructor,s=o._$Ev.get(t);if(void 0!==s&&this._$El!==s){const t=o.getPropertyOptions(s),a="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:u;this._$El=s,this[s]=a.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let o=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||p)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):o=!1),!this.isUpdatePending&&o&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};var b;_[g]=!0,_.elementProperties=new Map,_.elementStyles=[],_.shadowRootOptions={mode:"open"},null==h||h({ReactiveElement:_}),(null!==(n=l.reactiveElementVersions)&&void 0!==n?n:l.reactiveElementVersions=[]).push("1.6.3");const f=window,v=f.trustedTypes,y=v?v.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",$=`lit$${(Math.random()+"").slice(9)}$`,w="?"+$,A=`<${w}>`,S=document,k=()=>S.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,C=Array.isArray,T="[ \t\n\f\r]",E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,P=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,N=/"/g,F=/^(?:script|style|textarea|title)$/i,M=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),O=Symbol.for("lit-noChange"),I=Symbol.for("lit-nothing"),H=new WeakMap,L=S.createTreeWalker(S,129,null,!1);function j(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==y?y.createHTML(e):e}const B=(t,e)=>{const i=t.length-1,o=[];let s,a=2===e?"<svg>":"",r=E;for(let e=0;e<i;e++){const i=t[e];let n,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===E?"!--"===l[1]?r=D:void 0!==l[1]?r=R:void 0!==l[2]?(F.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=P):void 0!==l[3]&&(r=P):r===P?">"===l[0]?(r=null!=s?s:E,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?P:'"'===l[3]?N:U):r===N||r===U?r=P:r===D||r===R?r=E:(r=P,s=void 0);const h=r===P&&t[e+1].startsWith("/>")?" ":"";a+=r===E?i+A:d>=0?(o.push(n),i.slice(0,d)+x+i.slice(d)+$+h):i+$+(-2===d?(o.push(void 0),e):h)}return[j(t,a+(t[i]||"<?>")+(2===e?"</svg>":"")),o]};class G{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let s=0,a=0;const r=t.length-1,n=this.parts,[l,d]=B(t,e);if(this.el=G.createElement(l,i),L.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(o=L.nextNode())&&n.length<r;){if(1===o.nodeType){if(o.hasAttributes()){const t=[];for(const e of o.getAttributeNames())if(e.endsWith(x)||e.startsWith($)){const i=d[a++];if(t.push(e),void 0!==i){const t=o.getAttribute(i.toLowerCase()+x).split($),e=/([.?@])?(.*)/.exec(i);n.push({type:1,index:s,name:e[2],strings:t,ctor:"."===e[1]?Y:"?"===e[1]?J:"@"===e[1]?Z:q})}else n.push({type:6,index:s})}for(const e of t)o.removeAttribute(e)}if(F.test(o.tagName)){const t=o.textContent.split($),e=t.length-1;if(e>0){o.textContent=v?v.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],k()),L.nextNode(),n.push({type:2,index:++s});o.append(t[e],k())}}}else if(8===o.nodeType)if(o.data===w)n.push({type:2,index:s});else{let t=-1;for(;-1!==(t=o.data.indexOf($,t+1));)n.push({type:7,index:s}),t+=$.length-1}s++}}static createElement(t,e){const i=S.createElement("template");return i.innerHTML=t,i}}function W(t,e,i=t,o){var s,a,r,n;if(e===O)return e;let l=void 0!==o?null===(s=i._$Co)||void 0===s?void 0:s[o]:i._$Cl;const d=z(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==d&&(null===(a=null==l?void 0:l._$AO)||void 0===a||a.call(l,!1),void 0===d?l=void 0:(l=new d(t),l._$AT(t,i,o)),void 0!==o?(null!==(r=(n=i)._$Co)&&void 0!==r?r:n._$Co=[])[o]=l:i._$Cl=l),void 0!==l&&(e=W(t,l._$AS(t,e.values),l,o)),e}class V{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:o}=this._$AD,s=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:S).importNode(i,!0);L.currentNode=s;let a=L.nextNode(),r=0,n=0,l=o[0];for(;void 0!==l;){if(r===l.index){let e;2===l.type?e=new K(a,a.nextSibling,this,t):1===l.type?e=new l.ctor(a,l.name,l.strings,this,t):6===l.type&&(e=new Q(a,this,t)),this._$AV.push(e),l=o[++n]}r!==(null==l?void 0:l.index)&&(a=L.nextNode(),r++)}return L.currentNode=S,s}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class K{constructor(t,e,i,o){var s;this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cp=null===(s=null==o?void 0:o.isConnected)||void 0===s||s}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=W(this,t,e),z(t)?t===I||null==t||""===t?(this._$AH!==I&&this._$AR(),this._$AH=I):t!==this._$AH&&t!==O&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):(t=>C(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]))(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==I&&z(this._$AH)?this._$AA.nextSibling.data=t:this.$(S.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:o}=t,s="number"==typeof o?this._$AC(t):(void 0===o.el&&(o.el=G.createElement(j(o.h,o.h[0]),this.options)),o);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===s)this._$AH.v(i);else{const t=new V(s,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=H.get(t.strings);return void 0===e&&H.set(t.strings,e=new G(t)),e}T(t){C(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const s of t)o===e.length?e.push(i=new K(this.k(k()),this.k(k()),this,this.options)):i=e[o],i._$AI(s),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class q{constructor(t,e,i,o,s){this.type=1,this._$AH=I,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=I}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,o){const s=this.strings;let a=!1;if(void 0===s)t=W(this,t,e,0),a=!z(t)||t!==this._$AH&&t!==O,a&&(this._$AH=t);else{const o=t;let r,n;for(t=s[0],r=0;r<s.length-1;r++)n=W(this,o[i+r],e,r),n===O&&(n=this._$AH[r]),a||(a=!z(n)||n!==this._$AH[r]),n===I?t=I:t!==I&&(t+=(null!=n?n:"")+s[r+1]),this._$AH[r]=n}a&&!o&&this.j(t)}j(t){t===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class Y extends q{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===I?void 0:t}}const X=v?v.emptyScript:"";class J extends q{constructor(){super(...arguments),this.type=4}j(t){t&&t!==I?this.element.setAttribute(this.name,X):this.element.removeAttribute(this.name)}}class Z extends q{constructor(t,e,i,o,s){super(t,e,i,o,s),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=W(this,t,e,0))&&void 0!==i?i:I)===O)return;const o=this._$AH,s=t===I&&o!==I||t.capture!==o.capture||t.once!==o.once||t.passive!==o.passive,a=t!==I&&(o===I||s);s&&this.element.removeEventListener(this.name,this,o),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class Q{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){W(this,t)}}const tt=f.litHtmlPolyfillSupport;null==tt||tt(G,K),(null!==(b=f.litHtmlVersions)&&void 0!==b?b:f.litHtmlVersions=[]).push("2.8.0");var et,it;class ot extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var o,s;const a=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:e;let r=a._$litPart$;if(void 0===r){const t=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:null;a._$litPart$=r=new K(e.insertBefore(k(),t),t,void 0,null!=i?i:{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return O}}ot.finalized=!0,ot._$litElement$=!0,null===(et=globalThis.litElementHydrateSupport)||void 0===et||et.call(globalThis,{LitElement:ot});const st=globalThis.litElementPolyfillSupport;null==st||st({LitElement:ot}),(null!==(it=globalThis.litElementVersions)&&void 0!==it?it:globalThis.litElementVersions=[]).push("3.3.3");const at=1e3,rt=6e4,nt=36e5,lt=864e5,dt=60,ct=1440,ht=300,ut=300,pt=3e3,mt=5e3,gt=1e3,_t=5e3,bt=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],ft={not_automation:"Failed to snooze: One or more selected items are not automations",invalid_duration:"Failed to snooze: Please specify a valid duration (days, hours, or minutes)",resume_time_past:"Failed to snooze: Resume time must be in the future",disable_after_resume:"Failed to snooze: Snooze time must be before resume time"};class vt extends ot{static properties={hass:{type:Object},_config:{state:!0}};static styles=a`
    .row {
      margin-bottom: 12px;
    }
    .row label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }
    input[type="text"] {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
    }
    .help {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
  `;constructor(){super(),this.hass={},this._config={}}setConfig(t){this._config=t}_valueChanged(t,e){if(!this._config)return;const i={...this._config,[t]:e};""!==e&&null!=e||delete i[t],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this._config?M`
      <div class="row">
        <label for="title-input">Title</label>
        <input
          id="title-input"
          type="text"
          .value=${this._config.title||""}
          @input=${t=>this._valueChanged("title",t.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:M``}}class yt extends ot{static properties={hass:{type:Object},config:{type:Object},_selected:{state:!0},_duration:{state:!0},_customDuration:{state:!0},_customDurationInput:{state:!0},_loading:{state:!0},_search:{state:!0},_filterTab:{state:!0},_expandedGroups:{state:!0},_scheduleMode:{state:!0},_disableAtDate:{state:!0},_disableAtTime:{state:!0},_resumeAtDate:{state:!0},_resumeAtTime:{state:!0},_labelRegistry:{state:!0},_categoryRegistry:{state:!0},_entityRegistry:{state:!0},_showCustomInput:{state:!0},_automationsCache:{state:!0},_automationsCacheKey:{state:!0},_wakeAllPending:{state:!0}};shouldUpdate(t){if(!t.has("hass"))return!0;const e=t.get("hass"),i=this.hass;if(!e||!i)return!0;const o=e.states?.["sensor.autosnooze_snoozed_automations"],s=i.states?.["sensor.autosnooze_snoozed_automations"];if(o!==s)return!0;if(e.entities!==i.entities)return!0;if(e.areas!==i.areas)return!0;const a=i.states||{},r=e.states||{};for(const t of Object.keys(a))if(t.startsWith("automation.")&&r[t]!==a[t])return!0;for(const t of Object.keys(r))if(t.startsWith("automation.")&&!a[t])return!0;return!1}updated(t){super.updated(t),t.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}constructor(){super(),this.hass={},this.config={},this._selected=[],this._duration=30*rt,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._interval=null,this._syncTimeout=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._automationsCache=null,this._automationsCacheKey=null,this._lastHassStates=null,this._searchTimeout=null,this._wakeAllPending=!1,this._wakeAllTimeout=null,this._toastTimeout=null,this._toastFadeTimeout=null}connectedCallback(){super.connectedCallback(),this._interval&&(window.clearInterval(this._interval),this._interval=null),this._syncTimeout&&(window.clearTimeout(this._syncTimeout),this._syncTimeout=null),this._startSynchronizedCountdown(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry()}_startSynchronizedCountdown(){const t=1e3-Date.now()%1e3;this._syncTimeout=window.setTimeout(()=>{this._syncTimeout=null,this._updateCountdownIfNeeded(),this._interval=window.setInterval(()=>{this._updateCountdownIfNeeded()},gt)},t)}_updateCountdownIfNeeded(){const t=this.shadowRoot?.querySelectorAll(".countdown[data-resume-at]");t&&t.length>0&&t.forEach(t=>{const e=t.dataset.resumeAt;e&&(t.textContent=this._formatCountdown(e))})}async _fetchRegistry(t){const{fetchedFlag:e,messageType:i,messageParams:o,idKey:s,targetProp:a,filterFn:r,logName:n}=t;if(!this[e]&&this.hass?.connection)try{const t={type:i,...o},n=await this.hass.connection.sendMessagePromise(t),l={};if(Array.isArray(n)){(r?n.filter(r):n).forEach(t=>{l[t[s]]=t})}this[a]=l,this[e]=!0}catch(t){console.warn(`[AutoSnooze] Failed to fetch ${n}:`,t)}}async _fetchLabelRegistry(){await this._fetchRegistry({fetchedFlag:"_labelsFetched",messageType:"config/label_registry/list",messageParams:{},idKey:"label_id",targetProp:"_labelRegistry",filterFn:null,logName:"label registry"})}async _fetchCategoryRegistry(){await this._fetchRegistry({fetchedFlag:"_categoriesFetched",messageType:"config/category_registry/list",messageParams:{scope:"automation"},idKey:"category_id",targetProp:"_categoryRegistry",filterFn:null,logName:"category registry"})}async _fetchEntityRegistry(){await this._fetchRegistry({fetchedFlag:"_entityRegistryFetched",messageType:"config/entity_registry/list",messageParams:{},idKey:"entity_id",targetProp:"_entityRegistry",filterFn:t=>t.entity_id.startsWith("automation."),logName:"entity registry"})}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null),null!==this._syncTimeout&&(clearTimeout(this._syncTimeout),this._syncTimeout=null),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),null!==this._toastTimeout&&(clearTimeout(this._toastTimeout),this._toastTimeout=null),null!==this._toastFadeTimeout&&(clearTimeout(this._toastFadeTimeout),this._toastFadeTimeout=null)}_handleSearchInput(t){const e=t.target.value;clearTimeout(this._searchTimeout),this._searchTimeout=setTimeout(()=>{this._search=e},ht)}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{title:"AutoSnooze"}}static styles=a`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 1.2em;
      font-weight: 500;
    }
    .header ha-icon {
      color: var(--primary-color);
    }
    .status-summary {
      margin-left: auto;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }
    .tab {
      padding: 6px 16px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 0.9em;
      background: transparent;
      border: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      box-sizing: border-box;
    }
    .tab:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      opacity: 0.8;
    }
    .tab:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .tab.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .tab-count {
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.8em;
    }
    .tab.active .tab-count {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Search */
    .search-box {
      margin-bottom: 12px;
    }
    .search-box input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.95em;
      min-height: 44px;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Selection List */
    .selection-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .list-empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      transition: background 0.2s;
      min-height: 48px;
      width: 100%;
      background: transparent;
      text-align: left;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
      box-sizing: border-box;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item:hover {
      background: var(--secondary-background-color);
    }
    .list-item:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item ha-icon {
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .list-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
      flex-shrink: 0;
    }
    .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .list-item-content {
      flex: 1;
      min-width: 0;
    }
    .list-item-name {
      font-size: 0.95em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta ha-icon {
      --mdc-icon-size: 12px;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* Group Headers */
    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9em;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
      box-sizing: border-box;
      min-height: 44px;
    }
    .group-header:hover {
      background: var(--divider-color);
    }
    .group-header:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .group-header ha-icon {
      transition: transform 0.2s;
    }
    .group-header.expanded ha-icon {
      transform: rotate(90deg);
    }
    .group-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 12px;
      font-size: 0.8em;
    }

    /* Selection Actions */
    .selection-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      align-items: center;
      font-size: 0.9em;
    }
    .selection-actions span {
      flex: 1;
      color: var(--secondary-text-color);
    }
    .select-all-btn {
      padding: 4px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .select-all-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .select-all-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Duration Section */
    .duration-section-header {
      font-size: 0.9em;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--secondary-text-color);
    }

    /* Duration Pills */
    .duration-selector {
      margin-bottom: 12px;
    }
    .duration-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .pill {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
      color: var(--primary-text-color);
    }
    .pill:hover {
      border-color: var(--primary-color);
    }
    .pill:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .pill.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    /* Duration Input */
    .custom-duration-input {
      margin-top: 8px;
    }
    .duration-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      box-sizing: border-box;
      min-height: 44px;
    }
    .duration-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .duration-input.invalid {
      border-color: #f44336;
    }
    .duration-help {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
    .duration-preview {
      font-size: 0.85em;
      color: var(--primary-color);
      font-weight: 500;
      margin-top: 4px;
    }

    /* Snooze Button */
    .snooze-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
      min-height: 48px;
    }
    .snooze-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .snooze-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Section B: Active Snoozes */
    .snooze-list {
      border: 2px solid #ff9800;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.05);
      padding: 12px;
      margin-top: 20px;
    }
    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      font-size: 1em;
    }
    .list-header ha-icon {
      color: #ff9800;
    }

    /* Pause Group */
    .pause-group {
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .pause-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      color: #ff9800;
      font-size: 0.85em;
      border-bottom: 1px solid var(--divider-color);
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
    }
    .pause-group-header .countdown {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    /* Paused Item */
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
    }
    .paused-item + .paused-item {
      border-top: 1px solid var(--divider-color);
    }
    .paused-icon {
      color: var(--secondary-text-color);
      opacity: 0.6;
    }
    .paused-info {
      flex: 1;
    }
    .paused-name {
      font-weight: 500;
    }
    .paused-time {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .countdown {
      font-size: 0.9em;
      color: #ff9800;
      font-weight: 500;
      white-space: nowrap;
    }
    .wake-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .wake-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .wake-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Wake All Button */
    .wake-all {
      width: 100%;
      padding: 10px;
      border: 1px solid #ff9800;
      border-radius: 6px;
      background: transparent;
      color: #ff9800;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 44px;
    }
    .wake-all:hover {
      background: #ff9800;
      color: white;
    }
    .wake-all:focus-visible {
      outline: 2px solid #ff9800;
      outline-offset: 2px;
    }

    /* Wake All Button - Pending State */
    .wake-all.pending {
      background: #ff9800;
      color: white;
    }

    /* Empty State */
    .empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }

    /* Schedule Link (Progressive Disclosure) */
    .schedule-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 4px;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.9em;
      background: none;
      border: none;
      font-family: inherit;
      min-height: 44px;
      box-sizing: border-box;
    }
    .schedule-link:hover {
      text-decoration: underline;
    }
    .schedule-link:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .schedule-link ha-icon {
      --mdc-icon-size: 18px;
    }

    /* Field Hint */
    .field-hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }

    /* Schedule Datetime Inputs */
    .schedule-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .datetime-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .datetime-field label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .datetime-row {
      display: flex;
      gap: 8px;
    }
    .datetime-row select,
    .datetime-row input[type="time"] {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      min-height: 44px;
      box-sizing: border-box;
    }
    .datetime-row select {
      flex: 1;
      min-width: 0;
    }
    .datetime-row input[type="time"] {
      width: 110px;
      flex-shrink: 0;
    }
    .datetime-row select:focus,
    .datetime-row input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid #2196f3;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.05);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon {
      color: #2196f3;
    }
    .scheduled-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .scheduled-item:last-of-type {
      margin-bottom: 12px;
    }
    .scheduled-icon {
      color: #2196f3;
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      color: #2196f3;
      font-weight: 500;
    }
    .cancel-scheduled-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .cancel-scheduled-btn:hover {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }
    .cancel-scheduled-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toast-undo-btn {
      padding: 4px 12px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      background: transparent;
      color: var(--text-primary-color);
      cursor: pointer;
      font-size: 0.85em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 44px;
      box-sizing: border-box;
    }
    .toast-undo-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.8);
    }
    .toast-undo-btn:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    /* Mobile Responsive Styles */
    @media (max-width: 480px) {
      ha-card {
        padding: 10px;
      }

      .header {
        font-size: 1.1em;
        margin-bottom: 12px;
      }

      .status-summary {
        font-size: 0.8em;
      }

      /* Compact tabs to fit in single row */
      .filter-tabs {
        gap: 4px;
        margin-bottom: 8px;
        padding-bottom: 6px;
      }

      .tab {
        padding: 5px 8px;
        font-size: 0.8em;
        border-radius: 12px;
        min-height: 44px;
      }

      .tab-count {
        padding: 1px 5px;
        font-size: 0.75em;
      }

      /* Compact search */
      .search-box {
        margin-bottom: 8px;
      }

      .search-box input {
        padding: 8px 10px;
        font-size: 0.9em;
        min-height: 44px;
      }

      /* Compact selection actions */
      .selection-actions {
        padding: 6px 10px;
        margin-bottom: 6px;
        font-size: 0.85em;
        gap: 6px;
      }

      .select-all-btn {
        padding: 3px 8px;
        font-size: 0.8em;
        min-height: 44px;
      }

      /* Reduced selection list height */
      .selection-list {
        max-height: 180px;
        margin-bottom: 10px;
      }

      .list-item {
        padding: 10px;
        gap: 8px;
        min-height: 44px;
      }

      .list-item-name {
        font-size: 0.9em;
      }

      .group-header {
        padding: 8px 10px;
        font-size: 0.85em;
        min-height: 44px;
      }

      /* Compact duration selector */
      .snooze-setup {
        margin-bottom: 12px;
      }

      .duration-section-header {
        font-size: 0.85em;
        margin-bottom: 6px;
      }

      .duration-pills {
        gap: 6px;
        margin-bottom: 6px;
      }

      .pill {
        padding: 6px 10px;
        font-size: 0.85em;
        border-radius: 16px;
        min-height: 44px;
      }

      .duration-input {
        padding: 8px 10px;
        font-size: 0.9em;
        min-height: 44px;
      }

      .schedule-link {
        margin-top: 8px;
        padding: 6px 0;
        font-size: 0.85em;
        min-height: 44px;
      }

      /* Compact schedule inputs */
      .schedule-inputs {
        padding: 10px;
        gap: 10px;
        margin-bottom: 10px;
      }

      .datetime-row {
        flex-wrap: wrap;
      }

      .datetime-row select {
        flex: 1 1 100%;
        min-width: 0;
        min-height: 44px;
      }

      .datetime-row input[type="time"] {
        flex: 1;
        width: auto;
        min-width: 100px;
        min-height: 44px;
      }

      .field-hint {
        font-size: 0.75em;
      }

      /* Compact snooze button */
      .snooze-btn {
        padding: 12px;
        font-size: 0.95em;
        min-height: 48px;
      }

      /* Compact active snoozes section */
      .snooze-list {
        padding: 10px;
        margin-top: 12px;
      }

      .list-header {
        font-size: 0.95em;
        margin-bottom: 10px;
        gap: 6px;
      }

      .pause-group {
        margin-bottom: 6px;
      }

      .pause-group-header {
        padding: 6px 10px;
        font-size: 0.8em;
      }

      /* Stack paused items vertically on mobile */
      .paused-item {
        flex-wrap: wrap;
        padding: 8px 10px;
        gap: 6px;
      }

      .paused-icon {
        display: none;
      }

      .paused-info {
        flex: 1 1 100%;
        min-width: 0;
      }

      .paused-name {
        font-size: 0.9em;
      }

      .wake-btn {
        margin-left: auto;
        padding: 5px 10px;
        font-size: 0.8em;
        min-height: 44px;
      }

      .wake-all {
        padding: 8px;
        font-size: 0.85em;
        min-height: 44px;
      }

      /* Compact scheduled section */
      .scheduled-list {
        padding: 10px;
        margin-top: 10px;
      }

      .scheduled-item {
        flex-wrap: wrap;
        padding: 10px;
        gap: 6px;
        margin-bottom: 6px;
      }

      .scheduled-icon {
        display: none;
      }

      .scheduled-time,
      .paused-time {
        font-size: 0.8em;
      }

      .cancel-scheduled-btn {
        margin-left: auto;
        padding: 5px 10px;
        font-size: 0.8em;
        min-height: 44px;
      }

      /* Adjust toast for mobile */
      .toast {
        bottom: 10px;
        padding: 10px 16px;
        font-size: 0.9em;
        max-width: calc(100vw - 20px);
      }

      .toast-undo-btn {
        min-height: 44px;
      }
    }
  `;_getAutomations(){const t=this.hass?.states,e=this.hass?.entities;if(!t)return[];const i=t,o=this._entityRegistryFetched;if(this._lastHassStates===i&&this._automationsCacheKey===o&&this._automationsCache)return this._automationsCache;const s=Object.keys(t).filter(t=>t.startsWith("automation.")).map(i=>{const o=t[i];if(!o)return null;const s=this._entityRegistry?.[i],a=e?.[i],r=(s?.categories||{}).automation||null;return{id:i,name:o.attributes?.friendly_name||i.replace("automation.",""),area_id:s?.area_id||a?.area_id||null,category_id:r,labels:s?.labels||a?.labels||[]}}).filter(t=>null!==t).sort((t,e)=>t.name.localeCompare(e.name));return this._automationsCache=s,this._automationsCacheKey=o,this._lastHassStates=i,s}_getFilteredAutomations(){const t=this._getAutomations(),e=this._search.toLowerCase();let i=t;return e&&(i=t.filter(t=>t.name.toLowerCase().includes(e)||t.id.toLowerCase().includes(e))),i}_formatRegistryId(t){return t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getAreaName(t){return t?this.hass.areas?.[t]?.name||this._formatRegistryId(t):"Unassigned"}_getLabelName(t){return this._labelRegistry[t]?.name||this._formatRegistryId(t)}_groupAutomationsBy(t,e){const i=this._getFilteredAutomations(),o={};return i.forEach(i=>{const s=t(i);s&&0!==s.length?s.forEach(t=>{o[t]||(o[t]=[]),o[t].push(i)}):(o[e]||(o[e]=[]),o[e].push(i))}),Object.entries(o).sort((t,i)=>t[0]===e?1:i[0]===e?-1:t[0].localeCompare(i[0]))}_getGroupedByArea(){return this._groupAutomationsBy(t=>t.area_id?[this._getAreaName(t.area_id)]:null,"Unassigned")}_getGroupedByLabel(){return this._groupAutomationsBy(t=>t.labels?.length>0?t.labels.map(t=>this._getLabelName(t)):null,"Unlabeled")}_getUniqueCount(t){const e=this._getAutomations(),i=new Set;return e.forEach(e=>{const o=t(e);o&&o.forEach(t=>i.add(t))}),i.size}_getAreaCount(){return this._getUniqueCount(t=>t.area_id?[t.area_id]:null)}_getLabelCount(){return this._getUniqueCount(t=>t.labels?.length>0?t.labels:null)}_getCategoryName(t){return t?this._categoryRegistry[t]?.name||this._formatRegistryId(t):"Uncategorized"}_getGroupedByCategory(){return this._groupAutomationsBy(t=>t.category_id?[this._getCategoryName(t.category_id)]:null,"Uncategorized")}_getCategoryCount(){return this._getUniqueCount(t=>t.category_id?[t.category_id]:null)}_selectAllVisible(){const t=this._getFilteredAutomations().map(t=>t.id),e=t.every(t=>this._selected.includes(t));this._selected=e?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_clearSelection(){this._selected=[]}_getPaused(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.paused_automations||{}}_getPausedGroupedByResumeTime(){const t=this._getPaused(),e={};return Object.entries(t).forEach(([t,i])=>{const o=i.resume_at;e[o]||(e[o]={resumeAt:o,disableAt:i.disable_at,automations:[]}),e[o].automations.push({id:t,...i})}),Object.values(e).sort((t,e)=>new Date(t.resumeAt).getTime()-new Date(e.resumeAt).getTime())}_getScheduled(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.scheduled_snoozes||{}}_formatDateTime(t){const e=new Date(t),i=new Date,o={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return e.getFullYear()>i.getFullYear()&&(o.year="numeric"),e.toLocaleString(void 0,o)}_formatCountdown(t){const e=new Date(t).getTime()-Date.now();if(e<=0)return"Resuming...";const i=Math.floor(e/lt),o=Math.floor(e%lt/nt),s=Math.floor(e%nt/rt),a=Math.floor(e%rt/at);return i>0?`${i}d ${o}h ${s}m`:o>0?`${o}h ${s}m ${a}s`:`${s}m ${a}s`}_toggleSelection(t){this._selected.includes(t)?this._selected=this._selected.filter(e=>e!==t):this._selected=[...this._selected,t]}_toggleGroupExpansion(t){this._expandedGroups={...this._expandedGroups,[t]:!this._expandedGroups[t]}}_selectGroup(t){const e=t.map(t=>t.id),i=e.every(t=>this._selected.includes(t));this._selected=i?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_setDuration(t){this._duration=t*rt;const e=Math.floor(t/ct),i=Math.floor(t%ct/dt),o=t%dt;this._customDuration={days:e,hours:i,minutes:o};const s=[];e>0&&s.push(`${e}d`),i>0&&s.push(`${i}h`),o>0&&s.push(`${o}m`),this._customDurationInput=s.join(" ")||"30m"}_updateCustomDuration(){const{days:t,hours:e,minutes:i}=this._customDuration,o=t*ct+e*dt+i;this._duration=o*rt}_parseDurationInput(t){const e=t.toLowerCase().replace(/\s+/g,"");if(!e)return null;let i=0,o=!1;const s=e.match(/(\d+(?:\.\d+)?)\s*d/),a=e.match(/(\d+(?:\.\d+)?)\s*h/),r=e.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(s){const t=parseFloat(s[1]);if(isNaN(t)||t<0)return null;i+=t*ct,o=!0}if(a){const t=parseFloat(a[1]);if(isNaN(t)||t<0)return null;i+=t*dt,o=!0}if(r){const t=parseFloat(r[1]);if(isNaN(t)||t<0)return null;i+=t,o=!0}if(!o){const t=parseFloat(e);if(isNaN(t)||!(t>0))return null;i=t}if(i=Math.round(i),i<=0)return null;const n=Math.floor(i/ct),l=i%ct;return{days:n,hours:Math.floor(l/dt),minutes:l%dt}}_handleDurationInput(t){this._customDurationInput=t;const e=this._parseDurationInput(t);e&&(this._customDuration=e,this._updateCustomDuration())}_getDurationPreview(){const t=this._parseDurationInput(this._customDurationInput);return t?this._formatDuration(t.days,t.hours,t.minutes):""}_isDurationValid(){return null!==this._parseDurationInput(this._customDurationInput)}_getErrorMessage(t,e){const i=t?.translation_key||t?.data?.translation_key;if(i&&ft[i])return ft[i];const o=t?.message||"";for(const[t,e]of Object.entries(ft))if(o.includes(t)||o.toLowerCase().includes(t.replace(/_/g," ")))return e;return`${e}. Check Home Assistant logs for details.`}_showToast(t,e={}){const{showUndo:i=!1,onUndo:o=null}=e;if(!this.shadowRoot)return;const s=this.shadowRoot.querySelector(".toast");s&&s.remove();const a=document.createElement("div");if(a.className="toast",a.setAttribute("role","alert"),a.setAttribute("aria-live","polite"),a.setAttribute("aria-atomic","true"),i&&o){const e=document.createElement("span");e.textContent=t,a.appendChild(e);const i=document.createElement("button");i.className="toast-undo-btn",i.textContent="Undo",i.setAttribute("aria-label","Undo last action"),i.addEventListener("click",t=>{t.stopPropagation(),o(),a.remove()}),a.appendChild(i)}else a.textContent=t;this.shadowRoot.appendChild(a),null!==this._toastTimeout&&clearTimeout(this._toastTimeout),null!==this._toastFadeTimeout&&clearTimeout(this._toastFadeTimeout),this._toastTimeout=setTimeout(()=>{this._toastTimeout=null,this.shadowRoot&&a.parentNode&&(a.style.animation=`slideUp ${ut}ms ease-out reverse`,this._toastFadeTimeout=setTimeout(()=>{this._toastFadeTimeout=null,a.parentNode&&a.remove()},ut))},mt)}_combineDateTime(t,e){if(!t||!e)return null;const i=new Date(`${t}T${e}`).getTimezoneOffset(),o=i<=0?"+":"-",s=Math.abs(i);return`${t}T${e}${`${o}${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}`}_getLocale(){return this.hass?.locale?.language||void 0}_renderDateOptions(){const t=[],e=new Date,i=e.getFullYear(),o=this._getLocale();for(let s=0;s<365;s++){const a=new Date(e);a.setDate(a.getDate()+s);const r=a.getFullYear(),n=`${r}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,l=a.toLocaleDateString(o,{weekday:"short"}),d=a.toLocaleDateString(o,{month:"short"}),c=a.getDate(),h=r!==i?`${l}, ${d} ${c}, ${r}`:`${l}, ${d} ${c}`;t.push({value:n,label:h})}return t.map(t=>M`<option value="${t.value}">${t.label}</option>`)}_hasResumeAt(){return this._resumeAtDate&&this._resumeAtTime}_hasDisableAt(){return this._disableAtDate&&this._disableAtTime}_handleKeyDown(t,e){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),e())}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast("Please set a complete resume date and time (month, day, and time are all required)");const t=this._hasDisableAt()?this._combineDateTime(this._disableAtDate,this._disableAtTime):null,e=this._combineDateTime(this._resumeAtDate,this._resumeAtTime),i=Date.now()+_t,o=new Date(e).getTime();if(o<=i)return void this._showToast("Resume time must be in the future. Please select a date and time that hasn't passed yet.");if(t){if(new Date(t).getTime()>=o)return void this._showToast("Snooze time must be before resume time. The automation needs to be snoozed before it can resume.")}}else if(0===this._duration)return;this._loading=!0;try{const t=this._selected.length,e=[...this._selected],i=this._scheduleMode,o=this._hasDisableAt();let s;if(this._scheduleMode){const e=this._hasDisableAt()?this._combineDateTime(this._disableAtDate,this._disableAtTime):null,i=this._combineDateTime(this._resumeAtDate,this._resumeAtTime),o={entity_id:this._selected,resume_at:i};if(e&&(o.disable_at=e),await this.hass.callService("autosnooze","pause",o),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);s=e?`Scheduled ${t} automation${1!==t?"s":""} to snooze`:`Snoozed ${t} automation${1!==t?"s":""} until ${this._formatDateTime(i)}`}else{const{days:e,hours:i,minutes:o}=this._customDuration;if(await this.hass.callService("autosnooze","pause",{entity_id:this._selected,days:e,hours:i,minutes:o}),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);const a=this._formatDuration(e,i,o);s=`Snoozed ${t} automation${1!==t?"s":""} for ${a}`}this._showToast(s,{showUndo:!0,onUndo:async()=>{try{for(const t of e)i&&o?await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:t}):await this.hass.callService("autosnooze","cancel",{entity_id:t});this.isConnected&&(this._selected=e,this._showToast(`Restored ${t} automation${1!==t?"s":""}`))}catch(t){console.error("Undo failed:",t),this.isConnected&&this.shadowRoot&&this._showToast("Failed to undo. The automations may have already been modified.")}}}),this._selected=[],this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime=""}catch(t){console.error("Snooze failed:",t),this.isConnected&&this.shadowRoot&&this._showToast(this._getErrorMessage(t,"Failed to snooze automations"))}this._loading=!1}}_formatDuration(t,e,i){const o=[];return t>0&&o.push(`${t} day${1!==t?"s":""}`),e>0&&o.push(`${e} hour${1!==e?"s":""}`),i>0&&o.push(`${i} minute${1!==i?"s":""}`),o.join(", ")}async _wake(t){try{await this.hass.callService("autosnooze","cancel",{entity_id:t}),this.isConnected&&this.shadowRoot&&this._showToast("Automation resumed successfully")}catch(t){console.error("Wake failed:",t),this.isConnected&&this.shadowRoot&&this._showToast(this._getErrorMessage(t,"Failed to resume automation"))}}_handleWakeAll=async()=>{if(this._wakeAllPending){clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null,this._wakeAllPending=!1;try{await this.hass.callService("autosnooze","cancel_all",{}),this.isConnected&&this.shadowRoot&&this._showToast("All automations resumed successfully")}catch(t){console.error("Wake all failed:",t),this.isConnected&&this.shadowRoot&&this._showToast("Failed to resume automations. Check Home Assistant logs for details.")}}else this._wakeAllPending=!0,this._wakeAllTimeout=setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},pt)};async _cancelScheduled(t){try{await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:t}),this.isConnected&&this.shadowRoot&&this._showToast("Scheduled snooze cancelled successfully")}catch(t){console.error("Cancel scheduled failed:",t),this.isConnected&&this.shadowRoot&&this._showToast(this._getErrorMessage(t,"Failed to cancel scheduled snooze"))}}_renderSelectionList(){const t=this._getFilteredAutomations();if("all"===this._filterTab)return 0===t.length?M`<div class="list-empty" role="status">No automations found</div>`:t.map(t=>M`
        <button
          type="button"
          class="list-item ${this._selected.includes(t.id)?"selected":""}"
          @click=${()=>this._toggleSelection(t.id)}
          role="option"
          aria-selected=${this._selected.includes(t.id)}
        >
          <input
            type="checkbox"
            .checked=${this._selected.includes(t.id)}
            @click=${t=>t.stopPropagation()}
            @change=${()=>this._toggleSelection(t.id)}
            aria-label="Select ${t.name}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${t.name}</div>
          </div>
        </button>
      `);const e="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===e.length?M`<div class="list-empty" role="status">No automations found</div>`:e.map(([t,e])=>{const i=!1!==this._expandedGroups[t],o=e.every(t=>this._selected.includes(t.id)),s=e.some(t=>this._selected.includes(t.id))&&!o;return M`
        <button
          type="button"
          class="group-header ${i?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(t)}
          aria-expanded=${i}
          aria-label="${t} group, ${e.length} automations"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${t}</span>
          <span class="group-badge" aria-label="${e.length} automations">${e.length}</span>
          <input
            type="checkbox"
            .checked=${o}
            .indeterminate=${s}
            @click=${t=>t.stopPropagation()}
            @change=${()=>this._selectGroup(e)}
            aria-label="Select all automations in ${t}"
            tabindex="-1"
          />
        </button>
        ${i?e.map(t=>{const e="labels"===this._filterTab&&t.area_id?this._getAreaName(t.area_id):null;return M`
                <button
                  type="button"
                  class="list-item ${this._selected.includes(t.id)?"selected":""}"
                  @click=${()=>this._toggleSelection(t.id)}
                  role="option"
                  aria-selected=${this._selected.includes(t.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this._selected.includes(t.id)}
                    @click=${t=>t.stopPropagation()}
                    @change=${()=>this._toggleSelection(t.id)}
                    aria-label="Select ${t.name}"
                    tabindex="-1"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${t.name}</div>
                    ${e?M`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline" aria-hidden="true"></ha-icon>${e}
                        </div>`:""}
                  </div>
                </button>
              `}):""}
      `})}_renderDurationSelector(t,e,i){return this._scheduleMode?M`
          <!-- Schedule Date/Time Inputs -->
          <div class="schedule-inputs">
            <div class="datetime-field">
              <label id="snooze-at-label">Snooze at:</label>
              <div class="datetime-row">
                <select
                  .value=${this._disableAtDate}
                  @change=${t=>this._disableAtDate=t.target.value}
                  aria-labelledby="snooze-at-label"
                  aria-label="Snooze date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._disableAtTime}
                  @input=${t=>this._disableAtTime=t.target.value}
                  aria-labelledby="snooze-at-label"
                  aria-label="Snooze time"
                />
              </div>
              <span class="field-hint">Leave empty to snooze immediately</span>
            </div>
            <div class="datetime-field">
              <label id="resume-at-label">Resume at:</label>
              <div class="datetime-row">
                <select
                  .value=${this._resumeAtDate}
                  @change=${t=>this._resumeAtDate=t.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._resumeAtTime}
                  @input=${t=>this._resumeAtTime=t.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume time"
                />
              </div>
            </div>
            <button
              type="button"
              class="schedule-link"
              @click=${()=>this._scheduleMode=!1}
            >
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              Back to duration selection
            </button>
          </div>
        `:M`
          <!-- Duration Selector -->
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">Snooze Duration</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${bt.map(e=>{const i=null===e.minutes?this._showCustomInput:!this._showCustomInput&&t===e;return M`
                    <button
                      type="button"
                      class="pill ${i?"active":""}"
                      @click=${()=>{null===e.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(e.minutes))}}
                      role="radio"
                      aria-checked=${i}
                      aria-label="${null===e.minutes?"Custom duration":`Snooze for ${e.label}`}"
                    >
                      ${e.label}
                    </button>
                  `})}
            </div>

            ${this._showCustomInput?M`
              <div class="custom-duration-input">
                <input
                  type="text"
                  class="duration-input ${i?"":"invalid"}"
                  placeholder="e.g. 2h30m, 1.5h, 1d, 45m"
                  .value=${this._customDurationInput}
                  @input=${t=>this._handleDurationInput(t.target.value)}
                  aria-label="Custom duration"
                  aria-invalid=${!i}
                  aria-describedby="duration-help"
                />
                ${e&&i?M`<div class="duration-preview" role="status" aria-live="polite">Duration: ${e}</div>`:M`<div class="duration-help" id="duration-help">Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h</div>`}
              </div>
            `:""}

            <button
              type="button"
              class="schedule-link"
              @click=${()=>this._scheduleMode=!0}
            >
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              Pick specific date/time instead
            </button>
          </div>
        `}_renderActivePauses(t){return 0===t?"":M`
      <div class="snooze-list" role="region" aria-label="Snoozed automations">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          Snoozed Automations (${t})
        </div>

        ${this._getPausedGroupedByResumeTime().map(t=>M`
            <div class="pause-group" role="group" aria-label="Automations resuming ${this._formatDateTime(t.resumeAt)}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${t.disableAt?M`Resumes ${this._formatDateTime(t.resumeAt)}`:M`<span class="countdown" data-resume-at="${t.resumeAt}" aria-label="Time remaining: ${this._formatCountdown(t.resumeAt)}">${this._formatCountdown(t.resumeAt)}</span>`}
              </div>
              ${t.automations.map(t=>M`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${t.friendly_name||t.id}</div>
                    </div>
                    <button type="button" class="wake-btn" @click=${()=>this._wake(t.id)} aria-label="Resume ${t.friendly_name||t.id}">
                      Resume
                    </button>
                  </div>
                `)}
            </div>
          `)}

        ${t>1?M`
              <button
                type="button"
                class="wake-all ${this._wakeAllPending?"pending":""}"
                @click=${this._handleWakeAll}
                aria-label="${this._wakeAllPending?"Confirm resume all automations":"Resume all paused automations"}"
              >
                ${this._wakeAllPending?"Confirm Resume All":"Resume All"}
              </button>
            `:""}
      </div>
    `}_renderScheduledPauses(t,e){return 0===t?"":M`
      <div class="scheduled-list" role="region" aria-label="Scheduled snoozes">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          Scheduled Snoozes (${t})
        </div>

        ${Object.entries(e).map(([t,e])=>M`
            <div class="scheduled-item" role="article" aria-label="Scheduled pause for ${e.friendly_name||t}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${e.friendly_name||t}
                </div>
                <div class="scheduled-time">
                  Disables: ${this._formatDateTime(e.disable_at||"now")}
                </div>
                <div class="paused-time">
                  Resumes: ${this._formatDateTime(e.resume_at)}
                </div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${()=>this._cancelScheduled(t)} aria-label="Cancel scheduled pause for ${e.friendly_name||t}">
                Cancel
              </button>
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return M``;const t=this._getPaused(),e=Object.keys(t).length,i=this._getScheduled(),o=Object.keys(i).length,s=this._customDuration.days*ct+this._customDuration.hours*dt+this._customDuration.minutes,a=bt.find(t=>t.minutes===s),r=this._getDurationPreview(),n=this._isDurationValid();return M`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${e>0||o>0?M`<span class="status-summary"
                >${e>0?`${e} active`:""}${e>0&&o>0?", ":""}${o>0?`${o} scheduled`:""}</span
              >`:""}
        </div>

        <!-- Section A: Snooze Setup -->
        <div class="snooze-setup">
          <!-- Filter Tabs -->
          <div class="filter-tabs" role="tablist" aria-label="Filter automations by">
            <button
              type="button"
              class="tab ${"all"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="all"}
              role="tab"
              aria-selected=${"all"===this._filterTab}
              aria-controls="selection-list"
            >
              All
              <span class="tab-count" aria-label="${this._getAutomations().length} automations">${this._getAutomations().length}</span>
            </button>
            <button
              type="button"
              class="tab ${"areas"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="areas"}
              role="tab"
              aria-selected=${"areas"===this._filterTab}
              aria-controls="selection-list"
            >
              Areas
              <span class="tab-count" aria-label="${this._getAreaCount()} areas">${this._getAreaCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${"categories"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="categories"}
              role="tab"
              aria-selected=${"categories"===this._filterTab}
              aria-controls="selection-list"
            >
              Categories
              <span class="tab-count" aria-label="${this._getCategoryCount()} categories">${this._getCategoryCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${"labels"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="labels"}
              role="tab"
              aria-selected=${"labels"===this._filterTab}
              aria-controls="selection-list"
            >
              Labels
              <span class="tab-count" aria-label="${this._getLabelCount()} labels">${this._getLabelCount()}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="search-box">
            <input
              type="search"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${t=>this._handleSearchInput(t)}
              aria-label="Search automations by name"
            />
          </div>

          <!-- Selection Actions -->
          ${this._getFilteredAutomations().length>0?M`
                <div class="selection-actions" role="toolbar" aria-label="Selection actions">
                  <span role="status" aria-live="polite">${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click=${()=>this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every(t=>this._selected.includes(t.id))?"Deselect all visible automations":"Select all visible automations"}"
                  >
                    ${this._getFilteredAutomations().every(t=>this._selected.includes(t.id))?"Deselect All":"Select All"}
                  </button>
                  ${this._selected.length>0?M`<button type="button" class="select-all-btn" @click=${()=>this._clearSelection()} aria-label="Clear selection">Clear</button>`:""}
                </div>
              `:""}

          <!-- Selection List -->
          <div class="selection-list" id="selection-list" role="listbox" aria-label="Automations list" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(a,r,n)}

          <!-- Snooze Button -->
          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${this._snooze}
            aria-label="${this._loading?"Snoozing automations":this._scheduleMode?`Schedule snooze for ${this._selected.length} automation${1!==this._selected.length?"s":""}`:`Snooze ${this._selected.length} automation${1!==this._selected.length?"s":""}`}"
            aria-busy=${this._loading}
          >
            ${this._loading?"Snoozing...":this._scheduleMode?"Schedule"+(this._selected.length>0?` (${this._selected.length})`:""):"Snooze"+(this._selected.length>0?` (${this._selected.length})`:"")}
          </button>
        </div>

        ${this._renderActivePauses(e)}
        ${this._renderScheduledPauses(o,i)}
      </ha-card>
    `}getCardSize(){const t=this._getPaused(),e=this._getScheduled();return 4+Object.keys(t).length+Object.keys(e).length}setConfig(t){this.config=t}}customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",vt),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",yt),window.customCards=window.customCards||[],window.customCards.some(t=>"autosnooze-card"===t.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:"Temporarily pause automations with area and label filtering (v0.2.5)",preview:!0});
