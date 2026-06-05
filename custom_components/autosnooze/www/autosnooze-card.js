function e(e,t,o,i){var a,s=arguments.length,r=s<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,o):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,o,i);else for(var n=e.length-1;n>=0;n--)(a=e[n])&&(r=(s<3?a(r):s>3?a(t,o,r):a(t,o))||r);return s>3&&r&&Object.defineProperty(t,o,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,o=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let s=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(o&&void 0===e){const o=void 0!==t&&1===t.length;o&&(e=a.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&a.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const o=1===e.length?e[0]:t.reduce((t,o,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+e[i+1],e[0]);return new s(o,e,i)},n=o?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:l,defineProperty:d,getOwnPropertyDescriptor:u,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:m}=Object,p=globalThis,g=p.trustedTypes,_=g?g.emptyScript:"",b=p.reactiveElementPolyfillSupport,f=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?_:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=null!==e;break;case Number:o=null===e?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch(e){o=null}}return o}},v=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:v};Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let w=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),i=this.getPropertyDescriptor(e,o,t);void 0!==i&&d(this.prototype,e,i)}}static getPropertyDescriptor(e,t,o){const{get:i,set:a}=u(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:i,set(t){const s=i?.call(this);a?.call(this,t),this.requestUpdate(e,s,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=m(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...c(e),...h(e)];for(const o of t)this.createProperty(o,e[o])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,o]of t)this.elementProperties.set(e,o)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const o=this._$Eu(e,t);void 0!==o&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const e of o)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const o=t.attribute;return!1===o?void 0:"string"==typeof o?o:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,i)=>{if(o)e.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const o of i){const i=document.createElement("style"),a=t.litNonce;void 0!==a&&i.setAttribute("nonce",a),i.textContent=o.cssText,e.appendChild(i)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){const o=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,o);if(void 0!==i&&!0===o.reflect){const a=(void 0!==o.converter?.toAttribute?o.converter:y).toAttribute(t,o.type);this._$Em=e,null==a?this.removeAttribute(i):this.setAttribute(i,a),this._$Em=null}}_$AK(e,t){const o=this.constructor,i=o._$Eh.get(e);if(void 0!==i&&this._$Em!==i){const e=o.getPropertyOptions(i),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=i;const s=a.fromAttribute(t,e.type);this[i]=s??this._$Ej?.get(i)??s,this._$Em=null}}requestUpdate(e,t,o,i=!1,a){if(void 0!==e){const s=this.constructor;if(!1===i&&(a=this[e]),o??=s.getPropertyOptions(e),!((o.hasChanged??v)(a,t)||o.useDefault&&o.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,o))))return;this.C(e,t,o)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:i,wrapped:a},s){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==a||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),!0===i&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,o]of e){const{wrapped:e}=o,i=this[t];!0!==e||this._$AL.has(t)||void 0===i||this.C(t,void 0,o,i)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[f("elementProperties")]=new Map,w[f("finalized")]=new Map,b?.({ReactiveElement:w}),(p.reactiveElementVersions??=[]).push("2.1.2");const A=globalThis,z=e=>e,$=A.trustedTypes,S=$?$.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,T=`<${M}>`,R=document,D=()=>R.createComment(""),j=e=>null===e||"object"!=typeof e&&"function"!=typeof e,P=Array.isArray,E="[ \t\n\f\r]",I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,F=/-->/g,L=/>/g,N=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,O=/"/g,H=/^(?:script|style|textarea|title)$/i,V=(e=>(t,...o)=>({_$litType$:e,strings:t,values:o}))(1),G=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),q=new WeakMap,W=R.createTreeWalker(R,129);function K(e,t){if(!P(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const Y=(e,t)=>{const o=e.length-1,i=[];let a,s=2===t?"<svg>":3===t?"<math>":"",r=I;for(let t=0;t<o;t++){const o=e[t];let n,l,d=-1,u=0;for(;u<o.length&&(r.lastIndex=u,l=r.exec(o),null!==l);)u=r.lastIndex,r===I?"!--"===l[1]?r=F:void 0!==l[1]?r=L:void 0!==l[2]?(H.test(l[2])&&(a=RegExp("</"+l[2],"g")),r=N):void 0!==l[3]&&(r=N):r===N?">"===l[0]?(r=a??I,d=-1):void 0===l[1]?d=-2:(d=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?N:'"'===l[3]?O:U):r===O||r===U?r=N:r===F||r===L?r=I:(r=N,a=void 0);const c=r===N&&e[t+1].startsWith("/>")?" ":"";s+=r===I?o+T:d>=0?(i.push(n),o.slice(0,d)+k+o.slice(d)+C+c):o+C+(-2===d?t:c)}return[K(e,s+(e[o]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),i]};class Z{constructor({strings:e,_$litType$:t},o){let i;this.parts=[];let a=0,s=0;const r=e.length-1,n=this.parts,[l,d]=Y(e,t);if(this.el=Z.createElement(l,o),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(i=W.nextNode())&&n.length<r;){if(1===i.nodeType){if(i.hasAttributes())for(const e of i.getAttributeNames())if(e.endsWith(k)){const t=d[s++],o=i.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);n.push({type:1,index:a,name:r[2],strings:o,ctor:"."===r[1]?te:"?"===r[1]?oe:"@"===r[1]?ie:ee}),i.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:a}),i.removeAttribute(e));if(H.test(i.tagName)){const e=i.textContent.split(C),t=e.length-1;if(t>0){i.textContent=$?$.emptyScript:"";for(let o=0;o<t;o++)i.append(e[o],D()),W.nextNode(),n.push({type:2,index:++a});i.append(e[t],D())}}}else if(8===i.nodeType)if(i.data===M)n.push({type:2,index:a});else{let e=-1;for(;-1!==(e=i.data.indexOf(C,e+1));)n.push({type:7,index:a}),e+=C.length-1}a++}}static createElement(e,t){const o=R.createElement("template");return o.innerHTML=e,o}}function J(e,t,o=e,i){if(t===G)return t;let a=void 0!==i?o._$Co?.[i]:o._$Cl;const s=j(t)?void 0:t._$litDirective$;return a?.constructor!==s&&(a?._$AO?.(!1),void 0===s?a=void 0:(a=new s(e),a._$AT(e,o,i)),void 0!==i?(o._$Co??=[])[i]=a:o._$Cl=a),void 0!==a&&(t=J(e,a._$AS(e,t.values),a,i)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,i=(e?.creationScope??R).importNode(t,!0);W.currentNode=i;let a=W.nextNode(),s=0,r=0,n=o[0];for(;void 0!==n;){if(s===n.index){let t;2===n.type?t=new Q(a,a.nextSibling,this,e):1===n.type?t=new n.ctor(a,n.name,n.strings,this,e):6===n.type&&(t=new ae(a,this,e)),this._$AV.push(t),n=o[++r]}s!==n?.index&&(a=W.nextNode(),s++)}return W.currentNode=R,i}p(e){let t=0;for(const o of this._$AV)void 0!==o&&(void 0!==o.strings?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,o,i){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),j(e)?e===B||null==e||""===e?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==G&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>P(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&j(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:o}=e,i="number"==typeof o?this._$AC(e):(void 0===o.el&&(o.el=Z.createElement(K(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===i)this._$AH.p(t);else{const e=new X(i,this),o=e.u(this.options);e.p(t),this.T(o),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Z(e)),t}k(e){P(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,i=0;for(const a of e)i===t.length?t.push(o=new Q(this.O(D()),this.O(D()),this,this.options)):o=t[i],o._$AI(a),i++;i<t.length&&(this._$AR(o&&o._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=z(e).nextSibling;z(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,i,a){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=a,o.length>2||""!==o[0]||""!==o[1]?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=B}_$AI(e,t=this,o,i){const a=this.strings;let s=!1;if(void 0===a)e=J(this,e,t,0),s=!j(e)||e!==this._$AH&&e!==G,s&&(this._$AH=e);else{const i=e;let r,n;for(e=a[0],r=0;r<a.length-1;r++)n=J(this,i[o+r],t,r),n===G&&(n=this._$AH[r]),s||=!j(n)||n!==this._$AH[r],n===B?e=B:e!==B&&(e+=(n??"")+a[r+1]),this._$AH[r]=n}s&&!i&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}}class oe extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}}class ie extends ee{constructor(e,t,o,i,a){super(e,t,o,i,a),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??B)===G)return;const o=this._$AH,i=e===B&&o!==B||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,a=e!==B&&(o===B||i);i&&this.element.removeEventListener(this.name,this,o),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const se=A.litHtmlPolyfillSupport;se?.(Z,Q),(A.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;class ne extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,o)=>{const i=o?.renderBefore??t;let a=i._$litPart$;if(void 0===a){const e=o?.renderBefore??null;i._$litPart$=a=new Q(t.insertBefore(D(),e),e,void 0,o??{})}return a._$AI(e),a})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}}ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const le=re.litElementPolyfillSupport;le?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const de={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:v},ue=(e=de,t,o)=>{const{kind:i,metadata:a}=o;let s=globalThis.litPropertyMetadata.get(a);if(void 0===s&&globalThis.litPropertyMetadata.set(a,s=new Map),"setter"===i&&((e=Object.create(e)).wrapped=!0),s.set(o.name,e),"accessor"===i){const{name:i}=o;return{set(o){const a=t.get.call(this);t.set.call(this,o),this.requestUpdate(i,a,e,!0,o)},init(t){return void 0!==t&&this.C(i,void 0,e,t),t}}}if("setter"===i){const{name:i}=o;return function(o){const a=this[i];t.call(this,o),this.requestUpdate(i,a,e,!0,o)}}throw Error("Unsupported decorator location: "+i)};function ce(e){return(t,o)=>"object"==typeof o?ue(e,t,o):((e,t,o)=>{const i=t.hasOwnProperty(o);return t.constructor.createProperty(o,e),i?Object.getOwnPropertyDescriptor(t,o):void 0})(e,t,o)}function he(e){return ce({...e,state:!0,attribute:!1})}const me={en:{group:{unassigned:"Unassigned",unlabeled:"Unlabeled",uncategorized:"Uncategorized",recent:"Recent"},button:{undo:"Undo",resume:"Resume",remove_notification:"Remove notification",confirm_resume_all:"Confirm Resume All",resume_all:"Resume All",cancel:"Cancel",select_all:"Select All",clear:"Clear",continue:"Continue",snoozing:"Snoozing...",schedule_count:"Schedule ({count})",snooze_count:"Snooze ({count})"},a11y:{undo_action:"Undo last action",snooze_date:"Snooze date",snooze_time:"Snooze time",resume_date:"Resume date",resume_time:"Resume time",custom_duration:"Custom duration",snoozed_region:"Snoozed automations",automations_resuming:"Automations resuming {time}",time_remaining:"Time remaining: {time}",resume_automation:"Resume {name}",confirm_resume_all:"Confirm resume all automations",resume_all:"Resume all paused automations",scheduled_region:"Scheduled snoozes",scheduled_pause_for:"Scheduled pause for {name}",cancel_scheduled_for:"Cancel scheduled pause for {name}",filter_tabs:"Filter automations by",automation_count:"{count} automations",area_count:"{count} areas",category_count:"{count} categories",label_count:"{count} labels",search:"Search automations by name",clear_search:"Clear search",selection_actions:"Selection actions",select_all:"Select all visible automations",clear_selection:"Clear selection",automations_list:"Automations list",snoozing:"Snoozing automations",schedule_snooze:"Schedule snooze for {count} automations",snooze_count:"Snooze {count} automations",select_automation:"Select {name}",group_header:"{name} group, {count} automations",group_count:"{count} automations",select_all_in_group:"Select all automations in {name}",snooze_last_duration:"Snooze for last used duration",snooze_for_duration:"Snooze for {duration}",close_adjust_modal:"Close adjust modal",adjust_automation:"Adjust snooze time for {name}",add_minutes:"Add {label}",reduce_minutes:"Reduce by {label}",adjust_group:"Adjust snooze time for {count} automations in this group"},toast:{error:{resume_time_required:"Please set a complete resume date and time",invalid_datetime:"Invalid resume date/time",resume_time_past:"Resume time must be in the future",snooze_before_resume:"Snooze time must be before resume time",undo_failed:"Failed to undo. The automations may have already been modified.",resume_failed:"Failed to resume automation",resume_all_failed:"Failed to resume automations. Check Home Assistant logs for details.",cancel_failed:"Failed to cancel scheduled snooze",adjust_failed:"Failed to adjust snooze time"},success:{scheduled_one:"Scheduled 1 automation to snooze",scheduled_many:"Scheduled {count} automations to snooze",snoozed_until_one:"Snoozed 1 automation until {time}",snoozed_until_many:"Snoozed {count} automations until {time}",snoozed_for_one:"Snoozed 1 automation for {duration}",snoozed_for_many:"Snoozed {count} automations for {duration}",restored_one:"Restored 1 automation",restored_many:"Restored {count} automations",resumed:"Automation resumed successfully",resumed_all:"All automations resumed successfully",cancelled:"Scheduled snooze cancelled successfully",adjusted:"Snooze time adjusted"}},list:{empty:"No automations found",label_registry_warning:"Label metadata is temporarily unavailable. Showing automations without label-based filtering."},schedule:{snooze_at:"Snooze at:",select_date:"Select date",hint_immediate:"Leave empty to snooze immediately",resume_at:"Resume at:",back_to_duration:"Back to duration selection",pick_datetime:"Pick specific date/time instead",summary_immediate:"Will pause immediately and resume {resume}",summary_with_disable:"Will pause {disable} and resume {resume}",summary_invalid_order:"Pause time must be before resume time"},duration:{header:"Snooze Duration",placeholder:"e.g. 2h30m, 1.5h, 1d, 45m",preview_label:"Duration:",help:"Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Use last duration: {duration}",custom:"Custom"},section:{snoozed_count:"Snoozed Automations ({count})",scheduled_count:"Scheduled Snoozes ({count})"},status:{resumes:"Resumes",disables:"Disables:",resumes_at:"Resumes:",active_count:"{count} active",scheduled_count:"{count} scheduled",resuming:"Resuming...",sensor_unavailable:"AutoSnooze status sensor is unavailable. Pause controls are still shown, but active/scheduled state may be stale.",no_snoozed:"No automations are currently snoozed"},tab:{all:"All",areas:"Areas",categories:"Categories",labels:"Labels"},search:{placeholder:"Search automations..."},selection:{count:"{selected} of {total} selected"},guardrail:{confirm_title:"Review required",confirm_body:"Some selected automations are tagged autosnooze_confirm or detected as critical. Continue to snooze them."},card:{default_title:"AutoSnooze",snoozed_title:"Snoozed Automations"},editor:{title_label:"Title",title_placeholder:"AutoSnooze"},adjust:{remaining:"Time remaining",add_time:"Add time",reduce_time:"Reduce time",group_title:"Adjust {count} automations",group_subtitle:"All automations in this group"},notify:{toggle_label:"Notify me",when_label:"Notification timing",lead_label:"How long before?",when:{start:"Snooze starts",about_to_end:"Before snooze ends",end:"Snooze ends"}}},es:{group:{unassigned:"Sin asignar",unlabeled:"Sin etiqueta",uncategorized:"Sin categoría"},button:{undo:"Deshacer",resume:"Reanudar",confirm_resume_all:"Confirmar reanudar todo",resume_all:"Reanudar todo",cancel:"Cancelar",select_all:"Seleccionar todo",clear:"Limpiar",snoozing:"Pausando...",schedule_count:"Programar ({count})",snooze_count:"Pausar ({count})"},a11y:{undo_action:"Deshacer última acción",snooze_date:"Fecha de pausa",snooze_time:"Hora de pausa",resume_date:"Fecha de reanudación",resume_time:"Hora de reanudación",custom_duration:"Duración personalizada",snoozed_region:"Automatizaciones pausadas",automations_resuming:"Automatizaciones que reanudan {time}",time_remaining:"Tiempo restante: {time}",resume_automation:"Reanudar {name}",confirm_resume_all:"Confirmar reanudar todas las automatizaciones",resume_all:"Reanudar todas las automatizaciones pausadas",scheduled_region:"Pausas programadas",scheduled_pause_for:"Pausa programada para {name}",cancel_scheduled_for:"Cancelar pausa programada para {name}",filter_tabs:"Filtrar automatizaciones por",automation_count:"{count} automatizaciones",area_count:"{count} áreas",category_count:"{count} categorías",label_count:"{count} etiquetas",search:"Buscar automatizaciones por nombre",selection_actions:"Acciones de selección",select_all:"Seleccionar todas las automatizaciones visibles",clear_selection:"Limpiar selección",automations_list:"Lista de automatizaciones",snoozing:"Pausando automatizaciones",schedule_snooze:"Programar pausa para {count} automatizaciones",snooze_count:"Pausar {count} automatizaciones",select_automation:"Seleccionar {name}",group_header:"Grupo {name}, {count} automatizaciones",group_count:"{count} automatizaciones",select_all_in_group:"Seleccionar todas en {name}",snooze_last_duration:"Pausar con última duración",snooze_for_duration:"Pausar durante {duration}",close_adjust_modal:"Cerrar modal de ajuste",adjust_automation:"Ajustar tiempo de snooze para {name}",add_minutes:"Agregar {label}",reduce_minutes:"Reducir {label}",adjust_group:"Ajustar tiempo de pausa para {count} automatizaciones en este grupo"},toast:{error:{resume_time_required:"Por favor, establece una fecha y hora de reanudación completas",invalid_datetime:"Fecha/hora de reanudación inválida",resume_time_past:"La hora de reanudación debe ser en el futuro",snooze_before_resume:"La hora de pausa debe ser anterior a la hora de reanudación",undo_failed:"Error al deshacer. Las automatizaciones pueden haber sido modificadas.",resume_failed:"Error al reanudar la automatización",resume_all_failed:"Error al reanudar las automatizaciones. Consulta los registros de Home Assistant.",cancel_failed:"Error al cancelar la pausa programada",adjust_failed:"Error al ajustar el tiempo de snooze"},success:{scheduled_one:"1 automatización programada para pausar",scheduled_many:"{count} automatizaciones programadas para pausar",snoozed_until_one:"1 automatización pausada hasta {time}",snoozed_until_many:"{count} automatizaciones pausadas hasta {time}",snoozed_for_one:"1 automatización pausada por {duration}",snoozed_for_many:"{count} automatizaciones pausadas por {duration}",restored_one:"1 automatización restaurada",restored_many:"{count} automatizaciones restauradas",resumed:"Automatización reanudada correctamente",resumed_all:"Todas las automatizaciones reanudadas correctamente",cancelled:"Pausa programada cancelada correctamente",adjusted:"Tiempo de snooze ajustado"}},list:{empty:"No se encontraron automatizaciones"},schedule:{snooze_at:"Pausar a las:",select_date:"Seleccionar fecha",hint_immediate:"Dejar vacío para pausar inmediatamente",resume_at:"Reanudar a las:",back_to_duration:"Volver a selección de duración",pick_datetime:"Elegir fecha/hora específica"},duration:{header:"Duración de la pausa",placeholder:"ej. 2h30m, 1.5h, 1d, 45m",preview_label:"Duración:",help:"Introducir duración: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Usar última duración: {duration}",custom:"Personalizado"},section:{snoozed_count:"Automatizaciones pausadas ({count})",scheduled_count:"Pausas programadas ({count})"},status:{resumes:"Reanuda",disables:"Desactiva:",resumes_at:"Reanuda:",active_count:"{count} activas",scheduled_count:"{count} programadas",resuming:"Reanudando...",no_snoozed:"No hay automatizaciones pausadas actualmente"},tab:{all:"Todo",areas:"Áreas",categories:"Categorías",labels:"Etiquetas"},search:{placeholder:"Buscar automatizaciones..."},selection:{count:"{selected} de {total} seleccionadas"},card:{default_title:"AutoSnooze",snoozed_title:"Automatizaciones pausadas"},editor:{title_label:"Título",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tiempo restante",add_time:"Agregar tiempo",reduce_time:"Reducir tiempo",group_title:"Ajustar {count} automatizaciones",group_subtitle:"Todas las automatizaciones en este grupo"},notify:{toggle_label:"Notificarme",when_label:"Momento de la notificación",lead_label:"¿Cuánto antes?",when:{start:"Empieza la siesta",about_to_end:"Antes de que termine la siesta",end:"Termina la siesta"}}},fr:{group:{unassigned:"Non assigné",unlabeled:"Sans étiquette",uncategorized:"Sans catégorie"},button:{undo:"Annuler",resume:"Reprendre",confirm_resume_all:"Confirmer tout reprendre",resume_all:"Tout reprendre",cancel:"Annuler",select_all:"Tout sélectionner",clear:"Effacer",snoozing:"Mise en pause...",schedule_count:"Programmer ({count})",snooze_count:"Pause ({count})"},a11y:{undo_action:"Annuler la dernière action",snooze_date:"Date de pause",snooze_time:"Heure de pause",resume_date:"Date de reprise",resume_time:"Heure de reprise",custom_duration:"Durée personnalisée",snoozed_region:"Automatisations en pause",automations_resuming:"Automatisations reprenant {time}",time_remaining:"Temps restant : {time}",resume_automation:"Reprendre {name}",confirm_resume_all:"Confirmer la reprise de toutes les automatisations",resume_all:"Reprendre toutes les automatisations en pause",scheduled_region:"Pauses programmées",scheduled_pause_for:"Pause programmée pour {name}",cancel_scheduled_for:"Annuler la pause programmée pour {name}",filter_tabs:"Filtrer les automatisations par",automation_count:"{count} automatisations",area_count:"{count} zones",category_count:"{count} catégories",label_count:"{count} étiquettes",search:"Rechercher des automatisations par nom",selection_actions:"Actions de sélection",select_all:"Sélectionner toutes les automatisations visibles",clear_selection:"Effacer la sélection",automations_list:"Liste des automatisations",snoozing:"Mise en pause des automatisations",schedule_snooze:"Programmer la pause pour {count} automatisations",snooze_count:"Mettre en pause {count} automatisations",select_automation:"Sélectionner {name}",group_header:"Groupe {name}, {count} automatisations",group_count:"{count} automatisations",select_all_in_group:"Tout sélectionner dans {name}",snooze_last_duration:"Pause pour dernière durée",snooze_for_duration:"Pause pour {duration}",close_adjust_modal:"Fermer le modal d'ajustement",adjust_automation:"Ajuster la mise en veille pour {name}",add_minutes:"Ajouter {label}",reduce_minutes:"Réduire de {label}",adjust_group:"Ajuster le temps de pause pour {count} automatisations dans ce groupe"},toast:{error:{resume_time_required:"Veuillez définir une date et heure de reprise complètes",invalid_datetime:"Date/heure de reprise invalide",resume_time_past:"L'heure de reprise doit être dans le futur",snooze_before_resume:"L'heure de pause doit être avant l'heure de reprise",undo_failed:"Échec de l'annulation. Les automatisations ont peut-être déjà été modifiées.",resume_failed:"Échec de la reprise de l'automatisation",resume_all_failed:"Échec de la reprise des automatisations. Consultez les journaux de Home Assistant.",cancel_failed:"Échec de l'annulation de la pause programmée",adjust_failed:"Échec de l'ajustement de la mise en veille"},success:{scheduled_one:"1 automatisation programmée pour pause",scheduled_many:"{count} automatisations programmées pour pause",snoozed_until_one:"1 automatisation en pause jusqu'à {time}",snoozed_until_many:"{count} automatisations en pause jusqu'à {time}",snoozed_for_one:"1 automatisation en pause pendant {duration}",snoozed_for_many:"{count} automatisations en pause pendant {duration}",restored_one:"1 automatisation restaurée",restored_many:"{count} automatisations restaurées",resumed:"Automatisation reprise avec succès",resumed_all:"Toutes les automatisations ont été reprises avec succès",cancelled:"Pause programmée annulée avec succès",adjusted:"Durée de mise en veille ajustée"}},list:{empty:"Aucune automatisation trouvée"},schedule:{snooze_at:"Pause à :",select_date:"Sélectionner la date",hint_immediate:"Laisser vide pour mettre en pause immédiatement",resume_at:"Reprendre à :",back_to_duration:"Retour à la sélection de durée",pick_datetime:"Choisir une date/heure spécifique"},duration:{header:"Durée de la pause",placeholder:"ex. 2h30m, 1.5h, 1j, 45m",preview_label:"Durée :",help:"Entrer la durée : 30m, 2h, 1.5h, 4h30m, 1j, 1j2h",last_used_tooltip:"Utiliser la dernière durée : {duration}",custom:"Personnalisé"},section:{snoozed_count:"Automatisations en pause ({count})",scheduled_count:"Pauses programmées ({count})"},status:{resumes:"Reprend",disables:"Désactive :",resumes_at:"Reprend :",active_count:"{count} actives",scheduled_count:"{count} programmées",resuming:"Reprise...",no_snoozed:"Aucune automatisation n'est actuellement en pause"},tab:{all:"Tout",areas:"Zones",categories:"Catégories",labels:"Étiquettes"},search:{placeholder:"Rechercher des automatisations..."},selection:{count:"{selected} sur {total} sélectionnées"},card:{default_title:"AutoSnooze",snoozed_title:"Automatisations en pause"},editor:{title_label:"Titre",title_placeholder:"AutoSnooze"},adjust:{remaining:"Temps restant",add_time:"Ajouter du temps",reduce_time:"Réduire le temps",group_title:"Ajuster {count} automatisations",group_subtitle:"Toutes les automatisations de ce groupe"},notify:{toggle_label:"Me notifier",when_label:"Moment de la notification",lead_label:"Combien de temps avant ?",when:{start:"Début de la sieste",about_to_end:"Avant la fin de la sieste",end:"Fin de la sieste"}}},de:{group:{unassigned:"Nicht zugewiesen",unlabeled:"Ohne Label",uncategorized:"Ohne Kategorie"},button:{undo:"Rückgängig",resume:"Fortsetzen",confirm_resume_all:"Alle fortsetzen bestätigen",resume_all:"Alle fortsetzen",cancel:"Abbrechen",select_all:"Alle auswählen",clear:"Löschen",snoozing:"Pausiere...",schedule_count:"Planen ({count})",snooze_count:"Pausieren ({count})"},a11y:{undo_action:"Letzte Aktion rückgängig machen",snooze_date:"Pausendatum",snooze_time:"Pausenzeit",resume_date:"Wiederaufnahmedatum",resume_time:"Wiederaufnahmezeit",custom_duration:"Benutzerdefinierte Dauer",snoozed_region:"Pausierte Automatisierungen",automations_resuming:"Automatisierungen werden fortgesetzt {time}",time_remaining:"Verbleibende Zeit: {time}",resume_automation:"{name} fortsetzen",confirm_resume_all:"Bestätigen: Alle Automatisierungen fortsetzen",resume_all:"Alle pausierten Automatisierungen fortsetzen",scheduled_region:"Geplante Pausen",scheduled_pause_for:"Geplante Pause für {name}",cancel_scheduled_for:"Geplante Pause für {name} abbrechen",filter_tabs:"Automatisierungen filtern nach",automation_count:"{count} Automatisierungen",area_count:"{count} Bereiche",category_count:"{count} Kategorien",label_count:"{count} Labels",search:"Automatisierungen nach Name suchen",selection_actions:"Auswahlaktionen",select_all:"Alle sichtbaren Automatisierungen auswählen",clear_selection:"Auswahl löschen",automations_list:"Automatisierungsliste",snoozing:"Automatisierungen werden pausiert",schedule_snooze:"Pause planen für {count} Automatisierungen",snooze_count:"{count} Automatisierungen pausieren",select_automation:"{name} auswählen",group_header:"Gruppe {name}, {count} Automatisierungen",group_count:"{count} Automatisierungen",select_all_in_group:"Alle in {name} auswählen",snooze_last_duration:"Letzte Dauer verwenden",snooze_for_duration:"Für {duration} pausieren",close_adjust_modal:"Anpassungsdialog schließen",adjust_automation:"Schlummerzeit anpassen für {name}",add_minutes:"{label} hinzufügen",reduce_minutes:"Um {label} reduzieren",adjust_group:"Schlummerzeit für {count} Automatisierungen in dieser Gruppe anpassen"},toast:{error:{resume_time_required:"Bitte vollständiges Wiederaufnahmedatum und -zeit angeben",invalid_datetime:"Ungültiges Wiederaufnahmedatum/-zeit",resume_time_past:"Wiederaufnahmezeit muss in der Zukunft liegen",snooze_before_resume:"Pausenzeit muss vor der Wiederaufnahmezeit liegen",undo_failed:"Rückgängig machen fehlgeschlagen. Die Automatisierungen wurden möglicherweise bereits geändert.",resume_failed:"Fortsetzen der Automatisierung fehlgeschlagen",resume_all_failed:"Fortsetzen der Automatisierungen fehlgeschlagen. Prüfen Sie die Home Assistant Logs.",cancel_failed:"Abbrechen der geplanten Pause fehlgeschlagen",adjust_failed:"Schlummerzeit konnte nicht angepasst werden"},success:{scheduled_one:"1 Automatisierung zum Pausieren geplant",scheduled_many:"{count} Automatisierungen zum Pausieren geplant",snoozed_until_one:"1 Automatisierung pausiert bis {time}",snoozed_until_many:"{count} Automatisierungen pausiert bis {time}",snoozed_for_one:"1 Automatisierung pausiert für {duration}",snoozed_for_many:"{count} Automatisierungen pausiert für {duration}",restored_one:"1 Automatisierung wiederhergestellt",restored_many:"{count} Automatisierungen wiederhergestellt",resumed:"Automatisierung erfolgreich fortgesetzt",resumed_all:"Alle Automatisierungen erfolgreich fortgesetzt",cancelled:"Geplante Pause erfolgreich abgebrochen",adjusted:"Schlummerzeit angepasst"}},list:{empty:"Keine Automatisierungen gefunden"},schedule:{snooze_at:"Pausieren um:",select_date:"Datum wählen",hint_immediate:"Leer lassen für sofortige Pause",resume_at:"Fortsetzen um:",back_to_duration:"Zurück zur Dauerauswahl",pick_datetime:"Stattdessen bestimmtes Datum/Zeit wählen"},duration:{header:"Pausendauer",placeholder:"z.B. 2h30m, 1.5h, 1d, 45m",preview_label:"Dauer:",help:"Dauer eingeben: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h",last_used_tooltip:"Letzte Dauer verwenden: {duration}",custom:"Benutzerdefiniert"},section:{snoozed_count:"Pausierte Automatisierungen ({count})",scheduled_count:"Geplante Pausen ({count})"},status:{resumes:"Fortsetzung",disables:"Deaktiviert:",resumes_at:"Fortsetzung:",active_count:"{count} aktiv",scheduled_count:"{count} geplant",resuming:"Wird fortgesetzt...",no_snoozed:"Derzeit sind keine Automatisierungen pausiert"},tab:{all:"Alle",areas:"Bereiche",categories:"Kategorien",labels:"Labels"},search:{placeholder:"Automatisierungen suchen..."},selection:{count:"{selected} von {total} ausgewählt"},card:{default_title:"AutoSnooze",snoozed_title:"Pausierte Automatisierungen"},editor:{title_label:"Titel",title_placeholder:"AutoSnooze"},adjust:{remaining:"Verbleibende Zeit",add_time:"Zeit hinzufügen",reduce_time:"Zeit reduzieren",group_title:"Anpassen von {count} Automatisierungen",group_subtitle:"Alle Automatisierungen in dieser Gruppe"},notify:{toggle_label:"Benachrichtigen",when_label:"Benachrichtigungszeitpunkt",lead_label:"Wie lange vorher?",when:{start:"Schlummerzeit beginnt",about_to_end:"Bevor die Schlummerzeit endet",end:"Schlummerzeit endet"}}},it:{group:{unassigned:"Non assegnato",unlabeled:"Senza etichetta",uncategorized:"Senza categoria"},button:{undo:"Annulla",resume:"Riprendi",confirm_resume_all:"Conferma riprendi tutto",resume_all:"Riprendi tutto",cancel:"Annulla",select_all:"Seleziona tutto",clear:"Cancella",snoozing:"Messa in pausa...",schedule_count:"Programma ({count})",snooze_count:"Pausa ({count})"},a11y:{undo_action:"Annulla ultima azione",snooze_date:"Data pausa",snooze_time:"Ora pausa",resume_date:"Data ripresa",resume_time:"Ora ripresa",custom_duration:"Durata personalizzata",snoozed_region:"Automazioni in pausa",automations_resuming:"Automazioni che riprendono {time}",time_remaining:"Tempo rimanente: {time}",resume_automation:"Riprendi {name}",confirm_resume_all:"Conferma ripresa di tutte le automazioni",resume_all:"Riprendi tutte le automazioni in pausa",scheduled_region:"Pause programmate",scheduled_pause_for:"Pausa programmata per {name}",cancel_scheduled_for:"Annulla pausa programmata per {name}",filter_tabs:"Filtra automazioni per",automation_count:"{count} automazioni",area_count:"{count} aree",category_count:"{count} categorie",label_count:"{count} etichette",search:"Cerca automazioni per nome",selection_actions:"Azioni selezione",select_all:"Seleziona tutte le automazioni visibili",clear_selection:"Cancella selezione",automations_list:"Lista automazioni",snoozing:"Messa in pausa delle automazioni",schedule_snooze:"Programma pausa per {count} automazioni",snooze_count:"Metti in pausa {count} automazioni",select_automation:"Seleziona {name}",group_header:"Gruppo {name}, {count} automazioni",group_count:"{count} automazioni",select_all_in_group:"Seleziona tutto in {name}",snooze_last_duration:"Pausa per ultima durata",snooze_for_duration:"Pausa per {duration}",close_adjust_modal:"Chiudi finestra di modifica",adjust_automation:"Modifica tempo di snooze per {name}",add_minutes:"Aggiungi {label}",reduce_minutes:"Riduci di {label}",adjust_group:"Modifica il tempo di pausa per {count} automazioni in questo gruppo"},toast:{error:{resume_time_required:"Imposta una data e ora di ripresa complete",invalid_datetime:"Data/ora di ripresa non valida",resume_time_past:"L'ora di ripresa deve essere nel futuro",snooze_before_resume:"L'ora di pausa deve essere prima dell'ora di ripresa",undo_failed:"Annullamento fallito. Le automazioni potrebbero essere già state modificate.",resume_failed:"Ripresa dell'automazione fallita",resume_all_failed:"Ripresa delle automazioni fallita. Controlla i log di Home Assistant.",cancel_failed:"Annullamento della pausa programmata fallito",adjust_failed:"Impossibile modificare il tempo di snooze"},success:{scheduled_one:"1 automazione programmata per la pausa",scheduled_many:"{count} automazioni programmate per la pausa",snoozed_until_one:"1 automazione in pausa fino a {time}",snoozed_until_many:"{count} automazioni in pausa fino a {time}",snoozed_for_one:"1 automazione in pausa per {duration}",snoozed_for_many:"{count} automazioni in pausa per {duration}",restored_one:"1 automazione ripristinata",restored_many:"{count} automazioni ripristinate",resumed:"Automazione ripresa con successo",resumed_all:"Tutte le automazioni riprese con successo",cancelled:"Pausa programmata annullata con successo",adjusted:"Tempo di snooze modificato"}},list:{empty:"Nessuna automazione trovata"},schedule:{snooze_at:"Pausa alle:",select_date:"Seleziona data",hint_immediate:"Lascia vuoto per mettere in pausa immediatamente",resume_at:"Riprendi alle:",back_to_duration:"Torna alla selezione durata",pick_datetime:"Scegli data/ora specifica"},duration:{header:"Durata pausa",placeholder:"es. 2h30m, 1.5h, 1g, 45m",preview_label:"Durata:",help:"Inserisci durata: 30m, 2h, 1.5h, 4h30m, 1g, 1g2h",last_used_tooltip:"Usa ultima durata: {duration}",custom:"Personalizzato"},section:{snoozed_count:"Automazioni in pausa ({count})",scheduled_count:"Pause programmate ({count})"},status:{resumes:"Riprende",disables:"Disattiva:",resumes_at:"Riprende:",active_count:"{count} attive",scheduled_count:"{count} programmate",resuming:"Ripresa...",no_snoozed:"Nessuna automazione è attualmente in pausa"},tab:{all:"Tutto",areas:"Aree",categories:"Categorie",labels:"Etichette"},search:{placeholder:"Cerca automazioni..."},selection:{count:"{selected} di {total} selezionate"},card:{default_title:"AutoSnooze",snoozed_title:"Automazioni in pausa"},editor:{title_label:"Titolo",title_placeholder:"AutoSnooze"},adjust:{remaining:"Tempo rimanente",add_time:"Aggiungi tempo",reduce_time:"Riduci tempo",group_title:"Modifica {count} automazioni",group_subtitle:"Tutte le automazioni in questo gruppo"},notify:{toggle_label:"Notificami",when_label:"Momento della notifica",lead_label:"Quanto tempo prima?",when:{start:"Inizio del posticipo",about_to_end:"Prima che termini il posticipo",end:"Fine del posticipo"}}}},pe={en:"en","en-GB":"en","en-US":"en",es:"es","es-ES":"es","es-419":"es",fr:"fr","fr-FR":"fr","fr-CA":"fr",de:"de","de-DE":"de","de-AT":"de","de-CH":"de",it:"it","it-IT":"it"};const ge=new Set;function _e(e,t){const o=t.split(".");let i=e;for(const e of o){if(!i||"object"!=typeof i||!(e in i))return;i=i[e]}return"string"==typeof i?i:void 0}function be(e,t,o){const i=function(e){if(!e)return"en";const t=e.language??e.locale?.language;if(!t)return"en";const o=pe[t];if(o)return o;const i=t.split("-")[0];if(i){const e=pe[i];if(e)return e}return"en"}(e),a=me[i];let s=a?_e(a,t):void 0;return s||"en"===i||(s=_e(me.en,t)),s?function(e,t){return t?e.replace(/\{(\w+)\}/g,(e,o)=>{const i=t[o];return void 0!==i?String(i):e}):e}(s,o):(ge.has(t)||(ge.add(t),console.warn(`[AutoSnooze] Missing translation for key: ${t}`)),t)}const fe=r`
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
      border: 1px solid color-mix(in srgb, #ff9800 45%, var(--divider-color));
      border-radius: 8px;
      background: color-mix(in srgb, #ff9800 10%, var(--card-background-color));
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
      border: 1px solid color-mix(in srgb, #ff9800 40%, var(--divider-color));
      background: color-mix(in srgb, #ff9800 8%, var(--card-background-color));
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
        min-height: 44px;
        flex-shrink: 0;
        border-radius: 8px;
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
`,ye=r`
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
`,ve=1e3,xe=6e4,we=36e5,Ae=864e5,ze=60,$e=1440,Se=300,ke=3e3,Ce=5e3,Me=1e3,Te=5e3,Re=1e3,De=3e4,je=[{label:"30m",minutes:30},{label:"1h",minutes:60},{label:"12h",minutes:720},{label:"1d",minutes:1440},{label:"Custom",minutes:null}],Pe=[30,60,120,240],Ee="autosnooze_exclude",Ie="autosnooze_include";function Fe(e){const t=e.toLowerCase().replace(/\s+/g,"");if(!t)return null;let o=0,i=!1;const a=t.match(/(\d+(?:\.\d+)?)\s*d/),s=t.match(/(\d+(?:\.\d+)?)\s*h/),r=t.match(/(\d+(?:\.\d+)?)\s*m(?!i)/);if(a?.[1]){const e=parseFloat(a[1]);if(isNaN(e)||e<0)return null;o+=e*$e,i=!0}if(s?.[1]){const e=parseFloat(s[1]);if(isNaN(e)||e<0)return null;o+=e*ze,i=!0}if(r?.[1]){const e=parseFloat(r[1]);if(isNaN(e)||e<0)return null;o+=e,i=!0}if(!i){if(!/^\d+(?:\.\d+)?$/.test(t))return null;const e=parseFloat(t);if(isNaN(e)||!(e>0))return null;o=e}if(o=Math.round(o),o<=0)return null;const n=Math.floor(o/$e),l=o%$e;return{days:n,hours:Math.floor(l/ze),minutes:l%ze}}function Le(e){return e.days*$e+e.hours*ze+e.minutes}function Ne(e){const t=Math.floor(e/$e),o=e%$e;return{days:t,hours:Math.floor(o/ze),minutes:o%ze}}const Ue={days:0,hours:0,minutes:30};class Oe{constructor(){this._state={selected:[],filterTab:"all",search:"",customDuration:{...Ue},customDurationInput:"30m",durationMs:30*xe}}getState(){return{...this._state,selected:[...this._state.selected],customDuration:{...this._state.customDuration}}}setSelection(e){this._state.selected=[...e]}toggleSelection(e){this._state.selected.includes(e)?this._state.selected=this._state.selected.filter(t=>t!==e):this._state.selected=[...this._state.selected,e]}clearSelection(){this._state.selected=[]}setFilterTab(e){this._state.filterTab=e}setSearch(e){this._state.search=e}setDuration(e,t){this._state.customDuration={...e},this._state.customDurationInput=t,this._state.durationMs=Le(e)*xe}}function He(e="light"){!function(e,t,o){const i=new CustomEvent(`hass-${t}`,{bubbles:!0,composed:!0,detail:o});e.dispatchEvent(i)}(window,"haptic",e)}function Ve(e,t){const o=new Date(e),i=new Date,a={weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"};return o.getFullYear()>i.getFullYear()&&(a.year="numeric"),o.toLocaleString(t,a)}function Ge(e,t="Resuming..."){const o=new Date(e).getTime()-Date.now();if(o<=0)return t;const i=Math.floor(o/Ae),a=Math.floor(o%Ae/we),s=Math.floor(o%we/xe),r=Math.floor(o%xe/ve);return i>0?`${i}d ${a}h ${s}m`:a>0?`${a}h ${s}m ${r}s`:`${s}m ${r}s`}function Be(e,t,o){const i=[];return e>0&&i.push(`${e} day${1!==e?"s":""}`),t>0&&i.push(`${t} hour${1!==t?"s":""}`),o>0&&i.push(`${o} minute${1!==o?"s":""}`),i.join(", ")}function qe(e,t,o){const i=[];return e>0&&i.push(`${e}d`),t>0&&i.push(`${t}h`),o>0&&i.push(`${o}m`),i.join(" ")||"0m"}const We=new Map,Ke=new Map,Ye=new Map;function Ze(e){return e.connection??e}function Je(e){if(!e)return We.clear(),Ke.clear(),void Ye.clear();const t=Ze(e);We.delete(t),Ke.delete(t),Ye.delete(t)}const Xe={subscribers:new Set,interval:null,syncTimeout:null,hidden:!1};function Qe(){for(const e of Xe.subscribers)e()}function et(){null!==Xe.interval&&(globalThis.clearInterval(Xe.interval),Xe.interval=null),null!==Xe.syncTimeout&&(globalThis.clearTimeout(Xe.syncTimeout),Xe.syncTimeout=null),0===Xe.subscribers.size||Xe.hidden||function(){if(Xe.hidden||0===Xe.subscribers.size||null!==Xe.interval)return;const e=1e3-Date.now()%1e3;Xe.syncTimeout=globalThis.setTimeout(()=>{Xe.syncTimeout=null,Qe(),Xe.interval=globalThis.setInterval(()=>{Qe()},Me)},e)}()}"undefined"!=typeof document&&document.addEventListener("visibilitychange",function(){const e=Xe.hidden;Xe.hidden=document.hidden,et(),e&&!Xe.hidden&&Qe()});const tt="autosnooze_last_duration";const ot="autosnooze_recent_snoozes";function it(){try{const e=localStorage.getItem(ot);if(!e)return[];const t=JSON.parse(e);if(!Array.isArray(t))return[];const o=Date.now()-2592e6;return t.filter(e=>"string"==typeof e.id&&"number"==typeof e.timestamp&&e.timestamp>o)}catch{return[]}}const at="sensor.autosnooze_snoozed_automations",st={},rt={},nt=[];let lt=null,dt=null,ut=null,ct=null,ht=null;function mt(e){return!e||"object"!=typeof e||Array.isArray(e)?null:e}function pt(e){if("string"!=typeof e||0===e.length)return!1;const t=Date.parse(e);return Number.isFinite(t)}function gt(e){return"number"==typeof e&&Number.isFinite(e)&&e>=0}function _t(e){const t=mt(e);return!!t&&((void 0===t.friendly_name||"string"==typeof t.friendly_name)&&pt(t.resume_at)&&(void 0===t.paused_at||pt(t.paused_at))&&(void 0===t.days||gt(t.days))&&(void 0===t.hours||gt(t.hours))&&(void 0===t.minutes||gt(t.minutes))&&(void 0===t.disable_at||null===t.disable_at||pt(t.disable_at)))}function bt(e){const t=mt(e);return!!t&&(!(void 0!==t.friendly_name&&"string"!=typeof t.friendly_name||!pt(t.resume_at)||void 0!==t.disable_at&&!pt(t.disable_at))&&(void 0===t.disable_at||Date.parse(t.disable_at)<Date.parse(t.resume_at)))}function ft(e){const t=mt(e);if(!t)return null;const o={};let i=0;for(const[e,a]of Object.entries(t))e.startsWith("automation.")&&_t(a)&&(o[e]=a,i+=1);return i===Object.keys(t).length?e:o}function yt(e){const t=mt(e);if(!t)return null;const o={};let i=0;for(const[e,a]of Object.entries(t))e.startsWith("automation.")&&bt(a)&&(o[e]=a,i+=1);return i===Object.keys(t).length?e:o}function vt(e){if(0===Object.keys(e).length)return nt;const t={};return Object.entries(e).forEach(([e,o])=>{const i=o.resume_at;t[i]||(t[i]={resumeAt:i,disableAt:o.disable_at,automations:[]}),t[i].automations.push({entity_id:e,friendly_name:o.friendly_name,resume_at:o.resume_at,paused_at:o.paused_at,days:o.days,hours:o.hours,minutes:o.minutes,disable_at:o.disable_at,notification_trigger:o.notification_trigger})}),Object.values(t).sort((e,t)=>new Date(e.resumeAt).getTime()-new Date(t.resumeAt).getTime())}function xt(e){const t=e?.states?.[at]?.attributes,o=mt(t),i=o?.schema_version,a=o?.paused??o?.paused_automations,s=o?.scheduled??o?.scheduled_snoozes;if(t===lt&&i===dt&&a===ut&&s===ct&&ht)return ht;const r=function(e){const t=mt(e);if(!t)return{paused:st,scheduled:rt};const o=t.schema_version;if(1===o){const e=ft(t.paused),o=yt(t.scheduled);return e&&o?{paused:e,scheduled:o}:{paused:st,scheduled:rt}}if(void 0===o){const e=ft(t.paused)??ft(t.paused_automations)??{},o=yt(t.scheduled)??yt(t.scheduled_snoozes)??{};if(Object.keys(e).length>0||Object.keys(o).length>0)return{paused:e,scheduled:o}}const i=ft(t.paused_automations),a=yt(t.scheduled_snoozes);return{paused:i??st,scheduled:a??rt}}(t);return lt=t,dt=i,ut=a,ct=s,ht={paused:r.paused,scheduled:r.scheduled,groups:vt(r.paused)},ht}const wt=at;function At(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function zt(e){return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}function $t(e){return{adjustModalOpen:!0,adjustModalEntityId:e.entityId??"",adjustModalFriendlyName:e.friendlyName??"",adjustModalResumeAt:e.resumeAt,adjustModalEntityIds:e.entityIds??[],adjustModalFriendlyNames:e.friendlyNames??[]}}function St(e){return t=e,Xe.subscribers.add(t),et(),()=>{Xe.subscribers.delete(t),et()};var t}function kt(e){!function(e){Xe.hidden=e,et()}(e)}function Ct(){return function(){try{const e=localStorage.getItem(tt);if(!e)return null;const t=JSON.parse(e);return"number"!=typeof t.minutes||"number"!=typeof t.duration?.days||"number"!=typeof t.duration?.hours||"number"!=typeof t.duration?.minutes||"number"!=typeof t.timestamp?null:Date.now()-t.timestamp>6048e5?(localStorage.removeItem(tt),null):t}catch{return null}}()}function Mt(){return it().map(e=>e.id)}async function Tt(e){return async function(e){const t=Ze(e),o=We.get(t);if(o)return o.promise;const i={promise:Promise.resolve(null),value:null};return i.promise=(async()=>{try{const t=await e.connection.sendMessagePromise({type:"config/label_registry/list"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.label_id]=e}),i.value=o,o}catch(e){return console.warn("[AutoSnooze] Failed to fetch label registry:",e),i.value=null,We.get(t)===i&&We.delete(t),null}})(),We.set(t,i),i.promise}(e)}async function Rt(e){return async function(e){const t=Ze(e),o=Ke.get(t);if(o)return o.promise;const i={promise:Promise.resolve({}),value:{}};return i.promise=(async()=>{try{const t=await e.connection.sendMessagePromise({type:"config/category_registry/list",scope:"automation"}),o={};return Array.isArray(t)&&t.forEach(e=>{o[e.category_id]=e}),i.value=o,o}catch(e){return console.warn("[AutoSnooze] Failed to fetch category registry:",e),i.value={},Ke.get(t)===i&&Ke.delete(t),{}}})(),Ke.set(t,i),i.promise}(e)}async function Dt(e){return async function(e){const t=Ze(e),o=Ye.get(t);if(o)return o.promise;const i={promise:Promise.resolve({}),value:{}};return i.promise=(async()=>{try{const t=await e.connection.sendMessagePromise({type:"config/entity_registry/list"}),o={};return Array.isArray(t)&&t.filter(e=>e.entity_id.startsWith("automation.")).forEach(e=>{o[e.entity_id]=e}),i.value=o,o}catch(e){return console.warn("[AutoSnooze] Failed to fetch entity registry:",e),i.value={},Ye.get(t)===i&&Ye.delete(t),{}}})(),Ye.set(t,i),i.promise}(e)}function jt(e){return xt(e)}function Pt(e){return Boolean(e?.states?.[at])}function Et(e){return e.replace(/_/g," ").replace(/\b\w/g,e=>e.toUpperCase())}function It(e,t,o="Unassigned"){return e?t.areas?.[e]?.name??Et(e):o}function Ft(e,t){return t[e]?.name??Et(e)}function Lt(e,t,o="Uncategorized"){return e?t[e]?.name??Et(e):o}function Nt(e,t,o){return!(!e.labels||0===e.labels.length)&&e.labels.some(e=>{const i=o[e]?.name;return i?.toLowerCase()===t})}function Ut(e,t,o){const i={};return e.forEach(e=>{const a=t(e);if(!a||0===a.length)return i[o]||(i[o]=[]),void i[o].push(e.automation);a.forEach(t=>{i[t]||(i[t]=[]),i[t].push(e.automation)})}),Object.entries(i).sort((e,t)=>e[0]===o?1:t[0]===o?-1:e[0].localeCompare(t[0]))}function Ot(e){const t=new Set([Ee.toLowerCase(),Ie.toLowerCase()]),o=e.search.toLowerCase(),i=new Set,a=new Set,s=new Set,r=e.automations.map(o=>{o.area_id&&i.add(o.area_id),o.category_id&&s.add(o.category_id);const r=function(e,t,o){return e.labels?.length?e.labels.map(e=>Ft(e,t)).filter(e=>!o.has(e.toLowerCase())):[]}(o,e.labelRegistry,t);return o.labels?.length&&o.labels.forEach(o=>{const i=Ft(o,e.labelRegistry).toLowerCase();t.has(i)||a.add(o)}),{automation:o,areaName:o.area_id?e.hass?It(o.area_id,e.hass,e.emptyAreaLabel):Et(o.area_id):e.emptyAreaLabel,categoryName:o.category_id?Lt(o.category_id,e.categoryRegistry,e.emptyCategoryLabel):e.emptyCategoryLabel,visibleLabelNames:r,hasIncludeLabel:Nt(o,Ie,e.labelRegistry),hasExcludeLabel:Nt(o,Ee,e.labelRegistry)}}),n=r.some(e=>e.hasIncludeLabel),l=r.filter(e=>!!(n?e.hasIncludeLabel:!e.hasExcludeLabel)&&(!o||(e.automation.name.toLowerCase().includes(o)||e.automation.id.toLowerCase().includes(o)))),d="areas"===e.filterTab?Ut(l,e=>e.automation.area_id?[e.areaName]:null,e.emptyAreaLabel):"categories"===e.filterTab?Ut(l,e=>e.automation.category_id?[e.categoryName]:null,e.emptyCategoryLabel):"labels"===e.filterTab?Ut(l,e=>e.visibleLabelNames.length>0?e.visibleLabelNames:null,e.emptyLabelLabel):[];return{filtered:l.map(e=>e.automation),grouped:d,areaCount:i.size,labelCount:a.size,categoryCount:s.size}}async function Ht(e,t,o,i={}){const a=await e.callService("autosnooze",t,o,i.returnResponse?{return_response:!0}:void 0);if(null!=a){if(!function(e){if(!e||"object"!=typeof e)return!1;const t=e;return"number"==typeof t.schema_version&&"string"==typeof t.command&&"string"==typeof t.status&&"boolean"==typeof t.complete_success&&"boolean"==typeof t.partial_success&&Array.isArray(t.entities)&&Array.isArray(t.recovery_required_entities)}(a))throw new Error(`[AutoSnooze] Unexpected ${t} service response shape`);return a}}async function Vt(e,t,o={}){try{return await Ht(e,"cancel",{entity_id:t},o)}catch(e){throw console.error("[AutoSnooze] Failed to wake automation:",e),e}}async function Gt(e,t){try{await e.callService("autosnooze","cancel_scheduled",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to cancel scheduled snooze:",e),e}}const Bt=new Map;function qt(e,t){if(!e||!t)return null;const o=new Date(`${e}T${t}`);if(Number.isNaN(o.getTime()))return null;const i=`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`,a=`${String(o.getHours()).padStart(2,"0")}:${String(o.getMinutes()).padStart(2,"0")}`;if(i!==e||a!==t)return null;const s=o.getTimezoneOffset(),r=s<=0?"+":"-",n=Math.abs(s);return`${e}T${t}${`${r}${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}`}function Wt(e,t,o){return t&&"none"!==t?"about_to_end"===t?void 0===o?{...e,notification_trigger:t}:{...e,notification_trigger:t,notification_lead_minutes:o}:{...e,notification_trigger:t}:e}const Kt="autosnooze_confirm",Yt=["alarm","security","siren","lock","smoke","carbon monoxide","co2","leak","flood","fire","gas"];function Zt(e){return Yt.some(t=>{const o=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?<![a-z0-9])${o}(?![a-z0-9])`,"i").test(e)})}function Jt(e){const t=new Set(e.selected);return e.automations.some(o=>{return!!t.has(o.id)&&(i=o.labels,a=e.labelRegistry,i.some(e=>e===Kt||a[e]?.name===Kt)||Zt(o.id)||Zt(o.name));var i,a})}async function Xt(e){const t=e.scheduleMode?function(e){const t=e.disableAtDate&&e.disableAtTime?qt(e.disableAtDate,e.disableAtTime):null,o=qt(e.resumeAtDate,e.resumeAtTime);if(!o)return null;const i=Wt({entity_id:e.selected,resume_at:o,...t&&{disable_at:t},...e.forceConfirm&&{confirm:!0}},e.notificationTrigger,e.notificationLeadMinutes),a=e.selected.length;return{request:i,toastMessage:t?1===a?be(e.hass,"toast.success.scheduled_one"):be(e.hass,"toast.success.scheduled_many",{count:a}):1===a?be(e.hass,"toast.success.snoozed_until_one",{time:Ve(o,e.hass.locale?.language)}):be(e.hass,"toast.success.snoozed_until_many",{count:a,time:Ve(o,e.hass.locale?.language)})}}(e):function(e){const{days:t,hours:o,minutes:i}=e.customDuration,a={minutes:Le(e.customDuration),duration:e.customDuration,timestamp:Date.now()};return{request:Wt({entity_id:e.selected,days:t,hours:o,minutes:i,...e.forceConfirm&&{confirm:!0}},e.notificationTrigger,e.notificationLeadMinutes),toastMessage:1===e.selected.length?be(e.hass,"toast.success.snoozed_for_one",{duration:Be(t,o,i)}):be(e.hass,"toast.success.snoozed_for_many",{count:e.selected.length,duration:Be(t,o,i)}),lastDuration:a}}(e);if(!t)return{status:"aborted"};let o;try{if(o=await async function(e,t,o={}){try{return await Ht(e,"pause",t,o)}catch(e){throw console.error("[AutoSnooze] Failed to pause automations:",e),e}}(e.hass,t.request,{returnResponse:!0}),o&&!o.complete_success&&o.entities.every(e=>"succeeded"!==e.outcome))throw new Error("pause_command_failed")}catch(e){if("confirm_required"===function(e){const t=e;return t?.translation_key??t?.data?.translation_key}(e))return{status:"confirm_required"};throw e}const i=o?.entities.filter(e=>"succeeded"===e.outcome).map(e=>e.entity_id)??e.selected,a=o?.entities.filter(e=>"succeeded"!==e.outcome).map(e=>e.entity_id)??[];return function(e){try{const t=Date.now(),o=it(),i=e.map(e=>({id:e,timestamp:t})),a=new Set(e),s=[...i,...o.filter(e=>!a.has(e.id))].slice(0,10);localStorage.setItem(ot,JSON.stringify(s))}catch{}}(i),function(e){return"lastDuration"in e}(t)?(function(e,t){try{const o={minutes:t,duration:e,timestamp:Date.now()};localStorage.setItem(tt,JSON.stringify(o))}catch{}}(t.lastDuration.duration,t.lastDuration.minutes),{status:"submitted",toastMessage:t.toastMessage,lastDuration:t.lastDuration,commandResponse:o,succeeded:i,failed:a}):{status:"submitted",toastMessage:t.toastMessage,commandResponse:o,succeeded:i,failed:a}}function Qt(e,t){return e?{succeeded:e.entities.filter(e=>"succeeded"===e.outcome).map(e=>e.entity_id),failed:e.entities.filter(e=>"succeeded"!==e.outcome).map(e=>e.entity_id)}:{succeeded:t,failed:[]}}async function eo(e){const t=await async function(e,t={}){try{return await Ht(e,"cancel_all",{},t)}catch(e){throw console.error("[AutoSnooze] Failed to wake all automations:",e),e}}(e,{returnResponse:!0}),o=t?.entities.map(e=>e.entity_id)??[],{succeeded:i,failed:a}=Qt(t,o);if(t&&!t.complete_success&&0===i.length)throw new Error("wake_all_command_failed");return{commandResponse:t,succeeded:i,failed:a}}async function to(e,t){await async function(e,t){try{await e.callService("autosnooze","clear_notification",{entity_id:t})}catch(e){throw console.error("[AutoSnooze] Failed to clear snooze notification:",e),e}}(e,t)}const oo={resume_time_required:"Resume time is required",resume_time_past:"Resume time must be in the future",disable_before_resume:"Snooze time must be before resume time"};function io(e){const t={status:"error",message:oo[e]};return Object.defineProperty(t,"code",{value:e,enumerable:!1}),t}function ao(e){if(!e)return null;const t=new Date(e).getTime();return Number.isFinite(t)?t:null}async function so(e,t,o){const{entityId:i,entityIds:a,...s}=t,r=a||i||"";await async function(e,t,o){try{await e.callService("autosnooze","adjust",{entity_id:t,...o})}catch(e){throw console.error("[AutoSnooze] Failed to adjust snooze:",e),e}}(e,r,s);const n=24*(s.days||0)*60*60*1e3+60*(s.hours||0)*60*1e3+60*(s.minutes||0)*1e3;return{nextResumeAt:new Date(new Date(o).getTime()+n).toISOString()}}class ro{constructor(){this._config={type:"custom:autosnooze-card",title:"AutoSnooze"},this._cardStore=new Oe,this._listeners=new Set,this._labelsFetched=!1,this._categoriesFetched=!1,this._entityRegistryFetched=!1,this._labelRegistryFetchPromise=null,this._categoryRegistryFetchPromise=null,this._entityRegistryFetchPromise=null,this._labelRegistryRetryTimeout=null,this._labelRegistryRetryDelayMs=Re,this._automationsCache=null,this._automationsCacheVersion=0,this._lastAutomationFingerprint="",this._lastCacheVersion=0,this._toastTimeout=null,this._toastFadeTimeout=null,this._undoToken=0,this._pendingUndo=null,this._connected=!1,this._pendingActions=new Set,this._viewModel=this._buildViewModel(),this._viewModel.local.lastDuration=Ct(),this._refreshRecentSnoozeIds()}subscribe(e){return this._listeners.add(e),()=>this._listeners.delete(e)}getViewModel(){return{server:{...(e=this._viewModel).server,paused:{...e.server.paused},scheduled:{...e.server.scheduled},groups:[...e.server.groups]},local:{...e.local,selected:[...e.local.selected],customDuration:{...e.local.customDuration},recentSnoozeIds:[...e.local.recentSnoozeIds],pendingActions:[...e.local.pendingActions]},registry:{labels:{...e.registry.labels},categories:{...e.registry.categories},entities:{...e.registry.entities},labelRegistryUnavailable:e.registry.labelRegistryUnavailable},derived:{automations:[...e.derived.automations]},modal:{...e.modal,entityIds:[...e.modal.entityIds],friendlyNames:[...e.modal.friendlyNames]},toast:e.toast?{...e.toast}:null,persistentStatus:e.persistentStatus};var e}getAutomationReadModel(){return this._getAutomations()}get labelsFetched(){return this._labelsFetched}get labelRegistryRetryTimeout(){return this._labelRegistryRetryTimeout}get automationsCache(){return this._automationsCache}set automationsCache(e){this._automationsCache=e}get automationsCacheKey(){return this._lastAutomationFingerprint||null}set automationsCacheKey(e){this._lastAutomationFingerprint=e??""}set labelRegistry(e){this._viewModel.registry.labels=e,this._automationsCacheVersion+=1,this._rebuildViewModel()}get labelRegistry(){return this._viewModel.registry.labels}set labelRegistryUnavailable(e){this._viewModel.registry.labelRegistryUnavailable=e,this._notify()}get labelRegistryUnavailable(){return this._viewModel.registry.labelRegistryUnavailable}set entityRegistry(e){this._viewModel.registry.entities=e,this._automationsCacheVersion+=1,this._rebuildViewModel()}get entityRegistry(){return this._viewModel.registry.entities}async fetchLabelRegistry(){await this._fetchLabelRegistry()}getPaused(){return this._getPausedSnapshot().paused}getScheduled(){return this._getPausedSnapshot().scheduled}set loading(e){this._viewModel.local.loading=e,this._notify()}set labelsFetched(e){this._labelsFetched=e,e||(this._labelRegistryFetchPromise=null,this._hass&&Je(this._hass))}set labelRegistryRetryTimeout(e){this._labelRegistryRetryTimeout=e}showToast(e,t={}){this._showToast(e,t)}setCustomDuration(e){this._cardStore.setDuration(e,this._viewModel.local.customDurationInput);const t=this._cardStore.getState();this._viewModel.local.customDuration={...t.customDuration},this._viewModel.local.durationMs=t.durationMs,this._notify()}get customDuration(){return this._viewModel.local.customDuration}set customDurationInput(e){this._viewModel.local.customDurationInput=e,this._notify()}get customDurationInput(){return this._viewModel.local.customDurationInput}set durationMs(e){this._viewModel.local.durationMs=e,this._notify()}get durationMs(){return this._viewModel.local.durationMs}set lastDuration(e){this._viewModel.local.lastDuration=e,this._notify()}get lastDuration(){return this._viewModel.local.lastDuration}set showCustomInput(e){this._viewModel.local.showCustomInput=e,this._notify()}get showCustomInput(){return this._viewModel.local.showCustomInput}get guardrailConfirmOpen(){return this._viewModel.local.guardrailConfirmOpen}get categoriesFetched(){return this._categoriesFetched}set categoriesFetched(e){this._categoriesFetched=e,e||(this._categoryRegistryFetchPromise=null,this._hass&&Je(this._hass))}get entityRegistryFetched(){return this._entityRegistryFetched}set entityRegistryFetched(e){this._entityRegistryFetched=e,e||(this._entityRegistryFetchPromise=null,this._hass&&Je(this._hass))}get automationsCacheVersion(){return this._automationsCacheVersion}set automationsCacheVersion(e){this._automationsCacheVersion=e}set categoryRegistry(e){this._viewModel.registry.categories=e,this._rebuildViewModel()}get categoryRegistry(){return this._viewModel.registry.categories}async fetchCategoryRegistry(){await this._fetchCategoryRegistry()}async fetchEntityRegistry(){await this._fetchEntityRegistry()}getPausedGroupedByResumeTime(){return this._getPausedSnapshot().groups}getLocale(){return this._hass?.locale?.language}hasDisableAt(){return Boolean(this._viewModel.local.disableAtDate&&this._viewModel.local.disableAtTime)}setConfig(e){this._config=e,this._notify()}getConfig(){return this._config}connect(e){this._connected=!0,e&&(this._hass=e),this._ensureRegistriesLoaded(),this._viewModel.local.lastDuration=Ct(),this._refreshRecentSnoozeIds(),this._rebuildViewModel()}disconnect(){this._connected=!1,this._clearToastTimers(),null!==this._labelRegistryRetryTimeout&&(clearTimeout(this._labelRegistryRetryTimeout),this._labelRegistryRetryTimeout=null)}setHass(e){const t=!this._hass||!e||this._haveAutomationStatesChanged(this._hass.states??{},e.states??{});this._hass=e,this._syncAdjustModalWithPausedState(),!e?.connection||this._labelsFetched||null!==this._labelRegistryRetryTimeout||this._labelRegistryFetchPromise||this._fetchLabelRegistry(),this._rebuildViewModel(t)}shouldUpdateHass(e,t){if(!e||!t)return!0;const o=e.states?.[wt],i=t.states?.[wt];if(o!==i)return!0;if(e.entities!==t.entities)return!0;if(e.areas!==t.areas)return!0;if((e.language??e.locale?.language)!==(t.language??t.locale?.language))return!0;const a=t.states,s=e.states;return!a||!s||s!==a&&this._haveAutomationStatesChanged(s,a)}getCardSize(){const e=this._hass?.states?.[wt]?.attributes,t=e&&"object"==typeof e?e:{},o=t.paused??t.paused_automations??{},i=t.scheduled??t.scheduled_snoozes??{};return 4+Object.keys(o).length+Object.keys(i).length}setSelection(e){this._cardStore.setSelection(e),this._viewModel.local.selected=[...this._cardStore.getState().selected],this._notify()}setDurationState(e,t,o){this._cardStore.setDuration(e,t);const i=this._cardStore.getState();this._viewModel.local.durationMs=i.durationMs,this._viewModel.local.customDuration={...i.customDuration},this._viewModel.local.customDurationInput=i.customDurationInput,void 0!==o&&(this._viewModel.local.showCustomInput=o),this._notify()}setScheduleMode(e){const t=function(e){if(!e.enabled)return{scheduleMode:!1,disableAtDate:"",disableAtTime:"",resumeAtDate:"",resumeAtTime:""};const t=new Date(e.now.getTime()+60*e.resumeMinutes*1e3);return{scheduleMode:!0,disableAtDate:At(e.now),disableAtTime:zt(e.now),resumeAtDate:At(t),resumeAtTime:zt(t)}}({enabled:e,now:new Date,resumeMinutes:this._viewModel.local.lastDuration?.minutes??30});this._viewModel.local.scheduleMode=t.scheduleMode,e&&(this._viewModel.local.disableAtDate=t.disableAtDate,this._viewModel.local.disableAtTime=t.disableAtTime,this._viewModel.local.resumeAtDate=t.resumeAtDate,this._viewModel.local.resumeAtTime=t.resumeAtTime),this._notify()}setScheduleField(e,t){switch(e){case"disableAtDate":this._viewModel.local.disableAtDate=t;break;case"disableAtTime":this._viewModel.local.disableAtTime=t;break;case"resumeAtDate":this._viewModel.local.resumeAtDate=t;break;case"resumeAtTime":this._viewModel.local.resumeAtTime=t;break;default:return}this._notify()}setShowCustomInput(e){this._viewModel.local.showCustomInput=e,this._notify()}setNotificationsEnabled(e){this._viewModel.local.notificationsEnabled=e,this._notify()}setNotificationTrigger(e){this._viewModel.local.notificationTrigger=e,this._notify()}setNotificationLeadMinutes(e){this._viewModel.local.notificationLeadMinutes=e,this._notify()}dismissGuardrail(){this._viewModel.local.guardrailConfirmOpen=!1,this._notify()}openAdjustAutomation(e){const t=$t(e);this._applyAdjustModalState(t),this._notify()}openAdjustGroup(e){const t=$t(e);this._applyAdjustModalState(t),this._notify()}closeAdjustModal(){this._applyAdjustModalState({adjustModalOpen:!1,adjustModalEntityId:"",adjustModalFriendlyName:"",adjustModalResumeAt:"",adjustModalEntityIds:[],adjustModalFriendlyNames:[]}),this._notify()}setAdjustModalResumeAt(e){this._viewModel.modal.resumeAt=e,this._notify()}formatDateTime(e){return Ve(e,this._hass?.locale?.language)}formatLeadLabel(e){const{days:t,hours:o,minutes:i}=Ne(e);return Be(t,o,i)}hasResumeAt(){return Boolean(this._viewModel.local.resumeAtDate&&this._viewModel.local.resumeAtTime)}async runSnooze(e=!1){const t=this._viewModel.local;if(0!==t.selected.length&&!t.loading){if(t.scheduleMode){if(!this.hasResumeAt())return void this._showToast(be(this._hass,"toast.error.resume_time_required"));const e=function(e){const t=ao(qt(e.resumeAtDate,e.resumeAtTime));if(null===t)return io("resume_time_required");if(t<=e.nowMs)return io("resume_time_past");const o=e.disableAtDate&&e.disableAtTime?qt(e.disableAtDate,e.disableAtTime):null;if(e.disableAtDate&&e.disableAtTime&&null===o)return io("disable_before_resume");if(o){const e=ao(o);if(null===e)return io("disable_before_resume");if(e>=t)return io("disable_before_resume")}return{status:"valid"}}({disableAtDate:t.disableAtDate,disableAtTime:t.disableAtTime,resumeAtDate:t.resumeAtDate,resumeAtTime:t.resumeAtTime,nowMs:Date.now()+Te});if("error"===e.status)return void this._showToast(function(e,t){switch(t){case"resume_time_required":default:return be(e,"toast.error.invalid_datetime");case"resume_time_past":return be(e,"toast.error.resume_time_past");case"disable_before_resume":return be(e,"toast.error.snooze_before_resume")}}(this._hass,e.code))}else if(0===t.durationMs)return;if(!e&&Jt({selected:t.selected,automations:this._viewModel.derived.automations,labelRegistry:this._viewModel.registry.labels}))return this._viewModel.local.guardrailConfirmOpen=!0,void this._notify();this._viewModel.local.loading=!0,this._viewModel.local.guardrailConfirmOpen=!1,this._notify();try{if(!this._hass)return;const o=t.selected.length,i=[...t.selected],a=t.scheduleMode,s=Boolean(t.disableAtDate&&t.disableAtTime),r=await Xt({hass:this._hass,selected:t.selected,scheduleMode:t.scheduleMode,customDuration:t.customDuration,disableAtDate:t.disableAtDate,disableAtTime:t.disableAtTime,resumeAtDate:t.resumeAtDate,resumeAtTime:t.resumeAtTime,forceConfirm:e,...t.notificationsEnabled&&{notificationTrigger:t.notificationTrigger,..."about_to_end"===t.notificationTrigger&&{notificationLeadMinutes:t.notificationLeadMinutes}}});if("confirm_required"===r.status)return void(this._viewModel.local.guardrailConfirmOpen=!0);if("aborted"===r.status)return;if(r.lastDuration&&(this._viewModel.local.lastDuration=r.lastDuration),this._refreshRecentSnoozeIds(),!this._connected)return;He("success"),this._pendingUndo={entities:i,wasScheduleMode:a,hadDisableAt:s,count:o},this._showToast(r.toastMessage,{showUndo:!0}),this._recordCommandOutcome(r.commandResponse,r.toastMessage,r.failed??[]),this.setSelection(r.failed??[]),this._viewModel.local.notificationsEnabled=!1,this._viewModel.local.notificationTrigger="end",this._viewModel.local.notificationLeadMinutes=60,this._viewModel.local.disableAtDate="",this._viewModel.local.disableAtTime="",this._viewModel.local.resumeAtDate="",this._viewModel.local.resumeAtTime=""}catch(e){console.error("Snooze failed:",e),He("failure")}finally{this._viewModel.local.loading=!1,this._notify()}}}async runGuardrailContinue(){this._viewModel.local.guardrailConfirmOpen=!1,this._notify(),await this.runSnooze(!0)}async runWake(e){const t=`resume:${e}`;if(this._hass&&this._beginPending(t))try{const t=await async function(e,t){const o=await Vt(e,t,{returnResponse:!0}),{succeeded:i,failed:a}=Qt(o,[t]);if(o&&!o.complete_success&&0===i.length)throw new Error("wake_command_failed");return{commandResponse:o,succeeded:i,failed:a}}(this._hass,e);this._recordCommandOutcome(t.commandResponse,void 0,t.failed),He("success"),this._connected&&this._showToast(be(this._hass,"toast.success.resumed"))}catch(e){console.error("Wake failed:",e),He("failure")}finally{this._endPending(t)}}async runWakeAll(){const e="resume-all";if(this._hass&&this._beginPending(e))try{const e=await eo(this._hass);this._recordCommandOutcome(e.commandResponse,void 0,e.failed),He("success"),this._connected&&this._showToast(be(this._hass,"toast.success.resumed_all"))}catch(e){console.error("Wake all failed:",e),He("failure")}finally{this._endPending(e)}}async runClearNotification(e){if(this._hass)try{await to(this._hass,e),He("success")}catch(e){console.error("Clear notification failed:",e),He("failure")}}async runAdjustTime(e){const t=`adjust:${[...e.entityIds??[],...e.entityId?[e.entityId]:[]].sort().join(",")}`;if(this._hass&&this._beginPending(t))try{const t=await so(this._hass,e,this._viewModel.modal.resumeAt);He("success"),this._viewModel.modal.resumeAt=t.nextResumeAt,this._notify(),this._connected&&this._showToast(be(this._hass,"toast.success.adjusted"))}catch(e){console.error("Adjust failed:",e),He("failure")}finally{this._endPending(t)}}async runCancelScheduled(e){const t=`cancel:${e}`;if(this._hass&&this._beginPending(t))try{await async function(e,t){await Gt(e,t)}(this._hass,e),He("success"),this._connected&&this._showToast(be(this._hass,"toast.success.cancelled"))}catch(e){console.error("Cancel scheduled failed:",e),He("failure")}finally{this._endPending(t)}}_beginPending(e){return!this._pendingActions.has(e)&&(this._pendingActions.add(e),this._viewModel.local.pendingActions=[...this._pendingActions],this._notify(),!0)}_endPending(e){this._pendingActions.delete(e),this._viewModel.local.pendingActions=[...this._pendingActions],this._notify()}_recordCommandOutcome(e,t,o=[]){const i=e?.recovery_required_entities??(t?.toLowerCase().includes("recovery required")?o:[]),a=e?.entities.filter(e=>"retrying"===e.recovery_status).map(e=>e.entity_id)??[];i.length>0?this._viewModel.persistentStatus=`Recovery required: ${i.join(", ")}`:a.length>0?this._viewModel.persistentStatus=`Retrying: ${a.join(", ")}`:o.length>0?this._viewModel.persistentStatus=`Partial success. Retry: ${o.join(", ")}`:this._viewModel.persistentStatus=null,this._notify()}async runToastUndo(){const e=this._pendingUndo;if(e&&this._hass)try{const t=await async function(e,t,o){if(o.wasScheduleMode&&o.hadDisableAt){const o=await Promise.allSettled(t.map(t=>Gt(e,t))),i=[],a=[];return o.forEach((e,o)=>{const s=t[o];s&&("fulfilled"===e.status?i.push(s):a.push(s))}),{succeeded:i,failed:a}}const i=Vt(e,t,{returnResponse:!0}),a=await i,{succeeded:s,failed:r}=Qt(a,t);return{succeeded:s,failed:r}}(this._hass,e.entities,{wasScheduleMode:e.wasScheduleMode,hadDisableAt:e.hadDisableAt});if(!this._connected)return;if(0===t.failed.length){this.setSelection(e.entities);const t=1===e.count?be(this._hass,"toast.success.restored_one"):be(this._hass,"toast.success.restored_many",{count:e.count});this._showToast(t)}else this.setSelection(t.failed),this._showToast(be(this._hass,"toast.error.undo_failed"))}catch(e){console.error("Undo failed:",e),this._connected&&this._showToast(be(this._hass,"toast.error.undo_failed"))}finally{this._pendingUndo=null}}dismissToast(){this._viewModel.toast=null,this._clearToastTimers(),this._notify()}_notify(){for(const e of this._listeners)e()}_buildViewModel(){const e=this._cardStore.getState(),t=this._getPausedSnapshot();return{server:{paused:t.paused,scheduled:t.scheduled,groups:t.groups,pausedCount:Object.keys(t.paused).length,scheduledCount:Object.keys(t.scheduled).length,sensorAvailable:Pt(this._hass)},local:{selected:[...e.selected],durationMs:e.durationMs,customDuration:{...e.customDuration},customDurationInput:e.customDurationInput,loading:!1,pendingActions:[],scheduleMode:!1,notificationsEnabled:!1,notificationTrigger:"end",notificationLeadMinutes:60,disableAtDate:"",disableAtTime:"",resumeAtDate:"",resumeAtTime:"",showCustomInput:!1,lastDuration:null,recentSnoozeIds:[],guardrailConfirmOpen:!1},registry:{labels:{},categories:{},entities:{},labelRegistryUnavailable:!1},derived:{automations:[]},modal:{open:!1,entityId:"",friendlyName:"",resumeAt:"",entityIds:[],friendlyNames:[]},toast:null,persistentStatus:null}}_rebuildViewModel(e=!0){const t=this._getPausedSnapshot(),o=this._cardStore.getState(),i=this._viewModel.local;this._viewModel.server={paused:t.paused,scheduled:t.scheduled,groups:t.groups,pausedCount:Object.keys(t.paused).length,scheduledCount:Object.keys(t.scheduled).length,sensorAvailable:Pt(this._hass)},this._viewModel.local={...i,selected:[...o.selected],durationMs:o.durationMs,customDuration:{...o.customDuration},customDurationInput:o.customDurationInput},this._viewModel.registry={labels:{...this._viewModel.registry.labels},categories:{...this._viewModel.registry.categories},entities:{...this._viewModel.registry.entities},labelRegistryUnavailable:this._viewModel.registry.labelRegistryUnavailable},e&&(this._viewModel.derived.automations=this._getAutomations()),this._notify()}_getPausedSnapshot(){return this._hass?jt(this._hass):{paused:{},scheduled:{},groups:[]}}_getAutomationFingerprint(e){return Object.keys(e).filter(e=>e.startsWith("automation.")).sort().map(t=>{const o=e[t];return`${t}:${o?.state??""}:${o?.last_changed??""}:${o?.last_updated??""}`}).join("|")}_getAutomations(){if(!this._hass?.states)return[];const e=this._getAutomationFingerprint(this._hass.states),t=this._automationsCacheVersion;if(this._lastAutomationFingerprint===e&&this._lastCacheVersion===t&&this._automationsCache)return this._automationsCache;const o=function(e,t){const o=e?.states,i=e?.entities;return o?Object.keys(o).filter(e=>e.startsWith("automation.")).map(e=>{const a=o[e];if(!a)return null;const s=t?.[e],r=i?.[e],n=s?.categories??{};return{id:e,name:a.attributes?.friendly_name??e.replace("automation.",""),area_id:s?.area_id??r?.area_id??null,category_id:n.automation??null,labels:s?.labels??r?.labels??[]}}).filter(e=>null!==e).sort((e,t)=>e.name.localeCompare(t.name)):[]}(this._hass,this._viewModel.registry.entities);return this._automationsCache=o,this._lastCacheVersion=t,this._lastAutomationFingerprint=e,o}_refreshRecentSnoozeIds(){this._viewModel.local.recentSnoozeIds=Mt()}ensureRegistriesOnHassUpdate(){this._ensureRegistriesLoaded()}_ensureRegistriesLoaded(){this._hass?.connection&&(this._labelsFetched||null!==this._labelRegistryRetryTimeout||this._fetchLabelRegistry(),this._categoriesFetched||this._fetchCategoryRegistry(),this._entityRegistryFetched||this._fetchEntityRegistry())}async _fetchLabelRegistry(){if(!this._labelsFetched&&this._hass?.connection)if(this._labelRegistryFetchPromise)await this._labelRegistryFetchPromise;else{this._labelRegistryFetchPromise=(async()=>{const e=await Tt(this._hass);if(null!==e)this._viewModel.registry.labels=e,this._labelsFetched=!0,this._viewModel.registry.labelRegistryUnavailable=!1,this._automationsCacheVersion+=1,this._labelRegistryRetryDelayMs=Re,null!==this._labelRegistryRetryTimeout&&(clearTimeout(this._labelRegistryRetryTimeout),this._labelRegistryRetryTimeout=null),this._rebuildViewModel();else if(this._labelsFetched=!1,this._viewModel.registry.labelRegistryUnavailable=!0,null===this._labelRegistryRetryTimeout&&this._connected){const e=this._labelRegistryRetryDelayMs;this._labelRegistryRetryTimeout=window.setTimeout(()=>{this._labelRegistryRetryTimeout=null,this._connected&&this._fetchLabelRegistry()},e),this._labelRegistryRetryDelayMs=Math.min(2*this._labelRegistryRetryDelayMs,De)}})();try{await this._labelRegistryFetchPromise}finally{this._labelRegistryFetchPromise=null}}}async _fetchCategoryRegistry(){if(!this._categoriesFetched&&this._hass?.connection)if(this._categoryRegistryFetchPromise)await this._categoryRegistryFetchPromise;else{this._categoryRegistryFetchPromise=(async()=>{this._viewModel.registry.categories=await Rt(this._hass),this._categoriesFetched=!0,this._rebuildViewModel()})();try{await this._categoryRegistryFetchPromise}finally{this._categoryRegistryFetchPromise=null}}}async _fetchEntityRegistry(){if(!this._entityRegistryFetched&&this._hass?.connection)if(this._entityRegistryFetchPromise)await this._entityRegistryFetchPromise;else{this._entityRegistryFetchPromise=(async()=>{this._viewModel.registry.entities=await Dt(this._hass),this._entityRegistryFetched=!0,this._automationsCacheVersion+=1,this._rebuildViewModel()})();try{await this._entityRegistryFetchPromise}finally{this._entityRegistryFetchPromise=null}}}_haveAutomationStatesChanged(e,t){let o=0;for(const[i,a]of Object.entries(e))if(i.startsWith("automation.")){if(o+=1,!(i in t))return!0;if(t[i]!==a)return!0}let i=0;for(const e of Object.keys(t))e.startsWith("automation.")&&(i+=1);return o!==i}_syncAdjustModalWithPausedState(){if(!this._viewModel.modal.open)return;const e=this._getPausedSnapshot().paused;if(this._viewModel.modal.entityIds.length>0){if(!this._viewModel.modal.entityIds.some(t=>e[t]))return void this.closeAdjustModal();const t=this._viewModel.modal.entityIds.find(t=>e[t]);if(t){const o=e[t];o?.resume_at&&o.resume_at!==this._viewModel.modal.resumeAt&&(this._viewModel.modal.resumeAt=o.resume_at,this._notify())}return}if(this._viewModel.modal.entityId){const t=e[this._viewModel.modal.entityId];t?.resume_at&&t.resume_at!==this._viewModel.modal.resumeAt&&(this._viewModel.modal.resumeAt=t.resume_at,this._notify()),t||this.closeAdjustModal()}}_applyAdjustModalState(e){this._viewModel.modal={open:e.adjustModalOpen,entityId:e.adjustModalEntityId,friendlyName:e.adjustModalFriendlyName,resumeAt:e.adjustModalResumeAt,entityIds:[...e.adjustModalEntityIds],friendlyNames:[...e.adjustModalFriendlyNames]}}_showToast(e,t={}){const{showUndo:o=!1,onUndo:i}=t,a=o?++this._undoToken:void 0;this._viewModel.toast={message:e,showUndo:o,undoToken:a,onUndo:i},this._notify(),this._clearToastTimers(),this._toastTimeout=window.setTimeout(()=>{this._toastTimeout=null,this._viewModel.toast=null,this._notify()},Ce)}_clearToastTimers(){null!==this._toastTimeout&&(clearTimeout(this._toastTimeout),this._toastTimeout=null),null!==this._toastFadeTimeout&&(clearTimeout(this._toastFadeTimeout),this._toastFadeTimeout=null)}}const no=Symbol.for("autosnooze.customElements.define.patched"),lo=Symbol.for("autosnooze.customElements.registeredCtors");function uo(){return navigator.userAgent.toLowerCase().includes("jsdom")}function co(){if(!uo())return;const e=customElements;if(e[no])return;const t=e.define.bind(e);e.define=(o,i,a)=>{const s=function(){const e=customElements;return e[lo]??=new WeakSet,e[lo]}();if(s.has(i)&&!e.get(o)){const e=class extends i{};return t(o,e,a),void s.add(e)}try{t(o,i,a),s.add(i)}catch(e){if(!function(e){return e instanceof Error&&e.message.includes("constructor has already been registered")}(e))throw e;const r=class extends i{};t(o,r,a),s.add(r)}},e[no]=!0}function ho(e,t){uo()&&co(),customElements.get(e)||customElements.define(e,t)}class mo extends ne{constructor(){super(),this.config={},this._controller=new ro,this._viewModel=this._controller.getViewModel(),this._unsubscribe=this._controller.subscribe(()=>{this._viewModel=this._controller.getViewModel(),this.requestUpdate()})}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-card",title:"AutoSnooze"}}setConfig(e){this.config=e,this._controller.setConfig(e)}willUpdate(e){super.willUpdate(e),e.has("hass")&&(this._controller.setHass(this.hass),this._viewModel=this._controller.getViewModel()),e.has("config")&&this._controller.setConfig(this.config)}shouldUpdate(e){if(!e.has("hass"))return!0;const t=e.get("hass");return this._controller.shouldUpdateHass(t,this.hass)}connectedCallback(){super.connectedCallback(),this._unsubscribe?.(),this._unsubscribe=this._controller.subscribe(()=>{this._viewModel=this._controller.getViewModel(),this.requestUpdate()}),this._controller.connect(this.hass),this._viewModel=this._controller.getViewModel()}disconnectedCallback(){super.disconnectedCallback(),this._controller.disconnect(),this._unsubscribe?.(),this._unsubscribe=void 0}get _selected(){return this._viewModel.local.selected}set _selected(e){this._controller.setSelection(e)}get _scheduleMode(){return this._viewModel.local.scheduleMode}set _scheduleMode(e){this._controller.setScheduleMode(e)}get _loading(){return this._viewModel.local.loading}set _loading(e){this._controller.loading=e}set _labelsFetched(e){this._controller.labelsFetched=e}set _labelRegistryRetryTimeout(e){this._controller.labelRegistryRetryTimeout=e}get _duration(){return this._controller.durationMs}set _duration(e){this._controller.durationMs=e}get _customDuration(){return this._controller.customDuration}set _customDuration(e){this._controller.setCustomDuration(e)}get _customDurationInput(){return this._controller.customDurationInput}set _customDurationInput(e){this._controller.customDurationInput=e}get _showCustomInput(){return this._controller.showCustomInput}set _showCustomInput(e){this._controller.showCustomInput=e}get _lastDuration(){return this._controller.lastDuration}set _lastDuration(e){this._controller.lastDuration=e}get _labelRegistry(){return this._controller.labelRegistry}set _labelRegistry(e){this._controller.labelRegistry=e}get _labelRegistryUnavailable(){return this._controller.labelRegistryUnavailable}set _labelRegistryUnavailable(e){this._controller.labelRegistryUnavailable=e}get _entityRegistry(){return this._controller.entityRegistry}set _entityRegistry(e){this._controller.entityRegistry=e}get _labelsFetched(){return this._controller.labelsFetched}get _labelRegistryRetryTimeout(){return this._controller.labelRegistryRetryTimeout}get _automationsCache(){return this._controller.automationsCache}set _automationsCache(e){this._controller.automationsCache=e}get _automationsCacheKey(){return this._controller.automationsCacheKey}set _automationsCacheKey(e){this._controller.automationsCacheKey=e}get _adjustModalResumeAt(){return this._viewModel.modal.resumeAt}set _adjustModalResumeAt(e){this._controller.setAdjustModalResumeAt(e)}get _disableAtDate(){return this._viewModel.local.disableAtDate}set _disableAtDate(e){this._controller.setScheduleField("disableAtDate",e)}get _disableAtTime(){return this._viewModel.local.disableAtTime}set _disableAtTime(e){this._controller.setScheduleField("disableAtTime",e)}get _resumeAtDate(){return this._viewModel.local.resumeAtDate}set _resumeAtDate(e){this._controller.setScheduleField("resumeAtDate",e)}get _resumeAtTime(){return this._viewModel.local.resumeAtTime}set _resumeAtTime(e){this._controller.setScheduleField("resumeAtTime",e)}_getAutomations(){return this._controller.setHass(this.hass),this._controller.getAutomationReadModel()}_getPaused(){return this._controller.setHass(this.hass),this._controller.getPaused()}_getScheduled(){return this._controller.setHass(this.hass),this._controller.getScheduled()}_formatDateTime(e){return this._controller.formatDateTime(e)}_showToast(e,t={}){this._controller.showToast(e,{showUndo:t.showUndo,onUndo:t.onUndo??void 0}),this._viewModel=this._controller.getViewModel(),this.requestUpdate(),this.performUpdate()}async _fetchLabelRegistry(){this._controller.setHass(this.hass),await this._controller.fetchLabelRegistry()}async _fetchCategoryRegistry(){this._controller.setHass(this.hass),await this._controller.fetchCategoryRegistry()}async _fetchEntityRegistry(){this._controller.setHass(this.hass),await this._controller.fetchEntityRegistry()}get _categoryRegistry(){return this._controller.categoryRegistry}set _categoryRegistry(e){this._controller.categoryRegistry=e}get _categoriesFetched(){return this._controller.categoriesFetched}set _categoriesFetched(e){this._controller.categoriesFetched=e}get _entityRegistryFetched(){return this._controller.entityRegistryFetched}set _entityRegistryFetched(e){this._controller.entityRegistryFetched=e}get _automationsCacheVersion(){return this._controller.automationsCacheVersion}set _automationsCacheVersion(e){this._controller.automationsCacheVersion=e}get _guardrailConfirmOpen(){return this._controller.guardrailConfirmOpen}set _guardrailConfirmOpen(e){this._setLocalCompatibility({guardrailConfirmOpen:e})}get _recentSnoozeIds(){return this._viewModel.local.recentSnoozeIds}set _recentSnoozeIds(e){this._setLocalCompatibility({recentSnoozeIds:e})}get _notificationsEnabled(){return this._viewModel.local.notificationsEnabled}set _notificationsEnabled(e){this._controller.setNotificationsEnabled(e)}get _notificationTrigger(){return this._viewModel.local.notificationTrigger}set _notificationTrigger(e){this._controller.setNotificationTrigger(e)}get _notificationLeadMinutes(){return this._viewModel.local.notificationLeadMinutes}set _notificationLeadMinutes(e){this._controller.setNotificationLeadMinutes(e)}get _adjustModalOpen(){return this._viewModel.modal.open}set _adjustModalOpen(e){this._setModalCompatibility({open:e})}get _adjustModalEntityId(){return this._viewModel.modal.entityId}set _adjustModalEntityId(e){this._setModalCompatibility({entityId:e})}get _adjustModalFriendlyName(){return this._viewModel.modal.friendlyName}set _adjustModalFriendlyName(e){this._setModalCompatibility({friendlyName:e})}get _adjustModalEntityIds(){return this._viewModel.modal.entityIds}set _adjustModalEntityIds(e){this._setModalCompatibility({entityIds:e})}get _adjustModalFriendlyNames(){return this._viewModel.modal.friendlyNames}set _adjustModalFriendlyNames(e){this._setModalCompatibility({friendlyNames:e})}get _labelRegistryFetchPromise(){return this._compatController._labelRegistryFetchPromise}set _labelRegistryFetchPromise(e){this._compatController._labelRegistryFetchPromise=e}get _categoryRegistryFetchPromise(){return this._compatController._categoryRegistryFetchPromise}set _categoryRegistryFetchPromise(e){this._compatController._categoryRegistryFetchPromise=e}get _entityRegistryFetchPromise(){return this._compatController._entityRegistryFetchPromise}set _entityRegistryFetchPromise(e){this._compatController._entityRegistryFetchPromise=e}get _toastTimeout(){return this._compatController._toastTimeout}get _toastFadeTimeout(){return this._compatController._toastFadeTimeout}_getPausedGroupedByResumeTime(){return this._controller.setHass(this.hass),this._controller.getPausedGroupedByResumeTime()}_getLocale(){return this._controller.getLocale()}_hasResumeAt(){return this._controller.hasResumeAt()}_hasDisableAt(){return this._controller.hasDisableAt()}_haveAutomationStatesChanged(e,t){return this._compatController._haveAutomationStatesChanged(e,t)}_syncAdjustModalWithPausedState(){this._compatController._syncAdjustModalWithPausedState(),this._viewModel=this._controller.getViewModel()}async _snooze(e=!1){this._controller.setHass(this.hass),await this._controller.runSnooze(e),this.performUpdate()}async _cancelScheduled(e){this._controller.setHass(this.hass),await this._controller.runCancelScheduled(e),this.performUpdate()}async _wake(e){this._controller.setHass(this.hass),await this._controller.runWake(e),this.performUpdate()}get _compatController(){return this._controller}_setModalCompatibility(e){Object.assign(this._compatController._viewModel.modal,e),this._viewModel=this._controller.getViewModel(),this.requestUpdate()}_setLocalCompatibility(e){Object.assign(this._compatController._viewModel.local,e),this._viewModel=this._controller.getViewModel(),this.requestUpdate()}getCardSize(){return this._controller.setHass(this.hass),this._controller.getCardSize()}_getAutomationStateFingerprint(e){const t=e;return Object.entries(t??{}).filter(([e])=>e.startsWith("automation.")).map(([e,t])=>`${e}:${t.state}`).sort().join("|")}updated(e){super.updated(e),e.has("hass")&&this._controller.ensureRegistriesOnHassUpdate()}_handleSelectionChange(e){this._controller.setSelection(e.detail.selected)}_handleDurationChange(e){const{duration:t,input:o,showCustomInput:i}=e.detail;this._controller.setDurationState(t,o,i)}_handleScheduleModeChange(e){this._controller.setScheduleMode(e.detail.enabled)}_handleScheduleFieldChange(e){this._controller.setScheduleField(e.detail.field,e.detail.value)}_handleCustomInputToggle(e){this._controller.setShowCustomInput(e.detail.show)}_handleNotificationsToggle(e){this._controller.setNotificationsEnabled(e.target.checked)}_handleNotificationWhenChange(e){this._controller.setNotificationTrigger(e.target.value)}_handleNotificationLeadChange(e){this._controller.setNotificationLeadMinutes(Number(e.target.value))}_handleGuardrailCancel(){this._controller.dismissGuardrail()}_handleGuardrailContinue(){this._controller.runGuardrailContinue()}_handleWakeEvent(e){this._wake(e.detail.entityId)}_handleWakeAllEvent(){this._controller.runWakeAll()}_handleClearNotificationEvent(e){this._controller.runClearNotification(e.detail.entityId)}_handleAdjustAutomationEvent(e){this._controller.openAdjustAutomation(e.detail)}_handleAdjustGroupEvent(e){this._controller.openAdjustGroup(e.detail)}_handleAdjustTimeEvent(e){this._controller.runAdjustTime(e.detail)}_handleCloseModalEvent(){this._controller.closeAdjustModal()}_handleToastUndo(){const e=this._viewModel.toast?.onUndo;if(e)return e(),this._controller.dismissToast(),this._viewModel=this._controller.getViewModel(),void this.requestUpdate();this._controller.runToastUndo()}_renderToast(){const e=this._viewModel.toast;return e?V`
      <div class="toast" role="alert" aria-live="polite" aria-atomic="true">${e.showUndo?V`<span>${e.message}</span><button
            type="button"
            class="toast-undo-btn"
            @click=${()=>this._handleToastUndo()}
            aria-label=${be(this.hass,"a11y.undo_action")}
          >${be(this.hass,"button.undo")}</button>`:e.message}</div>
    `:""}_renderScheduledPauses(e,t){return 0===e?"":V`
      <div class="scheduled-list" role="region" aria-label="${be(this.hass,"a11y.scheduled_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${be(this.hass,"section.scheduled_count",{count:e})}
        </div>

        ${Object.entries(t).map(([e,t])=>V`
            <div class="scheduled-item" role="article" aria-label="${be(this.hass,"a11y.scheduled_pause_for",{name:t.friendly_name||e})}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">
                  ${t.friendly_name||e}
                </div>
                <div class="scheduled-time">
                  ${be(this.hass,"status.disables")} ${this._controller.formatDateTime(t.disable_at||"now")}
                </div>
                <div class="paused-time">
                  ${be(this.hass,"status.resumes_at")} ${this._controller.formatDateTime(t.resume_at)}
                </div>
              </div>
              <button
                type="button"
                class="cancel-scheduled-btn"
                ?disabled=${this._viewModel.local.pendingActions.includes(`cancel:${e}`)}
                @click=${()=>this._cancelScheduled(e)}
                aria-label="${be(this.hass,"a11y.cancel_scheduled_for",{name:t.friendly_name||e})}"
              >
                ${this._viewModel.local.pendingActions.includes(`cancel:${e}`)?"Cancelling...":be(this.hass,"button.cancel")}
              </button>
            </div>
          `)}
      </div>
    `}render(){if(!this.hass||!this.config)return V``;const e=this._viewModel,{server:t,local:o,registry:i,derived:a,modal:s}=e;return V`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title||be(this.hass,"card.default_title")}
          ${t.pausedCount>0||t.scheduledCount>0?V`<span class="status-summary"
                >${t.pausedCount>0?be(this.hass,"status.active_count",{count:t.pausedCount}):""}${t.pausedCount>0&&t.scheduledCount>0?", ":""}${t.scheduledCount>0?be(this.hass,"status.scheduled_count",{count:t.scheduledCount}):""}</span
              >`:""}
        </div>

        ${t.sensorAvailable?"":V`
              <div class="sensor-health-banner" role="status">
                ${be(this.hass,"status.sensor_unavailable")}
              </div>
            `}

        <div class="snooze-setup">
          <autosnooze-automation-list
            .hass=${this.hass}
            .automations=${a.automations}
            .selected=${o.selected}
            .labelRegistry=${i.labels}
            .labelRegistryUnavailable=${i.labelRegistryUnavailable}
            .categoryRegistry=${i.categories}
            .recentSnoozeIds=${o.recentSnoozeIds}
            @selection-change=${this._handleSelectionChange}
          ></autosnooze-automation-list>

          <autosnooze-duration-selector
            .hass=${this.hass}
            .scheduleMode=${o.scheduleMode}
            .customDuration=${o.customDuration}
            .customDurationInput=${o.customDurationInput}
            .showCustomInput=${o.showCustomInput}
            .lastDuration=${o.lastDuration}
            .disableAtDate=${o.disableAtDate}
            .disableAtTime=${o.disableAtTime}
            .resumeAtDate=${o.resumeAtDate}
            .resumeAtTime=${o.resumeAtTime}
            @duration-change=${this._handleDurationChange}
            @schedule-mode-change=${this._handleScheduleModeChange}
            @schedule-field-change=${this._handleScheduleFieldChange}
            @custom-input-toggle=${this._handleCustomInputToggle}
          ></autosnooze-duration-selector>

          <div class="notify-section">
            <label class="notify-toggle">
              <input
                type="checkbox"
                .checked=${o.notificationsEnabled}
                @change=${this._handleNotificationsToggle}
              />
              <ha-icon icon="mdi:bell-outline" aria-hidden="true"></ha-icon>
              <span class="notify-toggle-text">
                ${be(this.hass,"notify.toggle_label")}
              </span>
            </label>

            ${o.notificationsEnabled?V`
              <div class="notify-detail">
                <label class="notify-field">
                  <span class="notify-field-label visually-hidden">${be(this.hass,"notify.when_label")}</span>
                  <select
                    .value=${o.notificationTrigger}
                    @change=${this._handleNotificationWhenChange}
                  >
                    <option value="start">${be(this.hass,"notify.when.start")}</option>
                    <option value="about_to_end">${be(this.hass,"notify.when.about_to_end")}</option>
                    <option value="end">${be(this.hass,"notify.when.end")}</option>
                  </select>
                </label>

                ${"about_to_end"===o.notificationTrigger?V`
                  <label class="notify-field">
                    <span class="notify-field-label visually-hidden">${be(this.hass,"notify.lead_label")}</span>
                    <select
                      .value=${String(o.notificationLeadMinutes)}
                      @change=${this._handleNotificationLeadChange}
                    >
                      ${Pe.map(e=>V`<option value=${String(e)}>${this._controller.formatLeadLabel(e)}</option>`)}
                    </select>
                  </label>
                `:""}
              </div>
            `:""}
          </div>

          ${o.guardrailConfirmOpen?V`
            <div class="guardrail-confirm" role="alertdialog" aria-live="polite">
              <div class="guardrail-title">${be(this.hass,"guardrail.confirm_title")}</div>
              <div class="guardrail-body">${be(this.hass,"guardrail.confirm_body")}</div>
              <div class="guardrail-actions">
                <button type="button" class="guardrail-cancel-btn" @click=${()=>this._handleGuardrailCancel()}>
                  ${be(this.hass,"button.cancel")}
                </button>
                <button type="button" class="guardrail-continue-btn" @click=${()=>this._handleGuardrailContinue()}>
                  ${be(this.hass,"button.continue")}
                </button>
              </div>
            </div>
          `:""}

          <button
            type="button"
            class="snooze-btn"
            ?disabled=${0===o.selected.length||!o.scheduleMode&&(r=o.customDurationInput,!(null!==Fe(r)))||o.scheduleMode&&!this._controller.hasResumeAt()||o.loading}
            @click=${()=>this._controller.runSnooze()}
            aria-label="${o.loading?be(this.hass,"a11y.snoozing"):o.scheduleMode?be(this.hass,"a11y.schedule_snooze",{count:o.selected.length}):be(this.hass,"a11y.snooze_count",{count:o.selected.length})}"
            aria-busy=${o.loading}
          >
            ${o.loading?be(this.hass,"button.snoozing"):o.scheduleMode?be(this.hass,"button.schedule_count",{count:o.selected.length}):be(this.hass,"button.snooze_count",{count:o.selected.length})}
          </button>
        </div>

        ${t.pausedCount>0?V`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${t.groups}
              .pausedCount=${t.pausedCount}
              .pendingActions=${o.pendingActions}
              @wake-automation=${this._handleWakeEvent}
              @wake-all=${this._handleWakeAllEvent}
              @clear-notification=${this._handleClearNotificationEvent}
              @adjust-automation=${this._handleAdjustAutomationEvent}
              @adjust-group=${this._handleAdjustGroupEvent}
            ></autosnooze-active-pauses>`:""}
        ${this._renderScheduledPauses(t.scheduledCount,t.scheduled)}
        ${this._viewModel.persistentStatus?V`<div class="command-status" role="status" aria-live="polite">${this._viewModel.persistentStatus}</div>`:""}
        <autosnooze-adjust-modal
          .hass=${this.hass}
          .open=${s.open}
          .entityId=${s.entityId}
          .friendlyName=${s.friendlyName}
          .resumeAt=${s.resumeAt}
          .entityIds=${s.entityIds}
          .friendlyNames=${s.friendlyNames}
          .pending=${o.pendingActions.includes(`adjust:${[...s.entityIds,...s.entityId?[s.entityId]:[]].sort().join(",")}`)}
          @adjust-time=${this._handleAdjustTimeEvent}
          @close-modal=${this._handleCloseModalEvent}
        ></autosnooze-adjust-modal>
        ${this._renderToast()}
      </ha-card>
    `;var r}}mo.styles=[ye,fe],e([ce({attribute:!1})],mo.prototype,"hass",void 0),e([ce({attribute:!1})],mo.prototype,"config",void 0),e([he()],mo.prototype,"_viewModel",void 0),ho("autosnooze-card",mo);class po extends ne{constructor(){super(...arguments),this.config={}}static getConfigElement(){return document.createElement("autosnooze-card-editor")}static getStubConfig(){return{type:"custom:autosnooze-snoozed-card",title:"Snoozed Automations"}}setConfig(e){this.config=e}getCardSize(){const e=this.hass?jt(this.hass):null;return 1+(e?Object.keys(e.paused).length:0)}shouldUpdate(e){const t=e.get("hass");if(!t||!this.hass)return!0;const o=t.states?.[wt]!==this.hass.states?.[wt],i=(t.language??t.locale?.language)!==(this.hass.language??this.hass.locale?.language);return o||i}render(){if(!this.hass||!this.config)return V``;const e=jt(this.hass),t=Object.keys(e.paused).length;return V`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:bell-sleep"></ha-icon>
          ${this.config?.title||be(this.hass,"card.snoozed_title")}
          ${t>0?V`<span class="status-summary"
                >${be(this.hass,"status.active_count",{count:t})}</span
              >`:""}
        </div>

        ${Pt(this.hass)?"":V`
              <div class="sensor-health-banner" role="status">
                ${be(this.hass,"status.sensor_unavailable")}
              </div>
            `}

        ${t>0?V`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${e.groups}
              .pausedCount=${t}
              .readonly=${!0}
            ></autosnooze-active-pauses>`:V`<div class="snoozed-empty" role="status">
              ${be(this.hass,"status.no_snoozed")}
            </div>`}
      </ha-card>
    `}}po.styles=[ye,fe],e([ce({attribute:!1})],po.prototype,"hass",void 0),e([ce({attribute:!1})],po.prototype,"config",void 0),ho("autosnooze-snoozed-card",po);const go=r`
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
`;class _o extends ne{constructor(){super(...arguments),this._config={}}setConfig(e){this._config=e}_valueChanged(e,t){if(!this._config)return;const o={...this._config,[e]:t};""!==t&&null!=t||delete o[e],this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:o},bubbles:!0,composed:!0}))}render(){return this._config?V`
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
    `:V``}}_o.styles=go,e([ce({attribute:!1})],_o.prototype,"hass",void 0),e([he()],_o.prototype,"_config",void 0),ho("autosnooze-card-editor",_o);const bo=r`
    :host {
      display: block;
    }
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
    .pause-group-header:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
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
    .wake-all.pending {
      background: #ff9800;
      color: white;
    }
    @media (max-width: 480px) {
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
    }
`;class fo extends ne{constructor(){super(...arguments),this.pauseGroups=[],this.pausedCount=0,this.readonly=!1,this.pendingActions=[],this._wakeAllPending=!1,this._wakeAllTimeout=null,this._countdownState={interval:null,syncTimeout:null}}connectedCallback(){super.connectedCallback();try{kt(document.hidden)}catch{}this._syncCountdownLifecycle()}updated(e){e.has("pauseGroups")&&this._syncCountdownLifecycle()}disconnectedCallback(){super.disconnectedCallback(),null!==this._countdownState.interval&&(globalThis.clearInterval(this._countdownState.interval),this._countdownState.interval=null),null!==this._countdownState.syncTimeout&&(globalThis.clearTimeout(this._countdownState.syncTimeout),this._countdownState.syncTimeout=null),this._unsubscribeCountdown?.(),this._unsubscribeCountdown=void 0,null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null)}_updateCountdownIfNeeded(){const e=this.shadowRoot?.querySelectorAll(".countdown[data-resume-at]");for(const t of e??[]){const e=t.dataset.resumeAt;e&&(t.textContent=Ge(e,be(this.hass,"status.resuming")))}}_hasLiveCountdowns(){return this.pauseGroups.some(e=>!e.disableAt)}_startSharedCountdown(){this._unsubscribeCountdown=St(()=>this._updateCountdownIfNeeded())}_syncCountdownLifecycle(){this._unsubscribeCountdown?.(),this._unsubscribeCountdown=void 0,null!==this._countdownState.interval&&globalThis.clearInterval(this._countdownState.interval),null!==this._countdownState.syncTimeout&&globalThis.clearTimeout(this._countdownState.syncTimeout),this._countdownState={interval:null,syncTimeout:null},this.pauseGroups.length>0&&!this._hasLiveCountdowns()||(this._countdownState.syncTimeout=globalThis.setTimeout(()=>{this._countdownState.syncTimeout=null,this._hasLiveCountdowns()&&this._startSharedCountdown()},0))}_handleWakeAll(){this._wakeAllPending?(null!==this._wakeAllTimeout&&(clearTimeout(this._wakeAllTimeout),this._wakeAllTimeout=null),this._wakeAllPending=!1,this._fireWakeAll()):(He("medium"),this._wakeAllPending=!0,this._wakeAllTimeout=window.setTimeout(()=>{this._wakeAllPending=!1,this._wakeAllTimeout=null},ke))}_fireWake(e){this.dispatchEvent(new CustomEvent("wake-automation",{detail:{entityId:e},bubbles:!0,composed:!0}))}_fireClearNotification(e){this.dispatchEvent(new CustomEvent("clear-notification",{detail:{entityId:e},bubbles:!0,composed:!0}))}_hasNotificationConfig(e){return void 0!==e.notification_trigger&&"none"!==e.notification_trigger}_fireAdjust(e){this.dispatchEvent(new CustomEvent("adjust-automation",{detail:{entityId:e.entity_id,friendlyName:e.friendly_name,resumeAt:e.resume_at},bubbles:!0,composed:!0}))}_fireAdjustGroup(e){this.dispatchEvent(new CustomEvent("adjust-group",{detail:{entityIds:e.automations.map(e=>e.entity_id),friendlyNames:e.automations.map(e=>e.friendly_name||e.entity_id),resumeAt:e.resumeAt},bubbles:!0,composed:!0}))}_fireWakeAll(){this.dispatchEvent(new CustomEvent("wake-all",{bubbles:!0,composed:!0}))}render(){if(0===this.pausedCount)return V``;const e=this.hass?.locale?.language;return V`
      <div class="snooze-list" role="region" aria-label="${be(this.hass,"a11y.snoozed_region")}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${be(this.hass,"section.snoozed_count",{count:this.pausedCount})}
        </div>
        ${this.pauseGroups.map(t=>V`
          <div class="pause-group" role="group">
            ${this.readonly?V`<div class="pause-group-header">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${t.disableAt?V`${be(this.hass,"status.resumes")} ${Ve(t.resumeAt,e)}`:V`<span class="countdown" data-resume-at=${t.resumeAt}>${Ge(t.resumeAt,be(this.hass,"status.resuming"))}</span>`}
                </div>`:V`<div class="pause-group-header"
                  @click=${()=>this._fireAdjustGroup(t)}
                  role="button"
                  aria-label="${be(this.hass,"a11y.adjust_group",{count:t.automations.length})}">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${t.disableAt?V`${be(this.hass,"status.resumes")} ${Ve(t.resumeAt,e)}`:V`<span class="countdown" data-resume-at=${t.resumeAt}>${Ge(t.resumeAt,be(this.hass,"status.resuming"))}</span>`}
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
                      aria-label="${be(this.hass,"button.remove_notification")}"
                      title="${be(this.hass,"button.remove_notification")}"
                      @click=${t=>{t.stopPropagation(),this._fireClearNotification(e.entity_id)}}
                    >
                      <ha-icon icon="mdi:bell-off-outline" aria-hidden="true"></ha-icon>
                    </button>
                  `:""}
                  <button type="button" class="wake-btn"
                    ?disabled=${this.pendingActions.includes(`resume:${e.entity_id}`)}
                    @click=${t=>{t.stopPropagation(),this._fireWake(e.entity_id)}}>
                    ${this.pendingActions.includes(`resume:${e.entity_id}`)?"Resuming...":be(this.hass,"button.resume")}
                  </button>
                </div>`)}
          </div>
        `)}
        ${!this.readonly&&this.pausedCount>1?V`
          <button type="button" class="wake-all ${this._wakeAllPending?"pending":""}"
            ?disabled=${this.pendingActions.includes("resume-all")}
            @click=${()=>this._handleWakeAll()}>
            ${this.pendingActions.includes("resume-all")?"Resuming...":this._wakeAllPending?be(this.hass,"button.confirm_resume_all"):be(this.hass,"button.resume_all")}
          </button>
        `:""}
      </div>
    `}}fo.styles=[ye,bo],e([ce({attribute:!1})],fo.prototype,"hass",void 0),e([ce({attribute:!1})],fo.prototype,"pauseGroups",void 0),e([ce({type:Number})],fo.prototype,"pausedCount",void 0),e([ce({type:Boolean})],fo.prototype,"readonly",void 0),e([ce({attribute:!1})],fo.prototype,"pendingActions",void 0),e([he()],fo.prototype,"_wakeAllPending",void 0),ho("autosnooze-active-pauses",fo);const yo=r`
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
      color: #b71c1c;
      background: color-mix(in srgb, #f44336 10%, transparent);
      border-color: color-mix(in srgb, #f44336 36%, transparent);
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
`;class vo extends ne{constructor(){super(...arguments),this.scheduleMode=!1,this.customDuration={days:0,hours:0,minutes:30},this.customDurationInput="30m",this.showCustomInput=!1,this.lastDuration=null,this.disableAtDate="",this.disableAtTime="",this.resumeAtDate="",this.resumeAtTime=""}_getBasePresets(){const e=function(e){const t=e?.states?.[at]?.attributes?.duration_presets;return t?.length?t:null}(this.hass);return e?.length?e.filter(e=>null!==e.minutes):je.filter(e=>null!==e.minutes)}_getDurationPills(){return[...this._getBasePresets(),{label:be(this.hass,"duration.custom"),minutes:null}]}_getDurationPreview(){const e=this._getParsedDurationInput();return e?Be(e.days,e.hours,e.minutes):""}_isDurationValid(){return null!==this._getParsedDurationInput()}_getParsedDurationInput(){return this._parsedDurationInputKey!==this.customDurationInput&&(this._parsedDurationInputKey=this.customDurationInput,this._parsedDurationInput=Fe(this.customDurationInput)),this._parsedDurationInput??null}_renderDateOptions(){const e=function(e=365,t){const o=new Date,i=`${e}:${t??""}:${o.getFullYear()}-${o.getMonth()}-${o.getDate()}`,a=Bt.get(i);if(a)return a;const s=[],r=o.getFullYear();for(let i=0;i<e;i++){const e=new Date(o);e.setDate(e.getDate()+i);const a=e.getFullYear(),n=`${a}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`,l=e.toLocaleDateString(t,{weekday:"short"}),d=e.toLocaleDateString(t,{month:"short"}),u=e.getDate(),c=a!==r?`${l}, ${d} ${u}, ${a}`:`${l}, ${d} ${u}`;s.push({value:n,label:c})}return Bt.set(i,s),s}(365,this.hass?.locale?.language);return this._dateOptionsSource!==e&&(this._dateOptionsSource=e,this._dateOptionTemplates=e.map(e=>V`<option value="${e.value}">${e.label}</option>`)),this._dateOptionTemplates??[]}_renderLastDurationBadge(){if(!this.lastDuration)return"";const e=this._getBasePresets(),t=this.lastDuration.minutes,o=!e.some(e=>e.minutes===t);if(!o)return"";const{days:i,hours:a,minutes:s}=this.lastDuration.duration,r=qe(i,a,s).replace(/ /g,""),n=Le(this.customDuration),l=!this.showCustomInput&&t===n;return V`
      <button
        type="button"
        class="last-duration-badge ${l?"active":""}"
        @click=${()=>this._fireDurationChange(t)}
      >
        <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
        ${r}
      </button>
    `}_fireDurationChange(e,t){const o=Ne(e),i=qe(o.days,o.hours,o.minutes);this.dispatchEvent(new CustomEvent("duration-change",{detail:{minutes:e,duration:o,input:i,showCustomInput:t?.showCustomInput??!1},bubbles:!0,composed:!0}))}_fireCustomDurationChange(e){const t=Fe(e),o=t?Le(t):0;this.dispatchEvent(new CustomEvent("duration-change",{detail:{minutes:o,duration:t??{days:0,hours:0,minutes:0},input:e},bubbles:!0,composed:!0}))}_fireScheduleModeChange(e){this.dispatchEvent(new CustomEvent("schedule-mode-change",{detail:{enabled:e},bubbles:!0,composed:!0}))}_fireScheduleFieldChange(e,t){this.dispatchEvent(new CustomEvent("schedule-field-change",{detail:{field:e,value:t},bubbles:!0,composed:!0}))}_formatScheduleDateTime(e){const t=this.hass?.locale?.language;return new Date(e).toLocaleString(t,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}_renderScheduleSummary(){const e=[this.disableAtDate,this.disableAtTime,this.resumeAtDate,this.resumeAtTime,this.hass?.locale?.language??""].join("|");return this._scheduleSummaryKey===e?this._scheduleSummary??"":(this._scheduleSummaryKey=e,this._scheduleSummary=this._buildScheduleSummary(),this._scheduleSummary)}_buildScheduleSummary(){if(!this.resumeAtDate||!this.resumeAtTime)return"";const e=qt(this.resumeAtDate,this.resumeAtTime);if(!e)return"";if(!Boolean(this.disableAtDate&&this.disableAtTime))return V`
        <div class="schedule-summary" role="status" aria-live="polite">
          ${be(this.hass,"schedule.summary_immediate",{resume:this._formatScheduleDateTime(e)})}
        </div>
      `;const t=qt(this.disableAtDate,this.disableAtTime);return t?new Date(t).getTime()>=new Date(e).getTime()?V`
        <div class="schedule-summary invalid" role="status" aria-live="polite">
          ${be(this.hass,"schedule.summary_invalid_order")}
        </div>
      `:V`
      <div class="schedule-summary" role="status" aria-live="polite">
        ${be(this.hass,"schedule.summary_with_disable",{disable:this._formatScheduleDateTime(t),resume:this._formatScheduleDateTime(e)})}
      </div>
    `:""}render(){return this.scheduleMode?V`
        <div class="schedule-inputs">
          <div class="datetime-field">
            <label id="snooze-at-label">${be(this.hass,"schedule.snooze_at")}</label>
            <div class="datetime-row">
              <select
                .value=${this.disableAtDate}
                @change=${e=>this._fireScheduleFieldChange("disableAtDate",e.target.value)}
                aria-labelledby="snooze-at-label"
              >
                <option value="">${be(this.hass,"schedule.select_date")}</option>
                ${this._renderDateOptions()}
              </select>
              <input
                type="time"
                .value=${this.disableAtTime}
                @input=${e=>this._fireScheduleFieldChange("disableAtTime",e.target.value)}
                aria-labelledby="snooze-at-label"
              />
            </div>
            <span class="field-hint">${be(this.hass,"schedule.hint_immediate")}</span>
          </div>
          <div class="datetime-field">
            <label id="resume-at-label">${be(this.hass,"schedule.resume_at")}</label>
            <div class="datetime-row">
              <select
                .value=${this.resumeAtDate}
                @change=${e=>this._fireScheduleFieldChange("resumeAtDate",e.target.value)}
                aria-labelledby="resume-at-label"
              >
                <option value="">${be(this.hass,"schedule.select_date")}</option>
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
            ${be(this.hass,"schedule.back_to_duration")}
          </button>
        </div>
      `:V`
      <div class="duration-selector">
        <div class="duration-header-row">
          <div class="duration-section-header" id="duration-header">${be(this.hass,"duration.header")}</div>
          ${this._renderLastDurationBadge()}
        </div>
        <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
          ${this._getDurationPills().map(e=>{const t=Le(this.customDuration),o=null===e.minutes?this.showCustomInput:!this.showCustomInput&&e.minutes===t;return V`
                <button
                  type="button"
                  class="pill ${o?"active":""}"
                  @click=${()=>{null===e.minutes?this.dispatchEvent(new CustomEvent("custom-input-toggle",{detail:{show:!this.showCustomInput},bubbles:!0,composed:!0})):this._fireDurationChange(e.minutes,{showCustomInput:!1})}}
                  role="radio"
                  aria-checked=${o}
                >
                  ${e.label}
                </button>
              `})}
        </div>

        ${this.showCustomInput?V`
          <div class="custom-duration-input">
            <input
              type="text"
              class="duration-input ${this._isDurationValid()?"":"invalid"}"
              placeholder="${be(this.hass,"duration.placeholder")}"
              .value=${this.customDurationInput}
              @input=${e=>this._fireCustomDurationChange(e.target.value)}
              aria-label="${be(this.hass,"a11y.custom_duration")}"
              aria-invalid=${!this._isDurationValid()}
              aria-describedby="duration-help"
            />
            ${this._getDurationPreview()&&this._isDurationValid()?V`<div class="duration-preview" role="status" aria-live="polite">${be(this.hass,"duration.preview_label")} ${this._getDurationPreview()}</div>`:V`<div class="duration-help" id="duration-help">${be(this.hass,"duration.help")}</div>`}
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
    `}}vo.styles=yo,e([ce({attribute:!1})],vo.prototype,"hass",void 0),e([ce({type:Boolean})],vo.prototype,"scheduleMode",void 0),e([ce({attribute:!1})],vo.prototype,"customDuration",void 0),e([ce({type:String})],vo.prototype,"customDurationInput",void 0),e([ce({type:Boolean})],vo.prototype,"showCustomInput",void 0),e([ce({attribute:!1})],vo.prototype,"lastDuration",void 0),e([ce({type:String})],vo.prototype,"disableAtDate",void 0),e([ce({type:String})],vo.prototype,"disableAtTime",void 0),e([ce({type:String})],vo.prototype,"resumeAtDate",void 0),e([ce({type:String})],vo.prototype,"resumeAtTime",void 0),ho("autosnooze-duration-selector",vo);const xo=r`
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
      border: 1px solid color-mix(in srgb, #ff9800 45%, var(--divider-color));
      border-radius: 8px;
      background: color-mix(in srgb, #ff9800 10%, var(--card-background-color));
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
`;class wo extends ne{constructor(){super(...arguments),this.automations=[],this.selected=[],this.labelRegistry={},this.labelRegistryUnavailable=!1,this.categoryRegistry={},this.recentSnoozeIds=[],this._filterTab="all",this._search="",this._searchInput="",this._expandedGroups={},this._searchTimeout=null,this._viewModelCache=null}disconnectedCallback(){super.disconnectedCallback(),null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null)}_fireSelectionChange(e){this.dispatchEvent(new CustomEvent("selection-change",{detail:{selected:e},bubbles:!0,composed:!0}))}_toggleSelection(e){let t;He("selection"),t=this.selected.includes(e)?this.selected.filter(t=>t!==e):[...this.selected,e],this._fireSelectionChange(t)}_toggleGroupExpansion(e){const t=!1!==this._expandedGroups[e];this._expandedGroups={...this._expandedGroups,[e]:!t}}_selectGroup(e){const t=e.map(e=>e.id);let o;o=t.every(e=>this.selected.includes(e))?this.selected.filter(e=>!t.includes(e)):[...new Set([...this.selected,...t])],this._fireSelectionChange(o)}_selectAllVisible(){const e=this._getViewModel().filtered.map(e=>e.id),t=[...new Set([...this.selected,...e])];this._fireSelectionChange(t)}_clearSelection(){this._fireSelectionChange([])}_getFilteredAutomations(){return this._getViewModel().filtered}_getAreaName(e){return this.hass?It(e,this.hass):be(this.hass,"group.unassigned")}_getLabelName(e){return Ft(e,this.labelRegistry)}_getCategoryName(e){return Lt(e,this.categoryRegistry)}_getGroupedByTab(e){return Ot({automations:this.automations,search:this._search,filterTab:e,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,emptyAreaLabel:be(this.hass,"group.unassigned"),emptyLabelLabel:be(this.hass,"group.unlabeled"),emptyCategoryLabel:be(this.hass,"group.uncategorized")}).grouped}_getGroupedByArea(){return this._getGroupedByTab("areas")}_getGroupedByLabel(){return this._getGroupedByTab("labels")}_getGroupedByCategory(){return this._getGroupedByTab("categories")}_getAreaCount(){return this._getViewModel().areaCount}_getLabelCount(){return this._getViewModel().labelCount}_getCategoryCount(){return this._getViewModel().categoryCount}_getViewModel(){const e=this._viewModelCache;if(e&&e.automations===this.automations&&e.search===this._search&&e.filterTab===this._filterTab&&e.areas===this.hass?.areas&&e.language===this.hass?.locale?.language&&e.labelRegistry===this.labelRegistry&&e.categoryRegistry===this.categoryRegistry)return e.result;const t=Ot({automations:this.automations,search:this._search,filterTab:this._filterTab,hass:this.hass,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,emptyAreaLabel:be(this.hass,"group.unassigned"),emptyLabelLabel:be(this.hass,"group.unlabeled"),emptyCategoryLabel:be(this.hass,"group.uncategorized")});return this._viewModelCache={automations:this.automations,search:this._search,filterTab:this._filterTab,areas:this.hass?.areas,language:this.hass?.locale?.language,labelRegistry:this.labelRegistry,categoryRegistry:this.categoryRegistry,result:t},t}_handleSearchInput(e){const t=e.target.value;this._searchInput=t,null!==this._searchTimeout&&clearTimeout(this._searchTimeout),this._searchTimeout=window.setTimeout(()=>{this._search=t,this._searchTimeout=null},Se)}_clearSearch(){null!==this._searchTimeout&&(clearTimeout(this._searchTimeout),this._searchTimeout=null),this._searchInput="",this._search=""}_handleSearchKeydown(e){"Escape"===e.key&&(this._searchInput||this._search)&&(e.preventDefault(),this._clearSearch())}_renderSelectionList(e,t){const{filtered:o,grouped:i}=e;if("all"===this._filterTab){if(0===o.length)return V`<div class="list-empty" role="status">${be(this.hass,"list.empty")}</div>`;const e=new Set(this.recentSnoozeIds),i=[],a=[];for(const t of o)(e.has(t.id)?i:a).push(t);const s=i.concat(a);return V`
        ${i.length>0?V`
          <div class="recent-group-header">
            <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
            <span>${be(this.hass,"group.recent")}</span>
          </div>
        `:""}
        ${s.map((e,o)=>V`
        <button
          type="button"
          class="list-item ${t.has(e.id)?"selected":""} ${o<i.length?"is-recent":""}"
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
      `)}
      `}return 0===i.length?V`<div class="list-empty" role="status">${be(this.hass,"list.empty")}</div>`:i.map(([e,o])=>{const i=!1!==this._expandedGroups[e],a=o.every(e=>t.has(e.id)),s=o.some(e=>t.has(e.id))&&!a;return V`
        <button
          type="button"
          class="group-header ${i?"expanded":""}"
          @click=${()=>this._toggleGroupExpansion(e)}
          aria-expanded=${i}
          aria-label="${be(this.hass,"a11y.group_header",{name:e,count:o.length})}"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${e}</span>
          <span class="group-badge" aria-label="${be(this.hass,"a11y.group_count",{count:o.length})}">${o.length}</span>
          <input
            type="checkbox"
            .checked=${a}
            .indeterminate=${s}
            @click=${e=>e.stopPropagation()}
            @change=${()=>this._selectGroup(o)}
            aria-label="${be(this.hass,"a11y.select_all_in_group",{name:e})}"
            tabindex="-1"
          />
        </button>
        ${i?o.map(e=>V`
                <button
                  type="button"
                  class="list-item ${t.has(e.id)?"selected":""}"
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
              `):""}
      `})}render(){const e=this._getViewModel(),{filtered:t}=e,o=new Set(this.selected),i=this.labelRegistryUnavailable,a=this._searchInput.length>0||this._search.length>0,s=t.length>0&&t.every(e=>o.has(e.id));return V`
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
          <span class="tab-count" aria-label="${be(this.hass,"a11y.automation_count",{count:this.automations.length})}">${this.automations.length}</span>
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
          <span class="tab-count" aria-label="${be(this.hass,"a11y.area_count",{count:e.areaCount})}">${e.areaCount}</span>
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
          <span class="tab-count" aria-label="${be(this.hass,"a11y.category_count",{count:e.categoryCount})}">${e.categoryCount}</span>
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
          <span class="tab-count" aria-label="${be(this.hass,"a11y.label_count",{count:e.labelCount})}">${e.labelCount}</span>
        </button>
      </div>

      <div class="search-row selection-actions">
        <div class="search-box">
          <input
            type="search"
            placeholder="${be(this.hass,"search.placeholder")}"
            .value=${this._searchInput||this._search}
            @input=${e=>this._handleSearchInput(e)}
            @keydown=${e=>this._handleSearchKeydown(e)}
            aria-label="${be(this.hass,"a11y.search")}"
          />
          ${a?V`
                <button
                  type="button"
                  class="search-clear-btn"
                  @click=${()=>this._clearSearch()}
                  aria-label="${be(this.hass,"a11y.clear_search")}"
                >
                  ${be(this.hass,"button.clear")}
                </button>
              `:""}
        </div>

        ${t.length>0?V`
              <span class="selection-count" role="status" aria-live="polite">
                ${be(this.hass,"selection.count",{selected:this.selected.length,total:t.length})}
              </span>
              ${s?"":V`
                    <button
                      type="button"
                      class="select-all-btn"
                      @click=${()=>this._selectAllVisible()}
                      aria-label="${be(this.hass,"a11y.select_all")}"
                    >
                      ${be(this.hass,"button.select_all")}
                    </button>
                  `}
              ${this.selected.length>0?V`<button type="button" class="select-all-btn clear-selection-btn" @click=${()=>this._clearSelection()} aria-label="${be(this.hass,"a11y.clear_selection")}">${be(this.hass,"button.clear")}</button>`:""}
            `:""}
      </div>

      ${i?V`
            <div class="registry-warning" role="status">
              ${be(this.hass,"list.label_registry_warning")}
            </div>
          `:""}

      <div class="selection-list" id="selection-list" role="listbox" aria-label="${be(this.hass,"a11y.automations_list")}" aria-multiselectable="true">
        ${this._renderSelectionList(e,o)}
      </div>
    `}}wo.styles=xo,e([ce({attribute:!1})],wo.prototype,"hass",void 0),e([ce({attribute:!1})],wo.prototype,"automations",void 0),e([ce({attribute:!1})],wo.prototype,"selected",void 0),e([ce({attribute:!1})],wo.prototype,"labelRegistry",void 0),e([ce({type:Boolean})],wo.prototype,"labelRegistryUnavailable",void 0),e([ce({attribute:!1})],wo.prototype,"categoryRegistry",void 0),e([ce({attribute:!1})],wo.prototype,"recentSnoozeIds",void 0),e([he()],wo.prototype,"_filterTab",void 0),e([he()],wo.prototype,"_search",void 0),e([he()],wo.prototype,"_searchInput",void 0),e([he()],wo.prototype,"_expandedGroups",void 0),ho("autosnooze-automation-list",wo);const Ao=r`
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
      color: #ff9800;
      border: 1.5px solid #ff9800;
    }
    .adjust-btn.decrement:hover:not(:disabled) {
      background: #ff9800;
      color: white;
    }
    .adjust-btn.decrement:active:not(:disabled) {
      transform: scale(0.95);
    }
    .adjust-btn.decrement:focus-visible {
      outline: 2px solid #ff9800;
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
`,zo=[{label:"+15m",minutes:15},{label:"+30m",minutes:30},{label:"+1h",hours:1},{label:"+2h",hours:2}],$o=[{label:"-15m",minutes:-15,thresholdMs:15*xe},{label:"-30m",minutes:-30,thresholdMs:30*xe}],So=xe;class ko extends ne{constructor(){super(...arguments),this.open=!1,this.entityId="",this.friendlyName="",this.resumeAt="",this.entityIds=[],this.friendlyNames=[],this.pending=!1}get _isGroupMode(){return this.entityIds.length>1}updated(e){e.has("open")&&(this.open?this._startSynchronizedCountdown():this._stopCountdown())}disconnectedCallback(){super.disconnectedCallback(),this._stopCountdown()}_startSynchronizedCountdown(){this._stopCountdown(),this._unsubscribeCountdown=St(()=>{const e=this.shadowRoot?.querySelector(".remaining-time");e&&(e.textContent=Ge(this.resumeAt,be(this.hass,"status.resuming")))})}_stopCountdown(){this._unsubscribeCountdown?.(),this._unsubscribeCountdown=void 0}_isDecrementDisabled(e){if(!this.resumeAt)return!0;return new Date(this.resumeAt).getTime()-Date.now()-e<So}_fireAdjustTime(e){this.entityIds.length>0?this.dispatchEvent(new CustomEvent("adjust-time",{detail:{entityIds:this.entityIds,...e},bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent("adjust-time",{detail:{entityId:this.entityId,...e},bubbles:!0,composed:!0}))}_close(){this.dispatchEvent(new CustomEvent("close-modal",{bubbles:!0,composed:!0}))}_handleOverlayKeydown(e){"Escape"===e.key&&this._close()}_handleOverlayClick(e){e.target===e.currentTarget&&this._close()}render(){return this.open?V`
      <div class="modal-overlay" @click=${this._handleOverlayClick} @keydown=${this._handleOverlayKeydown}>
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="adjust-title" @click=${e=>e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title" id="adjust-title">
              ${this._isGroupMode?be(this.hass,"adjust.group_title",{count:this.entityIds.length}):this.friendlyName||this.entityId}
            </span>
            ${this._isGroupMode?V`
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
            <div class="remaining-time">${Ge(this.resumeAt,be(this.hass,"status.resuming"))}</div>

            <div class="adjust-section">
              <div class="adjust-section-label">${be(this.hass,"adjust.add_time")}</div>
              <div class="adjust-buttons">
                ${zo.map(e=>V`
                  <button type="button"
                    class="adjust-btn increment"
                    ?disabled=${this.pending}
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
                ${$o.map(e=>V`
                  <button type="button"
                    class="adjust-btn decrement"
                    ?disabled=${this.pending||this._isDecrementDisabled(e.thresholdMs)}
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
    `:V``}}ko.styles=Ao,e([ce({attribute:!1})],ko.prototype,"hass",void 0),e([ce({type:Boolean})],ko.prototype,"open",void 0),e([ce({type:String})],ko.prototype,"entityId",void 0),e([ce({type:String})],ko.prototype,"friendlyName",void 0),e([ce({type:String})],ko.prototype,"resumeAt",void 0),e([ce({attribute:!1})],ko.prototype,"entityIds",void 0),e([ce({attribute:!1})],ko.prototype,"friendlyNames",void 0),e([ce({type:Boolean})],ko.prototype,"pending",void 0),ho("autosnooze-adjust-modal",ko);const Co=Symbol.for("autosnooze.registration.done.v1"),Mo=new Set,To="https://github.com/mossipcams/autosnooze#readme";function Ro(){const e=window.customCards;return Array.isArray(e)?e:(void 0!==e&&(t="customCards-not-array",o=`[AutoSnooze] window.customCards was not an array (got ${typeof e}); resetting.`,Mo.has(t)||(Mo.add(t),console.warn(o))),[]);var t,o}function Do(e="0.2.23"){const t=function(e){return[{type:"autosnooze-card",name:"AutoSnooze Card",description:`Temporarily pause automations with area and label filtering (v${e})`,preview:!0,documentationURL:To},{type:"autosnooze-snoozed-card",name:"AutoSnooze Snoozed Card",description:`Read-only view of currently snoozed automations and when they resume (v${e})`,preview:!0,documentationURL:To}]}(e),o=Ro();t.forEach(e=>{const t=o.findIndex(t=>t?.type===e.type);-1===t?o.push(e):o[t]={...o[t],...e}}),window.customCards=o}!function(){const e=globalThis;!0===e[Co]||(e[Co]=!0),Do()}();export{fo as AutoSnoozeActivePauses,ko as AutoSnoozeAdjustModal,wo as AutoSnoozeAutomationList,vo as AutoSnoozeDurationSelector,po as AutoSnoozeSnoozedCard,mo as AutomationPauseCard,_o as AutomationPauseCardEditor};
//# sourceMappingURL=autosnooze-card.js.map
