const e=window,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=s.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&s.set(i,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new o(s,e,i)},r=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,i))(t)})(e):e;var n;const l=window,d=l.trustedTypes,c=d?d.emptyScript:"",u=l.reactiveElementPolyfillSupport,h={toAttribute(e,t){switch(t){case Boolean:e=e?c:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},p=(e,t)=>t!==e&&(t==t||e==e),m={attribute:!0,type:String,converter:h,reflect:!1,hasChanged:p},g="finalized";let _=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(e){var t;this.finalize(),(null!==(t=this.h)&&void 0!==t?t:this.h=[]).push(e)}static get observedAttributes(){this.finalize();const e=[];return this.elementProperties.forEach((t,i)=>{const s=this._$Ep(i,t);void 0!==s&&(this._$Ev.set(s,i),e.push(s))}),e}static createProperty(e,t=m){if(t.state&&(t.attribute=!1),this.finalize(),this.elementProperties.set(e,t),!t.noAccessor&&!this.prototype.hasOwnProperty(e)){const i="symbol"==typeof e?Symbol():"__"+e,s=this.getPropertyDescriptor(e,i,t);void 0!==s&&Object.defineProperty(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){return{get(){return this[t]},set(s){const o=this[e];this[t]=s,this.requestUpdate(e,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)||m}static finalize(){if(this.hasOwnProperty(g))return!1;this[g]=!0;const e=Object.getPrototypeOf(this);if(e.finalize(),void 0!==e.h&&(this.h=[...e.h]),this.elementProperties=new Map(e.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const e=this.properties,t=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(const i of t)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(r(e))}else void 0!==e&&t.push(r(e));return t}static _$Ep(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}_$Eu(){var e;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(e=this.constructor.h)||void 0===e||e.forEach(e=>e(this))}addController(e){var t,i;(null!==(t=this._$ES)&&void 0!==t?t:this._$ES=[]).push(e),void 0!==this.renderRoot&&this.isConnected&&(null===(i=e.hostConnected)||void 0===i||i.call(e))}removeController(e){var t;null===(t=this._$ES)||void 0===t||t.splice(this._$ES.indexOf(e)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((e,t)=>{this.hasOwnProperty(t)&&(this._$Ei.set(t,this[t]),delete this[t])})}createRenderRoot(){var i;const s=null!==(i=this.shadowRoot)&&void 0!==i?i:this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{t?i.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):s.forEach(t=>{const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=t.cssText,i.appendChild(s)})})(s,this.constructor.elementStyles),s}connectedCallback(){var e;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostConnected)||void 0===t?void 0:t.call(e)})}enableUpdating(e){}disconnectedCallback(){var e;null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostDisconnected)||void 0===t?void 0:t.call(e)})}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$EO(e,t,i=m){var s;const o=this.constructor._$Ep(e,i);if(void 0!==o&&!0===i.reflect){const a=(void 0!==(null===(s=i.converter)||void 0===s?void 0:s.toAttribute)?i.converter:h).toAttribute(t,i.type);this._$El=e,null==a?this.removeAttribute(o):this.setAttribute(o,a),this._$El=null}}_$AK(e,t){var i;const s=this.constructor,o=s._$Ev.get(e);if(void 0!==o&&this._$El!==o){const e=s.getPropertyOptions(o),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==(null===(i=e.converter)||void 0===i?void 0:i.fromAttribute)?e.converter:h;this._$El=o,this[o]=a.fromAttribute(t,e.type),this._$El=null}}requestUpdate(e,t,i){let s=!0;void 0!==e&&(((i=i||this.constructor.getPropertyOptions(e)).hasChanged||p)(this[e],t)?(this._$AL.has(e)||this._$AL.set(e,t),!0===i.reflect&&this._$El!==e&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(e,i))):s=!1),!this.isUpdatePending&&s&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var e;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((e,t)=>this[t]=e),this._$Ei=void 0);let t=!1;const i=this._$AL;try{t=this.shouldUpdate(i),t?(this.willUpdate(i),null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostUpdate)||void 0===t?void 0:t.call(e)}),this.update(i)):this._$Ek()}catch(e){throw t=!1,this._$Ek(),e}t&&this._$AE(i)}willUpdate(e){}_$AE(e){var t;null===(t=this._$ES)||void 0===t||t.forEach(e=>{var t;return null===(t=e.hostUpdated)||void 0===t?void 0:t.call(e)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(e){return!0}update(e){void 0!==this._$EC&&(this._$EC.forEach((e,t)=>this._$EO(t,this[t],e)),this._$EC=void 0),this._$Ek()}updated(e){}firstUpdated(e){}};var b;_[g]=!0,_.elementProperties=new Map,_.elementStyles=[],_.shadowRootOptions={mode:"open"},null==u||u({ReactiveElement:_}),(null!==(n=l.reactiveElementVersions)&&void 0!==n?n:l.reactiveElementVersions=[]).push("1.6.3");const v=window,f=v.trustedTypes,y=f?f.createPolicy("lit-html",{createHTML:e=>e}):void 0,$="$lit$",x=`lit$${(Math.random()+"").slice(9)}$`,A="?"+x,w=`<${A}>`,S=document,k=()=>S.createComment(""),C=e=>null===e||"object"!=typeof e&&"function"!=typeof e,z=Array.isArray,T="[ \t\n\f\r]",E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,R=/>/g,P=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,M=/"/g,I=/^(?:script|style|textarea|title)$/i,N=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),O=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),H=new WeakMap,L=S.createTreeWalker(S,129,null,!1);function B(e,t){if(!Array.isArray(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==y?y.createHTML(t):t}const j=(e,t)=>{const i=e.length-1,s=[];let o,a=2===t?"<svg>":"",r=E;for(let t=0;t<i;t++){const i=e[t];let n,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===E?"!--"===l[1]?r=D:void 0!==l[1]?r=R:void 0!==l[2]?(I.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=P):void 0!==l[3]&&(r=P):r===P?">"===l[0]?(r=null!=o?o:E,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?P:'"'===l[3]?M:U):r===M||r===U?r=P:r===D||r===R?r=E:(r=P,o=void 0);const u=r===P&&e[t+1].startsWith("/>")?" ":"";a+=r===E?i+w:d>=0?(s.push(n),i.slice(0,d)+$+i.slice(d)+x+u):i+x+(-2===d?(s.push(void 0),t):u)}return[B(e,a+(e[i]||"<?>")+(2===t?"</svg>":"")),s]};class G{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,a=0;const r=e.length-1,n=this.parts,[l,d]=j(e,t);if(this.el=G.createElement(l,i),L.currentNode=this.el.content,2===t){const e=this.el.content,t=e.firstChild;t.remove(),e.append(...t.childNodes)}for(;null!==(s=L.nextNode())&&n.length<r;){if(1===s.nodeType){if(s.hasAttributes()){const e=[];for(const t of s.getAttributeNames())if(t.endsWith($)||t.startsWith(x)){const i=d[a++];if(e.push(t),void 0!==i){const e=s.getAttribute(i.toLowerCase()+$).split(x),t=/([.?@])?(.*)/.exec(i);n.push({type:1,index:o,name:t[2],strings:e,ctor:"."===t[1]?Y:"?"===t[1]?J:"@"===t[1]?Z:K})}else n.push({type:6,index:o})}for(const t of e)s.removeAttribute(t)}if(I.test(s.tagName)){const e=s.textContent.split(x),t=e.length-1;if(t>0){s.textContent=f?f.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],k()),L.nextNode(),n.push({type:2,index:++o});s.append(e[t],k())}}}else if(8===s.nodeType)if(s.data===A)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(x,e+1));)n.push({type:7,index:o}),e+=x.length-1}o++}}static createElement(e,t){const i=S.createElement("template");return i.innerHTML=e,i}}function V(e,t,i=e,s){var o,a,r,n;if(t===O)return t;let l=void 0!==s?null===(o=i._$Co)||void 0===o?void 0:o[s]:i._$Cl;const d=C(t)?void 0:t._$litDirective$;return(null==l?void 0:l.constructor)!==d&&(null===(a=null==l?void 0:l._$AO)||void 0===a||a.call(l,!1),void 0===d?l=void 0:(l=new d(e),l._$AT(e,i,s)),void 0!==s?(null!==(r=(n=i)._$Co)&&void 0!==r?r:n._$Co=[])[s]=l:i._$Cl=l),void 0!==l&&(t=V(e,l._$AS(e,t.values),l,s)),t}class W{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){var t;const{el:{content:i},parts:s}=this._$AD,o=(null!==(t=null==e?void 0:e.creationScope)&&void 0!==t?t:S).importNode(i,!0);L.currentNode=o;let a=L.nextNode(),r=0,n=0,l=s[0];for(;void 0!==l;){if(r===l.index){let t;2===l.type?t=new q(a,a.nextSibling,this,e):1===l.type?t=new l.ctor(a,l.name,l.strings,this,e):6===l.type&&(t=new Q(a,this,e)),this._$AV.push(t),l=s[++n]}r!==(null==l?void 0:l.index)&&(a=L.nextNode(),r++)}return L.currentNode=S,o}v(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class q{constructor(e,t,i,s){var o;this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cp=null===(o=null==s?void 0:s.isConnected)||void 0===o||o}get _$AU(){var e,t;return null!==(t=null===(e=this._$AM)||void 0===e?void 0:e._$AU)&&void 0!==t?t:this._$Cp}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===(null==e?void 0:e.nodeType)&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=V(this,e,t),C(e)?e===F||null==e||""===e?(this._$AH!==F&&this._$AR(),this._$AH=F):e!==this._$AH&&e!==O&&this._(e):void 0!==e._$litType$?this.g(e):void 0!==e.nodeType?this.$(e):(e=>z(e)||"function"==typeof(null==e?void 0:e[Symbol.iterator]))(e)?this.T(e):this._(e)}k(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}$(e){this._$AH!==e&&(this._$AR(),this._$AH=this.k(e))}_(e){this._$AH!==F&&C(this._$AH)?this._$AA.nextSibling.data=e:this.$(S.createTextNode(e)),this._$AH=e}g(e){var t;const{values:i,_$litType$:s}=e,o="number"==typeof s?this._$AC(e):(void 0===s.el&&(s.el=G.createElement(B(s.h,s.h[0]),this.options)),s);if((null===(t=this._$AH)||void 0===t?void 0:t._$AD)===o)this._$AH.v(i);else{const e=new W(o,this),t=e.u(this.options);e.v(i),this.$(t),this._$AH=e}}_$AC(e){let t=H.get(e.strings);return void 0===t&&H.set(e.strings,t=new G(e)),t}T(e){z(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new q(this.k(k()),this.k(k()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){var t;void 0===this._$AM&&(this._$Cp=e,null===(t=this._$AP)||void 0===t||t.call(this,e))}}class K{constructor(e,t,i,s,o){this.type=1,this._$AH=F,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,i,s){const o=this.strings;let a=!1;if(void 0===o)e=V(this,e,t,0),a=!C(e)||e!==this._$AH&&e!==O,a&&(this._$AH=e);else{const s=e;let r,n;for(e=o[0],r=0;r<o.length-1;r++)n=V(this,s[i+r],t,r),n===O&&(n=this._$AH[r]),a||(a=!C(n)||n!==this._$AH[r]),n===F?e=F:e!==F&&(e+=(null!=n?n:"")+o[r+1]),this._$AH[r]=n}a&&!s&&this.j(e)}j(e){e===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=e?e:"")}}class Y extends K{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===F?void 0:e}}const X=f?f.emptyScript:"";class J extends K{constructor(){super(...arguments),this.type=4}j(e){e&&e!==F?this.element.setAttribute(this.name,X):this.element.removeAttribute(this.name)}}class Z extends K{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){var i;if((e=null!==(i=V(this,e,t,0))&&void 0!==i?i:F)===O)return;const s=this._$AH,o=e===F&&s!==F||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,a=e!==F&&(s===F||o);o&&this.element.removeEventListener(this.name,this,s),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(t=this.options)||void 0===t?void 0:t.host)&&void 0!==i?i:this.element,e):this._$AH.handleEvent(e)}}class Q{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){V(this,e)}}const ee=v.litHtmlPolyfillSupport;null==ee||ee(G,q),(null!==(b=v.litHtmlVersions)&&void 0!==b?b:v.litHtmlVersions=[]).push("2.8.0");var te,ie;class se extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,t;const i=super.createRenderRoot();return null!==(e=(t=this.renderOptions).renderBefore)&&void 0!==e||(t.renderBefore=i.firstChild),i}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{var s,o;const a=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:t;let r=a._$litPart$;if(void 0===r){const e=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;a._$litPart$=r=new q(t.insertBefore(k(),e),e,void 0,null!=i?i:{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!1)}render(){return O}}se.finalized=!0,se._$litElement$=!0,null===(te=globalThis.litElementHydrateSupport)||void 0===te||te.call(globalThis,{LitElement:se});const oe=globalThis.litElementPolyfillSupport;null==oe||oe({LitElement:se}),(null!==(ie=globalThis.litElementVersions)&&void 0!==ie?ie:globalThis.litElementVersions=[]).push("3.3.3");const ae=1e3,re=6e4,ne=36e5,le=864e5,de=60,ce=1440,ue=300,he=300,pe=3e3,me=5e3,ge=1e3,_e=5e3,be=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],ve={not_automation:"Failed to snooze: One or more selected items are not automations",invalid_duration:"Failed to snooze: Please specify a valid duration (days, hours, or minutes)",resume_time_past:"Failed to snooze: Resume time must be in the future",disable_after_resume:"Failed to snooze: Snooze time must be before resume time"};class fe extends se{static properties={hass:{type:Object},_config:{state:!0}};static styles=a`
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
  `;constructor(){super(),this.hass={},this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const i={...this._config,[e]:t};""!==t&&null!=t||delete i[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this._config?N`
      <div class="row">
        <label>Title</label>
        <input
          type="text"
          .value=${this._config.title||""}
          @input=${e=>this._valueChanged("title",e.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:N``}}class ye extends se{static properties={hass:{type:Object},config:{type:Object},_selected:{state:!0},_duration:{state:!0},_customDuration:{state:!0},_customDurationInput:{state:!0},_loading:{state:!0},_search:{state:!0},_filterTab:{state:!0},_expandedGroups:{state:!0},_scheduleMode:{state:!0},_disableAtDate:{state:!0},_disableAtTime:{state:!0},_resumeAtDate:{state:!0},_resumeAtTime:{state:!0},_labelRegistry:{state:!0},_categoryRegistry:{state:!0},_entityRegistry:{state:!0},_showCustomInput:{state:!0},_automationsCache:{state:!0},_automationsCacheKey:{state:!0},_wakeAllPending:{state:!0}};constructor(){super(),this.hass={},this.config={},this._selected=[],this._duration=30*re,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._interval=null,this._syncTimeout=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._automationsCache=null,this._automationsCacheKey=null,this._lastHassStates=null,this._searchTimeout=null,this._wakeAllPending=!1,this._wakeAllTimeout=null}connectedCallback(){super.connectedCallback(),this._interval&&(window.clearInterval(this._interval),this._interval=null),this._syncTimeout&&(window.clearTimeout(this._syncTimeout),this._syncTimeout=null),this._startSynchronizedCountdown(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry()}_startSynchronizedCountdown(){const e=1e3-Date.now()%1e3;this._syncTimeout=window.setTimeout(()=>{this._syncTimeout=null,this._updateCountdownIfNeeded(),this._interval=window.setInterval(()=>{this._updateCountdownIfNeeded()},ge)},e)}_updateCountdownIfNeeded(){const e=this.shadowRoot?.querySelectorAll(".countdown[data-resume-at]");e&&e.length>0&&e.forEach(e=>{const t=e.dataset.resumeAt;t&&(e.textContent=this._formatCountdown(t))})}async _fetchRegistry(e){const{fetchedFlag:t,messageType:i,messageParams:s,idKey:o,targetProp:a,filterFn:r,logName:n}=e;if(!this[t]&&this.hass?.connection)try{const e={type:i,...s},n=await this.hass.connection.sendMessagePromise(e),l={};if(Array.isArray(n)){(r?n.filter(r):n).forEach(e=>{l[e[o]]=e})}this[a]=l,this[t]=!0}catch(e){console.warn(`[AutoSnooze] Failed to fetch ${n}:`,e)}}async _fetchLabelRegistry(){await this._fetchRegistry({fetchedFlag:"_labelsFetched",messageType:"config/label_registry/list",messageParams:{},idKey:"label_id",targetProp:"_labelRegistry",filterFn:null,logName:"label registry"})}async _fetchCategoryRegistry(){await this._fetchRegistry({fetchedFlag:"_categoriesFetched",messageType:"config/category_registry/list",messageParams:{scope:"automation"},idKey:"category_id",targetProp:"_categoryRegistry",filterFn:null,logName:"category registry"})}async _fetchEntityRegistry(){await this._fetchRegistry({fetchedFlag:"_entityRegistryFetched",messageType:"config/entity_registry/list",messageParams:{},idKey:"entity_id",targetProp:"_entityRegistry",filterFn:e=>e.entity_id.startsWith("automation."),logName:"entity registry"})}updated(e){super.updated(e),e.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null),null!==this._syncTimeout&&(clearTimeout(this._syncTimeout),this._syncTimeout=null),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null)}_handleSearchInput(e){const t=e.target.value;clearTimeout(this._searchTimeout),this._searchTimeout=setTimeout(()=>{this._search=t},ue)}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{title:"AutoSnooze"}}static styles=a`
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
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 0;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.9em;
    }
    .schedule-link:hover {
      text-decoration: underline;
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
    }
    .toast-undo-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.8);
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
      }

      /* Reduced selection list height */
      .selection-list {
        max-height: 180px;
        margin-bottom: 10px;
      }

      .list-item {
        padding: 10px;
        gap: 8px;
        min-height: 42px;
      }

      .list-item-name {
        font-size: 0.9em;
      }

      .group-header {
        padding: 8px 10px;
        font-size: 0.85em;
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
      }

      .duration-input {
        padding: 8px 10px;
        font-size: 0.9em;
      }

      .schedule-link {
        margin-top: 8px;
        padding: 6px 0;
        font-size: 0.85em;
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
      }

      .datetime-row input[type="time"] {
        flex: 1;
        width: auto;
        min-width: 100px;
      }

      .field-hint {
        font-size: 0.75em;
      }

      /* Compact snooze button */
      .snooze-btn {
        padding: 12px;
        font-size: 0.95em;
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
      }

      .wake-all {
        padding: 8px;
        font-size: 0.85em;
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
      }

      /* Adjust toast for mobile */
      .toast {
        bottom: 10px;
        padding: 10px 16px;
        font-size: 0.9em;
        max-width: calc(100vw - 20px);
      }
    }
  `;_getAutomations(){const e=this.hass?.states,t=this.hass?.entities;if(!e)return[];const i=e,s=this._entityRegistryFetched;if(this._lastHassStates===i&&this._automationsCacheKey===s&&this._automationsCache)return this._automationsCache;const o=Object.keys(e).filter(e=>e.startsWith("automation.")).map(i=>{const s=e[i];if(!s)return null;const o=this._entityRegistry?.[i],a=t?.[i],r=(o?.categories||{}).automation||null;return{id:i,name:s.attributes?.friendly_name||i.replace("automation.",""),area_id:o?.area_id||a?.area_id||null,category_id:r,labels:o?.labels||a?.labels||[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name));return this._automationsCache=o,this._automationsCacheKey=s,this._lastHassStates=i,o}_getFilteredAutomations(){const e=this._getAutomations(),t=this._search.toLowerCase();let i=e;return t&&(i=e.filter(e=>e.name.toLowerCase().includes(t)||e.id.toLowerCase().includes(t))),i}_formatRegistryId(e){return e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}_getAreaName(e){return e?this.hass.areas?.[e]?.name||this._formatRegistryId(e):"Unassigned"}_getLabelName(e){return this._labelRegistry[e]?.name||this._formatRegistryId(e)}_groupAutomationsBy(e,t){const i=this._getFilteredAutomations(),s={};return i.forEach(i=>{const o=e(i);o&&0!==o.length?o.forEach(e=>{s[e]||(s[e]=[]),s[e].push(i)}):(s[t]||(s[t]=[]),s[t].push(i))}),Object.entries(s).sort((e,i)=>e[0]===t?1:i[0]===t?-1:e[0].localeCompare(i[0]))}_getGroupedByArea(){return this._groupAutomationsBy(e=>e.area_id?[this._getAreaName(e.area_id)]:null,"Unassigned")}_getGroupedByLabel(){return this._groupAutomationsBy(e=>e.labels?.length>0?e.labels.map(e=>this._getLabelName(e)):null,"Unlabeled")}_getUniqueCount(e){const t=this._getAutomations(),i=new Set;return t.forEach(t=>{const s=e(t);s&&s.forEach(e=>i.add(e))}),i.size}_getAreaCount(){return this._getUniqueCount(e=>e.area_id?[e.area_id]:null)}_getLabelCount(){return this._getUniqueCount(e=>e.labels?.length>0?e.labels:null)}_getCategoryName(e){return e?this._categoryRegistry[e]?.name||this._formatRegistryId(e):"Uncategorized"}_getGroupedByCategory(){return this._groupAutomationsBy(e=>e.category_id?[this._getCategoryName(e.category_id)]:null,"Uncategorized")}_getCategoryCount(){return this._getUniqueCount(e=>e.category_id?[e.category_id]:null)}_selectAllVisible(){const e=this._getFilteredAutomations().map(e=>e.id),t=e.every(e=>this._selected.includes(e));this._selected=t?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_clearSelection(){this._selected=[]}_getPaused(){const e=this.hass?.states["sensor.autosnooze_snoozed_automations"];return e?.attributes?.paused_automations||{}}_getPausedGroupedByResumeTime(){const e=this._getPaused(),t={};return Object.entries(e).forEach(([e,i])=>{const s=i.resume_at;t[s]||(t[s]={resumeAt:s,disableAt:i.disable_at,automations:[]}),t[s].automations.push({id:e,...i})}),Object.values(t).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}_getScheduled(){const e=this.hass?.states["sensor.autosnooze_snoozed_automations"];return e?.attributes?.scheduled_snoozes||{}}_formatDateTime(e){const t=new Date(e),i=new Date,s={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return t.getFullYear()>i.getFullYear()&&(s.year="numeric"),t.toLocaleString(void 0,s)}_formatCountdown(e){const t=new Date(e).getTime()-Date.now();if(t<=0)return"Resuming...";const i=Math.floor(t/le),s=Math.floor(t%le/ne),o=Math.floor(t%ne/re),a=Math.floor(t%re/ae);return i>0?`${i}d ${s}h ${o}m`:s>0?`${s}h ${o}m ${a}s`:`${o}m ${a}s`}_toggleSelection(e){this._selected.includes(e)?this._selected=this._selected.filter(t=>t!==e):this._selected=[...this._selected,e]}_toggleGroupExpansion(e){this._expandedGroups={...this._expandedGroups,[e]:!this._expandedGroups[e]}}_selectGroup(e){const t=e.map(e=>e.id),i=t.every(e=>this._selected.includes(e));this._selected=i?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_setDuration(e){this._duration=e*re;const t=Math.floor(e/ce),i=Math.floor(e%ce/de),s=e%de;this._customDuration={days:t,hours:i,minutes:s};const o=[];t>0&&o.push(`${t}d`),i>0&&o.push(`${i}h`),s>0&&o.push(`${s}m`),this._customDurationInput=o.join(" ")||"30m"}_updateCustomDuration(){const{days:e,hours:t,minutes:i}=this._customDuration,s=e*ce+t*de+i;this._duration=s*re}_parseDurationInput(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let i=0,s=0,o=0;const a=t.match(/(\d+)\s*d/),r=t.match(/(\d+)\s*h/),n=t.match(/(\d+)\s*m/);if(a&&(i=parseInt(a[1],10)),r&&(s=parseInt(r[1],10)),n&&(o=parseInt(n[1],10)),!a&&!r&&!n){const e=parseInt(t,10);if(isNaN(e)||!(e>0))return null;o=e}return 0===i&&0===s&&0===o?null:{days:i,hours:s,minutes:o}}_handleDurationInput(e){this._customDurationInput=e;const t=this._parseDurationInput(e);t&&(this._customDuration=t,this._updateCustomDuration())}_getDurationPreview(){const e=this._parseDurationInput(this._customDurationInput);return e?this._formatDuration(e.days,e.hours,e.minutes):""}_isDurationValid(){return null!==this._parseDurationInput(this._customDurationInput)}_getErrorMessage(e,t){const i=e?.translation_key||e?.data?.translation_key;if(i&&ve[i])return ve[i];const s=e?.message||"";for(const[e,t]of Object.entries(ve))if(s.includes(e)||s.toLowerCase().includes(e.replace(/_/g," ")))return t;return`${t}. Check Home Assistant logs for details.`}_showToast(e,t={}){const{showUndo:i=!1,onUndo:s=null}=t,o=this.shadowRoot?.querySelector(".toast");o&&o.remove();const a=document.createElement("div");if(a.className="toast",a.setAttribute("role","alert"),a.setAttribute("aria-live","polite"),a.setAttribute("aria-atomic","true"),i&&s){const t=document.createElement("span");t.textContent=e,a.appendChild(t);const i=document.createElement("button");i.className="toast-undo-btn",i.textContent="Undo",i.setAttribute("aria-label","Undo last action"),i.addEventListener("click",e=>{e.stopPropagation(),s(),a.remove()}),a.appendChild(i)}else a.textContent=e;this.shadowRoot?.appendChild(a),setTimeout(()=>{a.style.animation=`slideUp ${he}ms ease-out reverse`,setTimeout(()=>a.remove(),he)},me)}_combineDateTime(e,t){if(!e||!t)return null;const i=new Date(`${e}T${t}`).getTimezoneOffset(),s=i<=0?"+":"-",o=Math.abs(i);return`${e}T${t}${`${s}${String(Math.floor(o/60)).padStart(2,"0")}:${String(o%60).padStart(2,"0")}`}`}_getLocale(){return this.hass?.locale?.language||void 0}_renderDateOptions(){const e=[],t=new Date,i=t.getFullYear(),s=this._getLocale();for(let o=0;o<365;o++){const a=new Date(t);a.setDate(a.getDate()+o);const r=a.getFullYear(),n=`${r}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,l=a.toLocaleDateString(s,{weekday:"short"}),d=a.toLocaleDateString(s,{month:"short"}),c=a.getDate(),u=r!==i?`${l}, ${d} ${c}, ${r}`:`${l}, ${d} ${c}`;e.push({value:n,label:u})}return e.map(e=>N`<option value="${e.value}">${e.label}</option>`)}_hasResumeAt(){return this._resumeAtDate&&this._resumeAtTime}_hasDisableAt(){return this._disableAtDate&&this._disableAtTime}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast("Please set a complete resume date and time (month, day, and time are all required)");const e=this._hasDisableAt()?this._combineDateTime(this._disableAtDate,this._disableAtTime):null,t=this._combineDateTime(this._resumeAtDate,this._resumeAtTime),i=Date.now()+_e,s=new Date(t).getTime();if(s<=i)return void this._showToast("Resume time must be in the future. Please select a date and time that hasn't passed yet.");if(e){if(new Date(e).getTime()>=s)return void this._showToast("Snooze time must be before resume time. The automation needs to be snoozed before it can resume.")}}else if(0===this._duration)return;this._loading=!0;try{const e=this._selected.length,t=[...this._selected],i=this._scheduleMode,s=this._hasDisableAt();let o;if(this._scheduleMode){const t=this._hasDisableAt()?this._combineDateTime(this._disableAtDate,this._disableAtTime):null,i=this._combineDateTime(this._resumeAtDate,this._resumeAtTime),s={entity_id:this._selected,resume_at:i};t&&(s.disable_at=t),await this.hass.callService("autosnooze","pause",s),o=t?`Scheduled ${e} automation${1!==e?"s":""} to snooze`:`Snoozed ${e} automation${1!==e?"s":""} until ${this._formatDateTime(i)}`}else{const{days:t,hours:i,minutes:s}=this._customDuration;await this.hass.callService("autosnooze","pause",{entity_id:this._selected,days:t,hours:i,minutes:s});const a=this._formatDuration(t,i,s);o=`Snoozed ${e} automation${1!==e?"s":""} for ${a}`}this._showToast(o,{showUndo:!0,onUndo:async()=>{try{for(const e of t)i&&s?await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:e}):await this.hass.callService("autosnooze","cancel",{entity_id:e});this._selected=t,this._showToast(`Restored ${e} automation${1!==e?"s":""}`)}catch(e){console.error("Undo failed:",e),this._showToast("Failed to undo. The automations may have already been modified.")}}}),this._selected=[],this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime=""}catch(e){console.error("Snooze failed:",e),this._showToast(this._getErrorMessage(e,"Failed to snooze automations"))}this._loading=!1}}_formatDuration(e,t,i){const s=[];return e>0&&s.push(`${e} day${1!==e?"s":""}`),t>0&&s.push(`${t} hour${1!==t?"s":""}`),i>0&&s.push(`${i} minute${1!==i?"s":""}`),s.join(", ")}async _wake(e){try{await this.hass.callService("autosnooze","cancel",{entity_id:e}),this._showToast("Automation resumed successfully")}catch(e){console.error("Wake failed:",e),this._showToast(this._getErrorMessage(e,"Failed to resume automation"))}}_handleWakeAll=async()=>{if(this._wakeAllPending){clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null,this._wakeAllPending=!1;try{await this.hass.callService("autosnooze","cancel_all",{}),this._showToast("All automations resumed successfully")}catch(e){console.error("Wake all failed:",e),this._showToast("Failed to resume automations. Check Home Assistant logs for details.")}}else this._wakeAllPending=!0,this._wakeAllTimeout=setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},pe)};async _cancelScheduled(e){try{await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:e}),this._showToast("Scheduled snooze cancelled successfully")}catch(e){console.error("Cancel scheduled failed:",e),this._showToast(this._getErrorMessage(e,"Failed to cancel scheduled snooze"))}}_renderSelectionList(){const e=this._getFilteredAutomations();if("all"===this._filterTab)return 0===e.length?N`<div class="list-empty" role="status">No automations found</div>`:e.map(e=>N`
        <div
          class="list-item ${this._selected.includes(e.id)?"selected":""}"
          @click=${()=>this._toggleSelection(e.id)}
          role="option"
          aria-selected=${this._selected.includes(e.id)}
        >
          <input
            type="checkbox"
            .checked=${this._selected.includes(e.id)}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._toggleSelection(e.id)}
            aria-label="Select ${e.name}"
          />
          <div class="list-item-content">
            <div class="list-item-name">${e.name}</div>
          </div>
        </div>
      `);const t="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===t.length?N`<div class="list-empty" role="status">No automations found</div>`:t.map(([e,t])=>{const i=!1!==this._expandedGroups[e],s=t.every(e=>this._selected.includes(e.id)),o=t.some(e=>this._selected.includes(e.id))&&!s;return N`
        <div
          class="group-header ${i?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(e)}
          role="button"
          aria-expanded=${i}
          aria-label="${e} group, ${t.length} automations"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${e}</span>
          <span class="group-badge" aria-label="${t.length} automations">${t.length}</span>
          <input
            type="checkbox"
            .checked=${s}
            .indeterminate=${o}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._selectGroup(t)}
            aria-label="Select all automations in ${e}"
          />
        </div>
        ${i?t.map(e=>{const t="labels"===this._filterTab&&e.area_id?this._getAreaName(e.area_id):null;return N`
                <div
                  class="list-item ${this._selected.includes(e.id)?"selected":""}"
                  @click=${()=>this._toggleSelection(e.id)}
                  role="option"
                  aria-selected=${this._selected.includes(e.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this._selected.includes(e.id)}
                    @click=${e=>e.stopPropagation()}
                    @change=${()=>this._toggleSelection(e.id)}
                    aria-label="Select ${e.name}"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${e.name}</div>
                    ${t?N`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline" aria-hidden="true"></ha-icon>${t}
                        </div>`:""}
                  </div>
                </div>
              `}):""}
      `})}_renderDurationSelector(e,t,i){return this._scheduleMode?N`
          <!-- Schedule Date/Time Inputs -->
          <div class="schedule-inputs">
            <div class="datetime-field">
              <label id="snooze-at-label">Snooze at:</label>
              <div class="datetime-row">
                <select
                  .value=${this._disableAtDate}
                  @change=${e=>this._disableAtDate=e.target.value}
                  aria-labelledby="snooze-at-label"
                  aria-label="Snooze date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._disableAtTime}
                  @input=${e=>this._disableAtTime=e.target.value}
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
                  @change=${e=>this._resumeAtDate=e.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._resumeAtTime}
                  @input=${e=>this._resumeAtTime=e.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume time"
                />
              </div>
            </div>
            <div class="schedule-link" @click=${()=>this._scheduleMode=!1} role="button" tabindex="0" @keypress=${e=>"Enter"===e.key&&(this._scheduleMode=!1)}>
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              Back to duration selection
            </div>
          </div>
        `:N`
          <!-- Duration Selector -->
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">Snooze Duration</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${be.map(t=>{const i=null===t.minutes?this._showCustomInput:!this._showCustomInput&&e===t;return N`
                    <button
                      class="pill ${i?"active":""}"
                      @click=${()=>{null===t.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(t.minutes))}}
                      role="radio"
                      aria-checked=${i}
                      aria-label="${null===t.minutes?"Custom duration":`Snooze for ${t.label}`}"
                    >
                      ${t.label}
                    </button>
                  `})}
            </div>

            ${this._showCustomInput?N`
              <div class="custom-duration-input">
                <input
                  type="text"
                  class="duration-input ${i?"":"invalid"}"
                  placeholder="e.g. 2h30m, 1d, 45m"
                  .value=${this._customDurationInput}
                  @input=${e=>this._handleDurationInput(e.target.value)}
                  aria-label="Custom duration"
                  aria-invalid=${!i}
                  aria-describedby="duration-help"
                />
                ${t&&i?N`<div class="duration-preview" role="status" aria-live="polite">Duration: ${t}</div>`:N`<div class="duration-help" id="duration-help">Enter duration: 30m, 2h, 4h30m, 1d, 1d2h</div>`}
              </div>
            `:""}

            <div class="schedule-link" @click=${()=>this._scheduleMode=!0} role="button" tabindex="0" @keypress=${e=>"Enter"===e.key&&(this._scheduleMode=!0)}>
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              Pick specific date/time instead
            </div>
          </div>
        `}_renderActivePauses(e){return 0===e?"":N`
      <div class="snooze-list" role="region" aria-label="Snoozed automations">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          Snoozed Automations (${e})
        </div>

        ${this._getPausedGroupedByResumeTime().map(e=>N`
            <div class="pause-group" role="group" aria-label="Automations resuming ${this._formatDateTime(e.resumeAt)}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${e.disableAt?N`Resumes ${this._formatDateTime(e.resumeAt)}`:N`<span class="countdown" data-resume-at="${e.resumeAt}" aria-label="Time remaining: ${this._formatCountdown(e.resumeAt)}">${this._formatCountdown(e.resumeAt)}</span>`}
              </div>
              ${e.automations.map(e=>N`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${e.friendly_name||e.id}</div>
                    </div>
                    <button class="wake-btn" @click=${()=>this._wake(e.id)} aria-label="Resume ${e.friendly_name||e.id}">
                      Resume
                    </button>
                  </div>
                `)}
            </div>
          `)}

        ${e>1?N`
              <button
                class="wake-all ${this._wakeAllPending?"pending":""}"
                @click=${this._handleWakeAll}
                aria-label="${this._wakeAllPending?"Confirm resume all automations":"Resume all paused automations"}"
              >
                ${this._wakeAllPending?"Confirm Resume All":"Resume All"}
              </button>
            `:""}
      </div>
    `}_renderScheduledPauses(e,t){return 0===e?"":N`
      <div class="scheduled-list" role="region" aria-label="Scheduled snoozes">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          Scheduled Snoozes (${e})
        </div>

        ${Object.entries(t).map(([e,t])=>N`
            <div class="scheduled-item" role="article" aria-label="Scheduled pause for ${t.friendly_name||e}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${t.friendly_name||e}
                </div>
                <div class="scheduled-time">
                  Disables: ${this._formatDateTime(t.disable_at||"now")}
                </div>
                <div class="paused-time">
                  Resumes: ${this._formatDateTime(t.resume_at)}
                </div>
              </div>
              <button class="cancel-scheduled-btn" @click=${()=>this._cancelScheduled(e)} aria-label="Cancel scheduled pause for ${t.friendly_name||e}">
                Cancel
              </button>
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return N``;const e=this._getPaused(),t=Object.keys(e).length,i=this._getScheduled(),s=Object.keys(i).length,o=this._customDuration.days*ce+this._customDuration.hours*de+this._customDuration.minutes,a=be.find(e=>e.minutes===o),r=this._getDurationPreview(),n=this._isDurationValid();return N`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${t>0||s>0?N`<span class="status-summary"
                >${t>0?`${t} active`:""}${t>0&&s>0?", ":""}${s>0?`${s} scheduled`:""}</span
              >`:""}
        </div>

        <!-- Section A: Snooze Setup -->
        <div class="snooze-setup">
          <!-- Filter Tabs -->
          <div class="filter-tabs" role="tablist" aria-label="Filter automations by">
            <button
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
              @input=${e=>this._handleSearchInput(e)}
              aria-label="Search automations by name"
            />
          </div>

          <!-- Selection Actions -->
          ${this._getFilteredAutomations().length>0?N`
                <div class="selection-actions" role="toolbar" aria-label="Selection actions">
                  <span role="status" aria-live="polite">${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button
                    class="select-all-btn"
                    @click=${()=>this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?"Deselect all visible automations":"Select all visible automations"}"
                  >
                    ${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?"Deselect All":"Select All"}
                  </button>
                  ${this._selected.length>0?N`<button class="select-all-btn" @click=${()=>this._clearSelection()} aria-label="Clear selection">Clear</button>`:""}
                </div>
              `:""}

          <!-- Selection List -->
          <div class="selection-list" id="selection-list" role="listbox" aria-label="Automations list" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(a,r,n)}

          <!-- Snooze Button -->
          <button
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${this._snooze}
            aria-label="${this._loading?"Snoozing automations":this._scheduleMode?`Schedule snooze for ${this._selected.length} automation${1!==this._selected.length?"s":""}`:`Snooze ${this._selected.length} automation${1!==this._selected.length?"s":""}`}"
            aria-busy=${this._loading}
          >
            ${this._loading?"Snoozing...":this._scheduleMode?"Schedule"+(this._selected.length>0?` (${this._selected.length})`:""):"Snooze"+(this._selected.length>0?` (${this._selected.length})`:"")}
          </button>
        </div>

        ${this._renderActivePauses(t)}
        ${this._renderScheduledPauses(s,i)}
      </ha-card>
    `}getCardSize(){const e=this._getPaused(),t=this._getScheduled();return 4+Object.keys(e).length+Object.keys(t).length}setConfig(e){this.config=e}}customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",fe),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",ye),window.customCards=window.customCards||[],window.customCards.some(e=>"autosnooze-card"===e.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:"Temporarily pause automations with area and label filtering (v0.2.5)",preview:!0});
