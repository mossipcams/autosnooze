function t(t,e,i,o){var r,s=arguments.length,a=s<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,i,o);else for(var n=t.length-1;n>=0;n--)(r=t[n])&&(a=(s<3?r(a):s>3?r(e,i,a):r(e,i))||a);return s>3&&a&&Object.defineProperty(e,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let s=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[o+1],t[0]);return new s(i,t,o)},n=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new s("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:l,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:u,getPrototypeOf:p}=Object,m=globalThis,g=m.trustedTypes,b=g?g.emptyScript:"",f=m.reactiveElementPolyfillSupport,_=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?b:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>!l(t,e),y={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(t,i,e);void 0!==o&&d(this.prototype,t,o)}}static getPropertyDescriptor(t,e,i){const{get:o,set:r}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const s=o?.call(this);r?.call(this,e),this.requestUpdate(t,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...u(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(i)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of o){const o=document.createElement("style"),r=e.litNonce;void 0!==r&&o.setAttribute("nonce",r),o.textContent=i.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:x).toAttribute(e,i.type);this._$Em=t,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(t,e){const i=this.constructor,o=i._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=i.getPropertyOptions(o),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const s=r.fromAttribute(e,t.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(t,e,i,o=!1,r){if(void 0!==t){const s=this.constructor;if(!1===o&&(r=this[t]),i??=s.getPropertyOptions(t),!((i.hasChanged??v)(r,e)||i.useDefault&&i.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(s._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,s??e??this[t]),!0!==r||void 0!==s)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,i,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[_("elementProperties")]=new Map,$[_("finalized")]=new Map,f?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,k=w.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,z="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+T,E=`<${C}>`,D=document,R=()=>D.createComment(""),P=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,F="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,O=/-->/g,N=/>/g,H=RegExp(`>|${F}(?:([^\\s"'>=/]+)(${F}*=${F}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,I=/"/g,j=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),G=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),V=new WeakMap,Y=D.createTreeWalker(D,129);function q(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,o=[];let r,s=2===e?"<svg>":3===e?"<math>":"",a=U;for(let e=0;e<i;e++){const i=t[e];let n,l,d=-1,c=0;for(;c<i.length&&(a.lastIndex=c,l=a.exec(i),null!==l);)c=a.lastIndex,a===U?"!--"===l[1]?a=O:void 0!==l[1]?a=N:void 0!==l[2]?(j.test(l[2])&&(r=RegExp("</"+l[2],"g")),a=H):void 0!==l[3]&&(a=H):a===H?">"===l[0]?(a=r??U,d=-1):void 0===l[1]?d=-2:(d=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?H:'"'===l[3]?I:L):a===I||a===L?a=H:a===O||a===N?a=U:(a=H,r=void 0);const h=a===H&&t[e+1].startsWith("/>")?" ":"";s+=a===U?i+E:d>=0?(o.push(n),i.slice(0,d)+z+i.slice(d)+T+h):i+T+(-2===d?e:h)}return[q(t,s+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class X{constructor({strings:t,_$litType$:e},i){let o;this.parts=[];let r=0,s=0;const a=t.length-1,n=this.parts,[l,d]=K(t,e);if(this.el=X.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Y.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(z)){const e=d[s++],i=o.getAttribute(t).split(T),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:r,name:a[2],strings:i,ctor:"."===a[1]?et:"?"===a[1]?it:"@"===a[1]?ot:tt}),o.removeAttribute(t)}else t.startsWith(T)&&(n.push({type:6,index:r}),o.removeAttribute(t));if(j.test(o.tagName)){const t=o.textContent.split(T),e=t.length-1;if(e>0){o.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)o.append(t[i],R()),Y.nextNode(),n.push({type:2,index:++r});o.append(t[e],R())}}}else if(8===o.nodeType)if(o.data===C)n.push({type:2,index:r});else{let t=-1;for(;-1!==(t=o.data.indexOf(T,t+1));)n.push({type:7,index:r}),t+=T.length-1}r++}}static createElement(t,e){const i=D.createElement("template");return i.innerHTML=t,i}}function J(t,e,i=t,o){if(e===G)return e;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=P(e)?void 0:e._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(t),r._$AT(t,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(e=J(t,r._$AS(t,e.values),r,o)),e}class Z{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,o=(t?.creationScope??D).importNode(e,!0);Y.currentNode=o;let r=Y.nextNode(),s=0,a=0,n=i[0];for(;void 0!==n;){if(s===n.index){let e;2===n.type?e=new Q(r,r.nextSibling,this,t):1===n.type?e=new n.ctor(r,n.name,n.strings,this,t):6===n.type&&(e=new rt(r,this,t)),this._$AV.push(e),n=i[++a]}s!==n?.index&&(r=Y.nextNode(),s++)}return Y.currentNode=D,o}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,o){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=J(this,t,e),P(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&P(this._$AH)?this._$AA.nextSibling.data=t:this.T(D.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,o="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=X.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new Z(o,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new X(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,o=0;for(const r of t)o===e.length?e.push(i=new Q(this.O(R()),this.O(R()),this,this.options)):i=e[o],i._$AI(r),o++;o<e.length&&(this._$AR(i&&i._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,o,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,o){const r=this.strings;let s=!1;if(void 0===r)t=J(this,t,e,0),s=!P(t)||t!==this._$AH&&t!==G,s&&(this._$AH=t);else{const o=t;let a,n;for(t=r[0],a=0;a<r.length-1;a++)n=J(this,o[i+a],e,a),n===G&&(n=this._$AH[a]),s||=!P(n)||n!==this._$AH[a],n===W?t=W:t!==W&&(t+=(n??"")+r[a+1]),this._$AH[a]=n}s&&!o&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class ot extends tt{constructor(t,e,i,o,r){super(t,e,i,o,r),this.type=5}_$AI(t,e=this){if((t=J(this,t,e,0)??W)===G)return;const i=this._$AH,o=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,r=t!==W&&(i===W||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){J(this,t)}}const st=w.litHtmlPolyfillSupport;st?.(X,Q),(w.litHtmlVersions??=[]).push("3.3.2");const at=globalThis;class nt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const o=i?.renderBefore??e;let r=o._$litPart$;if(void 0===r){const t=i?.renderBefore??null;o._$litPart$=r=new Q(e.insertBefore(R(),t),t,void 0,i??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}nt._$litElement$=!0,nt.finalized=!0,at.litElementHydrateSupport?.({LitElement:nt});const lt=at.litElementPolyfillSupport;lt?.({LitElement:nt}),(at.litElementVersions??=[]).push("4.2.2");const dt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:v},ct=(t=dt,e,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),s.set(i.name,t),"accessor"===o){const{name:o}=i;return{set(i){const r=e.get.call(this);e.set.call(this,i),this.requestUpdate(o,r,t,!0,i)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];e.call(this,i),this.requestUpdate(o,r,t,!0,i)}}throw Error("Unsupported decorator location: "+o)};function ht(t){return(e,i)=>"object"==typeof i?ct(t,e,i):((t,e,i)=>{const o=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),o?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return ht({...t,state:!0,attribute:!1})}const pt=a`
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
      color: var(--primary-text-color);
      font-size: 0.85em;
      border-bottom: 1px solid var(--divider-color);
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
      color: #ff9800;
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
      color: var(--primary-text-color);
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

    /* Mobile Responsive Styles - Refined Utility Aesthetic */
    @media (max-width: 480px) {
      ha-card {
        padding: 14px;
        background: linear-gradient(
          180deg,
          var(--card-background-color) 0%,
          color-mix(in srgb, var(--card-background-color) 97%, var(--primary-color)) 100%
        );
      }

      /* --- Header: Compact with visual weight --- */
      .header {
        font-size: 1.05em;
        font-weight: 600;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        letter-spacing: -0.01em;
      }

      .header ha-icon {
        --mdc-icon-size: 22px;
        opacity: 0.9;
      }

      .status-summary {
        font-size: 0.7em;
        font-weight: 500;
        padding: 4px 10px;
        background: color-mix(in srgb, var(--primary-color) 12%, transparent);
        border-radius: 12px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      /* --- Filter Tabs: Segmented control style --- */
      .filter-tabs {
        gap: 2px;
        margin-bottom: 14px;
        padding: 3px;
        background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--divider-color));
        border-radius: 14px;
        border-bottom: none;
        padding-bottom: 3px;
      }

      .tab {
        padding: 8px 6px;
        font-size: 0.82em;
        font-weight: 500;
        border-radius: 11px;
        min-height: 40px;
        flex: 1 1 0;
        justify-content: center;
        border: none;
        background: transparent;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        gap: 4px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .tab:hover:not(.active) {
        background: color-mix(in srgb, var(--card-background-color) 50%, transparent);
      }

      .tab.active {
        background: var(--card-background-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tab-count {
        padding: 2px 5px;
        font-size: 0.72em;
        font-weight: 600;
        background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        border-radius: 6px;
        min-width: 18px;
        text-align: center;
      }

      .tab.active .tab-count {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        color: var(--primary-color);
      }

      /* --- Search: Refined input with subtle depth --- */
      .search-box {
        margin-bottom: 14px;
      }

      .search-box input {
        padding: 13px 14px;
        font-size: 0.9em;
        min-height: 46px;
        border-radius: 12px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
      }

      .search-box input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .search-box input::placeholder {
        color: var(--secondary-text-color);
        opacity: 0.6;
      }

      /* --- Selection Actions: Refined toolbar --- */
      .selection-actions {
        padding: 10px 14px;
        margin-bottom: 12px;
        font-size: 0.85em;
        gap: 10px;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--secondary-background-color) 90%, var(--primary-color)) 0%,
          var(--secondary-background-color) 100%
        );
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }

      .selection-actions span {
        font-weight: 500;
        color: var(--primary-text-color);
        opacity: 0.8;
      }

      .select-all-btn {
        padding: 8px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 38px;
        border-radius: 8px;
        border: 1.5px solid color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
        background: var(--card-background-color);
        transition: all 0.15s ease;
      }

      .select-all-btn:hover {
        background: var(--primary-color);
        border-color: var(--primary-color);
      }

      /* --- Selection List: Card-style items with depth --- */
      .selection-list {
        max-height: min(200px, 35dvh);
        margin-bottom: 16px;
        border-radius: 14px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        background: var(--card-background-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      .list-item {
        padding: 14px;
        gap: 12px;
        min-height: 52px;
        border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
        transition: background 0.15s ease, transform 0.1s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .list-item:active {
        transform: scale(0.985);
        background: color-mix(in srgb, var(--primary-color) 6%, transparent);
      }

      .list-item:last-child {
        border-bottom: none;
      }

      .list-item.selected {
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--primary-color) 8%, transparent) 0%,
          color-mix(in srgb, var(--primary-color) 4%, transparent) 100%
        );
      }

      .list-item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        border-radius: 6px;
      }

      .list-item-name {
        font-size: 0.9em;
        font-weight: 500;
        letter-spacing: -0.01em;
      }

      .list-item-meta {
        font-size: 0.72em;
        opacity: 0.7;
        margin-top: 3px;
      }

      .group-header {
        padding: 12px 14px;
        font-size: 0.85em;
        font-weight: 600;
        min-height: 48px;
        background: linear-gradient(
          180deg,
          var(--secondary-background-color) 0%,
          color-mix(in srgb, var(--secondary-background-color) 90%, var(--divider-color)) 100%
        );
        letter-spacing: -0.01em;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .group-header:active {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--secondary-background-color) 95%, var(--primary-color)) 0%,
          color-mix(in srgb, var(--secondary-background-color) 85%, var(--divider-color)) 100%
        );
      }

      .group-badge {
        font-size: 0.72em;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 8px;
      }

      /* --- Section Separator --- */
      .snooze-setup {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      /* --- Duration Selector: Pill-style chips --- */
      .duration-section-header {
        font-size: 0.8em;
        font-weight: 600;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        opacity: 0.7;
      }

      .duration-pills {
        gap: 8px;
        margin-bottom: 12px;
      }

      .pill {
        padding: 11px 16px;
        font-size: 0.88em;
        font-weight: 500;
        border-radius: 24px;
        min-height: 44px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 80%, transparent);
        background: var(--card-background-color);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .pill:active:not(.active) {
        transform: scale(0.95);
      }

      .pill:hover:not(.active) {
        border-color: var(--primary-color);
        transform: translateY(-1px);
      }

      .pill.active {
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        transform: translateY(-1px);
      }

      .duration-input {
        padding: 13px 14px;
        font-size: 0.9em;
        min-height: 46px;
        border-radius: 12px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
      }

      .duration-input:focus {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .duration-help {
        font-size: 0.72em;
        opacity: 0.6;
        margin-top: 6px;
      }

      .duration-preview {
        font-size: 0.78em;
        font-weight: 600;
        margin-top: 6px;
        padding: 6px 10px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        border-radius: 6px;
        display: inline-block;
      }

      .schedule-link {
        margin-top: 14px;
        padding: 10px 6px;
        font-size: 0.85em;
        font-weight: 500;
        min-height: 44px;
        opacity: 0.8;
        transition: opacity 0.15s ease;
      }

      .schedule-link:hover {
        opacity: 1;
      }

      /* --- Schedule Inputs: Refined form layout --- */
      .schedule-inputs {
        padding: 14px;
        gap: 14px;
        margin-bottom: 14px;
        border-radius: 14px;
        background: linear-gradient(
          180deg,
          var(--secondary-background-color) 0%,
          color-mix(in srgb, var(--secondary-background-color) 95%, var(--divider-color)) 100%
        );
        border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }

      .datetime-field label {
        font-size: 0.8em;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        opacity: 0.7;
      }

      .datetime-row {
        flex-wrap: nowrap;
        gap: 8px;
      }

      .datetime-row select {
        flex: 1;
        min-width: 0;
        min-height: 46px;
        padding: 10px 12px;
        font-size: 0.9em;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
      }

      .datetime-row input[type="time"] {
        flex: 0 0 auto;
        width: 105px;
        min-height: 46px;
        padding: 10px 10px;
        font-size: 0.9em;
        font-weight: 500;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
        background: var(--card-background-color);
      }

      .datetime-row select:focus,
      .datetime-row input:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
      }

      .field-hint {
        font-size: 0.7em;
        opacity: 0.6;
        font-style: italic;
      }

      /* --- Main Action Button: Prominent with depth --- */
      .snooze-btn {
        padding: 16px;
        font-size: 1em;
        min-height: 56px;
        font-weight: 700;
        border-radius: 14px;
        letter-spacing: 0.01em;
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
        box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 25%, transparent),
                    0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 6px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .snooze-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px color-mix(in srgb, var(--primary-color) 35%, transparent),
                    0 3px 6px rgba(0, 0, 0, 0.12);
      }

      .snooze-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 20%, transparent),
                    0 1px 2px rgba(0, 0, 0, 0.08);
      }

      .snooze-btn:disabled {
        background: var(--disabled-color, #9e9e9e);
        box-shadow: none;
      }

      /* --- Active Snoozes Section: Warm accent with depth --- */
      .snooze-list {
        padding: 14px;
        margin-top: 24px;
        border-radius: 16px;
        border: 2px solid #ff9800;
        background: linear-gradient(
          180deg,
          rgba(255, 152, 0, 0.06) 0%,
          rgba(255, 152, 0, 0.02) 100%
        );
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.08);
      }

      .list-header {
        font-size: 0.95em;
        font-weight: 700;
        margin-bottom: 14px;
        gap: 8px;
        letter-spacing: -0.01em;
      }

      .list-header ha-icon {
        --mdc-icon-size: 20px;
      }

      .pause-group {
        margin-bottom: 10px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }

      .pause-group-header {
        padding: 12px 14px;
        font-size: 0.85em;
        font-weight: 600;
        background: var(--secondary-background-color);
      }

      .pause-group-header .countdown {
        font-size: 1em;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      /* Paused items */
      .paused-item {
        padding: 12px 14px;
        gap: 12px;
        background: var(--card-background-color);
      }

      .paused-icon {
        --mdc-icon-size: 18px;
        opacity: 0.5;
      }

      .paused-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .paused-name {
        font-size: 0.9em;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .paused-time {
        font-size: 0.72em;
        opacity: 0.6;
        margin-top: 2px;
      }

      /* Wake button */
      .wake-btn {
        padding: 8px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 36px;
        flex-shrink: 0;
        align-self: center;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, #4caf50 60%, var(--divider-color));
        background: var(--card-background-color);
        color: #4caf50;
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .wake-btn:active {
        transform: scale(0.95);
      }

      .wake-btn:hover {
        background: #4caf50;
        color: white;
        border-color: #4caf50;
      }

      .wake-all {
        padding: 14px;
        font-size: 0.9em;
        font-weight: 600;
        min-height: 50px;
        margin-top: 12px;
        border-radius: 12px;
        border: 2px solid #ff9800;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .wake-all:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
      }

      .wake-all.pending {
        animation: pulse-orange 1.5s infinite;
      }

      @keyframes pulse-orange {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
      }

      /* --- Scheduled Section: Cool accent with depth --- */
      .scheduled-list {
        padding: 14px;
        margin-top: 14px;
        border-radius: 16px;
        border: 2px solid #2196f3;
        background: linear-gradient(
          180deg,
          rgba(33, 150, 243, 0.06) 0%,
          rgba(33, 150, 243, 0.02) 100%
        );
        box-shadow: 0 4px 16px rgba(33, 150, 243, 0.08);
      }

      .scheduled-list .list-header ha-icon {
        color: #2196f3;
      }

      .scheduled-item {
        flex-wrap: nowrap;
        padding: 14px;
        gap: 12px;
        margin-bottom: 10px;
        align-items: center;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }

      .scheduled-item:last-of-type {
        margin-bottom: 14px;
      }

      .scheduled-icon {
        display: block;
        flex-shrink: 0;
        --mdc-icon-size: 18px;
        opacity: 0.8;
      }

      .scheduled-time {
        font-size: 0.72em;
        font-weight: 600;
        color: #2196f3;
      }

      .cancel-scheduled-btn {
        padding: 10px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 40px;
        flex-shrink: 0;
        border-radius: 10px;
        border: 1.5px solid color-mix(in srgb, #f44336 60%, var(--divider-color));
        background: var(--card-background-color);
        color: #f44336;
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .cancel-scheduled-btn:active {
        transform: scale(0.95);
      }

      .cancel-scheduled-btn:hover {
        background: #f44336;
        color: white;
        border-color: #f44336;
      }

      /* --- Toast: Refined notification --- */
      .toast {
        bottom: 20px;
        padding: 14px 18px;
        font-size: 0.9em;
        font-weight: 500;
        max-width: calc(100vw - 32px);
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2),
                    0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(8px);
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
      }

      .toast-undo-btn {
        padding: 8px 14px;
        min-height: 36px;
        font-size: 0.85em;
        font-weight: 600;
        border-radius: 8px;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        transition: all 0.15s ease;
      }

      .toast-undo-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
      }

      /* --- Empty States: Refined messaging --- */
      .list-empty,
      .empty {
        padding: 28px 20px;
        font-size: 0.9em;
        opacity: 0.6;
        font-style: italic;
      }
    }
`,mt=1e3,gt=6e4,bt=36e5,ft=864e5,_t=60,xt=1440,vt=300,yt=300,$t=3e3,wt=5e3,At=1e3,kt=5e3,St=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"4h",minutes:240},{label:"1 day",minutes:1440},{label:"Custom",minutes:null}],zt={not_automation:"Failed to snooze: One or more selected items are not automations",invalid_duration:"Failed to snooze: Please specify a valid duration (days, hours, or minutes)",resume_time_past:"Failed to snooze: Resume time must be in the future",disable_after_resume:"Failed to snooze: Snooze time must be before resume time"},Tt="autosnooze_include",Ct={light:10,medium:20,heavy:30,success:[10,50,10],error:[20,100,20,100,20],selection:8};function Et(t,e,i){const o=[];return t>0&&o.push(`${t} day${1!==t?"s":""}`),e>0&&o.push(`${e} hour${1!==e?"s":""}`),i>0&&o.push(`${i} minute${1!==i?"s":""}`),o.join(", ")}function Dt(t){const e=t.toLowerCase().replace(/\s+/g,"");if(!e)return null;let i=0,o=!1;const r=e.match(/(\d+(?:\.\d+)?)\s*d/),s=e.match(/(\d+(?:\.\d+)?)\s*h/),a=e.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(r?.[1]){const t=parseFloat(r[1]);if(isNaN(t)||t<0)return null;i+=t*xt,o=!0}if(s?.[1]){const t=parseFloat(s[1]);if(isNaN(t)||t<0)return null;i+=t*_t,o=!0}if(a?.[1]){const t=parseFloat(a[1]);if(isNaN(t)||t<0)return null;i+=t,o=!0}if(!o){const t=parseFloat(e);if(isNaN(t)||!(t>0))return null;i=t}if(i=Math.round(i),i<=0)return null;const n=Math.floor(i/xt),l=i%xt;return{days:n,hours:Math.floor(l/_t),minutes:l%_t}}function Rt(t,e){if(!t||!e)return null;const i=new Date(`${t}T${e}`).getTimezoneOffset(),o=i<=0?"+":"-",r=Math.abs(i);return`${t}T${e}${`${o}${String(Math.floor(r/60)).padStart(2,"0")}:${String(r%60).padStart(2,"0")}`}`}function Pt(t="light"){if(!navigator.vibrate)return;const e=Ct[t];void 0!==e&&navigator.vibrate(e)}function Mt(t,e){const i=t,o=i?.translation_key??i?.data?.translation_key;if(o&&zt[o])return zt[o];const r=i?.message??"";for(const[t,e]of Object.entries(zt))if(r.includes(t)||r.toLowerCase().includes(t.replace(/_/g," ")))return e;return`${e}. Check Home Assistant logs for details.`}async function Ft(t,e){await t.callService("autosnooze","pause",e)}async function Ut(t,e){await t.callService("autosnooze","cancel",{entity_id:e})}async function Ot(t,e){await t.callService("autosnooze","cancel_scheduled",{entity_id:e})}function Nt(t){return t.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())}function Ht(t,e,i){return!(!t.labels||0===t.labels.length)&&t.labels.some(t=>{const o=i[t]?.name;return o?.toLowerCase()===e})}function Lt(t,e,i){const o={};return t.forEach(t=>{const r=e(t);r&&0!==r.length?r.forEach(e=>{o[e]||(o[e]=[]),o[e].push(t)}):(o[i]||(o[i]=[]),o[i].push(t))}),Object.entries(o).sort((t,e)=>t[0]===i?1:e[0]===i?-1:t[0].localeCompare(e[0]))}function It(t,e){const i=new Set;return t.forEach(t=>{const o=e(t);o&&o.forEach(t=>i.add(t))}),i.size}const jt="sensor.autosnooze_snoozed_automations";function Bt(t){const e=t?.states?.[jt];return e?.attributes?.paused_automations??{}}class Gt extends nt{constructor(){super(...arguments),this.config={},this._selected=[],this._duration=30*gt,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._automationsCache=null,this._automationsCacheKey=null,this._wakeAllPending=!1,this._interval=null,this._syncTimeout=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._lastHassStates=null,this._searchTimeout=null,this._wakeAllTimeout=null,this._toastTimeout=null,this._toastFadeTimeout=null,this._handleWakeAll=async()=>{if(this._wakeAllPending){null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),this._wakeAllPending=!1;try{await async function(t){await t.callService("autosnooze","cancel_all",{})}(this.hass),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast("All automations resumed successfully")}catch(t){console.error("Wake all failed:",t),this._hapticFeedback("error"),this.isConnected&&this.shadowRoot&&this._showToast("Failed to resume automations. Check Home Assistant logs for details.")}}else this._hapticFeedback("medium"),this._wakeAllPending=!0,this._wakeAllTimeout=window.setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},$t)}}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-card",title:"AutoSnooze"}}setConfig(t){this.config=t}getCardSize(){const t=this._getPaused(),e=this._getScheduled();return 4+Object.keys(t).length+Object.keys(e).length}shouldUpdate(t){if(!t.has("hass"))return!0;const e=t.get("hass"),i=this.hass;if(!e||!i)return!0;const o=e.states?.["sensor.autosnooze_snoozed_automations"],r=i.states?.["sensor.autosnooze_snoozed_automations"];if(o!==r)return!0;if(e.entities!==i.entities)return!0;if(e.areas!==i.areas)return!0;const s=i.states??{},a=e.states??{};for(const t of Object.keys(s))if(t.startsWith("automation.")&&a[t]!==s[t])return!0;for(const t of Object.keys(a))if(t.startsWith("automation.")&&!s[t])return!0;return!1}updated(t){super.updated(t),t.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}connectedCallback(){super.connectedCallback(),this._interval&&(window.clearInterval(this._interval),this._interval=null),this._syncTimeout&&(window.clearTimeout(this._syncTimeout),this._syncTimeout=null),this._startSynchronizedCountdown(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry()}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null),null!==this._syncTimeout&&(clearTimeout(this._syncTimeout),this._syncTimeout=null),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),null!==this._toastTimeout&&(clearTimeout(this._toastTimeout),this._toastTimeout=null),null!==this._toastFadeTimeout&&(clearTimeout(this._toastFadeTimeout),this._toastFadeTimeout=null)}_startSynchronizedCountdown(){const t=1e3-Date.now()%1e3;this._syncTimeout=window.setTimeout(()=>{this._syncTimeout=null,this._updateCountdownIfNeeded(),this._interval=window.setInterval(()=>{this._updateCountdownIfNeeded()},At)},t)}_updateCountdownIfNeeded(){if(!this.hass)return;const t=Bt(this.hass);Object.keys(t).length>0&&this.requestUpdate()}async _fetchLabelRegistry(){!this._labelsFetched&&this.hass?.connection&&(this._labelRegistry=await async function(t){try{const e=await t.connection.sendMessagePromise({type:"config/label_registry/list"}),i={};return Array.isArray(e)&&e.forEach(t=>{i[t.label_id]=t}),i}catch(t){return console.warn("[AutoSnooze] Failed to fetch label registry:",t),{}}}(this.hass),this._labelsFetched=!0)}async _fetchCategoryRegistry(){!this._categoriesFetched&&this.hass?.connection&&(this._categoryRegistry=await async function(t){try{const e=await t.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),i={};return Array.isArray(e)&&e.forEach(t=>{i[t.category_id]=t}),i}catch(t){return console.warn("[AutoSnooze] Failed to fetch category registry:",t),{}}}(this.hass),this._categoriesFetched=!0)}async _fetchEntityRegistry(){!this._entityRegistryFetched&&this.hass?.connection&&(this._entityRegistry=await async function(t){try{const e=await t.connection.sendMessagePromise({type:"config/entity_registry/list"}),i={};return Array.isArray(e)&&e.filter(t=>t.entity_id.startsWith("automation.")).forEach(t=>{i[t.entity_id]=t}),i}catch(t){return console.warn("[AutoSnooze] Failed to fetch entity registry:",t),{}}}(this.hass),this._entityRegistryFetched=!0)}_getAutomations(){if(!this.hass?.states)return[];const t=this.hass.states,e=this._entityRegistryFetched;if(this._lastHassStates===t&&this._automationsCacheKey===e&&this._automationsCache)return this._automationsCache;const i=function(t,e){const i=t?.states,o=t?.entities;if(!i)return[];const r=Object.keys(i).filter(t=>t.startsWith("automation.")).map(t=>{const r=i[t];if(!r)return null;const s=e?.[t],a=o?.[t],n=(s?.categories??{}).automation??null;return{id:t,name:r.attributes?.friendly_name??t.replace("automation.",""),area_id:s?.area_id??a?.area_id??null,category_id:n,labels:s?.labels??a?.labels??[]}}).filter(t=>null!==t).sort((t,e)=>t.name.localeCompare(e.name));return r}(this.hass,this._entityRegistry);return this._automationsCache=i,this._automationsCacheKey=e,this._lastHassStates=t,i}_getFilteredAutomations(){return function(t,e,i){let o=t;const r=t.some(t=>Ht(t,Tt,i));o=r?o.filter(t=>Ht(t,Tt,i)):o.filter(t=>!Ht(t,"autosnooze_exclude",i));const s=e.toLowerCase();return s&&(o=o.filter(t=>t.name.toLowerCase().includes(s)||t.id.toLowerCase().includes(s))),o}(this._getAutomations(),this._search,this._labelRegistry)}_getAreaName(t){return this.hass?function(t,e){return t?e.areas?.[t]?.name??Nt(t):"Unassigned"}(t,this.hass):"Unassigned"}_getLabelName(t){return function(t,e){return e[t]?.name??Nt(t)}(t,this._labelRegistry)}_getCategoryName(t){return function(t,e){return t?e[t]?.name??Nt(t):"Uncategorized"}(t,this._categoryRegistry)}_getGroupedByArea(){return Lt(this._getFilteredAutomations(),t=>t.area_id?[this._getAreaName(t.area_id)]:null,"Unassigned")}_getGroupedByLabel(){return Lt(this._getFilteredAutomations(),t=>t.labels?.length>0?t.labels.map(t=>this._getLabelName(t)):null,"Unlabeled")}_getGroupedByCategory(){return Lt(this._getFilteredAutomations(),t=>t.category_id?[this._getCategoryName(t.category_id)]:null,"Uncategorized")}_getAreaCount(){return It(this._getAutomations(),t=>t.area_id?[t.area_id]:null)}_getLabelCount(){return It(this._getAutomations(),t=>t.labels?.length>0?t.labels:null)}_getCategoryCount(){return It(this._getAutomations(),t=>t.category_id?[t.category_id]:null)}_getPaused(){return this.hass?Bt(this.hass):{}}_getPausedGroupedByResumeTime(){return this.hass?function(t){const e=Bt(t),i={};return Object.entries(e).forEach(([t,e])=>{const o=e.resume_at;i[o]||(i[o]={resumeAt:o,disableAt:e.disable_at,automations:[]}),i[o].automations.push({entity_id:t,friendly_name:e.friendly_name,resume_at:e.resume_at,paused_at:e.paused_at,days:e.days,hours:e.hours,minutes:e.minutes,disable_at:e.disable_at})}),Object.values(i).sort((t,e)=>new Date(t.resumeAt).getTime()-new Date(e.resumeAt).getTime())}(this.hass):[]}_getScheduled(){return this.hass?function(t){const e=t?.states?.[jt];return e?.attributes?.scheduled_snoozes??{}}(this.hass):{}}_formatDateTime(t){return function(t,e){const i=new Date(t),o=new Date,r={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return i.getFullYear()>o.getFullYear()&&(r.year="numeric"),i.toLocaleString(e,r)}(t,this._getLocale())}_formatCountdown(t){return function(t){const e=new Date(t).getTime()-Date.now();if(e<=0)return"Resuming...";const i=Math.floor(e/ft),o=Math.floor(e%ft/bt),r=Math.floor(e%bt/gt),s=Math.floor(e%gt/mt);return i>0?`${i}d ${o}h ${r}m`:o>0?`${o}h ${r}m ${s}s`:`${r}m ${s}s`}(t)}_getLocale(){return this.hass?.locale?.language}_toggleSelection(t){Pt("selection"),this._selected.includes(t)?this._selected=this._selected.filter(e=>e!==t):this._selected=[...this._selected,t]}_toggleGroupExpansion(t){this._expandedGroups={...this._expandedGroups,[t]:!this._expandedGroups[t]}}_selectGroup(t){const e=t.map(t=>t.id),i=e.every(t=>this._selected.includes(t));this._selected=i?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_selectAllVisible(){const t=this._getFilteredAutomations().map(t=>t.id),e=t.every(t=>this._selected.includes(t));this._selected=e?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_clearSelection(){this._selected=[]}_setDuration(t){this._duration=t*gt;const e=function(t){const e=Math.floor(t/xt),i=t%xt;return{days:e,hours:Math.floor(i/_t),minutes:i%_t}}(t);this._customDuration=e,this._customDurationInput=function(t,e,i){const o=[];return t>0&&o.push(`${t}d`),e>0&&o.push(`${e}h`),i>0&&o.push(`${i}m`),o.join(" ")||"0m"}(e.days,e.hours,e.minutes)}_updateCustomDuration(){const t=(e=this._customDuration).days*xt+e.hours*_t+e.minutes;var e;this._duration=t*gt}_handleDurationInput(t){this._customDurationInput=t;const e=Dt(t);e&&(this._customDuration=e,this._updateCustomDuration())}_getDurationPreview(){const t=Dt(this._customDurationInput);return t?Et(t.days,t.hours,t.minutes):""}_isDurationValid(){return null!==Dt(this._customDurationInput)}_enterScheduleMode(){const{date:t,time:e}=function(){const t=new Date;return{date:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,time:`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`}}();this._scheduleMode=!0,this._disableAtDate=t,this._disableAtTime=e,this._resumeAtDate=t,this._resumeAtTime=e}_hasResumeAt(){return Boolean(this._resumeAtDate&&this._resumeAtTime)}_hasDisableAt(){return Boolean(this._disableAtDate&&this._disableAtTime)}_parseDurationInput(t){return Dt(t)}_formatDuration(t,e,i){return Et(t,e,i)}_combineDateTime(t,e){return Rt(t,e)}_getErrorMessage(t,e){return Mt(t,e)}_formatRegistryId(t){return Nt(t)}_handleKeyDown(t,e){"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),e())}_hapticFeedback(t="light"){Pt(t)}_handleSearchInput(t){const e=t.target.value;null!==this._searchTimeout&&clearTimeout(this._searchTimeout),this._searchTimeout=window.setTimeout(()=>{this._search=e,this._searchTimeout=null},vt)}_showToast(t,e={}){const{showUndo:i=!1,onUndo:o=null}=e;if(!this.shadowRoot)return;const r=this.shadowRoot.querySelector(".toast");r&&r.remove();const s=document.createElement("div");if(s.className="toast",s.setAttribute("role","alert"),s.setAttribute("aria-live","polite"),s.setAttribute("aria-atomic","true"),i&&o){const e=document.createElement("span");e.textContent=t,s.appendChild(e);const i=document.createElement("button");i.className="toast-undo-btn",i.textContent="Undo",i.setAttribute("aria-label","Undo last action"),i.addEventListener("click",t=>{t.stopPropagation(),o(),s.remove()}),s.appendChild(i)}else s.textContent=t;this.shadowRoot.appendChild(s),null!==this._toastTimeout&&clearTimeout(this._toastTimeout),null!==this._toastFadeTimeout&&clearTimeout(this._toastFadeTimeout),this._toastTimeout=window.setTimeout(()=>{this._toastTimeout=null,this.shadowRoot&&s.parentNode&&(s.style.animation=`slideUp ${yt}ms ease-out reverse`,this._toastFadeTimeout=window.setTimeout(()=>{this._toastFadeTimeout=null,s.parentNode&&s.remove()},yt))},wt)}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast("Please set a complete resume date and time");const t=this._hasDisableAt()?Rt(this._disableAtDate,this._disableAtTime):null,e=Rt(this._resumeAtDate,this._resumeAtTime);if(!e)return void this._showToast("Invalid resume date/time");const i=Date.now()+kt,o=new Date(e).getTime();if(o<=i)return void this._showToast("Resume time must be in the future");if(t){if(new Date(t).getTime()>=o)return void this._showToast("Snooze time must be before resume time")}}else if(0===this._duration)return;this._loading=!0;try{const t=this._selected.length,e=[...this._selected],i=this._scheduleMode,o=this._hasDisableAt();let r;if(this._scheduleMode){const e=this._hasDisableAt()?Rt(this._disableAtDate,this._disableAtTime):null,i=Rt(this._resumeAtDate,this._resumeAtTime);if(!i)return void(this._loading=!1);if(await Ft(this.hass,{entity_id:this._selected,resume_at:i,...e&&{disable_at:e}}),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);r=e?`Scheduled ${t} automation${1!==t?"s":""} to snooze`:`Snoozed ${t} automation${1!==t?"s":""} until ${this._formatDateTime(i)}`}else{const{days:e,hours:i,minutes:o}=this._customDuration;if(await Ft(this.hass,{entity_id:this._selected,days:e,hours:i,minutes:o}),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);const s=Et(e,i,o);r=`Snoozed ${t} automation${1!==t?"s":""} for ${s}`}this._hapticFeedback("success"),this._showToast(r,{showUndo:!0,onUndo:async()=>{try{for(const t of e)i&&o?await Ot(this.hass,t):await Ut(this.hass,t);this.isConnected&&(this._selected=e,this._showToast(`Restored ${t} automation${1!==t?"s":""}`))}catch(t){console.error("Undo failed:",t),this.isConnected&&this.shadowRoot&&this._showToast("Failed to undo. The automations may have already been modified.")}}}),this._selected=[],this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime=""}catch(t){console.error("Snooze failed:",t),this._hapticFeedback("error"),this.isConnected&&this.shadowRoot&&this._showToast(Mt(t,"Failed to snooze automations"))}this._loading=!1}}async _wake(t){try{await Ut(this.hass,t),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast("Automation resumed successfully")}catch(t){console.error("Wake failed:",t),this._hapticFeedback("error"),this.isConnected&&this.shadowRoot&&this._showToast(Mt(t,"Failed to resume automation"))}}async _cancelScheduled(t){try{await Ot(this.hass,t),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast("Scheduled snooze cancelled successfully")}catch(t){console.error("Cancel scheduled failed:",t),this._hapticFeedback("error"),this.isConnected&&this.shadowRoot&&this._showToast(Mt(t,"Failed to cancel scheduled snooze"))}}_renderDateOptions(){const t=function(t=365,e){const i=[],o=new Date,r=o.getFullYear();for(let s=0;s<t;s++){const t=new Date(o);t.setDate(t.getDate()+s);const a=t.getFullYear(),n=`${a}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,l=t.toLocaleDateString(e,{weekday:"short"}),d=t.toLocaleDateString(e,{month:"short"}),c=t.getDate(),h=a!==r?`${l}, ${d} ${c}, ${a}`:`${l}, ${d} ${c}`;i.push({value:n,label:h})}return i}(365,this._getLocale());return t.map(t=>B`<option value="${t.value}">${t.label}</option>`)}_renderSelectionList(){const t=this._getFilteredAutomations();if("all"===this._filterTab)return 0===t.length?B`<div class="list-empty" role="status">No automations found</div>`:t.map(t=>B`
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
      `);const e="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===e.length?B`<div class="list-empty" role="status">No automations found</div>`:e.map(([t,e])=>{const i=!1!==this._expandedGroups[t],o=e.every(t=>this._selected.includes(t.id)),r=e.some(t=>this._selected.includes(t.id))&&!o;return B`
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
            .indeterminate=${r}
            @click=${t=>t.stopPropagation()}
            @change=${()=>this._selectGroup(e)}
            aria-label="Select all automations in ${t}"
            tabindex="-1"
          />
        </button>
        ${i?e.map(t=>{const e="labels"===this._filterTab&&t.area_id?this._getAreaName(t.area_id):null;return B`
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
                    ${e?B`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline" aria-hidden="true"></ha-icon>${e}
                        </div>`:""}
                  </div>
                </button>
              `}):""}
      `})}_renderDurationSelector(t,e,i){return this._scheduleMode?B`
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
        `:B`
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">Snooze Duration</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${St.map(e=>{const i=null===e.minutes?this._showCustomInput:!this._showCustomInput&&t===e;return B`
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

            ${this._showCustomInput?B`
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
                ${e&&i?B`<div class="duration-preview" role="status" aria-live="polite">Duration: ${e}</div>`:B`<div class="duration-help" id="duration-help">Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h</div>`}
              </div>
            `:""}

            <button
              type="button"
              class="schedule-link"
              @click=${()=>this._enterScheduleMode()}
            >
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              Pick specific date/time instead
            </button>
          </div>
        `}_renderActivePauses(t){return 0===t?"":B`
      <div class="snooze-list" role="region" aria-label="Snoozed automations">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          Snoozed Automations (${t})
        </div>

        ${this._getPausedGroupedByResumeTime().map(t=>B`
            <div class="pause-group" role="group" aria-label="Automations resuming ${this._formatDateTime(t.resumeAt)}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${t.disableAt?B`Resumes ${this._formatDateTime(t.resumeAt)}`:B`<span class="countdown" data-resume-at="${t.resumeAt}" aria-label="Time remaining: ${this._formatCountdown(t.resumeAt)}">${this._formatCountdown(t.resumeAt)}</span>`}
              </div>
              ${t.automations.map(t=>B`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${t.friendly_name||t.entity_id}</div>
                    </div>
                    <button type="button" class="wake-btn" @click=${()=>this._wake(t.entity_id)} aria-label="Resume ${t.friendly_name||t.entity_id}">
                      Resume
                    </button>
                  </div>
                `)}
            </div>
          `)}

        ${t>1?B`
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
    `}_renderScheduledPauses(t,e){return 0===t?"":B`
      <div class="scheduled-list" role="region" aria-label="Scheduled snoozes">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          Scheduled Snoozes (${t})
        </div>

        ${Object.entries(e).map(([t,e])=>B`
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
    `}render(){if(!this.hass||!this.config)return B``;const t=this._getPaused(),e=Object.keys(t).length,i=this._getScheduled(),o=Object.keys(i).length,r=this._customDuration.days*xt+this._customDuration.hours*_t+this._customDuration.minutes,s=St.find(t=>t.minutes===r),a=this._getDurationPreview(),n=this._isDurationValid();return B`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||"AutoSnooze"}
          ${e>0||o>0?B`<span class="status-summary"
                >${e>0?`${e} active`:""}${e>0&&o>0?", ":""}${o>0?`${o} scheduled`:""}</span
              >`:""}
        </div>

        <div class="snooze-setup">
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

          <div class="search-box">
            <input
              type="search"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${t=>this._handleSearchInput(t)}
              aria-label="Search automations by name"
            />
          </div>

          ${this._getFilteredAutomations().length>0?B`
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
                  ${this._selected.length>0?B`<button type="button" class="select-all-btn" @click=${()=>this._clearSelection()} aria-label="Clear selection">Clear</button>`:""}
                </div>
              `:""}

          <div class="selection-list" id="selection-list" role="listbox" aria-label="Automations list" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(s,a,n)}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${()=>this._snooze()}
            aria-label="${this._loading?"Snoozing automations":this._scheduleMode?`Schedule snooze for ${this._selected.length} automation${1!==this._selected.length?"s":""}`:`Snooze ${this._selected.length} automation${1!==this._selected.length?"s":""}`}"
            aria-busy=${this._loading}
          >
            ${this._loading?"Snoozing...":this._scheduleMode?"Schedule"+(this._selected.length>0?` (${this._selected.length})`:""):"Snooze"+(this._selected.length>0?` (${this._selected.length})`:"")}
          </button>
        </div>

        ${this._renderActivePauses(e)}
        ${this._renderScheduledPauses(o,i)}
      </ha-card>
    `}}Gt.styles=pt,t([ht({attribute:!1})],Gt.prototype,"hass",void 0),t([ht({attribute:!1})],Gt.prototype,"config",void 0),t([ut()],Gt.prototype,"_selected",void 0),t([ut()],Gt.prototype,"_duration",void 0),t([ut()],Gt.prototype,"_customDuration",void 0),t([ut()],Gt.prototype,"_customDurationInput",void 0),t([ut()],Gt.prototype,"_loading",void 0),t([ut()],Gt.prototype,"_search",void 0),t([ut()],Gt.prototype,"_filterTab",void 0),t([ut()],Gt.prototype,"_expandedGroups",void 0),t([ut()],Gt.prototype,"_scheduleMode",void 0),t([ut()],Gt.prototype,"_disableAtDate",void 0),t([ut()],Gt.prototype,"_disableAtTime",void 0),t([ut()],Gt.prototype,"_resumeAtDate",void 0),t([ut()],Gt.prototype,"_resumeAtTime",void 0),t([ut()],Gt.prototype,"_labelRegistry",void 0),t([ut()],Gt.prototype,"_categoryRegistry",void 0),t([ut()],Gt.prototype,"_entityRegistry",void 0),t([ut()],Gt.prototype,"_showCustomInput",void 0),t([ut()],Gt.prototype,"_automationsCache",void 0),t([ut()],Gt.prototype,"_automationsCacheKey",void 0),t([ut()],Gt.prototype,"_wakeAllPending",void 0);const Wt=a`
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
`;class Vt extends nt{constructor(){super(...arguments),this._config={}}setConfig(t){this._config=t}_valueChanged(t,e){if(!this._config)return;const i={...this._config,[t]:e};""!==e&&null!=e||delete i[t],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}render(){return this._config?B`
      <div class="row">
        <label for="title-input">Title</label>
        <input
          id="title-input"
          type="text"
          .value=${this._config.title??""}
          @input=${t=>this._valueChanged("title",t.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `:B``}}Vt.styles=Wt,t([ht({attribute:!1})],Vt.prototype,"hass",void 0),t([ut()],Vt.prototype,"_config",void 0),customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",Vt),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",Gt),window.customCards=window.customCards||[],window.customCards.some(t=>"autosnooze-card"===t.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:"Temporarily pause automations with area and label filtering (v0.2.7)",preview:!0});export{Gt as AutomationPauseCard,Vt as AutomationPauseCardEditor};
