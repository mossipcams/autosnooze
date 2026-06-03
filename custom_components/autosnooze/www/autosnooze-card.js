function e(e,t,a,o){var s,i=arguments.length,r=i<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,a):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,a,o);else for(var n=e.length-1;n>=0;n--)(s=e[n])&&(r=(i<3?s(r):i>3?s(t,a,r):s(t,a))||r);return i>3&&r&&Object.defineProperty(t,a,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,a=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let i=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(a&&void 0===e){const a=void 0!==t&&1===t.length;a&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),a&&s.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,a,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[o+1],e[0]);return new i(a,e,o)},n=a?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const a of e.cssRules)t+=a.cssText;return(e=>new i("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:m}=Object,p=globalThis,g=p.trustedTypes,_=g?g.emptyScript:"",b=p.reactiveElementPolyfillSupport,f=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?_:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let a=e;switch(t){case Boolean:a=null!==e;break;case Number:a=null===e?null:Number(e);break;case Object:case Array:try{a=JSON.parse(e)}catch(e){a=null}}return a}},v=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const a=Symbol(),o=this.getPropertyDescriptor(e,a,t);void 0!==o&&u(this.prototype,e,o)}}static getPropertyDescriptor(e,t,a){const{get:o,set:s}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const i=o?.call(this);s?.call(this,t),this.requestUpdate(e,i,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=m(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...c(e),...h(e)];for(const a of t)this.createProperty(a,e[a])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,a]of t)this.elementProperties.set(e,a)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const a=this._$Eu(e,t);void 0!==a&&this._$Eh.set(a,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const a=new Set(e.flat(1/0).reverse());for(const e of a)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const a=t.attribute;return!1===a?void 0:"string"==typeof a?a:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const a of t.keys())this.hasOwnProperty(a)&&(e.set(a,this[a]),delete this[a]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(a)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const a of o){const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=a.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,a){this._$AK(e,a)}_$ET(e,t){const a=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,a);if(void 0!==o&&!0===a.reflect){const s=(void 0!==a.converter?.toAttribute?a.converter:y).toAttribute(t,a.type);this._$Em=e,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(e,t){const a=this.constructor,o=a._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=a.getPropertyOptions(o),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=o;const i=s.fromAttribute(t,e.type);this[o]=i??this._$Ej?.get(o)??i,this._$Em=null}}requestUpdate(e,t,a,o=!1,s){if(void 0!==e){const i=this.constructor;if(!1===o&&(s=this[e]),a??=i.getPropertyOptions(e),!((a.hasChanged??v)(s,t)||a.useDefault&&a.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,a))))return;this.C(e,t,a)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:a,reflect:o,wrapped:s},i){a&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,i??t??this[e]),!0!==s||void 0!==i)||(this._$AL.has(e)||(this.hasUpdated||a||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,a]of e){const{wrapped:e}=a,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,a,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,b?.({ReactiveElement:w}),(p.reactiveElementVersions??=[]).push("2.1.2");const $=globalThis,z=e=>e,A=$.trustedTypes,S=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,T="?"+C,D=`<${T}>`,R=document,j=()=>R.createComment(""),M=e=>null===e||"object"!=typeof e&&"function"!=typeof e,E=Array.isArray,P="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,F=/-->/g,L=/>/g,N=RegExp(`>|${P}(?:([^\\s"'>=/]+)(${P}*=${P}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),O=/'/g,U=/"/g,H=/^(?:script|style|textarea|title)$/i,G=(e=>(t,...a)=>({_$litType$:e,strings:t,values:a}))(1),V=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),q=new WeakMap,W=R.createTreeWalker(R,129);function K(e,t){if(!E(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const Y=(e,t)=>{const a=e.length-1,o=[];let s,i=2===t?"<svg>":3===t?"<math>":"",r=I;for(let t=0;t<a;t++){const a=e[t];let n,l,u=-1,d=0;for(;d<a.length&&(r.lastIndex=d,l=r.exec(a),null!==l);)d=r.lastIndex,r===I?"!--"===l[1]?r=F:void 0!==l[1]?r=L:void 0!==l[2]?(H.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=N):void 0!==l[3]&&(r=N):r===N?">"===l[0]?(r=s??I,u=-1):void 0===l[1]?u=-2:(u=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?N:'"'===l[3]?U:O):r===U||r===O?r=N:r===F||r===L?r=I:(r=N,s=void 0);const c=r===N&&e[t+1].startsWith("/>")?" ":"";i+=r===I?a+D:u>=0?(o.push(n),a.slice(0,u)+k+a.slice(u)+C+c):a+C+(-2===u?t:c)}return[K(e,i+(e[a]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class Z{constructor({strings:e,_$litType$:t},a){let o;this.parts=[];let s=0,i=0;const r=e.length-1,n=this.parts,[l,u]=Y(e,t);if(this.el=Z.createElement(l,a),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=W.nextNode())&&n.length<r;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(k)){const t=u[i++],a=o.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);n.push({type:1,index:s,name:r[2],strings:a,ctor:"."===r[1]?te:"?"===r[1]?ae:"@"===r[1]?oe:ee}),o.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:s}),o.removeAttribute(e));if(H.test(o.tagName)){const e=o.textContent.split(C),t=e.length-1;if(t>0){o.textContent=A?A.emptyScript:"";for(let a=0;a<t;a++)o.append(e[a],j()),W.nextNode(),n.push({type:2,index:++s});o.append(e[t],j())}}}else if(8===o.nodeType)if(o.data===T)n.push({type:2,index:s});else{let e=-1;for(;-1!==(e=o.data.indexOf(C,e+1));)n.push({type:7,index:s}),e+=C.length-1}s++}}static createElement(e,t){const a=R.createElement("template");return a.innerHTML=e,a}}function J(e,t,a=e,o){if(t===V)return t;let s=void 0!==o?a._$Co?.[o]:a._$Cl;const i=M(t)?void 0:t._$litDirective$;return s?.constructor!==i&&(s?._$AO?.(!1),void 0===i?s=void 0:(s=new i(e),s._$AT(e,a,o)),void 0!==o?(a._$Co??=[])[o]=s:a._$Cl=s),void 0!==s&&(t=J(e,s._$AS(e,t.values),s,o)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:a}=this._$AD,o=(e?.creationScope??R).importNode(t,!0);W.currentNode=o;let s=W.nextNode(),i=0,r=0,n=a[0];for(;void 0!==n;){if(i===n.index){let t;2===n.type?t=new Q(s,s.nextSibling,this,e):1===n.type?t=new n.ctor(s,n.name,n.strings,this,e):6===n.type&&(t=new se(s,this,e)),this._$AV.push(t),n=a[++r]}i!==n?.index&&(s=W.nextNode(),i++)}return W.currentNode=R,o}p(e){let t=0;for(const a of this._$AV)void 0!==a&&(void 0!==a.strings?(a._$AI(e,a,t),t+=a.strings.length-2):a._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,a,o){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=a,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),M(e)?e===B||null==e||""===e?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==V&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>E(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&M(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:a}=e,o="number"==typeof a?this._$AC(e):(void 0===a.el&&(a.el=Z.createElement(K(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new X(o,this),a=e.u(this.options);e.p(t),this.T(a),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Z(e)),t}k(e){E(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let a,o=0;for(const s of e)o===t.length?t.push(a=new Q(this.O(j()),this.O(j()),this,this.options)):a=t[o],a._$AI(s),o++;o<t.length&&(this._$AR(a&&a._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=z(e).nextSibling;z(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,a,o,s){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=s,a.length>2||""!==a[0]||""!==a[1]?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=B}_$AI(e,t=this,a,o){const s=this.strings;let i=!1;if(void 0===s)e=J(this,e,t,0),i=!M(e)||e!==this._$AH&&e!==V,i&&(this._$AH=e);else{const o=e;let r,n;for(e=s[0],r=0;r<s.length-1;r++)n=J(this,o[a+r],t,r),n===V&&(n=this._$AH[r]),i||=!M(n)||n!==this._$AH[r],n===B?e=B:e!==B&&(e+=(n??"")+s[r+1]),this._$AH[r]=n}i&&!o&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}}class ae extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}}class oe extends ee{constructor(e,t,a,o,s){super(e,t,a,o,s),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??B)===V)return;const a=this._$AH,o=e===B&&a!==B||e.capture!==a.capture||e.once!==a.once||e.passive!==a.passive,s=e!==B&&(a===B||o);o&&this.element.removeEventListener(this.name,this,a),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,a){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ie=$.litHtmlPolyfillSupport;ie?.(Z,Q),($.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;class ne extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,a)=>{const o=a?.renderBefore??t;let s=o._$litPart$;if(void 0===s){const e=a?.renderBefore??null;o._$litPart$=s=new Q(t.insertBefore(j(),e),e,void 0,a??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const le=re.litElementPolyfillSupport;le?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const ue={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:v},de=(e=ue,t,a)=>{const{kind:o,metadata:s}=a;let i=globalThis.litPropertyMetadata.get(s);if(void 0===i&&globalThis.litPropertyMetadata.set(s,i=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),i.set(a.name,e),"accessor"===o){const{name:o}=a;return{set(a){const s=t.get.call(this);t.set.call(this,a),this.requestUpdate(o,s,e,!0,a)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=a;return function(a){const s=this[o];t.call(this,a),this.requestUpdate(o,s,e,!0,a)}}throw Error("Unsupported decorator location: "+o)};function ce(e){return(t,a)=>"object"==typeof a?de(e,t,a):((e,t,a)=>{const o=t.hasOwnProperty(a);return t.constructor.createProperty(a,e),o?Object.getOwnPropertyDescriptor(t,a):void 0})(e,t,a)}function he(e){return ce({...e,state:!0,attribute:!1})}const me={en:{group:{unassigned:"Unassigned",unlabeled:"Unlabeled",uncategorized:"Uncategorized",recent:"Recent"},button:{undo:"Undo",resume:"Resume",confirm_resume_all:"Confirm Resume All",resume_all:"Resume All",cancel:"Cancel",select_all:"Select All",clear:"Clear",continue:"Continue",snoozing:"Snoozing...",schedule_count:"Schedule ({count})",snooze_count:"Snooze ({count})"},a11y:{undo_action:"Undo last action",snooze_date:"Snooze date",snooze_time:"Snooze time",resume_date:"Resume date",resume_time:"Resume time",custom_duration:"Custom duration",snoozed_region:"Snoozed automations",automations_resuming:"Automations resuming {time}",time_remaining:"Time remaining: {time}",resume_automation:"Resume {name}",confirm_resume_all:"Confirm resume all automations",resume_all:"Resume all paused automations",scheduled_region:"Scheduled snoozes",scheduled_pause_for:"Scheduled pause for {name}",cancel_scheduled_for:"Cancel scheduled pause for {name}",filter_tabs:"Filter automations by",automation_count:"{count} automations",area_count:"{count} areas",category_count:"{count} categories",label_count:"{count} labels",search:"Search automations by name",clear_search:"Clear search",selection_actions:"Selection actions",select_all:"Select all visible automations",clear_selection:"Clear selection",automations_list:"Automations list",snoozing:"Snoozing automations",schedule_snooze:"Schedule snooze for {count} automations",snooze_count:"Snooze {count} automations",select_automation:"Select {name}",group_header:"{name} group, {count} automations",group_count:"{count} automations",select_all_in_group:"Select all automations in {name}",snooze_last_duration:"Snooze for last used duration",snooze_for_duration:"Snooze for {duration}",close_adjust_modal:"Close adjust modal",adjust_automation:"Adjust snooze time for {name}",add_minutes:"Add {label}",reduce_minutes:"Reduce by {label}",adjust_group:"Adjust snooze time for {count} automations in this group"},toast:{error:{resume_time_required:"Please set a complete resume date and time",invalid_datetime:"Invalid resume date/time",resume_time_past:"Resume time must be in the future",snooze_before_resume:"Snooze time must be before resume time",undo_failed:"Failed to undo. The automations may have already been modified.",resume_failed:"Failed to resume automation",resume_all_failed:"Failed to resume automations. Check Home Assistant logs for details.",cancel_failed:"Failed to cancel scheduled snooze",adjust_failed:"Failed to adjust snooze time"},success:{scheduled_one:"Scheduled 1 automation to snooze",scheduled_many:"Scheduled {count} automations to snooze",snoozed_until_one:"Snoozed 1 automation until {time}",snoozed_until_many:"Snoozed {count} automations until {time}",snoozed_for_one:"Snoozed 1 automation for {duration}",snoozed_for_many:"Snoozed {count} automations for {duration}",restored_one:"Restored 1 automation",restored_many:"Restored {count} automations",resumed:"Automation resumed successfully",resumed_all:"All automations resumed successfully",cancelled:"Scheduled snooze cancelled successfully",adjusted:"Snooze time adjusted"}},list:{empty:"No automations found",label_registry_warning:"Label metadata is temporarily unavailable. Showing automations without label-based filtering."},schedule:{snooze_at:"Snooze at:",select_date:"Select date",hint_immediate:"Leave empty to snooze immediately",resume_at:"Resume at:",back_to_duration:"Back to duration selection",pick_datetime:"Pick specific date/time instead",summary_immediate:"Will pause immediately and resume {resume}",summary_with_disable:"Will pause {disable} and resume {resume}",summary_invalid_order:"Pause time must be before resume time"},duration:{header:"Snooze Duration",placeholder:"e.g. 2h30m, 1.5h, 1d, 45m",preview_label:"Duration:",help:"Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Use last duration: {duration}",custom:"Custom"},section:{snoozed_count:"Snoozed Automations ({count})",scheduled_count:"Scheduled Snoozes ({count})"},status:{resumes:"Resumes",disables:"Disables:",resumes_at:"Resumes:",active_count:"{count} active",scheduled_count:"{count} scheduled",resuming:"Resuming...",sensor_unavailable:"AutoSnooze status sensor is unavailable. Pause controls are still shown, but active/scheduled state may be stale."},tab:{all:"All",areas:"Areas",categories:"Categories",labels:"Labels"},search:{placeholder:"Search automations..."},selection:{count:"{selected} of {total} selected"},guardrail:{confirm_title:"Review required",confirm_body:"Some selected automations are tagged autosnooze_confirm or detected as critical. Continue to snooze them."},card:{default_title:"AutoSnooze"},editor:{title_label:"Title",title_placeholder:"AutoSnooze"},adjust:{remaining:"Time remaining",add_time:"Add time",reduce_time:"Reduce time",group_title:"Adjust {count} automations",group_subtitle:"All automations in this group"}},es:{group:{unassigned:"Sin asignar",unlabeled:"Sin etiqueta",uncategorized:"Sin categoría"},button:{undo:"Deshacer",resume:"Reanudar",confirm_resume_all:"Confirmar reanudar todo",resume_all:"Reanudar todo",cancel:"Cancelar",select_all:"Seleccionar todo",clear:"Limpiar",snoozing:"Pausando...",schedule_count:"Programar ({count})",snooze_count:"Pausar ({count})"},a11y:{undo_action:"Deshacer última acción",snooze_date:"Fecha de pausa",snooze_time:"Hora de pausa",resume_date:"Fecha de reanudación",resume_time:"Hora de reanudación",custom_duration:"Duración personalizada",snoozed_region:"Automatizaciones pausadas",automations_resuming:"Automatizaciones que reanudan {time}",time_remaining:"Tiempo restante: {time}",resume_automation:"Reanudar {name}",confirm_resume_all:"Confirmar reanudar todas las automatizaciones",resume_all:"Reanudar todas las automatizaciones pausadas",scheduled_region:"Pausas programadas",scheduled_pause_for:"Pausa programada para {name}",cancel_scheduled_for:"Cancelar pausa programada para {name}",filter_tabs:"Filtrar automatizaciones por",automation_count:"{count} automatizaciones",area_count:"{count} áreas",category_count:"{count} categorías",label_count:"{count} etiquetas",search:"Buscar automatizaciones por nombre",selection_actions:"Acciones de selección",select_all:"Seleccionar todas las automatizaciones visibles",clear_selection:"Limpiar selección",automations_list:"Lista de automatizaciones",snoozing:"Pausando automatizaciones",schedule_snooze:"Programar pausa para {count} automatizaciones",snooze_count:"Pausar {count} automatizaciones",select_automation:"Seleccionar {name}",group_header:"Grupo {name}, {count} automatizaciones",group_count:"{count} automatizaciones",select_all_in_group:"Seleccionar todas en {name}",snooze_last_duration:"Pausar con última duración",snooze_for_duration:"Pausar durante {duration}",close_adjust_modal:"Cerrar modal de ajuste",adjust_automation:"Ajustar tiempo de snooze para {name}",add_minutes:"Agregar {label}",reduce_minutes:"Reducir {label}",adjust_group:"Ajustar tiempo de pausa para {count} automatizaciones en este grupo"},toast:{error:{resume_time_required:"Por favor, establece una fecha y hora de reanudación completas",invalid_datetime:"Fecha/hora de reanudación inválida",resume_time_past:"La hora de reanudación debe ser en el futuro",snooze_before_resume:"La hora de pausa debe ser anterior a la hora de reanudación",undo_failed:"Error al deshacer. Las automatizaciones pueden haber sido modificadas.",resume_failed:"Error al reanudar la automatización",resume_all_failed:"Error al reanudar las automatizaciones. Consulta los registros de Home Assistant.",cancel_failed:"Error al cancelar la pausa programada",adjust_failed:"Error al ajustar el tiempo de snooze"},success:{scheduled_one:"1 automatización programada para pausar",scheduled_many:"{count} automatizaciones programadas para pausar",snoozed_until_one:"1 automatización pausada hasta {time}",snoozed_until_many:"{count} automatizaciones pausadas hasta {time}",snoozed_for_one:"1 automatización pausada por {duration}",snoozed_for_many:"{count} automatizaciones pausadas por {duration}",restored_one:"1 automatización restaurada",restored_many:"{count} automatizaciones restauradas",resumed:"Automatización reanudada correctamente",resumed_all:"Todas las automatizaciones reanudadas correctamente",cancelled:"Pausa programada cancelada correctamente",adjusted:"Tiempo de snooze ajustado"}},list:{empty:"No se encontraron automatizaciones"},schedule:{snooze_at:"Pausar a las:",select_date:"Seleccionar fecha",hint_immediate:"Dejar vacío para pausar inmediatamente",resume_at:"Reanudar a las:",back_to_duration:"Volver a selección de duración",pick_datetime:"Elegir fecha/hora específica"},duration:{header:"Duración de la pausa",placeholder:"ej. 2h30m, 1.5h, 1d, 45m",preview_label:"Duración:",help:"Introducir duración: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Usar última duración: {duration}",custom:"Personalizado"},section:{snoozed_count:"Automatizaciones pausadas ({count})",scheduled_count:"Pausas programadas ({count})"},status:{resumes:"Reanuda",disables:"Desactiva:",resumes_at:"Reanuda:",active_count:"{count} activas",scheduled_count:"{count} programadas",resuming:"Reanudando..."},tab:{all:"Todo",areas:"Áreas",categories:"Categorías",labels:"Etiquetas"},search:{placeholder:"Buscar automatizaciones..."},selection:{count:"{selected} de {total} seleccionadas"},card:{default_title:"AutoSnooze"},editor:{title_label:"Título",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tiempo restante",add_time:"Agregar tiempo",reduce_time:"Reducir tiempo",group_title:"Ajustar {count} automatizaciones",group_subtitle:"Todas las automatizaciones en este grupo"}},fr:{group:{unassigned:"Non assigné",unlabeled:"Sans étiquette",uncategorized:"Sans catégorie"},button:{undo:"Annuler",resume:"Reprendre",confirm_resume_all:"Confirmer tout reprendre",resume_all:"Tout reprendre",cancel:"Annuler",select_all:"Tout sélectionner",clear:"Effacer",snoozing:"Mise en pause...",schedule_count:"Programmer ({count})",snooze_count:"Pause ({count})"},a11y:{undo_action:"Annuler la dernière action",snooze_date:"Date de pause",snooze_time:"Heure de pause",resume_date:"Date de reprise",resume_time:"Heure de reprise",custom_duration:"Durée personnalisée",snoozed_region:"Automatisations en pause",automations_resuming:"Automatisations reprenant {time}",time_remaining:"Temps restant : {time}",resume_automation:"Reprendre {name}",confirm_resume_all:"Confirmer la reprise de toutes les automatisations",resume_all:"Reprendre toutes les automatisations en pause",scheduled_region:"Pauses programmées",scheduled_pause_for:"Pause programmée pour {name}",cancel_scheduled_for:"Annuler la pause programmée pour {name}",filter_tabs:"Filtrer les automatisations par",automation_count:"{count} automatisations",area_count:"{count} zones",category_count:"{count} catégories",label_count:"{count} étiquettes",search:"Rechercher des automatisations par nom",selection_actions:"Actions de sélection",select_all:"Sélectionner toutes les automatisations visibles",clear_selection:"Effacer la sélection",automations_list:"Liste des automatisations",snoozing:"Mise en pause des automatisations",schedule_snooze:"Programmer la pause pour {count} automatisations",snooze_count:"Mettre en pause {count} automatisations",select_automation:"Sélectionner {name}",group_header:"Groupe {name}, {count} automatisations",group_count:"{count} automatisations",select_all_in_group:"Tout sélectionner dans {name}",snooze_last_duration:"Pause pour dernière durée",snooze_for_duration:"Pause pour {duration}",close_adjust_modal:"Fermer le modal d'ajustement",adjust_automation:"Ajuster la mise en veille pour {name}",add_minutes:"Ajouter {label}",reduce_minutes:"Réduire de {label}",adjust_group:"Ajuster le temps de pause pour {count} automatisations dans ce groupe"},toast:{error:{resume_time_required:"Veuillez définir une date et heure de reprise complètes",invalid_datetime:"Date/heure de reprise invalide",resume_time_past:"L'heure de reprise doit être dans le futur",snooze_before_resume:"L'heure de pause doit être avant l'heure de reprise",undo_failed:"Échec de l'annulation. Les automatisations ont peut-être déjà été modifiées.",resume_failed:"Échec de la reprise de l'automatisation",resume_all_failed:"Échec de la reprise des automatisations. Consultez les journaux de Home Assistant.",cancel_failed:"Échec de l'annulation de la pause programmée",adjust_failed:"Échec de l'ajustement de la mise en veille"},success:{scheduled_one:"1 automatisation programmée pour pause",scheduled_many:"{count} automatisations programmées pour pause",snoozed_until_one:"1 automatisation en pause jusqu'à {time}",snoozed_until_many:"{count} automatisations en pause jusqu'à {time}",snoozed_for_one:"1 automatisation en pause pendant {duration}",snoozed_for_many:"{count} automatisations en pause pendant {duration}",restored_one:"1 automatisation restaurée",restored_many:"{count} automatisations restaurées",resumed:"Automatisation reprise avec succès",resumed_all:"Toutes les automatisations ont été reprises avec succès",cancelled:"Pause programmée annulée avec succès",adjusted:"Durée de mise en veille ajustée"}},list:{empty:"Aucune automatisation trouvée"},schedule:{snooze_at:"Pause à :",select_date:"Sélectionner la date",hint_immediate:"Laisser vide pour mettre en pause immédiatement",resume_at:"Reprendre à :",back_to_duration:"Retour à la sélection de durée",pick_datetime:"Choisir une date/heure spécifique"},duration:{header:"Durée de la pause",placeholder:"ex. 2h30m, 1.5h, 1j, 45m",preview_label:"Durée :",help:"Entrer la durée : 30m, 2h, 1.5h, 4h30m, 1j, 1j2h",last_used_tooltip:"Utiliser la dernière durée : {duration}",custom:"Personnalisé"},section:{snoozed_count:"Automatisations en pause ({count})",scheduled_count:"Pauses programmées ({count})"},status:{resumes:"Reprend",disables:"Désactive :",resumes_at:"Reprend :",active_count:"{count} actives",scheduled_count:"{count} programmées",resuming:"Reprise..."},tab:{all:"Tout",areas:"Zones",categories:"Catégories",labels:"Étiquettes"},search:{placeholder:"Rechercher des automatisations..."},selection:{count:"{selected} sur {total} sélectionnées"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titre",title_placeholder:"AutoSnooze"},adjust:{remaining:"Temps restant",add_time:"Ajouter du temps",reduce_time:"Réduire le temps",group_title:"Ajuster {count} automatisations",group_subtitle:"Toutes les automatisations de ce groupe"}},de:{group:{unassigned:"Nicht zugewiesen",unlabeled:"Ohne Label",uncategorized:"Ohne Kategorie"},button:{undo:"Rückgängig",resume:"Fortsetzen",confirm_resume_all:"Alle fortsetzen bestätigen",resume_all:"Alle fortsetzen",cancel:"Abbrechen",select_all:"Alle auswählen",clear:"Löschen",snoozing:"Pausiere...",schedule_count:"Planen ({count})",snooze_count:"Pausieren ({count})"},a11y:{undo_action:"Letzte Aktion rückgängig machen",snooze_date:"Pausendatum",snooze_time:"Pausenzeit",resume_date:"Wiederaufnahmedatum",resume_time:"Wiederaufnahmezeit",custom_duration:"Benutzerdefinierte Dauer",snoozed_region:"Pausierte Automatisierungen",automations_resuming:"Automatisierungen werden fortgesetzt {time}",time_remaining:"Verbleibende Zeit: {time}",resume_automation:"{name} fortsetzen",confirm_resume_all:"Bestätigen: Alle Automatisierungen fortsetzen",resume_all:"Alle pausierten Automatisierungen fortsetzen",scheduled_region:"Geplante Pausen",scheduled_pause_for:"Geplante Pause für {name}",cancel_scheduled_for:"Geplante Pause für {name} abbrechen",filter_tabs:"Automatisierungen filtern nach",automation_count:"{count} Automatisierungen",area_count:"{count} Bereiche",category_count:"{count} Kategorien",label_count:"{count} Labels",search:"Automatisierungen nach Name suchen",selection_actions:"Auswahlaktionen",select_all:"Alle sichtbaren Automatisierungen auswählen",clear_selection:"Auswahl löschen",automations_list:"Automatisierungsliste",snoozing:"Automatisierungen werden pausiert",schedule_snooze:"Pause planen für {count} Automatisierungen",snooze_count:"{count} Automatisierungen pausieren",select_automation:"{name} auswählen",group_header:"Gruppe {name}, {count} Automatisierungen",group_count:"{count} Automatisierungen",select_all_in_group:"Alle in {name} auswählen",snooze_last_duration:"Letzte Dauer verwenden",snooze_for_duration:"Für {duration} pausieren",close_adjust_modal:"Anpassungsdialog schließen",adjust_automation:"Schlummerzeit anpassen für {name}",add_minutes:"{label} hinzufügen",reduce_minutes:"Um {label} reduzieren",adjust_group:"Schlummerzeit für {count} Automatisierungen in dieser Gruppe anpassen"},toast:{error:{resume_time_required:"Bitte vollständiges Wiederaufnahmedatum und -zeit angeben",invalid_datetime:"Ungültiges Wiederaufnahmedatum/-zeit",resume_time_past:"Wiederaufnahmezeit muss in der Zukunft liegen",snooze_before_resume:"Pausenzeit muss vor der Wiederaufnahmezeit liegen",undo_failed:"Rückgängig machen fehlgeschlagen. Die Automatisierungen wurden möglicherweise bereits geändert.",resume_failed:"Fortsetzen der Automatisierung fehlgeschlagen",resume_all_failed:"Fortsetzen der Automatisierungen fehlgeschlagen. Prüfen Sie die Home Assistant Logs.",cancel_failed:"Abbrechen der geplanten Pause fehlgeschlagen",adjust_failed:"Schlummerzeit konnte nicht angepasst werden"},success:{scheduled_one:"1 Automatisierung zum Pausieren geplant",scheduled_many:"{count} Automatisierungen zum Pausieren geplant",snoozed_until_one:"1 Automatisierung pausiert bis {time}",snoozed_until_many:"{count} Automatisierungen pausiert bis {time}",snoozed_for_one:"1 Automatisierung pausiert für {duration}",snoozed_for_many:"{count} Automatisierungen pausiert für {duration}",restored_one:"1 Automatisierung wiederhergestellt",restored_many:"{count} Automatisierungen wiederhergestellt",resumed:"Automatisierung erfolgreich fortgesetzt",resumed_all:"Alle Automatisierungen erfolgreich fortgesetzt",cancelled:"Geplante Pause erfolgreich abgebrochen",adjusted:"Schlummerzeit angepasst"}},list:{empty:"Keine Automatisierungen gefunden"},schedule:{snooze_at:"Pausieren um:",select_date:"Datum wählen",hint_immediate:"Leer lassen für sofortige Pause",resume_at:"Fortsetzen um:",back_to_duration:"Zurück zur Dauerauswahl",pick_datetime:"Stattdessen bestimmtes Datum/Zeit wählen"},duration:{header:"Pausendauer",placeholder:"z.B. 2h30m, 1.5h, 1d, 45m",preview_label:"Dauer:",help:"Dauer eingeben: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Letzte Dauer verwenden: {duration}",custom:"Benutzerdefiniert"},section:{snoozed_count:"Pausierte Automatisierungen ({count})",scheduled_count:"Geplante Pausen ({count})"},status:{resumes:"Fortsetzung",disables:"Deaktiviert:",resumes_at:"Fortsetzung:",active_count:"{count} aktiv",scheduled_count:"{count} geplant",resuming:"Wird fortgesetzt..."},tab:{all:"Alle",areas:"Bereiche",categories:"Kategorien",labels:"Labels"},search:{placeholder:"Automatisierungen suchen..."},selection:{count:"{selected} von {total} ausgewählt"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titel",title_placeholder:"AutoSnooze"},adjust:{remaining:"Verbleibende Zeit",add_time:"Zeit hinzufügen",reduce_time:"Zeit reduzieren",group_title:"Anpassen von {count} Automatisierungen",group_subtitle:"Alle Automatisierungen in dieser Gruppe"}},it:{group:{unassigned:"Non assegnato",unlabeled:"Senza etichetta",uncategorized:"Senza categoria"},button:{undo:"Annulla",resume:"Riprendi",confirm_resume_all:"Conferma riprendi tutto",resume_all:"Riprendi tutto",cancel:"Annulla",select_all:"Seleziona tutto",clear:"Cancella",snoozing:"Messa in pausa...",schedule_count:"Programma ({count})",snooze_count:"Pausa ({count})"},a11y:{undo_action:"Annulla ultima azione",snooze_date:"Data pausa",snooze_time:"Ora pausa",resume_date:"Data ripresa",resume_time:"Ora ripresa",custom_duration:"Durata personalizzata",snoozed_region:"Automazioni in pausa",automations_resuming:"Automazioni che riprendono {time}",time_remaining:"Tempo rimanente: {time}",resume_automation:"Riprendi {name}",confirm_resume_all:"Conferma ripresa di tutte le automazioni",resume_all:"Riprendi tutte le automazioni in pausa",scheduled_region:"Pause programmate",scheduled_pause_for:"Pausa programmata per {name}",cancel_scheduled_for:"Annulla pausa programmata per {name}",filter_tabs:"Filtra automazioni per",automation_count:"{count} automazioni",area_count:"{count} aree",category_count:"{count} categorie",label_count:"{count} etichette",search:"Cerca automazioni per nome",selection_actions:"Azioni selezione",select_all:"Seleziona tutte le automazioni visibili",clear_selection:"Cancella selezione",automations_list:"Lista automazioni",snoozing:"Messa in pausa delle automazioni",schedule_snooze:"Programma pausa per {count} automazioni",snooze_count:"Metti in pausa {count} automazioni",select_automation:"Seleziona {name}",group_header:"Gruppo {name}, {count} automazioni",group_count:"{count} automazioni",select_all_in_group:"Seleziona tutto in {name}",snooze_last_duration:"Pausa per ultima durata",snooze_for_duration:"Pausa per {duration}",close_adjust_modal:"Chiudi finestra di modifica",adjust_automation:"Modifica tempo di snooze per {name}",add_minutes:"Aggiungi {label}",reduce_minutes:"Riduci di {label}",adjust_group:"Modifica il tempo di pausa per {count} automazioni in questo gruppo"},toast:{error:{resume_time_required:"Imposta una data e ora di ripresa complete",invalid_datetime:"Data/ora di ripresa non valida",resume_time_past:"L'ora di ripresa deve essere nel futuro",snooze_before_resume:"L'ora di pausa deve essere prima dell'ora di ripresa",undo_failed:"Annullamento fallito. Le automazioni potrebbero essere già state modificate.",resume_failed:"Ripresa dell'automazione fallita",resume_all_failed:"Ripresa delle automazioni fallita. Controlla i log di Home Assistant.",cancel_failed:"Annullamento della pausa programmata fallito",adjust_failed:"Impossibile modificare il tempo di snooze"},success:{scheduled_one:"1 automazione programmata per la pausa",scheduled_many:"{count} automazioni programmate per la pausa",snoozed_until_one:"1 automazione in pausa fino a {time}",snoozed_until_many:"{count} automazioni in pausa fino a {time}",snoozed_for_one:"1 automazione in pausa per {duration}",snoozed_for_many:"{count} automazioni in pausa per {duration}",restored_one:"1 automazione ripristinata",restored_many:"{count} automazioni ripristinate",resumed:"Automazione ripresa con successo",resumed_all:"Tutte le automazioni riprese con successo",cancelled:"Pausa programmata annullata con successo",adjusted:"Tempo di snooze modificato"}},list:{empty:"Nessuna automazione trovata"},schedule:{snooze_at:"Pausa alle:",select_date:"Seleziona data",hint_immediate:"Lascia vuoto per mettere in pausa immediatamente",resume_at:"Riprendi alle:",back_to_duration:"Torna alla selezione durata",pick_datetime:"Scegli data/ora specifica"},duration:{header:"Durata pausa",placeholder:"es. 2h30m, 1.5h, 1g, 45m",preview_label:"Durata:",help:"Inserisci durata: 30m, 2h, 1.5h, 4h30m, 1g, 1g2h",last_used_tooltip:"Usa ultima durata: {duration}",custom:"Personalizzato"},section:{snoozed_count:"Automazioni in pausa ({count})",scheduled_count:"Pause programmate ({count})"},status:{resumes:"Riprende",disables:"Disattiva:",resumes_at:"Riprende:",active_count:"{count} attive",scheduled_count:"{count} programmate",resuming:"Ripresa..."},tab:{all:"Tutto",areas:"Aree",categories:"Categorie",labels:"Etichette"},search:{placeholder:"Cerca automazioni..."},selection:{count:"{selected} di {total} selezionate"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titolo",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tempo rimanente",add_time:"Aggiungi tempo",reduce_time:"Riduci tempo",group_title:"Modifica {count} automazioni",group_subtitle:"Tutte le automazioni in questo gruppo"}}},pe={en:"en","en-GB":"en","en-US":"en",es:"es","es-ES":"es","es-419":"es",fr:"fr","fr-FR":"fr","fr-CA":"fr",de:"de","de-DE":"de","de-AT":"de","de-CH":"de",it:"it","it-IT":"it"};const ge=new Set;function _e(e,t){const a=t.split(".");let o=e;for(const e of a){if(!o||"object"!=typeof o||!(e in o))return;o=o[e]}return"string"==typeof o?o:void 0}function be(e,t,a){const o=function(e){if(!e)return"en";const t=e.language??e.locale?.language;if(!t)return"en";const a=pe[t];if(a)return a;const o=t.split("-")[0];if(o){const e=pe[o];if(e)return e}return"en"}(e),s=me[o];let i=s?_e(s,t):void 0;return i||"en"===o||(i=_e(me.en,t)),i?function(e,t){return t?e.replace(/\{(\w+)\}/g,(e,a)=>{const o=t[a];return void 0!==o?String(o):e}):e}(i,a):(ge.has(t)||(ge.add(t),console.warn(`[AutoSnooze] Missing translation for key: ${t}`)),t)}const fe=r`
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
`,ye=r`
  :host {
    display: block;
  }
`,ve=r`
  .registry-warning,
  .sensor-health-banner,
  .guardrail-confirm {
    border: 1px solid color-mix(in srgb, #ff9800 45%, var(--divider-color));
    border-radius: 8px;
    background: color-mix(in srgb, #ff9800 10%, var(--card-background-color));
    color: var(--primary-text-color);
  }
`,xe=r`
  .tab:focus-visible,
  .search-clear-btn:focus-visible,
  .select-all-btn:focus-visible,
  .snooze-btn:focus-visible,
  .cancel-scheduled-btn:focus-visible,
  .pill:focus-visible,
  .last-duration-badge:focus-visible,
  .schedule-link:focus-visible,
  .wake-btn:focus-visible,
  .modal-close:focus-visible,
  .adjust-btn.increment:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`,we=r`
  .list-item:focus-visible,
  .group-header:focus-visible,
  .pause-group-header:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
`,$e=r`
  .wake-all:focus-visible,
  .adjust-btn.decrement:focus-visible {
    outline: 2px solid #ff9800;
    outline-offset: 2px;
  }
`,ze=r`
  .tab,
  .group-header,
  .pill,
  .schedule-link,
  .adjust-btn,
  .wake-btn,
  .duration-input {
    min-height: 44px;
    box-sizing: border-box;
  }
`,Ae=r`
  .cancel-scheduled-btn,
  .wake-btn {
    padding: 6px 12px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: var(--card-background-color);
    color: var(--primary-text-color);
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.2s;
  }
`,Se=r`
  .pill.active,
  .tab.active,
  .last-duration-badge.active {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }
`,ke=r`
  .tab:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    opacity: 0.8;
  }
`,Ce=r`
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
  .tab-count {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.8em;
  }
  .tab.active .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }
`,Te=r`
  .select-all-btn:hover,
  .wake-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }
`,De=r`
  .search-box input:focus,
  .duration-input:focus,
  .datetime-row select:focus,
  .datetime-row input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 12%, transparent);
  }
