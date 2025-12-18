const t=window,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(s,t,i)},a=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,i))(e)})(t):t;var n;const l=window,c=l.trustedTypes,d=c?c.emptyScript:"",h=l.reactiveElementPolyfillSupport,u={toAttribute(t,e){switch(e){case Boolean:t=t?d:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},p=(t,e)=>e!==t&&(e==e||t==t),g={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:p},m="finalized";let _=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach((e,i)=>{const s=this._$Ep(i,e);void 0!==s&&(this._$Ev.set(s,i),t.push(s))}),t}static createProperty(t,e=g){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,s=this.getPropertyDescriptor(t,i,e);void 0!==s&&Object.defineProperty(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(s){const o=this[t];this[e]=s,this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||g}static finalize(){if(this.hasOwnProperty(m))return!1;this[m]=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}_$Eu(){var t;this._$E_=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach(t=>t(this))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])})}createRenderRoot(){var i;const s=null!==(i=this.shadowRoot)&&void 0!==i?i:this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{e?i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):s.forEach(e=>{const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=e.cssText,i.appendChild(s)})})(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)})}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)})}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=g){var s;const o=this.constructor._$Ep(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==(null===(s=i.converter)||void 0===s?void 0:s.toAttribute)?i.converter:u).toAttribute(e,i.type);this._$El=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$El=null}}_$AK(t,e){var i;const s=this.constructor,o=s._$Ev.get(t);if(void 0!==o&&this._$El!==o){const t=s.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:u;this._$El=o,this[o]=r.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let s=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||p)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):s=!1),!this.isUpdatePending&&s&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((t,e)=>this[e]=t),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach(t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)}),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach(t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach((t,e)=>this._$EO(e,this[e],t)),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}};var v;_[m]=!0,_.elementProperties=new Map,_.elementStyles=[],_.shadowRootOptions={mode:"open"},null==h||h({ReactiveElement:_}),(null!==(n=l.reactiveElementVersions)&&void 0!==n?n:l.reactiveElementVersions=[]).push("1.6.3");const b=window,y=b.trustedTypes,f=y?y.createPolicy("lit-html",{createHTML:t=>t}):void 0,$="$lit$",x=`lit$${(Math.random()+"").slice(9)}$`,A="?"+x,w=`<${A}>`,S=document,k=()=>S.createComment(""),C=t=>null===t||"object"!=typeof t&&"function"!=typeof t,z=Array.isArray,E="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,U=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),O=/'/g,P=/"/g,M=/^(?:script|style|textarea|title)$/i,N=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),j=Symbol.for("lit-noChange"),I=Symbol.for("lit-nothing"),L=new WeakMap,H=S.createTreeWalker(S,129,null,!1);function F(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==f?f.createHTML(e):e}const B=(t,e)=>{const i=t.length-1,s=[];let o,r=2===e?"<svg>":"",a=T;for(let e=0;e<i;e++){const i=t[e];let n,l,c=-1,d=0;for(;d<i.length&&(a.lastIndex=d,l=a.exec(i),null!==l);)d=a.lastIndex,a===T?"!--"===l[1]?a=D:void 0!==l[1]?a=R:void 0!==l[2]?(M.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=U):void 0!==l[3]&&(a=U):a===U?">"===l[0]?(a=null!=o?o:T,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?U:'"'===l[3]?P:O):a===P||a===O?a=U:a===D||a===R?a=T:(a=U,o=void 0);const h=a===U&&t[e+1].startsWith("/>")?" ":"";r+=a===T?i+w:c>=0?(s.push(n),i.slice(0,c)+$+i.slice(c)+x+h):i+x+(-2===c?(s.push(void 0),e):h)}return[F(t,r+(t[i]||"<?>")+(2===e?"</svg>":"")),s]};class G{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let o=0,r=0;const a=t.length-1,n=this.parts,[l,c]=B(t,e);if(this.el=G.createElement(l,i),H.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(s=H.nextNode())&&n.length<a;){if(1===s.nodeType){if(s.hasAttributes()){const t=[];for(const e of s.getAttributeNames())if(e.endsWith($)||e.startsWith(x)){const i=c[r++];if(t.push(e),void 0!==i){const t=s.getAttribute(i.toLowerCase()+$).split(x),e=/([.?@])?(.*)/.exec(i);n.push({type:1,index:o,name:e[2],strings:t,ctor:"."===e[1]?J:"?"===e[1]?Y:"@"===e[1]?Z:X})}else n.push({type:6,index:o})}for(const e of t)s.removeAttribute(e)}if(M.test(s.tagName)){const t=s.textContent.split(x),e=t.length-1;if(e>0){s.textContent=y?y.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],k()),H.nextNode(),n.push({type:2,index:++o});s.append(t[e],k())}}}else if(8===s.nodeType)if(s.data===A)n.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(x,t+1));)n.push({type:7,index:o}),t+=x.length-1}o++}}static createElement(t,e){const i=S.createElement("template");return i.innerHTML=t,i}}function W(t,e,i=t,s){var o,r,a,n;if(e===j)return e;let l=void 0!==s?null===(o=i._$Co)||void 0===o?void 0:o[s]:i._$Cl;const c=C(e)?void 0:e._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(r=null==l?void 0:l._$AO)||void 0===r||r.call(l,!1),void 0===c?l=void 0:(l=new c(t),l._$AT(t,i,s)),void 0!==s?(null!==(a=(n=i)._$Co)&&void 0!==a?a:n._$Co=[])[s]=l:i._$Cl=l),void 0!==l&&(e=W(t,l._$AS(t,e.values),l,s)),e}class V{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){var e;const{el:{content:i},parts:s}=this._$AD,o=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:S).importNode(i,!0);H.currentNode=o;let r=H.nextNode(),a=0,n=0,l=s[0];for(;void 0!==l;){if(a===l.index){let e;2===l.type?e=new q(r,r.nextSibling,this,t):1===l.type?e=new l.ctor(r,l.name,l.strings,this,t):6===l.type&&(e=new Q(r,this,t)),this._$AV.push(e),l=s[++n]}a!==(null==l?void 0:l.index)&&(r=H.nextNode(),a++)}return H.currentNode=S,o}v(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class q{constructor(t,e,i,s){var o;this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cp=null===(o=null==s?void 0:s.isConnected)||void 0===o||o}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cp}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=W(this,t,e),C(t)?t===I||null==t||""===t?(this._$AH!==I&&this._$AR(),this._$AH=I):t!==this._$AH&&t!==j&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):(t=>z(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]))(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==I&&C(this._$AH)?this._$AA.nextSibling.data=t:this.$(S.createTextNode(t)),this._$AH=t}g(t){var e;const{values:i,_$litType$:s}=t,o="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=G.createElement(F(s.h,s.h[0]),this.options)),s);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===o)this._$AH.v(i);else{const t=new V(o,this),e=t.u(this.options);t.v(i),this.$(e),this._$AH=t}}_$AC(t){let e=L.get(t.strings);return void 0===e&&L.set(t.strings,e=new G(t)),e}T(t){z(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const o of t)s===e.length?e.push(i=new q(this.k(k()),this.k(k()),this,this.options)):i=e[s],i._$AI(o),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cp=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class X{constructor(t,e,i,s,o){this.type=1,this._$AH=I,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=I}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,s){const o=this.strings;let r=!1;if(void 0===o)t=W(this,t,e,0),r=!C(t)||t!==this._$AH&&t!==j,r&&(this._$AH=t);else{const s=t;let a,n;for(t=o[0],a=0;a<o.length-1;a++)n=W(this,s[i+a],e,a),n===j&&(n=this._$AH[a]),r||(r=!C(n)||n!==this._$AH[a]),n===I?t=I:t!==I&&(t+=(null!=n?n:"")+o[a+1]),this._$AH[a]=n}r&&!s&&this.j(t)}j(t){t===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class J extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===I?void 0:t}}const K=y?y.emptyScript:"";class Y extends X{constructor(){super(...arguments),this.type=4}j(t){t&&t!==I?this.element.setAttribute(this.name,K):this.element.removeAttribute(this.name)}}class Z extends X{constructor(t,e,i,s,o){super(t,e,i,s,o),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=W(this,t,e,0))&&void 0!==i?i:I)===j)return;const s=this._$AH,o=t===I&&s!==I||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==I&&(s===I||o);o&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class Q{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){W(this,t)}}const tt=b.litHtmlPolyfillSupport;null==tt||tt(G,q),(null!==(v=b.litHtmlVersions)&&void 0!==v?v:b.litHtmlVersions=[]).push("2.8.0");var et,it;class st extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var s,o;const r=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:e;let a=r._$litPart$;if(void 0===a){const t=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;r._$litPart$=a=new q(e.insertBefore(k(),t),t,void 0,null!=i?i:{})}return a._$AI(t),a})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return j}}st.finalized=!0,st._$litElement$=!0,null===(et=globalThis.litElementHydrateSupport)||void 0===et||et.call(globalThis,{LitElement:st});const ot=globalThis.litElementPolyfillSupport;null==ot||ot({LitElement:st}),(null!==(it=globalThis.litElementVersions)&&void 0!==it?it:globalThis.litElementVersions=[]).push("3.3.3");const rt="2.9.8";class at extends st{static properties={hass:{type:Object},_config:{state:!0}};static styles=r`
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
  `;constructor(){super(),this.hass={},this._config={}}setConfig(t){this._config=t}_valueChanged(t,e){if(!this._config)return;const i={...this._config,[t]:e};""!==e&&null!=e||delete i[t],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this._config?N`
      <div class="row">
        <label>Title</label>
        <input
          type="text"
          .value=${this._config.title||""}
          @input=${t=>this._valueChanged("title",t.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:N``}}class nt extends st{static properties={hass:{type:Object},config:{type:Object},_selected:{state:!0},_duration:{state:!0},_customDuration:{state:!0},_customDurationInput:{state:!0},_loading:{state:!0},_search:{state:!0},_filterTab:{state:!0},_expandedGroups:{state:!0},_scheduleMode:{state:!0},_disableAt:{state:!0},_resumeAt:{state:!0},_labelRegistry:{state:!0},_categoryRegistry:{state:!0},_entityRegistry:{state:!0},_showCustomInput:{state:!0}};constructor(){super(),this.hass={},this.config={},this._selected=[],this._duration=18e5,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAt="",this._resumeAt="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._interval=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._debugLogged=!1}connectedCallback(){super.connectedCallback(),this._interval=window.setInterval(()=>this.requestUpdate(),1e3),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry()}async _fetchLabelRegistry(){if(!this._labelsFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/label_registry/list"}),e={};Array.isArray(t)&&t.forEach(t=>{e[t.label_id]=t}),this._labelRegistry=e,this._labelsFetched=!0,console.log("[AutoSnooze] Label registry fetched:",Object.keys(e).length,"labels")}catch(t){console.warn("[AutoSnooze] Failed to fetch label registry:",t)}}async _fetchCategoryRegistry(){if(!this._categoriesFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),e={};Array.isArray(t)&&t.forEach(t=>{e[t.category_id]=t}),this._categoryRegistry=e,this._categoriesFetched=!0,console.log("[AutoSnooze] Category registry fetched:",Object.keys(e).length,"categories")}catch(t){console.warn("[AutoSnooze] Failed to fetch category registry:",t)}}async _fetchEntityRegistry(){if(!this._entityRegistryFetched&&this.hass?.connection)try{const t=await this.hass.connection.sendMessagePromise({type:"config/entity_registry/list"}),e=Array.isArray(t)?t.filter(t=>t.entity_id.startsWith("automation.")):[];if(e.length>0){const t=e.find(t=>t.categories)||e[0];console.log("[AutoSnooze] Basic list entry keys:",Object.keys(t)),console.log("[AutoSnooze] Basic list categories:",t.categories)}const i=await Promise.all(e.map(t=>this.hass.connection.sendMessagePromise({type:"config/entity_registry/get",entity_id:t.entity_id}))),s={};let o=0;if(i.forEach(t=>{s[t.entity_id]=t,t.categories&&Object.keys(t.categories).length>0&&o++}),this._entityRegistry=s,this._entityRegistryFetched=!0,console.log("[AutoSnooze] Entity registry fetched:",Object.keys(s).length,"automations,",o,"with categories"),i.length>0){const t=i.find(t=>t.categories&&Object.keys(t.categories).length>0)||i[0];console.log("[AutoSnooze] Sample extended entry keys:",Object.keys(t)),console.log("[AutoSnooze] Sample categories:",t.categories)}}catch(t){console.warn("[AutoSnooze] Failed to fetch entity registry:",t)}}updated(t){super.updated(t),t.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null)}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{title:"AutoSnooze"}}static styles=r`
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
  `;_getAutomations(){const t=this.hass?.states,e=this.hass?.entities,i=this.hass?.areas;if(!t)return[];if(!this._debugLogged){if(this._debugLogged=!0,console.log("[AutoSnooze] Card version:",rt),console.log("[AutoSnooze] hass.entities available:",!!e,"count:",e?Object.keys(e).length:0),console.log("[AutoSnooze] hass.areas available:",!!i,"count:",i?Object.keys(i).length:0),console.log("[AutoSnooze] Label registry (fetched separately):",Object.keys(this._labelRegistry).length,"labels"),console.log("[AutoSnooze] Entity registry (fetched separately):",Object.keys(this._entityRegistry).length,"entities"),this._entityRegistry){const t=Object.keys(this._entityRegistry).find(t=>t.startsWith("automation."));t&&console.log("[AutoSnooze] Sample entity registry entry:",t,this._entityRegistry[t])}i&&Object.keys(i).length>0&&console.log("[AutoSnooze] Areas:",Object.entries(i).map(([t,e])=>`${t}: ${e.name}`).join(", "))}return Object.keys(t).filter(t=>t.startsWith("automation.")).map(i=>{const s=t[i];if(!s)return null;const o=this._entityRegistry?.[i],r=e?.[i],a=(o?.categories||{}).automation||null;return{id:i,name:s.attributes?.friendly_name||i.replace("automation.",""),area_id:o?.area_id||r?.area_id||null,category_id:a,labels:o?.labels||r?.labels||[]}}).filter(t=>null!==t).sort((t,e)=>t.name.localeCompare(e.name))}_getFilteredAutomations(){const t=this._getAutomations(),e=this._search.toLowerCase();let i=t;return e&&(i=t.filter(t=>t.name.toLowerCase().includes(e)||t.id.toLowerCase().includes(e))),i}_getAreaName(t){if(!t)return"Unassigned";const e=this.hass.areas?.[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getLabelName(t){const e=this._labelRegistry[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getGroupedByArea(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{const i=this._getAreaName(t.area_id);e[i]||(e[i]=[]),e[i].push(t)}),Object.entries(e).sort((t,e)=>"Unassigned"===t[0]?1:"Unassigned"===e[0]?-1:t[0].localeCompare(e[0]))}_getGroupedByLabel(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{t.labels&&0!==t.labels.length?t.labels.forEach(i=>{const s=this._getLabelName(i);e[s]||(e[s]=[]),e[s].push(t)}):(e.Unlabeled||(e.Unlabeled=[]),e.Unlabeled.push(t))}),Object.entries(e).sort((t,e)=>"Unlabeled"===t[0]?1:"Unlabeled"===e[0]?-1:t[0].localeCompare(e[0]))}_getAreaCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.area_id&&e.add(t.area_id)}),e.size}_getLabelCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.labels&&t.labels.length>0&&t.labels.forEach(t=>e.add(t))}),e.size}_getCategoryName(t){if(!t)return"Uncategorized";const e=this._categoryRegistry[t];return e?.name?e.name:t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}_getGroupedByCategory(){const t=this._getFilteredAutomations(),e={};return t.forEach(t=>{const i=this._getCategoryName(t.category_id);e[i]||(e[i]=[]),e[i].push(t)}),Object.entries(e).sort((t,e)=>"Uncategorized"===t[0]?1:"Uncategorized"===e[0]?-1:t[0].localeCompare(e[0]))}_getCategoryCount(){const t=this._getAutomations(),e=new Set;return t.forEach(t=>{t.category_id&&e.add(t.category_id)}),e.size}_selectAllVisible(){const t=this._getFilteredAutomations().map(t=>t.id),e=t.every(t=>this._selected.includes(t));this._selected=e?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_clearSelection(){this._selected=[]}_getPaused(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.paused_automations||{}}_getScheduled(){const t=this.hass?.states["sensor.autosnooze_snoozed_automations"];return t?.attributes?.scheduled_snoozes||{}}_formatDateTime(t){return new Date(t).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}_formatCountdown(t){const e=new Date(t).getTime()-Date.now();if(e<=0)return"Waking up...";const i=Math.floor(e/864e5),s=Math.floor(e%864e5/36e5),o=Math.floor(e%36e5/6e4),r=Math.floor(e%6e4/1e3);return i>0?`${i}d ${s}h ${o}m`:s>0?`${s}h ${o}m ${r}s`:`${o}m ${r}s`}_toggleSelection(t){this._selected.includes(t)?this._selected=this._selected.filter(e=>e!==t):this._selected=[...this._selected,t]}_toggleGroupExpansion(t){this._expandedGroups={...this._expandedGroups,[t]:!this._expandedGroups[t]}}_selectGroup(t){const e=t.map(t=>t.id),i=e.every(t=>this._selected.includes(t));this._selected=i?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_setDuration(t){this._duration=6e4*t;const e=Math.floor(t/1440),i=Math.floor(t%1440/60),s=t%60;this._customDuration={days:e,hours:i,minutes:s};const o=[];e>0&&o.push(`${e}d`),i>0&&o.push(`${i}h`),s>0&&o.push(`${s}m`),this._customDurationInput=o.join(" ")||"30m"}_updateCustomDuration(){const{days:t,hours:e,minutes:i}=this._customDuration,s=1440*t+60*e+i;this._duration=6e4*s}_parseDurationInput(t){const e=t.toLowerCase().replace(/\s+/g,"");if(!e)return null;let i=0,s=0,o=0;const r=e.match(/(\d+)\s*d/),a=e.match(/(\d+)\s*h/),n=e.match(/(\d+)\s*m/);if(r&&(i=parseInt(r[1],10)),a&&(s=parseInt(a[1],10)),n&&(o=parseInt(n[1],10)),!r&&!a&&!n){const t=parseInt(e,10);if(isNaN(t)||!(t>0))return null;o=t}return 0===i&&0===s&&0===o?null:{days:i,hours:s,minutes:o}}_handleDurationInput(t){this._customDurationInput=t;const e=this._parseDurationInput(t);e&&(this._customDuration=e,this._updateCustomDuration())}_getDurationPreview(){const t=this._parseDurationInput(this._customDurationInput);return t?this._formatDuration(t.days,t.hours,t.minutes):""}_isDurationValid(){return null!==this._parseDurationInput(this._customDurationInput)}_showToast(t){const e=document.createElement("div");e.className="toast",e.textContent=t,this.shadowRoot?.appendChild(e),setTimeout(()=>{e.style.animation="slideUp 0.3s ease-out reverse",setTimeout(()=>e.remove(),300)},3e3)}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._resumeAt)return void this._showToast("Please set a resume time")}else if(0===this._duration)return;this._loading=!0;try{const t=this._selected.length;let e;if(this._scheduleMode){const i={entity_id:this._selected,resume_at:this._resumeAt};this._disableAt&&(i.disable_at=this._disableAt),await this.hass.callService("autosnooze","pause",i),e=this._disableAt?`Scheduled ${t} automation${1!==t?"s":""} to snooze`:`Paused ${t} automation${1!==t?"s":""} until ${this._formatDateTime(this._resumeAt)}`}else{const{days:i,hours:s,minutes:o}=this._customDuration;await this.hass.callService("autosnooze","pause",{entity_id:this._selected,days:i,hours:s,minutes:o});e=`Paused ${t} automation${1!==t?"s":""} for ${this._formatDuration(i,s,o)}`}this._showToast(e),this._selected=[],this._disableAt="",this._resumeAt=""}catch(t){console.error("Snooze failed:",t),this._showToast("Failed to pause automations")}this._loading=!1}}_formatDuration(t,e,i){const s=[];return t>0&&s.push(`${t} day${1!==t?"s":""}`),e>0&&s.push(`${e} hour${1!==e?"s":""}`),i>0&&s.push(`${i} minute${1!==i?"s":""}`),s.join(", ")}async _wake(t){try{await this.hass.callService("autosnooze","cancel",{entity_id:t}),this._showToast("Automation resumed")}catch(t){console.error("Wake failed:",t),this._showToast("Failed to resume automation")}}async _wakeAll(){try{await this.hass.callService("autosnooze","cancel_all",{}),this._showToast("All automations resumed")}catch(t){console.error("Wake all failed:",t),this._showToast("Failed to resume automations")}}async _cancelScheduled(t){try{await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:t}),this._showToast("Scheduled snooze cancelled")}catch(t){console.error("Cancel scheduled failed:",t),this._showToast("Failed to cancel scheduled snooze")}}_renderSelectionList(){const t=this._getFilteredAutomations();if("all"===this._filterTab)return 0===t.length?N`<div class="list-empty">No automations found</div>`:t.map(t=>N`
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
      `);const e="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===e.length?N`<div class="list-empty">No automations found</div>`:e.map(([t,e])=>{const i=!1!==this._expandedGroups[t],s=e.every(t=>this._selected.includes(t.id)),o=e.some(t=>this._selected.includes(t.id))&&!s;return N`
        <div
          class="group-header ${i?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(t)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
          <span>${t}</span>
          <span class="group-badge">${e.length}</span>
          <ha-icon
            icon=${s?"mdi:checkbox-marked":o?"mdi:checkbox-intermediate":"mdi:checkbox-blank-outline"}
            @click=${t=>{t.stopPropagation(),this._selectGroup(e)}}
          ></ha-icon>
        </div>
        ${i?e.map(t=>{const e="labels"===this._filterTab&&t.area_id?this._getAreaName(t.area_id):null;return N`
                <div
                  class="list-item ${this._selected.includes(t.id)?"selected":""}"
                  @click=${()=>this._toggleSelection(t.id)}
                >
                  <ha-icon
                    icon=${this._selected.includes(t.id)?"mdi:checkbox-marked":"mdi:checkbox-blank-outline"}
                  ></ha-icon>
                  <div class="list-item-content">
                    <div class="list-item-name">${t.name}</div>
                    ${e?N`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline"></ha-icon>${e}
                        </div>`:""}
                  </div>
                </div>
              `}):""}
      `})}render(){const t=this._getPaused(),e=Object.keys(t).length,i=this._getScheduled(),s=Object.keys(i).length,o=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],r=1440*this._customDuration.days+60*this._customDuration.hours+this._customDuration.minutes,a=o.find(t=>t.minutes===r),n=this._getDurationPreview(),l=this._isDurationValid();return N`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${e>0||s>0?N`<span class="status-summary"
                >${e>0?`${e} active`:""}${e>0&&s>0?", ":""}${s>0?`${s} scheduled`:""}</span
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
          ${this._getFilteredAutomations().length>0?N`
                <div class="selection-actions">
                  <span>${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button class="select-all-btn" @click=${()=>this._selectAllVisible()}>
                    ${this._getFilteredAutomations().every(t=>this._selected.includes(t.id))?"Deselect All":"Select All"}
                  </button>
                  ${this._selected.length>0?N`<button class="select-all-btn" @click=${()=>this._clearSelection()}>Clear</button>`:""}
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

          ${this._scheduleMode?N`
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
              `:N`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-section-header">Snooze Duration</div>
                  <div class="duration-pills">
                    ${o.map(t=>N`
                        <button
                          class="pill ${null===t.minutes?this._showCustomInput?"active":"":this._showCustomInput||a!==t?"":"active"}"
                          @click=${()=>{null===t.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(t.minutes))}}
                        >
                          ${t.label}
                        </button>
                      `)}
                  </div>

                  ${this._showCustomInput?N`
                    <div class="custom-duration-input">
                      <input
                        type="text"
                        class="duration-input ${l?"":"invalid"}"
                        placeholder="e.g. 2h30m, 1d, 45m"
                        .value=${this._customDurationInput}
                        @input=${t=>this._handleDurationInput(t.target.value)}
                      />
                      ${n&&l?N`<div class="duration-preview">Duration: ${n}</div>`:N`<div class="duration-help">Enter duration: 30m, 2h, 4h30m, 1d, 1d2h</div>`}
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
        ${e>0?N`
              <div class="snooze-list">
                <div class="list-header">
                  <ha-icon icon="mdi:bell-sleep"></ha-icon>
                  Snoozed Automations (${e})
                </div>

                ${Object.entries(t).map(([t,e])=>N`
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

                ${e>1?N`
                      <button class="wake-all" @click=${this._wakeAll}>
                        Wake All
                      </button>
                    `:""}
              </div>
            `:""}

        <!-- Section C: Scheduled Snoozes -->
        ${s>0?N`
              <div class="scheduled-list">
                <div class="list-header">
                  <ha-icon icon="mdi:calendar-clock"></ha-icon>
                  Scheduled Snoozes (${s})
                </div>

                ${Object.entries(i).map(([t,e])=>N`
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
    `}getCardSize(){const t=this._getPaused(),e=this._getScheduled();return 4+Object.keys(t).length+Object.keys(e).length}setConfig(t){this.config=t}}try{customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",at),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",nt)}catch(f){console.error("[AutoSnooze] Failed to register custom elements:",f)}try{window.customCards=window.customCards||[],window.customCards.some(t=>"autosnooze-card"===t.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:`Temporarily pause automations with area and label filtering (v${rt})`,preview:!0}),console.log(`[AutoSnooze] Card registered, version ${rt}`)}catch(f){console.warn("[AutoSnooze] customCards registration failed:",f)}window.dispatchEvent(new Event("ll-rebuild"));
