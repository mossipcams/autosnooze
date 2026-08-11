function e(e,t,o,i){var n,a=arguments.length,r=a<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,o,i);else for(var s=e.length-1;s>=0;s--)(n=e[s])&&(r=(a<3?n(r):a>3?n(t,o,r):n(t,o))||r);return a>3&&r&&Object.defineProperty(t,o,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,o=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),n=new WeakMap;let a=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(o&&void 0===e){const o=void 0!==t&&1===t.length;o&&(e=n.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&n.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const o=1===e.length?e[0]:t.reduce((t,o,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+e[i+1],e[0]);return new a(o,e,i)},s=o?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return(e=>new a("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:u,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,m=globalThis,f=m.trustedTypes,g=f?f.emptyScript:"",_=m.reactiveElementPolyfillSupport,b=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=null!==e;break;case Number:o=null===e?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch(e){o=null}}return o}},y=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),i=this.getPropertyDescriptor(e,o,t);void 0!==i&&c(this.prototype,e,i)}}static getPropertyDescriptor(e,t,o){const{get:i,set:n}=u(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:i,set(t){const a=i?.call(this);n?.call(this,t),this.requestUpdate(e,a,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const e=this.properties,t=[...d(e),...h(e)];for(const o of t)this.createProperty(o,e[o])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,o]of t)this.elementProperties.set(e,o)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const o=this._$Eu(e,t);void 0!==o&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const e of o)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const o=t.attribute;return!1===o?void 0:"string"==typeof o?o:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,i)=>{if(o)e.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const o of i){const i=document.createElement("style"),n=t.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=o.cssText,e.appendChild(i)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){const o=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,o);if(void 0!==i&&!0===o.reflect){const n=(void 0!==o.converter?.toAttribute?o.converter:v).toAttribute(t,o.type);this._$Em=e,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){const o=this.constructor,i=o._$Eh.get(e);if(void 0!==i&&this._$Em!==i){const e=o.getPropertyOptions(i),n="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=i;const a=n.fromAttribute(t,e.type);this[i]=a??this._$Ej?.get(i)??a,this._$Em=null}}requestUpdate(e,t,o,i=!1,n){if(void 0!==e){const a=this.constructor;if(!1===i&&(n=this[e]),o??=a.getPropertyOptions(e),!((o.hasChanged??y)(n,t)||o.useDefault&&o.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,o))))return;this.C(e,t,o)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:i,wrapped:n},a){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==n||void 0!==a)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),!0===i&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,o]of e){const{wrapped:e}=o,i=this[t];!0!==e||this._$AL.has(t)||void 0===i||this.C(t,void 0,o,i)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[b("elementProperties")]=new Map,w[b("finalized")]=new Map,_?.({ReactiveElement:w}),(m.reactiveElementVersions??=[]).push("2.1.2");const z=globalThis,$=e=>e,k=z.trustedTypes,A=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",T=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+T,C=`<${E}>`,j=document,I=()=>j.createComment(""),P=e=>null===e||"object"!=typeof e&&"function"!=typeof e,D=Array.isArray,M="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,R=/>/g,L=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),Z=/'/g,F=/"/g,U=/^(?:script|style|textarea|title)$/i,V=(e=>(t,...o)=>({_$litType$:e,strings:t,values:o}))(1),B=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),H=new WeakMap,J=j.createTreeWalker(j,129);function W(e,t){if(!D(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(t):t}const q=(e,t)=>{const o=e.length-1,i=[];let n,a=2===t?"<svg>":3===t?"<math>":"",r=O;for(let t=0;t<o;t++){const o=e[t];let s,l,c=-1,u=0;for(;u<o.length&&(r.lastIndex=u,l=r.exec(o),null!==l);)u=r.lastIndex,r===O?"!--"===l[1]?r=N:void 0!==l[1]?r=R:void 0!==l[2]?(U.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=L):void 0!==l[3]&&(r=L):r===L?">"===l[0]?(r=n??O,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,s=l[1],r=void 0===l[3]?L:'"'===l[3]?F:Z):r===F||r===Z?r=L:r===N||r===R?r=O:(r=L,n=void 0);const d=r===L&&e[t+1].startsWith("/>")?" ":"";a+=r===O?o+C:c>=0?(i.push(s),o.slice(0,c)+S+o.slice(c)+T+d):o+T+(-2===c?t:d)}return[W(e,a+(e[o]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),i]};class Y{constructor({strings:e,_$litType$:t},o){let i;this.parts=[];let n=0,a=0;const r=e.length-1,s=this.parts,[l,c]=q(e,t);if(this.el=Y.createElement(l,o),J.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(i=J.nextNode())&&s.length<r;){if(1===i.nodeType){if(i.hasAttributes())for(const e of i.getAttributeNames())if(e.endsWith(S)){const t=c[a++],o=i.getAttribute(e).split(T),r=/([.?@])?(.*)/.exec(t);s.push({type:1,index:n,name:r[2],strings:o,ctor:"."===r[1]?te:"?"===r[1]?oe:"@"===r[1]?ie:ee}),i.removeAttribute(e)}else e.startsWith(T)&&(s.push({type:6,index:n}),i.removeAttribute(e));if(U.test(i.tagName)){const e=i.textContent.split(T),t=e.length-1;if(t>0){i.textContent=k?k.emptyScript:"";for(let o=0;o<t;o++)i.append(e[o],I()),J.nextNode(),s.push({type:2,index:++n});i.append(e[t],I())}}}else if(8===i.nodeType)if(i.data===E)s.push({type:2,index:n});else{let e=-1;for(;-1!==(e=i.data.indexOf(T,e+1));)s.push({type:7,index:n}),e+=T.length-1}n++}}static createElement(e,t){const o=j.createElement("template");return o.innerHTML=e,o}}function K(e,t,o=e,i){if(t===B)return t;let n=void 0!==i?o._$Co?.[i]:o._$Cl;const a=P(t)?void 0:t._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),void 0===a?n=void 0:(n=new a(e),n._$AT(e,o,i)),void 0!==i?(o._$Co??=[])[i]=n:o._$Cl=n),void 0!==n&&(t=K(e,n._$AS(e,t.values),n,i)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,i=(e?.creationScope??j).importNode(t,!0);J.currentNode=i;let n=J.nextNode(),a=0,r=0,s=o[0];for(;void 0!==s;){if(a===s.index){let t;2===s.type?t=new Q(n,n.nextSibling,this,e):1===s.type?t=new s.ctor(n,s.name,s.strings,this,e):6===s.type&&(t=new ne(n,this,e)),this._$AV.push(t),s=o[++r]}a!==s?.index&&(n=J.nextNode(),a++)}return J.currentNode=j,i}p(e){let t=0;for(const o of this._$AV)void 0!==o&&(void 0!==o.strings?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,o,i){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=K(this,e,t),P(e)?e===G||null==e||""===e?(this._$AH!==G&&this._$AR(),this._$AH=G):e!==this._$AH&&e!==B&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>D(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==G&&P(this._$AH)?this._$AA.nextSibling.data=e:this.T(j.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:o}=e,i="number"==typeof o?this._$AC(e):(void 0===o.el&&(o.el=Y.createElement(W(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===i)this._$AH.p(t);else{const e=new X(i,this),o=e.u(this.options);e.p(t),this.T(o),this._$AH=e}}_$AC(e){let t=H.get(e.strings);return void 0===t&&H.set(e.strings,t=new Y(e)),t}k(e){D(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,i=0;for(const n of e)i===t.length?t.push(o=new Q(this.O(I()),this.O(I()),this,this.options)):o=t[i],o._$AI(n),i++;i<t.length&&(this._$AR(o&&o._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,i,n){this.type=1,this._$AH=G,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=n,o.length>2||""!==o[0]||""!==o[1]?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=G}_$AI(e,t=this,o,i){const n=this.strings;let a=!1;if(void 0===n)e=K(this,e,t,0),a=!P(e)||e!==this._$AH&&e!==B,a&&(this._$AH=e);else{const i=e;let r,s;for(e=n[0],r=0;r<n.length-1;r++)s=K(this,i[o+r],t,r),s===B&&(s=this._$AH[r]),a||=!P(s)||s!==this._$AH[r],s===G?e=G:e!==G&&(e+=(s??"")+n[r+1]),this._$AH[r]=s}a&&!i&&this.j(e)}j(e){e===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===G?void 0:e}}class oe extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==G)}}class ie extends ee{constructor(e,t,o,i,n){super(e,t,o,i,n),this.type=5}_$AI(e,t=this){if((e=K(this,e,t,0)??G)===B)return;const o=this._$AH,i=e===G&&o!==G||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,n=e!==G&&(o===G||i);i&&this.element.removeEventListener(this.name,this,o),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){K(this,e)}}const ae=z.litHtmlPolyfillSupport;ae?.(Y,Q),(z.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;class se extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,o)=>{const i=o?.renderBefore??t;let n=i._$litPart$;if(void 0===n){const e=o?.renderBefore??null;i._$litPart$=n=new Q(t.insertBefore(I(),e),e,void 0,o??{})}return n._$AI(e),n})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}se._$litElement$=!0,se.finalized=!0,re.litElementHydrateSupport?.({LitElement:se});const le=re.litElementPolyfillSupport;le?.({LitElement:se}),(re.litElementVersions??=[]).push("4.2.2");const ce={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:y},ue=(e=ce,t,o)=>{const{kind:i,metadata:n}=o;let a=globalThis.litPropertyMetadata.get(n);if(void 0===a&&globalThis.litPropertyMetadata.set(n,a=new Map),"setter"===i&&((e=Object.create(e)).wrapped=!0),a.set(o.name,e),"accessor"===i){const{name:i}=o;return{set(o){const n=t.get.call(this);t.set.call(this,o),this.requestUpdate(i,n,e,!0,o)},init(t){return void 0!==t&&this.C(i,void 0,e,t),t}}}if("setter"===i){const{name:i}=o;return function(o){const n=this[i];t.call(this,o),this.requestUpdate(i,n,e,!0,o)}}throw Error("Unsupported decorator location: "+i)};function de(e){return(t,o)=>"object"==typeof o?ue(e,t,o):((e,t,o)=>{const i=t.hasOwnProperty(o);return t.constructor.createProperty(o,e),i?Object.getOwnPropertyDescriptor(t,o):void 0})(e,t,o)}function he(e){return de({...e,state:!0,attribute:!1})}const pe={en:{group:{unassigned:"Unassigned",unlabeled:"Unlabeled",uncategorized:"Uncategorized",recent:"Recent"},button:{undo:"Undo",resume:"Resume",remove_notification:"Remove notification",confirm_resume_all:"Confirm Resume All",resume_all:"Resume All",cancel:"Cancel",select_all:"Select All",clear:"Clear",continue:"Continue",snoozing:"Snoozing...",schedule_count:"Schedule ({count})",snooze_count:"Snooze ({count})"},a11y:{undo_action:"Undo last action",snooze_date:"Snooze date",snooze_time:"Snooze time",resume_date:"Resume date",resume_time:"Resume time",custom_duration:"Custom duration",snoozed_region:"Snoozed automations",automations_resuming:"Automations resuming {time}",time_remaining:"Time remaining: {time}",resume_automation:"Resume {name}",confirm_resume_all:"Confirm resume all automations",resume_all:"Resume all paused automations",scheduled_region:"Scheduled snoozes",scheduled_pause_for:"Scheduled pause for {name}",cancel_scheduled_for:"Cancel scheduled pause for {name}",filter_tabs:"Filter automations by",hide_snoozed:"Hide currently snoozed automations from the list",automation_count:"{count} automations",area_count:"{count} areas",category_count:"{count} categories",label_count:"{count} labels",search:"Search automations by name",clear_search:"Clear search",selection_actions:"Selection actions",select_all:"Select all visible automations",clear_selection:"Clear selection",automations_list:"Automations list",snoozing:"Snoozing automations",schedule_snooze:"Schedule snooze for {count} automations",snooze_count:"Snooze {count} automations",select_automation:"Select {name}",group_header:"{name} group, {count} automations",group_count:"{count} automations",select_all_in_group:"Select all automations in {name}",snooze_last_duration:"Snooze for last used duration",snooze_for_duration:"Snooze for {duration}",close_adjust_modal:"Close adjust modal",adjust_automation:"Adjust snooze time for {name}",add_minutes:"Add {label}",reduce_minutes:"Reduce by {label}",adjust_group:"Adjust snooze time for {count} automations in this group"},toast:{error:{resume_time_required:"Please set a complete resume date and time",invalid_datetime:"Invalid resume date/time",resume_time_past:"Resume time must be in the future",snooze_before_resume:"Snooze time must be before resume time",undo_failed:"Failed to undo. The automations may have already been modified.",resume_failed:"Failed to resume automation",resume_all_failed:"Failed to resume automations. Check Home Assistant logs for details.",cancel_failed:"Failed to cancel scheduled snooze",adjust_failed:"Failed to adjust snooze time"},success:{scheduled_one:"Scheduled 1 automation to snooze",scheduled_many:"Scheduled {count} automations to snooze",snoozed_until_one:"Snoozed 1 automation until {time}",snoozed_until_many:"Snoozed {count} automations until {time}",snoozed_for_one:"Snoozed 1 automation for {duration}",snoozed_for_many:"Snoozed {count} automations for {duration}",restored_one:"Restored 1 automation",restored_many:"Restored {count} automations",resumed:"Automation resumed successfully",resumed_all:"All automations resumed successfully",cancelled:"Scheduled snooze cancelled successfully",adjusted:"Snooze time adjusted"}},list:{empty:"No automations found",label_registry_warning:"Label metadata is temporarily unavailable. Showing automations without label-based filtering."},schedule:{snooze_at:"Snooze at:",select_date:"Select date",hint_immediate:"Leave empty to snooze immediately",resume_at:"Resume at:",back_to_duration:"Back to duration selection",pick_datetime:"Pick specific date/time instead",summary_immediate:"Will pause immediately and resume {resume}",summary_with_disable:"Will pause {disable} and resume {resume}",summary_invalid_order:"Pause time must be before resume time"},duration:{header:"Snooze Duration",placeholder:"e.g. 2h30m, 1.5h, 1d, 45m",preview_label:"Duration:",help:"Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Use last duration: {duration}",custom:"Custom",tomorrow:"Tomorrow"},section:{snoozed_count:"Snoozed Automations ({count})",scheduled_count:"Scheduled Snoozes ({count})"},status:{resumes:"Resumes",disables:"Disables:",resumes_at:"Resumes:",active_count:"{count} active",scheduled_count:"{count} scheduled",resuming:"Resuming...",sensor_unavailable:"AutoSnooze status sensor is unavailable. Pause controls are still shown, but active/scheduled state may be stale.",no_snoozed:"No automations are currently snoozed"},tab:{all:"All",areas:"Areas",categories:"Categories",labels:"Labels"},filter:{hide_snoozed:"Hide snoozed"},search:{placeholder:"Search automations..."},selection:{count:"{selected} of {total} selected"},guardrail:{confirm_title:"Review required",confirm_body:"Some selected automations are tagged autosnooze_confirm or detected as critical. Continue to snooze them."},card:{default_title:"AutoSnooze",snoozed_title:"Snoozed Automations"},editor:{title_label:"Title",title_placeholder:"AutoSnooze"},adjust:{remaining:"Time remaining",add_time:"Add time",reduce_time:"Reduce time",group_title:"Adjust {count} automations",group_subtitle:"All automations in this group"},notify:{toggle_label:"Notify me",when_label:"Notification timing",lead_label:"How long before?",when:{start:"Snooze starts",about_to_end:"Before snooze ends",end:"Snooze ends"}}},es:{group:{unassigned:"Sin asignar",unlabeled:"Sin etiqueta",uncategorized:"Sin categoría"},button:{undo:"Deshacer",resume:"Reanudar",confirm_resume_all:"Confirmar reanudar todo",resume_all:"Reanudar todo",cancel:"Cancelar",select_all:"Seleccionar todo",clear:"Limpiar",snoozing:"Pausando...",schedule_count:"Programar ({count})",snooze_count:"Pausar ({count})"},a11y:{undo_action:"Deshacer última acción",snooze_date:"Fecha de pausa",snooze_time:"Hora de pausa",resume_date:"Fecha de reanudación",resume_time:"Hora de reanudación",custom_duration:"Duración personalizada",snoozed_region:"Automatizaciones pausadas",automations_resuming:"Automatizaciones que reanudan {time}",time_remaining:"Tiempo restante: {time}",resume_automation:"Reanudar {name}",confirm_resume_all:"Confirmar reanudar todas las automatizaciones",resume_all:"Reanudar todas las automatizaciones pausadas",scheduled_region:"Pausas programadas",scheduled_pause_for:"Pausa programada para {name}",cancel_scheduled_for:"Cancelar pausa programada para {name}",filter_tabs:"Filtrar automatizaciones por",hide_snoozed:"Ocultar automatizaciones actualmente pospuestas de la lista",automation_count:"{count} automatizaciones",area_count:"{count} áreas",category_count:"{count} categorías",label_count:"{count} etiquetas",search:"Buscar automatizaciones por nombre",selection_actions:"Acciones de selección",select_all:"Seleccionar todas las automatizaciones visibles",clear_selection:"Limpiar selección",automations_list:"Lista de automatizaciones",snoozing:"Pausando automatizaciones",schedule_snooze:"Programar pausa para {count} automatizaciones",snooze_count:"Pausar {count} automatizaciones",select_automation:"Seleccionar {name}",group_header:"Grupo {name}, {count} automatizaciones",group_count:"{count} automatizaciones",select_all_in_group:"Seleccionar todas en {name}",snooze_last_duration:"Pausar con última duración",snooze_for_duration:"Pausar durante {duration}",close_adjust_modal:"Cerrar modal de ajuste",adjust_automation:"Ajustar tiempo de snooze para {name}",add_minutes:"Agregar {label}",reduce_minutes:"Reducir {label}",adjust_group:"Ajustar tiempo de pausa para {count} automatizaciones en este grupo"},toast:{error:{resume_time_required:"Por favor, establece una fecha y hora de reanudación completas",invalid_datetime:"Fecha/hora de reanudación inválida",resume_time_past:"La hora de reanudación debe ser en el futuro",snooze_before_resume:"La hora de pausa debe ser anterior a la hora de reanudación",undo_failed:"Error al deshacer. Las automatizaciones pueden haber sido modificadas.",resume_failed:"Error al reanudar la automatización",resume_all_failed:"Error al reanudar las automatizaciones. Consulta los registros de Home Assistant.",cancel_failed:"Error al cancelar la pausa programada",adjust_failed:"Error al ajustar el tiempo de snooze"},success:{scheduled_one:"1 automatización programada para pausar",scheduled_many:"{count} automatizaciones programadas para pausar",snoozed_until_one:"1 automatización pausada hasta {time}",snoozed_until_many:"{count} automatizaciones pausadas hasta {time}",snoozed_for_one:"1 automatización pausada por {duration}",snoozed_for_many:"{count} automatizaciones pausadas por {duration}",restored_one:"1 automatización restaurada",restored_many:"{count} automatizaciones restauradas",resumed:"Automatización reanudada correctamente",resumed_all:"Todas las automatizaciones reanudadas correctamente",cancelled:"Pausa programada cancelada correctamente",adjusted:"Tiempo de snooze ajustado"}},list:{empty:"No se encontraron automatizaciones"},schedule:{snooze_at:"Pausar a las:",select_date:"Seleccionar fecha",hint_immediate:"Dejar vacío para pausar inmediatamente",resume_at:"Reanudar a las:",back_to_duration:"Volver a selección de duración",pick_datetime:"Elegir fecha/hora específica"},duration:{header:"Duración de la pausa",placeholder:"ej. 2h30m, 1.5h, 1d, 45m",preview_label:"Duración:",help:"Introducir duración: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Usar última duración: {duration}",custom:"Personalizado",tomorrow:"Mañana"},section:{snoozed_count:"Automatizaciones pausadas ({count})",scheduled_count:"Pausas programadas ({count})"},status:{resumes:"Reanuda",disables:"Desactiva:",resumes_at:"Reanuda:",active_count:"{count} activas",scheduled_count:"{count} programadas",resuming:"Reanudando...",no_snoozed:"No hay automatizaciones pausadas actualmente"},tab:{all:"Todo",areas:"Áreas",categories:"Categorías",labels:"Etiquetas"},filter:{hide_snoozed:"Ocultar pausadas"},search:{placeholder:"Buscar automatizaciones..."},selection:{count:"{selected} de {total} seleccionadas"},card:{default_title:"AutoSnooze",snoozed_title:"Automatizaciones pausadas"},editor:{title_label:"Título",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tiempo restante",add_time:"Agregar tiempo",reduce_time:"Reducir tiempo",group_title:"Ajustar {count} automatizaciones",group_subtitle:"Todas las automatizaciones en este grupo"},notify:{toggle_label:"Notificarme",when_label:"Momento de la notificación",lead_label:"¿Cuánto antes?",when:{start:"Empieza la siesta",about_to_end:"Antes de que termine la siesta",end:"Termina la siesta"}}},fr:{group:{unassigned:"Non assigné",unlabeled:"Sans étiquette",uncategorized:"Sans catégorie"},button:{undo:"Annuler",resume:"Reprendre",confirm_resume_all:"Confirmer tout reprendre",resume_all:"Tout reprendre",cancel:"Annuler",select_all:"Tout sélectionner",clear:"Effacer",snoozing:"Mise en pause...",schedule_count:"Programmer ({count})",snooze_count:"Pause ({count})"},a11y:{undo_action:"Annuler la dernière action",snooze_date:"Date de pause",snooze_time:"Heure de pause",resume_date:"Date de reprise",resume_time:"Heure de reprise",custom_duration:"Durée personnalisée",snoozed_region:"Automatisations en pause",automations_resuming:"Automatisations reprenant {time}",time_remaining:"Temps restant : {time}",resume_automation:"Reprendre {name}",confirm_resume_all:"Confirmer la reprise de toutes les automatisations",resume_all:"Reprendre toutes les automatisations en pause",scheduled_region:"Pauses programmées",scheduled_pause_for:"Pause programmée pour {name}",cancel_scheduled_for:"Annuler la pause programmée pour {name}",filter_tabs:"Filtrer les automatisations par",hide_snoozed:"Masquer les automatisations actuellement en pause de la liste",automation_count:"{count} automatisations",area_count:"{count} zones",category_count:"{count} catégories",label_count:"{count} étiquettes",search:"Rechercher des automatisations par nom",selection_actions:"Actions de sélection",select_all:"Sélectionner toutes les automatisations visibles",clear_selection:"Effacer la sélection",automations_list:"Liste des automatisations",snoozing:"Mise en pause des automatisations",schedule_snooze:"Programmer la pause pour {count} automatisations",snooze_count:"Mettre en pause {count} automatisations",select_automation:"Sélectionner {name}",group_header:"Groupe {name}, {count} automatisations",group_count:"{count} automatisations",select_all_in_group:"Tout sélectionner dans {name}",snooze_last_duration:"Pause pour dernière durée",snooze_for_duration:"Pause pour {duration}",close_adjust_modal:"Fermer le modal d'ajustement",adjust_automation:"Ajuster la mise en veille pour {name}",add_minutes:"Ajouter {label}",reduce_minutes:"Réduire de {label}",adjust_group:"Ajuster le temps de pause pour {count} automatisations dans ce groupe"},toast:{error:{resume_time_required:"Veuillez définir une date et heure de reprise complètes",invalid_datetime:"Date/heure de reprise invalide",resume_time_past:"L'heure de reprise doit être dans le futur",snooze_before_resume:"L'heure de pause doit être avant l'heure de reprise",undo_failed:"Échec de l'annulation. Les automatisations ont peut-être déjà été modifiées.",resume_failed:"Échec de la reprise de l'automatisation",resume_all_failed:"Échec de la reprise des automatisations. Consultez les journaux de Home Assistant.",cancel_failed:"Échec de l'annulation de la pause programmée",adjust_failed:"Échec de l'ajustement de la mise en veille"},success:{scheduled_one:"1 automatisation programmée pour pause",scheduled_many:"{count} automatisations programmées pour pause",snoozed_until_one:"1 automatisation en pause jusqu'à {time}",snoozed_until_many:"{count} automatisations en pause jusqu'à {time}",snoozed_for_one:"1 automatisation en pause pendant {duration}",snoozed_for_many:"{count} automatisations en pause pendant {duration}",restored_one:"1 automatisation restaurée",restored_many:"{count} automatisations restaurées",resumed:"Automatisation reprise avec succès",resumed_all:"Toutes les automatisations ont été reprises avec succès",cancelled:"Pause programmée annulée avec succès",adjusted:"Durée de mise en veille ajustée"}},list:{empty:"Aucune automatisation trouvée"},schedule:{snooze_at:"Pause à :",select_date:"Sélectionner la date",hint_immediate:"Laisser vide pour mettre en pause immédiatement",resume_at:"Reprendre à :",back_to_duration:"Retour à la sélection de durée",pick_datetime:"Choisir une date/heure spécifique"},duration:{header:"Durée de la pause",placeholder:"ex. 2h30m, 1.5h, 1j, 45m",preview_label:"Durée :",help:"Entrer la durée : 30m, 2h, 1.5h, 4h30m, 1j, 1j2h",last_used_tooltip:"Utiliser la dernière durée : {duration}",custom:"Personnalisé",tomorrow:"Demain"},section:{snoozed_count:"Automatisations en pause ({count})",scheduled_count:"Pauses programmées ({count})"},status:{resumes:"Reprend",disables:"Désactive :",resumes_at:"Reprend :",active_count:"{count} actives",scheduled_count:"{count} programmées",resuming:"Reprise...",no_snoozed:"Aucune automatisation n'est actuellement en pause"},tab:{all:"Tout",areas:"Zones",categories:"Catégories",labels:"Étiquettes"},filter:{hide_snoozed:"Masquer les pauses"},search:{placeholder:"Rechercher des automatisations..."},selection:{count:"{selected} sur {total} sélectionnées"},card:{default_title:"AutoSnooze",snoozed_title:"Automatisations en pause"},editor:{title_label:"Titre",title_placeholder:"AutoSnooze"},adjust:{remaining:"Temps restant",add_time:"Ajouter du temps",reduce_time:"Réduire le temps",group_title:"Ajuster {count} automatisations",group_subtitle:"Toutes les automatisations de ce groupe"},notify:{toggle_label:"Me notifier",when_label:"Moment de la notification",lead_label:"Combien de temps avant ?",when:{start:"Début de la sieste",about_to_end:"Avant la fin de la sieste",end:"Fin de la sieste"}}},de:{group:{unassigned:"Nicht zugewiesen",unlabeled:"Ohne Label",uncategorized:"Ohne Kategorie"},button:{undo:"Rückgängig",resume:"Fortsetzen",confirm_resume_all:"Alle fortsetzen bestätigen",resume_all:"Alle fortsetzen",cancel:"Abbrechen",select_all:"Alle auswählen",clear:"Löschen",snoozing:"Pausiere...",schedule_count:"Planen ({count})",snooze_count:"Pausieren ({count})"},a11y:{undo_action:"Letzte Aktion rückgängig machen",snooze_date:"Pausendatum",snooze_time:"Pausenzeit",resume_date:"Wiederaufnahmedatum",resume_time:"Wiederaufnahmezeit",custom_duration:"Benutzerdefinierte Dauer",snoozed_region:"Pausierte Automatisierungen",automations_resuming:"Automatisierungen werden fortgesetzt {time}",time_remaining:"Verbleibende Zeit: {time}",resume_automation:"{name} fortsetzen",confirm_resume_all:"Bestätigen: Alle Automatisierungen fortsetzen",resume_all:"Alle pausierten Automatisierungen fortsetzen",scheduled_region:"Geplante Pausen",scheduled_pause_for:"Geplante Pause für {name}",cancel_scheduled_for:"Geplante Pause für {name} abbrechen",filter_tabs:"Automatisierungen filtern nach",hide_snoozed:"Aktuell pausierte Automatisierungen aus der Liste ausblenden",automation_count:"{count} Automatisierungen",area_count:"{count} Bereiche",category_count:"{count} Kategorien",label_count:"{count} Labels",search:"Automatisierungen nach Name suchen",selection_actions:"Auswahlaktionen",select_all:"Alle sichtbaren Automatisierungen auswählen",clear_selection:"Auswahl löschen",automations_list:"Automatisierungsliste",snoozing:"Automatisierungen werden pausiert",schedule_snooze:"Pause planen für {count} Automatisierungen",snooze_count:"{count} Automatisierungen pausieren",select_automation:"{name} auswählen",group_header:"Gruppe {name}, {count} Automatisierungen",group_count:"{count} Automatisierungen",select_all_in_group:"Alle in {name} auswählen",snooze_last_duration:"Letzte Dauer verwenden",snooze_for_duration:"Für {duration} pausieren",close_adjust_modal:"Anpassungsdialog schließen",adjust_automation:"Schlummerzeit anpassen für {name}",add_minutes:"{label} hinzufügen",reduce_minutes:"Um {label} reduzieren",adjust_group:"Schlummerzeit für {count} Automatisierungen in dieser Gruppe anpassen"},toast:{error:{resume_time_required:"Bitte vollständiges Wiederaufnahmedatum und -zeit angeben",invalid_datetime:"Ungültiges Wiederaufnahmedatum/-zeit",resume_time_past:"Wiederaufnahmezeit muss in der Zukunft liegen",snooze_before_resume:"Pausenzeit muss vor der Wiederaufnahmezeit liegen",undo_failed:"Rückgängig machen fehlgeschlagen. Die Automatisierungen wurden möglicherweise bereits geändert.",resume_failed:"Fortsetzen der Automatisierung fehlgeschlagen",resume_all_failed:"Fortsetzen der Automatisierungen fehlgeschlagen. Prüfen Sie die Home Assistant Logs.",cancel_failed:"Abbrechen der geplanten Pause fehlgeschlagen",adjust_failed:"Schlummerzeit konnte nicht angepasst werden"},success:{scheduled_one:"1 Automatisierung zum Pausieren geplant",scheduled_many:"{count} Automatisierungen zum Pausieren geplant",snoozed_until_one:"1 Automatisierung pausiert bis {time}",snoozed_until_many:"{count} Automatisierungen pausiert bis {time}",snoozed_for_one:"1 Automatisierung pausiert für {duration}",snoozed_for_many:"{count} Automatisierungen pausiert für {duration}",restored_one:"1 Automatisierung wiederhergestellt",restored_many:"{count} Automatisierungen wiederhergestellt",resumed:"Automatisierung erfolgreich fortgesetzt",resumed_all:"Alle Automatisierungen erfolgreich fortgesetzt",cancelled:"Geplante Pause erfolgreich abgebrochen",adjusted:"Schlummerzeit angepasst"}},list:{empty:"Keine Automatisierungen gefunden"},schedule:{snooze_at:"Pausieren um:",select_date:"Datum wählen",hint_immediate:"Leer lassen für sofortige Pause",resume_at:"Fortsetzen um:",back_to_duration:"Zurück zur Dauerauswahl",pick_datetime:"Stattdessen bestimmtes Datum/Zeit wählen"},duration:{header:"Pausendauer",placeholder:"z.B. 2h30m, 1.5h, 1d, 45m",preview_label:"Dauer:",help:"Dauer eingeben: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Letzte Dauer verwenden: {duration}",custom:"Benutzerdefiniert",tomorrow:"Morgen"},section:{snoozed_count:"Pausierte Automatisierungen ({count})",scheduled_count:"Geplante Pausen ({count})"},status:{resumes:"Fortsetzung",disables:"Deaktiviert:",resumes_at:"Fortsetzung:",active_count:"{count} aktiv",scheduled_count:"{count} geplant",resuming:"Wird fortgesetzt...",no_snoozed:"Derzeit sind keine Automatisierungen pausiert"},tab:{all:"Alle",areas:"Bereiche",categories:"Kategorien",labels:"Labels"},filter:{hide_snoozed:"Pausierte ausblenden"},search:{placeholder:"Automatisierungen suchen..."},selection:{count:"{selected} von {total} ausgewählt"},card:{default_title:"AutoSnooze",snoozed_title:"Pausierte Automatisierungen"},editor:{title_label:"Titel",title_placeholder:"AutoSnooze"},adjust:{remaining:"Verbleibende Zeit",add_time:"Zeit hinzufügen",reduce_time:"Zeit reduzieren",group_title:"Anpassen von {count} Automatisierungen",group_subtitle:"Alle Automatisierungen in dieser Gruppe"},notify:{toggle_label:"Benachrichtigen",when_label:"Benachrichtigungszeitpunkt",lead_label:"Wie lange vorher?",when:{start:"Schlummerzeit beginnt",about_to_end:"Bevor die Schlummerzeit endet",end:"Schlummerzeit endet"}}},it:{group:{unassigned:"Non assegnato",unlabeled:"Senza etichetta",uncategorized:"Senza categoria"},button:{undo:"Annulla",resume:"Riprendi",confirm_resume_all:"Conferma riprendi tutto",resume_all:"Riprendi tutto",cancel:"Annulla",select_all:"Seleziona tutto",clear:"Cancella",snoozing:"Messa in pausa...",schedule_count:"Programma ({count})",snooze_count:"Pausa ({count})"},a11y:{undo_action:"Annulla ultima azione",snooze_date:"Data pausa",snooze_time:"Ora pausa",resume_date:"Data ripresa",resume_time:"Ora ripresa",custom_duration:"Durata personalizzata",snoozed_region:"Automazioni in pausa",automations_resuming:"Automazioni che riprendono {time}",time_remaining:"Tempo rimanente: {time}",resume_automation:"Riprendi {name}",confirm_resume_all:"Conferma ripresa di tutte le automazioni",resume_all:"Riprendi tutte le automazioni in pausa",scheduled_region:"Pause programmate",scheduled_pause_for:"Pausa programmata per {name}",cancel_scheduled_for:"Annulla pausa programmata per {name}",filter_tabs:"Filtra automazioni per",hide_snoozed:"Nascondi dalla lista le automazioni attualmente in snooze",automation_count:"{count} automazioni",area_count:"{count} aree",category_count:"{count} categorie",label_count:"{count} etichette",search:"Cerca automazioni per nome",selection_actions:"Azioni selezione",select_all:"Seleziona tutte le automazioni visibili",clear_selection:"Cancella selezione",automations_list:"Lista automazioni",snoozing:"Messa in pausa delle automazioni",schedule_snooze:"Programma pausa per {count} automazioni",snooze_count:"Metti in pausa {count} automazioni",select_automation:"Seleziona {name}",group_header:"Gruppo {name}, {count} automazioni",group_count:"{count} automazioni",select_all_in_group:"Seleziona tutto in {name}",snooze_last_duration:"Pausa per ultima durata",snooze_for_duration:"Pausa per {duration}",close_adjust_modal:"Chiudi finestra di modifica",adjust_automation:"Modifica tempo di snooze per {name}",add_minutes:"Aggiungi {label}",reduce_minutes:"Riduci di {label}",adjust_group:"Modifica il tempo di pausa per {count} automazioni in questo gruppo"},toast:{error:{resume_time_required:"Imposta una data e ora di ripresa complete",invalid_datetime:"Data/ora di ripresa non valida",resume_time_past:"L'ora di ripresa deve essere nel futuro",snooze_before_resume:"L'ora di pausa deve essere prima dell'ora di ripresa",undo_failed:"Annullamento fallito. Le automazioni potrebbero essere già state modificate.",resume_failed:"Ripresa dell'automazione fallita",resume_all_failed:"Ripresa delle automazioni fallita. Controlla i log di Home Assistant.",cancel_failed:"Annullamento della pausa programmata fallito",adjust_failed:"Impossibile modificare il tempo di snooze"},success:{scheduled_one:"1 automazione programmata per la pausa",scheduled_many:"{count} automazioni programmate per la pausa",snoozed_until_one:"1 automazione in pausa fino a {time}",snoozed_until_many:"{count} automazioni in pausa fino a {time}",snoozed_for_one:"1 automazione in pausa per {duration}",snoozed_for_many:"{count} automazioni in pausa per {duration}",restored_one:"1 automazione ripristinata",restored_many:"{count} automazioni ripristinate",resumed:"Automazione ripresa con successo",resumed_all:"Tutte le automazioni riprese con successo",cancelled:"Pausa programmata annullata con successo",adjusted:"Tempo di snooze modificato"}},list:{empty:"Nessuna automazione trovata"},schedule:{snooze_at:"Pausa alle:",select_date:"Seleziona data",hint_immediate:"Lascia vuoto per mettere in pausa immediatamente",resume_at:"Riprendi alle:",back_to_duration:"Torna alla selezione durata",pick_datetime:"Scegli data/ora specifica"},duration:{header:"Durata pausa",placeholder:"es. 2h30m, 1.5h, 1g, 45m",preview_label:"Durata:",help:"Inserisci durata: 30m, 2h, 1.5h, 4h30m, 1g, 1g2h",last_used_tooltip:"Usa ultima durata: {duration}",custom:"Personalizzato",tomorrow:"Domani"},section:{snoozed_count:"Automazioni in pausa ({count})",scheduled_count:"Pause programmate ({count})"},status:{resumes:"Riprende",disables:"Disattiva:",resumes_at:"Riprende:",active_count:"{count} attive",scheduled_count:"{count} programmate",resuming:"Ripresa...",no_snoozed:"Nessuna automazione è attualmente in pausa"},tab:{all:"Tutto",areas:"Aree",categories:"Categorie",labels:"Etichette"},filter:{hide_snoozed:"Nascondi in snooze"},search:{placeholder:"Cerca automazioni..."},selection:{count:"{selected} di {total} selezionate"},card:{default_title:"AutoSnooze",snoozed_title:"Automazioni in pausa"},editor:{title_label:"Titolo",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tempo rimanente",add_time:"Aggiungi tempo",reduce_time:"Riduci tempo",group_title:"Modifica {count} automazioni",group_subtitle:"Tutte le automazioni in questo gruppo"},notify:{toggle_label:"Notificami",when_label:"Momento della notifica",lead_label:"Quanto tempo prima?",when:{start:"Inizio del posticipo",about_to_end:"Prima che termini il posticipo",end:"Fine del posticipo"}}}},me={en:"en","en-GB":"en","en-US":"en",es:"es","es-ES":"es","es-419":"es",fr:"fr","fr-FR":"fr","fr-CA":"fr",de:"de","de-DE":"de","de-AT":"de","de-CH":"de",it:"it","it-IT":"it"};const fe=new Set;function ge(e,t){const o=t.split(".");let i=e;for(const e of o){if(!i||"object"!=typeof i||!(e in i))return;i=i[e]}return"string"==typeof i?i:void 0}function _e(e,t,o){const i=function(e){if(!e)return"en";const t=e.language??e.locale?.language;if(!t)return"en";const o=me[t];if(o)return o;const i=t.split("-")[0];if(i){const e=me[i];if(e)return e}return"en"}(e),n=pe[i];let a=n?ge(n,t):void 0;return a||"en"===i||(a=ge(pe.en,t)),a?function(e,t){return t?e.replace(/\{(\w+)\}/g,(e,o)=>{const i=t[o];return void 0!==i?String(i):e}):e}(a,o):(fe.has(t)||(fe.add(t),console.warn(`[AutoSnooze] Missing translation for key: ${t}`)),t)}const be=r`
    :host {
      display: block;
    }
    ha-card {
      background: var(--card-background-color);
      color: var(--primary-text-color);
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
      color: var(--primary-text-color);
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
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 45%, var(--divider-color));
      border-radius: 8px;
      background: color-mix(in srgb, var(--warning-color, #ff9800) 10%, var(--card-background-color));
      color: var(--primary-text-color);
      font-size: 0.85em;
    }

    /* Snoozed-only card empty state */
    .snoozed-empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.95em;
    }

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    .notify-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
      margin: 12px 0;
    }
    .notify-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.9em;
      color: var(--primary-text-color);
    }
    .notify-toggle input[type='checkbox'] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color);
      cursor: pointer;
      flex-shrink: 0;
    }
    .notify-toggle ha-icon {
      --mdc-icon-size: 18px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .notify-toggle input[type='checkbox']:checked ~ ha-icon {
      color: var(--primary-color);
    }
    .notify-toggle-text {
      line-height: 1.3;
    }
    .notify-detail {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .notify-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .notify-field select {
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Snooze Button */
    .guardrail-confirm {
      margin-top: 10px;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, var(--divider-color));
      background: color-mix(in srgb, var(--warning-color, #ff9800) 8%, var(--card-background-color));
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
    .snooze-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid var(--info-color, #2196f3);
      border-radius: 8px;
      background: color-mix(in srgb, var(--info-color, #2196f3) 5%, transparent);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon {
      color: var(--info-color, #2196f3);
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
      color: var(--info-color, #2196f3);
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      color: var(--info-color, #2196f3);
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
      background: var(--error-color, #f44336);
      color: white;
      border-color: var(--error-color, #f44336);
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

      /* --- Section Separator --- */
      .snooze-setup {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      /* --- Main Action Button: Prominent with depth --- */
      .snooze-btn {
        padding: 16px;
        font-size: 1em;
        min-height: 56px;
        font-weight: 700;
        border-radius: 12px;
        letter-spacing: 0.01em;
        background: linear-gradient(
          135deg,
          var(--primary-color) 0%,
          color-mix(in srgb, var(--primary-color) 85%, #000) 100%
        );
        box-shadow: 0 4px 14px color-mix(in srgb, var(--primary-color) 25%, transparent),
                    0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 0;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .guardrail-confirm {
        border-radius: 12px;
        padding: 12px;
      }
      .guardrail-body {
        font-size: 0.85em;
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

      .scheduled-item .paused-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }

      .scheduled-item .paused-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* --- Scheduled Section: Cool accent with depth --- */
      .scheduled-list {
        padding: 14px;
        margin-top: 24px;
        border-radius: 16px;
        border: 2px solid var(--info-color, #2196f3);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--info-color, #2196f3) 6%, transparent) 0%,
          color-mix(in srgb, var(--info-color, #2196f3) 2%, transparent) 100%
        );
        box-shadow: 0 4px 16px color-mix(in srgb, var(--info-color, #2196f3) 8%, transparent);
      }

      .scheduled-list .list-header ha-icon {
        color: var(--info-color, #2196f3);
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
        color: var(--info-color, #2196f3);
      }

      .cancel-scheduled-btn {
        padding: 10px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 44px;
        flex-shrink: 0;
        border-radius: 8px;
        border: 1.5px solid color-mix(in srgb, var(--error-color, #f44336) 60%, var(--divider-color));
        background: var(--card-background-color);
        color: var(--error-color, #f44336);
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .cancel-scheduled-btn:active {
        transform: scale(0.95);
      }

      .cancel-scheduled-btn:hover {
        background: var(--error-color, #f44336);
        color: white;
        border-color: var(--error-color, #f44336);
      }

      /* --- Toast: Refined notification --- */
      .toast {
        bottom: 20px;
        padding: 14px 18px;
        font-size: 0.9em;
        font-weight: 500;
        max-width: calc(100vw - 32px);
        border-radius: 12px;
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
        min-height: 44px;
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

    }
`,ve=r`
    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      font-size: 1em;
    }
    .list-header ha-icon {
      color: var(--warning-color, #ff9800);
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
`,ye=1e3,xe=6e4,we=36e5,ze=864e5,$e=60,ke=1440,Ae=300,Se=300,Te=3e3,Ee=5e3,Ce=1e3,je=5e3,Ie=1e3,Pe=3e4,De=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"Custom",minutes:null}],Me=[30,60,120,240],Oe="autosnooze_exclude",Ne="autosnooze_include";function Re(e,t){const o=1e3-Date.now()%1e3;e.syncTimeout=globalThis.setTimeout(()=>{e.syncTimeout=null,t(),e.interval=globalThis.setInterval(()=>{t();Date.now()%1e3>50&&(Ze(e),Re(e,t))},Ce)},o)}function Le(e){const t={interval:null,syncTimeout:null};return Re(t,e),t}function Ze(e){null!==e.interval&&(globalThis.clearInterval(e.interval),e.interval=null),null!==e.syncTimeout&&(globalThis.clearTimeout(e.syncTimeout),e.syncTimeout=null)}const Fe="autosnooze_last_duration";const Ue="autosnooze_recent_snoozes";function Ve(){try{const e=localStorage.getItem(Ue);if(!e)return[];const t=JSON.parse(e);if(!Array.isArray(t))return[];const o=Date.now()-2592e6;return t.filter(e=>"string"==typeof e.id&&"number"==typeof e.timestamp&&e.timestamp>o)}catch{return[]}}const Be="autosnooze_hide_snoozed";const Ge="sensor.autosnooze_snoozed_automations",He={},Je={},We=[];let qe=null,Ye=null,Ke=null,Xe=null,Qe=null,et=null;function tt(e){return!e||"object"!=typeof e||Array.isArray(e)?null:e}function ot(e){return tt(e)}function it(e){return tt(e)}function nt(e){const t=tt(e?.attributes);return!!t&&(1===t.schema_version?null!==tt(t.paused)&&null!==tt(t.scheduled):"paused"in t||"scheduled"in t||"paused_automations"in t||"scheduled_snoozes"in t||"duration_presets"in t||"critical_terms"in t)}function at(e){const t=e?.states?.[Ge];if(nt(t))return t;const o=Object.values(e?.states??{}).filter(nt);return o.find(e=>e.entity_id.startsWith(Ge))??o[0]}function rt(e){if(0===Object.keys(e).length)return We;const t={};return Object.entries(e).forEach(([e,o])=>{const i=o.resume_at;t[i]||(t[i]={resumeAt:i,disableAt:o.disable_at,automations:[]}),t[i].automations.push({entity_id:e,friendly_name:o.friendly_name,resume_at:o.resume_at,paused_at:o.paused_at,days:o.days,hours:o.hours,minutes:o.minutes,disable_at:o.disable_at,notification_trigger:o.notification_trigger})}),Object.values(t).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}function st(e){const t=at(e),o=t?.attributes,i=t?.entity_id??null,n=tt(o),a=n?.schema_version,r=n?.paused??n?.paused_automations,s=n?.scheduled??n?.scheduled_snoozes;if(o===qe&&a===Ye&&r===Ke&&s===Xe&&i===Qe&&et)return et;const l=function(e){const t=tt(e);if(!t)return{paused:He,scheduled:Je};const o=t.schema_version;if(1===o){const e=ot(t.paused),o=it(t.scheduled);return e&&o?{paused:e,scheduled:o}:{paused:He,scheduled:Je}}if(void 0===o){const e=ot(t.paused)??ot(t.paused_automations)??{},o=it(t.scheduled)??it(t.scheduled_snoozes)??{};if(Object.keys(e).length>0||Object.keys(o).length>0)return{paused:e,scheduled:o}}const i=ot(t.paused_automations),n=it(t.scheduled_snoozes);return{paused:i??He,scheduled:n??Je}}(o);return qe=o,Ye=a,Ke=r,Xe=s,Qe=i,et={paused:l.paused,scheduled:l.scheduled,groups:rt(l.paused)},et}var lt;function ct(e,t,o){function i(o,i){if(o._zod||Object.defineProperty(o,"_zod",{value:{def:i,constr:r,traits:new Set},enumerable:!1}),o._zod.traits.has(e))return;o._zod.traits.add(e),t(o,i);const n=r.prototype,a=Object.keys(n);for(let e=0;e<a.length;e++){const t=a[e];t in o||(o[t]=n[t].bind(o))}}const n=o?.Parent??Object;class a extends n{}function r(e){var t;const n=o?.Parent?new a:this;i(n,e),(t=n._zod).deferred??(t.deferred=[]);for(const e of n._zod.deferred)e();return n}return Object.defineProperty(a,"name",{value:e}),Object.defineProperty(r,"init",{value:i}),Object.defineProperty(r,Symbol.hasInstance,{value:t=>!!(o?.Parent&&t instanceof o.Parent)||t?._zod?.traits?.has(e)}),Object.defineProperty(r,"name",{value:e}),r}class ut extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}}class dt extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`),this.name="ZodEncodeError"}}(lt=globalThis).__zod_globalConfig??(lt.__zod_globalConfig={});const ht=globalThis.__zod_globalConfig;function pt(e){return ht}function mt(e){const t=Object.values(e).filter(e=>"number"==typeof e),o=Object.entries(e).filter(([e,o])=>-1===t.indexOf(+e)).map(([e,t])=>t);return o}function ft(e,t){return"bigint"==typeof t?t.toString():t}function gt(e){return{get value(){{const t=e();return Object.defineProperty(this,"value",{value:t}),t}}}}function _t(e){return null==e}function bt(e){const t=e.startsWith("^")?1:0,o=e.endsWith("$")?e.length-1:e.length;return e.slice(t,o)}const vt=Symbol("evaluating");function yt(e,t,o){let i;Object.defineProperty(e,t,{get(){if(i!==vt)return void 0===i&&(i=vt,i=o()),i},set(o){Object.defineProperty(e,t,{value:o})},configurable:!0})}function xt(e,t,o){Object.defineProperty(e,t,{value:o,writable:!0,enumerable:!0,configurable:!0})}function wt(...e){const t={};for(const o of e){const e=Object.getOwnPropertyDescriptors(o);Object.assign(t,e)}return Object.defineProperties({},t)}function zt(e){return JSON.stringify(e)}const $t="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function kt(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}const At=gt(()=>{if(ht.jitless)return!1;if("undefined"!=typeof navigator&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{return new Function(""),!0}catch(e){return!1}});function St(e){if(!1===kt(e))return!1;const t=e.constructor;if(void 0===t)return!0;if("function"!=typeof t)return!0;const o=t.prototype;return!1!==kt(o)&&!1!==Object.prototype.hasOwnProperty.call(o,"isPrototypeOf")}function Tt(e){return St(e)?{...e}:Array.isArray(e)?[...e]:e instanceof Map?new Map(e):e instanceof Set?new Set(e):e}const Et=new Set(["string","number","symbol"]);function Ct(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function jt(e,t,o){const i=new e._zod.constr(t??e._zod.def);return t&&!o?.parent||(i._zod.parent=e),i}function It(e){const t=e;if(!t)return{};if("string"==typeof t)return{error:()=>t};if(void 0!==t?.message){if(void 0!==t?.error)throw new Error("Cannot specify both `message` and `error` params");t.error=t.message}return delete t.message,"string"==typeof t.error?{...t,error:()=>t.error}:t}const Pt={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function Dt(e,t=0){if(!0===e.aborted)return!0;for(let o=t;o<e.issues.length;o++)if(!0!==e.issues[o]?.continue)return!0;return!1}function Mt(e,t=0){if(!0===e.aborted)return!0;for(let o=t;o<e.issues.length;o++)if(!1===e.issues[o]?.continue)return!0;return!1}function Ot(e,t){return t.map(t=>{var o;return(o=t).path??(o.path=[]),t.path.unshift(e),t})}function Nt(e){return"string"==typeof e?e:e?.message}function Rt(e,t,o){const i=e.message?e.message:Nt(e.inst?._zod.def?.error?.(e))??Nt(t?.error?.(e))??Nt(o.customError?.(e))??Nt(o.localeError?.(e))??"Invalid input",{inst:n,continue:a,input:r,...s}=e;return s.path??(s.path=[]),s.message=i,t?.reportInput&&(s.input=r),s}function Lt(e){return Array.isArray(e)?"array":"string"==typeof e?"string":"unknown"}function Zt(...e){const[t,o,i]=e;return"string"==typeof t?{message:t,code:"custom",input:o,inst:i}:{...t}}const Ft=(e,t)=>{e.name="$ZodError",Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,ft,2),Object.defineProperty(e,"toString",{value:()=>e.message,enumerable:!1})},Ut=ct("$ZodError",Ft),Vt=ct("$ZodError",Ft,{Parent:Error});const Bt=e=>(t,o,i,n)=>{const a=i?{...i,async:!1}:{async:!1},r=t._zod.run({value:o,issues:[]},a);if(r instanceof Promise)throw new ut;if(r.issues.length){const t=new(n?.Err??e)(r.issues.map(e=>Rt(e,a,pt())));throw $t(t,n?.callee),t}return r.value},Gt=e=>async(t,o,i,n)=>{const a=i?{...i,async:!0}:{async:!0};let r=t._zod.run({value:o,issues:[]},a);if(r instanceof Promise&&(r=await r),r.issues.length){const t=new(n?.Err??e)(r.issues.map(e=>Rt(e,a,pt())));throw $t(t,n?.callee),t}return r.value},Ht=e=>(t,o,i)=>{const n=i?{...i,async:!1}:{async:!1},a=t._zod.run({value:o,issues:[]},n);if(a instanceof Promise)throw new ut;return a.issues.length?{success:!1,error:new(e??Ut)(a.issues.map(e=>Rt(e,n,pt())))}:{success:!0,data:a.value}},Jt=Ht(Vt),Wt=e=>async(t,o,i)=>{const n=i?{...i,async:!0}:{async:!0};let a=t._zod.run({value:o,issues:[]},n);return a instanceof Promise&&(a=await a),a.issues.length?{success:!1,error:new e(a.issues.map(e=>Rt(e,n,pt())))}:{success:!0,data:a.value}},qt=Wt(Vt),Yt=e=>(t,o,i)=>{const n=i?{...i,direction:"backward"}:{direction:"backward"};return Bt(e)(t,o,n)},Kt=e=>(t,o,i)=>Bt(e)(t,o,i),Xt=e=>async(t,o,i)=>{const n=i?{...i,direction:"backward"}:{direction:"backward"};return Gt(e)(t,o,n)},Qt=e=>async(t,o,i)=>Gt(e)(t,o,i),eo=e=>(t,o,i)=>{const n=i?{...i,direction:"backward"}:{direction:"backward"};return Ht(e)(t,o,n)},to=e=>(t,o,i)=>Ht(e)(t,o,i),oo=e=>async(t,o,i)=>{const n=i?{...i,direction:"backward"}:{direction:"backward"};return Wt(e)(t,o,n)},io=e=>async(t,o,i)=>Wt(e)(t,o,i),no=/^[cC][0-9a-z]{6,}$/,ao=/^[0-9a-z]+$/,ro=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,so=/^[0-9a-vA-V]{20}$/,lo=/^[A-Za-z0-9]{27}$/,co=/^[a-zA-Z0-9_-]{21}$/,uo=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,ho=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,po=e=>e?new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,mo=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;const fo=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,go=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,_o=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,bo=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,vo=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,yo=/^[A-Za-z0-9_-]*$/,xo=/^https?$/,wo=/^\+[1-9]\d{6,14}$/,zo="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",$o=new RegExp(`^${zo}$`);function ko(e){const t="(?:[01]\\d|2[0-3]):[0-5]\\d";return"number"==typeof e.precision?-1===e.precision?`${t}`:0===e.precision?`${t}:[0-5]\\d`:`${t}:[0-5]\\d\\.\\d{${e.precision}}`:`${t}(?::[0-5]\\d(?:\\.\\d+)?)?`}const Ao=/^-?\d+$/,So=/^-?\d+(?:\.\d+)?$/,To=/^(?:true|false)$/i,Eo=/^[^A-Z]*$/,Co=/^[^a-z]*$/,jo=ct("$ZodCheck",(e,t)=>{var o;e._zod??(e._zod={}),e._zod.def=t,(o=e._zod).onattach??(o.onattach=[])}),Io={number:"number",bigint:"bigint",object:"date"},Po=ct("$ZodCheckLessThan",(e,t)=>{jo.init(e,t);const o=Io[typeof t.value];e._zod.onattach.push(e=>{const o=e._zod.bag,i=(t.inclusive?o.maximum:o.exclusiveMaximum)??Number.POSITIVE_INFINITY;t.value<i&&(t.inclusive?o.maximum=t.value:o.exclusiveMaximum=t.value)}),e._zod.check=i=>{(t.inclusive?i.value<=t.value:i.value<t.value)||i.issues.push({origin:o,code:"too_big",maximum:"object"==typeof t.value?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),Do=ct("$ZodCheckGreaterThan",(e,t)=>{jo.init(e,t);const o=Io[typeof t.value];e._zod.onattach.push(e=>{const o=e._zod.bag,i=(t.inclusive?o.minimum:o.exclusiveMinimum)??Number.NEGATIVE_INFINITY;t.value>i&&(t.inclusive?o.minimum=t.value:o.exclusiveMinimum=t.value)}),e._zod.check=i=>{(t.inclusive?i.value>=t.value:i.value>t.value)||i.issues.push({origin:o,code:"too_small",minimum:"object"==typeof t.value?t.value.getTime():t.value,input:i.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),Mo=ct("$ZodCheckMultipleOf",(e,t)=>{jo.init(e,t),e._zod.onattach.push(e=>{var o;(o=e._zod.bag).multipleOf??(o.multipleOf=t.value)}),e._zod.check=o=>{if(typeof o.value!=typeof t.value)throw new Error("Cannot mix number and bigint in multiple_of check.");("bigint"==typeof o.value?o.value%t.value===BigInt(0):0===function(e,t){const o=e/t,i=Math.round(o),n=Number.EPSILON*Math.max(Math.abs(o),1);return Math.abs(o-i)<n?0:o-i}(o.value,t.value))||o.issues.push({origin:typeof o.value,code:"not_multiple_of",divisor:t.value,input:o.value,inst:e,continue:!t.abort})}}),Oo=ct("$ZodCheckNumberFormat",(e,t)=>{jo.init(e,t),t.format=t.format||"float64";const o=t.format?.includes("int"),i=o?"int":"number",[n,a]=Pt[t.format];e._zod.onattach.push(e=>{const i=e._zod.bag;i.format=t.format,i.minimum=n,i.maximum=a,o&&(i.pattern=Ao)}),e._zod.check=r=>{const s=r.value;if(o){if(!Number.isInteger(s))return void r.issues.push({expected:i,format:t.format,code:"invalid_type",continue:!1,input:s,inst:e});if(!Number.isSafeInteger(s))return void(s>0?r.issues.push({input:s,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort}):r.issues.push({input:s,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:i,inclusive:!0,continue:!t.abort}))}s<n&&r.issues.push({origin:"number",input:s,code:"too_small",minimum:n,inclusive:!0,inst:e,continue:!t.abort}),s>a&&r.issues.push({origin:"number",input:s,code:"too_big",maximum:a,inclusive:!0,inst:e,continue:!t.abort})}}),No=ct("$ZodCheckMaxLength",(e,t)=>{var o;jo.init(e,t),(o=e._zod.def).when??(o.when=e=>{const t=e.value;return!_t(t)&&void 0!==t.length}),e._zod.onattach.push(e=>{const o=e._zod.bag.maximum??Number.POSITIVE_INFINITY;t.maximum<o&&(e._zod.bag.maximum=t.maximum)}),e._zod.check=o=>{const i=o.value;if(i.length<=t.maximum)return;const n=Lt(i);o.issues.push({origin:n,code:"too_big",maximum:t.maximum,inclusive:!0,input:i,inst:e,continue:!t.abort})}}),Ro=ct("$ZodCheckMinLength",(e,t)=>{var o;jo.init(e,t),(o=e._zod.def).when??(o.when=e=>{const t=e.value;return!_t(t)&&void 0!==t.length}),e._zod.onattach.push(e=>{const o=e._zod.bag.minimum??Number.NEGATIVE_INFINITY;t.minimum>o&&(e._zod.bag.minimum=t.minimum)}),e._zod.check=o=>{const i=o.value;if(i.length>=t.minimum)return;const n=Lt(i);o.issues.push({origin:n,code:"too_small",minimum:t.minimum,inclusive:!0,input:i,inst:e,continue:!t.abort})}}),Lo=ct("$ZodCheckLengthEquals",(e,t)=>{var o;jo.init(e,t),(o=e._zod.def).when??(o.when=e=>{const t=e.value;return!_t(t)&&void 0!==t.length}),e._zod.onattach.push(e=>{const o=e._zod.bag;o.minimum=t.length,o.maximum=t.length,o.length=t.length}),e._zod.check=o=>{const i=o.value,n=i.length;if(n===t.length)return;const a=Lt(i),r=n>t.length;o.issues.push({origin:a,...r?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:o.value,inst:e,continue:!t.abort})}}),Zo=ct("$ZodCheckStringFormat",(e,t)=>{var o,i;jo.init(e,t),e._zod.onattach.push(e=>{const o=e._zod.bag;o.format=t.format,t.pattern&&(o.patterns??(o.patterns=new Set),o.patterns.add(t.pattern))}),t.pattern?(o=e._zod).check??(o.check=o=>{t.pattern.lastIndex=0,t.pattern.test(o.value)||o.issues.push({origin:"string",code:"invalid_format",format:t.format,input:o.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})}):(i=e._zod).check??(i.check=()=>{})}),Fo=ct("$ZodCheckRegex",(e,t)=>{Zo.init(e,t),e._zod.check=o=>{t.pattern.lastIndex=0,t.pattern.test(o.value)||o.issues.push({origin:"string",code:"invalid_format",format:"regex",input:o.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),Uo=ct("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=Eo),Zo.init(e,t)}),Vo=ct("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=Co),Zo.init(e,t)}),Bo=ct("$ZodCheckIncludes",(e,t)=>{jo.init(e,t);const o=Ct(t.includes),i=new RegExp("number"==typeof t.position?`^.{${t.position}}${o}`:o);t.pattern=i,e._zod.onattach.push(e=>{const t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(i)}),e._zod.check=o=>{o.value.includes(t.includes,t.position)||o.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:o.value,inst:e,continue:!t.abort})}}),Go=ct("$ZodCheckStartsWith",(e,t)=>{jo.init(e,t);const o=new RegExp(`^${Ct(t.prefix)}.*`);t.pattern??(t.pattern=o),e._zod.onattach.push(e=>{const t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(o)}),e._zod.check=o=>{o.value.startsWith(t.prefix)||o.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:o.value,inst:e,continue:!t.abort})}}),Ho=ct("$ZodCheckEndsWith",(e,t)=>{jo.init(e,t);const o=new RegExp(`.*${Ct(t.suffix)}$`);t.pattern??(t.pattern=o),e._zod.onattach.push(e=>{const t=e._zod.bag;t.patterns??(t.patterns=new Set),t.patterns.add(o)}),e._zod.check=o=>{o.value.endsWith(t.suffix)||o.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:o.value,inst:e,continue:!t.abort})}}),Jo=ct("$ZodCheckOverwrite",(e,t)=>{jo.init(e,t),e._zod.check=e=>{e.value=t.tx(e.value)}});class Wo{constructor(e=[]){this.content=[],this.indent=0,this&&(this.args=e)}indented(e){this.indent+=1,e(this),this.indent-=1}write(e){if("function"==typeof e)return e(this,{execution:"sync"}),void e(this,{execution:"async"});const t=e.split("\n").filter(e=>e),o=Math.min(...t.map(e=>e.length-e.trimStart().length)),i=t.map(e=>e.slice(o)).map(e=>" ".repeat(2*this.indent)+e);for(const e of i)this.content.push(e)}compile(){const e=Function,t=this?.args,o=[...(this?.content??[""]).map(e=>`  ${e}`)];return new e(...t,o.join("\n"))}}const qo={major:4,minor:4,patch:3},Yo=ct("$ZodType",(e,t)=>{var o;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=qo;const i=[...e._zod.def.checks??[]];e._zod.traits.has("$ZodCheck")&&i.unshift(e);for(const t of i)for(const o of t._zod.onattach)o(e);if(0===i.length)(o=e._zod).deferred??(o.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{const t=(e,t,o)=>{let i,n=Dt(e);for(const a of t){if(a._zod.def.when){if(Mt(e))continue;if(!a._zod.def.when(e))continue}else if(n)continue;const t=e.issues.length,r=a._zod.check(e);if(r instanceof Promise&&!1===o?.async)throw new ut;if(i||r instanceof Promise)i=(i??Promise.resolve()).then(async()=>{await r;e.issues.length!==t&&(n||(n=Dt(e,t)))});else{if(e.issues.length===t)continue;n||(n=Dt(e,t))}}return i?i.then(()=>e):e},o=(o,n,a)=>{if(Dt(o))return o.aborted=!0,o;const r=t(n,i,a);if(r instanceof Promise){if(!1===a.async)throw new ut;return r.then(t=>e._zod.parse(t,a))}return e._zod.parse(r,a)};e._zod.run=(n,a)=>{if(a.skipChecks)return e._zod.parse(n,a);if("backward"===a.direction){const t=e._zod.parse({value:n.value,issues:[]},{...a,skipChecks:!0});return t instanceof Promise?t.then(e=>o(e,n,a)):o(t,n,a)}const r=e._zod.parse(n,a);if(r instanceof Promise){if(!1===a.async)throw new ut;return r.then(e=>t(e,i,a))}return t(r,i,a)}}yt(e,"~standard",()=>({validate:t=>{try{const o=Jt(e,t);return o.success?{value:o.data}:{issues:o.error?.issues}}catch(o){return qt(e,t).then(e=>e.success?{value:e.data}:{issues:e.error?.issues})}},vendor:"zod",version:1}))}),Ko=ct("$ZodString",(e,t)=>{var o;Yo.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??(o=e._zod.bag,new RegExp(`^${o?`[\\s\\S]{${o?.minimum??0},${o?.maximum??""}}`:"[\\s\\S]*"}$`)),e._zod.parse=(o,i)=>{if(t.coerce)try{o.value=String(o.value)}catch(i){}return"string"==typeof o.value||o.issues.push({expected:"string",code:"invalid_type",input:o.value,inst:e}),o}}),Xo=ct("$ZodStringFormat",(e,t)=>{Zo.init(e,t),Ko.init(e,t)}),Qo=ct("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=ho),Xo.init(e,t)}),ei=ct("$ZodUUID",(e,t)=>{if(t.version){const e={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(void 0===e)throw new Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=po(e))}else t.pattern??(t.pattern=po());Xo.init(e,t)}),ti=ct("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=mo),Xo.init(e,t)}),oi=ct("$ZodURL",(e,t)=>{Xo.init(e,t),e._zod.check=o=>{try{const i=o.value.trim();if(!t.normalize&&t.protocol?.source===xo.source&&!/^https?:\/\//i.test(i))return void o.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:o.value,inst:e,continue:!t.abort});const n=new URL(i);return t.hostname&&(t.hostname.lastIndex=0,t.hostname.test(n.hostname)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:o.value,inst:e,continue:!t.abort})),t.protocol&&(t.protocol.lastIndex=0,t.protocol.test(n.protocol.endsWith(":")?n.protocol.slice(0,-1):n.protocol)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:o.value,inst:e,continue:!t.abort})),void(t.normalize?o.value=n.href:o.value=i)}catch(i){o.issues.push({code:"invalid_format",format:"url",input:o.value,inst:e,continue:!t.abort})}}}),ii=ct("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=new RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$","u")),Xo.init(e,t)}),ni=ct("$ZodNanoID",(e,t)=>{t.pattern??(t.pattern=co),Xo.init(e,t)}),ai=ct("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=no),Xo.init(e,t)}),ri=ct("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=ao),Xo.init(e,t)}),si=ct("$ZodULID",(e,t)=>{t.pattern??(t.pattern=ro),Xo.init(e,t)}),li=ct("$ZodXID",(e,t)=>{t.pattern??(t.pattern=so),Xo.init(e,t)}),ci=ct("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=lo),Xo.init(e,t)}),ui=ct("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=function(e){const t=ko({precision:e.precision}),o=["Z"];e.local&&o.push(""),e.offset&&o.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");const i=`${t}(?:${o.join("|")})`;return new RegExp(`^${zo}T(?:${i})$`)}(t)),Xo.init(e,t)}),di=ct("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=$o),Xo.init(e,t)}),hi=ct("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=new RegExp(`^${ko(t)}$`)),Xo.init(e,t)}),pi=ct("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=uo),Xo.init(e,t)}),mi=ct("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=fo),Xo.init(e,t),e._zod.bag.format="ipv4"}),fi=ct("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=go),Xo.init(e,t),e._zod.bag.format="ipv6",e._zod.check=o=>{try{new URL(`http://[${o.value}]`)}catch{o.issues.push({code:"invalid_format",format:"ipv6",input:o.value,inst:e,continue:!t.abort})}}}),gi=ct("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=_o),Xo.init(e,t)}),_i=ct("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=bo),Xo.init(e,t),e._zod.check=o=>{const i=o.value.split("/");try{if(2!==i.length)throw new Error;const[e,t]=i;if(!t)throw new Error;const o=Number(t);if(`${o}`!==t)throw new Error;if(o<0||o>128)throw new Error;new URL(`http://[${e}]`)}catch{o.issues.push({code:"invalid_format",format:"cidrv6",input:o.value,inst:e,continue:!t.abort})}}});function bi(e){if(""===e)return!0;if(/\s/.test(e))return!1;if(e.length%4!=0)return!1;try{return atob(e),!0}catch{return!1}}const vi=ct("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=vo),Xo.init(e,t),e._zod.bag.contentEncoding="base64",e._zod.check=o=>{bi(o.value)||o.issues.push({code:"invalid_format",format:"base64",input:o.value,inst:e,continue:!t.abort})}});const yi=ct("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=yo),Xo.init(e,t),e._zod.bag.contentEncoding="base64url",e._zod.check=o=>{(function(e){if(!yo.test(e))return!1;const t=e.replace(/[-_]/g,e=>"-"===e?"+":"/");return bi(t.padEnd(4*Math.ceil(t.length/4),"="))})(o.value)||o.issues.push({code:"invalid_format",format:"base64url",input:o.value,inst:e,continue:!t.abort})}}),xi=ct("$ZodE164",(e,t)=>{t.pattern??(t.pattern=wo),Xo.init(e,t)});const wi=ct("$ZodJWT",(e,t)=>{Xo.init(e,t),e._zod.check=o=>{(function(e,t=null){try{const o=e.split(".");if(3!==o.length)return!1;const[i]=o;if(!i)return!1;const n=JSON.parse(atob(i));return!("typ"in n&&"JWT"!==n?.typ||!n.alg||t&&(!("alg"in n)||n.alg!==t))}catch{return!1}})(o.value,t.alg)||o.issues.push({code:"invalid_format",format:"jwt",input:o.value,inst:e,continue:!t.abort})}}),zi=ct("$ZodNumber",(e,t)=>{Yo.init(e,t),e._zod.pattern=e._zod.bag.pattern??So,e._zod.parse=(o,i)=>{if(t.coerce)try{o.value=Number(o.value)}catch(e){}const n=o.value;if("number"==typeof n&&!Number.isNaN(n)&&Number.isFinite(n))return o;const a="number"==typeof n?Number.isNaN(n)?"NaN":Number.isFinite(n)?void 0:"Infinity":void 0;return o.issues.push({expected:"number",code:"invalid_type",input:n,inst:e,...a?{received:a}:{}}),o}}),$i=ct("$ZodNumberFormat",(e,t)=>{Oo.init(e,t),zi.init(e,t)}),ki=ct("$ZodBoolean",(e,t)=>{Yo.init(e,t),e._zod.pattern=To,e._zod.parse=(o,i)=>{if(t.coerce)try{o.value=Boolean(o.value)}catch(e){}const n=o.value;return"boolean"==typeof n||o.issues.push({expected:"boolean",code:"invalid_type",input:n,inst:e}),o}}),Ai=ct("$ZodUnknown",(e,t)=>{Yo.init(e,t),e._zod.parse=e=>e}),Si=ct("$ZodNever",(e,t)=>{Yo.init(e,t),e._zod.parse=(t,o)=>(t.issues.push({expected:"never",code:"invalid_type",input:t.value,inst:e}),t)});function Ti(e,t,o){e.issues.length&&t.issues.push(...Ot(o,e.issues)),t.value[o]=e.value}const Ei=ct("$ZodArray",(e,t)=>{Yo.init(e,t),e._zod.parse=(o,i)=>{const n=o.value;if(!Array.isArray(n))return o.issues.push({expected:"array",code:"invalid_type",input:n,inst:e}),o;o.value=Array(n.length);const a=[];for(let e=0;e<n.length;e++){const r=n[e],s=t.element._zod.run({value:r,issues:[]},i);s instanceof Promise?a.push(s.then(t=>Ti(t,o,e))):Ti(s,o,e)}return a.length?Promise.all(a).then(()=>o):o}});function Ci(e,t,o,i,n,a){const r=o in i;if(e.issues.length){if(n&&a&&!r)return;t.issues.push(...Ot(o,e.issues))}r||n?void 0===e.value?r&&(t.value[o]=void 0):t.value[o]=e.value:e.issues.length||t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[o]})}function ji(e){const t=Object.keys(e.shape);for(const o of t)if(!e.shape?.[o]?._zod?.traits?.has("$ZodType"))throw new Error(`Invalid element at key "${o}": expected a Zod schema`);const o=(i=e.shape,Object.keys(i).filter(e=>"optional"===i[e]._zod.optin&&"optional"===i[e]._zod.optout));var i;return{...e,keys:t,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(o)}}function Ii(e,t,o,i,n,a){const r=[],s=n.keySet,l=n.catchall._zod,c=l.def.type,u="optional"===l.optin,d="optional"===l.optout;for(const n in t){if("__proto__"===n)continue;if(s.has(n))continue;if("never"===c){r.push(n);continue}const a=l.run({value:t[n],issues:[]},i);a instanceof Promise?e.push(a.then(e=>Ci(e,o,n,t,u,d))):Ci(a,o,n,t,u,d)}return r.length&&o.issues.push({code:"unrecognized_keys",keys:r,input:t,inst:a}),e.length?Promise.all(e).then(()=>o):o}const Pi=ct("$ZodObject",(e,t)=>{Yo.init(e,t);const o=Object.getOwnPropertyDescriptor(t,"shape");if(!o?.get){const e=t.shape;Object.defineProperty(t,"shape",{get:()=>{const o={...e};return Object.defineProperty(t,"shape",{value:o}),o}})}const i=gt(()=>ji(t));yt(e._zod,"propValues",()=>{const e=t.shape,o={};for(const t in e){const i=e[t]._zod;if(i.values){o[t]??(o[t]=new Set);for(const e of i.values)o[t].add(e)}}return o});const n=kt,a=t.catchall;let r;e._zod.parse=(t,o)=>{r??(r=i.value);const s=t.value;if(!n(s))return t.issues.push({expected:"object",code:"invalid_type",input:s,inst:e}),t;t.value={};const l=[],c=r.shape;for(const e of r.keys){const i=c[e],n="optional"===i._zod.optin,a="optional"===i._zod.optout,r=i._zod.run({value:s[e],issues:[]},o);r instanceof Promise?l.push(r.then(o=>Ci(o,t,e,s,n,a))):Ci(r,t,e,s,n,a)}return a?Ii(l,s,t,o,i.value,e):l.length?Promise.all(l).then(()=>t):t}}),Di=ct("$ZodObjectJIT",(e,t)=>{Pi.init(e,t);const o=e._zod.parse,i=gt(()=>ji(t));let n;const a=kt,r=!ht.jitless,s=r&&At.value,l=t.catchall;let c;e._zod.parse=(u,d)=>{c??(c=i.value);const h=u.value;return a(h)?r&&s&&!1===d?.async&&!0!==d.jitless?(n||(n=(e=>{const t=new Wo(["shape","payload","ctx"]),o=i.value,n=e=>{const t=zt(e);return`shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`};t.write("const input = payload.value;");const a=Object.create(null);let r=0;for(const e of o.keys)a[e]="key_"+r++;t.write("const newResult = {};");for(const i of o.keys){const o=a[i],r=zt(i),s=e[i],l="optional"===s?._zod?.optin,c="optional"===s?._zod?.optout;t.write(`const ${o} = ${n(i)};`),l&&c?t.write(`\n        if (${o}.issues.length) {\n          if (${r} in input) {\n            payload.issues = payload.issues.concat(${o}.issues.map(iss => ({\n              ...iss,\n              path: iss.path ? [${r}, ...iss.path] : [${r}]\n            })));\n          }\n        }\n        \n        if (${o}.value === undefined) {\n          if (${r} in input) {\n            newResult[${r}] = undefined;\n          }\n        } else {\n          newResult[${r}] = ${o}.value;\n        }\n        \n      `):l?t.write(`\n        if (${o}.issues.length) {\n          payload.issues = payload.issues.concat(${o}.issues.map(iss => ({\n            ...iss,\n            path: iss.path ? [${r}, ...iss.path] : [${r}]\n          })));\n        }\n        \n        if (${o}.value === undefined) {\n          if (${r} in input) {\n            newResult[${r}] = undefined;\n          }\n        } else {\n          newResult[${r}] = ${o}.value;\n        }\n        \n      `):t.write(`\n        const ${o}_present = ${r} in input;\n        if (${o}.issues.length) {\n          payload.issues = payload.issues.concat(${o}.issues.map(iss => ({\n            ...iss,\n            path: iss.path ? [${r}, ...iss.path] : [${r}]\n          })));\n        }\n        if (!${o}_present && !${o}.issues.length) {\n          payload.issues.push({\n            code: "invalid_type",\n            expected: "nonoptional",\n            input: undefined,\n            path: [${r}]\n          });\n        }\n\n        if (${o}_present) {\n          if (${o}.value === undefined) {\n            newResult[${r}] = undefined;\n          } else {\n            newResult[${r}] = ${o}.value;\n          }\n        }\n\n      `)}t.write("payload.value = newResult;"),t.write("return payload;");const s=t.compile();return(t,o)=>s(e,t,o)})(t.shape)),u=n(u,d),l?Ii([],h,u,d,c,e):u):o(u,d):(u.issues.push({expected:"object",code:"invalid_type",input:h,inst:e}),u)}});function Mi(e,t,o,i){for(const o of e)if(0===o.issues.length)return t.value=o.value,t;const n=e.filter(e=>!Dt(e));return 1===n.length?(t.value=n[0].value,n[0]):(t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:e.map(e=>e.issues.map(e=>Rt(e,i,pt())))}),t)}const Oi=ct("$ZodUnion",(e,t)=>{Yo.init(e,t),yt(e._zod,"optin",()=>t.options.some(e=>"optional"===e._zod.optin)?"optional":void 0),yt(e._zod,"optout",()=>t.options.some(e=>"optional"===e._zod.optout)?"optional":void 0),yt(e._zod,"values",()=>{if(t.options.every(e=>e._zod.values))return new Set(t.options.flatMap(e=>Array.from(e._zod.values)))}),yt(e._zod,"pattern",()=>{if(t.options.every(e=>e._zod.pattern)){const e=t.options.map(e=>e._zod.pattern);return new RegExp(`^(${e.map(e=>bt(e.source)).join("|")})$`)}});const o=1===t.options.length?t.options[0]._zod.run:null;e._zod.parse=(i,n)=>{if(o)return o(i,n);let a=!1;const r=[];for(const e of t.options){const t=e._zod.run({value:i.value,issues:[]},n);if(t instanceof Promise)r.push(t),a=!0;else{if(0===t.issues.length)return t;r.push(t)}}return a?Promise.all(r).then(t=>Mi(t,i,e,n)):Mi(r,i,e,n)}}),Ni=ct("$ZodDiscriminatedUnion",(e,t)=>{t.inclusive=!1,Oi.init(e,t);const o=e._zod.parse;yt(e._zod,"propValues",()=>{const e={};for(const o of t.options){const i=o._zod.propValues;if(!i||0===Object.keys(i).length)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(o)}"`);for(const[t,o]of Object.entries(i)){e[t]||(e[t]=new Set);for(const i of o)e[t].add(i)}}return e});const i=gt(()=>{const e=t.options,o=new Map;for(const i of e){const e=i._zod.propValues?.[t.discriminator];if(!e||0===e.size)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(i)}"`);for(const t of e){if(o.has(t))throw new Error(`Duplicate discriminator value "${String(t)}"`);o.set(t,i)}}return o});e._zod.parse=(n,a)=>{const r=n.value;if(!kt(r))return n.issues.push({code:"invalid_type",expected:"object",input:r,inst:e}),n;const s=i.value.get(r?.[t.discriminator]);return s?s._zod.run(n,a):t.unionFallback||"backward"===a.direction?o(n,a):(n.issues.push({code:"invalid_union",errors:[],note:"No matching discriminator",discriminator:t.discriminator,options:Array.from(i.value.keys()),input:r,path:[t.discriminator],inst:e}),n)}}),Ri=ct("$ZodIntersection",(e,t)=>{Yo.init(e,t),e._zod.parse=(e,o)=>{const i=e.value,n=t.left._zod.run({value:i,issues:[]},o),a=t.right._zod.run({value:i,issues:[]},o);return n instanceof Promise||a instanceof Promise?Promise.all([n,a]).then(([t,o])=>Zi(e,t,o)):Zi(e,n,a)}});function Li(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e===+t)return{valid:!0,data:e};if(St(e)&&St(t)){const o=Object.keys(t),i=Object.keys(e).filter(e=>-1!==o.indexOf(e)),n={...e,...t};for(const o of i){const i=Li(e[o],t[o]);if(!i.valid)return{valid:!1,mergeErrorPath:[o,...i.mergeErrorPath]};n[o]=i.data}return{valid:!0,data:n}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};const o=[];for(let i=0;i<e.length;i++){const n=Li(e[i],t[i]);if(!n.valid)return{valid:!1,mergeErrorPath:[i,...n.mergeErrorPath]};o.push(n.data)}return{valid:!0,data:o}}return{valid:!1,mergeErrorPath:[]}}function Zi(e,t,o){const i=new Map;let n;for(const o of t.issues)if("unrecognized_keys"===o.code){n??(n=o);for(const e of o.keys)i.has(e)||i.set(e,{}),i.get(e).l=!0}else e.issues.push(o);for(const t of o.issues)if("unrecognized_keys"===t.code)for(const e of t.keys)i.has(e)||i.set(e,{}),i.get(e).r=!0;else e.issues.push(t);const a=[...i].filter(([,e])=>e.l&&e.r).map(([e])=>e);if(a.length&&n&&e.issues.push({...n,keys:a}),Dt(e))return e;const r=Li(t.value,o.value);if(!r.valid)throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(r.mergeErrorPath)}`);return e.value=r.data,e}const Fi=ct("$ZodEnum",(e,t)=>{Yo.init(e,t);const o=mt(t.entries),i=new Set(o);e._zod.values=i,e._zod.pattern=new RegExp(`^(${o.filter(e=>Et.has(typeof e)).map(e=>"string"==typeof e?Ct(e):e.toString()).join("|")})$`),e._zod.parse=(t,n)=>{const a=t.value;return i.has(a)||t.issues.push({code:"invalid_value",values:o,input:a,inst:e}),t}}),Ui=ct("$ZodLiteral",(e,t)=>{if(Yo.init(e,t),0===t.values.length)throw new Error("Cannot create literal schema with no valid values");const o=new Set(t.values);e._zod.values=o,e._zod.pattern=new RegExp(`^(${t.values.map(e=>"string"==typeof e?Ct(e):e?Ct(e.toString()):String(e)).join("|")})$`),e._zod.parse=(i,n)=>{const a=i.value;return o.has(a)||i.issues.push({code:"invalid_value",values:t.values,input:a,inst:e}),i}}),Vi=ct("$ZodTransform",(e,t)=>{Yo.init(e,t),e._zod.optin="optional",e._zod.parse=(o,i)=>{if("backward"===i.direction)throw new dt(e.constructor.name);const n=t.transform(o.value,o);if(i.async){return(n instanceof Promise?n:Promise.resolve(n)).then(e=>(o.value=e,o.fallback=!0,o))}if(n instanceof Promise)throw new ut;return o.value=n,o.fallback=!0,o}});function Bi(e,t){return void 0===t&&(e.issues.length||e.fallback)?{issues:[],value:void 0}:e}const Gi=ct("$ZodOptional",(e,t)=>{Yo.init(e,t),e._zod.optin="optional",e._zod.optout="optional",yt(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),yt(e._zod,"pattern",()=>{const e=t.innerType._zod.pattern;return e?new RegExp(`^(${bt(e.source)})?$`):void 0}),e._zod.parse=(e,o)=>{if("optional"===t.innerType._zod.optin){const i=e.value,n=t.innerType._zod.run(e,o);return n instanceof Promise?n.then(e=>Bi(e,i)):Bi(n,i)}return void 0===e.value?e:t.innerType._zod.run(e,o)}}),Hi=ct("$ZodExactOptional",(e,t)=>{Gi.init(e,t),yt(e._zod,"values",()=>t.innerType._zod.values),yt(e._zod,"pattern",()=>t.innerType._zod.pattern),e._zod.parse=(e,o)=>t.innerType._zod.run(e,o)}),Ji=ct("$ZodNullable",(e,t)=>{Yo.init(e,t),yt(e._zod,"optin",()=>t.innerType._zod.optin),yt(e._zod,"optout",()=>t.innerType._zod.optout),yt(e._zod,"pattern",()=>{const e=t.innerType._zod.pattern;return e?new RegExp(`^(${bt(e.source)}|null)$`):void 0}),yt(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(e,o)=>null===e.value?e:t.innerType._zod.run(e,o)}),Wi=ct("$ZodDefault",(e,t)=>{Yo.init(e,t),e._zod.optin="optional",yt(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,o)=>{if("backward"===o.direction)return t.innerType._zod.run(e,o);if(void 0===e.value)return e.value=t.defaultValue,e;const i=t.innerType._zod.run(e,o);return i instanceof Promise?i.then(e=>qi(e,t)):qi(i,t)}});function qi(e,t){return void 0===e.value&&(e.value=t.defaultValue),e}const Yi=ct("$ZodPrefault",(e,t)=>{Yo.init(e,t),e._zod.optin="optional",yt(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,o)=>("backward"===o.direction||void 0===e.value&&(e.value=t.defaultValue),t.innerType._zod.run(e,o))}),Ki=ct("$ZodNonOptional",(e,t)=>{Yo.init(e,t),yt(e._zod,"values",()=>{const e=t.innerType._zod.values;return e?new Set([...e].filter(e=>void 0!==e)):void 0}),e._zod.parse=(o,i)=>{const n=t.innerType._zod.run(o,i);return n instanceof Promise?n.then(t=>Xi(t,e)):Xi(n,e)}});function Xi(e,t){return e.issues.length||void 0!==e.value||e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t}),e}const Qi=ct("$ZodCatch",(e,t)=>{Yo.init(e,t),e._zod.optin="optional",yt(e._zod,"optout",()=>t.innerType._zod.optout),yt(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(e,o)=>{if("backward"===o.direction)return t.innerType._zod.run(e,o);const i=t.innerType._zod.run(e,o);return i instanceof Promise?i.then(i=>(e.value=i.value,i.issues.length&&(e.value=t.catchValue({...e,error:{issues:i.issues.map(e=>Rt(e,o,pt()))},input:e.value}),e.issues=[],e.fallback=!0),e)):(e.value=i.value,i.issues.length&&(e.value=t.catchValue({...e,error:{issues:i.issues.map(e=>Rt(e,o,pt()))},input:e.value}),e.issues=[],e.fallback=!0),e)}}),en=ct("$ZodPipe",(e,t)=>{Yo.init(e,t),yt(e._zod,"values",()=>t.in._zod.values),yt(e._zod,"optin",()=>t.in._zod.optin),yt(e._zod,"optout",()=>t.out._zod.optout),yt(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(e,o)=>{if("backward"===o.direction){const i=t.out._zod.run(e,o);return i instanceof Promise?i.then(e=>tn(e,t.in,o)):tn(i,t.in,o)}const i=t.in._zod.run(e,o);return i instanceof Promise?i.then(e=>tn(e,t.out,o)):tn(i,t.out,o)}});function tn(e,t,o){return e.issues.length?(e.aborted=!0,e):t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},o)}const on=ct("$ZodReadonly",(e,t)=>{Yo.init(e,t),yt(e._zod,"propValues",()=>t.innerType._zod.propValues),yt(e._zod,"values",()=>t.innerType._zod.values),yt(e._zod,"optin",()=>t.innerType?._zod?.optin),yt(e._zod,"optout",()=>t.innerType?._zod?.optout),e._zod.parse=(e,o)=>{if("backward"===o.direction)return t.innerType._zod.run(e,o);const i=t.innerType._zod.run(e,o);return i instanceof Promise?i.then(nn):nn(i)}});function nn(e){return e.value=Object.freeze(e.value),e}const an=ct("$ZodCustom",(e,t)=>{jo.init(e,t),Yo.init(e,t),e._zod.parse=(e,t)=>e,e._zod.check=o=>{const i=o.value,n=t.fn(i);if(n instanceof Promise)return n.then(t=>rn(t,o,i,e));rn(n,o,i,e)}});function rn(e,t,o,i){if(!e){const e={code:"custom",input:o,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};i._zod.def.params&&(e.params=i._zod.def.params),t.issues.push(Zt(e))}}var sn;class ln{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){const o=t[0];return this._map.set(e,o),o&&"object"==typeof o&&"id"in o&&this._idmap.set(o.id,e),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){const t=this._map.get(e);return t&&"object"==typeof t&&"id"in t&&this._idmap.delete(t.id),this._map.delete(e),this}get(e){const t=e._zod.parent;if(t){const o={...this.get(t)??{}};delete o.id;const i={...o,...this._map.get(e)};return Object.keys(i).length?i:void 0}return this._map.get(e)}has(e){return this._map.has(e)}}(sn=globalThis).__zod_globalRegistry??(sn.__zod_globalRegistry=new ln);const cn=globalThis.__zod_globalRegistry;function un(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...It(t)})}function dn(e,t){return new Po({check:"less_than",...It(t),value:e,inclusive:!1})}function hn(e,t){return new Po({check:"less_than",...It(t),value:e,inclusive:!0})}function pn(e,t){return new Do({check:"greater_than",...It(t),value:e,inclusive:!1})}function mn(e,t){return new Do({check:"greater_than",...It(t),value:e,inclusive:!0})}function fn(e,t){return new Mo({check:"multiple_of",...It(t),value:e})}function gn(e,t){return new No({check:"max_length",...It(t),maximum:e})}function _n(e,t){return new Ro({check:"min_length",...It(t),minimum:e})}function bn(e,t){return new Lo({check:"length_equals",...It(t),length:e})}function vn(e){return new Jo({check:"overwrite",tx:e})}function yn(e,t){const o=function(e,t){const o=new jo({check:"custom",...It(t)});return o._zod.check=e,o}(t=>(t.addIssue=e=>{if("string"==typeof e)t.issues.push(Zt(e,t.value,o._zod.def));else{const i=e;i.fatal&&(i.continue=!1),i.code??(i.code="custom"),i.input??(i.input=t.value),i.inst??(i.inst=o),i.continue??(i.continue=!o._zod.def.abort),t.issues.push(Zt(i))}},e(t.value,t)),t);return o}function xn(e){let t=e?.target??"draft-2020-12";return"draft-4"===t&&(t="draft-04"),"draft-7"===t&&(t="draft-07"),{processors:e.processors??{},metadataRegistry:e?.metadata??cn,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,cycles:e?.cycles??"ref",reused:e?.reused??"inline",external:e?.external??void 0}}function wn(e,t,o={path:[],schemaPath:[]}){var i;const n=e._zod.def,a=t.seen.get(e);if(a){a.count++;return o.schemaPath.includes(e)&&(a.cycle=o.path),a.schema}const r={schema:{},count:1,cycle:void 0,path:o.path};t.seen.set(e,r);const s=e._zod.toJSONSchema?.();if(s)r.schema=s;else{const i={...o,schemaPath:[...o.schemaPath,e],path:o.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,r.schema,i);else{const o=r.schema,a=t.processors[n.type];if(!a)throw new Error(`[toJSONSchema]: Non-representable type encountered: ${n.type}`);a(e,t,o,i)}const a=e._zod.parent;a&&(r.ref||(r.ref=a),wn(a,t,i),t.seen.get(a).isParent=!0)}const l=t.metadataRegistry.get(e);l&&Object.assign(r.schema,l),"input"===t.io&&kn(e)&&(delete r.schema.examples,delete r.schema.default),"input"===t.io&&"_prefault"in r.schema&&((i=r.schema).default??(i.default=r.schema._prefault)),delete r.schema._prefault;return t.seen.get(e).schema}function zn(e,t){const o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");const i=new Map;for(const t of e.seen.entries()){const o=e.metadataRegistry.get(t[0])?.id;if(o){const e=i.get(o);if(e&&e!==t[0])throw new Error(`Duplicate schema id "${o}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(o,t[0])}}const n=t=>{if(t[1].schema.$ref)return;const i=t[1],{ref:n,defId:a}=(t=>{const i="draft-2020-12"===e.target?"$defs":"definitions";if(e.external){const o=e.external.registry.get(t[0])?.id,n=e.external.uri??(e=>e);if(o)return{ref:n(o)};const a=t[1].defId??t[1].schema.id??"schema"+e.counter++;return t[1].defId=a,{defId:a,ref:`${n("__shared")}#/${i}/${a}`}}if(t[1]===o)return{ref:"#"};const n=`#/${i}/`,a=t[1].schema.id??"__schema"+e.counter++;return{defId:a,ref:n+a}})(t);i.def={...i.schema},a&&(i.defId=a);const r=i.schema;for(const e in r)delete r[e];r.$ref=n};if("throw"===e.cycles)for(const t of e.seen.entries()){const e=t[1];if(e.cycle)throw new Error(`Cycle detected: #/${e.cycle?.join("/")}/<root>\n\nSet the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(const o of e.seen.entries()){const i=o[1];if(t===o[0]){n(o);continue}if(e.external){const i=e.external.registry.get(o[0])?.id;if(t!==o[0]&&i){n(o);continue}}const a=e.metadataRegistry.get(o[0])?.id;a?n(o):(i.cycle||i.count>1&&"ref"===e.reused)&&n(o)}}function $n(e,t){const o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");const i=t=>{const o=e.seen.get(t);if(null===o.ref)return;const n=o.def??o.schema,a={...n},r=o.ref;if(o.ref=null,r){i(r);const o=e.seen.get(r),s=o.schema;!s.$ref||"draft-07"!==e.target&&"draft-04"!==e.target&&"openapi-3.0"!==e.target?Object.assign(n,s):(n.allOf=n.allOf??[],n.allOf.push(s)),Object.assign(n,a);if(t._zod.parent===r)for(const e in n)"$ref"!==e&&"allOf"!==e&&(e in a||delete n[e]);if(s.$ref&&o.def)for(const e in n)"$ref"!==e&&"allOf"!==e&&e in o.def&&JSON.stringify(n[e])===JSON.stringify(o.def[e])&&delete n[e]}const s=t._zod.parent;if(s&&s!==r){i(s);const t=e.seen.get(s);if(t?.schema.$ref&&(n.$ref=t.schema.$ref,t.def))for(const e in n)"$ref"!==e&&"allOf"!==e&&e in t.def&&JSON.stringify(n[e])===JSON.stringify(t.def[e])&&delete n[e]}e.override({zodSchema:t,jsonSchema:n,path:o.path??[]})};for(const t of[...e.seen.entries()].reverse())i(t[0]);const n={};if("draft-2020-12"===e.target?n.$schema="https://json-schema.org/draft/2020-12/schema":"draft-07"===e.target?n.$schema="http://json-schema.org/draft-07/schema#":"draft-04"===e.target?n.$schema="http://json-schema.org/draft-04/schema#":e.target,e.external?.uri){const o=e.external.registry.get(t)?.id;if(!o)throw new Error("Schema is missing an `id` property");n.$id=e.external.uri(o)}Object.assign(n,o.def??o.schema);const a=e.metadataRegistry.get(t)?.id;void 0!==a&&n.id===a&&delete n.id;const r=e.external?.defs??{};for(const t of e.seen.entries()){const e=t[1];e.def&&e.defId&&(e.def.id===e.defId&&delete e.def.id,r[e.defId]=e.def)}e.external||Object.keys(r).length>0&&("draft-2020-12"===e.target?n.$defs=r:n.definitions=r);try{const o=JSON.parse(JSON.stringify(n));return Object.defineProperty(o,"~standard",{value:{...t["~standard"],jsonSchema:{input:An(t,"input",e.processors),output:An(t,"output",e.processors)}},enumerable:!1,writable:!1}),o}catch(e){throw new Error("Error converting schema to JSON.")}}function kn(e,t){const o=t??{seen:new Set};if(o.seen.has(e))return!1;o.seen.add(e);const i=e._zod.def;if("transform"===i.type)return!0;if("array"===i.type)return kn(i.element,o);if("set"===i.type)return kn(i.valueType,o);if("lazy"===i.type)return kn(i.getter(),o);if("promise"===i.type||"optional"===i.type||"nonoptional"===i.type||"nullable"===i.type||"readonly"===i.type||"default"===i.type||"prefault"===i.type)return kn(i.innerType,o);if("intersection"===i.type)return kn(i.left,o)||kn(i.right,o);if("record"===i.type||"map"===i.type)return kn(i.keyType,o)||kn(i.valueType,o);if("pipe"===i.type)return!!e._zod.traits.has("$ZodCodec")||(kn(i.in,o)||kn(i.out,o));if("object"===i.type){for(const e in i.shape)if(kn(i.shape[e],o))return!0;return!1}if("union"===i.type){for(const e of i.options)if(kn(e,o))return!0;return!1}if("tuple"===i.type){for(const e of i.items)if(kn(e,o))return!0;return!(!i.rest||!kn(i.rest,o))}return!1}const An=(e,t,o={})=>i=>{const{libraryOptions:n,target:a}=i??{},r=xn({...n??{},target:a,io:t,processors:o});return wn(e,r),zn(r,e),$n(r,e)},Sn={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},Tn=(e,t,o,i)=>{const n=e._zod.def;wn(n.innerType,t,i);t.seen.get(e).ref=n.innerType},En=ct("ZodISODateTime",(e,t)=>{ui.init(e,t),oa.init(e,t)});function Cn(e){return function(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...It(t)})}(En,e)}const jn=ct("ZodISODate",(e,t)=>{di.init(e,t),oa.init(e,t)});function In(e){return function(e,t){return new e({type:"string",format:"date",check:"string_format",...It(t)})}(jn,e)}const Pn=ct("ZodISOTime",(e,t)=>{hi.init(e,t),oa.init(e,t)});function Dn(e){return function(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...It(t)})}(Pn,e)}const Mn=ct("ZodISODuration",(e,t)=>{pi.init(e,t),oa.init(e,t)});function On(e){return function(e,t){return new e({type:"string",format:"duration",check:"string_format",...It(t)})}(Mn,e)}const Nn=(e,t)=>{Ut.init(e,t),e.name="ZodError",Object.defineProperties(e,{format:{value:t=>function(e,t=e=>e.message){const o={_errors:[]},i=(e,n=[])=>{for(const a of e.issues)if("invalid_union"===a.code&&a.errors.length)a.errors.map(e=>i({issues:e},[...n,...a.path]));else if("invalid_key"===a.code)i({issues:a.issues},[...n,...a.path]);else if("invalid_element"===a.code)i({issues:a.issues},[...n,...a.path]);else{const e=[...n,...a.path];if(0===e.length)o._errors.push(t(a));else{let i=o,n=0;for(;n<e.length;){const o=e[n];n===e.length-1?(i[o]=i[o]||{_errors:[]},i[o]._errors.push(t(a))):i[o]=i[o]||{_errors:[]},i=i[o],n++}}}};return i(e),o}(e,t)},flatten:{value:t=>function(e,t=e=>e.message){const o={},i=[];for(const n of e.issues)n.path.length>0?(o[n.path[0]]=o[n.path[0]]||[],o[n.path[0]].push(t(n))):i.push(t(n));return{formErrors:i,fieldErrors:o}}(e,t)},addIssue:{value:t=>{e.issues.push(t),e.message=JSON.stringify(e.issues,ft,2)}},addIssues:{value:t=>{e.issues.push(...t),e.message=JSON.stringify(e.issues,ft,2)}},isEmpty:{get:()=>0===e.issues.length}})},Rn=ct("ZodError",Nn,{Parent:Error}),Ln=Bt(Rn),Zn=Gt(Rn),Fn=Ht(Rn),Un=Wt(Rn),Vn=Yt(Rn),Bn=Kt(Rn),Gn=Xt(Rn),Hn=Qt(Rn),Jn=eo(Rn),Wn=to(Rn),qn=oo(Rn),Yn=io(Rn),Kn=new WeakMap;function Xn(e,t,o){const i=Object.getPrototypeOf(e);let n=Kn.get(i);if(n||(n=new Set,Kn.set(i,n)),!n.has(t)){n.add(t);for(const e in o){const t=o[e];Object.defineProperty(i,e,{configurable:!0,enumerable:!1,get(){const o=t.bind(this);return Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:o}),o},set(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,enumerable:!0,value:t})}})}}}const Qn=ct("ZodType",(e,t)=>(Yo.init(e,t),Object.assign(e["~standard"],{jsonSchema:{input:An(e,"input"),output:An(e,"output")}}),e.toJSONSchema=((e,t={})=>o=>{const i=xn({...o,processors:t});return wn(e,i),zn(i,e),$n(i,e)})(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(t,o)=>Ln(e,t,o,{callee:e.parse}),e.safeParse=(t,o)=>Fn(e,t,o),e.parseAsync=async(t,o)=>Zn(e,t,o,{callee:e.parseAsync}),e.safeParseAsync=async(t,o)=>Un(e,t,o),e.spa=e.safeParseAsync,e.encode=(t,o)=>Vn(e,t,o),e.decode=(t,o)=>Bn(e,t,o),e.encodeAsync=async(t,o)=>Gn(e,t,o),e.decodeAsync=async(t,o)=>Hn(e,t,o),e.safeEncode=(t,o)=>Jn(e,t,o),e.safeDecode=(t,o)=>Wn(e,t,o),e.safeEncodeAsync=async(t,o)=>qn(e,t,o),e.safeDecodeAsync=async(t,o)=>Yn(e,t,o),Xn(e,"ZodType",{check(...e){const t=this.def;return this.clone(wt(t,{checks:[...t.checks??[],...e.map(e=>"function"==typeof e?{_zod:{check:e,def:{check:"custom"},onattach:[]}}:e)]}),{parent:!0})},with(...e){return this.check(...e)},clone(e,t){return jt(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},refine(e,t){return this.check(function(e,t={}){return function(e,t,o){return new e({type:"custom",check:"custom",fn:t,...It(o)})}(er,e,t)}(e,t))},superRefine(e,t){return this.check(function(e,t){return yn(e,t)}(e,t))},overwrite(e){return this.check(vn(e))},optional(){return Va(this)},exactOptional(){return new Ba({type:"optional",innerType:this})},nullable(){return Ha(this)},nullish(){return Va(Ha(this))},nonoptional(e){return function(e,t){return new qa({type:"nonoptional",innerType:e,...It(t)})}(this,e)},array(){return function(e,t,o){return new e({type:"array",element:t,...It(o)})}(Ca,this,e);var e},or(e){return Da([this,e])},and(e){return new Oa({type:"intersection",left:this,right:e})},transform(e){return Xa(this,new Fa({type:"transform",transform:e}))},default(e){return t=e,new Ja({type:"default",innerType:this,get defaultValue(){return"function"==typeof t?t():Tt(t)}});var t},prefault(e){return t=e,new Wa({type:"prefault",innerType:this,get defaultValue(){return"function"==typeof t?t():Tt(t)}});var t},catch(e){return new Ya({type:"catch",innerType:this,catchValue:"function"==typeof(t=e)?t:()=>t});var t},pipe(e){return Xa(this,e)},readonly(){return new Qa({type:"readonly",innerType:this})},describe(e){const t=this.clone();return cn.add(t,{description:e}),t},meta(...e){if(0===e.length)return cn.get(this);const t=this.clone();return cn.add(t,e[0]),t},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(e){return e(this)}}),Object.defineProperty(e,"description",{get:()=>cn.get(e)?.description,configurable:!0}),e)),ea=ct("_ZodString",(e,t)=>{Ko.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o)=>{const i=o;i.type="string";const{minimum:n,maximum:a,format:r,patterns:s,contentEncoding:l}=e._zod.bag;if("number"==typeof n&&(i.minLength=n),"number"==typeof a&&(i.maxLength=a),r&&(i.format=Sn[r]??r,""===i.format&&delete i.format,"time"===r&&delete i.format),l&&(i.contentEncoding=l),s&&s.size>0){const e=[...s];1===e.length?i.pattern=e[0].source:e.length>1&&(i.allOf=[...e.map(e=>({..."draft-07"===t.target||"draft-04"===t.target||"openapi-3.0"===t.target?{type:"string"}:{},pattern:e.source}))])}})(e,t,o);const o=e._zod.bag;e.format=o.format??null,e.minLength=o.minimum??null,e.maxLength=o.maximum??null,Xn(e,"_ZodString",{regex(...e){return this.check(function(e,t){return new Fo({check:"string_format",format:"regex",...It(t),pattern:e})}(...e))},includes(...e){return this.check(function(e,t){return new Bo({check:"string_format",format:"includes",...It(t),includes:e})}(...e))},startsWith(...e){return this.check(function(e,t){return new Go({check:"string_format",format:"starts_with",...It(t),prefix:e})}(...e))},endsWith(...e){return this.check(function(e,t){return new Ho({check:"string_format",format:"ends_with",...It(t),suffix:e})}(...e))},min(...e){return this.check(_n(...e))},max(...e){return this.check(gn(...e))},length(...e){return this.check(bn(...e))},nonempty(...e){return this.check(_n(1,...e))},lowercase(e){return this.check(function(e){return new Uo({check:"string_format",format:"lowercase",...It(e)})}(e))},uppercase(e){return this.check(function(e){return new Vo({check:"string_format",format:"uppercase",...It(e)})}(e))},trim(){return this.check(vn(e=>e.trim()))},normalize(...e){return this.check(function(e){return vn(t=>t.normalize(e))}(...e))},toLowerCase(){return this.check(vn(e=>e.toLowerCase()))},toUpperCase(){return this.check(vn(e=>e.toUpperCase()))},slugify(){return this.check(vn(e=>function(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}(e)))}})}),ta=ct("ZodString",(e,t)=>{Ko.init(e,t),ea.init(e,t),e.email=t=>e.check(function(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...It(t)})}(ia,t)),e.url=t=>e.check(function(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...It(t)})}(ra,t)),e.jwt=t=>e.check(function(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...It(t)})}(xa,t)),e.emoji=t=>e.check(function(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...It(t)})}(sa,t)),e.guid=t=>e.check(un(na,t)),e.uuid=t=>e.check(function(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...It(t)})}(aa,t)),e.uuidv4=t=>e.check(function(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...It(t)})}(aa,t)),e.uuidv6=t=>e.check(function(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...It(t)})}(aa,t)),e.uuidv7=t=>e.check(function(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...It(t)})}(aa,t)),e.nanoid=t=>e.check(function(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...It(t)})}(la,t)),e.guid=t=>e.check(un(na,t)),e.cuid=t=>e.check(function(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...It(t)})}(ca,t)),e.cuid2=t=>e.check(function(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...It(t)})}(ua,t)),e.ulid=t=>e.check(function(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...It(t)})}(da,t)),e.base64=t=>e.check(function(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...It(t)})}(ba,t)),e.base64url=t=>e.check(function(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...It(t)})}(va,t)),e.xid=t=>e.check(function(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...It(t)})}(ha,t)),e.ksuid=t=>e.check(function(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...It(t)})}(pa,t)),e.ipv4=t=>e.check(function(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...It(t)})}(ma,t)),e.ipv6=t=>e.check(function(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...It(t)})}(fa,t)),e.cidrv4=t=>e.check(function(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...It(t)})}(ga,t)),e.cidrv6=t=>e.check(function(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...It(t)})}(_a,t)),e.e164=t=>e.check(function(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...It(t)})}(ya,t)),e.datetime=t=>e.check(Cn(t)),e.date=t=>e.check(In(t)),e.time=t=>e.check(Dn(t)),e.duration=t=>e.check(On(t))});const oa=ct("ZodStringFormat",(e,t)=>{Xo.init(e,t),ea.init(e,t)}),ia=ct("ZodEmail",(e,t)=>{ti.init(e,t),oa.init(e,t)}),na=ct("ZodGUID",(e,t)=>{Qo.init(e,t),oa.init(e,t)}),aa=ct("ZodUUID",(e,t)=>{ei.init(e,t),oa.init(e,t)}),ra=ct("ZodURL",(e,t)=>{oi.init(e,t),oa.init(e,t)}),sa=ct("ZodEmoji",(e,t)=>{ii.init(e,t),oa.init(e,t)}),la=ct("ZodNanoID",(e,t)=>{ni.init(e,t),oa.init(e,t)}),ca=ct("ZodCUID",(e,t)=>{ai.init(e,t),oa.init(e,t)}),ua=ct("ZodCUID2",(e,t)=>{ri.init(e,t),oa.init(e,t)}),da=ct("ZodULID",(e,t)=>{si.init(e,t),oa.init(e,t)}),ha=ct("ZodXID",(e,t)=>{li.init(e,t),oa.init(e,t)}),pa=ct("ZodKSUID",(e,t)=>{ci.init(e,t),oa.init(e,t)}),ma=ct("ZodIPv4",(e,t)=>{mi.init(e,t),oa.init(e,t)}),fa=ct("ZodIPv6",(e,t)=>{fi.init(e,t),oa.init(e,t)}),ga=ct("ZodCIDRv4",(e,t)=>{gi.init(e,t),oa.init(e,t)}),_a=ct("ZodCIDRv6",(e,t)=>{_i.init(e,t),oa.init(e,t)}),ba=ct("ZodBase64",(e,t)=>{vi.init(e,t),oa.init(e,t)}),va=ct("ZodBase64URL",(e,t)=>{yi.init(e,t),oa.init(e,t)}),ya=ct("ZodE164",(e,t)=>{xi.init(e,t),oa.init(e,t)}),xa=ct("ZodJWT",(e,t)=>{wi.init(e,t),oa.init(e,t)}),wa=ct("ZodNumber",(e,t)=>{zi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o)=>{const i=o,{minimum:n,maximum:a,format:r,multipleOf:s,exclusiveMaximum:l,exclusiveMinimum:c}=e._zod.bag;"string"==typeof r&&r.includes("int")?i.type="integer":i.type="number";const u="number"==typeof c&&c>=(n??Number.NEGATIVE_INFINITY),d="number"==typeof l&&l<=(a??Number.POSITIVE_INFINITY),h="draft-04"===t.target||"openapi-3.0"===t.target;u?h?(i.minimum=c,i.exclusiveMinimum=!0):i.exclusiveMinimum=c:"number"==typeof n&&(i.minimum=n),d?h?(i.maximum=l,i.exclusiveMaximum=!0):i.exclusiveMaximum=l:"number"==typeof a&&(i.maximum=a),"number"==typeof s&&(i.multipleOf=s)})(e,t,o),Xn(e,"ZodNumber",{gt(e,t){return this.check(pn(e,t))},gte(e,t){return this.check(mn(e,t))},min(e,t){return this.check(mn(e,t))},lt(e,t){return this.check(dn(e,t))},lte(e,t){return this.check(hn(e,t))},max(e,t){return this.check(hn(e,t))},int(e){return this.check($a(e))},safe(e){return this.check($a(e))},positive(e){return this.check(pn(0,e))},nonnegative(e){return this.check(mn(0,e))},negative(e){return this.check(dn(0,e))},nonpositive(e){return this.check(hn(0,e))},multipleOf(e,t){return this.check(fn(e,t))},step(e,t){return this.check(fn(e,t))},finite(){return this}});const o=e._zod.bag;e.minValue=Math.max(o.minimum??Number.NEGATIVE_INFINITY,o.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,e.maxValue=Math.min(o.maximum??Number.POSITIVE_INFINITY,o.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,e.isInt=(o.format??"").includes("int")||Number.isSafeInteger(o.multipleOf??.5),e.isFinite=!0,e.format=o.format??null});const za=ct("ZodNumberFormat",(e,t)=>{$i.init(e,t),wa.init(e,t)});function $a(e){return function(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...It(t)})}(za,e)}const ka=ct("ZodBoolean",(e,t)=>{ki.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(e,t,o)=>((e,t,o)=>{o.type="boolean"})(0,0,t)});const Aa=ct("ZodUnknown",(e,t)=>{Ai.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(e,t,o)=>{}});function Sa(){return new Aa({type:"unknown"})}const Ta=ct("ZodNever",(e,t)=>{Si.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(e,t,o)=>((e,t,o)=>{o.not={}})(0,0,t)});function Ea(e){return function(e,t){return new e({type:"never",...It(t)})}(Ta,e)}const Ca=ct("ZodArray",(e,t)=>{Ei.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=o,a=e._zod.def,{minimum:r,maximum:s}=e._zod.bag;"number"==typeof r&&(n.minItems=r),"number"==typeof s&&(n.maxItems=s),n.type="array",n.items=wn(a.element,t,{...i,path:[...i.path,"items"]})})(e,t,o,i),e.element=t.element,Xn(e,"ZodArray",{min(e,t){return this.check(_n(e,t))},nonempty(e){return this.check(_n(1,e))},max(e,t){return this.check(gn(e,t))},length(e,t){return this.check(bn(e,t))},unwrap(){return this.element}})});const ja=ct("ZodObject",(e,t)=>{Di.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=o,a=e._zod.def;n.type="object",n.properties={};const r=a.shape;for(const e in r)n.properties[e]=wn(r[e],t,{...i,path:[...i.path,"properties",e]});const s=new Set(Object.keys(r)),l=new Set([...s].filter(e=>{const o=a.shape[e]._zod;return"input"===t.io?void 0===o.optin:void 0===o.optout}));l.size>0&&(n.required=Array.from(l)),"never"===a.catchall?._zod.def.type?n.additionalProperties=!1:a.catchall?a.catchall&&(n.additionalProperties=wn(a.catchall,t,{...i,path:[...i.path,"additionalProperties"]})):"output"===t.io&&(n.additionalProperties=!1)})(e,t,o,i),yt(e,"shape",()=>t.shape),Xn(e,"ZodObject",{keyof(){return Ra(Object.keys(this._zod.def.shape))},catchall(e){return this.clone({...this._zod.def,catchall:e})},passthrough(){return this.clone({...this._zod.def,catchall:Sa()})},loose(){return this.clone({...this._zod.def,catchall:Sa()})},strict(){return this.clone({...this._zod.def,catchall:Ea()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(e){return function(e,t){if(!St(t))throw new Error("Invalid input to extend: expected a plain object");const o=e._zod.def.checks;if(o&&o.length>0){const o=e._zod.def.shape;for(const e in t)if(void 0!==Object.getOwnPropertyDescriptor(o,e))throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}const i=wt(e._zod.def,{get shape(){const o={...e._zod.def.shape,...t};return xt(this,"shape",o),o}});return jt(e,i)}(this,e)},safeExtend(e){return function(e,t){if(!St(t))throw new Error("Invalid input to safeExtend: expected a plain object");const o=wt(e._zod.def,{get shape(){const o={...e._zod.def.shape,...t};return xt(this,"shape",o),o}});return jt(e,o)}(this,e)},merge(e){return function(e,t){if(e._zod.def.checks?.length)throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");const o=wt(e._zod.def,{get shape(){const o={...e._zod.def.shape,...t._zod.def.shape};return xt(this,"shape",o),o},get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return jt(e,o)}(this,e)},pick(e){return function(e,t){const o=e._zod.def,i=o.checks;if(i&&i.length>0)throw new Error(".pick() cannot be used on object schemas containing refinements");return jt(e,wt(e._zod.def,{get shape(){const e={};for(const i in t){if(!(i in o.shape))throw new Error(`Unrecognized key: "${i}"`);t[i]&&(e[i]=o.shape[i])}return xt(this,"shape",e),e},checks:[]}))}(this,e)},omit(e){return function(e,t){const o=e._zod.def,i=o.checks;if(i&&i.length>0)throw new Error(".omit() cannot be used on object schemas containing refinements");const n=wt(e._zod.def,{get shape(){const i={...e._zod.def.shape};for(const e in t){if(!(e in o.shape))throw new Error(`Unrecognized key: "${e}"`);t[e]&&delete i[e]}return xt(this,"shape",i),i},checks:[]});return jt(e,n)}(this,e)},partial(...e){return function(e,t,o){const i=t._zod.def.checks;if(i&&i.length>0)throw new Error(".partial() cannot be used on object schemas containing refinements");const n=wt(t._zod.def,{get shape(){const i=t._zod.def.shape,n={...i};if(o)for(const t in o){if(!(t in i))throw new Error(`Unrecognized key: "${t}"`);o[t]&&(n[t]=e?new e({type:"optional",innerType:i[t]}):i[t])}else for(const t in i)n[t]=e?new e({type:"optional",innerType:i[t]}):i[t];return xt(this,"shape",n),n},checks:[]});return jt(t,n)}(Ua,this,e[0])},required(...e){return function(e,t,o){const i=wt(t._zod.def,{get shape(){const i=t._zod.def.shape,n={...i};if(o)for(const t in o){if(!(t in n))throw new Error(`Unrecognized key: "${t}"`);o[t]&&(n[t]=new e({type:"nonoptional",innerType:i[t]}))}else for(const t in i)n[t]=new e({type:"nonoptional",innerType:i[t]});return xt(this,"shape",n),n}});return jt(t,i)}(qa,this,e[0])}})});function Ia(e,t){const o={type:"object",shape:e??{},...It(t)};return new ja(o)}const Pa=ct("ZodUnion",(e,t)=>{Oi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def,a=!1===n.inclusive,r=n.options.map((e,o)=>wn(e,t,{...i,path:[...i.path,a?"oneOf":"anyOf",o]}));a?o.oneOf=r:o.anyOf=r})(e,t,o,i),e.options=t.options});function Da(e,t){return new Pa({type:"union",options:e,...It(t)})}const Ma=ct("ZodDiscriminatedUnion",(e,t)=>{Pa.init(e,t),Ni.init(e,t)});const Oa=ct("ZodIntersection",(e,t)=>{Ri.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def,a=wn(n.left,t,{...i,path:[...i.path,"allOf",0]}),r=wn(n.right,t,{...i,path:[...i.path,"allOf",1]}),s=e=>"allOf"in e&&1===Object.keys(e).length,l=[...s(a)?a.allOf:[a],...s(r)?r.allOf:[r]];o.allOf=l})(e,t,o,i)});const Na=ct("ZodEnum",(e,t)=>{Fi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o)=>{const i=mt(e._zod.def.entries);i.every(e=>"number"==typeof e)&&(o.type="number"),i.every(e=>"string"==typeof e)&&(o.type="string"),o.enum=i})(e,0,o),e.enum=t.entries,e.options=Object.values(t.entries);const o=new Set(Object.keys(t.entries));e.extract=(e,i)=>{const n={};for(const i of e){if(!o.has(i))throw new Error(`Key ${i} not found in enum`);n[i]=t.entries[i]}return new Na({...t,checks:[],...It(i),entries:n})},e.exclude=(e,i)=>{const n={...t.entries};for(const t of e){if(!o.has(t))throw new Error(`Key ${t} not found in enum`);delete n[t]}return new Na({...t,checks:[],...It(i),entries:n})}});function Ra(e,t){const o=Array.isArray(e)?Object.fromEntries(e.map(e=>[e,e])):e;return new Na({type:"enum",entries:o,...It(t)})}const La=ct("ZodLiteral",(e,t)=>{Ui.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o)=>{const i=e._zod.def,n=[];for(const e of i.values)if(void 0===e){if("throw"===t.unrepresentable)throw new Error("Literal `undefined` cannot be represented in JSON Schema")}else if("bigint"==typeof e){if("throw"===t.unrepresentable)throw new Error("BigInt literals cannot be represented in JSON Schema");n.push(Number(e))}else n.push(e);if(0===n.length);else if(1===n.length){const e=n[0];o.type=null===e?"null":typeof e,"draft-04"===t.target||"openapi-3.0"===t.target?o.enum=[e]:o.const=e}else n.every(e=>"number"==typeof e)&&(o.type="number"),n.every(e=>"string"==typeof e)&&(o.type="string"),n.every(e=>"boolean"==typeof e)&&(o.type="boolean"),n.every(e=>null===e)&&(o.type="null"),o.enum=n})(e,t,o),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function Za(e,t){return new La({type:"literal",values:Array.isArray(e)?e:[e],...It(t)})}const Fa=ct("ZodTransform",(e,t)=>{Vi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(e,t,o)=>((e,t)=>{if("throw"===t.unrepresentable)throw new Error("Transforms cannot be represented in JSON Schema")})(0,e),e._zod.parse=(o,i)=>{if("backward"===i.direction)throw new dt(e.constructor.name);o.addIssue=i=>{if("string"==typeof i)o.issues.push(Zt(i,o.value,t));else{const t=i;t.fatal&&(t.continue=!1),t.code??(t.code="custom"),t.input??(t.input=o.value),t.inst??(t.inst=e),o.issues.push(Zt(t))}};const n=t.transform(o.value,o);return n instanceof Promise?n.then(e=>(o.value=e,o.fallback=!0,o)):(o.value=n,o.fallback=!0,o)}});const Ua=ct("ZodOptional",(e,t)=>{Gi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>Tn(e,t,0,i),e.unwrap=()=>e._zod.def.innerType});function Va(e){return new Ua({type:"optional",innerType:e})}const Ba=ct("ZodExactOptional",(e,t)=>{Hi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>Tn(e,t,0,i),e.unwrap=()=>e._zod.def.innerType});const Ga=ct("ZodNullable",(e,t)=>{Ji.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def,a=wn(n.innerType,t,i),r=t.seen.get(e);"openapi-3.0"===t.target?(r.ref=n.innerType,o.nullable=!0):o.anyOf=[a,{type:"null"}]})(e,t,o,i),e.unwrap=()=>e._zod.def.innerType});function Ha(e){return new Ga({type:"nullable",innerType:e})}const Ja=ct("ZodDefault",(e,t)=>{Wi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def;wn(n.innerType,t,i),t.seen.get(e).ref=n.innerType,o.default=JSON.parse(JSON.stringify(n.defaultValue))})(e,t,o,i),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});const Wa=ct("ZodPrefault",(e,t)=>{Yi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def;wn(n.innerType,t,i),t.seen.get(e).ref=n.innerType,"input"===t.io&&(o._prefault=JSON.parse(JSON.stringify(n.defaultValue)))})(e,t,o,i),e.unwrap=()=>e._zod.def.innerType});const qa=ct("ZodNonOptional",(e,t)=>{Ki.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def;wn(n.innerType,t,i),t.seen.get(e).ref=n.innerType})(e,t,0,i),e.unwrap=()=>e._zod.def.innerType});const Ya=ct("ZodCatch",(e,t)=>{Qi.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def;let a;wn(n.innerType,t,i),t.seen.get(e).ref=n.innerType;try{a=n.catchValue(void 0)}catch{throw new Error("Dynamic catch values are not supported in JSON Schema")}o.default=a})(e,t,o,i),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});const Ka=ct("ZodPipe",(e,t)=>{en.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def,a=n.in._zod.traits.has("$ZodTransform"),r="input"===t.io?a?n.out:n.in:n.out;wn(r,t,i),t.seen.get(e).ref=r})(e,t,0,i),e.in=t.in,e.out=t.out});function Xa(e,t){return new Ka({type:"pipe",in:e,out:t})}const Qa=ct("ZodReadonly",(e,t)=>{on.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(t,o,i)=>((e,t,o,i)=>{const n=e._zod.def;wn(n.innerType,t,i),t.seen.get(e).ref=n.innerType,o.readOnly=!0})(e,t,o,i),e.unwrap=()=>e._zod.def.innerType});const er=ct("ZodCustom",(e,t)=>{an.init(e,t),Qn.init(e,t),e._zod.processJSONSchema=(e,t,o)=>((e,t)=>{if("throw"===t.unrepresentable)throw new Error("Custom types cannot be represented in JSON Schema")})(0,e)});const tr=Ra(["card","service","timer","startup"]).optional(),or=Da([function(e,t){return new e({type:"string",...It(t)})}(ta,ir),function(e){return function(e,t){return new e({type:"number",checks:[],...It(t)})}(wa,e)}(),function(e){return function(e,t){return new e({type:"boolean",...It(t)})}(ka,e)}()]);var ir;const nr=Ra(["duration","resume_datetime","resume_time","end_of_day","next_morning","next_sunrise","next_sunset","scheduled_window"]),ar=Ra(["invalid_duration","resume_time_past","disable_after_resume","confirmation_required","save_failed","notification_lead_too_long","automation_state_failed","unknown"]),rr=function(e,t,o){return new Ma({type:"union",options:t,discriminator:e,...It(o)})}("event",[Ia({event:Za("integration_active"),source:tr,properties:Ia({}).strict().optional()}).strict(),Ia({event:Za("card_viewed"),source:tr,card_type:Ra(["full","snoozed_only"]),properties:Ia({}).strict().optional()}).strict(),Ia({event:Za("selection_feature_used"),source:tr,properties:Ia({method:Za("all")}).strict()}).strict(),Ia({event:Za("duration_option_selected"),source:tr,properties:Ia({method:Za("preset")}).strict()}).strict(),Ia({event:Za("snooze_created"),source:tr,properties:Ia({strategy:nr,input_method:or,duration_minutes:or,target_count:or,notification_trigger:or,notification_lead_minutes:or,confirmation_used:or}).strict()}).strict(),Ia({event:Za("scheduled_snooze_created"),source:tr,properties:Ia({minutes_until_start:or,planned_duration_minutes:or,target_count:or,resume_local_hour:or}).strict()}).strict(),Ia({event:Za("scheduled_snooze_started"),source:tr,properties:Ia({target_count:or,planned_duration_minutes:or}).strict()}).strict(),Ia({event:Za("snooze_adjusted"),source:tr,properties:Ia({delta_minutes:or,direction:or}).strict()}).strict(),Ia({event:Za("snooze_ended"),source:tr,properties:Ia({reason:Za("expired")}).strict()}).strict(),Ia({event:Za("scheduled_snooze_cancelled"),source:tr,properties:Ia({target_count:or,minutes_before_start:or}).strict()}).strict(),Ia({event:Za("notification_used"),source:tr,properties:Ia({trigger:Za("start")}).strict()}).strict(),Ia({event:Za("notification_cleared"),source:tr,properties:Ia({target_count:or}).strict()}).strict(),Ia({event:Za("operation_failed"),source:tr,properties:Ia({operation:or,error_code:ar,strategy:or,target_count:or}).strict()}).strict(),Ia({event:Za("confirmation_result"),source:tr,properties:Ia({result:Za("confirmed")}).strict()}).strict()]);function sr(e,t){const o=rr.safeParse(t);if(!o.success)return;const i=o.data;try{const t=e.callService("autosnooze","report_telemetry",{event:i.event,properties:"properties"in i?i.properties:void 0,source:i.source??"card",card_type:"card_type"in i?i.card_type:void 0});Promise.resolve(t).catch(()=>{})}catch{}}function lr(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function cr(e){return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}function ur(e){return{adjustModalOpen:!0,adjustModalEntityId:e.entityId??"",adjustModalFriendlyName:e.friendlyName??"",adjustModalResumeAt:e.resumeAt,adjustModalEntityIds:e.entityIds??[],adjustModalFriendlyNames:e.friendlyNames??[]}}function dr(e){return Le(e)}function hr(e){Ze(e)}function pr(){return function(){try{const e=localStorage.getItem(Fe);if(!e)return null;const t=JSON.parse(e);return"number"!=typeof t.minutes||"number"!=typeof t.duration?.days||"number"!=typeof t.duration?.hours||"number"!=typeof t.duration?.minutes||"number"!=typeof t.timestamp?null:Date.now()-t.timestamp>6048e5?(localStorage.removeItem(Fe),null):t}catch{return null}}()}function mr(){return Ve().map(e=>e.id)}function fr(e){return st(e)}function gr(e){return Boolean(at(e))}function _r(e){return at(e)}function br(e,t){sr(e,{event:"card_viewed",card_type:t,source:"card"})}function vr(e,t){const o=new Date(e),i=new Date,n={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return o.getFullYear()>i.getFullYear()&&(n.year="numeric"),o.toLocaleString(t,n)}function yr(e,t="Resuming..."){const o=new Date(e).getTime()-Date.now();if(o<=0)return t;const i=Math.floor(o/ze),n=Math.floor(o%ze/we),a=Math.floor(o%we/xe),r=Math.floor(o%xe/ye);return i>0?`${i}d ${n}h ${a}m`:n>0?`${n}h ${a}m ${r}s`:`${a}m ${r}s`}function xr(e,t,o){const i=[];return e>0&&i.push(`${e} day${1!==e?"s":""}`),t>0&&i.push(`${t} hour${1!==t?"s":""}`),o>0&&i.push(`${o} minute${1!==o?"s":""}`),i.join(", ")}function wr(e,t,o){const i=[];return e>0&&i.push(`${e}d`),t>0&&i.push(`${t}h`),o>0&&i.push(`${o}m`),i.join(" ")||"0m"}function zr(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let o=0,i=!1;const n=t.match(/(\d+(?:\.\d+)?)\s*d/),a=t.match(/(\d+(?:\.\d+)?)\s*h/),r=t.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(n?.[1]){const e=parseFloat(n[1]);if(isNaN(e)||e<0)return null;o+=e*ke,i=!0}if(a?.[1]){const e=parseFloat(a[1]);if(isNaN(e)||e<0)return null;o+=e*$e,i=!0}if(r?.[1]){const e=parseFloat(r[1]);if(isNaN(e)||e<0)return null;o+=e,i=!0}if(!i){if(!/^\d+(?:\.\d+)?$/.test(t))return null;const e=parseFloat(t);if(isNaN(e)||!(e>0))return null;o=e}if(o=Math.round(o),o<=0)return null;const s=Math.floor(o/ke),l=o%ke;return{days:s,hours:Math.floor(l/$e),minutes:l%$e}}function $r(e){return null!==zr(e)}function kr(e){return e.days*ke+e.hours*$e+e.minutes}function Ar(e){const t=Math.floor(e/ke),o=e%ke;return{days:t,hours:Math.floor(o/$e),minutes:o%$e}}function Sr(e="light"){!function(e,t,o){const i=new CustomEvent(`hass-${t}`,{bubbles:!0,composed:!0,detail:o});e.dispatchEvent(i)}(window,"haptic",e)}const Tr=Symbol.for("autosnooze.customElements.define.patched"),Er=Symbol.for("autosnooze.customElements.registeredCtors");function Cr(){return navigator.userAgent.toLowerCase().includes("jsdom")}function jr(){if(!Cr())return;const e=customElements;if(e[Tr])return;const t=e.define.bind(e);e.define=(o,i,n)=>{const a=function(){const e=customElements;return e[Er]??=new WeakSet,e[Er]}();if(a.has(i)&&!e.get(o)){const e=class extends i{};return t(o,e,n),void a.add(e)}try{t(o,i,n),a.add(i)}catch(e){if(!function(e){return e instanceof Error&&e.message.includes("constructor has already been registered")}(e))throw e;const r=class extends i{};t(o,r,n),a.add(r)}},e[Tr]=!0}function Ir(e,t){Cr()&&jr(),customElements.get(e)||customElements.define(e,t)}async function Pr(e,t){try{await e.callService("autosnooze","cancel",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to wake automation:",e),e}}async function Dr(e,t){try{await e.callService("autosnooze","cancel_scheduled",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to cancel scheduled snooze:",e),e}}function Mr(e,t){if(!e||!t)return null;const o=new Date(`${e}T${t}`);if(Number.isNaN(o.getTime()))return null;const i=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,n=`${String(o.getHours()).padStart(2,"0")}:${String(o.getMinutes()).padStart(2,"0")}`;if(i!==e||n!==t)return null;const a=o.getTimezoneOffset(),r=a<=0?"+":"-",s=Math.abs(a);return`${e}T${t}${`${r}${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}`}function Or(e,t){const o=new Date(e.getFullYear(),e.getMonth(),e.getDate()+1,t,0);return{date:`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,time:`${String(t).padStart(2,"0")}:00`}}function Nr(e,t,o){return t&&"none"!==t?"about_to_end"===t?void 0===o?{...e,notification_trigger:t}:{...e,notification_trigger:t,notification_lead_minutes:o}:{...e,notification_trigger:t}:e}const Rr="autosnooze_confirm",Lr=["alarm","security","siren","lock","smoke","carbon monoxide","co2","leak","flood","fire","gas"];function Zr(e){if(!e)return null;const t=new Date(e).getTime();return Number.isFinite(t)?t:null}function Fr(e,t){return _e(e.hass,"Resume time is required"===t?e.resumeAtDate||e.resumeAtTime?"toast.error.invalid_datetime":"toast.error.resume_time_required":"Resume time must be in the future"===t?"toast.error.resume_time_past":"toast.error.snooze_before_resume")}function Ur(e,t){return t.some(t=>{const o=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?<![a-z0-9])${o}(?![a-z0-9])`,"i").test(e)})}function Vr(e){const t=at(e)?.attributes?.critical_terms;return Array.isArray(t)&&t.length>0&&t.every(e=>"string"==typeof e)?t:Lr}function Br(e){const t=new Set(e.selected),o=e.criticalTerms??Lr;return e.automations.some(i=>{return!!t.has(i.id)&&(n=i.labels,a=e.labelRegistry,n.some(e=>e===Rr||a[e]?.name===Rr)||Ur(i.id,o)||Ur(i.name,o));var n,a})}async function Gr(e){const t=function(e){if(e.untilTomorrow&&!e.scheduleMode){const t=Or(new Date,8);return{...e,scheduleMode:!0,resumeAtDate:t.date,resumeAtTime:t.time,disableAtDate:"",disableAtTime:""}}return e}(e);if(t.scheduleMode){const e=function(e){const t=Zr(Mr(e.resumeAtDate,e.resumeAtTime));if(null===t)return{status:"error",message:"Resume time is required"};if(t<=e.nowMs)return{status:"error",message:"Resume time must be in the future"};const o=e.disableAtDate&&e.disableAtTime?Mr(e.disableAtDate,e.disableAtTime):null,i=Zr(o);return e.disableAtDate&&e.disableAtTime&&null===o||null!==i&&i>=t?{status:"error",message:"Snooze time must be before resume time"}:{status:"valid"}}({...t,nowMs:t.nowMs??0});if("error"===e.status)return{status:"validation_error",toastMessage:Fr(t,e.message)}}if(!t.forceConfirm&&t.automations&&Br({selected:t.selected,automations:t.automations,labelRegistry:t.labelRegistry??{},criticalTerms:Vr(t.hass)}))return{status:"confirm_required"};const o=t.scheduleMode?function(e){const t=e.disableAtDate&&e.disableAtTime?Mr(e.disableAtDate,e.disableAtTime):null,o=Mr(e.resumeAtDate,e.resumeAtTime);if(!o)return null;const i=Nr({entity_id:e.selected,resume_at:o,...t&&{disable_at:t},...e.forceConfirm&&{confirm:!0}},e.notificationTrigger,e.notificationLeadMinutes),n=e.selected.length;return{request:i,toastMessage:t?1===n?_e(e.hass,"toast.success.scheduled_one"):_e(e.hass,"toast.success.scheduled_many",{count:n}):1===n?_e(e.hass,"toast.success.snoozed_until_one",{time:vr(o,e.hass.locale?.language)}):_e(e.hass,"toast.success.snoozed_until_many",{count:n,time:vr(o,e.hass.locale?.language)})}}(t):function(e){const{days:t,hours:o,minutes:i}=e.customDuration,n={minutes:kr(e.customDuration),duration:e.customDuration,timestamp:Date.now()};return{request:Nr({entity_id:e.selected,days:t,hours:o,minutes:i,...e.forceConfirm&&{confirm:!0}},e.notificationTrigger,e.notificationLeadMinutes),toastMessage:1===e.selected.length?_e(e.hass,"toast.success.snoozed_for_one",{duration:xr(t,o,i)}):_e(e.hass,"toast.success.snoozed_for_many",{count:e.selected.length,duration:xr(t,o,i)}),lastDuration:n}}(t);if(!o)return{status:"aborted"};try{await async function(e,t){try{await e.callService("autosnooze","pause",t)}catch(e){throw console.error("[AutoSnooze] Failed to pause automations:",e),e}}(t.hass,o.request)}catch(e){if("confirm_required"===function(e){const t=e;return t?.translation_key??t?.data?.translation_key}(e))return{status:"confirm_required"};throw e}return function(e){try{const t=Date.now(),o=Ve(),i=e.map(e=>({id:e,timestamp:t})),n=new Set(e),a=[...i,...o.filter(e=>!n.has(e.id))].slice(0,10);localStorage.setItem(Ue,JSON.stringify(a))}catch{}}(t.selected),function(e){return"lastDuration"in e}(o)?(function(e,t){try{const o={minutes:t,duration:e,timestamp:Date.now()};localStorage.setItem(Fe,JSON.stringify(o))}catch{}}(o.lastDuration.duration,o.lastDuration.minutes),{status:"submitted",toastMessage:o.toastMessage,lastDuration:o.lastDuration}):{status:"submitted",toastMessage:o.toastMessage}}async function Hr(e){await async function(e){try{await e.callService("autosnooze","cancel_all",{})}catch(e){throw console.error("[AutoSnooze] Failed to wake all automations:",e),e}}(e)}async function Jr(e,t){await async function(e,t){try{await e.callService("autosnooze","clear_notification",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to clear snooze notification:",e),e}}(e,t)}async function Wr(e,t,o){const{entityId:i,entityIds:n,...a}=t,r=n||i||"";await async function(e,t,o){try{await e.callService("autosnooze","adjust",{entity_id:t,...o})}catch(e){throw console.error("[AutoSnooze] Failed to adjust snooze:",e),e}}(e,r,a);const s=24*(a.days||0)*60*60*1e3+60*(a.hours||0)*60*1e3+60*(a.minutes||0)*1e3;return{nextResumeAt:new Date(new Date(o).getTime()+s).toISOString()}}function qr(e){return e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}const Yr={loadLabels:async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/label_registry/list"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.label_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch label registry:",e),null}},loadCategories:async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.category_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch category registry:",e),{}}},loadEntities:async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/entity_registry/list"}),o={};return Array.isArray(t)&&t.filter(e=>e.entity_id.startsWith("automation.")).forEach(e=>{o[e.entity_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch entity registry:",e),{}}},getAutomations:function(e,t){return e.states?Object.keys(e.states).filter(e=>e.startsWith("automation.")).map(o=>{const i=e.states[o];if(!i)return null;const n=t[o],a=e.entities?.[o];return{id:o,name:i.attributes?.friendly_name??o.replace("automation.",""),area_id:n?.area_id??a?.area_id??null,category_id:n?.categories?.automation??null,labels:n?.labels??a?.labels??[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name)):[]},setTimeout:setTimeout,clearTimeout:clearTimeout};class Kr{constructor(e,t={}){this.changed=e,this.labels={},this.labelsUnavailable=!1,this.categories={},this.entities={},this.cacheVersion=0,this.connected=!1,this.labelsLoaded=!1,this.categoriesLoaded=!1,this.entitiesLoaded=!1,this.retryDelay=Ie,this.cachedVersion=-1,this.deps={...Yr,...t}}get snapshot(){return{labels:this.labels,labelsUnavailable:this.labelsUnavailable,categories:this.categories,entities:this.entities,cacheVersion:this.cacheVersion}}connect(e){return this.connected=!0,this.hass=e,e.connection?Promise.all([this.loadLabels(),this.loadCategories(),this.loadEntities()]).then(()=>{}):Promise.resolve()}disconnect(){this.connected=!1,void 0!==this.retryTimer&&this.deps.clearTimeout(this.retryTimer),this.retryTimer=void 0}getAutomations(e){return this.cachedStates===e.states&&this.cachedVersion===this.cacheVersion&&this.automations||(this.automations=this.deps.getAutomations(e,this.entities),this.cachedStates=e.states,this.cachedVersion=this.cacheVersion),this.automations}shouldUpdate(e,t){if(!e||!t)return!0;if(at(e)!==at(t)||e.entities!==t.entities||e.areas!==t.areas||(e.language??e.locale?.language)!==(t.language??t.locale?.language))return!0;if(!e.states||!t.states)return!0;if(e.states===t.states)return!1;const o=Object.entries(e.states).filter(([e])=>e.startsWith("automation.")),i=Object.keys(t.states).filter(e=>e.startsWith("automation.")).length;return o.length!==i||o.some(([e,o])=>t.states[e]!==o)}loadLabels(e){return e&&(this.hass=e),this.labelsLoaded||void 0!==this.retryTimer?Promise.resolve():this.labelsPromise??=this.deps.loadLabels(this.hass).then(e=>{if(null===e)return this.labelsUnavailable=!0,void 0===this.retryTimer&&(this.retryTimer=this.deps.setTimeout(()=>{this.finishRetry(),this.loadLabels()},this.retryDelay),this.retryDelay=Math.min(2*this.retryDelay,Pe)),void this.changed();this.labels=e,this.labelsLoaded=!0,this.labelsUnavailable=!1,this.retryDelay=Ie,this.finishRetry(),this.invalidate()}).finally(()=>{this.labelsPromise=void 0})}loadCategories(e){return e&&(this.hass=e),this.categoriesLoaded?Promise.resolve():this.categoriesPromise??=this.deps.loadCategories(this.hass).then(e=>{this.categories=e,this.categoriesLoaded=!0,this.changed()}).finally(()=>{this.categoriesPromise=void 0})}loadEntities(e){return e&&(this.hass=e),this.entitiesLoaded?Promise.resolve():this.entitiesPromise??=this.deps.loadEntities(this.hass).then(e=>{this.entities=e,this.entitiesLoaded=!0,this.invalidate()}).finally(()=>{this.entitiesPromise=void 0})}finishRetry(){void 0!==this.retryTimer&&this.deps.clearTimeout(this.retryTimer),this.retryTimer=void 0}invalidate(){this.cacheVersion++,this.connected&&this.changed()}}class Xr extends HTMLElement{show(e,t,o=t,i){this.clear();const n=document.createElement("div");if(n.className="toast",n.setAttribute("role","alert"),n.setAttribute("aria-live","polite"),n.setAttribute("aria-atomic","true"),i){const a=document.createElement("span");a.textContent=e,n.appendChild(a);const r=document.createElement("button");r.className="toast-undo-btn",r.textContent=t,r.setAttribute("aria-label",o),r.onclick=e=>{e.stopPropagation(),i(),this.clear()},n.appendChild(r)}else n.textContent=e;this.appendChild(n),this.durationTimer=setTimeout(()=>{n.style.animation=`slideUp ${Se}ms ease-out reverse`,this.fadeTimer=setTimeout(()=>this.clear(),Se),this.durationTimer=void 0},Ee)}disconnectedCallback(){this.clear()}clear(){void 0!==this.durationTimer&&clearTimeout(this.durationTimer),void 0!==this.fadeTimer&&clearTimeout(this.fadeTimer),this.durationTimer=this.fadeTimer=void 0,this.replaceChildren()}}Ir("autosnooze-toast",Xr);class Qr extends se{constructor(){super(...arguments),this.scheduled={}}createRenderRoot(){return this}render(){const e=Object.entries(this.scheduled);return e.length?V`
      <div class="scheduled-list" role="region" aria-label="${_e(this.hass,"a11y.scheduled_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${_e(this.hass,"section.scheduled_count",{count:e.length})}
        </div>
        ${e.map(([e,t])=>{const o=t.friendly_name||e;return V`
            <div class="scheduled-item" role="article" aria-label="${_e(this.hass,"a11y.scheduled_pause_for",{name:o})}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">${o}</div>
                <div class="scheduled-time">${_e(this.hass,"status.disables")} ${this.format(t.disable_at||"now")}</div>
                <div class="paused-time">${_e(this.hass,"status.resumes_at")} ${this.format(t.resume_at)}</div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${()=>this.cancel(e)}
                aria-label="${_e(this.hass,"a11y.cancel_scheduled_for",{name:o})}">
                ${_e(this.hass,"button.cancel")}
              </button>
            </div>
          `})}
      </div>
    `:V``}format(e){return vr(e,this.hass?.locale?.language)}cancel(e){this.dispatchEvent(new CustomEvent("cancel-scheduled",{detail:{entityId:e},bubbles:!0,composed:!0}))}}e([de({attribute:!1})],Qr.prototype,"hass",void 0),e([de({attribute:!1})],Qr.prototype,"scheduled",void 0),Ir("autosnooze-scheduled-pauses",Qr);class es extends se{constructor(){super(...arguments),this.config={},this._shell=new Kr(()=>this.requestUpdate()),this._selected=[],this._duration=30*xe,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._scheduleMode=!1,this._notificationsEnabled=!1,this._notificationTrigger="end",this._notificationLeadMinutes=60,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._showCustomInput=!1,this._untilTomorrow=!1,this._lastDuration=null,this._recentSnoozeIds=[],this._adjustModalOpen=!1,this._adjustModalEntityId="",this._adjustModalFriendlyName="",this._adjustModalResumeAt="",this._adjustModalEntityIds=[],this._adjustModalFriendlyNames=[],this._guardrailConfirmOpen=!1,this._pausedEntityIdsCache=[]}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-card",title:"AutoSnooze"}}setConfig(e){this.config=e}getCardSize(){const e=this._getPausedSnapshot(),t=e.paused,o=e.scheduled;return 4+Object.keys(t).length+Object.keys(o).length}shouldUpdate(e){return!e.has("hass")||this._shell.shouldUpdate(e.get("hass"),this.hass)}willUpdate(e){super.willUpdate(e),e.has("hass")&&(this._syncAdjustModalWithPausedState(),this._syncPausedEntityIdsCache())}updated(e){super.updated(e),e.has("hass")&&this.hass&&this._shell.connect(this.hass)}_syncPausedEntityIdsCache(){const e=Object.keys(this._getPausedSnapshot().paused),t=this._pausedEntityIdsCache;t.length===e.length&&e.every(e=>t.includes(e))||(this._pausedEntityIdsCache=e)}_syncAdjustModalWithPausedState(){const e=function(e,t){if(!t.open)return{action:"none"};if(t.entityIds.length>0){if(!t.entityIds.some(t=>e[t]))return{action:"close"};const o=t.entityIds.find(t=>e[t]);if(o){const i=e[o];if(i?.resume_at&&i.resume_at!==t.resumeAt)return{action:"update",resumeAt:i.resume_at}}return{action:"none"}}if(t.entityId){const o=e[t.entityId];if(o?.resume_at&&o.resume_at!==t.resumeAt)return{action:"update",resumeAt:o.resume_at};if(!o)return{action:"close"}}return{action:"none"}}(this._getPaused(),{open:this._adjustModalOpen,entityId:this._adjustModalEntityId,entityIds:this._adjustModalEntityIds,resumeAt:this._adjustModalResumeAt});"close"===e.action?this._handleCloseModalEvent():"update"===e.action&&(this._adjustModalResumeAt=e.resumeAt)}connectedCallback(){super.connectedCallback(),this.hass&&(br(this.hass,"full"),this._shell.connect(this.hass)),this._lastDuration=pr(),this._refreshRecentSnoozeIds()}disconnectedCallback(){super.disconnectedCallback(),this._shell.disconnect()}_refreshRecentSnoozeIds(){this._recentSnoozeIds=mr()}_getAutomations(){return this.hass?this._shell.getAutomations(this.hass):[]}_getPaused(){return this._getPausedSnapshot().paused}_getPausedGroupedByResumeTime(){return this._getPausedSnapshot().groups}_getScheduled(){return this._getPausedSnapshot().scheduled}_getPausedSnapshot(){return this.hass?fr(this.hass):{paused:{},scheduled:{},groups:[]}}_isSnoozeSensorAvailable(){return gr(this.hass)}_formatDateTime(e){return vr(e,this._getLocale())}_getLocale(){return this.hass?.locale?.language}_hasResumeAt(){return Boolean(this._resumeAtDate&&this._resumeAtTime)}_hasDisableAt(){return Boolean(this._disableAtDate&&this._disableAtTime)}_hapticFeedback(e="light"){Sr(e)}_showToast(e,t={}){this.shadowRoot?.querySelector("autosnooze-toast")?.show(e,_e(this.hass,"button.undo"),_e(this.hass,"a11y.undo_action"),t.showUndo?t.onUndo??void 0:void 0)}async _snooze(e=!1){if(0!==this._selected.length&&!this._loading&&(this._scheduleMode||this._untilTomorrow||0!==this._duration)){this._loading=!0,this._guardrailConfirmOpen=!1;try{if(!this.hass)return void(this._loading=!1);const t=this._selected.length,o=[...this._selected],i=this._scheduleMode||this._untilTomorrow&&!this._scheduleMode,n=!(this._untilTomorrow&&!this._scheduleMode)&&this._hasDisableAt(),a=await Gr({hass:this.hass,selected:this._selected,scheduleMode:this._scheduleMode,customDuration:this._customDuration,disableAtDate:this._disableAtDate,disableAtTime:this._disableAtTime,resumeAtDate:this._resumeAtDate,resumeAtTime:this._resumeAtTime,untilTomorrow:this._untilTomorrow,forceConfirm:e,automations:this._getAutomations(),labelRegistry:this._shell.labels,nowMs:Date.now()+je,...this._notificationsEnabled&&{notificationTrigger:this._notificationTrigger,..."about_to_end"===this._notificationTrigger&&{notificationLeadMinutes:this._notificationLeadMinutes}}});if("confirm_required"===a.status)return this._guardrailConfirmOpen=!0,void(this._loading=!1);if("validation_error"===a.status)return this._showToast(a.toastMessage),void(this._loading=!1);if("aborted"===a.status)return void(this._loading=!1);if(a.lastDuration&&(this._lastDuration=a.lastDuration),this._refreshRecentSnoozeIds(),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);this._hapticFeedback("success"),this._showToast(a.toastMessage,{showUndo:!0,onUndo:async()=>{try{if(!this.hass)return;const e=await async function(e,t,o){const i=o.wasScheduleMode&&o.hadDisableAt?t=>Dr(e,t):t=>Pr(e,t),n=await Promise.allSettled(t.map(e=>i(e))),a=[],r=[];return n.forEach((e,o)=>{const i=t[o];i&&("fulfilled"===e.status?a.push(i):r.push(i))}),{succeeded:a,failed:r}}(this.hass,o,{wasScheduleMode:i,hadDisableAt:n});if(this.isConnected)if(0===e.failed.length){this._setSelected(o);const e=1===t?_e(this.hass,"toast.success.restored_one"):_e(this.hass,"toast.success.restored_many",{count:t});this._showToast(e)}else this._setSelected(e.failed),this._showToast(_e(this.hass,"toast.error.undo_failed"))}catch(e){console.error("Undo failed:",e),this.isConnected&&this.shadowRoot&&this._showToast(_e(this.hass,"toast.error.undo_failed"))}}}),this._setSelected([]),this._notificationsEnabled=!1,this._notificationTrigger="end",this._notificationLeadMinutes=60,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._untilTomorrow=!1}catch(e){console.error("Snooze failed:",e),this._hapticFeedback("failure")}this._loading=!1}}async _wake(e){if(this.hass)try{await async function(e,t){await Pr(e,t)}(this.hass,e),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(_e(this.hass,"toast.success.resumed"))}catch(e){console.error("Wake failed:",e),this._hapticFeedback("failure")}}async _handleWakeEvent(e){await this._wake(e.detail.entityId)}async _handleWakeAllEvent(){if(this.hass)try{await Hr(this.hass),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(_e(this.hass,"toast.success.resumed_all"))}catch(e){console.error("Wake all failed:",e),this._hapticFeedback("failure")}}async _handleClearNotificationEvent(e){if(this.hass)try{await Jr(this.hass,e.detail.entityId),this._hapticFeedback("success")}catch(e){console.error("Clear notification failed:",e),this._hapticFeedback("failure")}}_handleAdjustAutomationEvent(e){const t=ur({entityId:e.detail.entityId,friendlyName:e.detail.friendlyName,resumeAt:e.detail.resumeAt});this._adjustModalOpen=t.adjustModalOpen,this._adjustModalEntityId=t.adjustModalEntityId,this._adjustModalFriendlyName=t.adjustModalFriendlyName,this._adjustModalResumeAt=t.adjustModalResumeAt,this._adjustModalEntityIds=t.adjustModalEntityIds,this._adjustModalFriendlyNames=t.adjustModalFriendlyNames}_handleAdjustGroupEvent(e){const t=ur({entityIds:e.detail.entityIds,friendlyNames:e.detail.friendlyNames,resumeAt:e.detail.resumeAt});this._adjustModalOpen=t.adjustModalOpen,this._adjustModalEntityIds=t.adjustModalEntityIds,this._adjustModalFriendlyNames=t.adjustModalFriendlyNames,this._adjustModalEntityId=t.adjustModalEntityId,this._adjustModalFriendlyName=t.adjustModalFriendlyName,this._adjustModalResumeAt=t.adjustModalResumeAt}async _handleAdjustTimeEvent(e){if(this.hass)try{const t=await Wr(this.hass,e.detail,this._adjustModalResumeAt);this._hapticFeedback("success"),this._adjustModalResumeAt=t.nextResumeAt,this.isConnected&&this.shadowRoot&&this._showToast(_e(this.hass,"toast.success.adjusted"))}catch(e){console.error("Adjust failed:",e),this._hapticFeedback("failure")}}_handleCloseModalEvent(){const e={adjustModalOpen:!1,adjustModalEntityId:"",adjustModalFriendlyName:"",adjustModalResumeAt:"",adjustModalEntityIds:[],adjustModalFriendlyNames:[]};this._adjustModalOpen=e.adjustModalOpen,this._adjustModalEntityId=e.adjustModalEntityId,this._adjustModalFriendlyName=e.adjustModalFriendlyName,this._adjustModalResumeAt=e.adjustModalResumeAt,this._adjustModalEntityIds=e.adjustModalEntityIds,this._adjustModalFriendlyNames=e.adjustModalFriendlyNames}async _cancelScheduled(e){if(this.hass)try{await async function(e,t){await Dr(e,t)}(this.hass,e),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(_e(this.hass,"toast.success.cancelled"))}catch(e){console.error("Cancel scheduled failed:",e),this._hapticFeedback("failure")}}_setSelected(e){this._selected=[...e]}_setDurationState(e,t){this._customDuration={...e},this._customDurationInput=t,this._duration=kr(e)*xe}_handleDurationChange(e){const{duration:t,input:o,showCustomInput:i}=e.detail;this._untilTomorrow=!1,this._setDurationState(t,o),void 0!==i&&(this._showCustomInput=i)}_handleScheduleModeChange(e){e.detail.enabled&&(this._untilTomorrow=!1);const t=function(e){if(!e.enabled)return{scheduleMode:!1,disableAtDate:"",disableAtTime:"",resumeAtDate:"",resumeAtTime:""};const t=new Date(e.now.getTime()+60*e.resumeMinutes*1e3);return{scheduleMode:!0,disableAtDate:lr(e.now),disableAtTime:cr(e.now),resumeAtDate:lr(t),resumeAtTime:cr(t)}}({enabled:e.detail.enabled,now:new Date,resumeMinutes:this._lastDuration?.minutes??30});this._scheduleMode=t.scheduleMode,e.detail.enabled&&(this._disableAtDate=t.disableAtDate,this._disableAtTime=t.disableAtTime,this._resumeAtDate=t.resumeAtDate,this._resumeAtTime=t.resumeAtTime)}_handleScheduleFieldChange(e){const{field:t,value:o}=e.detail;switch(t){case"disableAtDate":this._disableAtDate=o;break;case"disableAtTime":this._disableAtTime=o;break;case"resumeAtDate":this._resumeAtDate=o;break;case"resumeAtTime":this._resumeAtTime=o}}_handleCustomInputToggle(e){this._showCustomInput=e.detail.show,e.detail.show&&(this._untilTomorrow=!1)}_handleUntilTomorrowSelect(){this._untilTomorrow=!0,this._showCustomInput=!1}_handleNotificationsToggle(e){this._notificationsEnabled=e.target.checked}_handleNotificationWhenChange(e){this._notificationTrigger=e.target.value}_handleNotificationLeadChange(e){this._notificationLeadMinutes=Number(e.target.value)}_formatLeadLabel(e){const{days:t,hours:o,minutes:i}=Ar(e);return xr(t,o,i)}_handleSelectionChange(e){this._setSelected(e.detail.selected)}_handleGuardrailCancel(){this._guardrailConfirmOpen=!1}async _handleGuardrailContinue(){this._guardrailConfirmOpen=!1,this.hass&&sr(this.hass,{event:"confirmation_result",properties:{result:"confirmed"},source:"card"}),await this._snooze(!0)}render(){if(!this.hass||!this.config)return V``;const e=this._getPausedSnapshot(),t=e.paused,o=Object.keys(t).length,i=e.scheduled,n=Object.keys(i).length,a=this._getAutomations(),r=this._isSnoozeSensorAvailable();return V`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||_e(this.hass,"card.default_title")}
          ${o>0||n>0?V`<span class="status-summary"
                >${o>0?_e(this.hass,"status.active_count",{count:o}):""}${o>0&&n>0?", ":""}${n>0?_e(this.hass,"status.scheduled_count",{count:n}):""}</span
              >`:""}
        </div>

        ${r?"":V`
              <div class="sensor-health-banner" role="status">
                ${_e(this.hass,"status.sensor_unavailable")}
              </div>
            `}

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${a}
            .selected=${this._selected}
            .labelRegistry=${this._shell.labels}
            .labelRegistryUnavailable=${this._shell.labelsUnavailable}
            .categoryRegistry=${this._shell.categories}
            .recentSnoozeIds=${this._recentSnoozeIds}
            .pausedEntityIds=${this._pausedEntityIdsCache}
            @selection-change=${this._handleSelectionChange}
          ></autosnooze-automation-list>

          <autosnooze-duration-selector
            .hass=${this.hass}
            .scheduleMode=${this._scheduleMode}
            .customDuration=${this._customDuration}
            .customDurationInput=${this._customDurationInput}
            .showCustomInput=${this._showCustomInput}
            .untilTomorrow=${this._untilTomorrow}
            .lastDuration=${this._lastDuration}
            .disableAtDate=${this._disableAtDate}
            .disableAtTime=${this._disableAtTime}
            .resumeAtDate=${this._resumeAtDate}
            .resumeAtTime=${this._resumeAtTime}
            @duration-change=${this._handleDurationChange}
            @schedule-mode-change=${this._handleScheduleModeChange}
            @schedule-field-change=${this._handleScheduleFieldChange}
            @custom-input-toggle=${this._handleCustomInputToggle}
            @until-tomorrow-select=${this._handleUntilTomorrowSelect}
          ></autosnooze-duration-selector>

          <div class="notify-section">
            <label class="notify-toggle">
              <input
                type="checkbox"
                .checked=${this._notificationsEnabled}
                @change=${this._handleNotificationsToggle}
              />
              <ha-icon icon="mdi:bell-outline" aria-hidden="true"></ha-icon>
              <span class="notify-toggle-text">
                ${_e(this.hass,"notify.toggle_label")}
              </span>
            </label>

            ${this._notificationsEnabled?V`
              <div class="notify-detail">
                <label class="notify-field">
                  <span class="notify-field-label visually-hidden">${_e(this.hass,"notify.when_label")}</span>
                  <select
                    .value=${this._notificationTrigger}
                    @change=${this._handleNotificationWhenChange}
                  >
                    <option value="start">${_e(this.hass,"notify.when.start")}</option>
                    <option value="about_to_end">${_e(this.hass,"notify.when.about_to_end")}</option>
                    <option value="end">${_e(this.hass,"notify.when.end")}</option>
                  </select>
                </label>

                ${"about_to_end"===this._notificationTrigger?V`
                  <label class="notify-field">
                    <span class="notify-field-label visually-hidden">${_e(this.hass,"notify.lead_label")}</span>
                    <select
                      .value=${String(this._notificationLeadMinutes)}
                      @change=${this._handleNotificationLeadChange}
                    >
                      ${Me.map(e=>V`<option value=${String(e)}>${this._formatLeadLabel(e)}</option>`)}
                    </select>
                  </label>
                `:""}
              </div>
            `:""}
          </div>

          ${this._guardrailConfirmOpen?V`
            <div class="guardrail-confirm" role="alertdialog" aria-live="polite">
              <div class="guardrail-title">${_e(this.hass,"guardrail.confirm_title")}</div>
              <div class="guardrail-body">${_e(this.hass,"guardrail.confirm_body")}</div>
              <div class="guardrail-actions">
                <button type="button" class="guardrail-cancel-btn" @click=${()=>this._handleGuardrailCancel()}>
                  ${_e(this.hass,"button.cancel")}
                </button>
                <button type="button" class="guardrail-continue-btn" @click=${()=>this._handleGuardrailContinue()}>
                  ${_e(this.hass,"button.continue")}
                </button>
              </div>
            </div>
          `:""}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._untilTomorrow&&!$r(this._customDurationInput)||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${()=>this._snooze()}
            aria-label="${this._loading?_e(this.hass,"a11y.snoozing"):this._scheduleMode?_e(this.hass,"a11y.schedule_snooze",{count:this._selected.length}):_e(this.hass,"a11y.snooze_count",{count:this._selected.length})}"
            aria-busy=${this._loading}
          >
            ${this._loading?_e(this.hass,"button.snoozing"):this._scheduleMode?_e(this.hass,"button.schedule_count",{count:this._selected.length}):_e(this.hass,"button.snooze_count",{count:this._selected.length})}
          </button>
        </div>

        ${o>0?V`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${e.groups}
              .pausedCount=${o}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @clear-notification=${this._handleClearNotificationEvent}
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`:""}
        <autosnooze-scheduled-pauses
          .hass=${this.hass}
          .scheduled=${i}
          @cancel-scheduled=${e=>this._cancelScheduled(e.detail.entityId)}
        ></autosnooze-scheduled-pauses>
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
        <autosnooze-toast></autosnooze-toast>
      </ha-card>
    `}}es.styles=[ve,be],e([de({attribute:!1})],es.prototype,"hass",void 0),e([de({attribute:!1})],es.prototype,"config",void 0),e([he()],es.prototype,"_selected",void 0),e([he()],es.prototype,"_duration",void 0),e([he()],es.prototype,"_customDuration",void 0),e([he()],es.prototype,"_customDurationInput",void 0),e([he()],es.prototype,"_loading",void 0),e([he()],es.prototype,"_scheduleMode",void 0),e([he()],es.prototype,"_notificationsEnabled",void 0),e([he()],es.prototype,"_notificationTrigger",void 0),e([he()],es.prototype,"_notificationLeadMinutes",void 0),e([he()],es.prototype,"_disableAtDate",void 0),e([he()],es.prototype,"_disableAtTime",void 0),e([he()],es.prototype,"_resumeAtDate",void 0),e([he()],es.prototype,"_resumeAtTime",void 0),e([he()],es.prototype,"_showCustomInput",void 0),e([he()],es.prototype,"_untilTomorrow",void 0),e([he()],es.prototype,"_lastDuration",void 0),e([he()],es.prototype,"_recentSnoozeIds",void 0),e([he()],es.prototype,"_adjustModalOpen",void 0),e([he()],es.prototype,"_adjustModalEntityId",void 0),e([he()],es.prototype,"_adjustModalFriendlyName",void 0),e([he()],es.prototype,"_adjustModalResumeAt",void 0),e([he()],es.prototype,"_adjustModalEntityIds",void 0),e([he()],es.prototype,"_adjustModalFriendlyNames",void 0),e([he()],es.prototype,"_guardrailConfirmOpen",void 0),Ir("autosnooze-card",es);class ts extends se{constructor(){super(...arguments),this.config={}}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-snoozed-card",title:"Snoozed Automations"}}setConfig(e){this.config=e}connectedCallback(){super.connectedCallback(),this.hass&&br(this.hass,"snoozed_only")}getCardSize(){const e=this.hass?fr(this.hass):null;return 1+(e?Object.keys(e.paused).length:0)}shouldUpdate(e){const t=e.get("hass");if(!t||!this.hass)return!0;const o=_r(t)!==_r(this.hass),i=(t.language??t.locale?.language)!==(this.hass.language??this.hass.locale?.language);return o||i}render(){if(!this.hass||!this.config)return V``;const e=fr(this.hass),t=Object.keys(e.paused).length;return V`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:bell-sleep"></ha-icon>
          ${this.config?.title||_e(this.hass,"card.snoozed_title")}
          ${t>0?V`<span class="status-summary"
                >${_e(this.hass,"status.active_count",{count:t})}</span
              >`:""}
        </div>

        ${gr(this.hass)?"":V`
              <div class="sensor-health-banner" role="status">
                ${_e(this.hass,"status.sensor_unavailable")}
              </div>
            `}

        ${t>0?V`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${e.groups}
              .pausedCount=${t}
              .readonly=${!0}
            ></autosnooze-active-pauses>`:V`<div class="snoozed-empty" role="status">
              ${_e(this.hass,"status.no_snoozed")}
            </div>`}
      </ha-card>
    `}}ts.styles=[ve,be],e([de({attribute:!1})],ts.prototype,"hass",void 0),e([de({attribute:!1})],ts.prototype,"config",void 0),Ir("autosnooze-snoozed-card",ts);const os=r`
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
`;class is extends se{constructor(){super(...arguments),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const o={...this._config,[e]:t};""!==t&&null!=t||delete o[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}render(){return this._config?V`
      <div class="row">
        <label for="title-input">${_e(this.hass,"editor.title_label")}</label>
        <input
          id="title-input"
          type="text"
          .value=${this._config.title??""}
          @input=${e=>this._valueChanged("title",e.target.value)}
          placeholder="${_e(this.hass,"editor.title_placeholder")}"
        />
      </div>
    `:V``}}is.styles=os,e([de({attribute:!1})],is.prototype,"hass",void 0),e([he()],is.prototype,"_config",void 0),Ir("autosnooze-card-editor",is);const ns=r`
    :host {
      display: block;
    }
    .snooze-list {
      border: 2px solid var(--warning-color, #ff9800);
      border-radius: 8px;
      background: color-mix(in srgb, var(--warning-color, #ff9800) 5%, transparent);
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
    .pause-group-header:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
      color: var(--warning-color, #ff9800);
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
    /* Compact icon-only button so the automation name keeps its space. */
    .clear-notification-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      padding: 6px;
      min-width: 44px;
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color);
    }
    .clear-notification-btn ha-icon {
      display: block;
    }
    .clear-notification-btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      color: var(--primary-text-color);
      border-color: var(--divider-color);
    }
    .wake-all {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--warning-color, #ff9800);
      border-radius: 6px;
      background: transparent;
      color: var(--warning-color, #ff9800);
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 44px;
    }
    .wake-all:hover {
      background: var(--warning-color, #ff9800);
      color: white;
    }
    .wake-all:focus-visible {
      outline: 2px solid var(--warning-color, #ff9800);
      outline-offset: 2px;
    }
    .wake-all.pending {
      background: var(--warning-color, #ff9800);
      color: white;
    }
    @media (max-width: 480px) {
      .snooze-list {
        padding: 14px;
        margin-top: 24px;
        border-radius: 16px;
        border: 2px solid var(--warning-color, #ff9800);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--warning-color, #ff9800) 6%, transparent) 0%,
          color-mix(in srgb, var(--warning-color, #ff9800) 2%, transparent) 100%
        );
        box-shadow: 0 4px 16px color-mix(in srgb, var(--warning-color, #ff9800) 8%, transparent);
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
      .pause-group-header:active {
        background: color-mix(in srgb, var(--secondary-background-color) 80%, transparent);
      }
      .pause-group-header .countdown {
        font-size: 1em;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .paused-item {
        padding: 12px 14px;
        gap: 12px;
        background: var(--card-background-color);
      }
      .paused-item:active {
        background: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
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
      .wake-btn {
        padding: 8px 14px;
        font-size: 0.82em;
        font-weight: 600;
        min-height: 44px;
        flex-shrink: 0;
        align-self: center;
        border-radius: 8px;
        border: 1.5px solid color-mix(in srgb, var(--success-color, #4caf50) 60%, var(--divider-color));
        background: var(--card-background-color);
        color: var(--success-color, #4caf50);
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      .wake-btn:active {
        transform: scale(0.95);
      }
      .wake-btn:hover {
        background: var(--success-color, #4caf50);
        color: white;
        border-color: var(--success-color, #4caf50);
      }
      .wake-all {
        padding: 14px;
        font-size: 0.9em;
        font-weight: 600;
        min-height: 50px;
        margin-top: 12px;
        border-radius: 12px;
        border: 2px solid var(--warning-color, #ff9800);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .wake-all:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent);
      }
      .wake-all.pending {
        animation: pulse-orange 1.5s infinite;
      }
      @keyframes pulse-orange {
        0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent); }
        50% { box-shadow: 0 0 0 8px transparent; }
      }
    }
`;class as extends se{constructor(){super(...arguments),this.pauseGroups=[],this.pausedCount=0,this.readonly=!1,this._wakeAllPending=!1,this._wakeAllTimeout=null,this._countdownState={interval:null,syncTimeout:null}}connectedCallback(){super.connectedCallback(),this._syncCountdownLifecycle()}updated(e){e.has("pauseGroups")&&this._syncCountdownLifecycle()}disconnectedCallback(){super.disconnectedCallback(),hr(this._countdownState),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null)}_updateCountdownIfNeeded(){this.pauseGroups.length>0&&this.requestUpdate()}_hasLiveCountdowns(){return this.pauseGroups.some(e=>!e.disableAt)}_scheduleCountdownBootstrap(){this._countdownState={interval:null,syncTimeout:globalThis.setTimeout(()=>{this._countdownState.syncTimeout=null,this._hasLiveCountdowns()&&(this._countdownState=dr(()=>this._updateCountdownIfNeeded()))},0)}}_syncCountdownLifecycle(){hr(this._countdownState),0!==this.pauseGroups.length?this._hasLiveCountdowns()?this._countdownState=dr(()=>this._updateCountdownIfNeeded()):this._countdownState={interval:null,syncTimeout:null}:this._scheduleCountdownBootstrap()}_handleWakeAll(){this._wakeAllPending?(null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),this._wakeAllPending=!1,this._fireWakeAll()):(Sr("medium"),this._wakeAllPending=!0,this._wakeAllTimeout=window.setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},Te))}_fireWake(e){this.dispatchEvent(new CustomEvent("wake-automation",{detail:{entityId:e},bubbles:!0,composed:!0}))}_fireClearNotification(e){this.dispatchEvent(new CustomEvent("clear-notification",{detail:{entityId:e},bubbles:!0,composed:!0}))}_hasNotificationConfig(e){return void 0!==e.notification_trigger&&"none"!==e.notification_trigger}_fireAdjust(e){this.dispatchEvent(new CustomEvent("adjust-automation",{detail:{entityId:e.entity_id,friendlyName:e.friendly_name,resumeAt:e.resume_at},bubbles:!0,composed:!0}))}_fireAdjustGroup(e){this.dispatchEvent(new CustomEvent("adjust-group",{detail:{entityIds:e.automations.map(e=>e.entity_id),friendlyNames:e.automations.map(e=>e.friendly_name||e.entity_id),resumeAt:e.resumeAt},bubbles:!0,composed:!0}))}_fireWakeAll(){this.dispatchEvent(new CustomEvent("wake-all",{bubbles:!0,composed:!0}))}render(){if(0===this.pausedCount)return V``;const e=this.hass?.locale?.language;return V`
      <div class="snooze-list" role="region" aria-label="${_e(this.hass,"a11y.snoozed_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${_e(this.hass,"section.snoozed_count",{count:this.pausedCount})}
        </div>
        ${this.pauseGroups.map(t=>V`
          <div class="pause-group" role="group">
            ${this.readonly?V`<div class="pause-group-header">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${t.disableAt?V`${_e(this.hass,"status.resumes")} ${vr(t.resumeAt,e)}`:V`<span class="countdown">${yr(t.resumeAt,_e(this.hass,"status.resuming"))}</span>`}
                </div>`:V`<div class="pause-group-header"
                  @click=${()=>this._fireAdjustGroup(t)}
                  role="button"
                  aria-label="${_e(this.hass,"a11y.adjust_group",{count:t.automations.length})}">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${t.disableAt?V`${_e(this.hass,"status.resumes")} ${vr(t.resumeAt,e)}`:V`<span class="countdown">${yr(t.resumeAt,_e(this.hass,"status.resuming"))}</span>`}
                </div>`}
            ${t.automations.map(e=>this.readonly?V`<div class="paused-item">
                  <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                  <div class="paused-info">
                    <div class="paused-name">${e.friendly_name||e.entity_id}</div>
                  </div>
                </div>`:V`<div class="paused-item" role="button" tabindex="0" @click=${()=>this._fireAdjust(e)} @keydown=${t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),this._fireAdjust(e))}}>
                  <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                  <div class="paused-info">
                    <div class="paused-name">${e.friendly_name||e.entity_id}</div>
                  </div>
                  ${this._hasNotificationConfig(e)?V`
                    <button
                      type="button"
                      class="wake-btn clear-notification-btn"
                      aria-label="${_e(this.hass,"button.remove_notification")}"
                      title="${_e(this.hass,"button.remove_notification")}"
                      @click=${t=>{t.stopPropagation(),this._fireClearNotification(e.entity_id)}}
                    >
                      <ha-icon icon="mdi:bell-off-outline" aria-hidden="true"></ha-icon>
                    </button>
                  `:""}
                  <button type="button" class="wake-btn" @click=${t=>{t.stopPropagation(),this._fireWake(e.entity_id)}}>
                    ${_e(this.hass,"button.resume")}
                  </button>
                </div>`)}
          </div>
        `)}
        ${!this.readonly&&this.pausedCount>1?V`
          <button type="button" class="wake-all ${this._wakeAllPending?"pending":""}"
            @click=${()=>this._handleWakeAll()}>
            ${this._wakeAllPending?_e(this.hass,"button.confirm_resume_all"):_e(this.hass,"button.resume_all")}
          </button>
        `:""}
      </div>
    `}}as.styles=[ve,ns],e([de({attribute:!1})],as.prototype,"hass",void 0),e([de({attribute:!1})],as.prototype,"pauseGroups",void 0),e([de({type:Number})],as.prototype,"pausedCount",void 0),e([de({type:Boolean})],as.prototype,"readonly",void 0),e([he()],as.prototype,"_wakeAllPending",void 0),Ir("autosnooze-active-pauses",as);const rs=r`
    :host {
      display: block;
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
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-text-color);
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

    .last-duration-badge.active {
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-text-color);
      border-color: var(--primary-color);
    }

    .last-duration-badge.active ha-icon {
      color: var(--primary-text-color);
    }

    .last-duration-badge:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
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

    /* Mobile adjustments for badge - unified with main 480px breakpoint below */

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
      border-color: var(--error-color, #f44336);
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
      color: var(--primary-text-color);
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
      color: var(--primary-text-color);
    }

    /* Entry-point variant: outlined secondary button so the
       date/time option reads as a distinct, discoverable action. */
    .schedule-link--enter {
      display: flex;
      width: 100%;
      justify-content: center;
      margin-top: 12px;
      padding: 10px 16px;
      border: 1px solid color-mix(in srgb, var(--primary-color) 45%, var(--divider-color));
      border-radius: 8px;
      /* Label uses primary-text-color for WCAG AA contrast; the accent
         border and icon carry the visual emphasis instead. */
      color: var(--primary-text-color);
      font-weight: 500;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .schedule-link--enter:hover {
      text-decoration: none;
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .schedule-link--enter ha-icon {
      color: var(--primary-color);
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
    .schedule-summary {
      font-size: 0.82em;
      color: var(--secondary-text-color);
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary-color) 24%, transparent);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .schedule-summary.invalid {
      color: var(--error-color, #f44336);
      background: color-mix(in srgb, var(--error-color, #f44336) 10%, transparent);
      border-color: color-mix(in srgb, var(--error-color, #f44336) 36%, transparent);
    }

    /* Mobile Responsive Styles */
    @media (max-width: 480px) {
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
        margin-bottom: 6px;
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
        background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
        color: var(--primary-text-color);
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        transform: translateY(-1px);
      }

      /* Last duration badge mobile hover - match pill behavior */
      .last-duration-badge:hover:not(.active) {
        border-color: var(--primary-color);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .last-duration-badge.active {
        background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
        color: var(--primary-text-color);
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        transform: translateY(-1px);
      }

      .last-duration-badge.active ha-icon {
        color: var(--primary-text-color);
      }

      .last-duration-badge:active:not(.active) {
        transform: scale(0.95);
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        border-color: var(--primary-color);
      }

      .last-duration-badge {
        font-size: 0.8em;
        padding: 8px 10px;
        gap: 5px;
      }

      .last-duration-badge ha-icon {
        --mdc-icon-size: 14px;
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
        margin-top: 6px;
        padding: 6px 4px;
        font-size: 0.85em;
        font-weight: 500;
        min-height: 36px;
        opacity: 0.8;
        transition: opacity 0.15s ease;
      }

      .schedule-link:hover {
        opacity: 1;
      }

      .schedule-link--enter {
        margin-top: 10px;
        padding: 12px 16px;
        min-height: 46px;
        font-size: 0.88em;
        font-weight: 600;
        border-radius: 12px;
        border-width: 1.5px;
        opacity: 1;
      }

      .schedule-link--enter:active {
        transform: scale(0.98);
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
      }

      /* --- Schedule Inputs: Refined form layout --- */
      .schedule-inputs {
        padding: 14px;
        gap: 14px;
        margin-bottom: 14px;
        border-radius: 12px;
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
        border-radius: 8px;
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
        border-radius: 8px;
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
      .schedule-summary {
        font-size: 0.76em;
        border-radius: 8px;
        padding: 9px 10px;
      }
    }
`;class ss extends se{constructor(){super(...arguments),this.scheduleMode=!1,this.customDuration={days:0,hours:0,minutes:30},this.customDurationInput="30m",this.showCustomInput=!1,this.untilTomorrow=!1,this.lastDuration=null,this.disableAtDate="",this.disableAtTime="",this.resumeAtDate="",this.resumeAtTime=""}_getBasePresets(){const e=function(e){const t=at(e)?.attributes?.duration_presets;return t?.length?t:null}(this.hass);return e?.length?e.filter(e=>null!==e.minutes):De.filter(e=>null!==e.minutes)}_getDurationPills(){return[...this._getBasePresets(),{label:_e(this.hass,"duration.custom"),minutes:null}]}_getDurationPreview(){const e=zr(this.customDurationInput);return e?xr(e.days,e.hours,e.minutes):""}_isDurationValid(){return $r(this.customDurationInput)}_renderDateOptions(){const e=function(e=365,t){const o=[],i=new Date,n=i.getFullYear();for(let a=0;a<e;a++){const e=new Date(i);e.setDate(e.getDate()+a);const r=e.getFullYear(),s=`${r}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,l=e.toLocaleDateString(t,{weekday:"short"}),c=e.toLocaleDateString(t,{month:"short"}),u=e.getDate(),d=r!==n?`${l}, ${c} ${u}, ${r}`:`${l}, ${c} ${u}`;o.push({value:s,label:d})}return o}(365,this.hass?.locale?.language);return e.map(e=>V`<option value="${e.value}">${e.label}</option>`)}_renderLastDurationBadge(){if(!this.lastDuration)return"";const e=this._getBasePresets(),t=this.lastDuration.minutes,o=!e.some(e=>e.minutes===t);if(!o)return"";const{days:i,hours:n,minutes:a}=this.lastDuration.duration,r=wr(i,n,a).replace(/ /g,""),s=kr(this.customDuration),l=!this.untilTomorrow&&!this.showCustomInput&&t===s;return V`
      <button
        type="button"
        class="last-duration-badge ${l?"active":""}"
        @click=${()=>this._fireDurationChange(t)}
      >
        <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
        ${r}
      </button>
    `}_fireDurationChange(e,t){const o=Ar(e),i=wr(o.days,o.hours,o.minutes);this.dispatchEvent(new CustomEvent("duration-change",{detail:{minutes:e,duration:o,input:i,showCustomInput:t?.showCustomInput??!1},bubbles:!0,composed:!0}))}_fireCustomDurationChange(e){const t=zr(e),o=t?kr(t):0;this.dispatchEvent(new CustomEvent("duration-change",{detail:{minutes:o,duration:t??{days:0,hours:0,minutes:0},input:e},bubbles:!0,composed:!0}))}_fireScheduleModeChange(e){this.dispatchEvent(new CustomEvent("schedule-mode-change",{detail:{enabled:e},bubbles:!0,composed:!0}))}_fireScheduleFieldChange(e,t){this.dispatchEvent(new CustomEvent("schedule-field-change",{detail:{field:e,value:t},bubbles:!0,composed:!0}))}_formatScheduleDateTime(e){const t=this.hass?.locale?.language;return new Date(e).toLocaleString(t,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}_renderUntilTomorrowPreview(){const e=Or(new Date,8),t=Mr(e.date,e.time);return t?`${_e(this.hass,"status.resumes")} ${this._formatScheduleDateTime(t)}`:""}_fireUntilTomorrowSelect(){this.dispatchEvent(new CustomEvent("until-tomorrow-select",{bubbles:!0,composed:!0}))}_renderScheduleSummary(){if(!this.resumeAtDate||!this.resumeAtTime)return"";const e=Mr(this.resumeAtDate,this.resumeAtTime);if(!e)return"";if(!Boolean(this.disableAtDate&&this.disableAtTime))return V`
        <div class="schedule-summary" role="status" aria-live="polite">
          ${_e(this.hass,"schedule.summary_immediate",{resume:this._formatScheduleDateTime(e)})}
        </div>
      `;const t=Mr(this.disableAtDate,this.disableAtTime);return t?new Date(t).getTime()>=new Date(e).getTime()?V`
        <div class="schedule-summary invalid" role="status" aria-live="polite">
          ${_e(this.hass,"schedule.summary_invalid_order")}
        </div>
      `:V`
      <div class="schedule-summary" role="status" aria-live="polite">
        ${_e(this.hass,"schedule.summary_with_disable",{disable:this._formatScheduleDateTime(t),resume:this._formatScheduleDateTime(e)})}
      </div>
    `:""}render(){if(this.scheduleMode)return V`
        <div class="schedule-inputs">
          <div class="datetime-field">
            <label id="snooze-at-label">${_e(this.hass,"schedule.snooze_at")}</label>
            <div class="datetime-row">
              <select
                .value=${this.disableAtDate}
                @change=${e=>this._fireScheduleFieldChange("disableAtDate",e.target.value)}
                aria-labelledby="snooze-at-label"
              >
                <option value="">${_e(this.hass,"schedule.select_date")}</option>
                ${this._renderDateOptions()}
              </select>
              <input
                type="time"
                .value=${this.disableAtTime}
                @input=${e=>this._fireScheduleFieldChange("disableAtTime",e.target.value)}
                aria-labelledby="snooze-at-label"
              />
            </div>
            <span class="field-hint">${_e(this.hass,"schedule.hint_immediate")}</span>
          </div>
          <div class="datetime-field">
            <label id="resume-at-label">${_e(this.hass,"schedule.resume_at")}</label>
            <div class="datetime-row">
              <select
                .value=${this.resumeAtDate}
                @change=${e=>this._fireScheduleFieldChange("resumeAtDate",e.target.value)}
                aria-labelledby="resume-at-label"
              >
                <option value="">${_e(this.hass,"schedule.select_date")}</option>
                ${this._renderDateOptions()}
              </select>
              <input
                type="time"
                .value=${this.resumeAtTime}
                @input=${e=>this._fireScheduleFieldChange("resumeAtTime",e.target.value)}
                aria-labelledby="resume-at-label"
              />
            </div>
          </div>
          ${this._renderScheduleSummary()}
          <button
            type="button"
            class="schedule-link"
            @click=${()=>this._fireScheduleModeChange(!1)}
          >
            <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
            ${_e(this.hass,"schedule.back_to_duration")}
          </button>
        </div>
      `;const e=this._getDurationPills(),t=e[e.length-1],o=e.slice(0,-1).filter(e=>null!==e.minutes);return V`
      <div class="duration-selector">
        <div class="duration-header-row">
          <div class="duration-section-header" id="duration-header">${_e(this.hass,"duration.header")}</div>
          ${this._renderLastDurationBadge()}
        </div>
        <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
          ${o.map(e=>{const t=kr(this.customDuration),o=!this.untilTomorrow&&!this.showCustomInput&&e.minutes===t;return V`
                <button
                  type="button"
                  class="pill ${o?"active":""}"
                  @click=${()=>{this.hass&&sr(this.hass,{event:"duration_option_selected",properties:{method:"preset"},source:"card"}),this._fireDurationChange(e.minutes,{showCustomInput:!1})}}
                  role="radio"
                  aria-checked=${o}
                >
                  ${e.label}
                </button>
              `})}
          <button
            type="button"
            class="pill ${this.untilTomorrow?"active":""}"
            @click=${()=>this._fireUntilTomorrowSelect()}
            role="radio"
            aria-checked=${this.untilTomorrow}
          >
            ${_e(this.hass,"duration.tomorrow")}
          </button>
          <button
            type="button"
            class="pill ${!this.untilTomorrow&&this.showCustomInput?"active":""}"
            @click=${()=>{this.dispatchEvent(new CustomEvent("custom-input-toggle",{detail:{show:!this.showCustomInput},bubbles:!0,composed:!0}))}}
            role="radio"
            aria-checked=${!this.untilTomorrow&&this.showCustomInput}
          >
            ${t.label}
          </button>
        </div>

        ${this.untilTomorrow?V`
          <div class="duration-preview" role="status" aria-live="polite">${this._renderUntilTomorrowPreview()}</div>
        `:""}

        ${this.showCustomInput?V`
          <div class="custom-duration-input">
            <input
              type="text"
              class="duration-input ${this._isDurationValid()?"":"invalid"}"
              placeholder="${_e(this.hass,"duration.placeholder")}"
              .value=${this.customDurationInput}
              @input=${e=>this._fireCustomDurationChange(e.target.value)}
              aria-label="${_e(this.hass,"a11y.custom_duration")}"
              aria-invalid=${!this._isDurationValid()}
              aria-describedby="duration-help"
            />
            ${this._getDurationPreview()&&this._isDurationValid()?V`<div class="duration-preview" role="status" aria-live="polite">${_e(this.hass,"duration.preview_label")} ${this._getDurationPreview()}</div>`:V`<div class="duration-help" id="duration-help">${_e(this.hass,"duration.help")}</div>`}
          </div>
        `:""}

        <button
          type="button"
          class="schedule-link schedule-link--enter"
          @click=${()=>this._fireScheduleModeChange(!0)}
        >
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${_e(this.hass,"schedule.pick_datetime")}
        </button>
      </div>
    `}}ss.styles=rs,e([de({attribute:!1})],ss.prototype,"hass",void 0),e([de({type:Boolean})],ss.prototype,"scheduleMode",void 0),e([de({attribute:!1})],ss.prototype,"customDuration",void 0),e([de({type:String})],ss.prototype,"customDurationInput",void 0),e([de({type:Boolean})],ss.prototype,"showCustomInput",void 0),e([de({type:Boolean})],ss.prototype,"untilTomorrow",void 0),e([de({attribute:!1})],ss.prototype,"lastDuration",void 0),e([de({type:String})],ss.prototype,"disableAtDate",void 0),e([de({type:String})],ss.prototype,"disableAtTime",void 0),e([de({type:String})],ss.prototype,"resumeAtDate",void 0),e([de({type:String})],ss.prototype,"resumeAtTime",void 0),Ir("autosnooze-duration-selector",ss);const ls=r`
    :host {
      display: block;
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
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      color: var(--primary-text-color);
    }
    .tab:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .tab.active {
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-text-color);
      border-color: var(--primary-color);
    }
    .tab-count {
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      color: var(--primary-text-color);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.8em;
    }
    .tab.active .tab-count {
      background: color-mix(in srgb, var(--primary-color) 20%, var(--card-background-color));
      color: var(--primary-text-color);
    }

    .hide-snoozed-row {
      display: flex;
      justify-content: flex-start;
      margin: -4px 0 12px;
    }
    .hide-snoozed-toggle {
      padding: 6px 14px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 0.85em;
      background: transparent;
      border: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      min-height: 36px;
      box-sizing: border-box;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .hide-snoozed-toggle:hover {
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
    }
    .hide-snoozed-toggle:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .hide-snoozed-toggle.active {
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      border-color: var(--primary-color);
    }

    /* Search */
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
      font-size: 0.9em;
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
    .search-clear-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent);
    }
    .registry-warning {
      margin-bottom: 10px;
      padding: 8px 10px;
      border: 1px solid color-mix(in srgb, var(--warning-color, #ff9800) 45%, var(--divider-color));
      border-radius: 8px;
      background: color-mix(in srgb, var(--warning-color, #ff9800) 10%, var(--card-background-color));
      color: var(--primary-text-color);
      font-size: 0.82em;
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
    .list-item-content {
      flex: 1;
      min-width: 0;
    }
    .list-item-name {
      font-size: 0.95em;
      overflow: hidden;
      overflow-wrap: anywhere;
      white-space: normal;
      word-break: break-word;
    }
    .list-item-meta {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      overflow-wrap: anywhere;
      white-space: normal;
      word-break: break-word;
    }
    .list-item-meta ha-icon {
      --mdc-icon-size: 12px;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* Recent Group Header */
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
    .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
    }
    .group-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-text-color);
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
      color: var(--primary-text-color);
      white-space: nowrap;
      line-height: 1.2;
      font-size: 0.9em;
      font-variant-numeric: tabular-nums;
    }
    .select-all-btn {
      padding: 0 8px;
      border: 1px solid color-mix(in srgb, var(--primary-color) 50%, var(--divider-color));
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
      min-height: 28px;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .select-all-btn:hover {
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      color: var(--primary-text-color);
      border-color: var(--primary-color);
    }
    .select-all-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .clear-selection-btn:hover {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      border-color: var(--divider-color);
    }
    .clear-selection-btn:active {
      background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
      color: var(--primary-text-color);
      border-color: var(--primary-color);
    }

    /* Mobile Responsive Styles */
    @media (max-width: 480px) {
      /* --- Filter Tabs: Segmented control style --- */
      .filter-tabs {
        gap: 2px;
        margin-bottom: 14px;
        padding: 3px;
        background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--divider-color));
        border-radius: 12px;
        border-bottom: none;
        padding-bottom: 3px;
      }

      .tab {
        padding: 8px 6px;
        font-size: 0.85em;
        font-weight: 500;
        border-radius: 10px;
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
        color: var(--primary-text-color);
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
        background: color-mix(in srgb, var(--primary-color) 20%, var(--card-background-color));
        color: var(--primary-text-color);
      }

      /* --- Search: Refined input with subtle depth --- */
      .search-box {
        flex: 1 1 0;
        min-width: 0;
        max-width: none;
      }

      .search-row {
        gap: 6px;
        margin-bottom: 14px;
        flex-wrap: nowrap;
      }

      .search-box input {
        padding: 9px 56px 9px 10px;
        font-size: 0.85em;
        min-height: 34px;
        border-radius: 10px;
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

      .search-clear-btn {
        right: 6px;
        min-height: 24px;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.85em;
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
        border-radius: 8px;
        border: 1px solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }

      .selection-count {
        font-weight: 500;
        color: var(--primary-text-color);
        opacity: 0.8;
        width: auto;
        min-height: 28px;
        margin-left: 0;
        font-size: 0.85em;
      }

      .select-all-btn {
        padding: 0 6px;
        font-size: 0.85em;
        font-weight: 600;
        min-height: 28px;
        border-radius: 6px;
        border: 1.5px solid color-mix(in srgb, var(--primary-color) 40%, var(--divider-color));
        background: var(--card-background-color);
        transition: all 0.15s ease;
      }

      .select-all-btn:hover {
        background: color-mix(in srgb, var(--primary-color) 12%, var(--card-background-color));
        color: var(--primary-text-color);
        border-color: var(--primary-color);
      }

      /* --- Selection List: Card-style items with depth --- */
      .selection-list {
        max-height: min(252px, calc(35dvh + 52px));
        margin-bottom: 16px;
        border-radius: 12px;
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
        letter-spacing: 0;
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

      /* --- Empty State --- */
      .list-empty {
        padding: 28px 20px;
        font-size: 0.9em;
        opacity: 0.6;
        font-style: italic;
      }
    }
`;function cs(e,t,o="Unassigned"){return e?t.areas?.[e]?.name??qr(e):o}function us(e,t){return t[e]?.name??qr(e)}function ds(e,t,o="Uncategorized"){return e?t[e]?.name??qr(e):o}function hs(e,t,o){return!(!e.labels||0===e.labels.length)&&e.labels.some(e=>{const i=o[e]?.name;return i?.toLowerCase()===t})}function ps(e,t,o){const i={};return e.forEach(e=>{const n=t(e);if(!n||0===n.length)return i[o]||(i[o]=[]),void i[o].push(e.automation);n.forEach(t=>{i[t]||(i[t]=[]),i[t].push(e.automation)})}),Object.entries(i).sort((e,t)=>e[0]===o?1:t[0]===o?-1:e[0].localeCompare(t[0]))}function ms(e){const t=new Set([Oe.toLowerCase(),Ne.toLowerCase()]),o=e.search.toLowerCase(),i=e.automations.map(o=>{const i=function(e,t,o){return e.labels?.length?e.labels.map(e=>us(e,t)).filter(e=>!o.has(e.toLowerCase())):[]}(o,e.labelRegistry,t);return{automation:o,areaName:o.area_id?e.hass?cs(o.area_id,e.hass,e.emptyAreaLabel):qr(o.area_id):e.emptyAreaLabel,categoryName:o.category_id?ds(o.category_id,e.categoryRegistry,e.emptyCategoryLabel):e.emptyCategoryLabel,visibleLabelNames:i,hasIncludeLabel:hs(o,Ne,e.labelRegistry),hasExcludeLabel:hs(o,Oe,e.labelRegistry)}}),n=i.some(e=>e.hasIncludeLabel),a=e.pausedEntityIds,r=Boolean(e.hideSnoozed),s=i.filter(e=>!!(n?e.hasIncludeLabel:!e.hasExcludeLabel)&&((!r||!a?.has(e.automation.id))&&(!o||(e.automation.name.toLowerCase().includes(o)||e.automation.id.toLowerCase().includes(o))))),l="areas"===e.filterTab?ps(s,e=>e.automation.area_id?[e.areaName]:null,e.emptyAreaLabel):"categories"===e.filterTab?ps(s,e=>e.automation.category_id?[e.categoryName]:null,e.emptyCategoryLabel):"labels"===e.filterTab?ps(s,e=>e.visibleLabelNames.length>0?e.visibleLabelNames:null,e.emptyLabelLabel):[],c=new Set,u=new Set,d=new Set;return s.forEach(o=>{o.automation.area_id&&c.add(o.automation.area_id),o.automation.category_id&&d.add(o.automation.category_id),o.automation.labels?.length&&o.automation.labels.forEach(o=>{const i=us(o,e.labelRegistry).toLowerCase();t.has(i)||u.add(o)})}),{filtered:s.map(e=>e.automation),grouped:l,areaCount:c.size,labelCount:u.size,categoryCount:d.size}}class fs extends se{constructor(){super(...arguments),this.automations=[],this.selected=[],this.labelRegistry={},this.labelRegistryUnavailable=!1,this.categoryRegistry={},this.recentSnoozeIds=[],this.pausedEntityIds=[],this._filterTab="all",this._search="",this._searchInput="",this._expandedGroups={},this._hideSnoozed=!1,this._searchTimeout=null,this._viewModelCache=null}connectedCallback(){super.connectedCallback(),this._hideSnoozed=function(){try{const e=localStorage.getItem(Be);return null!==e&&!0===JSON.parse(e)}catch{return!1}}()}updated(e){super.updated(e),this._hideSnoozed&&(e.has("pausedEntityIds")||e.has("selected")||e.has("_hideSnoozed"))&&this._pruneHiddenSelection()}disconnectedCallback(){super.disconnectedCallback(),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null)}_fireSelectionChange(e){this.dispatchEvent(new CustomEvent("selection-change",{detail:{selected:e},bubbles:!0,composed:!0}))}_toggleSelection(e){let t;Sr("selection"),t=this.selected.includes(e)?this.selected.filter(t=>t!==e):[...this.selected,e],this._fireSelectionChange(t)}_toggleGroupExpansion(e){const t=!1!==this._expandedGroups[e];this._expandedGroups={...this._expandedGroups,[e]:!t}}_selectGroup(e){const t=e.map(e=>e.id);let o;o=t.every(e=>this.selected.includes(e))?this.selected.filter(e=>!t.includes(e)):[...new Set([...this.selected,...t])],this._fireSelectionChange(o)}_selectAllVisible(){const e=this._getViewModel().filtered.map(e=>e.id),t=[...new Set([...this.selected,...e])];this.hass&&sr(this.hass,{event:"selection_feature_used",properties:{method:"all"},source:"card"}),this._fireSelectionChange(t)}_clearSelection(){this._fireSelectionChange([])}_getFilteredAutomations(){return this._getViewModel().filtered}_getAreaName(e){return this.hass?cs(e??null,this.hass):_e(this.hass,"group.unassigned")}_getLabelName(e){return us(e,this.labelRegistry)}_getCategoryName(e){return ds(e??null,this.categoryRegistry)}_getGroupedByTab(e){return ms(this._buildViewModelInput(e)).grouped}_getGroupedByArea(){return this._getGroupedByTab("areas")}_getGroupedByLabel(){return this._getGroupedByTab("labels")}_getGroupedByCategory(){return this._getGroupedByTab("categories")}_getAreaCount(){return this._getViewModel().areaCount}_getLabelCount(){return this._getViewModel().labelCount}_getCategoryCount(){return this._getViewModel().categoryCount}_buildViewModelInput(e){return{automations:this.automations,search:this._search,filterTab:e,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,emptyAreaLabel:_e(this.hass,"group.unassigned"),emptyLabelLabel:_e(this.hass,"group.unlabeled"),emptyCategoryLabel:_e(this.hass,"group.uncategorized"),hideSnoozed:this._hideSnoozed,pausedEntityIds:new Set(this.pausedEntityIds)}}_getViewModel(){const e=this._viewModelCache;if(e&&e.automations===this.automations&&e.search===this._search&&e.filterTab===this._filterTab&&e.hass===this.hass&&e.labelRegistry===this.labelRegistry&&e.categoryRegistry===this.categoryRegistry&&e.hideSnoozed===this._hideSnoozed&&e.pausedEntityIds===this.pausedEntityIds)return e.result;const t=ms(this._buildViewModelInput(this._filterTab));return this._viewModelCache={automations:this.automations,search:this._search,filterTab:this._filterTab,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,hideSnoozed:this._hideSnoozed,pausedEntityIds:this.pausedEntityIds,result:t},t}_pruneHiddenSelection(){if(!this._hideSnoozed||0===this.pausedEntityIds.length||0===this.selected.length)return;const e=new Set(this.pausedEntityIds),t=this.selected.filter(t=>!e.has(t));t.length!==this.selected.length&&this._fireSelectionChange(t)}_toggleHideSnoozed(){const e=!this._hideSnoozed;this._hideSnoozed=e,function(e){try{localStorage.setItem(Be,JSON.stringify(e))}catch{}}(e),e&&this._pruneHiddenSelection()}_handleSearchInput(e){const t=e.target.value;this._searchInput=t,null!==this._searchTimeout&&clearTimeout(this._searchTimeout),this._searchTimeout=window.setTimeout(()=>{this._search=t,this._searchTimeout=null},Ae)}_clearSearch(){null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),this._searchInput="",this._search=""}_handleSearchKeydown(e){"Escape"===e.key&&(this._searchInput||this._search)&&(e.preventDefault(),this._clearSearch())}_renderSelectionList(e,t){const{filtered:o,grouped:i}=e;if("all"===this._filterTab){if(0===o.length)return V`<div class="list-empty" role="status">${_e(this.hass,"list.empty")}</div>`;const e=new Set(this.recentSnoozeIds),i=[],n=[];for(const t of o)(e.has(t.id)?i:n).push(t);const a=i.concat(n);return V`
        ${i.length>0?V`
          <div class="recent-group-header">
            <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
            <span>${_e(this.hass,"group.recent")}</span>
          </div>
        `:""}
        ${a.map((e,o)=>V`
        <button
          type="button"
          class="list-item ${t.has(e.id)?"selected":""} ${o<i.length?"is-recent":""}"
          data-entity-id=${e.id}
          @click=${()=>this._toggleSelection(e.id)}
          role="option"
          aria-selected=${t.has(e.id)}
        >
          <input
            type="checkbox"
            .checked=${t.has(e.id)}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._toggleSelection(e.id)}
            aria-label="${_e(this.hass,"a11y.select_automation",{name:e.name})}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${e.name}</div>
          </div>
        </button>
      `)}
      `}return 0===i.length?V`<div class="list-empty" role="status">${_e(this.hass,"list.empty")}</div>`:i.map(([e,o])=>{const i=!1!==this._expandedGroups[e],n=o.every(e=>t.has(e.id)),a=o.some(e=>t.has(e.id))&&!n;return V`
        <button
          type="button"
          class="group-header ${i?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(e)}
          aria-expanded=${i}
          aria-label="${_e(this.hass,"a11y.group_header",{name:e,count:o.length})}"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${e}</span>
          <span class="group-badge" aria-label="${_e(this.hass,"a11y.group_count",{count:o.length})}">${o.length}</span>
          <input
            type="checkbox"
            .checked=${n}
            .indeterminate=${a}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._selectGroup(o)}
            aria-label="${_e(this.hass,"a11y.select_all_in_group",{name:e})}"
            tabindex="-1"
          />
        </button>
        ${i?o.map(e=>V`
                <button
                  type="button"
                  class="list-item ${t.has(e.id)?"selected":""}"
                  data-entity-id=${e.id}
                  @click=${()=>this._toggleSelection(e.id)}
                  role="option"
                  aria-selected=${t.has(e.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${t.has(e.id)}
                    @click=${e=>e.stopPropagation()}
                    @change=${()=>this._toggleSelection(e.id)}
                    aria-label="${_e(this.hass,"a11y.select_automation",{name:e.name})}"
                    tabindex="-1"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${e.name}</div>
                  </div>
                </button>
              `):""}
      `})}render(){const e=this._getViewModel(),{filtered:t}=e,o=new Set(this.selected),i=this.labelRegistryUnavailable,n=this._searchInput.length>0||this._search.length>0,a=t.length>0&&t.every(e=>o.has(e.id));return V`
      <div class="filter-tabs" role="tablist" aria-label="${_e(this.hass,"a11y.filter_tabs")}">
        <button
          type="button"
          class="tab ${"all"===this._filterTab?"active":""}"
          @click=${()=>this._filterTab="all"}
          role="tab"
          aria-selected=${"all"===this._filterTab}
          aria-controls="selection-list"
        >
          ${_e(this.hass,"tab.all")}
          <span class="tab-count" aria-label="${_e(this.hass,"a11y.automation_count",{count:e.filtered.length})}">${e.filtered.length}</span>
        </button>
        <button
          type="button"
          class="tab ${"areas"===this._filterTab?"active":""}"
          @click=${()=>this._filterTab="areas"}
          role="tab"
          aria-selected=${"areas"===this._filterTab}
          aria-controls="selection-list"
        >
          ${_e(this.hass,"tab.areas")}
          <span class="tab-count" aria-label="${_e(this.hass,"a11y.area_count",{count:e.areaCount})}">${e.areaCount}</span>
        </button>
        <button
          type="button"
          class="tab ${"categories"===this._filterTab?"active":""}"
          @click=${()=>this._filterTab="categories"}
          role="tab"
          aria-selected=${"categories"===this._filterTab}
          aria-controls="selection-list"
        >
          ${_e(this.hass,"tab.categories")}
          <span class="tab-count" aria-label="${_e(this.hass,"a11y.category_count",{count:e.categoryCount})}">${e.categoryCount}</span>
        </button>
        <button
          type="button"
          class="tab ${"labels"===this._filterTab?"active":""}"
          @click=${()=>this._filterTab="labels"}
          role="tab"
          aria-selected=${"labels"===this._filterTab}
          aria-controls="selection-list"
        >
          ${_e(this.hass,"tab.labels")}
          <span class="tab-count" aria-label="${_e(this.hass,"a11y.label_count",{count:e.labelCount})}">${e.labelCount}</span>
        </button>
      </div>

      <div class="hide-snoozed-row">
        <button
          type="button"
          class="hide-snoozed-toggle ${this._hideSnoozed?"active":""}"
          @click=${()=>this._toggleHideSnoozed()}
          aria-pressed=${this._hideSnoozed}
          aria-label="${_e(this.hass,"a11y.hide_snoozed")}"
        >
          ${_e(this.hass,"filter.hide_snoozed")}
        </button>
      </div>

      <div class="search-row selection-actions">
        <div class="search-box">
          <input
            type="search"
            placeholder="${_e(this.hass,"search.placeholder")}"
            .value=${this._searchInput||this._search}
            @input=${e=>this._handleSearchInput(e)}
            @keydown=${e=>this._handleSearchKeydown(e)}
            aria-label="${_e(this.hass,"a11y.search")}"
          />
          ${n?V`
                <button
                  type="button"
                  class="search-clear-btn"
                  @click=${()=>this._clearSearch()}
                  aria-label="${_e(this.hass,"a11y.clear_search")}"
                >
                  ${_e(this.hass,"button.clear")}
                </button>
              `:""}
        </div>

        ${t.length>0?V`
              <span class="selection-count" role="status" aria-live="polite">
                ${_e(this.hass,"selection.count",{selected:this.selected.length,total:t.length})}
              </span>
              ${a?"":V`
                    <button
                      type="button"
                      class="select-all-btn"
                      @click=${()=>this._selectAllVisible()}
                      aria-label="${_e(this.hass,"a11y.select_all")}"
                    >
                      ${_e(this.hass,"button.select_all")}
                    </button>
                  `}
              ${this.selected.length>0?V`<button type="button" class="select-all-btn clear-selection-btn" @click=${()=>this._clearSelection()} aria-label="${_e(this.hass,"a11y.clear_selection")}">${_e(this.hass,"button.clear")}</button>`:""}
            `:""}
      </div>

      ${i?V`
            <div class="registry-warning" role="status">
              ${_e(this.hass,"list.label_registry_warning")}
            </div>
          `:""}

      <div class="selection-list" id="selection-list" role="listbox" aria-label="${_e(this.hass,"a11y.automations_list")}" aria-multiselectable="true">
        ${this._renderSelectionList(e,o)}
      </div>
    `}}fs.styles=ls,e([de({attribute:!1})],fs.prototype,"hass",void 0),e([de({attribute:!1})],fs.prototype,"automations",void 0),e([de({attribute:!1})],fs.prototype,"selected",void 0),e([de({attribute:!1})],fs.prototype,"labelRegistry",void 0),e([de({type:Boolean})],fs.prototype,"labelRegistryUnavailable",void 0),e([de({attribute:!1})],fs.prototype,"categoryRegistry",void 0),e([de({attribute:!1})],fs.prototype,"recentSnoozeIds",void 0),e([de({attribute:!1})],fs.prototype,"pausedEntityIds",void 0),e([he()],fs.prototype,"_filterTab",void 0),e([he()],fs.prototype,"_search",void 0),e([he()],fs.prototype,"_searchInput",void 0),e([he()],fs.prototype,"_expandedGroups",void 0),e([he()],fs.prototype,"_hideSnoozed",void 0),Ir("autosnooze-automation-list",fs);const gs=r`
    :host {
      display: block;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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
    .modal-close:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .modal-body {
      padding: 16px;
    }
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
    .adjust-section {
      margin-bottom: 16px;
    }
    .adjust-section:last-child {
      margin-bottom: 0;
    }
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
    .adjust-btn {
      padding: 10px 4px;
      border-radius: 10px;
      font-size: 0.9em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 44px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .adjust-btn.increment {
      background: var(--card-background-color);
      color: var(--primary-color);
      border: 1.5px solid var(--primary-color);
    }
    .adjust-btn.increment:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .adjust-btn.increment:active {
      transform: scale(0.95);
    }
    .adjust-btn.increment:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .adjust-btn.decrement {
      background: var(--card-background-color);
      color: var(--warning-color, #ff9800);
      border: 1.5px solid var(--warning-color, #ff9800);
    }
    .adjust-btn.decrement:hover:not(:disabled) {
      background: var(--warning-color, #ff9800);
      color: white;
    }
    .adjust-btn.decrement:active:not(:disabled) {
      transform: scale(0.95);
    }
    .adjust-btn.decrement:focus-visible {
      outline: 2px solid var(--warning-color, #ff9800);
      outline-offset: 2px;
    }
    .adjust-btn.decrement:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      border-color: var(--divider-color);
      color: var(--secondary-text-color);
    }
    @media (max-width: 480px) {
      .modal-content {
        max-width: 100%;
        border-radius: 16px;
      }
      .modal-header {
        padding: 18px 16px 14px;
      }
      .modal-title {
        font-size: 0.95em;
      }
      .remaining-time {
        font-size: 2.2em;
        padding: 16px 0 24px;
      }
      .adjust-btn {
        min-height: 48px;
        font-size: 0.88em;
        border-radius: 12px;
      }
      .adjust-buttons {
        gap: 10px;
      }
      .decrement-buttons {
        gap: 10px;
      }
    }
`,_s=[{label:"+15m",minutes:15},{label:"+30m",minutes:30},{label:"+1h",hours:1},{label:"+2h",hours:2}],bs=[{label:"-15m",minutes:-15,thresholdMs:15*xe},{label:"-30m",minutes:-30,thresholdMs:30*xe}],vs=xe;class ys extends se{constructor(){super(...arguments),this.open=!1,this.entityId="",this.friendlyName="",this.resumeAt="",this.entityIds=[],this.friendlyNames=[],this._countdownState={interval:null,syncTimeout:null}}get _isGroupMode(){return this.entityIds.length>1}updated(e){e.has("open")&&(this.open?this._startSynchronizedCountdown():this._stopCountdown())}disconnectedCallback(){super.disconnectedCallback(),this._stopCountdown()}_startSynchronizedCountdown(){hr(this._countdownState),this._countdownState=dr(()=>this.requestUpdate())}_stopCountdown(){hr(this._countdownState)}_isDecrementDisabled(e){if(!this.resumeAt)return!0;return new Date(this.resumeAt).getTime()-Date.now()-e<vs}_fireAdjustTime(e){this.entityIds.length>0?this.dispatchEvent(new CustomEvent("adjust-time",{detail:{entityIds:this.entityIds,...e},bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent("adjust-time",{detail:{entityId:this.entityId,...e},bubbles:!0,composed:!0}))}_close(){this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_handleOverlayKeydown(e){"Escape"===e.key&&this._close()}_handleOverlayClick(e){e.target===e.currentTarget&&this._close()}render(){return this.open?V`
      <div class="modal-overlay" @click=${this._handleOverlayClick} @keydown=${this._handleOverlayKeydown}>
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="adjust-title" @click=${e=>e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title" id="adjust-title">
              ${this._isGroupMode?_e(this.hass,"adjust.group_title",{count:this.entityIds.length}):this.friendlyName||this.entityId}
            </span>
            ${this._isGroupMode?V`
              <div class="modal-subtitle">
                ${this.friendlyNames.join(", ")}
              </div>
            `:""}
            <button class="modal-close" @click=${this._close}
              aria-label="${_e(this.hass,"a11y.close_adjust_modal")}">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="remaining-label">${_e(this.hass,"adjust.remaining")}</div>
            <div class="remaining-time">${yr(this.resumeAt,_e(this.hass,"status.resuming"))}</div>

            <div class="adjust-section">
              <div class="adjust-section-label">${_e(this.hass,"adjust.add_time")}</div>
              <div class="adjust-buttons">
                ${_s.map(e=>V`
                  <button type="button"
                    class="adjust-btn increment"
                    @click=${()=>this._fireAdjustTime(e.hours?{hours:e.hours}:{minutes:e.minutes})}
                    aria-label="${_e(this.hass,"a11y.add_minutes",{label:e.label})}">
                    ${e.label}
                  </button>
                `)}
              </div>
            </div>

            <div class="adjust-section">
              <div class="adjust-section-label">${_e(this.hass,"adjust.reduce_time")}</div>
              <div class="decrement-buttons">
                ${bs.map(e=>V`
                  <button type="button"
                    class="adjust-btn decrement"
                    ?disabled=${this._isDecrementDisabled(e.thresholdMs)}
                    @click=${()=>this._fireAdjustTime({minutes:e.minutes})}
                    aria-label="${_e(this.hass,"a11y.reduce_minutes",{label:e.label})}">
                    ${e.label}
                  </button>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `:V``}}ys.styles=gs,e([de({attribute:!1})],ys.prototype,"hass",void 0),e([de({type:Boolean})],ys.prototype,"open",void 0),e([de({type:String})],ys.prototype,"entityId",void 0),e([de({type:String})],ys.prototype,"friendlyName",void 0),e([de({type:String})],ys.prototype,"resumeAt",void 0),e([de({attribute:!1})],ys.prototype,"entityIds",void 0),e([de({attribute:!1})],ys.prototype,"friendlyNames",void 0),Ir("autosnooze-adjust-modal",ys);const xs=Symbol.for("autosnooze.registration.done.v1"),ws=new Set,zs="https://github.com/mossipcams/autosnooze#readme";function $s(){const e=window.customCards;return Array.isArray(e)?e:(void 0!==e&&(t="customCards-not-array",o=`[AutoSnooze] window.customCards was not an array (got ${typeof e}); resetting.`,ws.has(t)||(ws.add(t),console.warn(o))),[]);var t,o}function ks(e="0.2.27"){const t=function(e){return[{type:"autosnooze-card",name:"AutoSnooze Card",description:`Temporarily pause automations with area and label filtering (v${e})`,preview:!0,documentationURL:zs},{type:"autosnooze-snoozed-card",name:"AutoSnooze Snoozed Card",description:`Read-only view of currently snoozed automations and when they resume (v${e})`,preview:!0,documentationURL:zs}]}(e),o=$s();t.forEach(e=>{const t=o.findIndex(t=>t?.type===e.type);-1===t?o.push(e):o[t]={...o[t],...e}}),window.customCards=o}!function(){const e=globalThis;!0===e[xs]||(e[xs]=!0),ks()}();export{as as AutoSnoozeActivePauses,ys as AutoSnoozeAdjustModal,fs as AutoSnoozeAutomationList,ss as AutoSnoozeDurationSelector,ts as AutoSnoozeSnoozedCard,es as AutomationPauseCard,is as AutomationPauseCardEditor};
//# sourceMappingURL=autosnooze-card.js.map