`,Re=r`
  .tab,
  .list-item,
  .group-header,
  .pill,
  .snooze-btn,
  .cancel-scheduled-btn,
  .adjust-btn {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
`,je=r`
  @media (max-width: 480px) {
    .filter-tabs {
      gap: 2px;
      margin-bottom: 14px;
      padding: 3px;
      background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--divider-color));
      border-radius: 14px;
      border-bottom: none;
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
      transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      gap: 4px;
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
    .tab-count,
    .tab.active .tab-count {
      padding: 2px 5px;
      font-size: 0.72em;
      font-weight: 600;
      border-radius: 6px;
      min-width: 18px;
      text-align: center;
      background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    }
    .tab.active .tab-count {
      background: color-mix(in srgb, var(--primary-color) 20%, transparent);
      color: var(--primary-color);
    }
    .search-row { gap: 6px; margin-bottom: 14px; }
    .search-box input {
      padding: 9px 56px 9px 10px;
      font-size: 0.82em;
      min-height: 34px;
      border-radius: 10px;
      border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent);
      background: var(--card-background-color);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .search-box input::placeholder { color: var(--secondary-text-color); opacity: 0.6; }
    .search-clear-btn { right: 6px; min-height: 24px; padding: 2px 6px; border-radius: 6px; font-size: 0.72em; }
    .selection-count {
      font-weight: 500;
      color: var(--primary-text-color);
      opacity: 0.8;
      min-height: 28px;
      margin-left: 0;
      font-size: 0.72em;
      font-variant-numeric: tabular-nums;
    }
    .select-all-btn {
      padding: 0 6px;
      font-size: 0.68em;
      font-weight: 600;
      min-height: 28px;
      border-radius: 6px;
      border: 1.5px solid color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
    }
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
    }
    .list-item:active {
      transform: scale(0.985);
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
    }
    .list-item.selected {
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
    }
    .list-item input[type="checkbox"] { width: 20px; height: 20px; border-radius: 6px; }
    .list-item-name { font-size: 0.9em; font-weight: 500; letter-spacing: -0.01em; }
    .list-item-meta { font-size: 0.72em; opacity: 0.7; margin-top: 3px; }
    .group-header {
      padding: 12px 14px;
      font-size: 0.85em;
      font-weight: 600;
      min-height: 48px;
      background: var(--secondary-background-color);
      letter-spacing: -0.01em;
    }
    .group-header:active {
      background: color-mix(in srgb, var(--secondary-background-color) 90%, var(--primary-color));
    }
    .group-badge { font-size: 0.72em; font-weight: 700; padding: 3px 8px; border-radius: 8px; }
    .list-empty { padding: 28px 20px; font-size: 0.9em; opacity: 0.6; font-style: italic; }
  }
