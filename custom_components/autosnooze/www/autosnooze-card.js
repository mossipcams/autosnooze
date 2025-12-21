const e=window,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=s.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&s.set(i,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new o(s,e,i)},r=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,i))(t)})(e):e;var n;const l=window,d=l.trustedTypes,c=d?d.emptyScript:"",h=l.reactiveElementPolyfillSupport,u={toAttribute(e,t){switch(t){case Boolean:e=e?c:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},p=(e,t)=>t!==e&&(t==t||e==e),m={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:p},_="finalized";let g=class extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this._$Eu()}static addInitializer(e){var t;this.finalize(),(null!==(t=this.h)&&void 0!==t?t:this.h=[]).push(e)}static get observedAttributes(){this.finalize();const e=[];return this.elementProperties.forEach((t,i)=>{const s=this._$Ep(i,t);void 0!==s&&(this._$Ev.set(s,i),e.push(s))}),e}static createProperty(e,t=m){if(t.state&&(t.attribute=!1),this.finalize(),this.elementProperties.set(e,t),!t.noAccessor&&!this.prototype.hasOwnProperty(e)){const i="symbol"==typeof e?Symbol():"__"+e,s=this.getPropertyDescriptor(e,i,t);void 0!==s&&Object.defineProperty(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){return{get(){return this[t]},set(s){const o=this[e];this[t]=s,this.requestUpdate(e,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)||m}static finalize(){if(this.hasOwnProperty(_))return!1;this[_]=!0;const e=Object.getPrototypeOf(this);if(e.finalize(),void 0!==e.h&&(this.h=[...e.h]),this.elementProperties=new Map(e.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const e=this.properties,t=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(const i of t)this.createProperty(i,e[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(r(e))}else void 0!==e&&t.push(r(e));return t}static _$Ep(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}_$Eu(){var e;this._$E_=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(e=this.constructor.h)||void 0===e||e.forEach(e=>e(this))}addController(e){var t,i;(null!==(t=this._$ES)&&void 0!==t?t:this._$ES=[]).push(e),void 0!==this.renderRoot&&this.isConnected&&(null===(i=e.hostConnected)||void 0===i||i.call(e))}removeController(e){var t;null===(t=this._$ES)||void 0===t||t.splice(this._$ES.indexOf(e)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach((e,t)=>{this.hasOwnProperty(t)&&(this._$Ei.set(t,this[t]),delete this[t])})}createRenderRoot(){var i;const s=null!==(i=this.shadowRoot)&&void 0!==i?i:this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{t?i.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet):s.forEach(t=>{const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=t.cssText,i.appendChild(s)})})(s,this.constructor.elementStyles),s}connectedCallback(){var e;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostConnected)||void 0===t?void 0:t.call(e)})}enableUpdating(e){}disconnectedCallback(){var e;null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostDisconnected)||void 0===t?void 0:t.call(e)})}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$EO(e,t,i=m){var s;const o=this.constructor._$Ep(e,i);if(void 0!==o&&!0===i.reflect){const a=(void 0!==(null===(s=i.converter)||void 0===s?void 0:s.toAttribute)?i.converter:u).toAttribute(t,i.type);this._$El=e,null==a?this.removeAttribute(o):this.setAttribute(o,a),this._$El=null}}_$AK(e,t){var i;const s=this.constructor,o=s._$Ev.get(e);if(void 0!==o&&this._$El!==o){const e=s.getPropertyOptions(o),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==(null===(i=e.converter)||void 0===i?void 0:i.fromAttribute)?e.converter:u;this._$El=o,this[o]=a.fromAttribute(t,e.type),this._$El=null}}requestUpdate(e,t,i){let s=!0;void 0!==e&&(((i=i||this.constructor.getPropertyOptions(e)).hasChanged||p)(this[e],t)?(this._$AL.has(e)||this._$AL.set(e,t),!0===i.reflect&&this._$El!==e&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(e,i))):s=!1),!this.isUpdatePending&&s&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var e;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach((e,t)=>this[t]=e),this._$Ei=void 0);let t=!1;const i=this._$AL;try{t=this.shouldUpdate(i),t?(this.willUpdate(i),null===(e=this._$ES)||void 0===e||e.forEach(e=>{var t;return null===(t=e.hostUpdate)||void 0===t?void 0:t.call(e)}),this.update(i)):this._$Ek()}catch(e){throw t=!1,this._$Ek(),e}t&&this._$AE(i)}willUpdate(e){}_$AE(e){var t;null===(t=this._$ES)||void 0===t||t.forEach(e=>{var t;return null===(t=e.hostUpdated)||void 0===t?void 0:t.call(e)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(e){return!0}update(e){void 0!==this._$EC&&(this._$EC.forEach((e,t)=>this._$EO(t,this[t],e)),this._$EC=void 0),this._$Ek()}updated(e){}firstUpdated(e){}};var b;g[_]=!0,g.elementProperties=new Map,g.elementStyles=[],g.shadowRootOptions={mode:"open"},null==h||h({ReactiveElement:g}),(null!==(n=l.reactiveElementVersions)&&void 0!==n?n:l.reactiveElementVersions=[]).push("1.6.3");const v=window,y=v.trustedTypes,f=y?y.createPolicy("lit-html",{createHTML:e=>e}):void 0,$="$lit$",A=`lit$${(Math.random()+"").slice(9)}$`,x="?"+A,w=`<${x}>`,S=document,k=()=>S.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,C=Array.isArray,E="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,P=/>/g,R=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),M=/'/g,U=/"/g,N=/^(?:script|style|textarea|title)$/i,I=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),O=Symbol.for("lit-noChange"),H=Symbol.for("lit-nothing"),F=new WeakMap,L=S.createTreeWalker(S,129,null,!1);function j(e,t){if(!Array.isArray(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==f?f.createHTML(t):t}const B=(e,t)=>{const i=e.length-1,s=[];let o,a=2===t?"<svg>":"",r=D;for(let t=0;t<i;t++){const i=e[t];let n,l,d=-1,c=0;for(;c<i.length&&(r.lastIndex=c,l=r.exec(i),null!==l);)c=r.lastIndex,r===D?"!--"===l[1]?r=z:void 0!==l[1]?r=P:void 0!==l[2]?(N.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=R):void 0!==l[3]&&(r=R):r===R?">"===l[0]?(r=null!=o?o:D,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?R:'"'===l[3]?U:M):r===U||r===M?r=R:r===z||r===P?r=D:(r=R,o=void 0);const h=r===R&&e[t+1].startsWith("/>")?" ":"";a+=r===D?i+w:d>=0?(s.push(n),i.slice(0,d)+$+i.slice(d)+A+h):i+A+(-2===d?(s.push(void 0),t):h)}return[j(e,a+(e[i]||"<?>")+(2===t?"</svg>":"")),s]};class G{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,a=0;const r=e.length-1,n=this.parts,[l,d]=B(e,t);if(this.el=G.createElement(l,i),L.currentNode=this.el.content,2===t){const e=this.el.content,t=e.firstChild;t.remove(),e.append(...t.childNodes)}for(;null!==(s=L.nextNode())&&n.length<r;){if(1===s.nodeType){if(s.hasAttributes()){const e=[];for(const t of s.getAttributeNames())if(t.endsWith($)||t.startsWith(A)){const i=d[a++];if(e.push(t),void 0!==i){const e=s.getAttribute(i.toLowerCase()+$).split(A),t=/([.?@])?(.*)/.exec(i);n.push({type:1,index:o,name:t[2],strings:e,ctor:"."===t[1]?K:"?"===t[1]?X:"@"===t[1]?Z:q})}else n.push({type:6,index:o})}for(const t of e)s.removeAttribute(t)}if(N.test(s.tagName)){const e=s.textContent.split(A),t=e.length-1;if(t>0){s.textContent=y?y.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],k()),L.nextNode(),n.push({type:2,index:++o});s.append(e[t],k())}}}else if(8===s.nodeType)if(s.data===x)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(A,e+1));)n.push({type:7,index:o}),e+=A.length-1}o++}}static createElement(e,t){const i=S.createElement("template");return i.innerHTML=e,i}}function W(e,t,i=e,s){var o,a,r,n;if(t===O)return t;let l=void 0!==s?null===(o=i._$Co)||void 0===o?void 0:o[s]:i._$Cl;const d=T(t)?void 0:t._$litDirective$;return(null==l?void 0:l.constructor)!==d&&(null===(a=null==l?void 0:l._$AO)||void 0===a||a.call(l,!1),void 0===d?l=void 0:(l=new d(e),l._$AT(e,i,s)),void 0!==s?(null!==(r=(n=i)._$Co)&&void 0!==r?r:n._$Co=[])[s]=l:i._$Cl=l),void 0!==l&&(t=W(e,l._$AS(e,t.values),l,s)),t}class V{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){var t;const{el:{content:i},parts:s}=this._$AD,o=(null!==(t=null==e?void 0:e.creationScope)&&void 0!==t?t:S).importNode(i,!0);L.currentNode=o;let a=L.nextNode(),r=0,n=0,l=s[0];for(;void 0!==l;){if(r===l.index){let t;2===l.type?t=new Y(a,a.nextSibling,this,e):1===l.type?t=new l.ctor(a,l.name,l.strings,this,e):6===l.type&&(t=new Q(a,this,e)),this._$AV.push(t),l=s[++n]}r!==(null==l?void 0:l.index)&&(a=L.nextNode(),r++)}return L.currentNode=S,o}v(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Y{constructor(e,t,i,s){var o;this.type=2,this._$AH=H,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cp=null===(o=null==s?void 0:s.isConnected)||void 0===o||o}get _$AU(){var e,t;return null!==(t=null===(e=this._$AM)||void 0===e?void 0:e._$AU)&&void 0!==t?t:this._$Cp}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===(null==e?void 0:e.nodeType)&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=W(this,e,t),T(e)?e===H||null==e||""===e?(this._$AH!==H&&this._$AR(),this._$AH=H):e!==this._$AH&&e!==O&&this._(e):void 0!==e._$litType$?this.g(e):void 0!==e.nodeType?this.$(e):(e=>C(e)||"function"==typeof(null==e?void 0:e[Symbol.iterator]))(e)?this.T(e):this._(e)}k(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}$(e){this._$AH!==e&&(this._$AR(),this._$AH=this.k(e))}_(e){this._$AH!==H&&T(this._$AH)?this._$AA.nextSibling.data=e:this.$(S.createTextNode(e)),this._$AH=e}g(e){var t;const{values:i,_$litType$:s}=e,o="number"==typeof s?this._$AC(e):(void 0===s.el&&(s.el=G.createElement(j(s.h,s.h[0]),this.options)),s);if((null===(t=this._$AH)||void 0===t?void 0:t._$AD)===o)this._$AH.v(i);else{const e=new V(o,this),t=e.u(this.options);e.v(i),this.$(t),this._$AH=e}}_$AC(e){let t=F.get(e.strings);return void 0===t&&F.set(e.strings,t=new G(e)),t}T(e){C(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new Y(this.k(k()),this.k(k()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){var t;void 0===this._$AM&&(this._$Cp=e,null===(t=this._$AP)||void 0===t||t.call(this,e))}}class q{constructor(e,t,i,s,o){this.type=1,this._$AH=H,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=H}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,i,s){const o=this.strings;let a=!1;if(void 0===o)e=W(this,e,t,0),a=!T(e)||e!==this._$AH&&e!==O,a&&(this._$AH=e);else{const s=e;let r,n;for(e=o[0],r=0;r<o.length-1;r++)n=W(this,s[i+r],t,r),n===O&&(n=this._$AH[r]),a||(a=!T(n)||n!==this._$AH[r]),n===H?e=H:e!==H&&(e+=(null!=n?n:"")+o[r+1]),this._$AH[r]=n}a&&!s&&this.j(e)}j(e){e===H?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=e?e:"")}}class K extends q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===H?void 0:e}}const J=y?y.emptyScript:"";class X extends q{constructor(){super(...arguments),this.type=4}j(e){e&&e!==H?this.element.setAttribute(this.name,J):this.element.removeAttribute(this.name)}}class Z extends q{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){var i;if((e=null!==(i=W(this,e,t,0))&&void 0!==i?i:H)===O)return;const s=this._$AH,o=e===H&&s!==H||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,a=e!==H&&(s===H||o);o&&this.element.removeEventListener(this.name,this,s),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(t=this.options)||void 0===t?void 0:t.host)&&void 0!==i?i:this.element,e):this._$AH.handleEvent(e)}}class Q{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){W(this,e)}}const ee=v.litHtmlPolyfillSupport;null==ee||ee(G,Y),(null!==(b=v.litHtmlVersions)&&void 0!==b?b:v.litHtmlVersions=[]).push("2.8.0");var te,ie;class se extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var e,t;const i=super.createRenderRoot();return null!==(e=(t=this.renderOptions).renderBefore)&&void 0!==e||(t.renderBefore=i.firstChild),i}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{var s,o;const a=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:t;let r=a._$litPart$;if(void 0===r){const e=null!==(o=null==i?void 0:i.renderBefore)&&void 0!==o?o:null;a._$litPart$=r=new Y(t.insertBefore(k(),e),e,void 0,null!=i?i:{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),null===(e=this._$Do)||void 0===e||e.setConnected(!1)}render(){return O}}se.finalized=!0,se._$litElement$=!0,null===(te=globalThis.litElementHydrateSupport)||void 0===te||te.call(globalThis,{LitElement:se});const oe=globalThis.litElementPolyfillSupport;null==oe||oe({LitElement:se}),(null!==(ie=globalThis.litElementVersions)&&void 0!==ie?ie:globalThis.litElementVersions=[]).push("3.3.3");class ae extends se{static properties={hass:{type:Object},_config:{state:!0}};static styles=a`
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
  `;constructor(){super(),this.hass={},this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const i={...this._config,[e]:t};""!==t&&null!=t||delete i[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this._config?I`
      <div class="row">
        <label>Title</label>
        <input
          type="text"
          .value=${this._config.title||""}
          @input=${e=>this._valueChanged("title",e.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:I``}}class re extends se{static properties={hass:{type:Object},config:{type:Object},_selected:{state:!0},_duration:{state:!0},_customDuration:{state:!0},_customDurationInput:{state:!0},_loading:{state:!0},_search:{state:!0},_filterTab:{state:!0},_expandedGroups:{state:!0},_scheduleMode:{state:!0},_disableAtMonth:{state:!0},_disableAtDay:{state:!0},_disableAtTime:{state:!0},_resumeAtMonth:{state:!0},_resumeAtDay:{state:!0},_resumeAtTime:{state:!0},_labelRegistry:{state:!0},_categoryRegistry:{state:!0},_entityRegistry:{state:!0},_showCustomInput:{state:!0},_automationsCache:{state:!0},_automationsCacheKey:{state:!0},_wakeAllPending:{state:!0}};constructor(){super(),this.hass={},this.config={},this._selected=[],this._duration=18e5,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAtMonth="",this._disableAtDay="",this._disableAtTime="",this._resumeAtMonth="",this._resumeAtDay="",this._resumeAtTime="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._interval=null,this._syncTimeout=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._automationsCache=null,this._automationsCacheKey=null,this._lastHassStates=null,this._searchTimeout=null,this._wakeAllPending=!1,this._wakeAllTimeout=null}connectedCallback(){super.connectedCallback(),this._interval&&(window.clearInterval(this._interval),this._interval=null),this._syncTimeout&&(window.clearTimeout(this._syncTimeout),this._syncTimeout=null),this._startSynchronizedCountdown(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry()}_startSynchronizedCountdown(){const e=1e3-Date.now()%1e3;this._syncTimeout=window.setTimeout(()=>{this._syncTimeout=null,this._updateCountdownIfNeeded(),this._interval=window.setInterval(()=>{this._updateCountdownIfNeeded()},1e3)},e)}_updateCountdownIfNeeded(){const e=this.shadowRoot?.querySelectorAll(".countdown[data-resume-at]");e&&e.length>0&&e.forEach(e=>{const t=e.dataset.resumeAt;t&&(e.textContent=this._formatCountdown(t))})}async _fetchLabelRegistry(){if(!this._labelsFetched&&this.hass?.connection)try{const e=await this.hass.connection.sendMessagePromise({type:"config/label_registry/list"}),t={};Array.isArray(e)&&e.forEach(e=>{t[e.label_id]=e}),this._labelRegistry=t,this._labelsFetched=!0}catch(e){console.warn("[AutoSnooze] Failed to fetch label registry:",e)}}async _fetchCategoryRegistry(){if(!this._categoriesFetched&&this.hass?.connection)try{const e=await this.hass.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),t={};Array.isArray(e)&&e.forEach(e=>{t[e.category_id]=e}),this._categoryRegistry=t,this._categoriesFetched=!0}catch(e){console.warn("[AutoSnooze] Failed to fetch category registry:",e)}}async _fetchEntityRegistry(){if(!this._entityRegistryFetched&&this.hass?.connection)try{const e=await this.hass.connection.sendMessagePromise({type:"config/entity_registry/list"}),t={};Array.isArray(e)&&e.filter(e=>e.entity_id.startsWith("automation.")).forEach(e=>{t[e.entity_id]=e}),this._entityRegistry=t,this._entityRegistryFetched=!0}catch(e){console.warn("[AutoSnooze] Failed to fetch entity registry:",e)}}updated(e){super.updated(e),e.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null),null!==this._syncTimeout&&(clearTimeout(this._syncTimeout),this._syncTimeout=null),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null)}_handleSearchInput(e){const t=e.target.value;clearTimeout(this._searchTimeout),this._searchTimeout=setTimeout(()=>{this._search=t},300)}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{title:"AutoSnooze"}}static styles=a`
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

    /* Year Rollover Notification */
    .year-notice {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8em;
      color: #2196f3;
      margin-top: 4px;
      padding: 4px 8px;
      background: rgba(33, 150, 243, 0.1);
      border-radius: 4px;
    }
    .year-notice ha-icon {
      --mdc-icon-size: 14px;
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
  `;_getAutomations(){const e=this.hass?.states,t=this.hass?.entities;if(!e)return[];const i=e,s=this._entityRegistryFetched;if(this._lastHassStates===i&&this._automationsCacheKey===s&&this._automationsCache)return this._automationsCache;const o=Object.keys(e).filter(e=>e.startsWith("automation.")).map(i=>{const s=e[i];if(!s)return null;const o=this._entityRegistry?.[i],a=t?.[i],r=(o?.categories||{}).automation||null;return{id:i,name:s.attributes?.friendly_name||i.replace("automation.",""),area_id:o?.area_id||a?.area_id||null,category_id:r,labels:o?.labels||a?.labels||[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name));return this._automationsCache=o,this._automationsCacheKey=s,this._lastHassStates=i,o}_getFilteredAutomations(){const e=this._getAutomations(),t=this._search.toLowerCase();let i=e;return t&&(i=e.filter(e=>e.name.toLowerCase().includes(t)||e.id.toLowerCase().includes(t))),i}_getAreaName(e){if(!e)return"Unassigned";const t=this.hass.areas?.[e];return t?.name?t.name:e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}_getLabelName(e){const t=this._labelRegistry[e];return t?.name?t.name:e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}_getGroupedByArea(){const e=this._getFilteredAutomations(),t={};return e.forEach(e=>{const i=this._getAreaName(e.area_id);t[i]||(t[i]=[]),t[i].push(e)}),Object.entries(t).sort((e,t)=>"Unassigned"===e[0]?1:"Unassigned"===t[0]?-1:e[0].localeCompare(t[0]))}_getGroupedByLabel(){const e=this._getFilteredAutomations(),t={};return e.forEach(e=>{e.labels&&0!==e.labels.length?e.labels.forEach(i=>{const s=this._getLabelName(i);t[s]||(t[s]=[]),t[s].push(e)}):(t.Unlabeled||(t.Unlabeled=[]),t.Unlabeled.push(e))}),Object.entries(t).sort((e,t)=>"Unlabeled"===e[0]?1:"Unlabeled"===t[0]?-1:e[0].localeCompare(t[0]))}_getAreaCount(){const e=this._getAutomations(),t=new Set;return e.forEach(e=>{e.area_id&&t.add(e.area_id)}),t.size}_getLabelCount(){const e=this._getAutomations(),t=new Set;return e.forEach(e=>{e.labels&&e.labels.length>0&&e.labels.forEach(e=>t.add(e))}),t.size}_getCategoryName(e){if(!e)return"Uncategorized";const t=this._categoryRegistry[e];return t?.name?t.name:e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}_getGroupedByCategory(){const e=this._getFilteredAutomations(),t={};return e.forEach(e=>{const i=this._getCategoryName(e.category_id);t[i]||(t[i]=[]),t[i].push(e)}),Object.entries(t).sort((e,t)=>"Uncategorized"===e[0]?1:"Uncategorized"===t[0]?-1:e[0].localeCompare(t[0]))}_getCategoryCount(){const e=this._getAutomations(),t=new Set;return e.forEach(e=>{e.category_id&&t.add(e.category_id)}),t.size}_selectAllVisible(){const e=this._getFilteredAutomations().map(e=>e.id),t=e.every(e=>this._selected.includes(e));this._selected=t?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_clearSelection(){this._selected=[]}_getPaused(){const e=this.hass?.states["sensor.autosnooze_snoozed_automations"];return e?.attributes?.paused_automations||{}}_getPausedGroupedByResumeTime(){const e=this._getPaused(),t={};return Object.entries(e).forEach(([e,i])=>{const s=i.resume_at;t[s]||(t[s]={resumeAt:s,disableAt:i.disable_at,automations:[]}),t[s].automations.push({id:e,...i})}),Object.values(t).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}_getScheduled(){const e=this.hass?.states["sensor.autosnooze_snoozed_automations"];return e?.attributes?.scheduled_snoozes||{}}_formatDateTime(e){const t=new Date(e),i=new Date,s={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return t.getFullYear()>i.getFullYear()&&(s.year="numeric"),t.toLocaleString(void 0,s)}_formatCountdown(e){const t=new Date(e).getTime()-Date.now();if(t<=0)return"Resuming...";const i=Math.floor(t/864e5),s=Math.floor(t%864e5/36e5),o=Math.floor(t%36e5/6e4),a=Math.floor(t%6e4/1e3);return i>0?`${i}d ${s}h ${o}m`:s>0?`${s}h ${o}m ${a}s`:`${o}m ${a}s`}_toggleSelection(e){this._selected.includes(e)?this._selected=this._selected.filter(t=>t!==e):this._selected=[...this._selected,e]}_toggleGroupExpansion(e){this._expandedGroups={...this._expandedGroups,[e]:!this._expandedGroups[e]}}_selectGroup(e){const t=e.map(e=>e.id),i=t.every(e=>this._selected.includes(e));this._selected=i?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_setDuration(e){this._duration=6e4*e;const t=Math.floor(e/1440),i=Math.floor(e%1440/60),s=e%60;this._customDuration={days:t,hours:i,minutes:s};const o=[];t>0&&o.push(`${t}d`),i>0&&o.push(`${i}h`),s>0&&o.push(`${s}m`),this._customDurationInput=o.join(" ")||"30m"}_updateCustomDuration(){const{days:e,hours:t,minutes:i}=this._customDuration,s=1440*e+60*t+i;this._duration=6e4*s}_parseDurationInput(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let i=0,s=0,o=0;const a=t.match(/(\d+)\s*d/),r=t.match(/(\d+)\s*h/),n=t.match(/(\d+)\s*m/);if(a&&(i=parseInt(a[1],10)),r&&(s=parseInt(r[1],10)),n&&(o=parseInt(n[1],10)),!a&&!r&&!n){const e=parseInt(t,10);if(isNaN(e)||!(e>0))return null;o=e}return 0===i&&0===s&&0===o?null:{days:i,hours:s,minutes:o}}_handleDurationInput(e){this._customDurationInput=e;const t=this._parseDurationInput(e);t&&(this._customDuration=t,this._updateCustomDuration())}_getDurationPreview(){const e=this._parseDurationInput(this._customDurationInput);return e?this._formatDuration(e.days,e.hours,e.minutes):""}_isDurationValid(){return null!==this._parseDurationInput(this._customDurationInput)}_showToast(e,t={}){const{showUndo:i=!1,onUndo:s=null}=t,o=this.shadowRoot?.querySelector(".toast");o&&o.remove();const a=document.createElement("div");if(a.className="toast",a.setAttribute("role","alert"),a.setAttribute("aria-live","polite"),a.setAttribute("aria-atomic","true"),i&&s){const t=document.createElement("span");t.textContent=e,a.appendChild(t);const i=document.createElement("button");i.className="toast-undo-btn",i.textContent="Undo",i.setAttribute("aria-label","Undo last action"),i.addEventListener("click",e=>{e.stopPropagation(),s(),a.remove()}),a.appendChild(i)}else a.textContent=e;this.shadowRoot?.appendChild(a),setTimeout(()=>{a.style.animation="slideUp 0.3s ease-out reverse",setTimeout(()=>a.remove(),300)},5e3)}_combineDateTime(e,t,i,s=null){if(!e||!t||!i)return null;const o=new Date;let a=o.getFullYear();const r=e.padStart(2,"0"),n=t.padStart(2,"0");new Date(`${a}-${r}-${n}T${i}`).getTime()<o.getTime()-6e4&&(a+=1);let l=`${a}-${r}-${n}T${i}`;if(s){new Date(l).getTime()<=new Date(s).getTime()&&(a+=1,l=`${a}-${r}-${n}T${i}`)}return l}_getScheduleYearInfo(e,t,i,s=null){if(!e||!t||!i)return null;const o=new Date,a=o.getFullYear();let r=a;const n=e.padStart(2,"0"),l=t.padStart(2,"0");if(new Date(`${r}-${n}-${l}T${i}`).getTime()<o.getTime()-6e4&&(r+=1),s){new Date(`${r}-${n}-${l}T${i}`).getTime()<=new Date(s).getTime()&&(r+=1)}return{year:r,isNextYear:r>a}}_hasResumeAt(){return this._resumeAtMonth&&this._resumeAtDay&&this._resumeAtTime}_hasDisableAt(){return this._disableAtMonth&&this._disableAtDay&&this._disableAtTime}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast("Please set a complete resume date and time (month, day, and time are all required)");const e=this._hasDisableAt()?this._combineDateTime(this._disableAtMonth,this._disableAtDay,this._disableAtTime):null,t=this._combineDateTime(this._resumeAtMonth,this._resumeAtDay,this._resumeAtTime,e),i=Date.now(),s=new Date(t).getTime();if(s<=i)return void this._showToast("Resume time must be in the future. Please select a date and time that hasn't passed yet.");if(e){if(new Date(e).getTime()>=s)return void this._showToast("Pause time must be before resume time. The automation needs to be paused before it can resume.")}}else if(0===this._duration)return;this._loading=!0;try{const e=this._selected.length,t=[...this._selected],i=this._scheduleMode,s=this._hasDisableAt();let o;if(this._scheduleMode){const t=this._hasDisableAt()?this._combineDateTime(this._disableAtMonth,this._disableAtDay,this._disableAtTime):null,i=this._combineDateTime(this._resumeAtMonth,this._resumeAtDay,this._resumeAtTime,t),s={entity_id:this._selected,resume_at:i};t&&(s.disable_at=t),await this.hass.callService("autosnooze","pause",s),o=t?`Scheduled ${e} automation${1!==e?"s":""} to pause`:`Paused ${e} automation${1!==e?"s":""} until ${this._formatDateTime(i)}`}else{const{days:t,hours:i,minutes:s}=this._customDuration;await this.hass.callService("autosnooze","pause",{entity_id:this._selected,days:t,hours:i,minutes:s});const a=this._formatDuration(t,i,s);o=`Paused ${e} automation${1!==e?"s":""} for ${a}`}this._showToast(o,{showUndo:!0,onUndo:async()=>{try{for(const e of t)i&&s?await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:e}):await this.hass.callService("autosnooze","cancel",{entity_id:e});this._selected=t,this._showToast(`Restored ${e} automation${1!==e?"s":""}`)}catch(e){console.error("Undo failed:",e),this._showToast("Failed to undo. The automations may have already been modified.")}}}),this._selected=[],this._disableAtMonth="",this._disableAtDay="",this._disableAtTime="",this._resumeAtMonth="",this._resumeAtDay="",this._resumeAtTime=""}catch(e){console.error("Snooze failed:",e);const t=e?.message||"";t.includes("not an automation")?this._showToast("Failed to pause: One or more selected items are not automations"):t.includes("duration")||t.includes("Duration")?this._showToast("Failed to pause: Please specify a valid duration (days, hours, or minutes)"):t.includes("future")?this._showToast("Failed to pause: Resume time must be in the future"):t.includes("before resume")?this._showToast("Failed to pause: Pause time must be before resume time"):this._showToast("Failed to pause automations. Check Home Assistant logs for details.")}this._loading=!1}}_formatDuration(e,t,i){const s=[];return e>0&&s.push(`${e} day${1!==e?"s":""}`),t>0&&s.push(`${t} hour${1!==t?"s":""}`),i>0&&s.push(`${i} minute${1!==i?"s":""}`),s.join(", ")}async _wake(e){try{await this.hass.callService("autosnooze","cancel",{entity_id:e}),this._showToast("Automation resumed successfully")}catch(e){console.error("Wake failed:",e);(e?.message||"").includes("not snoozed")?this._showToast("This automation is not currently paused"):this._showToast("Failed to resume automation. Check Home Assistant logs for details.")}}_handleWakeAll=async()=>{if(this._wakeAllPending){clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null,this._wakeAllPending=!1;try{await this.hass.callService("autosnooze","cancel_all",{}),this._showToast("All automations resumed successfully")}catch(e){console.error("Wake all failed:",e),this._showToast("Failed to resume automations. Check Home Assistant logs for details.")}}else this._wakeAllPending=!0,this._wakeAllTimeout=setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},3e3)};async _cancelScheduled(e){try{await this.hass.callService("autosnooze","cancel_scheduled",{entity_id:e}),this._showToast("Scheduled pause cancelled successfully")}catch(e){console.error("Cancel scheduled failed:",e);(e?.message||"").includes("no scheduled")?this._showToast("This automation has no scheduled pause to cancel"):this._showToast("Failed to cancel scheduled pause. Check Home Assistant logs for details.")}}_renderMonthOptions(){return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((e,t)=>I`<option value="${t+1}">${e}</option>`)}_renderDayOptions(){return Array.from({length:31},(e,t)=>I`<option value="${t+1}">${t+1}</option>`)}_renderSelectionList(){const e=this._getFilteredAutomations();if("all"===this._filterTab)return 0===e.length?I`<div class="list-empty" role="status">No automations found</div>`:e.map(e=>I`
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
      `);const t="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===t.length?I`<div class="list-empty" role="status">No automations found</div>`:t.map(([e,t])=>{const i=!1!==this._expandedGroups[e],s=t.every(e=>this._selected.includes(e.id)),o=t.some(e=>this._selected.includes(e.id))&&!s;return I`
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
        ${i?t.map(e=>{const t="labels"===this._filterTab&&e.area_id?this._getAreaName(e.area_id):null;return I`
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
                    ${t?I`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline" aria-hidden="true"></ha-icon>${t}
                        </div>`:""}
                  </div>
                </div>
              `}):""}
      `})}render(){if(!this.hass||!this.config)return I``;const e=this._getPaused(),t=Object.keys(e).length,i=this._getScheduled(),s=Object.keys(i).length,o=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],a=1440*this._customDuration.days+60*this._customDuration.hours+this._customDuration.minutes,r=o.find(e=>e.minutes===a),n=this._getDurationPreview(),l=this._isDurationValid();return I`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${t>0||s>0?I`<span class="status-summary"
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
          ${this._getFilteredAutomations().length>0?I`
                <div class="selection-actions" role="toolbar" aria-label="Selection actions">
                  <span role="status" aria-live="polite">${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button
                    class="select-all-btn"
                    @click=${()=>this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?"Deselect all visible automations":"Select all visible automations"}"
                  >
                    ${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?"Deselect All":"Select All"}
                  </button>
                  ${this._selected.length>0?I`<button class="select-all-btn" @click=${()=>this._clearSelection()} aria-label="Clear selection">Clear</button>`:""}
                </div>
              `:""}

          <!-- Selection List -->
          <div class="selection-list" id="selection-list" role="listbox" aria-label="Automations list" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._scheduleMode?I`
                <!-- Schedule Date/Time Inputs -->
                ${(()=>{const e=this._getScheduleYearInfo(this._disableAtMonth,this._disableAtDay,this._disableAtTime),t=this._hasDisableAt()?this._combineDateTime(this._disableAtMonth,this._disableAtDay,this._disableAtTime):null,i=this._getScheduleYearInfo(this._resumeAtMonth,this._resumeAtDay,this._resumeAtTime,t);return I`
                    <div class="schedule-inputs">
                      <div class="datetime-field">
                        <label id="pause-at-label">Pause at:</label>
                        <div class="datetime-row">
                          <select
                            .value=${this._disableAtMonth}
                            @change=${e=>this._disableAtMonth=e.target.value}
                            aria-labelledby="pause-at-label"
                            aria-label="Pause month"
                          >
                            <option value="">Month</option>
                            ${this._renderMonthOptions()}
                          </select>
                          <select
                            .value=${this._disableAtDay}
                            @change=${e=>this._disableAtDay=e.target.value}
                            aria-labelledby="pause-at-label"
                            aria-label="Pause day"
                          >
                            <option value="">Day</option>
                            ${this._renderDayOptions()}
                          </select>
                          <input
                            type="time"
                            .value=${this._disableAtTime}
                            @input=${e=>this._disableAtTime=e.target.value}
                            aria-labelledby="pause-at-label"
                            aria-label="Pause time"
                          />
                        </div>
                        <span class="field-hint">Leave empty to pause immediately</span>
                        ${e?.isNextYear?I`<span class="year-notice" role="status" aria-live="polite">
                              <ha-icon icon="mdi:calendar-arrow-right"></ha-icon>
                              Will be scheduled for ${e.year}
                            </span>`:""}
                      </div>
                      <div class="datetime-field">
                        <label id="resume-at-label">Resume at:</label>
                        <div class="datetime-row">
                          <select
                            .value=${this._resumeAtMonth}
                            @change=${e=>this._resumeAtMonth=e.target.value}
                            aria-labelledby="resume-at-label"
                            aria-label="Resume month"
                          >
                            <option value="">Month</option>
                            ${this._renderMonthOptions()}
                          </select>
                          <select
                            .value=${this._resumeAtDay}
                            @change=${e=>this._resumeAtDay=e.target.value}
                            aria-labelledby="resume-at-label"
                            aria-label="Resume day"
                          >
                            <option value="">Day</option>
                            ${this._renderDayOptions()}
                          </select>
                          <input
                            type="time"
                            .value=${this._resumeAtTime}
                            @input=${e=>this._resumeAtTime=e.target.value}
                            aria-labelledby="resume-at-label"
                            aria-label="Resume time"
                          />
                        </div>
                        ${i?.isNextYear?I`<span class="year-notice" role="status" aria-live="polite">
                              <ha-icon icon="mdi:calendar-arrow-right"></ha-icon>
                              Will resume in ${i.year}
                            </span>`:""}
                      </div>
                      <div class="schedule-link" @click=${()=>this._scheduleMode=!1} role="button" tabindex="0" @keypress=${e=>"Enter"===e.key&&(this._scheduleMode=!1)}>
                        <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                        Back to duration selection
                      </div>
                    </div>
                  `})()}
              `:I`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-section-header" id="duration-header">Pause Duration</div>
                  <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
                    ${o.map(e=>{const t=null===e.minutes?this._showCustomInput:!this._showCustomInput&&r===e;return I`
                          <button
                            class="pill ${t?"active":""}"
                            @click=${()=>{null===e.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(e.minutes))}}
                            role="radio"
                            aria-checked=${t}
                            aria-label="${null===e.minutes?"Custom duration":`Pause for ${e.label}`}"
                          >
                            ${e.label}
                          </button>
                        `})}
                  </div>

                  ${this._showCustomInput?I`
                    <div class="custom-duration-input">
                      <input
                        type="text"
                        class="duration-input ${l?"":"invalid"}"
                        placeholder="e.g. 2h30m, 1d, 45m"
                        .value=${this._customDurationInput}
                        @input=${e=>this._handleDurationInput(e.target.value)}
                        aria-label="Custom duration"
                        aria-invalid=${!l}
                        aria-describedby="duration-help"
                      />
                      ${n&&l?I`<div class="duration-preview" role="status" aria-live="polite">Duration: ${n}</div>`:I`<div class="duration-help" id="duration-help">Enter duration: 30m, 2h, 4h30m, 1d, 1d2h</div>`}
                    </div>
                  `:""}

                  <div class="schedule-link" @click=${()=>this._scheduleMode=!0} role="button" tabindex="0" @keypress=${e=>"Enter"===e.key&&(this._scheduleMode=!0)}>
                    <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
                    Pick specific date/time instead
                  </div>
                </div>
              `}

          <!-- Pause Button -->
          <button
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${this._snooze}
            aria-label="${this._loading?"Pausing automations":this._scheduleMode?`Schedule pause for ${this._selected.length} automation${1!==this._selected.length?"s":""}`:`Pause ${this._selected.length} automation${1!==this._selected.length?"s":""}`}"
            aria-busy=${this._loading}
          >
            ${this._loading?"Pausing...":this._scheduleMode?"Schedule"+(this._selected.length>0?` (${this._selected.length})`:""):"Pause"+(this._selected.length>0?` (${this._selected.length})`:"")}
          </button>
        </div>

        <!-- Section B: Active Pauses -->
        ${t>0?I`
              <div class="snooze-list" role="region" aria-label="Paused automations">
                <div class="list-header">
                  <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
                  Paused Automations (${t})
                </div>

                ${this._getPausedGroupedByResumeTime().map(e=>I`
                    <div class="pause-group" role="group" aria-label="Automations resuming ${this._formatDateTime(e.resumeAt)}">
                      <div class="pause-group-header">
                        <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                        ${e.disableAt?I`Resumes ${this._formatDateTime(e.resumeAt)}`:I`<span class="countdown" data-resume-at="${e.resumeAt}" aria-label="Time remaining: ${this._formatCountdown(e.resumeAt)}">${this._formatCountdown(e.resumeAt)}</span>`}
                      </div>
                      ${e.automations.map(e=>I`
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

                ${t>1?I`
                      <button
                        class="wake-all ${this._wakeAllPending?"pending":""}"
                        @click=${this._handleWakeAll}
                        aria-label="${this._wakeAllPending?"Confirm resume all automations":"Resume all paused automations"}"
                      >
                        ${this._wakeAllPending?"Confirm Resume All":"Resume All"}
                      </button>
                    `:""}
              </div>
            `:""}

        <!-- Section C: Scheduled Pauses -->
        ${s>0?I`
              <div class="scheduled-list" role="region" aria-label="Scheduled pauses">
                <div class="list-header">
                  <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
                  Scheduled Pauses (${s})
                </div>

                ${Object.entries(i).map(([e,t])=>I`
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
            `:""}
      </ha-card>
    `}getCardSize(){const e=this._getPaused(),t=this._getScheduled();return 4+Object.keys(e).length+Object.keys(t).length}setConfig(e){this.config=e}}customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",ae),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",re),window.customCards=window.customCards||[],window.customCards.some(e=>"autosnooze-card"===e.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:"Temporarily pause automations with area and label filtering (v0.2.1)",preview:!0});
