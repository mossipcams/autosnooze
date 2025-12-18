const t=window,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let i=class{constructor(t,e,o){if(this._$cssResult$=!0,o!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const s=this.t;if(e&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o.set(s,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new i(o,t,s)},r=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new i("string"==typeof t?t:t+"",void 0,s))(e)})(t):t;var a;const l=window,c=l.trustedTypes,d=c?c.emptyScript:"",h=l.reactiveElementPolyfillSupport,u={toAttribute(t,e){switch(e){case Boolean:t=t?d:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},p=(t,e)=>e!==t&&(e==e||t==t),g={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:p},m="finalized";let _=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,s)=>{const o=this._$Ep(s,e);void 0!==o&&(this._$Ev.set(o,s),t.push(o))}),t}static createProperty(t,e=g){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,o=this.getPropertyDescriptor(t,s,e);void 0!==o&&Object.defineProperty(this.prototype,t,o)}}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(o){const i=this[t];this[e]=o,this.requestUpdate(t,i,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||g}static finalize(){if(this.hasOwnProperty(m))return!1;this[m]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of e)this.createProperty(s,t[s])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Ep(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,s;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var s;const o=null!==(s=this.shadowRoot)&&void 0!==s?s:this.attachShadow(this.constructor.shadowRootOptions);return((s,o)=>{e?s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):o.forEach(e=>{const o=document.createElement("style"),i=t.litNonce;void 0!==i&&o.setAttribute("nonce",i),o.textContent=e.cssText,s.appendChild(o)})})(o,this.constructor.elementStyles),o}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e,s=g){var o;const i=this.constructor._$Ep(t,s);if(void 0!==i&&!0===s.reflect){const n=(void 0!==(null===(o=s.converter)||void 0===o?void 0:o.toAttribute)?s.converter:u).toAttribute(e,s.type);this._$El=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$El=null}}_$AK(t,e){var s;const o=this.constructor,i=o._$Ev.get(t);if(void 0!==i&&this._$El!==i){const t=o.getPropertyOptions(i),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(s=t.converter)||void 0===s?void 0:s.fromAttribute)?t.converter:u;this._$El=i,this[i]=n.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,s){let o=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||p)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===s.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,s))):o=!1),!this.isUpdatePending&&o&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(s)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};var v;_[m]=!0,_.elementProperties=new Map,_.elementStyles=[],_.shadowRootOptions={mode:"open"},null==h||h({ReactiveElement:_}),(null!==(a=l.reactiveElementVersions)&&void 0!==a?a:l.reactiveElementVersions=[]).push("1.6.3");const b=window,y=b.trustedTypes,f=y?y.createPolicy("lit-html",{createHTML:t=>t}):void 0,$="$lit$",x=`lit$${(Math.random()+"").slice(9)}$`,A="?"+x,S=`<${A}>`,w=document,k=()=>w.createComment(""),z=t=>null===t||"object"!=typeof t&&"function"!=typeof t,C=Array.isArray,E="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,D=/>/g,I=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),R=/'/g,O=/"/g,U=/^(?:script|style|textarea|title)$/i,P=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),j=Symbol.for("lit-noChange"),N=Symbol.for("lit-nothing"),L=new WeakMap,H=w.createTreeWalker(w,129,null,!1);function F(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==f?f.createHTML(e):e}const B=(t,e)=>{const s=t.length-1,o=[];let i,n=2===e?"<svg>":"",r=M;for(let e=0;e<s;e++){const s=t[e];let a,l,c=-1,d=0;for(;d<s.length&&(r.lastIndex=d,l=r.exec(s),null!==l);)d=r.lastIndex,r===M?"!--"===l[1]?r=T:void 0!==l[1]?r=D:void 0!==l[2]?(U.test(l[2])&&(i=RegExp("</"+l[2],"g")),r=I):void 0!==l[3]&&(r=I):r===I?">"===l[0]?(r=null!=i?i:M,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?I:'"'===l[3]?O:R):r===O||r===R?r=I:r===T||r===D?r=M:(r=I,i=void 0);const h=r===I&&t[e+1].startsWith("/>")?" ":"";n+=r===M?s+S:c>=0?(o.push(a),s.slice(0,c)+$+s.slice(c)+x+h):s+x+(-2===c?(o.push(void 0),e):h)}return[F(t,n+(t[s]||"<?>")+(2===e?"</svg>":"")),o]};class G{constructor({strings:t,_$litType$:e},s){let o;this.parts=[];let i=0,n=0;const r=t.length-1,a=this.parts,[l,c]=B(t,e);if(this.el=G.createElement(l,s),H.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(o=H.nextNode())&&a.length<r;){if(1===o.nodeType){if(o.hasAttributes()){const t=[];for(const e of o.getAttributeNames())if(e.endsWith($)||e.startsWith(x)){const s=c[n++];if(t.push(e),void 0!==s){const t=o.getAttribute(s.toLowerCase()+$).split(x),e=/([.?@])?(.*)/.exec(s);a.push({type:1,index:i,name:e[2],strings:t,ctor:"."===e[1]?J:"?"===e[1]?Y:"@"===e[1]?Z:X})}else a.push({type:6,index:i})}for(const e of t)o.removeAttribute(e)}if(U.test(o.tagName)){const t=o.textContent.split(x),e=t.length-1;if(e>0){o.textContent=y?y.emptyScript:"";for(let s=0;s<e;s++)o.append(t[s],k()),H.nextNode(),a.push({type:2,index:++i});o.append(t[e],k())}}}else if(8===o.nodeType)if(o.data===A)a.push({type:2,index:i});else{let t=-1;for(;-1!==(t=o.data.indexOf(x,t+1));)a.push({type:7,index:i}),t+=x.length-1}i++}}static createElement(t,e){const s=w.createElement("template");return s.innerHTML=t,s}}function W(t,e,s=t,o){var i,n,r,a;if(e===j)return e;let l=void 0!==o?null===(i=s._$Co)||void 0===i?void 0:i[o]:s._$Cl;const c=z(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(n=null==l?void 0:l._$AO)||void 0===n||n.call(l,!1),void 0===c?l=void 0:(l=new c(t),l._$AT(t,s,o)),void 0!==o?(null!==(r=(a=s)._$Co)&&void 0!==r?r:a._$Co=[])[o]=l:s._$Cl=l),void 0!==l&&(e=W(t,l._$AS(t,e.values),l,o)),e}class V{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:s},parts:o}=this._$AD,i=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:w).importNode(s,!0);H.currentNode=i;let n=H.nextNode(),r=0,a=0,l=o[0];for(;void 0!==l;){if(r===l.index){let e;2===l.type?e=new q(n,n.nextSibling,this,t):1===l.type?e=new l.ctor(n,l.name,l.strings,this,t):6===l.type&&(e=new Q(n,this,t)),this._$AV.push(e),l=o[++a]}r!==(null==l?void 0:l.index)&&(n=H.nextNode(),r++)}return H.currentNode=w,i}v(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class q{constructor(t,e,s,o){var i;this.type=2,this._$AH=N,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=o,this._$Cp=null===(i=null==o?void 0:o.isConnected)||void 0===i||i}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=W(this,t,e),z(t)?t===N||null==t||""===t?(this._$AH!==N&&this._$AR(),this._$AH=N):t!==this._$AH&&t!==j&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):(t=>C(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]))(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==N&&z(this._$AH)?this._$AA.nextSibling.data=t:this.$(w.createTextNode(t)),this._$AH=t}g(t){var e;const{values:s,_$litType$:o}=t,i="number"==typeof o?this._$AC(t):(void 0===o.el&&(o.el=G.createElement(F(o.h,o.h[0]),this.options)),o);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===i)this._$AH.v(s);else{const t=new V(i,this),e=t.u(this.options);t.v(s),this.$(e),this._$AH=t}}_$AC(t){let e=L.get(t.strings);return void 0===e&&L.set(t.strings,e=new G(t)),e}T(t){C(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,o=0;for(const i of t)o===e.length?e.push(s=new q(this.k(k()),this.k(k()),this,this.options)):s=e[o],s._$AI(i),o++;o<e.length&&(this._$AR(s&&s._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class X{constructor(t,e,s,o,i){this.type=1,this._$AH=N,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=i,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=N}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,s,o){const i=this.strings;let n=!1;if(void 0===i)t=W(this,t,e,0),n=!z(t)||t!==this._$AH&&t!==j,n&&(this._$AH=t);else{const o=t;let r,a;for(t=i[0],r=0;r<i.length-1;r++)a=W(this,o[s+r],e,r),a===j&&(a=this._$AH[r]),n||(n=!z(a)||a!==this._$AH[r]),a===N?t=N:t!==N&&(t+=(null!=a?a:"")+i[r+1]),this._$AH[r]=a}n&&!o&&this.j(t)}j(t){t===N?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class J extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===N?void 0:t}}const K=y?y.emptyScript:"";class Y extends X{constructor(){super(...arguments),this.type=4}j(t){t&&t!==N?this.element.setAttribute(this.name,K):this.element.removeAttribute(this.name)}}class Z extends X{constructor(t,e,s,o,i){super(t,e,s,o,i),this.type=5}_$AI(t,e=this){var s;if((t=null!==(s=W(this,t,e,0))&&void 0!==s?s:N)===j)return;const o=this._$AH,i=t===N&&o!==N||t.capture!==o.capture||t.once!==o.once||t.passive!==o.passive,n=t!==N&&(o===N||i);i&&this.element.removeEventListener(this.name,this,o),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t)}}class Q{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){W(this,t)}}const tt=b.litHtmlPolyfillSupport;null==tt||tt(G,q),(null!==(v=b.litHtmlVersions)&&void 0!==v?v:b.litHtmlVersions=[]).push("2.8.0");var et,st;class ot extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const s=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=s.firstChild),s}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{var o,i;const n=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:e;let r=n._$litPart$;if(void 0===r){const t=null!==(i=null==s?void 0:s.renderBefore)&&void 0!==i?i:null;n._$litPart$=r=new q(e.insertBefore(k(),t),t,void 0,null!=s?s:{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return j}}ot.finalized=!0,ot._$litElement$=!0,null===(et=globalThis.litElementHydrateSupport)||void 0===et||et.call(globalThis,{LitElement:ot});const it=globalThis.litElementPolyfillSupport;null==it||it({LitElement:ot}),(null!==(st=globalThis.litElementVersions)&&void 0!==st?st:globalThis.litElementVersions=[]).push("3.3.3");const nt="2.9.18",rt=`autosnooze_${Date.now()}_${Math.random().toString(36).slice(2)}`;class at extends ot{static properties={hass:{type:Object},_config:{state:!0}};static styles=n`
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
  `;constructor(){super(),this.hass={},this._config={}}setConfig(t){this._config=t}_valueChanged(t,e){if(!this._config)return;const s={...this._config,[t]:e};""!==e&&null!=e||delete s[t],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:s},bubbles:!0,composed:!0}))}render(){return this._config?P`
      <div class="row">
        <label>Title</label>
        <input
          type="text"
          .value=${this._config.title||""}
          @input=${t=>this._valueChanged("title",t.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:P``}}class lt extends ot{static properties={hass:{type:Object},config:{type:Object},_selected:{state:!0},_duration:{state:!0},_customDuration:{state:!0},_customDurationInput:{state:!0},_loading:{state:!0},_search:{state:!0},_filterTab:{state:!0},_expandedGroups:{state:!0},_scheduleMode:{state:!0},_disableAt:{state:!0},_resumeAt:{state:!0},_labelRegistry:{state:!0},_categoryRegistry:{state:!0},_entityRegistry:{state:!0},_showCustomInput:{state:!0}};constructor(){super(),this._hass={},this.config={},this._selected=[],this._duration=18e5,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAt="",this._resumeAt="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._interval=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._debugLogged=!1,this._initialSetupComplete=!1,this._instanceModuleId=rt,this._hassSetCount=0}get hass(){return this._hass}set hass(t){this._hassSetCount++;const e=t?.states?.["sensor.autosnooze_snoozed_automations"];if(console.log(`[AutoSnooze] hass set #${this._hassSetCount}`,{hassExists:!!t,statesCount:t?.states?Object.keys(t.states).length:0,connectionExists:!!t?.connection,sensorExists:!!e,configExists:!!this.config,moduleId:this._instanceModuleId}),!t)return void console.warn("[AutoSnooze] hass is null/undefined during set");if(!t.states)return void console.warn("[AutoSnooze] hass.states is missing during set");e||console.log("[AutoSnooze] AutoSnooze sensor not found (may not be loaded yet):","sensor.autosnooze_snoozed_automations");const s=this._hass;this._hass=t,this.requestUpdate("hass",s)}connectedCallback(){super.connectedCallback(),console.log("[AutoSnooze] connectedCallback called",{instanceModuleId:this._instanceModuleId,currentModuleId:rt,hassExists:!!this._hass,hassStatesCount:this._hass?.states?Object.keys(this._hass.states).length:0,configExists:!!this.config,initialSetupComplete:this._initialSetupComplete}),this._instanceModuleId!==rt&&(console.log(`[AutoSnooze] Instance from old module (${this._instanceModuleId}) reconnected, updating to current (${rt})`),this._instanceModuleId=rt,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._initialSetupComplete=!1),this._interval&&window.clearInterval(this._interval),this._interval=window.setInterval(()=>this.requestUpdate(),1e3),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry(),this._initialSetupComplete=!0}async _fetchLabelRegistry(){if(!this._labelsFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/label_registry/list"}),e={};Array.isArray(t)&&t.forEach(t=>{e[t.label_id]=t}),this._labelRegistry=e,this._labelsFetched=!0,console.log("[AutoSnooze] Label registry fetched:",Object.keys(e).length,"labels")}catch(t){console.warn("[AutoSnooze] Failed to fetch label registry:",t)}}async _fetchCategoryRegistry(){if(!this._categoriesFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),e={};Array.isArray(t)&&t.forEach(t=>{e[t.category_id]=t}),this._categoryRegistry=e,this._categoriesFetched=!0,console.log("[AutoSnooze] Category registry fetched:",Object.keys(e).length,"categories")}catch(t){console.warn("[AutoSnooze] Failed to fetch category registry:",t)}}async _fetchEntityRegistry(){if(!this._entityRegistryFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/entity_registry/list"}),e=Array.isArray(t)?t.filter(t=>t.entity_id.startsWith("automation.")):[];if(e.length>0){const t=e.find(t=>t.categories)||e[0];console.log("[AutoSnooze] Basic list entry keys:",Object.keys(t)),console.log("[AutoSnooze] Basic list categories:",t.categories)}const s=await Promise.all(e.map(t=>this.hass.connection.sendMessagePromise({type:"config/entity_registry/get",entity_id:t.entity_id}))),o={};let i=0;if(s.forEach(t=>{o[t.entity_id]=t,t.categories&&Object.keys(t.categories).length>0&&i++}),this._entityRegistry=o,this._entityRegistryFetched=!0,console.log("[AutoSnooze] Entity registry fetched:",Object.keys(o).length,"automations,",i,"with categories"),s.length>0){const t=s.find(t=>t.categories&&Object.keys(t.categories).length>0)||s[0];console.log("[AutoSnooze] Sample extended entry keys:",Object.keys(t)),console.log("[AutoSnooze] Sample categories:",t.categories)}}catch(t){console.warn("[AutoSnooze] Failed to fetch entity registry:",t)}}updated(t){super.updated(t),t.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}disconnectedCallback(){super.disconnectedCallback(),console.log("[AutoSnooze] disconnectedCallback called",{moduleId:this._instanceModuleId,hassSetCount:this._hassSetCount}),null!==this._interval&&(clearInterval(this._interval),this._interval=null)}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{title:"AutoSnooze"}}static styles=n`
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
    }
    .tab:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      opacity: 0.8;
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
      border-bottom: 1px solid var(--divider-color);
      transition: background 0.2s;
      min-height: 48px;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item:hover {
      background: var(--secondary-background-color);
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item ha-icon {
      color: var(--primary-color);
      flex-shrink: 0;
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
      border-bottom: 1px solid var(--divider-color);
    }
    .group-header:hover {
      background: var(--divider-color);
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
    }
    .select-all-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
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
    }
    .pill:hover {
      border-color: var(--primary-color);
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
    }
    .snooze-btn:hover:not(:disabled) {
      opacity: 0.9;
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

    /* Paused Item */
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .paused-item:last-of-type {
      margin-bottom: 12px;
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
      margin-bottom: 4px;
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
    }
    .wake-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
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
    }
    .wake-all:hover {
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

    /* Schedule Mode Toggle */
    .schedule-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      cursor: pointer;
    }
    .schedule-toggle label {
      flex: 1;
      cursor: pointer;
      font-size: 0.9em;
    }
    .schedule-toggle input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
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
    .datetime-field input[type="datetime-local"] {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
    }
    .datetime-field input:focus {
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
    }
    .cancel-scheduled-btn:hover {
      background: #f44336;
      color: white;
      border-color: #f44336;
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
  `;_getAutomations(){const t=this.hass?.states,e=this.hass?.entities,s=this.hass?.areas;if(!t)return[];if(!this._debugLogged){if(this._debugLogged=!0,console.log("[AutoSnooze] Card version:",nt),console.log("[AutoSnooze] hass.entities available:",!!e,"count:",e?Object.keys(e).length:0),console.log("[AutoSnooze] hass.areas available:",!!s,"count:",s?Object.keys(s).length:0),console.log("[AutoSnooze] Label registry (fetched separately):",Object.keys(this._labelRegistry).length,"labels"),console.log("[AutoSnooze] Entity registry (fetched separately):",Object.keys(this._entityRegistry).length,"entities"),this._entityRegistry){const t=Object.keys(this._entityRegistry).find(t=>t.startsWith("automation."));t&&console.log("[AutoSnooze] Sample entity registry entry:",t,this._entityRegistry[t])}s&&Object.keys(s).length>0&&console.log("[AutoSnooze] Areas:",Object.entries(s).map(([t,e])=>`${t}: ${e.name}`).join(", "))}return Object.keys(t).filter(t=>t.startsWith("automation.")).map(s=>{const o=t[s];if(!o)return null;const i=this._entityRegistry?.[s],n=e?.[s],r=(i?.categories||{}).automation||null;return{id:s,name:o.attributes?.friendly_name||s.replace("automation.",""),area_id:i?.area_id||n?.area_id||null,category_id:r,labels:i?.labels||n?.labels||[]}}).filter(t=>null!==t).sort((t,e)=>t.name.localeCompare(e.name))}_getFilteredAutomations(){const t=this._getAutomations(),e=this._search.toLowerCase();let s=t;return e&&(s=t.filter(t=>t.name.toLowerCase().includes(e)||t.id.toLowerCase().includes(e))),s}_getAreaName(t){if(!t)return"Unassigned";const e=this.hass.areas?.[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getLabelName(t){const e=this._labelRegistry[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getGroupedByArea(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{const s=this._getAreaName(t.area_id);e[s]||(e[s]=[]),e[s].push(t)}),Object.entries(e).sort((t,e)=>"Unassigned"===t[0]?1:"Unassigned"===e[0]?-1:t[0].localeCompare(e[0]))}_getGroupedByLabel(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{t.labels&&0!==t.labels.length?t.labels.forEach(s=>{const o=this._getLabelName(s);e[o]||(e[o]=[]),e[o].push(t)}):(e.Unlabeled||(e.Unlabeled=[]),e.Unlabeled.push(t))}),Object.entries(e).sort((t,e)=>"Unlabeled"===t[0]?1:"Unlabeled"===e[0]?-1:t[0].localeCompare(e[0]))}_getAreaCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.area_id&&e.add(t.area_id)}),e.size}_getLabelCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.labels&&t.labels.length>0&&t.labels.forEach(t=>e.add(t))}),e.size}_getCategoryName(t){if(!t)return"Uncategorized";const e=this._categoryRegistry[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getGroupedByCategory(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{const s=this._getCategoryName(t.category_id);e[s]||(e[s]=[]),e[s].push(t)}),Object.entries(e).sort((t,e)=>"Uncategorized"===t[0]?1:"Uncategorized"===e[0]?-1:t[0].localeCompare(e[0]))}_getCategoryCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.category_id&&e.add(t.category_id)}),e.size}_selectAllVisible(){const t=this._getFilteredAutomations().map(t=>t.id),e=t.every(t=>this._selected.includes(t));this._selected=e?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_clearSelection(){this._selected=[]}_getPaused(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.paused_automations||{}}_getScheduled(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.scheduled_snoozes||{}}_formatDateTime(t){return new Date(t).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatCountdown(t){const e=new Date(t).getTime()-Date.now();if(e<=0)return"Waking up...";const s=Math.floor(e/864e5),o=Math.floor(e%864e5/36e5),i=Math.floor(e%36e5/6e4),n=Math.floor(e%6e4/1e3);return s>0?`${s}d ${o}h ${i}m`:o>0?`${o}h ${i}m ${n}s`:`${i}m ${n}s`}_toggleSelection(t){this._selected.includes(t)?this._selected=this._selected.filter(e=>e!==t):this._selected=[...this._selected,t]}_toggleGroupExpansion(t){this._expandedGroups={...this._expandedGroups,[t]:!this._expandedGroups[t]}}_selectGroup(t){const e=t.map(t=>t.id),s=e.every(t=>this._selected.includes(t));this._selected=s?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_setDuration(t){this._duration=6e4*t;const e=Math.floor(t/1440),s=Math.floor(t%1440/60),o=t%60;this._customDuration={days:e,hours:s,minutes:o};const i=[];e>0&&i.push(`${e}d`),s>0&&i.push(`${s}h`),o>0&&i.push(`${o}m`),this._customDurationInput=i.join(" ")||"30m"}_updateCustomDuration(){const{days:t,hours:e,minutes:s}=this._customDuration,o=1440*t+60*e+s;this._duration=6e4*o}_parseDurationInput(t){const e=t.toLowerCase().replace(/\s+/g,"");if(!e)return null;let s=0,o=0,i=0;const n=e.match(/(\d+)\s*d/),r=e.match(/(\d+)\s*h/),a=e.match(/(\d+)\s*m/);if(n&&(s=parseInt(n[1],10)),r&&(o=parseInt(r[1],10)),a&&(i=parseInt(a[1],10)),!n&&!r&&!a){const t=parseInt(e,10);if(isNaN(t)||!(t>0))return null;i=t}return 0===s&&0===o&&0===i?null:{days:s,hours:o,minutes:i}}_handleDurationInput(t){this._customDurationInput=t;const e=this._parseDurationInput(t);e&&(this._customDuration=e,this._updateCustomDuration())}_getDurationPreview(){const t=this._parseDurationInput(this._customDurationInput);return t?this._formatDuration(t.days,t.hours,t.minutes):""}_isDurationValid(){return null!==this._parseDurationInput(this._customDurationInput)}_showToast(t){const e=document.createElement("div");e.className="toast",e.textContent=t,this.shadowRoot?.appendChild(e),setTimeout(()=>{e.style.animation="slideUp 0.3s ease-out reverse",setTimeout(()=>e.remove(),300)},3e3)}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._resumeAt)return void this._showToast("Please set a resume time")}else if(0===this._duration)return;this._loading=!0;try{const t=this._selected.length;let e;if(this._scheduleMode){const s={entity_id:this._selected,resume_at:this._resumeAt};this._disableAt&&(s.disable_at=this._disableAt),await this.hass.callService("autosnooze","pause",s),e=this._disableAt?`Scheduled ${t} automation${1!==t?"s":""} to snooze`:`Paused ${t} automation${1!==t?"s":""} until ${this._formatDateTime(this._resumeAt)}`}else{const{days:s,hours:o,minutes:i}=this._customDuration;await this.hass.callService("autosnooze","pause",{entity_id:this._selected,days:s,hours:o,minutes:i});e=`Paused ${t} automation${1!==t?"s":""} for ${this._formatDuration(s,o,i)}`}this._showToast(e),this._selected=[],this._disableAt="",this._resumeAt=""}catch(t){console.error("Snooze failed:",t),this._showToast("Failed to pause automations")}this._loading=!1}}_formatDuration(t,e,s){const o=[];return t>0&&o.push(`${t} day${1!==t?"s":""}`),e>0&&o.push(`${e} hour${1!==e?"s":""}`),s>0&&o.push(`${s} minute${1!==s?"s":""}`),o.join(", ")}async _wake(t){try{await this.hass.callService("autosnooze","cancel",{entity_id:t}),this._showToast("Automation resumed")}catch(t){console.error("Wake failed:",t),this._showToast("Failed to resume automation")}}async _wakeAll(){try{await this.hass.callService("autosnooze","cancel_all",{}),this._showToast("All automations resumed")}catch(t){console.error("Wake all failed:",t),this._showToast("Failed to resume automations")}}async _cancelScheduled(t){try{await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:t}),this._showToast("Scheduled snooze cancelled")}catch(t){console.error("Cancel scheduled failed:",t),this._showToast("Failed to cancel scheduled snooze")}}_renderSelectionList(){const t=this._getFilteredAutomations();if("all"===this._filterTab)return 0===t.length?P`<div class="list-empty">No automations found</div>`:t.map(t=>P`
        <div
          class="list-item ${this._selected.includes(t.id)?"selected":""}"
          @click=${()=>this._toggleSelection(t.id)}
        >
          <ha-icon
            icon=${this._selected.includes(t.id)?"mdi:checkbox-marked":"mdi:checkbox-blank-outline"}
          ></ha-icon>
          <div class="list-item-content">
            <div class="list-item-name">${t.name}</div>
          </div>
        </div>
      `);const e="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===e.length?P`<div class="list-empty">No automations found</div>`:e.map(([t,e])=>{const s=!1!==this._expandedGroups[t],o=e.every(t=>this._selected.includes(t.id)),i=e.some(t=>this._selected.includes(t.id))&&!o;return P`
        <div
          class="group-header ${s?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(t)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
          <span>${t}</span>
          <span class="group-badge">${e.length}</span>
          <ha-icon
            icon=${o?"mdi:checkbox-marked":i?"mdi:checkbox-intermediate":"mdi:checkbox-blank-outline"}
            @click=${t=>{t.stopPropagation(),this._selectGroup(e)}}
          ></ha-icon>
        </div>
        ${s?e.map(t=>{const e="labels"===this._filterTab&&t.area_id?this._getAreaName(t.area_id):null;return P`
                <div
                  class="list-item ${this._selected.includes(t.id)?"selected":""}"
                  @click=${()=>this._toggleSelection(t.id)}
                >
                  <ha-icon
                    icon=${this._selected.includes(t.id)?"mdi:checkbox-marked":"mdi:checkbox-blank-outline"}
                  ></ha-icon>
                  <div class="list-item-content">
                    <div class="list-item-name">${t.name}</div>
                    ${e?P`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline"></ha-icon>${e}
                        </div>`:""}
                  </div>
                </div>
              `}):""}
      `})}render(){console.log("[AutoSnooze] render called",{hassExists:!!this._hass,hassStatesCount:this._hass?.states?Object.keys(this._hass.states).length:0,sensorExists:!!this._hass?.states?.["sensor.autosnooze_snoozed_automations"],configExists:!!this.config,moduleId:this._instanceModuleId,hassSetCount:this._hassSetCount});const t=this._getPaused(),e=Object.keys(t).length,s=this._getScheduled(),o=Object.keys(s).length,i=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],n=1440*this._customDuration.days+60*this._customDuration.hours+this._customDuration.minutes,r=i.find(t=>t.minutes===n),a=this._getDurationPreview(),l=this._isDurationValid();return P`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${e>0||o>0?P`<span class="status-summary"
                >${e>0?`${e} active`:""}${e>0&&o>0?", ":""}${o>0?`${o} scheduled`:""}</span
              >`:""}
        </div>

        <!-- Section A: Snooze Setup -->
        <div class="snooze-setup">
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button
              class="tab ${"all"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="all"}
            >
              All
              <span class="tab-count">${this._getAutomations().length}</span>
            </button>
            <button
              class="tab ${"areas"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="areas"}
            >
              Areas
              <span class="tab-count">${this._getAreaCount()}</span>
            </button>
            <button
              class="tab ${"categories"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="categories"}
            >
              Categories
              <span class="tab-count">${this._getCategoryCount()}</span>
            </button>
            <button
              class="tab ${"labels"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="labels"}
            >
              Labels
              <span class="tab-count">${this._getLabelCount()}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="search-box">
            <input
              type="text"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${t=>this._search=t.target.value}
            />
          </div>

          <!-- Selection Actions -->
          ${this._getFilteredAutomations().length>0?P`
                <div class="selection-actions">
                  <span>${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button class="select-all-btn" @click=${()=>this._selectAllVisible()}>
                    ${this._getFilteredAutomations().every(t=>this._selected.includes(t.id))?"Deselect All":"Select All"}
                  </button>
                  ${this._selected.length>0?P`<button class="select-all-btn" @click=${()=>this._clearSelection()}>Clear</button>`:""}
                </div>
              `:""}

          <!-- Selection List -->
          <div class="selection-list">${this._renderSelectionList()}</div>

          <!-- Schedule Mode Toggle -->
          <div class="schedule-toggle" @click=${()=>this._scheduleMode=!this._scheduleMode}>
            <ha-icon icon=${this._scheduleMode?"mdi:calendar-clock":"mdi:timer-outline"}></ha-icon>
            <label>${this._scheduleMode?"Schedule Mode":"Duration Mode"}</label>
            <input
              type="checkbox"
              .checked=${this._scheduleMode}
              @click=${t=>t.stopPropagation()}
              @change=${t=>this._scheduleMode=t.target.checked}
            />
          </div>

          ${this._scheduleMode?P`
                <!-- Schedule Datetime Inputs -->
                <div class="schedule-inputs">
                  <div class="datetime-field">
                    <label>Snooze Start (optional - leave empty to disable now)</label>
                    <input
                      type="datetime-local"
                      .value=${this._disableAt}
                      @input=${t=>this._disableAt=t.target.value}
                    />
                  </div>
                  <div class="datetime-field">
                    <label>Snooze End (required)</label>
                    <input
                      type="datetime-local"
                      .value=${this._resumeAt}
                      @input=${t=>this._resumeAt=t.target.value}
                    />
                  </div>
                </div>
              `:P`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-section-header">Snooze Duration</div>
                  <div class="duration-pills">
                    ${i.map(t=>P`
                        <button
                          class="pill ${null===t.minutes?this._showCustomInput?"active":"":this._showCustomInput||r!==t?"":"active"}"
                          @click=${()=>{null===t.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(t.minutes))}}
                        >
                          ${t.label}
                        </button>
                      `)}
                  </div>

                  ${this._showCustomInput?P`
                    <div class="custom-duration-input">
                      <input
                        type="text"
                        class="duration-input ${l?"":"invalid"}"
                        placeholder="e.g. 2h30m, 1d, 45m"
                        .value=${this._customDurationInput}
                        @input=${t=>this._handleDurationInput(t.target.value)}
                      />
                      ${a&&l?P`<div class="duration-preview">Duration: ${a}</div>`:P`<div class="duration-help">Enter duration: 30m, 2h, 4h30m, 1d, 1d2h</div>`}
                    </div>
                  `:""}
                </div>
              `}

          <!-- Snooze Button -->
          <button
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._resumeAt||this._loading}
            @click=${this._snooze}
          >
            ${this._loading?"Snoozing...":this._scheduleMode?"Schedule"+(this._selected.length>0?` (${this._selected.length})`:""):"Snooze"+(this._selected.length>0?` (${this._selected.length})`:"")}
          </button>
        </div>

        <!-- Section B: Active Snoozes -->
        ${e>0?P`
              <div class="snooze-list">
                <div class="list-header">
                  <ha-icon icon="mdi:bell-sleep"></ha-icon>
                  Snoozed Automations (${e})
                </div>

                ${Object.entries(t).map(([t,e])=>P`
                    <div class="paused-item">
                      <ha-icon class="paused-icon" icon="mdi:sleep"></ha-icon>
                      <div class="paused-info">
                        <div class="paused-name">
                          ${e.friendly_name||t}
                        </div>
                        <div class="paused-time">
                          Waking up in: ${this._formatCountdown(e.resume_at)}
                        </div>
                      </div>
                      <button class="wake-btn" @click=${()=>this._wake(t)}>
                        Wake Now
                      </button>
                    </div>
                  `)}

                ${e>1?P`
                      <button class="wake-all" @click=${this._wakeAll}>
                        Wake All
                      </button>
                    `:""}
              </div>
            `:""}

        <!-- Section C: Scheduled Snoozes -->
        ${o>0?P`
              <div class="scheduled-list">
                <div class="list-header">
                  <ha-icon icon="mdi:calendar-clock"></ha-icon>
                  Scheduled Snoozes (${o})
                </div>

                ${Object.entries(s).map(([t,e])=>P`
                    <div class="scheduled-item">
                      <ha-icon class="scheduled-icon" icon="mdi:clock-outline"></ha-icon>
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
                      <button class="cancel-scheduled-btn" @click=${()=>this._cancelScheduled(t)}>
                        Cancel
                      </button>
                    </div>
                  `)}
              </div>
            `:""}
      </ha-card>
    `}getCardSize(){const t=this._getPaused(),e=this._getScheduled();return 4+Object.keys(t).length+Object.keys(e).length}setConfig(t){console.log("[AutoSnooze] setConfig called",{config:t,moduleId:this._instanceModuleId,hassExists:!!this._hass}),this.config=t}}try{customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",at),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",lt)}catch(f){console.error("[AutoSnooze] Failed to register custom elements:",f)}try{window.customCards=window.customCards||[],window.customCards.some(t=>"autosnooze-card"===t.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:`Temporarily pause automations with area and label filtering (v${nt})`,preview:!0}),console.log(`[AutoSnooze] Card registered, version ${nt}`)}catch(f){console.warn("[AutoSnooze] customCards registration failed:",f)}window._autosnoozeCurrentModule=rt,console.log(`[AutoSnooze] Module load ID: ${rt}`),console.log("[AutoSnooze] Firing immediate ll-rebuild"),window.dispatchEvent(new Event("ll-rebuild")),setTimeout(()=>{window._autosnoozeCurrentModule===rt?(console.log(`[AutoSnooze] Firing delayed ll-rebuild (module ${rt} is current)`),window.dispatchEvent(new Event("ll-rebuild"))):console.log(`[AutoSnooze] Skipping delayed ll-rebuild (superseded by ${window._autosnoozeCurrentModule})`)},150),setTimeout(()=>{window._autosnoozeCurrentModule===rt&&(console.log(`[AutoSnooze] Firing safety ll-rebuild (module ${rt} is current)`),window.dispatchEvent(new Event("ll-rebuild")))},500);