`,Me=r`
  @media (max-width: 480px) {
    .duration-section-header { font-size: 0.8em; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.7; }
    .duration-pills { gap: 8px; margin-bottom: 12px; }
    .pill { padding: 11px 16px; font-size: 0.88em; font-weight: 500; border-radius: 24px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 80%, transparent); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .pill:active:not(.active) { transform: scale(0.95); }
    .pill:hover:not(.active) { border-color: var(--primary-color); transform: translateY(-1px); }
    .pill.active, .last-duration-badge.active { background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%); border-color: var(--primary-color); box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent); transform: translateY(-1px); }
    .last-duration-badge:hover:not(.active) { border-color: var(--primary-color); transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
    .last-duration-badge.active ha-icon { color: var(--text-primary-color); }
    .last-duration-badge:active:not(.active) { transform: scale(0.95); background: color-mix(in srgb, var(--primary-color) 10%, transparent); border-color: var(--primary-color); }
    .duration-input { padding: 13px 14px; font-size: 0.9em; min-height: 46px; border-radius: 12px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04); }
    .duration-help { font-size: 0.72em; opacity: 0.6; margin-top: 6px; }
    .duration-preview { font-size: 0.78em; font-weight: 600; margin-top: 6px; padding: 6px 10px; background: color-mix(in srgb, var(--primary-color) 10%, transparent); border-radius: 6px; display: inline-block; }
    .schedule-link { margin-top: 14px; padding: 10px 6px; font-size: 0.85em; font-weight: 500; opacity: 0.8; }
    .schedule-link:hover { opacity: 1; }
    .schedule-inputs { padding: 14px; gap: 14px; margin-bottom: 14px; border-radius: 14px; background: linear-gradient(180deg, var(--secondary-background-color) 0%, color-mix(in srgb, var(--secondary-background-color) 95%, var(--divider-color)) 100%); border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent); }
    .datetime-field label { font-size: 0.8em; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; }
    .datetime-row { flex-wrap: nowrap; gap: 8px; }
    .datetime-row select { flex: 1; min-width: 0; min-height: 46px; padding: 10px 12px; font-size: 0.9em; border-radius: 10px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); }
    .datetime-row input[type="time"] { flex: 0 0 auto; width: 105px; min-height: 46px; padding: 10px; font-size: 0.9em; font-weight: 500; border-radius: 10px; border: 1.5px solid color-mix(in srgb, var(--divider-color) 70%, transparent); }
    .field-hint { font-size: 0.7em; opacity: 0.6; font-style: italic; }
    .schedule-summary { font-size: 0.76em; border-radius: 10px; padding: 9px 10px; }
  }
