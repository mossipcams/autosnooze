function e(e,t,o,a){var i,s=arguments.length,r=s<3?t:null===a?a=Object.getOwnPropertyDescriptor(t,o):a;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,o,a);else for(var n=e.length-1;n>=0;n--)(i=e[n])&&(r=(s<3?i(r):s>3?i(t,o,r):i(t,o))||r);return s>3&&r&&Object.defineProperty(t,o,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,o=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),i=new WeakMap;let s=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(o&&void 0===e){const o=void 0!==t&&1===t.length;o&&(e=i.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&i.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const o=1===e.length?e[0]:t.reduce((t,o,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+e[a+1],e[0]);return new s(o,e,a)},n=o?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,a))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:u,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,m=globalThis,_=m.trustedTypes,g=_?_.emptyScript:"",b=m.reactiveElementPolyfillSupport,f=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=null!==e;break;case Number:o=null===e?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch(e){o=null}}return o}},x=(e,t)=>!l(e,t),v={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let z=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=v){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),a=this.getPropertyDescriptor(e,o,t);void 0!==a&&c(this.prototype,e,a)}}static getPropertyDescriptor(e,t,o){const{get:a,set:i}=u(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const s=a?.call(this);i?.call(this,t),this.requestUpdate(e,s,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??v}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...d(e),...h(e)];for(const o of t)this.createProperty(o,e[o])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,o]of t)this.elementProperties.set(e,o)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const o=this._$Eu(e,t);void 0!==o&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const e of o)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const o=t.attribute;return!1===o?void 0:"string"==typeof o?o:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,a)=>{if(o)e.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const o of a){const a=document.createElement("style"),i=t.litNonce;void 0!==i&&a.setAttribute("nonce",i),a.textContent=o.cssText,e.appendChild(a)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){const o=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,o);if(void 0!==a&&!0===o.reflect){const i=(void 0!==o.converter?.toAttribute?o.converter:y).toAttribute(t,o.type);this._$Em=e,null==i?this.removeAttribute(a):this.setAttribute(a,i),this._$Em=null}}_$AK(e,t){const o=this.constructor,a=o._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=o.getPropertyOptions(a),i="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=a;const s=i.fromAttribute(t,e.type);this[a]=s??this._$Ej?.get(a)??s,this._$Em=null}}requestUpdate(e,t,o,a=!1,i){if(void 0!==e){const s=this.constructor;if(!1===a&&(i=this[e]),o??=s.getPropertyOptions(e),!((o.hasChanged??x)(i,t)||o.useDefault&&o.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,o))))return;this.C(e,t,o)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:a,wrapped:i},s){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==i||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,o]of e){const{wrapped:e}=o,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,o,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};z.elementStyles=[],z.shadowRootOptions={mode:"open"},z[f("elementProperties")]=new Map,z[f("finalized")]=new Map,b?.({ReactiveElement:z}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,$=e=>e,A=w.trustedTypes,k=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,T="?"+C,D=`<${T}>`,P=document,E=()=>P.createComment(""),R=e=>null===e||"object"!=typeof e&&"function"!=typeof e,F=Array.isArray,L="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,O=/-->/g,U=/>/g,N=RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),H=/'/g,I=/"/g,j=/^(?:script|style|textarea|title)$/i,B=(e=>(t,...o)=>({_$litType$:e,strings:t,values:o}))(1),G=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),W=new WeakMap,V=P.createTreeWalker(P,129);function Y(e,t){if(!F(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const K=(e,t)=>{const o=e.length-1,a=[];let i,s=2===t?"<svg>":3===t?"<math>":"",r=M;for(let t=0;t<o;t++){const o=e[t];let n,l,c=-1,u=0;for(;u<o.length&&(r.lastIndex=u,l=r.exec(o),null!==l);)u=r.lastIndex,r===M?"!--"===l[1]?r=O:void 0!==l[1]?r=U:void 0!==l[2]?(j.test(l[2])&&(i=RegExp("</"+l[2],"g")),r=N):void 0!==l[3]&&(r=N):r===N?">"===l[0]?(r=i??M,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?N:'"'===l[3]?I:H):r===I||r===H?r=N:r===O||r===U?r=M:(r=N,i=void 0);const d=r===N&&e[t+1].startsWith("/>")?" ":"";s+=r===M?o+D:c>=0?(a.push(n),o.slice(0,c)+S+o.slice(c)+C+d):o+C+(-2===c?t:d)}return[Y(e,s+(e[o]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class Z{constructor({strings:e,_$litType$:t},o){let a;this.parts=[];let i=0,s=0;const r=e.length-1,n=this.parts,[l,c]=K(e,t);if(this.el=Z.createElement(l,o),V.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=V.nextNode())&&n.length<r;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(S)){const t=c[s++],o=a.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);n.push({type:1,index:i,name:r[2],strings:o,ctor:"."===r[1]?te:"?"===r[1]?oe:"@"===r[1]?ae:ee}),a.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:i}),a.removeAttribute(e));if(j.test(a.tagName)){const e=a.textContent.split(C),t=e.length-1;if(t>0){a.textContent=A?A.emptyScript:"";for(let o=0;o<t;o++)a.append(e[o],E()),V.nextNode(),n.push({type:2,index:++i});a.append(e[t],E())}}}else if(8===a.nodeType)if(a.data===T)n.push({type:2,index:i});else{let e=-1;for(;-1!==(e=a.data.indexOf(C,e+1));)n.push({type:7,index:i}),e+=C.length-1}i++}}static createElement(e,t){const o=P.createElement("template");return o.innerHTML=e,o}}function J(e,t,o=e,a){if(t===G)return t;let i=void 0!==a?o._$Co?.[a]:o._$Cl;const s=R(t)?void 0:t._$litDirective$;return i?.constructor!==s&&(i?._$AO?.(!1),void 0===s?i=void 0:(i=new s(e),i._$AT(e,o,a)),void 0!==a?(o._$Co??=[])[a]=i:o._$Cl=i),void 0!==i&&(t=J(e,i._$AS(e,t.values),i,a)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,a=(e?.creationScope??P).importNode(t,!0);V.currentNode=a;let i=V.nextNode(),s=0,r=0,n=o[0];for(;void 0!==n;){if(s===n.index){let t;2===n.type?t=new Q(i,i.nextSibling,this,e):1===n.type?t=new n.ctor(i,n.name,n.strings,this,e):6===n.type&&(t=new ie(i,this,e)),this._$AV.push(t),n=o[++r]}s!==n?.index&&(i=V.nextNode(),s++)}return V.currentNode=P,a}p(e){let t=0;for(const o of this._$AV)void 0!==o&&(void 0!==o.strings?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,o,a){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),R(e)?e===q||null==e||""===e?(this._$AH!==q&&this._$AR(),this._$AH=q):e!==this._$AH&&e!==G&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>F(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==q&&R(this._$AH)?this._$AA.nextSibling.data=e:this.T(P.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:o}=e,a="number"==typeof o?this._$AC(e):(void 0===o.el&&(o.el=Z.createElement(Y(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new X(a,this),o=e.u(this.options);e.p(t),this.T(o),this._$AH=e}}_$AC(e){let t=W.get(e.strings);return void 0===t&&W.set(e.strings,t=new Z(e)),t}k(e){F(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,a=0;for(const i of e)a===t.length?t.push(o=new Q(this.O(E()),this.O(E()),this,this.options)):o=t[a],o._$AI(i),a++;a<t.length&&(this._$AR(o&&o._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,a,i){this.type=1,this._$AH=q,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=i,o.length>2||""!==o[0]||""!==o[1]?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=q}_$AI(e,t=this,o,a){const i=this.strings;let s=!1;if(void 0===i)e=J(this,e,t,0),s=!R(e)||e!==this._$AH&&e!==G,s&&(this._$AH=e);else{const a=e;let r,n;for(e=i[0],r=0;r<i.length-1;r++)n=J(this,a[o+r],t,r),n===G&&(n=this._$AH[r]),s||=!R(n)||n!==this._$AH[r],n===q?e=q:e!==q&&(e+=(n??"")+i[r+1]),this._$AH[r]=n}s&&!a&&this.j(e)}j(e){e===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===q?void 0:e}}class oe extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==q)}}class ae extends ee{constructor(e,t,o,a,i){super(e,t,o,a,i),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??q)===G)return;const o=this._$AH,a=e===q&&o!==q||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,i=e!==q&&(o===q||a);a&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const se=w.litHtmlPolyfillSupport;se?.(Z,Q),(w.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;class ne extends z{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,o)=>{const a=o?.renderBefore??t;let i=a._$litPart$;if(void 0===i){const e=o?.renderBefore??null;a._$litPart$=i=new Q(t.insertBefore(E(),e),e,void 0,o??{})}return i._$AI(e),i})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const le=re.litElementPolyfillSupport;le?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const ce={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:x},ue=(e=ce,t,o)=>{const{kind:a,metadata:i}=o;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===a&&((e=Object.create(e)).wrapped=!0),s.set(o.name,e),"accessor"===a){const{name:a}=o;return{set(o){const i=t.get.call(this);t.set.call(this,o),this.requestUpdate(a,i,e,!0,o)},init(t){return void 0!==t&&this.C(a,void 0,e,t),t}}}if("setter"===a){const{name:a}=o;return function(o){const i=this[a];t.call(this,o),this.requestUpdate(a,i,e,!0,o)}}throw Error("Unsupported decorator location: "+a)};function de(e){return(t,o)=>"object"==typeof o?ue(e,t,o):((e,t,o)=>{const a=t.hasOwnProperty(o);return t.constructor.createProperty(o,e),a?Object.getOwnPropertyDescriptor(t,o):void 0})(e,t,o)}function he(e){return de({...e,state:!0,attribute:!1})}const pe={en:{group:{unassigned:"Unassigned",unlabeled:"Unlabeled",uncategorized:"Uncategorized"},button:{undo:"Undo",resume:"Resume",confirm_resume_all:"Confirm Resume All",resume_all:"Resume All",cancel:"Cancel",deselect_all:"Deselect All",select_all:"Select All",clear:"Clear",snoozing:"Snoozing...",schedule_count:"Schedule ({count})",snooze_count:"Snooze ({count})"},a11y:{undo_action:"Undo last action",snooze_date:"Snooze date",snooze_time:"Snooze time",resume_date:"Resume date",resume_time:"Resume time",custom_duration:"Custom duration",snoozed_region:"Snoozed automations",automations_resuming:"Automations resuming {time}",time_remaining:"Time remaining: {time}",resume_automation:"Resume {name}",confirm_resume_all:"Confirm resume all automations",resume_all:"Resume all paused automations",scheduled_region:"Scheduled snoozes",scheduled_pause_for:"Scheduled pause for {name}",cancel_scheduled_for:"Cancel scheduled pause for {name}",filter_tabs:"Filter automations by",automation_count:"{count} automations",area_count:"{count} areas",category_count:"{count} categories",label_count:"{count} labels",search:"Search automations by name",selection_actions:"Selection actions",deselect_all:"Deselect all visible automations",select_all:"Select all visible automations",clear_selection:"Clear selection",automations_list:"Automations list",snoozing:"Snoozing automations",schedule_snooze:"Schedule snooze for {count} automations",snooze_count:"Snooze {count} automations",select_automation:"Select {name}",group_header:"{name} group, {count} automations",group_count:"{count} automations",select_all_in_group:"Select all automations in {name}",snooze_last_duration:"Snooze for last used duration",snooze_for_duration:"Snooze for {duration}"},toast:{error:{resume_time_required:"Please set a complete resume date and time",invalid_datetime:"Invalid resume date/time",resume_time_past:"Resume time must be in the future",snooze_before_resume:"Snooze time must be before resume time",undo_failed:"Failed to undo. The automations may have already been modified.",resume_failed:"Failed to resume automation",resume_all_failed:"Failed to resume automations. Check Home Assistant logs for details.",cancel_failed:"Failed to cancel scheduled snooze"},success:{scheduled_one:"Scheduled 1 automation to snooze",scheduled_many:"Scheduled {count} automations to snooze",snoozed_until_one:"Snoozed 1 automation until {time}",snoozed_until_many:"Snoozed {count} automations until {time}",snoozed_for_one:"Snoozed 1 automation for {duration}",snoozed_for_many:"Snoozed {count} automations for {duration}",restored_one:"Restored 1 automation",restored_many:"Restored {count} automations",resumed:"Automation resumed successfully",resumed_all:"All automations resumed successfully",cancelled:"Scheduled snooze cancelled successfully"}},list:{empty:"No automations found"},schedule:{snooze_at:"Snooze at:",select_date:"Select date",hint_immediate:"Leave empty to snooze immediately",resume_at:"Resume at:",back_to_duration:"Back to duration selection",pick_datetime:"Pick specific date/time instead"},duration:{header:"Snooze Duration",placeholder:"e.g. 2h30m, 1.5h, 1d, 45m",preview_label:"Duration:",help:"Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h"},section:{snoozed_count:"Snoozed Automations ({count})",scheduled_count:"Scheduled Snoozes ({count})"},status:{resumes:"Resumes",disables:"Disables:",resumes_at:"Resumes:",active_count:"{count} active",scheduled_count:"{count} scheduled"},tab:{all:"All",areas:"Areas",categories:"Categories",labels:"Labels"},selection:{count:"{selected} of {total} selected"},card:{default_title:"AutoSnooze"},editor:{title_label:"Title",title_placeholder:"AutoSnooze"}},es:{group:{unassigned:"Sin asignar",unlabeled:"Sin etiqueta",uncategorized:"Sin categoría"},button:{undo:"Deshacer",resume:"Reanudar",confirm_resume_all:"Confirmar reanudar todo",resume_all:"Reanudar todo",cancel:"Cancelar",deselect_all:"Deseleccionar todo",select_all:"Seleccionar todo",clear:"Limpiar",snoozing:"Pausando...",schedule_count:"Programar ({count})",snooze_count:"Pausar ({count})"},a11y:{undo_action:"Deshacer última acción",snooze_date:"Fecha de pausa",snooze_time:"Hora de pausa",resume_date:"Fecha de reanudación",resume_time:"Hora de reanudación",custom_duration:"Duración personalizada",snoozed_region:"Automatizaciones pausadas",automations_resuming:"Automatizaciones que reanudan {time}",time_remaining:"Tiempo restante: {time}",resume_automation:"Reanudar {name}",confirm_resume_all:"Confirmar reanudar todas las automatizaciones",resume_all:"Reanudar todas las automatizaciones pausadas",scheduled_region:"Pausas programadas",scheduled_pause_for:"Pausa programada para {name}",cancel_scheduled_for:"Cancelar pausa programada para {name}",filter_tabs:"Filtrar automatizaciones por",automation_count:"{count} automatizaciones",area_count:"{count} áreas",category_count:"{count} categorías",label_count:"{count} etiquetas",search:"Buscar automatizaciones por nombre",selection_actions:"Acciones de selección",deselect_all:"Deseleccionar todas las automatizaciones visibles",select_all:"Seleccionar todas las automatizaciones visibles",clear_selection:"Limpiar selección",automations_list:"Lista de automatizaciones",snoozing:"Pausando automatizaciones",schedule_snooze:"Programar pausa para {count} automatizaciones",snooze_count:"Pausar {count} automatizaciones",select_automation:"Seleccionar {name}",group_header:"Grupo {name}, {count} automatizaciones",group_count:"{count} automatizaciones",select_all_in_group:"Seleccionar todas en {name}",snooze_last_duration:"Pausar con última duración",snooze_for_duration:"Pausar durante {duration}"},toast:{error:{resume_time_required:"Por favor, establece una fecha y hora de reanudación completas",invalid_datetime:"Fecha/hora de reanudación inválida",resume_time_past:"La hora de reanudación debe ser en el futuro",snooze_before_resume:"La hora de pausa debe ser anterior a la hora de reanudación",undo_failed:"Error al deshacer. Las automatizaciones pueden haber sido modificadas.",resume_failed:"Error al reanudar la automatización",resume_all_failed:"Error al reanudar las automatizaciones. Consulta los registros de Home Assistant.",cancel_failed:"Error al cancelar la pausa programada"},success:{scheduled_one:"1 automatización programada para pausar",scheduled_many:"{count} automatizaciones programadas para pausar",snoozed_until_one:"1 automatización pausada hasta {time}",snoozed_until_many:"{count} automatizaciones pausadas hasta {time}",snoozed_for_one:"1 automatización pausada por {duration}",snoozed_for_many:"{count} automatizaciones pausadas por {duration}",restored_one:"1 automatización restaurada",restored_many:"{count} automatizaciones restauradas",resumed:"Automatización reanudada correctamente",resumed_all:"Todas las automatizaciones reanudadas correctamente",cancelled:"Pausa programada cancelada correctamente"}},list:{empty:"No se encontraron automatizaciones"},schedule:{snooze_at:"Pausar a las:",select_date:"Seleccionar fecha",hint_immediate:"Dejar vacío para pausar inmediatamente",resume_at:"Reanudar a las:",back_to_duration:"Volver a selección de duración",pick_datetime:"Elegir fecha/hora específica"},duration:{header:"Duración de la pausa",placeholder:"ej. 2h30m, 1.5h, 1d, 45m",preview_label:"Duración:",help:"Introducir duración: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h"},section:{snoozed_count:"Automatizaciones pausadas ({count})",scheduled_count:"Pausas programadas ({count})"},status:{resumes:"Reanuda",disables:"Desactiva:",resumes_at:"Reanuda:",active_count:"{count} activas",scheduled_count:"{count} programadas"},tab:{all:"Todo",areas:"Áreas",categories:"Categorías",labels:"Etiquetas"},selection:{count:"{selected} de {total} seleccionadas"},card:{default_title:"AutoSnooze"},editor:{title_label:"Título",title_placeholder:"AutoSnooze"}},fr:{group:{unassigned:"Non assigné",unlabeled:"Sans étiquette",uncategorized:"Sans catégorie"},button:{undo:"Annuler",resume:"Reprendre",confirm_resume_all:"Confirmer tout reprendre",resume_all:"Tout reprendre",cancel:"Annuler",deselect_all:"Tout désélectionner",select_all:"Tout sélectionner",clear:"Effacer",snoozing:"Mise en pause...",schedule_count:"Programmer ({count})",snooze_count:"Pause ({count})"},a11y:{undo_action:"Annuler la dernière action",snooze_date:"Date de pause",snooze_time:"Heure de pause",resume_date:"Date de reprise",resume_time:"Heure de reprise",custom_duration:"Durée personnalisée",snoozed_region:"Automatisations en pause",automations_resuming:"Automatisations reprenant {time}",time_remaining:"Temps restant : {time}",resume_automation:"Reprendre {name}",confirm_resume_all:"Confirmer la reprise de toutes les automatisations",resume_all:"Reprendre toutes les automatisations en pause",scheduled_region:"Pauses programmées",scheduled_pause_for:"Pause programmée pour {name}",cancel_scheduled_for:"Annuler la pause programmée pour {name}",filter_tabs:"Filtrer les automatisations par",automation_count:"{count} automatisations",area_count:"{count} zones",category_count:"{count} catégories",label_count:"{count} étiquettes",search:"Rechercher des automatisations par nom",selection_actions:"Actions de sélection",deselect_all:"Désélectionner toutes les automatisations visibles",select_all:"Sélectionner toutes les automatisations visibles",clear_selection:"Effacer la sélection",automations_list:"Liste des automatisations",snoozing:"Mise en pause des automatisations",schedule_snooze:"Programmer la pause pour {count} automatisations",snooze_count:"Mettre en pause {count} automatisations",select_automation:"Sélectionner {name}",group_header:"Groupe {name}, {count} automatisations",group_count:"{count} automatisations",select_all_in_group:"Tout sélectionner dans {name}",snooze_last_duration:"Pause pour dernière durée",snooze_for_duration:"Pause pour {duration}"},toast:{error:{resume_time_required:"Veuillez définir une date et heure de reprise complètes",invalid_datetime:"Date/heure de reprise invalide",resume_time_past:"L'heure de reprise doit être dans le futur",snooze_before_resume:"L'heure de pause doit être avant l'heure de reprise",undo_failed:"Échec de l'annulation. Les automatisations ont peut-être déjà été modifiées.",resume_failed:"Échec de la reprise de l'automatisation",resume_all_failed:"Échec de la reprise des automatisations. Consultez les journaux de Home Assistant.",cancel_failed:"Échec de l'annulation de la pause programmée"},success:{scheduled_one:"1 automatisation programmée pour pause",scheduled_many:"{count} automatisations programmées pour pause",snoozed_until_one:"1 automatisation en pause jusqu'à {time}",snoozed_until_many:"{count} automatisations en pause jusqu'à {time}",snoozed_for_one:"1 automatisation en pause pendant {duration}",snoozed_for_many:"{count} automatisations en pause pendant {duration}",restored_one:"1 automatisation restaurée",restored_many:"{count} automatisations restaurées",resumed:"Automatisation reprise avec succès",resumed_all:"Toutes les automatisations ont été reprises avec succès",cancelled:"Pause programmée annulée avec succès"}},list:{empty:"Aucune automatisation trouvée"},schedule:{snooze_at:"Pause à :",select_date:"Sélectionner la date",hint_immediate:"Laisser vide pour mettre en pause immédiatement",resume_at:"Reprendre à :",back_to_duration:"Retour à la sélection de durée",pick_datetime:"Choisir une date/heure spécifique"},duration:{header:"Durée de la pause",placeholder:"ex. 2h30m, 1.5h, 1j, 45m",preview_label:"Durée :",help:"Entrer la durée : 30m, 2h, 1.5h, 4h30m, 1j, 1j2h"},section:{snoozed_count:"Automatisations en pause ({count})",scheduled_count:"Pauses programmées ({count})"},status:{resumes:"Reprend",disables:"Désactive :",resumes_at:"Reprend :",active_count:"{count} actives",scheduled_count:"{count} programmées"},tab:{all:"Tout",areas:"Zones",categories:"Catégories",labels:"Étiquettes"},selection:{count:"{selected} sur {total} sélectionnées"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titre",title_placeholder:"AutoSnooze"}},de:{group:{unassigned:"Nicht zugewiesen",unlabeled:"Ohne Label",uncategorized:"Ohne Kategorie"},button:{undo:"Rückgängig",resume:"Fortsetzen",confirm_resume_all:"Alle fortsetzen bestätigen",resume_all:"Alle fortsetzen",cancel:"Abbrechen",deselect_all:"Alle abwählen",select_all:"Alle auswählen",clear:"Löschen",snoozing:"Pausiere...",schedule_count:"Planen ({count})",snooze_count:"Pausieren ({count})"},a11y:{undo_action:"Letzte Aktion rückgängig machen",snooze_date:"Pausendatum",snooze_time:"Pausenzeit",resume_date:"Wiederaufnahmedatum",resume_time:"Wiederaufnahmezeit",custom_duration:"Benutzerdefinierte Dauer",snoozed_region:"Pausierte Automatisierungen",automations_resuming:"Automatisierungen werden fortgesetzt {time}",time_remaining:"Verbleibende Zeit: {time}",resume_automation:"{name} fortsetzen",confirm_resume_all:"Bestätigen: Alle Automatisierungen fortsetzen",resume_all:"Alle pausierten Automatisierungen fortsetzen",scheduled_region:"Geplante Pausen",scheduled_pause_for:"Geplante Pause für {name}",cancel_scheduled_for:"Geplante Pause für {name} abbrechen",filter_tabs:"Automatisierungen filtern nach",automation_count:"{count} Automatisierungen",area_count:"{count} Bereiche",category_count:"{count} Kategorien",label_count:"{count} Labels",search:"Automatisierungen nach Name suchen",selection_actions:"Auswahlaktionen",deselect_all:"Alle sichtbaren Automatisierungen abwählen",select_all:"Alle sichtbaren Automatisierungen auswählen",clear_selection:"Auswahl löschen",automations_list:"Automatisierungsliste",snoozing:"Automatisierungen werden pausiert",schedule_snooze:"Pause planen für {count} Automatisierungen",snooze_count:"{count} Automatisierungen pausieren",select_automation:"{name} auswählen",group_header:"Gruppe {name}, {count} Automatisierungen",group_count:"{count} Automatisierungen",select_all_in_group:"Alle in {name} auswählen",snooze_last_duration:"Letzte Dauer verwenden",snooze_for_duration:"Für {duration} pausieren"},toast:{error:{resume_time_required:"Bitte vollständiges Wiederaufnahmedatum und -zeit angeben",invalid_datetime:"Ungültiges Wiederaufnahmedatum/-zeit",resume_time_past:"Wiederaufnahmezeit muss in der Zukunft liegen",snooze_before_resume:"Pausenzeit muss vor der Wiederaufnahmezeit liegen",undo_failed:"Rückgängig machen fehlgeschlagen. Die Automatisierungen wurden möglicherweise bereits geändert.",resume_failed:"Fortsetzen der Automatisierung fehlgeschlagen",resume_all_failed:"Fortsetzen der Automatisierungen fehlgeschlagen. Prüfen Sie die Home Assistant Logs.",cancel_failed:"Abbrechen der geplanten Pause fehlgeschlagen"},success:{scheduled_one:"1 Automatisierung zum Pausieren geplant",scheduled_many:"{count} Automatisierungen zum Pausieren geplant",snoozed_until_one:"1 Automatisierung pausiert bis {time}",snoozed_until_many:"{count} Automatisierungen pausiert bis {time}",snoozed_for_one:"1 Automatisierung pausiert für {duration}",snoozed_for_many:"{count} Automatisierungen pausiert für {duration}",restored_one:"1 Automatisierung wiederhergestellt",restored_many:"{count} Automatisierungen wiederhergestellt",resumed:"Automatisierung erfolgreich fortgesetzt",resumed_all:"Alle Automatisierungen erfolgreich fortgesetzt",cancelled:"Geplante Pause erfolgreich abgebrochen"}},list:{empty:"Keine Automatisierungen gefunden"},schedule:{snooze_at:"Pausieren um:",select_date:"Datum wählen",hint_immediate:"Leer lassen für sofortige Pause",resume_at:"Fortsetzen um:",back_to_duration:"Zurück zur Dauerauswahl",pick_datetime:"Stattdessen bestimmtes Datum/Zeit wählen"},duration:{header:"Pausendauer",placeholder:"z.B. 2h30m, 1.5h, 1d, 45m",preview_label:"Dauer:",help:"Dauer eingeben: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h"},section:{snoozed_count:"Pausierte Automatisierungen ({count})",scheduled_count:"Geplante Pausen ({count})"},status:{resumes:"Fortsetzung",disables:"Deaktiviert:",resumes_at:"Fortsetzung:",active_count:"{count} aktiv",scheduled_count:"{count} geplant"},tab:{all:"Alle",areas:"Bereiche",categories:"Kategorien",labels:"Labels"},selection:{count:"{selected} von {total} ausgewählt"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titel",title_placeholder:"AutoSnooze"}},it:{group:{unassigned:"Non assegnato",unlabeled:"Senza etichetta",uncategorized:"Senza categoria"},button:{undo:"Annulla",resume:"Riprendi",confirm_resume_all:"Conferma riprendi tutto",resume_all:"Riprendi tutto",cancel:"Annulla",deselect_all:"Deseleziona tutto",select_all:"Seleziona tutto",clear:"Cancella",snoozing:"Messa in pausa...",schedule_count:"Programma ({count})",snooze_count:"Pausa ({count})"},a11y:{undo_action:"Annulla ultima azione",snooze_date:"Data pausa",snooze_time:"Ora pausa",resume_date:"Data ripresa",resume_time:"Ora ripresa",custom_duration:"Durata personalizzata",snoozed_region:"Automazioni in pausa",automations_resuming:"Automazioni che riprendono {time}",time_remaining:"Tempo rimanente: {time}",resume_automation:"Riprendi {name}",confirm_resume_all:"Conferma ripresa di tutte le automazioni",resume_all:"Riprendi tutte le automazioni in pausa",scheduled_region:"Pause programmate",scheduled_pause_for:"Pausa programmata per {name}",cancel_scheduled_for:"Annulla pausa programmata per {name}",filter_tabs:"Filtra automazioni per",automation_count:"{count} automazioni",area_count:"{count} aree",category_count:"{count} categorie",label_count:"{count} etichette",search:"Cerca automazioni per nome",selection_actions:"Azioni selezione",deselect_all:"Deseleziona tutte le automazioni visibili",select_all:"Seleziona tutte le automazioni visibili",clear_selection:"Cancella selezione",automations_list:"Lista automazioni",snoozing:"Messa in pausa delle automazioni",schedule_snooze:"Programma pausa per {count} automazioni",snooze_count:"Metti in pausa {count} automazioni",select_automation:"Seleziona {name}",group_header:"Gruppo {name}, {count} automazioni",group_count:"{count} automazioni",select_all_in_group:"Seleziona tutto in {name}",snooze_last_duration:"Pausa per ultima durata",snooze_for_duration:"Pausa per {duration}"},toast:{error:{resume_time_required:"Imposta una data e ora di ripresa complete",invalid_datetime:"Data/ora di ripresa non valida",resume_time_past:"L'ora di ripresa deve essere nel futuro",snooze_before_resume:"L'ora di pausa deve essere prima dell'ora di ripresa",undo_failed:"Annullamento fallito. Le automazioni potrebbero essere già state modificate.",resume_failed:"Ripresa dell'automazione fallita",resume_all_failed:"Ripresa delle automazioni fallita. Controlla i log di Home Assistant.",cancel_failed:"Annullamento della pausa programmata fallito"},success:{scheduled_one:"1 automazione programmata per la pausa",scheduled_many:"{count} automazioni programmate per la pausa",snoozed_until_one:"1 automazione in pausa fino a {time}",snoozed_until_many:"{count} automazioni in pausa fino a {time}",snoozed_for_one:"1 automazione in pausa per {duration}",snoozed_for_many:"{count} automazioni in pausa per {duration}",restored_one:"1 automazione ripristinata",restored_many:"{count} automazioni ripristinate",resumed:"Automazione ripresa con successo",resumed_all:"Tutte le automazioni riprese con successo",cancelled:"Pausa programmata annullata con successo"}},list:{empty:"Nessuna automazione trovata"},schedule:{snooze_at:"Pausa alle:",select_date:"Seleziona data",hint_immediate:"Lascia vuoto per mettere in pausa immediatamente",resume_at:"Riprendi alle:",back_to_duration:"Torna alla selezione durata",pick_datetime:"Scegli data/ora specifica"},duration:{header:"Durata pausa",placeholder:"es. 2h30m, 1.5h, 1g, 45m",preview_label:"Durata:",help:"Inserisci durata: 30m, 2h, 1.5h, 4h30m, 1g, 1g2h"},section:{snoozed_count:"Automazioni in pausa ({count})",scheduled_count:"Pause programmate ({count})"},status:{resumes:"Riprende",disables:"Disattiva:",resumes_at:"Riprende:",active_count:"{count} attive",scheduled_count:"{count} programmate"},tab:{all:"Tutto",areas:"Aree",categories:"Categorie",labels:"Etichette"},selection:{count:"{selected} di {total} selezionate"},card:{default_title:"AutoSnooze"},editor:{title_label:"Titolo",title_placeholder:"AutoSnooze"}}},me={en:"en","en-GB":"en","en-US":"en",es:"es","es-ES":"es","es-419":"es",fr:"fr","fr-FR":"fr","fr-CA":"fr",de:"de","de-DE":"de","de-AT":"de","de-CH":"de",it:"it","it-IT":"it"};const _e=new Set;function ge(e,t){const o=t.split(".");let a=e;for(const e of o){if(!a||"object"!=typeof a||!(e in a))return;a=a[e]}return"string"==typeof a?a:void 0}function be(e,t,o){const a=function(e){if(!e)return"en";const t=e.language??e.locale?.language;if(!t)return"en";const o=me[t];if(o)return o;const a=t.split("-")[0];if(a){const e=me[a];if(e)return e}return"en"}(e),i=pe[a];let s=i?ge(i,t):void 0;return s||"en"===a||(s=ge(pe.en,t)),s?function(e,t){return t?e.replace(/\{(\w+)\}/g,(e,o)=>{const a=t[o];return void 0!==a?String(a):e}):e}(s,o):(_e.has(t)||(_e.add(t),console.warn(`[AutoSnooze] Missing translation for key: ${t}`)),t)}const fe=r`
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
`,ye=1e3,xe=6e4,ve=36e5,ze=864e5,we=60,$e=1440,Ae=300,ke=300,Se=3e3,Ce=5e3,Te=1e3,De=5e3,Pe=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"1d",minutes:1440},{label:"Custom",minutes:null}],Ee={not_automation:"Failed to snooze: One or more selected items are not automations",invalid_duration:"Failed to snooze: Please specify a valid duration (days, hours, or minutes)",resume_time_past:"Failed to snooze: Resume time must be in the future",disable_after_resume:"Failed to snooze: Snooze time must be before resume time"},Re="autosnooze_exclude",Fe="autosnooze_include";function Le(e,t,o){const a=[];return e>0&&a.push(`${e} day${1!==e?"s":""}`),t>0&&a.push(`${t} hour${1!==t?"s":""}`),o>0&&a.push(`${o} minute${1!==o?"s":""}`),a.join(", ")}function Me(e,t,o){const a=[];return e>0&&a.push(`${e}d`),t>0&&a.push(`${t}h`),o>0&&a.push(`${o}m`),a.join(" ")||"0m"}function Oe(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let o=0,a=!1;const i=t.match(/(\d+(?:\.\d+)?)\s*d/),s=t.match(/(\d+(?:\.\d+)?)\s*h/),r=t.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(i?.[1]){const e=parseFloat(i[1]);if(isNaN(e)||e<0)return null;o+=e*$e,a=!0}if(s?.[1]){const e=parseFloat(s[1]);if(isNaN(e)||e<0)return null;o+=e*we,a=!0}if(r?.[1]){const e=parseFloat(r[1]);if(isNaN(e)||e<0)return null;o+=e,a=!0}if(!a){const e=parseFloat(t);if(isNaN(e)||!(e>0))return null;o=e}if(o=Math.round(o),o<=0)return null;const n=Math.floor(o/$e),l=o%$e;return{days:n,hours:Math.floor(l/we),minutes:l%we}}function Ue(e){return e.days*$e+e.hours*we+e.minutes}function Ne(e,t){if(!e||!t)return null;const o=new Date(`${e}T${t}`).getTimezoneOffset(),a=o<=0?"+":"-",i=Math.abs(o);return`${e}T${t}${`${a}${String(Math.floor(i/60)).padStart(2,"0")}:${String(i%60).padStart(2,"0")}`}`}function He(e="light"){!function(e,t,o){const a=new CustomEvent(`hass-${t}`,{bubbles:!0,composed:!0,detail:o});e.dispatchEvent(a)}(window,"haptic",e)}function Ie(e,t){const o=e,a=o?.translation_key??o?.data?.translation_key;if(a&&Ee[a])return Ee[a];const i=o?.message??"";for(const[e,t]of Object.entries(Ee))if(i.includes(e)||i.toLowerCase().includes(e.replace(/_/g," ")))return t;return`${t}. Check Home Assistant logs for details.`}async function je(e,t){try{await e.callService("autosnooze","pause",t)}catch(e){throw console.error("[AutoSnooze] Failed to pause automations:",e),e}}async function Be(e,t){try{await e.callService("autosnooze","cancel",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to wake automation:",e),e}}async function Ge(e,t){try{await e.callService("autosnooze","cancel_scheduled",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to cancel scheduled snooze:",e),e}}const qe="autosnooze_last_duration";function We(e){return e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}function Ve(e,t,o){return!(!e.labels||0===e.labels.length)&&e.labels.some(e=>{const a=o[e]?.name;return a?.toLowerCase()===t})}function Ye(e,t,o){const a={};return e.forEach(e=>{const i=t(e);i&&0!==i.length?i.forEach(t=>{a[t]||(a[t]=[]),a[t].push(e)}):(a[o]||(a[o]=[]),a[o].push(e))}),Object.entries(a).sort((e,t)=>e[0]===o?1:t[0]===o?-1:e[0].localeCompare(t[0]))}function Ke(e,t){const o=new Set;return e.forEach(e=>{const a=t(e);a&&a.forEach(e=>o.add(e))}),o.size}const Ze="sensor.autosnooze_snoozed_automations";function Je(e){const t=e?.states?.[Ze];return t?.attributes?.paused_automations??{}}class Xe extends ne{constructor(){super(...arguments),this.config={},this._selected=[],this._duration=30*xe,this._customDuration={days:0,hours:0,minutes:30},this._customDurationInput="30m",this._loading=!1,this._search="",this._filterTab="all",this._expandedGroups={},this._scheduleMode=!1,this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime="",this._labelRegistry={},this._categoryRegistry={},this._entityRegistry={},this._showCustomInput=!1,this._automationsCache=null,this._automationsCacheVersion=0,this._wakeAllPending=!1,this._lastDuration=null,this._interval=null,this._syncTimeout=null,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._lastHassStates=null,this._lastCacheVersion=0,this._searchTimeout=null,this._wakeAllTimeout=null,this._toastTimeout=null,this._toastFadeTimeout=null}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-card",title:"AutoSnooze"}}setConfig(e){this.config=e}getCardSize(){const e=this._getPaused(),t=this._getScheduled();return 4+Object.keys(e).length+Object.keys(t).length}shouldUpdate(e){if(!e.has("hass"))return!0;const t=e.get("hass"),o=this.hass;if(!t||!o)return!0;const a=t.states?.["sensor.autosnooze_snoozed_automations"],i=o.states?.["sensor.autosnooze_snoozed_automations"];if(a!==i)return!0;if(t.entities!==o.entities)return!0;if(t.areas!==o.areas)return!0;if((t.language??t.locale?.language)!==(o.language??o.locale?.language))return!0;const s=o.states??{},r=t.states??{};for(const e of Object.keys(s))if(e.startsWith("automation.")&&r[e]!==s[e])return!0;for(const e of Object.keys(r))if(e.startsWith("automation.")&&!s[e])return!0;return!1}updated(e){super.updated(e),e.has("hass")&&this.hass?.connection&&(this._labelsFetched||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}connectedCallback(){super.connectedCallback(),this._interval&&(window.clearInterval(this._interval),this._interval=null),this._syncTimeout&&(window.clearTimeout(this._syncTimeout),this._syncTimeout=null),this._startSynchronizedCountdown(),this._fetchLabelRegistry(),this._fetchCategoryRegistry(),this._fetchEntityRegistry(),this._lastDuration=function(){try{const e=localStorage.getItem(qe);if(!e)return null;const t=JSON.parse(e);return"number"!=typeof t.minutes||"number"!=typeof t.duration?.days||"number"!=typeof t.duration?.hours||"number"!=typeof t.duration?.minutes?null:t}catch{return null}}()}disconnectedCallback(){super.disconnectedCallback(),null!==this._interval&&(clearInterval(this._interval),this._interval=null),null!==this._syncTimeout&&(clearTimeout(this._syncTimeout),this._syncTimeout=null),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),null!==this._toastTimeout&&(clearTimeout(this._toastTimeout),this._toastTimeout=null),null!==this._toastFadeTimeout&&(clearTimeout(this._toastFadeTimeout),this._toastFadeTimeout=null)}_startSynchronizedCountdown(){const e=1e3-Date.now()%1e3;this._syncTimeout=window.setTimeout(()=>{this._syncTimeout=null,this._updateCountdownIfNeeded(),this._interval=window.setInterval(()=>{this._updateCountdownIfNeeded()},Te)},e)}_updateCountdownIfNeeded(){if(!this.hass)return;const e=Je(this.hass);Object.keys(e).length>0&&this.requestUpdate()}async _fetchLabelRegistry(){!this._labelsFetched&&this.hass?.connection&&(this._labelRegistry=await async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/label_registry/list"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.label_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch label registry:",e),{}}}(this.hass),this._labelsFetched=!0)}async _fetchCategoryRegistry(){!this._categoriesFetched&&this.hass?.connection&&(this._categoryRegistry=await async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.category_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch category registry:",e),{}}}(this.hass),this._categoriesFetched=!0)}async _fetchEntityRegistry(){!this._entityRegistryFetched&&this.hass?.connection&&(this._entityRegistry=await async function(e){try{const t=await e.connection.sendMessagePromise({type:"config/entity_registry/list"}),o={};return Array.isArray(t)&&t.filter(e=>e.entity_id.startsWith("automation.")).forEach(e=>{o[e.entity_id]=e}),o}catch(e){return console.warn("[AutoSnooze] Failed to fetch entity registry:",e),{}}}(this.hass),this._entityRegistryFetched=!0,this._automationsCacheVersion++)}_getAutomations(){if(!this.hass?.states)return[];const e=this.hass.states,t=this._automationsCacheVersion;if(this._lastHassStates===e&&this._lastCacheVersion===t&&this._automationsCache)return this._automationsCache;const o=function(e,t){const o=e?.states,a=e?.entities;if(!o)return[];const i=Object.keys(o).filter(e=>e.startsWith("automation.")).map(e=>{const i=o[e];if(!i)return null;const s=t?.[e],r=a?.[e],n=(s?.categories??{}).automation??null;return{id:e,name:i.attributes?.friendly_name??e.replace("automation.",""),area_id:s?.area_id??r?.area_id??null,category_id:n,labels:s?.labels??r?.labels??[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name));return i}(this.hass,this._entityRegistry);return this._automationsCache=o,this._lastCacheVersion=t,this._lastHassStates=e,o}_getFilteredAutomations(){return function(e,t,o){let a=e;const i=e.some(e=>Ve(e,Fe,o));a=i?a.filter(e=>Ve(e,Fe,o)):a.filter(e=>!Ve(e,Re,o));const s=t.toLowerCase();return s&&(a=a.filter(e=>e.name.toLowerCase().includes(s)||e.id.toLowerCase().includes(s))),a}(this._getAutomations(),this._search,this._labelRegistry)}_getAreaName(e){return this.hass?function(e,t){return e?t.areas?.[e]?.name??We(e):"Unassigned"}(e,this.hass):be(this.hass,"group.unassigned")}_getLabelName(e){return function(e,t){return t[e]?.name??We(e)}(e,this._labelRegistry)}_getCategoryName(e){return function(e,t){return e?t[e]?.name??We(e):"Uncategorized"}(e,this._categoryRegistry)}_getGroupedByArea(){return Ye(this._getFilteredAutomations(),e=>e.area_id?[this._getAreaName(e.area_id)]:null,be(this.hass,"group.unassigned"))}_getGroupedByLabel(){const e=this._getFilteredAutomations(),t=[Re.toLowerCase(),Fe.toLowerCase()];return Ye(e,e=>{if(!e.labels?.length)return null;const o=e.labels.map(e=>this._getLabelName(e)).filter(e=>!t.includes(e.toLowerCase()));return o.length>0?o:null},be(this.hass,"group.unlabeled"))}_getGroupedByCategory(){return Ye(this._getFilteredAutomations(),e=>e.category_id?[this._getCategoryName(e.category_id)]:null,be(this.hass,"group.uncategorized"))}_getAreaCount(){return Ke(this._getAutomations(),e=>e.area_id?[e.area_id]:null)}_getLabelCount(){const e=this._getAutomations(),t=[Re.toLowerCase(),Fe.toLowerCase()];return Ke(e,e=>{if(!e.labels?.length)return null;const o=e.labels.filter(e=>!t.includes(this._getLabelName(e).toLowerCase()));return o.length>0?o:null})}_getCategoryCount(){return Ke(this._getAutomations(),e=>e.category_id?[e.category_id]:null)}_getPaused(){return this.hass?Je(this.hass):{}}_getPausedGroupedByResumeTime(){return this.hass?function(e){const t=Je(e),o={};return Object.entries(t).forEach(([e,t])=>{const a=t.resume_at;o[a]||(o[a]={resumeAt:a,disableAt:t.disable_at,automations:[]}),o[a].automations.push({entity_id:e,friendly_name:t.friendly_name,resume_at:t.resume_at,paused_at:t.paused_at,days:t.days,hours:t.hours,minutes:t.minutes,disable_at:t.disable_at})}),Object.values(o).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}(this.hass):[]}_getScheduled(){return this.hass?function(e){const t=e?.states?.[Ze];return t?.attributes?.scheduled_snoozes??{}}(this.hass):{}}_formatDateTime(e){return function(e,t){const o=new Date(e),a=new Date,i={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return o.getFullYear()>a.getFullYear()&&(i.year="numeric"),o.toLocaleString(t,i)}(e,this._getLocale())}_formatCountdown(e){return function(e){const t=new Date(e).getTime()-Date.now();if(t<=0)return"Resuming...";const o=Math.floor(t/ze),a=Math.floor(t%ze/ve),i=Math.floor(t%ve/xe),s=Math.floor(t%xe/ye);return o>0?`${o}d ${a}h ${i}m`:a>0?`${a}h ${i}m ${s}s`:`${i}m ${s}s`}(e)}_getLocale(){return this.hass?.locale?.language}_toggleSelection(e){He("selection"),this._selected.includes(e)?this._selected=this._selected.filter(t=>t!==e):this._selected=[...this._selected,e]}_toggleGroupExpansion(e){this._expandedGroups={...this._expandedGroups,[e]:!this._expandedGroups[e]}}_selectGroup(e){const t=e.map(e=>e.id),o=t.every(e=>this._selected.includes(e));this._selected=o?this._selected.filter(e=>!t.includes(e)):[...new Set([...this._selected,...t])]}_selectAllVisible(){const e=this._getFilteredAutomations().map(e=>e.id),t=e.every(e=>this._selected.includes(e));this._selected=t?this._selected.filter(t=>!e.includes(t)):[...new Set([...this._selected,...e])]}_clearSelection(){this._selected=[]}_setDuration(e){this._duration=e*xe;const t=function(e){const t=Math.floor(e/$e),o=e%$e;return{days:t,hours:Math.floor(o/we),minutes:o%we}}(e);this._customDuration=t,this._customDurationInput=Me(t.days,t.hours,t.minutes)}_updateCustomDuration(){const e=Ue(this._customDuration);this._duration=e*xe}_handleDurationInput(e){this._customDurationInput=e;const t=Oe(e);t&&(this._customDuration=t,this._updateCustomDuration())}_getDurationPreview(){const e=Oe(this._customDurationInput);return e?Le(e.days,e.hours,e.minutes):""}_isDurationValid(){return null!==Oe(this._customDurationInput)}_enterScheduleMode(){const{date:e,time:t}=function(){const e=new Date;return{date:`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,time:`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}}();this._scheduleMode=!0,this._disableAtDate=e,this._disableAtTime=t,this._resumeAtDate=e,this._resumeAtTime=t}_hasResumeAt(){return Boolean(this._resumeAtDate&&this._resumeAtTime)}_hasDisableAt(){return Boolean(this._disableAtDate&&this._disableAtTime)}_parseDurationInput(e){return Oe(e)}_formatDuration(e,t,o){return Le(e,t,o)}_combineDateTime(e,t){return Ne(e,t)}_getErrorMessage(e,t){return Ie(e,t)}_formatRegistryId(e){return We(e)}_handleKeyDown(e,t){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),t())}_hapticFeedback(e="light"){He(e)}_handleSearchInput(e){const t=e.target.value;null!==this._searchTimeout&&clearTimeout(this._searchTimeout),this._searchTimeout=window.setTimeout(()=>{this._search=t,this._searchTimeout=null},Ae)}_showToast(e,t={}){const{showUndo:o=!1,onUndo:a=null}=t;if(!this.shadowRoot)return;const i=this.shadowRoot.querySelector(".toast");i&&i.remove();const s=document.createElement("div");if(s.className="toast",s.setAttribute("role","alert"),s.setAttribute("aria-live","polite"),s.setAttribute("aria-atomic","true"),o&&a){const t=document.createElement("span");t.textContent=e,s.appendChild(t);const o=document.createElement("button");o.className="toast-undo-btn",o.textContent=be(this.hass,"button.undo"),o.setAttribute("aria-label",be(this.hass,"a11y.undo_action")),o.addEventListener("click",e=>{e.stopPropagation(),a(),s.remove()}),s.appendChild(o)}else s.textContent=e;this.shadowRoot.appendChild(s),null!==this._toastTimeout&&clearTimeout(this._toastTimeout),null!==this._toastFadeTimeout&&clearTimeout(this._toastFadeTimeout),this._toastTimeout=window.setTimeout(()=>{this._toastTimeout=null,this.shadowRoot&&s.parentNode&&(s.style.animation=`slideUp ${ke}ms ease-out reverse`,this._toastFadeTimeout=window.setTimeout(()=>{this._toastFadeTimeout=null,s.parentNode&&s.remove()},ke))},Ce)}async _snooze(){if(0!==this._selected.length&&!this._loading){if(this._scheduleMode){if(!this._hasResumeAt())return void this._showToast(be(this.hass,"toast.error.resume_time_required"));const e=this._hasDisableAt()?Ne(this._disableAtDate,this._disableAtTime):null,t=Ne(this._resumeAtDate,this._resumeAtTime);if(!t)return void this._showToast(be(this.hass,"toast.error.invalid_datetime"));const o=Date.now()+De,a=new Date(t).getTime();if(a<=o)return void this._showToast(be(this.hass,"toast.error.resume_time_past"));if(e){if(new Date(e).getTime()>=a)return void this._showToast(be(this.hass,"toast.error.snooze_before_resume"))}}else if(0===this._duration)return;this._loading=!0;try{if(!this.hass)return void(this._loading=!1);const e=this._selected.length,t=[...this._selected],o=this._scheduleMode,a=this._hasDisableAt();let i;if(this._scheduleMode){const t=this._hasDisableAt()?Ne(this._disableAtDate,this._disableAtTime):null,o=Ne(this._resumeAtDate,this._resumeAtTime);if(!o)return void(this._loading=!1);if(await je(this.hass,{entity_id:this._selected,resume_at:o,...t&&{disable_at:t}}),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);if(t)i=1===e?be(this.hass,"toast.success.scheduled_one"):be(this.hass,"toast.success.scheduled_many",{count:e});else{const t=this._formatDateTime(o);i=1===e?be(this.hass,"toast.success.snoozed_until_one",{time:t}):be(this.hass,"toast.success.snoozed_until_many",{count:e,time:t})}}else{const{days:t,hours:o,minutes:a}=this._customDuration;if(await je(this.hass,{entity_id:this._selected,days:t,hours:o,minutes:a}),!this.isConnected||!this.shadowRoot)return void(this._loading=!1);const s=Le(t,o,a);i=1===e?be(this.hass,"toast.success.snoozed_for_one",{duration:s}):be(this.hass,"toast.success.snoozed_for_many",{count:e,duration:s});const r=Ue(this._customDuration);!function(e,t){try{const o={minutes:t,duration:e,timestamp:Date.now()};localStorage.setItem(qe,JSON.stringify(o))}catch{}}(this._customDuration,r),this._lastDuration={minutes:r,duration:this._customDuration,timestamp:Date.now()}}this._hapticFeedback("success"),this._showToast(i,{showUndo:!0,onUndo:async()=>{try{if(!this.hass)return;for(const e of t)o&&a?await Ge(this.hass,e):await Be(this.hass,e);if(this.isConnected){this._selected=t;const o=1===e?be(this.hass,"toast.success.restored_one"):be(this.hass,"toast.success.restored_many",{count:e});this._showToast(o)}}catch(e){console.error("Undo failed:",e),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.error.undo_failed"))}}}),this._selected=[],this._disableAtDate="",this._disableAtTime="",this._resumeAtDate="",this._resumeAtTime=""}catch(e){console.error("Snooze failed:",e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(Ie(e,"Failed to snooze automations"))}this._loading=!1}}async _wake(e){if(this.hass)try{await Be(this.hass,e),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.success.resumed"))}catch(e){console.error("Wake failed:",e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(Ie(e,be(this.hass,"toast.error.resume_failed")))}}async _handleWakeAll(){if(this._wakeAllPending){if(null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),this._wakeAllPending=!1,!this.hass)return;try{await async function(e){try{await e.callService("autosnooze","cancel_all",{})}catch(e){throw console.error("[AutoSnooze] Failed to wake all automations:",e),e}}(this.hass),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.success.resumed_all"))}catch(e){console.error("Wake all failed:",e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.error.resume_all_failed"))}}else this._hapticFeedback("medium"),this._wakeAllPending=!0,this._wakeAllTimeout=window.setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},Se)}async _cancelScheduled(e){if(this.hass)try{await Ge(this.hass,e),this._hapticFeedback("success"),this.isConnected&&this.shadowRoot&&this._showToast(be(this.hass,"toast.success.cancelled"))}catch(e){console.error("Cancel scheduled failed:",e),this._hapticFeedback("failure"),this.isConnected&&this.shadowRoot&&this._showToast(Ie(e,be(this.hass,"toast.error.cancel_failed")))}}_renderDateOptions(){const e=function(e=365,t){const o=[],a=new Date,i=a.getFullYear();for(let s=0;s<e;s++){const e=new Date(a);e.setDate(e.getDate()+s);const r=e.getFullYear(),n=`${r}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,l=e.toLocaleDateString(t,{weekday:"short"}),c=e.toLocaleDateString(t,{month:"short"}),u=e.getDate(),d=r!==i?`${l}, ${c} ${u}, ${r}`:`${l}, ${c} ${u}`;o.push({value:n,label:d})}return o}(365,this._getLocale());return e.map(e=>B`<option value="${e.value}">${e.label}</option>`)}_getDurationPills(){const e=[...Pe];if(this._lastDuration){const t=this._lastDuration.minutes,o=!Pe.some(e=>e.minutes===t);if(o){const{days:o,hours:a,minutes:i}=this._lastDuration.duration,s=Me(o,a,i).replace(/ /g,"");e.unshift({label:`Last ${s}`,minutes:t,isLast:!0})}}return e}_renderSelectionList(){const e=this._getFilteredAutomations();if("all"===this._filterTab)return 0===e.length?B`<div class="list-empty" role="status">${be(this.hass,"list.empty")}</div>`:e.map(e=>B`
        <button
          type="button"
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
            aria-label="${be(this.hass,"a11y.select_automation",{name:e.name})}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${e.name}</div>
          </div>
        </button>
      `);const t="areas"===this._filterTab?this._getGroupedByArea():"categories"===this._filterTab?this._getGroupedByCategory():this._getGroupedByLabel();return 0===t.length?B`<div class="list-empty" role="status">${be(this.hass,"list.empty")}</div>`:t.map(([e,t])=>{const o=!1!==this._expandedGroups[e],a=t.every(e=>this._selected.includes(e.id)),i=t.some(e=>this._selected.includes(e.id))&&!a;return B`
        <button
          type="button"
          class="group-header ${o?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(e)}
          aria-expanded=${o}
          aria-label="${be(this.hass,"a11y.group_header",{name:e,count:t.length})}"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${e}</span>
          <span class="group-badge" aria-label="${be(this.hass,"a11y.group_count",{count:t.length})}">${t.length}</span>
          <input
            type="checkbox"
            .checked=${a}
            .indeterminate=${i}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._selectGroup(t)}
            aria-label="${be(this.hass,"a11y.select_all_in_group",{name:e})}"
            tabindex="-1"
          />
        </button>
        ${o?t.map(e=>B`
                <button
                  type="button"
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
                    aria-label="${be(this.hass,"a11y.select_automation",{name:e.name})}"
                    tabindex="-1"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${e.name}</div>
                  </div>
                </button>
              `):""}
      `})}_renderDurationSelector(e,t,o){return this._scheduleMode?B`
          <div class="schedule-inputs">
            <div class="datetime-field">
              <label id="snooze-at-label">${be(this.hass,"schedule.snooze_at")}</label>
              <div class="datetime-row">
                <select
                  .value=${this._disableAtDate}
                  @change=${e=>this._disableAtDate=e.target.value}
                  aria-labelledby="snooze-at-label"
                  aria-label="${be(this.hass,"a11y.snooze_date")}"
                >
                  <option value="">${be(this.hass,"schedule.select_date")}</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._disableAtTime}
                  @input=${e=>this._disableAtTime=e.target.value}
                  aria-labelledby="snooze-at-label"
                  aria-label="${be(this.hass,"a11y.snooze_time")}"
                />
              </div>
              <span class="field-hint">${be(this.hass,"schedule.hint_immediate")}</span>
            </div>
            <div class="datetime-field">
              <label id="resume-at-label">${be(this.hass,"schedule.resume_at")}</label>
              <div class="datetime-row">
                <select
                  .value=${this._resumeAtDate}
                  @change=${e=>this._resumeAtDate=e.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="${be(this.hass,"a11y.resume_date")}"
                >
                  <option value="">${be(this.hass,"schedule.select_date")}</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._resumeAtTime}
                  @input=${e=>this._resumeAtTime=e.target.value}
                  aria-labelledby="resume-at-label"
                  aria-label="${be(this.hass,"a11y.resume_time")}"
                />
              </div>
            </div>
            <button
              type="button"
              class="schedule-link"
              @click=${()=>this._scheduleMode=!1}
            >
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              ${be(this.hass,"schedule.back_to_duration")}
            </button>
          </div>
        `:B`
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">${be(this.hass,"duration.header")}</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${this._getDurationPills().map(e=>{const t=Ue(this._customDuration),o=null===e.minutes?this._showCustomInput:!this._showCustomInput&&e.minutes===t;return B`
                    <button
                      type="button"
                      class="pill ${o?"active":""}"
                      @click=${()=>{null===e.minutes?this._showCustomInput=!this._showCustomInput:(this._showCustomInput=!1,this._setDuration(e.minutes))}}
                      role="radio"
                      aria-checked=${o}
                      aria-label="${null===e.minutes?be(this.hass,"a11y.custom_duration"):e.isLast?be(this.hass,"a11y.snooze_last_duration"):be(this.hass,"a11y.snooze_for_duration",{duration:e.label})}"
                    >
                      ${e.label}
                    </button>
                  `})}
            </div>

            ${this._showCustomInput?B`
              <div class="custom-duration-input">
                <input
                  type="text"
                  class="duration-input ${o?"":"invalid"}"
                  placeholder="${be(this.hass,"duration.placeholder")}"
                  .value=${this._customDurationInput}
                  @input=${e=>this._handleDurationInput(e.target.value)}
                  aria-label="${be(this.hass,"a11y.custom_duration")}"
                  aria-invalid=${!o}
                  aria-describedby="duration-help"
                />
                ${t&&o?B`<div class="duration-preview" role="status" aria-live="polite">${be(this.hass,"duration.preview_label")} ${t}</div>`:B`<div class="duration-help" id="duration-help">${be(this.hass,"duration.help")}</div>`}
              </div>
            `:""}

            <button
              type="button"
              class="schedule-link"
              @click=${()=>this._enterScheduleMode()}
            >
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              ${be(this.hass,"schedule.pick_datetime")}
            </button>
          </div>
        `}_renderActivePauses(e){return 0===e?"":B`
      <div class="snooze-list" role="region" aria-label="${be(this.hass,"a11y.snoozed_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${be(this.hass,"section.snoozed_count",{count:e})}
        </div>

        ${this._getPausedGroupedByResumeTime().map(e=>B`
            <div class="pause-group" role="group" aria-label="${be(this.hass,"a11y.automations_resuming",{time:this._formatDateTime(e.resumeAt)})}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${e.disableAt?B`${be(this.hass,"status.resumes")} ${this._formatDateTime(e.resumeAt)}`:B`<span class="countdown" data-resume-at="${e.resumeAt}" aria-label="${be(this.hass,"a11y.time_remaining",{time:this._formatCountdown(e.resumeAt)})}">${this._formatCountdown(e.resumeAt)}</span>`}
              </div>
              ${e.automations.map(e=>B`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${e.friendly_name||e.entity_id}</div>
                    </div>
                    <button type="button" class="wake-btn" @click=${()=>this._wake(e.entity_id)} aria-label="${be(this.hass,"a11y.resume_automation",{name:e.friendly_name||e.entity_id})}">
                      ${be(this.hass,"button.resume")}
                    </button>
                  </div>
                `)}
            </div>
          `)}

        ${e>1?B`
              <button
                type="button"
                class="wake-all ${this._wakeAllPending?"pending":""}"
                @click=${()=>this._handleWakeAll()}
                aria-label="${this._wakeAllPending?be(this.hass,"a11y.confirm_resume_all"):be(this.hass,"a11y.resume_all")}"
              >
                ${this._wakeAllPending?be(this.hass,"button.confirm_resume_all"):be(this.hass,"button.resume_all")}
              </button>
            `:""}
      </div>
    `}_renderScheduledPauses(e,t){return 0===e?"":B`
      <div class="scheduled-list" role="region" aria-label="${be(this.hass,"a11y.scheduled_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${be(this.hass,"section.scheduled_count",{count:e})}
        </div>

        ${Object.entries(t).map(([e,t])=>B`
            <div class="scheduled-item" role="article" aria-label="${be(this.hass,"a11y.scheduled_pause_for",{name:t.friendly_name||e})}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${t.friendly_name||e}
                </div>
                <div class="scheduled-time">
                  ${be(this.hass,"status.disables")} ${this._formatDateTime(t.disable_at||"now")}
                </div>
                <div class="paused-time">
                  ${be(this.hass,"status.resumes_at")} ${this._formatDateTime(t.resume_at)}
                </div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${()=>this._cancelScheduled(e)} aria-label="${be(this.hass,"a11y.cancel_scheduled_for",{name:t.friendly_name||e})}">
                ${be(this.hass,"button.cancel")}
              </button>
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return B``;const e=this._getPaused(),t=Object.keys(e).length,o=this._getScheduled(),a=Object.keys(o).length,i=this._customDuration.days*$e+this._customDuration.hours*we+this._customDuration.minutes,s=Pe.find(e=>e.minutes===i),r=this._getDurationPreview(),n=this._isDurationValid();return B`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||be(this.hass,"card.default_title")}
          ${t>0||a>0?B`<span class="status-summary"
                >${t>0?be(this.hass,"status.active_count",{count:t}):""}${t>0&&a>0?", ":""}${a>0?be(this.hass,"status.scheduled_count",{count:a}):""}</span
              >`:""}
        </div>

        <div class="snooze-setup">
          <div class="filter-tabs" role="tablist" aria-label="${be(this.hass,"a11y.filter_tabs")}">
            <button
              type="button"
              class="tab ${"all"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="all"}
              role="tab"
              aria-selected=${"all"===this._filterTab}
              aria-controls="selection-list"
            >
              ${be(this.hass,"tab.all")}
              <span class="tab-count" aria-label="${be(this.hass,"a11y.automation_count",{count:this._getAutomations().length})}">${this._getAutomations().length}</span>
            </button>
            <button
              type="button"
              class="tab ${"areas"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="areas"}
              role="tab"
              aria-selected=${"areas"===this._filterTab}
              aria-controls="selection-list"
            >
              ${be(this.hass,"tab.areas")}
              <span class="tab-count" aria-label="${be(this.hass,"a11y.area_count",{count:this._getAreaCount()})}">${this._getAreaCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${"categories"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="categories"}
              role="tab"
              aria-selected=${"categories"===this._filterTab}
              aria-controls="selection-list"
            >
              ${be(this.hass,"tab.categories")}
              <span class="tab-count" aria-label="${be(this.hass,"a11y.category_count",{count:this._getCategoryCount()})}">${this._getCategoryCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${"labels"===this._filterTab?"active":""}"
              @click=${()=>this._filterTab="labels"}
              role="tab"
              aria-selected=${"labels"===this._filterTab}
              aria-controls="selection-list"
            >
              ${be(this.hass,"tab.labels")}
              <span class="tab-count" aria-label="${be(this.hass,"a11y.label_count",{count:this._getLabelCount()})}">${this._getLabelCount()}</span>
            </button>
          </div>

          <div class="search-box">
            <input
              type="search"
              placeholder="${be(this.hass,"search.placeholder")}"
              .value=${this._search}
              @input=${e=>this._handleSearchInput(e)}
              aria-label="${be(this.hass,"a11y.search")}"
            />
          </div>

          ${this._getFilteredAutomations().length>0?B`
                <div class="selection-actions" role="toolbar" aria-label="${be(this.hass,"a11y.selection_actions")}">
                  <span role="status" aria-live="polite">${be(this.hass,"selection.count",{selected:this._selected.length,total:this._getFilteredAutomations().length})}</span>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click=${()=>this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?be(this.hass,"a11y.deselect_all"):be(this.hass,"a11y.select_all")}"
                  >
                    ${this._getFilteredAutomations().every(e=>this._selected.includes(e.id))?be(this.hass,"button.deselect_all"):be(this.hass,"button.select_all")}
                  </button>
                  ${this._selected.length>0?B`<button type="button" class="select-all-btn" @click=${()=>this._clearSelection()} aria-label="${be(this.hass,"a11y.clear_selection")}">${be(this.hass,"button.clear")}</button>`:""}
                </div>
              `:""}

          <div class="selection-list" id="selection-list" role="listbox" aria-label="${be(this.hass,"a11y.automations_list")}" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(s,r,n)}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===this._selected.length||!this._scheduleMode&&!this._isDurationValid()||this._scheduleMode&&!this._hasResumeAt()||this._loading}
            @click=${()=>this._snooze()}
            aria-label="${this._loading?be(this.hass,"a11y.snoozing"):this._scheduleMode?be(this.hass,"a11y.schedule_snooze",{count:this._selected.length}):be(this.hass,"a11y.snooze_count",{count:this._selected.length})}"
            aria-busy=${this._loading}
          >
            ${this._loading?be(this.hass,"button.snoozing"):this._scheduleMode?be(this.hass,"button.schedule_count",{count:this._selected.length}):be(this.hass,"button.snooze_count",{count:this._selected.length})}
          </button>
        </div>

        ${this._renderActivePauses(t)}
        ${this._renderScheduledPauses(a,o)}
      </ha-card>
    `}}Xe.styles=fe,e([de({attribute:!1})],Xe.prototype,"hass",void 0),e([de({attribute:!1})],Xe.prototype,"config",void 0),e([he()],Xe.prototype,"_selected",void 0),e([he()],Xe.prototype,"_duration",void 0),e([he()],Xe.prototype,"_customDuration",void 0),e([he()],Xe.prototype,"_customDurationInput",void 0),e([he()],Xe.prototype,"_loading",void 0),e([he()],Xe.prototype,"_search",void 0),e([he()],Xe.prototype,"_filterTab",void 0),e([he()],Xe.prototype,"_expandedGroups",void 0),e([he()],Xe.prototype,"_scheduleMode",void 0),e([he()],Xe.prototype,"_disableAtDate",void 0),e([he()],Xe.prototype,"_disableAtTime",void 0),e([he()],Xe.prototype,"_resumeAtDate",void 0),e([he()],Xe.prototype,"_resumeAtTime",void 0),e([he()],Xe.prototype,"_labelRegistry",void 0),e([he()],Xe.prototype,"_categoryRegistry",void 0),e([he()],Xe.prototype,"_entityRegistry",void 0),e([he()],Xe.prototype,"_showCustomInput",void 0),e([he()],Xe.prototype,"_automationsCache",void 0),e([he()],Xe.prototype,"_automationsCacheVersion",void 0),e([he()],Xe.prototype,"_wakeAllPending",void 0),e([he()],Xe.prototype,"_lastDuration",void 0);const Qe=r`
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
`;class et extends ne{constructor(){super(...arguments),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const o={...this._config,[e]:t};""!==t&&null!=t||delete o[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}render(){return this._config?B`
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
    `:B``}}et.styles=Qe,e([de({attribute:!1})],et.prototype,"hass",void 0),e([he()],et.prototype,"_config",void 0),customElements.get("autosnooze-card-editor")||customElements.define("autosnooze-card-editor",et),customElements.get("autosnooze-card")||customElements.define("autosnooze-card",Xe),window.customCards=window.customCards||[],window.customCards.some(e=>"autosnooze-card"===e.type)||window.customCards.push({type:"autosnooze-card",name:"AutoSnooze Card",description:"Temporarily pause automations with area and label filtering (v0.2.9)",preview:!0});export{Xe as AutomationPauseCard,et as AutomationPauseCardEditor};
//# sourceMappingURL=autosnooze-card.js.map