`,Ee=r`
  .adjust-btn {
    padding: 10px 4px;
    border-radius: 10px;
    font-size: 0.9em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--card-background-color);
  }
  .adjust-btn:active:not(:disabled) { transform: scale(0.95); }
  .adjust-btn.increment { color: var(--primary-color); border: 1.5px solid var(--primary-color); }
  .adjust-btn.increment:hover { background: var(--primary-color); color: var(--text-primary-color); }
  .adjust-btn.decrement { color: #ff9800; border: 1.5px solid #ff9800; }
  .adjust-btn.decrement:hover:not(:disabled) { background: #ff9800; color: white; }
  .adjust-btn.decrement:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: var(--divider-color);
    color: var(--secondary-text-color);
  }
`,Pe=r`
  @media (max-width: 480px) {
    .modal-content { max-width: 100%; border-radius: 20px; }
    .modal-header { padding: 18px 16px 14px; }
    .modal-title { font-size: 0.95em; }
    .remaining-time { font-size: 2.2em; padding: 16px 0 24px; }
    .adjust-btn { min-height: 48px; font-size: 0.88em; border-radius: 12px; }
    .adjust-buttons, .decrement-buttons { gap: 10px; }
  }
`,Ie=r`
  @media (max-width: 480px) {
    .snooze-list { padding: 14px; margin-top: 24px; border-radius: 16px; border: 2px solid #ff9800; background: linear-gradient(180deg, rgba(255, 152, 0, 0.06) 0%, rgba(255, 152, 0, 0.02) 100%); box-shadow: 0 4px 16px rgba(255, 152, 0, 0.08); }
    .list-header { font-size: 0.95em; font-weight: 700; margin-bottom: 14px; gap: 8px; letter-spacing: -0.01em; }
    .list-header ha-icon { --mdc-icon-size: 20px; }
    .pause-group { margin-bottom: 10px; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); border: 1px solid color-mix(in srgb, var(--divider-color) 50%, transparent); }
    .pause-group-header { padding: 12px 14px; font-size: 0.85em; font-weight: 600; background: var(--secondary-background-color); }
    .pause-group-header:active { background: color-mix(in srgb, var(--secondary-background-color) 80%, transparent); }
    .pause-group-header .countdown { font-size: 1em; font-weight: 700; font-variant-numeric: tabular-nums; }
    .paused-item { padding: 12px 14px; gap: 12px; background: var(--card-background-color); }
    .paused-item:active { background: var(--secondary-background-color, rgba(0, 0, 0, 0.05)); }
    .paused-icon { --mdc-icon-size: 18px; opacity: 0.5; }
    .paused-info { flex: 1; min-width: 0; overflow: hidden; }
    .paused-name { font-size: 0.9em; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .paused-time { font-size: 0.72em; opacity: 0.6; margin-top: 2px; }
    .wake-btn { padding: 8px 14px; font-size: 0.82em; font-weight: 600; min-height: 36px; flex-shrink: 0; align-self: center; border-radius: 10px; border: 1.5px solid color-mix(in srgb, #4caf50 60%, var(--divider-color)); color: #4caf50; transition: all 0.15s ease; }
    .wake-btn:active { transform: scale(0.95); }
    .wake-btn:hover { background: #4caf50; color: white; border-color: #4caf50; }
    .wake-all { padding: 14px; font-size: 0.9em; font-weight: 600; min-height: 50px; margin-top: 12px; border-radius: 12px; border: 2px solid #ff9800; }
    .wake-all:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2); }
    .wake-all.pending { animation: pulse-orange 1.5s infinite; }
    @keyframes pulse-orange { 0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); } }
  }
`,Fe=r`
    ${ye}
    ${ve}
    ${xe}
    ${r`
  .toast-undo-btn:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`}
    ${r`
  .cancel-scheduled-btn,
  .toast-undo-btn {
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
    box-sizing: border-box;
  }
`}
    ${Ae}
    ${Re}
    ${r`
  @media (max-width: 480px) {
    ha-card {
      padding: 14px;
      background: linear-gradient(
        180deg,
        var(--card-background-color) 0%,
        color-mix(in srgb, var(--card-background-color) 97%, var(--primary-color)) 100%
      );
    }
    .header {
      font-size: 1.05em;
      font-weight: 600;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      letter-spacing: -0.01em;
    }
    .header ha-icon { --mdc-icon-size: 22px; opacity: 0.9; }
    .status-summary {
      font-size: 0.7em;
      font-weight: 500;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      border-radius: 12px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .snooze-setup { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .snooze-btn {
      padding: 16px;
      font-size: 1em;
      min-height: 56px;
      font-weight: 700;
      border-radius: 14px;
      letter-spacing: 0.01em;
      background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%);
      box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 25%, transparent), 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-top: 6px;
    }
    .guardrail-confirm { border-radius: 14px; padding: 12px; }
    .guardrail-body { font-size: 0.8em; }
    .snooze-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in srgb, var(--primary-color) 35%, transparent), 0 3px 6px rgba(0, 0, 0, 0.12);
    }
    .snooze-btn:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 20%, transparent), 0 1px 2px rgba(0, 0, 0, 0.08);
    }
    .snooze-btn:disabled { background: var(--disabled-color, #9e9e9e); box-shadow: none; }
    .scheduled-list {
      padding: 14px;
      margin-top: 14px;
      border-radius: 16px;
      border: 2px solid #2196f3;
      background: linear-gradient(180deg, rgba(33, 150, 243, 0.06) 0%, rgba(33, 150, 243, 0.02) 100%);
      box-shadow: 0 4px 16px rgba(33, 150, 243, 0.08);
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
    .scheduled-item:last-of-type { margin-bottom: 14px; }
    .scheduled-icon { display: block; flex-shrink: 0; --mdc-icon-size: 18px; opacity: 0.8; }
    .scheduled-time { font-size: 0.72em; font-weight: 600; }
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
    }
    .cancel-scheduled-btn:active { transform: scale(0.95); }
    .cancel-scheduled-btn:hover { background: #f44336; color: white; border-color: #f44336; }
    .toast {
      bottom: 20px;
      padding: 14px 18px;
      font-size: 0.9em;
      font-weight: 500;
      max-width: calc(100vw - 32px);
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(8px);
      background: linear-gradient(135deg, var(--primary-color) 0%, color-mix(in srgb, var(--primary-color) 85%, #000) 100%);
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
    .toast-undo-btn:hover { background: rgba(255, 255, 255, 0.25); border-color: rgba(255, 255, 255, 0.5); }
  }
`}
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
    .sensor-health-banner {
      margin-bottom: 12px;
      padding: 10px 12px;
      color: var(--primary-text-color);
      font-size: 0.85em;
    }

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    /* Snooze Button */
    .guardrail-confirm {
      margin-top: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .guardrail-title {
      font-weight: 600;
      font-size: 0.92em;
    }
    .guardrail-body {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .guardrail-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .guardrail-cancel-btn,
    .guardrail-continue-btn {
      border-radius: 8px;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .guardrail-continue-btn {
      border-color: var(--primary-color);
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
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
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid #2196f3;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.05);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon,
    .scheduled-icon,
    .scheduled-time {
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
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      font-weight: 500;
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
      font-size: 0.85em;
      font-weight: 500;
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

`,Le=1e3,Ne=6e4,Oe=36e5,Ue=864e5,He=60,Ge=1440,Ve=300,Be=300,qe=3e3,We=5e3,Ke=1e3,Ye=5e3,Ze=1e3,Je=3e4,Xe=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"12h",minutes:720},{label:"1d",minutes:1440},{label:"Custom",minutes:null}],Qe={not_automation:"Failed to snooze: One or more selected items are not automations",invalid_duration:"Failed to snooze: Please specify a valid duration (days, hours, or minutes)",resume_time_past:"Failed to snooze: Resume time must be in the future",disable_after_resume:"Failed to snooze: Snooze time must be before resume time",save_failed:"Failed to save changes. Please try again or check Home Assistant logs.",invalid_adjustment:"Adjustment must be non-zero. Specify at least one of: days, hours, or minutes.",adjust_time_too_short:"Cannot shorten snooze that much. Resume time must be at least 1 minute away.",confirm_required:"Failed to snooze: Confirmation is required for one or more selected automations"},et="autosnooze_exclude",tt="autosnooze_include";const at="autosnooze_last_duration";const ot="autosnooze_recent_snoozes";function st(){return it().map(e=>e.id)}function it(){try{const e=localStorage.getItem(ot);if(!e)return[];const t=JSON.parse(e);if(!Array.isArray(t))return[];const a=Date.now()-2592e6;return t.filter(e=>"string"==typeof e.id&&"number"==typeof e.timestamp&&e.timestamp>a)}catch{return[]}}function rt(e,t){const a=new Date(e),o=new Date,s={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return a.getFullYear()>o.getFullYear()&&(s.year="numeric"),a.toLocaleString(t,s)}function nt(e,t="Resuming..."){const a=new Date(e).getTime()-Date.now();if(a<=0)return t;const o=Math.floor(a/Ue),s=Math.floor(a%Ue/Oe),i=Math.floor(a%Oe/Ne),r=Math.floor(a%Ne/Le);return o>0?`${o}d ${s}h ${i}m`:s>0?`${s}h ${i}m ${r}s`:`${i}m ${r}s`}function lt(e,t,a){const o=[];return e>0&&o.push(`${e} day${1!==e?"s":""}`),t>0&&o.push(`${t} hour${1!==t?"s":""}`),a>0&&o.push(`${a} minute${1!==a?"s":""}`),o.join(", ")}function ut(e,t,a){const o=[];return e>0&&o.push(`${e}d`),t>0&&o.push(`${t}h`),a>0&&o.push(`${a}m`),o.join(" ")||"0m"}function dt(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let a=0,o=!1;const s=t.match(/(\d+(?:\.\d+)?)\s*d/),i=t.match(/(\d+(?:\.\d+)?)\s*h/),r=t.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(s?.[1]){const e=parseFloat(s[1]);if(isNaN(e)||e<0)return null;a+=e*Ge,o=!0}if(i?.[1]){const e=parseFloat(i[1]);if(isNaN(e)||e<0)return null;a+=e*He,o=!0}if(r?.[1]){const e=parseFloat(r[1]);if(isNaN(e)||e<0)return null;a+=e,o=!0}if(!o){const e=parseFloat(t);if(isNaN(e)||!(e>0))return null;a=e}if(a=Math.round(a),a<=0)return null;const n=Math.floor(a/Ge),l=a%Ge;return{days:n,hours:Math.floor(l/He),minutes:l%He}}function ct(e){return null!==dt(e)}function ht(e){return e.days*Ge+e.hours*He+e.minutes}function mt(e="light"){!function(e,t,a){const o=new CustomEvent(`hass-${t}`,{bubbles:!0,composed:!0,detail:a});e.dispatchEvent(o)}(window,"haptic",e)}function pt(e,t){const a=e,o=a?.translation_key??a?.data?.translation_key;if(o&&Qe[o])return Qe[o];const s=a?.message??"";for(const[e,t]of Object.entries(Qe))if(s.includes(e)||s.toLowerCase().includes(e.replace(/_/g," ")))return t;return`${t}. Check Home Assistant logs for details.`}async function gt(e,t){try{await e.callService("autosnooze","cancel",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to wake automation:",e),e}}async function _t(e,t){try{await e.callService("autosnooze","cancel_scheduled",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to cancel scheduled snooze:",e),e}}function bt(e,t){if(!e||!t)return null;const a=new Date(`${e}T${t}`);if(Number.isNaN(a.getTime()))return null;const o=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}-${String(a.getDate()).padStart(2,"0")}`,s=`${String(a.getHours()).padStart(2,"0")}:${String(a.getMinutes()).padStart(2,"0")}`;if(o!==e||s!==t)return null;const i=a.getTimezoneOffset(),r=i<=0?"+":"-",n=Math.abs(i);return`${e}T${t}${`${r}${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}`}async function ft(e){const t=e.scheduleMode?function(e){const t=e.disableAtDate&&e.disableAtTime?bt(e.disableAtDate,e.disableAtTime):null,a=bt(e.resumeAtDate,e.resumeAtTime);if(!a)return null;const o={entity_id:e.selected,resume_at:a,...t&&{disable_at:t},...e.forceConfirm&&{confirm:!0}},s=e.selected.length;return{request:o,toastMessage:t?1===s?be(e.hass,"toast.success.scheduled_one"):be(e.hass,"toast.success.scheduled_many",{count:s}):1===s?be(e.hass,"toast.success.snoozed_until_one",{time:rt(a,e.hass.locale?.language)}):be(e.hass,"toast.success.snoozed_until_many",{count:s,time:rt(a,e.hass.locale?.language)})}}(e):function(e){const{days:t,hours:a,minutes:o}=e.customDuration,s={minutes:ht(e.customDuration),duration:e.customDuration,timestamp:Date.now()};return{request:{entity_id:e.selected,days:t,hours:a,minutes:o,...e.forceConfirm&&{confirm:!0}},toastMessage:1===e.selected.length?be(e.hass,"toast.success.snoozed_for_one",{duration:lt(t,a,o)}):be(e.hass,"toast.success.snoozed_for_many",{count:e.selected.length,duration:lt(t,a,o)}),lastDuration:s}}(e);if(!t)return{status:"aborted"};try{await async function(e,t){try{await e.callService("autosnooze","pause",t)}catch(e){throw console.error("[AutoSnooze] Failed to pause automations:",e),e}}(e.hass,t.request)}catch(e){if("confirm_required"===function(e){const t=e;return t?.translation_key??t?.data?.translation_key}(e))return{status:"confirm_required"};throw e}return function(e){try{const t=Date.now(),a=it(),o=e.map(e=>({id:e,timestamp:t})),s=new Set(e),i=[...o,...a.filter(e=>!s.has(e.id))].slice(0,10);localStorage.setItem(ot,JSON.stringify(i))}catch{}}(e.selected),function(e){return"lastDuration"in e}(t)?(function(e,t){try{const a={minutes:t,duration:e,timestamp:Date.now()};localStorage.setItem(at,JSON.stringify(a))}catch{}}(t.lastDuration.duration,t.lastDuration.minutes),{status:"submitted",toastMessage:t.toastMessage,lastDuration:t.lastDuration}):{status:"submitted",toastMessage:t.toastMessage}}function yt(e){if(!e)return null;const t=new Date(e).getTime();return Number.isFinite(t)?t:null}async function vt(e,t,a){const{entityId:o,entityIds:s,...i}=t,r=s||o||"";await async function(e,t,a){try{await e.callService("autosnooze","adjust",{entity_id:t,...a})}catch(e){throw console.error("[AutoSnooze] Failed to adjust snooze:",e),e}}(e,r,i);const n=24*(i.days||0)*60*60*1e3+60*(i.hours||0)*60*1e3+60*(i.minutes||0)*1e3;return{nextResumeAt:new Date(new Date(a).getTime()+n).toISOString()}}function xt(e,t){const a=1e3-Date.now()%1e3;e.syncTimeout=globalThis.setTimeout(()=>{e.syncTimeout=null,t(),e.interval=globalThis.setInterval(()=>{t();Date.now()%1e3>50&&($t(e),xt(e,t))},Ke)},a)}function wt(e){const t={interval:null,syncTimeout:null};return xt(t,e),t}function $t(e){null!==e.interval&&(globalThis.clearInterval(e.interval),e.interval=null),null!==e.syncTimeout&&(globalThis.clearTimeout(e.syncTimeout),e.syncTimeout=null)}function zt(e){return{date:`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,time:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}function At(e){return{adjustModalOpen:!0,adjustModalEntityId:e.entityId??"",adjustModalFriendlyName:e.friendlyName??"",adjustModalResumeAt:e.resumeAt,adjustModalEntityIds:e.entityIds??[],adjustModalFriendlyNames:e.friendlyNames??[]}}function St(e,t){return new Date(t).toLocaleString(e?.locale?.language,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}function kt(e,t,a,o,s){const i=t&&a?bt(t,a):null,r=o&&s?bt(o,s):null;return i?r?new Date(r).getTime()>=new Date(i).getTime()?G`<div class="schedule-summary invalid" role="status" aria-live="polite">${be(e,"schedule.summary_invalid_order")}</div>`:G`<div class="schedule-summary" role="status" aria-live="polite">${be(e,"schedule.summary_with_disable",{disable:St(e,r),resume:St(e,i)})}</div>`:G`<div class="schedule-summary" role="status" aria-live="polite">${be(e,"schedule.summary_immediate",{resume:St(e,i)})}</div>`:""}function Ct(e){return e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}function Tt(e,t,a="Unassigned"){return e?t.areas?.[e]?.name??Ct(e):a}function Dt(e,t){return t[e]?.name??Ct(e)}function Rt(e,t,a="Uncategorized"){return e?t[e]?.name??Ct(e):a}function jt(e,t,a){return!(!e.labels||0===e.labels.length)&&e.labels.some(e=>{const o=a[e]?.name;return o?.toLowerCase()===t})}function Mt(e,t,a,o){const s={};return e.forEach(e=>{const i=t(e),r=a(e);if(!i||0===i.length)return s[o]||(s[o]=[]),void s[o].push(r);i.forEach(e=>{s[e]||(s[e]=[]),s[e].push(r)})}),Object.entries(s).sort((e,t)=>e[0]===o?1:t[0]===o?-1:e[0].localeCompare(t[0]))}function Et(e){const t=new Set([et.toLowerCase(),tt.toLowerCase()]),a=e.search.toLowerCase(),o=new Set,s=new Set,i=new Set,r=e.automations.map(a=>{a.area_id&&o.add(a.area_id),a.category_id&&i.add(a.category_id);const r=function(e,t,a){return e.labels?.length?e.labels.map(e=>Dt(e,t)).filter(e=>!a.has(e.toLowerCase())):[]}(a,e.labelRegistry,t);return a.labels?.length&&a.labels.forEach(a=>{const o=Dt(a,e.labelRegistry).toLowerCase();t.has(o)||s.add(a)}),{automation:a,areaName:a.area_id?e.hass?Tt(a.area_id,e.hass,e.emptyAreaLabel):Ct(a.area_id):e.emptyAreaLabel,categoryName:a.category_id?Rt(a.category_id,e.categoryRegistry,e.emptyCategoryLabel):e.emptyCategoryLabel,visibleLabelNames:r,hasIncludeLabel:jt(a,tt,e.labelRegistry),hasExcludeLabel:jt(a,et,e.labelRegistry)}}),n=r.some(e=>e.hasIncludeLabel),l=r.filter(e=>!!(n?e.hasIncludeLabel:!e.hasExcludeLabel)&&(!a||(e.automation.name.toLowerCase().includes(a)||e.automation.id.toLowerCase().includes(a)))),u="areas"===e.filterTab?Mt(l,e=>e.automation.area_id?[e.areaName]:null,e=>e.automation,e.emptyAreaLabel):"categories"===e.filterTab?Mt(l,e=>e.automation.category_id?[e.categoryName]:null,e=>e.automation,e.emptyCategoryLabel):"labels"===e.filterTab?Mt(l,e=>e.visibleLabelNames.length>0?e.visibleLabelNames:null,e=>e.automation,e.emptyLabelLabel):[];return{filtered:l.map(e=>e.automation),grouped:u,areaCount:o.size,labelCount:s.size,categoryCount:i.size}}const Pt="sensor.autosnooze_snoozed_automations",It={},Ft={},Lt=[];let Nt=null,Ot=null,Ut=null,Ht=null,Gt=null;function Vt(e){return!e||"object"!=typeof e||Array.isArray(e)?null:e}function Bt(e){return Vt(e)}function qt(e){return Vt(e)}function Wt(e){if(0===Object.keys(e).length)return Lt;const t={};return Object.entries(e).forEach(([e,a])=>{const o=a.resume_at;t[o]||(t[o]={resumeAt:o,disableAt:a.disable_at,automations:[]}),t[o].automations.push({entity_id:e,friendly_name:a.friendly_name,resume_at:a.resume_at,paused_at:a.paused_at,days:a.days,hours:a.hours,minutes:a.minutes,disable_at:a.disable_at})}),Object.values(t).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}function Kt(e){const t=e?.states?.[Pt]?.attributes,a=Vt(t),o=a?.schema_version,s=a?.paused??a?.paused_automations,i=a?.scheduled??a?.scheduled_snoozes;if(t===Nt&&o===Ot&&s===Ut&&i===Ht&&Gt)return Gt;const r=function(e){const t=Vt(e);if(!t)return{paused:It,scheduled:Ft};const a=t.schema_version;if(1===a){const e=Bt(t.paused),a=qt(t.scheduled);return e&&a?{paused:e,scheduled:a}:{paused:It,scheduled:Ft}}if(void 0===a){const e=Bt(t.paused)??Bt(t.paused_automations)??{},a=qt(t.scheduled)??qt(t.scheduled_snoozes)??{};if(Object.keys(e).length>0||Object.keys(a).length>0)return{paused:e,scheduled:a}}const o=Bt(t.paused_automations),s=qt(t.scheduled_snoozes);return{paused:o??It,scheduled:s??Ft}}(t);return Nt=t,Ot=o,Ut=s,Ht=i,Gt={paused:r.paused,scheduled:r.scheduled,groups:Wt(r.paused)},Gt}const Yt={days:0,hours:0,minutes:30};class Zt{constructor(){this._state={selected:[],filterTab:"all",search:"",customDuration:{...Yt},customDurationInput:"30m",durationMs:30*Ne}}getState(){return{...this._state,selected:[...this._state.selected],customDuration:{...this._state.customDuration}}}setSelection(e){this._state.selected=[...e]}toggleSelection(e){this._state.selected.includes(e)?this._state.selected=this._state.selected.filter(t=>t!==e):this._state.selected=[...this._state.selected,e]}clearSelection(){this._state.selected=[]}setFilterTab(e){this._state.filterTab=e}setSearch(e){this._state.search=e}setDuration(e,t){this._state.customDuration={...e},this._state.customDurationInput=t,this._state.durationMs=ht(e)*Ne}}class Jt extends ne{constructor(){super(...arguments),this.config={},this._cardStore=new Zt,this._selected=[],this._duration=30*Ne,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._scheduleMode=!1,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._labelRegistry={},this._labelRegistryUnavailable=!1,this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._automationsCache=null,this._automationsCacheVersion=0,this._lastDuration=null,this._recentSnoozeIds=[],this._adjustModalOpen=!1,this._adjustModalEntityId="",this._adjustModalFriendlyName="",this._adjustModalResumeAt="",this._adjustModalEntityIds=[],this._adjustModalFriendlyNames=[],this._guardrailConfirmOpen=!1,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._labelRegistryFetchPromise=null,this._categoryRegistryFetchPromise=null,this._entityRegistryFetchPromise=null,this._lastHassStates=null,this._lastCacheVersion=0,this._toastTimers={toastTimeout:null,toastFadeTimeout:null},this._labelRegistryRetryTimeout=null,this._labelRegistryRetryDelayMs=Ze,this._hapticFeedback=(e="light")=>{mt(e)},this._showToast=(e,t={})=>{!function(e,t,a,o,s={}){const{showUndo:i=!1,onUndo:r=null}=s;if(!e)return;e.querySelector(".toast")?.remove();const n=document.createElement("div");if(n.className="toast",n.setAttribute("role","alert"),n.setAttribute("aria-live","polite"),n.setAttribute("aria-atomic","true"),i&&r){const e=document.createElement("span");e.textContent=o,n.appendChild(e);const t=document.createElement("button");t.className="toast-undo-btn",t.textContent=be(a,"button.undo"),t.setAttribute("aria-label",be(a,"a11y.undo_action")),t.addEventListener("click",e=>{e.stopPropagation(),r(),n.remove()}),n.appendChild(t)}else n.textContent=o;e.appendChild(n),null!==t.toastTimeout&&clearTimeout(t.toastTimeout),null!==t.toastFadeTimeout&&clearTimeout(t.toastFadeTimeout),t.toastTimeout=window.setTimeout(()=>{t.toastTimeout=null,e&&n.parentNode&&(n.style.animation=`slideUp ${Be}ms ease-out reverse`,t.toastFadeTimeout=window.setTimeout(()=>{t.toastFadeTimeout=null,n.remove()},Be))},We)}(this.shadowRoot,this._toastTimers,this.hass,e,t)},this._getLocale=()=>this.hass?.locale?.language,this._formatDateTime=e=>rt(e,this._getLocale()),this._handleWakeEvent=async e=>{await this._wake(e.detail.entityId)},this._handleAdjustAutomationEvent=e=>{this._handleAdjustModalOpenEvent(e)},this._handleAdjustGroupEvent=e=>{this._handleAdjustModalOpenEvent(e)},this._getAutomationStateFingerprint=e=>Object.entries(e).filter(([e])=>e.startsWith("automation.")).map(([e,t])=>`${e}:${t.state}`).sort().join("|")}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-card",title:"AutoSnooze"}}setConfig(e){this.config=e}getCardSize(){const e=this._getPausedSnapshot(),t=e.paused,a=e.scheduled;return 4+Object.keys(t).length+Object.keys(a).length}shouldUpdate(e){if(!e.has("hass"))return!0;const t=e.get("hass"),a=this.hass;if(!t||!a)return!0;const o=t.states?.[Pt],s=a.states?.[Pt];if(o!==s)return!0;if(t.entities!==a.entities)return!0;if(t.areas!==a.areas)return!0;if((t.language??t.locale?.language)!==(a.language??a.locale?.language))return!0;const i=a.states,r=t.states;return!i||!r||r!==i&&function(e,t){let a=0;for(const[o,s]of Object.entries(e))if(o.startsWith("automation.")&&(a+=1,!(o in t)||t[o]!==s))return!0;let o=0;for(const e of Object.keys(t))e.startsWith("automation.")&&(o+=1);return a!==o}(r,i)}updated(e){if(super.updated(e),e.has("hass")&&this.hass?.connection&&(this._labelsFetched||null!==this._labelRegistryRetryTimeout||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry()),e.has("hass")&&this._adjustModalOpen){const e=function(e){const t=e.entityIds.length>0?e.entityIds:e.entityId?[e.entityId]:[];if(0===t.length)return{shouldClose:!1,nextResumeAt:null};const a=t.find(t=>e.paused[t]);if(!a)return{shouldClose:!0,nextResumeAt:null};const o=e.paused[a]?.resume_at;return{shouldClose:!1,nextResumeAt:o&&o!==e.currentResumeAt?o:null}}({paused:this._getPausedSnapshot().paused,entityIds:this._adjustModalEntityIds,entityId:this._adjustModalEntityId,currentResumeAt:this._adjustModalResumeAt});e.nextResumeAt&&(this._adjustModalResumeAt=e.nextResumeAt),e.shouldClose&&this._handleCloseModalEvent()}}connectedCallback(){super.connectedCallback(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry(),this._lastDuration=function(){try{const e=localStorage.getItem(at);if(!e)return null;const t=JSON.parse(e);return"number"!=typeof t.minutes||"number"!=typeof t.duration?.days||"number"!=typeof t.duration?.hours||"number"!=typeof t.duration?.minutes||"number"!=typeof t.timestamp?null:Date.now()-t.timestamp>6048e5?(localStorage.removeItem(at),null):t}catch{return null}}(),this._recentSnoozeIds=st()}disconnectedCallback(){super.disconnectedCallback(),null!==this._toastTimers.toastTimeout&&(clearTimeout(this._toastTimers.toastTimeout),this._toastTimers.toastTimeout=null),null!==this._toastTimers.toastFadeTimeout&&(clearTimeout(this._toastTimers.toastFadeTimeout),this._toastTimers.toastFadeTimeout=null),null!==this._labelRegistryRetryTimeout&&(clearTimeout(this._labelRegistryRetryTimeout),this._labelRegistryRetryTimeout=null)}async _fetchLabelRegistry(){await this._runRegistryFetch("_labelsFetched","_labelRegistryFetchPromise",()=>async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/label_registry/list"}),a={};return Array.isArray(t)&&t.forEach(e=>{a[e.label_id]=e}),a}catch(e){return console.warn("[AutoSnooze] Failed to fetch label registry:",e),null}}(this.hass),e=>{if(null!==e)this._labelRegistry=e,this._labelsFetched=!0,this._labelRegistryUnavailable=!1,this._automationsCacheVersion++,this._labelRegistryRetryDelayMs=Ze,null!==this._labelRegistryRetryTimeout&&(clearTimeout(this._labelRegistryRetryTimeout),this._labelRegistryRetryTimeout=null);else if(this._labelsFetched=!1,this._labelRegistryUnavailable=!0,null===this._labelRegistryRetryTimeout){const e=this._labelRegistryRetryDelayMs;this._labelRegistryRetryTimeout=window.setTimeout(()=>{this._labelRegistryRetryTimeout=null,this.isConnected&&this._fetchLabelRegistry()},e),this._labelRegistryRetryDelayMs=Math.min(2*this._labelRegistryRetryDelayMs,Je)}})}async _fetchCategoryRegistry(){await this._runRegistryFetch("_categoriesFetched","_categoryRegistryFetchPromise",()=>async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),a={};return Array.isArray(t)&&t.forEach(e=>{a[e.category_id]=e}),a}catch(e){return console.warn("[AutoSnooze] Failed to fetch category registry:",e),{}}}(this.hass),e=>{this._categoryRegistry=e,this._categoriesFetched=!0})}async _fetchEntityRegistry(){await this._runRegistryFetch("_entityRegistryFetched","_entityRegistryFetchPromise",()=>async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/entity_registry/list"}),a={};return Array.isArray(t)&&t.filter(e=>e.entity_id.startsWith("automation.")).forEach(e=>{a[e.entity_id]=e}),a}catch(e){return console.warn("[AutoSnooze] Failed to fetch entity registry:",e),{}}}(this.hass),e=>{this._entityRegistry=e,this._entityRegistryFetched=!0,this._automationsCacheVersion++})}async _runRegistryFetch(e,t,a,o){if(this[e]||!this.hass?.connection)return;const s=this[t];if(s)await s;else{this[t]=(async()=>{const e=await a();o(e)})();try{await this[t]}finally{this[t]=null}}}_getAutomations(){if(!this.hass?.states)return[];const e=this.hass.states,t=this._automationsCacheVersion;if(this._lastHassStates===e&&this._lastCacheVersion===t&&this._automationsCache)return this._automationsCache;const a=function(e,t){const a=e?.states,o=e?.entities;return a?Object.keys(a).filter(e=>e.startsWith("automation.")).map(e=>{const s=a[e];if(!s)return null;const i=t?.[e],r=o?.[e],n=i?.categories??{};return{id:e,name:s.attributes?.friendly_name??e.replace("automation.",""),area_id:i?.area_id??r?.area_id??null,category_id:n.automation??null,labels:i?.labels??r?.labels??[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name)):[]}(this.hass,this._entityRegistry);return this._automationsCache=a,this._lastCacheVersion=t,this._lastHassStates=e,a}_getPaused(){return this._getPausedSnapshot().paused}_getPausedGroupedByResumeTime(){return this._getPausedSnapshot().groups}_getScheduled(){return this._getPausedSnapshot().scheduled}_getPausedSnapshot(){return this.hass?Kt(this.hass):{paused:{},scheduled:{},groups:[]}}_hasResumeAt(){return Boolean(this._resumeAtDate&&this._resumeAtTime)}_hasDisableAt(){return Boolean(this._disableAtDate&&this._disableAtTime)}async _snooze(e=!1){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast(be(this.hass,"toast.error.resume_time_required"));const e=function(e){const t=yt(bt(e.resumeAtDate,e.resumeAtTime));if(null===t)return{status:"error",message:"Resume time is required"};if(t<=e.nowMs)return{status:"error",message:"Resume time must be in the future"};const a=e.disableAtDate&&e.disableAtTime?bt(e.disableAtDate,e.disableAtTime):null;if(e.disableAtDate&&e.disableAtTime&&null===a)return{status:"error",message:"Snooze time must be before resume time"};if(a){const e=yt(a);if(null===e)return{status:"error",message:"Snooze time must be before resume time"};if(e>=t)return{status:"error",message:"Snooze time must be before resume time"}}return{status:"valid"}}({disableAtDate:this._disableAtDate,disableAtTime:this._disableAtTime,resumeAtDate:this._resumeAtDate,resumeAtTime:this._resumeAtTime,nowMs:Date.now()+Ye});if("error"===e.status)return void this._showToast(be(this.hass,(t=e.message,"Resume time is required"===t?"toast.error.invalid_datetime":"Resume time must be in the future"===t?"toast.error.resume_time_past":"toast.error.snooze_before_resume")))}else if(0===this._duration)return;var t;this._loading=!0,this._guardrailConfirmOpen=!1;try{if(!this.hass)return void(this._loading=!1);const t=this._selected.length,a=[...this._selected],o=this._scheduleMode,s=this._hasDisableAt(),i=await ft({hass:this.hass,selected:this._selected,scheduleMode:this._scheduleMode,customDuration:this._customDuration,disableAtDate:this._disableAtDate,disableAtTime:this._disableAtTime,resumeAtDate:this._resumeAtDate,resumeAtTime:this._resumeAtTime,forceConfirm:e});if("confirm_required"===i.status)return this._guardrailConfirmOpen=!0,void(this._loading=!1);if("aborted"===i.status)return void(this._loading=!1);if(i.lastDuration&&(this._lastDuration=i.lastDuration),this._recentSnoozeIds=st(),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);this._hapticFeedback("success"),this._showToast(i.toastMessage,{showUndo:!0,onUndo:async()=>{try{if(!this.hass)return;const e=await async function(e,t,a){const o=a.wasScheduleMode&&a.hadDisableAt?t=>_t(e,t):t=>gt(e,t),s=await Promise.allSettled(t.map(e=>o(e))),i=[],r=[];return s.forEach((e,a)=>{const o=t[a];o&&("fulfilled"===e.status?i.push(o):r.push(o))}),{succeeded:i,failed:r}}(this.hass,a,{wasScheduleMode:o,hadDisableAt:s});if(this.isConnected)if(0===e.failed.length){this._setSelected(a);const e=1===t?be(this.hass,"toast.success.restored_one"):be(this.hass,"toast.success.restored_many",{count:t});this._showToast(e)}else this._setSelected(e.failed),this._showToast(be(this.hass,"toast.error.undo_failed"))}catch(e){console.error("Undo failed:",e),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.error.undo_failed"))}}}),this._setSelected([]),this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime=""}catch(e){console.error("Snooze failed:",e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(pt(e,"Failed to snooze automations"))}this._loading=!1}}async _wake(e){this.hass&&await this._runCardAction({run:()=>gt(this.hass,e),successMessage:be(this.hass,"toast.success.resumed"),failureLog:"Wake failed:",failureMessage:be(this.hass,"toast.error.resume_failed")})}async _handleWakeAllEvent(){this.hass&&await this._runCardAction({run:()=>async function(e){try{await e.callService("autosnooze","cancel_all",{})}catch(e){throw console.error("[AutoSnooze] Failed to wake all automations:",e),e}}(this.hass),successMessage:be(this.hass,"toast.success.resumed_all"),failureLog:"Wake all failed:",failureMessage:be(this.hass,"toast.error.resume_all_failed")})}_handleAdjustModalOpenEvent(e){this._applyAdjustModalState(At(e.detail))}async _handleAdjustTimeEvent(e){this.hass&&await this._runCardAction({run:()=>vt(this.hass,e.detail,this._adjustModalResumeAt),onSuccess:e=>{this._adjustModalResumeAt=e.nextResumeAt},successMessage:be(this.hass,"toast.success.adjusted"),failureLog:"Adjust failed:",failureMessage:be(this.hass,"toast.error.adjust_failed")})}_handleCloseModalEvent(){this._applyAdjustModalState({...At({resumeAt:""}),adjustModalOpen:!1})}async _cancelScheduled(e){this.hass&&await this._runCardAction({run:()=>_t(this.hass,e),successMessage:be(this.hass,"toast.success.cancelled"),failureLog:"Cancel scheduled failed:",failureMessage:be(this.hass,"toast.error.cancel_failed")})}_applyAdjustModalState(e){this._adjustModalOpen=e.adjustModalOpen,this._adjustModalEntityId=e.adjustModalEntityId,this._adjustModalFriendlyName=e.adjustModalFriendlyName,this._adjustModalResumeAt=e.adjustModalResumeAt,this._adjustModalEntityIds=e.adjustModalEntityIds,this._adjustModalFriendlyNames=e.adjustModalFriendlyNames}async _runCardAction({run:e,onSuccess:t,successMessage:a,failureLog:o,failureMessage:s}){try{const o=await e();t?.(o),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(a)}catch(e){console.error(o,e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(pt(e,s))}}_setSelected(e){this._cardStore.setSelection(e),this._selected=this._cardStore.getState().selected}_setDurationState(e,t){this._cardStore.setDuration(e,t);const a=this._cardStore.getState();this._duration=a.durationMs,this._customDuration=a.customDuration,this._customDurationInput=a.customDurationInput}_handleDurationChange(e){const{duration:t,input:a,showCustomInput:o}=e.detail;this._setDurationState(t,a),void 0!==o&&(this._showCustomInput=o)}_handleScheduleModeChange(e){const t=function(e){if(!e.enabled)return{scheduleMode:!1,disableAtDate:"",disableAtTime:"",resumeAtDate:"",resumeAtTime:""};const t=new Date(e.now.getTime()+60*e.resumeMinutes*1e3),a=zt(e.now),o=zt(t);return{scheduleMode:!0,disableAtDate:a.date,disableAtTime:a.time,resumeAtDate:o.date,resumeAtTime:o.time}}({enabled:e.detail.enabled,now:new Date,resumeMinutes:this._lastDuration?.minutes??30});this._scheduleMode=t.scheduleMode,e.detail.enabled&&(this._disableAtDate=t.disableAtDate,this._disableAtTime=t.disableAtTime,this._resumeAtDate=t.resumeAtDate,this._resumeAtTime=t.resumeAtTime)}_handleScheduleFieldChange(e){const{field:t,value:a}=e.detail,o={disableAtDate:()=>{this._disableAtDate=a},disableAtTime:()=>{this._disableAtTime=a},resumeAtDate:()=>{this._resumeAtDate=a},resumeAtTime:()=>{this._resumeAtTime=a}}[t];o?.()}_handleCustomInputToggle(e){this._showCustomInput=e.detail.show}render(){if(!this.hass||!this.config)return G``;const e=this._getPausedSnapshot(),t=e.paused,a=Object.keys(t).length,o=e.scheduled,s=Object.keys(o).length,i=this._getAutomations(),r=Boolean(this.hass?.states?.[Pt]);return G`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||be(this.hass,"card.default_title")}
          ${a>0||s>0?G`<span class="status-summary"
                >${a>0?be(this.hass,"status.active_count",{count:a}):""}${a>0&&s>0?", ":""}${s>0?be(this.hass,"status.scheduled_count",{count:s}):""}</span
              >`:""}
        </div>

        ${r?"":G`
              <div class="sensor-health-banner" role="status">
                ${be(this.hass,"status.sensor_unavailable")}
              </div>
            `}

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${i}
            .selected=${this._selected}
            .labelRegistry=${this._labelRegistry}
            .labelRegistryUnavailable=${this._labelRegistryUnavailable}
            .categoryRegistry=${this._categoryRegistry}
            .recentSnoozeIds=${this._recentSnoozeIds}
            @selection-change=${e=>this._setSelected(e.detail.selected)}
          ></autosnooze-automation-list>

          <autosnooze-duration-selector
            .hass=${this.hass}
            .scheduleMode=${this._scheduleMode}
            .customDuration=${this._customDuration}
            .customDurationInput=${this._customDurationInput}
            .showCustomInput=${this._showCustomInput}
            .lastDuration=${this._lastDuration}
            .disableAtDate=${this._disableAtDate}
            .disableAtTime=${this._disableAtTime}
            .resumeAtDate=${this._resumeAtDate}
            .resumeAtTime=${this._resumeAtTime}
            @duration-change=${this._handleDurationChange}
            @schedule-mode-change=${this._handleScheduleModeChange}
            @schedule-field-change=${this._handleScheduleFieldChange}
            @custom-input-toggle=${this._handleCustomInputToggle}
          ></autosnooze-duration-selector>

          ${this._guardrailConfirmOpen?G`
            <div class="guardrail-confirm" role="alertdialog" aria-live="polite">
              <div class="guardrail-title">${be(this.hass,"guardrail.confirm_title")}</div>
              <div class="guardrail-body">${be(this.hass,"guardrail.confirm_body")}</div>
              <div class="guardrail-actions">
                <button type="button" class="guardrail-cancel-btn" @click=${()=>{this._guardrailConfirmOpen=!1}}>
                  ${be(this.hass,"button.cancel")}
                </button>
                <button type="button" class="guardrail-continue-btn" @click=${async()=>{this._guardrailConfirmOpen=!1,await this._snooze(!0)}}>
                  ${be(this.hass,"button.continue")}
                </button>
              </div>
            </div>
          `:""}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!ct(this._customDurationInput)||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${()=>this._snooze()}
            aria-label="${this._loading?be(this.hass,"a11y.snoozing"):this._scheduleMode?be(this.hass,"a11y.schedule_snooze",{count:this._selected.length}):be(this.hass,"a11y.snooze_count",{count:this._selected.length})}"
            aria-busy=${this._loading}
          >
            ${this._loading?be(this.hass,"button.snoozing"):this._scheduleMode?be(this.hass,"button.schedule_count",{count:this._selected.length}):be(this.hass,"button.snooze_count",{count:this._selected.length})}
          </button>
        </div>

        ${a>0?G`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${e.groups}
              .pausedCount=${a}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @adjust-automation=${this._handleAdjustModalOpenEvent}
              @adjust-group=${this._handleAdjustModalOpenEvent}
            ></autosnooze-active-pauses>`:""}
        ${function(e,t,a,o,s){return 0===t?"":G`
    <div class="scheduled-list" role="region" aria-label="${be(e,"a11y.scheduled_region")}">
      <div class="list-header">
        <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
        ${be(e,"section.scheduled_count",{count:t})}
      </div>
      ${Object.entries(a).map(([t,a])=>G`
        <div class="scheduled-item" role="article" aria-label="${be(e,"a11y.scheduled_pause_for",{name:a.friendly_name||t})}">
          <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
          <div class="paused-info">
            <div class="paused-name">${a.friendly_name||t}</div>
            <div class="scheduled-time">${be(e,"status.disables")} ${o(a.disable_at||"now")}</div>
            <div class="paused-time">${be(e,"status.resumes_at")} ${o(a.resume_at)}</div>
          </div>
          <button type="button" class="cancel-scheduled-btn" @click=${()=>s(t)} aria-label="${be(e,"a11y.cancel_scheduled_for",{name:a.friendly_name||t})}">
            ${be(e,"button.cancel")}
          </button>
        </div>
      `)}
    </div>
  `}(this.hass,s,o,e=>rt(e,this.hass?.locale?.language),e=>{this._cancelScheduled(e)})}
        <autosnooze-adjust-modal
          .hass=${this.hass}
          .open=${this._adjustModalOpen}
          .entityId=${this._adjustModalEntityId}
          .friendlyName=${this._adjustModalFriendlyName}
          .resumeAt=${this._adjustModalResumeAt}
          .entityIds=${this._adjustModalEntityIds}
          .friendlyNames=${this._adjustModalFriendlyNames}
          @adjust-time=${this._handleAdjustTimeEvent}
          @close-modal=${this._handleCloseModalEvent}
        ></autosnooze-adjust-modal>
      </ha-card>
    `}}Jt.styles=[fe,Fe],e([ce({attribute:!1})],Jt.prototype,"hass",void 0),e([ce({attribute:!1})],Jt.prototype,"config",void 0),e([he()],Jt.prototype,"_selected",void 0),e([he()],Jt.prototype,"_duration",void 0),e([he()],Jt.prototype,"_customDuration",void 0),e([he()],Jt.prototype,"_customDurationInput",void 0),e([he()],Jt.prototype,"_loading",void 0),e([he()],Jt.prototype,"_scheduleMode",void 0),e([he()],Jt.prototype,"_disableAtDate",void 0),e([he()],Jt.prototype,"_disableAtTime",void 0),e([he()],Jt.prototype,"_resumeAtDate",void 0),e([he()],Jt.prototype,"_resumeAtTime",void 0),e([he()],Jt.prototype,"_labelRegistry",void 0),e([he()],Jt.prototype,"_labelRegistryUnavailable",void 0),e([he()],Jt.prototype,"_categoryRegistry",void 0),e([he()],Jt.prototype,"_entityRegistry",void 0),e([he()],Jt.prototype,"_showCustomInput",void 0),e([he()],Jt.prototype,"_automationsCache",void 0),e([he()],Jt.prototype,"_automationsCacheVersion",void 0),e([he()],Jt.prototype,"_lastDuration",void 0),e([he()],Jt.prototype,"_recentSnoozeIds",void 0),e([he()],Jt.prototype,"_adjustModalOpen",void 0),e([he()],Jt.prototype,"_adjustModalEntityId",void 0),e([he()],Jt.prototype,"_adjustModalFriendlyName",void 0),e([he()],Jt.prototype,"_adjustModalResumeAt",void 0),e([he()],Jt.prototype,"_adjustModalEntityIds",void 0),e([he()],Jt.prototype,"_adjustModalFriendlyNames",void 0),e([he()],Jt.prototype,"_guardrailConfirmOpen",void 0);const Xt=r`
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
`;class Qt extends ne{constructor(){super(...arguments),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const a={...this._config,[e]:t};""!==t&&null!=t||delete a[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:a},bubbles:!0,composed:!0}))}render(){return this._config?G`
      <div class="row">
        <label for="title-input">${be(this.hass,"editor.title_label")}</label>
        <input
          id="title-input"
          type="text"
          .value=${this._config.title??""}
          @input=${e=>this._valueChanged("title",e.target.value)}
          placeholder="${be(this.hass,"editor.title_placeholder")}"
        />
      </div>
    `:G``}}Qt.styles=Xt,e([ce({attribute:!1})],Qt.prototype,"hass",void 0),e([he()],Qt.prototype,"_config",void 0);const ea=r`
    ${ye}
    ${xe}
    ${we}
    ${$e}
    ${ze}
    ${Ae}
    ${Te}
    ${Re}
    .snooze-list {
      border: 2px solid #ff9800;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.05);
      padding: 12px;
      margin-top: 20px;
    }
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
      cursor: pointer;
    }
    .pause-group-header:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
      color: #ff9800;
    }
    .pause-group-header .countdown {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
    }
    .paused-item:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .paused-item + .paused-item {
      border-top: 1px solid var(--divider-color);
    }
    .paused-icon {
      color: var(--secondary-text-color);
      opacity: 0.6;
    }
    .countdown {
      font-size: 0.9em;
      color: var(--primary-text-color);
      font-weight: 500;
      white-space: nowrap;
    }
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
    .wake-all:hover,
    .wake-all.pending {
      background: #ff9800;
      color: white;
    }
    ${Ie}
`;class ta extends ne{constructor(){super(...arguments),this.pauseGroups=[],this.pausedCount=0,this._wakeAllPending=!1,this._wakeAllTimeout=null,this._countdownState={interval:null,syncTimeout:null}}connectedCallback(){super.connectedCallback(),this._syncCountdownLifecycle()}updated(e){e.has("pauseGroups")&&this._syncCountdownLifecycle()}disconnectedCallback(){super.disconnectedCallback(),$t(this._countdownState),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null)}_scheduleCountdownBootstrap(){this._countdownState={interval:null,syncTimeout:globalThis.setTimeout(()=>{this._countdownState.syncTimeout=null,this.pauseGroups.some(e=>!e.disableAt)&&(this._countdownState=wt(()=>{this.pauseGroups.length>0&&this.requestUpdate()}))},0)}}_syncCountdownLifecycle(){$t(this._countdownState),0!==this.pauseGroups.length?this.pauseGroups.some(e=>!e.disableAt)?this._countdownState=wt(()=>{this.pauseGroups.length>0&&this.requestUpdate()}):this._countdownState={interval:null,syncTimeout:null}:this._scheduleCountdownBootstrap()}_handleWakeAll(){this._wakeAllPending?(null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),this._wakeAllPending=!1,this._fireWakeAll()):(mt("medium"),this._wakeAllPending=!0,this._wakeAllTimeout=window.setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},qe))}_fireWake(e){this._dispatchPauseEvent("wake-automation",{entityId:e})}_fireAdjustEvent(e,t){this._dispatchPauseEvent(e,t)}_fireAdjust(e){this._fireAdjustEvent("adjust-automation",{entityId:e.entity_id,friendlyName:e.friendly_name,resumeAt:e.resume_at})}_fireAdjustGroup(e){this._fireAdjustEvent("adjust-group",{entityIds:e.automations.map(e=>e.entity_id),friendlyNames:e.automations.map(e=>e.friendly_name||e.entity_id),resumeAt:e.resumeAt})}_fireWakeAll(){this._dispatchPauseEvent("wake-all",void 0)}_dispatchPauseEvent(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}render(){if(0===this.pausedCount)return G``;const e=this.hass?.locale?.language;return G`
      <div class="snooze-list" role="region" aria-label="${be(this.hass,"a11y.snoozed_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${be(this.hass,"section.snoozed_count",{count:this.pausedCount})}
        </div>
        ${this.pauseGroups.map(t=>G`
          <div class="pause-group" role="group">
            <div class="pause-group-header"
              @click=${()=>this._fireAdjustGroup(t)}
              role="button"
              aria-label="${be(this.hass,"a11y.adjust_group",{count:t.automations.length})}">
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              ${t.disableAt?G`${be(this.hass,"status.resumes")} ${rt(t.resumeAt,e)}`:G`<span class="countdown">${nt(t.resumeAt,be(this.hass,"status.resuming"))}</span>`}
            </div>
            ${t.automations.map(e=>G`
              <div class="paused-item" role="button" tabindex="0" @click=${()=>this._fireAdjust(e)} @keydown=${t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._fireAdjust(e))}}>
                <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                <div class="paused-info">
                  <div class="paused-name">${e.friendly_name||e.entity_id}</div>
                </div>
                <button type="button" class="wake-btn" @click=${t=>{t.stopPropagation(),this._fireWake(e.entity_id)}}>
                  ${be(this.hass,"button.resume")}
                </button>
              </div>
            `)}
          </div>
        `)}
        ${this.pausedCount>1?G`
          <button type="button" class="wake-all ${this._wakeAllPending?"pending":""}"
            @click=${()=>this._handleWakeAll()}>
            ${this._wakeAllPending?be(this.hass,"button.confirm_resume_all"):be(this.hass,"button.resume_all")}
          </button>
        `:""}
      </div>
    `}}ta.styles=[fe,ea],e([ce({attribute:!1})],ta.prototype,"hass",void 0),e([ce({attribute:!1})],ta.prototype,"pauseGroups",void 0),e([ce({type:Number})],ta.prototype,"pausedCount",void 0),e([he()],ta.prototype,"_wakeAllPending",void 0);const aa=r`
    ${ye}
    ${xe}
    ${ze}
    ${Se}
    ${De}
    ${Re}

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
      color: var(--primary-text-color);
    }
    .pill:hover {
      border-color: var(--primary-color);
    }
    /* Duration Header Row */
    .duration-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 12px;
    }

    /* Last Duration Floating Badge - Prominent Style */
    .last-duration-badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 20px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.85em;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
      line-height: 1;
      box-sizing: border-box;
      animation: badge-fade-in 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    .last-duration-badge ha-icon {
      --mdc-icon-size: 16px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .last-duration-badge:hover:not(.active) {
      border-color: var(--primary-color);
    }

    .last-duration-badge.active ha-icon {
      color: var(--text-primary-color);
    }

    .last-duration-badge:active:not(.active) {
      transform: scale(0.98);
      background: rgba(var(--rgb-primary-color), 0.08);
      border-color: var(--primary-color);
      transition-duration: 0.1s;
    }

    /* Entry animation */
    @keyframes badge-fade-in {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Mobile adjustments for badge */
    @media (max-width: 400px) {
      .last-duration-badge {
        font-size: 0.8em;
        padding: 8px 10px;
        gap: 5px;
      }

      .last-duration-badge ha-icon {
        --mdc-icon-size: 14px;
      }
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
    .schedule-summary {
      font-size: 0.82em;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary-color) 24%, transparent);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .schedule-summary.invalid {
      color: #b71c1c;
      background: color-mix(in srgb, #f44336 10%, transparent);
      border-color: color-mix(in srgb, #f44336 36%, transparent);
    }

    ${Me}
`;class oa extends ne{constructor(){super(...arguments),this.scheduleMode=!1,this.customDuration={days:0,hours:0,minutes:30},this.customDurationInput="30m",this.showCustomInput=!1,this.lastDuration=null,this.disableAtDate="",this.disableAtTime="",this.resumeAtDate="",this.resumeAtTime="",this._getDurationPreview=()=>{const e=dt(this.customDurationInput);return e?lt(e.days,e.hours,e.minutes):""},this._isDurationValid=()=>ct(this.customDurationInput)}_getDurationPills(){const e=this.hass?.states?.[Pt],t=e?.attributes?.duration_presets,a=t?.length?t:Xe.filter(e=>null!==e.minutes);return[...a,{label:be(this.hass,"duration.custom"),minutes:null}]}_fireDurationChange(e,t){const a=function(e){const t=Math.floor(e/Ge),a=e%Ge;return{days:t,hours:Math.floor(a/He),minutes:a%He}}(e),o=ut(a.days,a.hours,a.minutes);this._dispatchSelectorEvent("duration-change",{minutes:e,duration:a,input:o,showCustomInput:t?.showCustomInput??!1})}_fireCustomDurationChange(e){const t=dt(e),a=t?ht(t):0;this._dispatchSelectorEvent("duration-change",{minutes:a,duration:t??{days:0,hours:0,minutes:0},input:e})}_fireScheduleModeChange(e){this._dispatchSelectorEvent("schedule-mode-change",{enabled:e})}_fireScheduleFieldChange(e,t){this._dispatchSelectorEvent("schedule-field-change",{field:e,value:t})}_dispatchSelectorEvent(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}_renderLastDurationBadge(){if(!this.lastDuration)return"";const e=this.lastDuration.minutes,t=!this._getDurationPills().some(t=>t.minutes===e);if(!t)return"";const{days:a,hours:o,minutes:s}=this.lastDuration.duration,i=ut(a,o,s).replace(/ /g,""),r=ht(this.customDuration),n=!this.showCustomInput&&e===r;return G`
      <button
        type="button"
        class="last-duration-badge ${n?"active":""}"
        @click=${()=>this._fireDurationChange(e)}
      >
        <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
        ${i}
      </button>
    `}render(){const e=function(e=365,t){const a=[],o=new Date,s=o.getFullYear();for(let i=0;i<e;i++){const e=new Date(o);e.setDate(e.getDate()+i);const r=e.getFullYear(),n=`${r}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,l=e.toLocaleDateString(t,{weekday:"short"}),u=e.toLocaleDateString(t,{month:"short"}),d=e.getDate(),c=r!==s?`${l}, ${u} ${d}, ${r}`:`${l}, ${u} ${d}`;a.push({value:n,label:c})}return a}(365,this.hass?.locale?.language).map(e=>G`<option value="${e.value}">${e.label}</option>`);if(this.scheduleMode){const a=[{labelId:"snooze-at-label",labelKey:"schedule.snooze_at",dateValue:this.disableAtDate,timeValue:this.disableAtTime,dateField:"disableAtDate",timeField:"disableAtTime",hintKey:"schedule.hint_immediate"},{labelId:"resume-at-label",labelKey:"schedule.resume_at",dateValue:this.resumeAtDate,timeValue:this.resumeAtTime,dateField:"resumeAtDate",timeField:"resumeAtTime"}];return t={hass:this.hass,dateOptions:e,fields:a,scheduleSummary:kt(this.hass,this.resumeAtDate,this.resumeAtTime,this.disableAtDate,this.disableAtTime),onFieldChange:(e,t)=>this._fireScheduleFieldChange(e,t),onBackToDuration:()=>this._fireScheduleModeChange(!1)},G`
    <div class="schedule-inputs">
      ${t.fields.map(e=>G`
        <div class="datetime-field">
          <label id=${e.labelId}>${be(t.hass,e.labelKey)}</label>
          <div class="datetime-row">
            <select .value=${e.dateValue} @change=${a=>t.onFieldChange(e.dateField,a.target.value)} aria-labelledby=${e.labelId}>
              <option value="">${be(t.hass,"schedule.select_date")}</option>
              ${t.dateOptions}
            </select>
            <input type="time" .value=${e.timeValue} @input=${a=>t.onFieldChange(e.timeField,a.target.value)} aria-labelledby=${e.labelId} />
          </div>
          ${e.hintKey?G`<span class="field-hint">${be(t.hass,e.hintKey)}</span>`:""}
        </div>
      `)}
      ${t.scheduleSummary}
      <button type="button" class="schedule-link" @click=${t.onBackToDuration}>
        <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
        ${be(t.hass,"schedule.back_to_duration")}
      </button>
    </div>
  `}var t;const a=this._getDurationPreview(),o=this._isDurationValid();return G`
      <div class="duration-selector">
        <div class="duration-header-row">
          <div class="duration-section-header" id="duration-header">${be(this.hass,"duration.header")}</div>
          ${this._renderLastDurationBadge()}
        </div>
        <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
          ${this._getDurationPills().map(e=>{const t=ht(this.customDuration),a=null===e.minutes?this.showCustomInput:!this.showCustomInput&&e.minutes===t;return G`
                <button
                  type="button"
                  class="pill ${a?"active":""}"
                  @click=${()=>{null===e.minutes?this._dispatchSelectorEvent("custom-input-toggle",{show:!this.showCustomInput}):this._fireDurationChange(e.minutes,{showCustomInput:!1})}}
                  role="radio"
                  aria-checked=${a}
                >
                  ${e.label}
                </button>
              `})}
        </div>

        ${this.showCustomInput?G`
          <div class="custom-duration-input">
            <input
              type="text"
              class="duration-input ${o?"":"invalid"}"
              placeholder="${be(this.hass,"duration.placeholder")}"
              .value=${this.customDurationInput}
              @input=${e=>this._fireCustomDurationChange(e.target.value)}
              aria-label="${be(this.hass,"a11y.custom_duration")}"
              aria-invalid=${!o}
              aria-describedby="duration-help"
            />
            ${a&&o?G`<div class="duration-preview" role="status" aria-live="polite">${be(this.hass,"duration.preview_label")} ${a}</div>`:G`<div class="duration-help" id="duration-help">${be(this.hass,"duration.help")}</div>`}
          </div>
        `:""}

        <button
          type="button"
          class="schedule-link"
          @click=${()=>this._fireScheduleModeChange(!0)}
        >
          ${be(this.hass,"schedule.pick_datetime")}
        </button>
      </div>
    `}}oa.styles=aa,e([ce({attribute:!1})],oa.prototype,"hass",void 0),e([ce({type:Boolean})],oa.prototype,"scheduleMode",void 0),e([ce({attribute:!1})],oa.prototype,"customDuration",void 0),e([ce({type:String})],oa.prototype,"customDurationInput",void 0),e([ce({type:Boolean})],oa.prototype,"showCustomInput",void 0),e([ce({attribute:!1})],oa.prototype,"lastDuration",void 0),e([ce({type:String})],oa.prototype,"disableAtDate",void 0),e([ce({type:String})],oa.prototype,"disableAtTime",void 0),e([ce({type:String})],oa.prototype,"resumeAtDate",void 0),e([ce({type:String})],oa.prototype,"resumeAtTime",void 0);const sa=r`
    ${ye}
    ${ve}
    ${xe}
    ${we}
    ${ze}
    ${Se}
    ${ke}
    ${Ce}
    ${Te}
    ${De}
    ${Re}

    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }

    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      row-gap: 8px;
      margin-bottom: 12px;
      flex-wrap: nowrap;
      min-width: 0;
      background: var(--secondary-background-color);
      padding: 8px;
      border-radius: 10px;
    }
    .search-box {
      position: relative;
      flex: 1 1 0;
      min-width: 0;
    }
    .search-box input {
      width: 100%;
      padding: 8px 72px 8px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.95em;
      min-height: 40px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .search-clear-btn {
      position: absolute;
      top: 50%;
      right: 8px;
      transform: translateY(-50%);
      padding: 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.8em;
      line-height: 1;
      min-height: 30px;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .search-clear-btn:hover {
      background: var(--secondary-background-color);
    }
    .registry-warning {
      margin-bottom: 10px;
      padding: 8px 10px;
      font-size: 0.82em;
    }

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
    .list-item,
    .group-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      width: 100%;
      text-align: left;
      font-family: inherit;
      color: inherit;
      box-sizing: border-box;
    }
    .list-item {
      gap: 10px;
      padding: 12px;
      transition: background 0.2s;
      min-height: 48px;
      background: transparent;
      font-size: inherit;
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
    .list-item input[type="checkbox"], .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .list-item input[type="checkbox"] {
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

    .recent-group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      font-size: 0.8em;
      font-weight: 600;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: color-mix(in srgb, var(--primary-color) 6%, transparent);
      border-bottom: 1px solid var(--divider-color);
    }
    .recent-group-header ha-icon {
      --mdc-icon-size: 14px;
      color: var(--primary-color);
      opacity: 0.85;
      flex-shrink: 0;
    }
    .list-item.is-recent:not(:hover):not(.selected) {
      background: color-mix(in srgb, var(--primary-color) 4%, transparent);
    }

    .group-header {
      gap: 8px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      font-weight: 500;
      font-size: 0.9em;
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

    .selection-count {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      margin-left: auto;
      padding: 0;
      background: transparent;
      color: var(--secondary-text-color);
      white-space: nowrap;
      line-height: 1.2;
      font-size: 0.84em;
      font-variant-numeric: tabular-nums;
    }
    .select-all-btn {
      padding: 0 8px;
      border: 1px solid color-mix(in srgb, var(--primary-color) 50%, var(--divider-color));
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.78em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 28px;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .clear-selection-btn:hover {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      border-color: var(--divider-color);
    }
    .clear-selection-btn:active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    ${je}
`;class ia extends ne{constructor(){super(...arguments),this.automations=[],this.selected=[],this.labelRegistry={},this.labelRegistryUnavailable=!1,this.categoryRegistry={},this.recentSnoozeIds=[],this._filterTab="all",this._search="",this._searchInput="",this._expandedGroups={},this._searchTimeout=null,this._viewModelCache=null,this._getAreaCount=()=>this._getViewModel().areaCount,this._getLabelCount=()=>this._getViewModel().labelCount,this._getCategoryCount=()=>this._getViewModel().categoryCount}disconnectedCallback(){super.disconnectedCallback(),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null)}_fireSelectionChange(e){this.dispatchEvent(new CustomEvent("selection-change",{detail:{selected:e},bubbles:!0,composed:!0}))}_toggleSelection(e){let t;mt("selection"),t=this.selected.includes(e)?this.selected.filter(t=>t!==e):[...this.selected,e],this._fireSelectionChange(t)}_toggleGroupExpansion(e){this._expandedGroups={...this._expandedGroups,[e]:!this._expandedGroups[e]}}_selectGroup(e){const t=e.map(e=>e.id);let a;a=t.every(e=>this.selected.includes(e))?this.selected.filter(e=>!t.includes(e)):[...new Set([...this.selected,...t])],this._fireSelectionChange(a)}_selectAllVisible(){const e=this._getViewModel().filtered.map(e=>e.id),t=[...new Set([...this.selected,...e])];this._fireSelectionChange(t)}_clearSelection(){this._fireSelectionChange([])}_getFilteredAutomations(){return this._getViewModel().filtered}_getAreaName(e){return this.hass?Tt(e??null,this.hass,be(this.hass,"group.unassigned")):be(this.hass,"group.unassigned")}_getLabelName(e){return Dt(e,this.labelRegistry)}_getCategoryName(e){return Rt(e??null,this.categoryRegistry,be(this.hass,"group.uncategorized"))}_buildViewModelInput(e=this._filterTab){return{automations:this.automations,search:this._search,filterTab:e,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,emptyAreaLabel:be(this.hass,"group.unassigned"),emptyLabelLabel:be(this.hass,"group.unlabeled"),emptyCategoryLabel:be(this.hass,"group.uncategorized")}}_getGroupedView(e){return e===this._filterTab?this._getViewModel().grouped:Et(this._buildViewModelInput(e)).grouped}_getGroupedByArea(){return this._getGroupedView("areas")}_getGroupedByLabel(){return this._getGroupedView("labels")}_getGroupedByCategory(){return this._getGroupedView("categories")}_getViewModel(){const e=this._viewModelCache;if(e&&e.automations===this.automations&&e.search===this._search&&e.filterTab===this._filterTab&&e.hass===this.hass&&e.labelRegistry===this.labelRegistry&&e.categoryRegistry===this.categoryRegistry)return e.result;const t=Et(this._buildViewModelInput());return this._viewModelCache={automations:this.automations,search:this._search,filterTab:this._filterTab,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,result:t},t}_handleSearchInput(e){const t=e.target.value;this._searchInput=t,null!==this._searchTimeout&&clearTimeout(this._searchTimeout),this._searchTimeout=window.setTimeout(()=>{this._search=t,this._searchTimeout=null},Ve)}_renderAutomationRow(e,t,a=""){return G`
      <button
        type="button"
        class="list-item ${t.has(e.id)?"selected":""} ${a}"
        @click=${()=>this._toggleSelection(e.id)}
        role="option"
        aria-selected=${t.has(e.id)}
      >
        <input
          type="checkbox"
          .checked=${t.has(e.id)}
          @click=${e=>e.stopPropagation()}
          @change=${()=>this._toggleSelection(e.id)}
          aria-label="${be(this.hass,"a11y.select_automation",{name:e.name})}"
          tabindex="-1"
        />
        <div class="list-item-content">
          <div class="list-item-name">${e.name}</div>
        </div>
      </button>
    `}_renderEmptyList(){return G`<div class="list-empty" role="status">${be(this.hass,"list.empty")}</div>`}_resetSearch(){null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),this._searchInput="",this._search=""}_renderSelectionList(e,t){const{filtered:a,grouped:o}=e;if("all"===this._filterTab){if(0===a.length)return this._renderEmptyList();const{recentItems:e,ordered:o}=function(e,t){const a=new Set(t),o=[],s=[];for(const t of e)(a.has(t.id)?o:s).push(t);return{recentItems:o,ordered:o.concat(s)}}(a,this.recentSnoozeIds);return G`
        ${e.length>0?G`
          <div class="recent-group-header">
            <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
            <span>${be(this.hass,"group.recent")}</span>
          </div>
        `:""}
        ${o.map((a,o)=>this._renderAutomationRow(a,t,o<e.length?"is-recent":""))}
      `}return 0===o.length?this._renderEmptyList():o.map(([e,a])=>{const o=!1!==this._expandedGroups[e],s=a.every(e=>t.has(e.id)),i=a.some(e=>t.has(e.id))&&!s;return G`
        <button
          type="button"
          class="group-header ${o?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(e)}
          aria-expanded=${o}
          aria-label="${be(this.hass,"a11y.group_header",{name:e,count:a.length})}"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${e}</span>
          <span class="group-badge" aria-label="${be(this.hass,"a11y.group_count",{count:a.length})}">${a.length}</span>
          <input
            type="checkbox"
            .checked=${s}
            .indeterminate=${i}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._selectGroup(a)}
            aria-label="${be(this.hass,"a11y.select_all_in_group",{name:e})}"
            tabindex="-1"
          />
        </button>
        ${o?a.map(e=>this._renderAutomationRow(e,t)):""}
      `})}_getTabDescriptors(e){return[{tab:"all",labelKey:"tab.all",countLabelKey:"a11y.automation_count",count:this.automations.length},{tab:"areas",labelKey:"tab.areas",countLabelKey:"a11y.area_count",count:e.areaCount},{tab:"categories",labelKey:"tab.categories",countLabelKey:"a11y.category_count",count:e.categoryCount},{tab:"labels",labelKey:"tab.labels",countLabelKey:"a11y.label_count",count:e.labelCount}]}_renderFilterTab({tab:e,labelKey:t,countLabelKey:a,count:o}){return G`
      <button
        type="button"
        class="tab ${this._filterTab===e?"active":""}"
        @click=${()=>this._filterTab=e}
        role="tab"
        aria-selected=${this._filterTab===e}
        aria-controls="selection-list"
      >
        ${be(this.hass,t)}
        <span class="tab-count" aria-label="${be(this.hass,a,{count:o})}">${o}</span>
      </button>
    `}render(){const e=this._getViewModel(),{filtered:t}=e,a=new Set(this.selected),o=this.labelRegistryUnavailable,s=this._searchInput.length>0||this._search.length>0,i=t.length>0&&t.every(e=>a.has(e.id));return G`
      <div class="filter-tabs" role="tablist" aria-label="${be(this.hass,"a11y.filter_tabs")}">
        ${this._getTabDescriptors(e).map(e=>this._renderFilterTab(e))}
      </div>

      <div class="search-row selection-actions">
        <div class="search-box">
          <input
            type="search"
            placeholder="${be(this.hass,"search.placeholder")}"
            .value=${this._searchInput||this._search}
            @input=${e=>this._handleSearchInput(e)}
            @keydown=${e=>{"Escape"===e.key&&(this._searchInput||this._search)&&(e.preventDefault(),this._resetSearch())}}
            aria-label="${be(this.hass,"a11y.search")}"
          />
          ${s?G`
                <button
                  type="button"
                  class="search-clear-btn"
                  @click=${()=>this._resetSearch()}
                  aria-label="${be(this.hass,"a11y.clear_search")}"
                >
                  ${be(this.hass,"button.clear")}
                </button>
              `:""}
        </div>

        ${t.length>0?G`
              <span class="selection-count" role="status" aria-live="polite">
                ${be(this.hass,"selection.count",{selected:this.selected.length,total:t.length})}
              </span>
              ${i?"":G`
                    <button
                      type="button"
                      class="select-all-btn"
                      @click=${()=>this._selectAllVisible()}
                      aria-label="${be(this.hass,"a11y.select_all")}"
                    >
                      ${be(this.hass,"button.select_all")}
                    </button>
                  `}
              ${this.selected.length>0?G`<button type="button" class="select-all-btn clear-selection-btn" @click=${()=>this._clearSelection()} aria-label="${be(this.hass,"a11y.clear_selection")}">${be(this.hass,"button.clear")}</button>`:""}
            `:""}
      </div>

      ${o?G`
            <div class="registry-warning" role="status">
              ${be(this.hass,"list.label_registry_warning")}
            </div>
          `:""}

      <div class="selection-list" id="selection-list" role="listbox" aria-label="${be(this.hass,"a11y.automations_list")}" aria-multiselectable="true">
        ${this._renderSelectionList(e,a)}
      </div>
    `}}ia.styles=sa,e([ce({attribute:!1})],ia.prototype,"hass",void 0),e([ce({attribute:!1})],ia.prototype,"automations",void 0),e([ce({attribute:!1})],ia.prototype,"selected",void 0),e([ce({attribute:!1})],ia.prototype,"labelRegistry",void 0),e([ce({type:Boolean})],ia.prototype,"labelRegistryUnavailable",void 0),e([ce({attribute:!1})],ia.prototype,"categoryRegistry",void 0),e([ce({attribute:!1})],ia.prototype,"recentSnoozeIds",void 0),e([he()],ia.prototype,"_filterTab",void 0),e([he()],ia.prototype,"_search",void 0),e([he()],ia.prototype,"_searchInput",void 0),e([he()],ia.prototype,"_expandedGroups",void 0);const ra=r`
    ${ye}
    ${xe}
    ${$e}
    ${ze}
    ${Re}
    ${Ee}
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      box-sizing: border-box;
    }
    .modal-content {
      background: var(--card-background-color, #fff);
      border-radius: 16px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .modal-title {
      font-weight: 600;
      font-size: 1em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      margin-right: 8px;
    }
    .modal-subtitle {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
      line-height: 1.3;
      max-height: 3.9em;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
    }
    .modal-close:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }
    .modal-body { padding: 16px; }
    .remaining-time {
      text-align: center;
      font-size: 2em;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      padding: 12px 0 20px;
      color: var(--primary-text-color);
    }
    .remaining-label {
      text-align: center;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    .adjust-section { margin-bottom: 16px; }
    .adjust-section:last-child { margin-bottom: 0; }
    .adjust-section-label {
      font-size: 0.8em;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .adjust-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .decrement-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    ${Pe}
`,na=[{label:"+15m",minutes:15},{label:"+30m",minutes:30},{label:"+1h",hours:1},{label:"+2h",hours:2}],la=[{label:"-15m",minutes:-15,thresholdMs:15*Ne},{label:"-30m",minutes:-30,thresholdMs:30*Ne}],ua=Ne;class da extends ne{constructor(){super(...arguments),this.open=!1,this.entityId="",this.friendlyName="",this.resumeAt="",this.entityIds=[],this.friendlyNames=[],this._countdownState={interval:null,syncTimeout:null}}get _isGroupMode(){return this.entityIds.length>1}updated(e){e.has("open")&&(this.open?($t(this._countdownState),this._countdownState=wt(()=>this.requestUpdate())):$t(this._countdownState))}disconnectedCallback(){super.disconnectedCallback(),$t(this._countdownState)}_isDecrementDisabled(e){if(!this.resumeAt)return!0;return new Date(this.resumeAt).getTime()-Date.now()-e<ua}_fireAdjustTime(e){const t=this.entityIds.length>0?{entityIds:this.entityIds,...e}:{entityId:this.entityId,...e};this._dispatchModalEvent("adjust-time",t)}_close(){this._dispatchModalEvent("close-modal",void 0)}_dispatchModalEvent(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}render(){return this.open?G`
      <div
        class="modal-overlay"
        @click=${e=>{e.target===e.currentTarget&&this._close()}}
        @keydown=${e=>{"Escape"===e.key&&this._close()}}
      >
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="adjust-title" @click=${e=>e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title" id="adjust-title">
              ${this._isGroupMode?be(this.hass,"adjust.group_title",{count:this.entityIds.length}):this.friendlyName||this.entityId}
            </span>
            ${this._isGroupMode?G`
              <div class="modal-subtitle">
                ${this.friendlyNames.join(", ")}
              </div>
            `:""}
            <button class="modal-close" @click=${this._close}
              aria-label="${be(this.hass,"a11y.close_adjust_modal")}">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="remaining-label">${be(this.hass,"adjust.remaining")}</div>
            <div class="remaining-time">${nt(this.resumeAt,be(this.hass,"status.resuming"))}</div>

            <div class="adjust-section">
              <div class="adjust-section-label">${be(this.hass,"adjust.add_time")}</div>
              <div class="adjust-buttons">
                ${na.map(e=>G`
                  <button type="button"
                    class="adjust-btn increment"
                    @click=${()=>this._fireAdjustTime(e.hours?{hours:e.hours}:{minutes:e.minutes})}
                    aria-label="${be(this.hass,"a11y.add_minutes",{label:e.label})}">
                    ${e.label}
                  </button>
                `)}
              </div>
            </div>

            <div class="adjust-section">
              <div class="adjust-section-label">${be(this.hass,"adjust.reduce_time")}</div>
              <div class="decrement-buttons">
                ${la.map(e=>G`
                  <button type="button"
                    class="adjust-btn decrement"
                    ?disabled=${this._isDecrementDisabled(e.thresholdMs)}
                    @click=${()=>this._fireAdjustTime({minutes:e.minutes})}
                    aria-label="${be(this.hass,"a11y.reduce_minutes",{label:e.label})}">
                    ${e.label}
                  </button>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `:G``}}da.styles=ra,e([ce({attribute:!1})],da.prototype,"hass",void 0),e([ce({type:Boolean})],da.prototype,"open",void 0),e([ce({type:String})],da.prototype,"entityId",void 0),e([ce({type:String})],da.prototype,"friendlyName",void 0),e([ce({type:String})],da.prototype,"resumeAt",void 0),e([ce({attribute:!1})],da.prototype,"entityIds",void 0),e([ce({attribute:!1})],da.prototype,"friendlyNames",void 0);const ca=Symbol.for("autosnooze.registration.done.v1"),ha=new Set,ma="autosnooze-card",pa=[{tag:"autosnooze-card-editor",ctor:Qt},{tag:"autosnooze-active-pauses",ctor:ta},{tag:"autosnooze-duration-selector",ctor:oa},{tag:"autosnooze-automation-list",ctor:ia},{tag:"autosnooze-adjust-modal",ctor:da},{tag:ma,ctor:Jt}];function ga(e,t,a){ha.has(e)||(ha.add(e),console.warn(t))}function _a(e="0.2.18"){const t=function(e){return{type:ma,name:"AutoSnooze Card",description:`Temporarily pause automations with area and label filtering (v${e})`,preview:!0,documentationURL:"https://github.com/mossipcams/autosnooze#readme"}}(e),a=function(){const e=window.customCards;return Array.isArray(e)?e:(void 0!==e&&ga("customCards-not-array",`[AutoSnooze] window.customCards was not an array (got ${typeof e}); resetting.`),[])}(),o=a.findIndex(e=>e?.type===ma);-1===o?a.push(t):a[o]={...a[o],...t},window.customCards=a}!function(){const e=globalThis;!0===e[ca]||(pa.forEach(({tag:e,ctor:t})=>function(e,t,a=customElements){const o=a.get(e);if(o)o!==t&&ga(`element-conflict:${e}`,`[AutoSnooze] Element tag "${e}" is already registered with a different constructor.`);else try{a.define(e,t)}catch(o){const s=a.get(e);if(s===t)return;if(s)return void ga(`element-conflict:${e}`,`[AutoSnooze] Element tag "${e}" was claimed by a different constructor during registration.`);throw o}}(e,t)),e[ca]=!0),_a()}();export{ta as AutoSnoozeActivePauses,da as AutoSnoozeAdjustModal,ia as AutoSnoozeAutomationList,oa as AutoSnoozeDurationSelector,Jt as AutomationPauseCard,Qt as AutomationPauseCardEditor};
//# sourceMappingURL=autosnooze-card.js.map
