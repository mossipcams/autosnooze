/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const B = globalThis, ot = B.ShadowRoot && (B.ShadyCSS === void 0 || B.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, nt = Symbol(), lt = /* @__PURE__ */ new WeakMap();
let Et = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== nt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ot && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = lt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && lt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Nt = (s) => new Et(typeof s == "string" ? s : s + "", void 0, nt), St = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, o, n) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + s[n + 1], s[0]);
  return new Et(e, s, nt);
}, Rt = (s, t) => {
  if (ot) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), o = B.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = e.cssText, s.appendChild(i);
  }
}, ct = ot ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return Nt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: It, defineProperty: jt, getOwnPropertyDescriptor: qt, getOwnPropertyNames: Dt, getOwnPropertySymbols: Bt, getPrototypeOf: Wt } = Object, m = globalThis, dt = m.trustedTypes, Vt = dt ? dt.emptyScript : "", J = m.reactiveElementPolyfillSupport, k = (s, t) => s, W = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Vt : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, rt = (s, t) => !It(s, t), ht = { attribute: !0, type: String, converter: W, reflect: !1, useDefault: !1, hasChanged: rt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), m.litPropertyMetadata ?? (m.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let C = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ht) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, e);
      o !== void 0 && jt(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: o, set: n } = qt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: o, set(r) {
      const l = o == null ? void 0 : o.call(this);
      n == null || n.call(this, r), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ht;
  }
  static _$Ei() {
    if (this.hasOwnProperty(k("elementProperties"))) return;
    const t = Wt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(k("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(k("properties"))) {
      const e = this.properties, i = [...Dt(e), ...Bt(e)];
      for (const o of i) this.createProperty(o, e[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, o] of e) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const o = this._$Eu(e, i);
      o !== void 0 && this._$Eh.set(o, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const o of i) e.unshift(ct(o));
    } else t !== void 0 && e.push(ct(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Rt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var n;
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const r = (((n = i.converter) == null ? void 0 : n.toAttribute) !== void 0 ? i.converter : W).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(o) : this.setAttribute(o, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, r;
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const l = i.getPropertyOptions(o), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((n = l.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? l.converter : W;
      this._$Em = o;
      const c = a.fromAttribute(e, l.type);
      this[o] = c ?? ((r = this._$Ej) == null ? void 0 : r.get(o)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, o = !1, n) {
    var r;
    if (t !== void 0) {
      const l = this.constructor;
      if (o === !1 && (n = this[t]), i ?? (i = l.getPropertyOptions(t)), !((i.hasChanged ?? rt)(n, e) || i.useDefault && i.reflect && n === ((r = this._$Ej) == null ? void 0 : r.get(t)) && !this.hasAttribute(l._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: o, wrapped: n }, r) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), n !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [n, r] of o) {
        const { wrapped: l } = r, a = this[n];
        l !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, r, a);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((o) => {
        var n;
        return (n = o.hostUpdate) == null ? void 0 : n.call(o);
      }), this.update(e)) : this._$EM();
    } catch (o) {
      throw t = !1, this._$EM(), o;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var o;
      return (o = i.hostUpdated) == null ? void 0 : o.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[k("elementProperties")] = /* @__PURE__ */ new Map(), C[k("finalized")] = /* @__PURE__ */ new Map(), J == null || J({ ReactiveElement: C }), (m.reactiveElementVersions ?? (m.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, ut = (s) => s, V = T.trustedTypes, pt = V ? V.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, wt = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, xt = "?" + g, Ft = `<${xt}>`, w = document, O = () => w.createComment(""), U = (s) => s === null || typeof s != "object" && typeof s != "function", at = Array.isArray, Zt = (s) => at(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", K = `[ 	
\f\r]`, M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ft = /-->/g, $t = />/g, y = RegExp(`>|${K}(?:([^\\s"'>=/]+)(${K}*=${K}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), _t = /'/g, gt = /"/g, Ct = /^(?:script|style|textarea|title)$/i, Gt = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), A = Gt(1), P = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), mt = /* @__PURE__ */ new WeakMap(), E = w.createTreeWalker(w, 129);
function zt(s, t) {
  if (!at(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return pt !== void 0 ? pt.createHTML(t) : t;
}
const Jt = (s, t) => {
  const e = s.length - 1, i = [];
  let o, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = M;
  for (let l = 0; l < e; l++) {
    const a = s[l];
    let c, p, d = -1, f = 0;
    for (; f < a.length && (r.lastIndex = f, p = r.exec(a), p !== null); ) f = r.lastIndex, r === M ? p[1] === "!--" ? r = ft : p[1] !== void 0 ? r = $t : p[2] !== void 0 ? (Ct.test(p[2]) && (o = RegExp("</" + p[2], "g")), r = y) : p[3] !== void 0 && (r = y) : r === y ? p[0] === ">" ? (r = o ?? M, d = -1) : p[1] === void 0 ? d = -2 : (d = r.lastIndex - p[2].length, c = p[1], r = p[3] === void 0 ? y : p[3] === '"' ? gt : _t) : r === gt || r === _t ? r = y : r === ft || r === $t ? r = M : (r = y, o = void 0);
    const _ = r === y && s[l + 1].startsWith("/>") ? " " : "";
    n += r === M ? a + Ft : d >= 0 ? (i.push(c), a.slice(0, d) + wt + a.slice(d) + g + _) : a + g + (d === -2 ? l : _);
  }
  return [zt(s, n + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class H {
  constructor({ strings: t, _$litType$: e }, i) {
    let o;
    this.parts = [];
    let n = 0, r = 0;
    const l = t.length - 1, a = this.parts, [c, p] = Jt(t, e);
    if (this.el = H.createElement(c, i), E.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (o = E.nextNode()) !== null && a.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const d of o.getAttributeNames()) if (d.endsWith(wt)) {
          const f = p[r++], _ = o.getAttribute(d).split(g), j = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: n, name: j[2], strings: _, ctor: j[1] === "." ? Xt : j[1] === "?" ? Qt : j[1] === "@" ? Yt : G }), o.removeAttribute(d);
        } else d.startsWith(g) && (a.push({ type: 6, index: n }), o.removeAttribute(d));
        if (Ct.test(o.tagName)) {
          const d = o.textContent.split(g), f = d.length - 1;
          if (f > 0) {
            o.textContent = V ? V.emptyScript : "";
            for (let _ = 0; _ < f; _++) o.append(d[_], O()), E.nextNode(), a.push({ type: 2, index: ++n });
            o.append(d[f], O());
          }
        }
      } else if (o.nodeType === 8) if (o.data === xt) a.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = o.data.indexOf(g, d + 1)) !== -1; ) a.push({ type: 7, index: n }), d += g.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = w.createElement("template");
    return i.innerHTML = t, i;
  }
}
function L(s, t, e = s, i) {
  var r, l;
  if (t === P) return t;
  let o = i !== void 0 ? (r = e._$Co) == null ? void 0 : r[i] : e._$Cl;
  const n = U(t) ? void 0 : t._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== n && ((l = o == null ? void 0 : o._$AO) == null || l.call(o, !1), n === void 0 ? o = void 0 : (o = new n(s), o._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = o : e._$Cl = o), o !== void 0 && (t = L(s, o._$AS(s, t.values), o, i)), t;
}
class Kt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, o = ((t == null ? void 0 : t.creationScope) ?? w).importNode(e, !0);
    E.currentNode = o;
    let n = E.nextNode(), r = 0, l = 0, a = i[0];
    for (; a !== void 0; ) {
      if (r === a.index) {
        let c;
        a.type === 2 ? c = new R(n, n.nextSibling, this, t) : a.type === 1 ? c = new a.ctor(n, a.name, a.strings, this, t) : a.type === 6 && (c = new te(n, this, t)), this._$AV.push(c), a = i[++l];
      }
      r !== (a == null ? void 0 : a.index) && (n = E.nextNode(), r++);
    }
    return E.currentNode = w, o;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class R {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, o) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = L(this, t, e), U(t) ? t === u || t == null || t === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : t !== this._$AH && t !== P && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Zt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== u && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(w.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = H.createElement(zt(i.h, i.h[0]), this.options)), i);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === o) this._$AH.p(e);
    else {
      const r = new Kt(o, this), l = r.u(this.options);
      r.p(e), this.T(l), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = mt.get(t.strings);
    return e === void 0 && mt.set(t.strings, e = new H(t)), e;
  }
  k(t) {
    at(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, o = 0;
    for (const n of t) o === e.length ? e.push(i = new R(this.O(O()), this.O(O()), this, this.options)) : i = e[o], i._$AI(n), o++;
    o < e.length && (this._$AR(i && i._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const o = ut(t).nextSibling;
      ut(t).remove(), t = o;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class G {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, o, n) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = u;
  }
  _$AI(t, e = this, i, o) {
    const n = this.strings;
    let r = !1;
    if (n === void 0) t = L(this, t, e, 0), r = !U(t) || t !== this._$AH && t !== P, r && (this._$AH = t);
    else {
      const l = t;
      let a, c;
      for (t = n[0], a = 0; a < n.length - 1; a++) c = L(this, l[i + a], e, a), c === P && (c = this._$AH[a]), r || (r = !U(c) || c !== this._$AH[a]), c === u ? t = u : t !== u && (t += (c ?? "") + n[a + 1]), this._$AH[a] = c;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Xt extends G {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === u ? void 0 : t;
  }
}
class Qt extends G {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== u);
  }
}
class Yt extends G {
  constructor(t, e, i, o, n) {
    super(t, e, i, o, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = L(this, t, e, 0) ?? u) === P) return;
    const i = this._$AH, o = t === u && i !== u || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== u && (i === u || o);
    o && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class te {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    L(this, t);
  }
}
const X = T.litHtmlPolyfillSupport;
X == null || X(H, R), (T.litHtmlVersions ?? (T.litHtmlVersions = [])).push("3.3.2");
const ee = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = o = new R(t.insertBefore(O(), n), n, void 0, e ?? {});
  }
  return o._$AI(s), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const S = globalThis;
class z extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ee(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return P;
  }
}
var At;
z._$litElement$ = !0, z.finalized = !0, (At = S.litElementHydrateSupport) == null || At.call(S, { LitElement: z });
const Q = S.litElementPolyfillSupport;
Q == null || Q({ LitElement: z });
(S.litElementVersions ?? (S.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Pt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = { attribute: !0, type: String, converter: W, reflect: !1, hasChanged: rt }, ie = (s = se, t, e) => {
  const { kind: i, metadata: o } = e;
  let n = globalThis.litPropertyMetadata.get(o);
  if (n === void 0 && globalThis.litPropertyMetadata.set(o, n = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), n.set(e.name, s), i === "accessor") {
    const { name: r } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(r, a, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(r, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: r } = e;
    return function(l) {
      const a = this[r];
      t.call(this, l), this.requestUpdate(r, a, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function I(s) {
  return (t, e) => typeof e == "object" ? ie(s, t, e) : ((i, o, n) => {
    const r = o.hasOwnProperty(n);
    return o.constructor.createProperty(n, i), r ? Object.getOwnPropertyDescriptor(o, n) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Lt(s) {
  return I({ ...s, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const et = "lit-localize-status";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const oe = (s, ...t) => ({
  strTag: !0,
  strings: s,
  values: t
}), ne = oe, re = (s) => typeof s != "string" && "strTag" in s, Mt = (s, t, e) => {
  let i = s[0];
  for (let o = 1; o < s.length; o++)
    i += t[e ? e[o - 1] : o - 1], i += s[o];
  return i;
};
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const kt = (s) => re(s) ? Mt(s.strings, s.values) : s;
let h = kt, vt = !1;
function ae(s) {
  if (vt)
    throw new Error("lit-localize can only be configured once");
  h = s, vt = !0;
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class le {
  constructor(t) {
    this.__litLocalizeEventHandler = (e) => {
      e.detail.status === "ready" && this.host.requestUpdate();
    }, this.host = t;
  }
  hostConnected() {
    window.addEventListener(et, this.__litLocalizeEventHandler);
  }
  hostDisconnected() {
    window.removeEventListener(et, this.__litLocalizeEventHandler);
  }
}
const ce = (s) => s.addController(new le(s)), de = ce;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Tt = () => (s, t) => (s.addInitializer(de), s);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class Ot {
  constructor() {
    this.settled = !1, this.promise = new Promise((t, e) => {
      this._resolve = t, this._reject = e;
    });
  }
  resolve(t) {
    this.settled = !0, this._resolve(t);
  }
  reject(t) {
    this.settled = !0, this._reject(t);
  }
}
/**
 * @license
 * Copyright 2014 Travis Webb
 * SPDX-License-Identifier: MIT
 */
const $ = [];
for (let s = 0; s < 256; s++)
  $[s] = (s >> 4 & 15).toString(16) + (s & 15).toString(16);
function he(s) {
  let t = 0, e = 8997, i = 0, o = 33826, n = 0, r = 40164, l = 0, a = 52210;
  for (let c = 0; c < s.length; c++)
    e ^= s.charCodeAt(c), t = e * 435, i = o * 435, n = r * 435, l = a * 435, n += e << 8, l += o << 8, i += t >>> 16, e = t & 65535, n += i >>> 16, o = i & 65535, a = l + (n >>> 16) & 65535, r = n & 65535;
  return $[a >> 8] + $[a & 255] + $[r >> 8] + $[r & 255] + $[o >> 8] + $[o & 255] + $[e >> 8] + $[e & 255];
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ue = "", pe = "h", fe = "s";
function $e(s, t) {
  return (t ? pe : fe) + he(typeof s == "string" ? s : s.join(ue));
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yt = /* @__PURE__ */ new WeakMap(), bt = /* @__PURE__ */ new Map();
function _e(s, t, e) {
  if (s) {
    const i = (e == null ? void 0 : e.id) ?? ge(t), o = s[i];
    if (o) {
      if (typeof o == "string")
        return o;
      if ("strTag" in o)
        return Mt(
          o.strings,
          // Cast `template` because its type wasn't automatically narrowed (but
          // we know it must be the same type as `localized`).
          t.values,
          o.values
        );
      {
        let n = yt.get(o);
        return n === void 0 && (n = o.values, yt.set(o, n)), {
          ...o,
          values: n.map((r) => t.values[r])
        };
      }
    }
  }
  return kt(t);
}
function ge(s) {
  const t = typeof s == "string" ? s : s.strings;
  let e = bt.get(t);
  return e === void 0 && (e = $e(t, typeof s != "string" && !("strTag" in s)), bt.set(t, e)), e;
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function Y(s) {
  window.dispatchEvent(new CustomEvent(et, { detail: s }));
}
let F = "", tt, Ut, Z, st, Ht, b = new Ot();
b.resolve();
let q = 0;
const me = (s) => (ae((t, e) => _e(Ht, t, e)), F = Ut = s.sourceLocale, Z = new Set(s.targetLocales), Z.add(s.sourceLocale), st = s.loadLocale, { getLocale: ve, setLocale: ye }), ve = () => F, ye = (s) => {
  if (s === (tt ?? F))
    return b.promise;
  if (!Z || !st)
    throw new Error("Internal error");
  if (!Z.has(s))
    throw new Error("Invalid locale code");
  q++;
  const t = q;
  return tt = s, b.settled && (b = new Ot()), Y({ status: "loading", loadingLocale: s }), (s === Ut ? (
    // We could switch to the source locale synchronously, but we prefer to
    // queue it on a microtask so that switching locales is consistently
    // asynchronous.
    Promise.resolve({ templates: void 0 })
  ) : st(s)).then((i) => {
    q === t && (F = s, tt = void 0, Ht = i.templates, Y({ status: "ready", readyLocale: s }), b.resolve());
  }, (i) => {
    q === t && (Y({
      status: "error",
      errorLocale: s,
      errorMessage: i.toString()
    }), b.reject(i));
  }), b.promise;
}, it = "en", be = [
  "de",
  "es",
  "fr",
  "it"
], D = {
  en: "en",
  "en-GB": "en",
  "en-US": "en",
  es: "es",
  "es-ES": "es",
  "es-419": "es",
  fr: "fr",
  "fr-FR": "fr",
  "fr-CA": "fr",
  de: "de",
  "de-DE": "de",
  "de-AT": "de",
  "de-CH": "de",
  it: "it",
  "it-IT": "it"
}, { getLocale: Ae, setLocale: Ee } = me({
  sourceLocale: it,
  targetLocales: be,
  loadLocale: (s) => {
    switch (s) {
      case "es":
        return import("./es-xoWuJF7o.js");
      case "fr":
        return import("./fr-xjNlD8XY.js");
      case "de":
        return import("./de-7vlcJCc_.js");
      case "it":
        return import("./it-CRNTcWNz.js");
      default:
        return Promise.resolve({});
    }
  }
});
function Se(s) {
  if (!(s != null && s.language))
    return it;
  if (D[s.language])
    return D[s.language];
  const t = s.language.split("-")[0];
  return D[t] ? D[t] : it;
}
async function we(s) {
  const t = Se(s);
  t !== Ae() && await Ee(t);
}
var xe = Object.defineProperty, Ce = Object.getOwnPropertyDescriptor, v = (s, t, e, i) => {
  for (var o = i > 1 ? void 0 : i ? Ce(t, e) : t, n = s.length - 1, r; n >= 0; n--)
    (r = s[n]) && (o = (i ? r(t, e, o) : r(o)) || o);
  return i && o && xe(t, e, o), o;
};
let x = class extends z {
  constructor() {
    super(...arguments), this._snoozeMinutes = 30, this._isLoading = !1;
  }
  updated(s) {
    if (super.updated(s), s.has("hass") && this.hass) {
      const t = s.get("hass");
      (!t || t.language !== this.hass.language) && we(this.hass);
    }
  }
  setConfig(s) {
    if (!s.entity)
      throw new Error(h("Entity is required", { id: "validation.required" }));
    this.config = s;
  }
  get _entity() {
    var s;
    if (!(!this.hass || !((s = this.config) != null && s.entity)))
      return this.hass.states[this.config.entity];
  }
  get _isSnoozeActive() {
    var s;
    return ((s = this._entity) == null ? void 0 : s.state) === "on";
  }
  get _cardTitle() {
    var s;
    return ((s = this.config) == null ? void 0 : s.name) || h("Autosnooze", { id: "card.title" });
  }
  async _handleSnooze(s) {
    var t;
    if (!(!this.hass || !((t = this.config) != null && t.entity))) {
      this._isLoading = !0;
      try {
        await this.hass.callService("autosnooze", "snooze", {
          entity_id: this.config.entity,
          duration: s
        });
      } catch {
        console.error("Failed to start snooze");
      } finally {
        this._isLoading = !1;
      }
    }
  }
  async _handleStopSnooze() {
    var s;
    if (!(!this.hass || !((s = this.config) != null && s.entity))) {
      this._isLoading = !0;
      try {
        await this.hass.callService("autosnooze", "stop", {
          entity_id: this.config.entity
        });
      } catch {
        console.error("Failed to stop snooze");
      } finally {
        this._isLoading = !1;
      }
    }
  }
  _handleCustomMinutesChange(s) {
    const t = s.target;
    this._snoozeMinutes = parseInt(t.value, 10) || 30;
  }
  render() {
    return this._entity ? A`
      <ha-card class="${this._isLoading ? "loading" : ""}">
        <div class="card-content">
          <div class="card-header">
            <span class="card-title">${this._cardTitle}</span>
            <span
              class="status-badge ${this._isSnoozeActive ? "status-active" : "status-inactive"}"
            >
              ${this._isSnoozeActive ? h("Active", { id: "snooze.status.active" }) : h("Inactive", { id: "snooze.status.inactive" })}
            </span>
          </div>

          <div class="quick-actions">
            <button
              class="quick-action-btn"
              @click="${() => this._handleSnooze(15)}"
              ?disabled="${this._isLoading}"
              aria-label="${h("Snooze for 15 minutes", { id: "a11y.snooze_button" })}"
            >
              ${h("15 min", { id: "quick_snooze.15m" })}
            </button>
            <button
              class="quick-action-btn"
              @click="${() => this._handleSnooze(30)}"
              ?disabled="${this._isLoading}"
            >
              ${h("30 min", { id: "quick_snooze.30m" })}
            </button>
            <button
              class="quick-action-btn"
              @click="${() => this._handleSnooze(60)}"
              ?disabled="${this._isLoading}"
            >
              ${h("1 hour", { id: "quick_snooze.1h" })}
            </button>
            <button
              class="quick-action-btn"
              @click="${() => this._handleSnooze(120)}"
              ?disabled="${this._isLoading}"
            >
              ${h("2 hours", { id: "quick_snooze.2h" })}
            </button>
          </div>

          <div class="custom-duration">
            <input
              type="number"
              min="1"
              max="1440"
              .value="${String(this._snoozeMinutes)}"
              @change="${this._handleCustomMinutesChange}"
              aria-label="${h("Custom duration in minutes", { id: "a11y.time_picker" })}"
            />
            <span>${h("minutes", { id: "snooze.duration.minutes" })}</span>
            <button
              class="quick-action-btn"
              @click="${() => this._handleSnooze(this._snoozeMinutes)}"
              ?disabled="${this._isLoading}"
            >
              ${h("Custom", { id: "snooze.duration.custom" })}
            </button>
          </div>

          <div class="action-buttons">
            ${this._isSnoozeActive ? A`
                  <button
                    class="secondary-btn"
                    @click="${this._handleStopSnooze}"
                    ?disabled="${this._isLoading}"
                  >
                    ${h("Stop Snooze", { id: "snooze.action.stop" })}
                  </button>
                  <button
                    class="primary-btn"
                    @click="${() => this._handleSnooze(this._snoozeMinutes)}"
                    ?disabled="${this._isLoading}"
                  >
                    ${h("Extend", { id: "snooze.action.extend" })}
                  </button>
                ` : A`
                  <button
                    class="primary-btn"
                    @click="${() => this._handleSnooze(this._snoozeMinutes)}"
                    ?disabled="${this._isLoading}"
                  >
                    ${h("Start Snooze", { id: "snooze.action.start" })}
                  </button>
                `}
          </div>

          ${this._isSnoozeActive && this._entity.attributes.remaining_time ? A`
                <div class="time-remaining">
                  ${h(ne`Time remaining: ${this._entity.attributes.remaining_time}`, {
      id: "snooze.time_remaining"
    })}
                </div>
              ` : ""}
        </div>
      </ha-card>
    ` : A`
        <ha-card>
          <div class="card-content">
            ${h("Entity not found", { id: "error.not_found" })}
          </div>
        </ha-card>
      `;
  }
};
x.styles = St`
    :host {
      display: block;
      padding: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 1.2em;
      font-weight: 500;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
    }

    .status-active {
      background-color: var(--success-color, #4caf50);
      color: white;
    }

    .status-inactive {
      background-color: var(--disabled-color, #9e9e9e);
      color: white;
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .quick-action-btn {
      padding: 8px 16px;
      border: 1px solid var(--primary-color, #03a9f4);
      border-radius: 4px;
      background: transparent;
      color: var(--primary-color, #03a9f4);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .quick-action-btn:hover {
      background-color: var(--primary-color, #03a9f4);
      color: white;
    }

    .quick-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .custom-duration {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
    }

    .custom-duration input {
      width: 80px;
      padding: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .primary-btn {
      padding: 10px 20px;
      background-color: var(--primary-color, #03a9f4);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .primary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .secondary-btn {
      padding: 10px 20px;
      background-color: transparent;
      color: var(--primary-text-color, #212121);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      cursor: pointer;
    }

    .time-remaining {
      margin-top: 16px;
      padding: 12px;
      background-color: var(--card-background-color, #f5f5f5);
      border-radius: 4px;
      text-align: center;
    }

    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
  `;
v([
  I({ attribute: !1 })
], x.prototype, "hass", 2);
v([
  I({ attribute: !1 })
], x.prototype, "config", 2);
v([
  Lt()
], x.prototype, "_snoozeMinutes", 2);
v([
  Lt()
], x.prototype, "_isLoading", 2);
x = v([
  Pt("autosnooze-card"),
  Tt()
], x);
let N = class extends z {
  _handleEntityChange(s) {
    const t = s.target;
    this._updateConfig({ entity: t.value });
  }
  _handleNameChange(s) {
    const t = s.target;
    this._updateConfig({ name: t.value });
  }
  _updateConfig(s) {
    const t = { ...this.config, ...s }, e = new CustomEvent("config-changed", {
      detail: { config: t },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(e);
  }
  render() {
    var t;
    const s = this.hass ? Object.keys(this.hass.states).filter((e) => e.startsWith("autosnooze.")) : [];
    return A`
      <div class="form-row">
        <label>${h("Entity", { id: "editor.entity_label" })}</label>
        <select @change="${this._handleEntityChange}">
          <option value="">${h("Select an entity", { id: "entity.select" })}</option>
          ${s.map(
      (e) => {
        var i;
        return A`
              <option value="${e}" ?selected="${e === ((i = this.config) == null ? void 0 : i.entity)}">
                ${e}
              </option>
            `;
      }
    )}
        </select>
      </div>

      <div class="form-row">
        <label>${h("Name (optional)", { id: "editor.name_label" })}</label>
        <input
          type="text"
          .value="${((t = this.config) == null ? void 0 : t.name) || ""}"
          @input="${this._handleNameChange}"
          placeholder="${h("Autosnooze", { id: "card.title" })}"
        />
      </div>
    `;
  }
};
N.styles = St`
    :host {
      display: block;
      padding: 16px;
    }

    .form-row {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }

    input,
    select {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      box-sizing: border-box;
    }
  `;
v([
  I({ attribute: !1 })
], N.prototype, "hass", 2);
v([
  I({ attribute: !1 })
], N.prototype, "config", 2);
N = v([
  Pt("autosnooze-card-editor"),
  Tt()
], N);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "autosnooze-card",
  name: "Autosnooze Card",
  description: "A card to control autosnooze entities"
});
export {
  x as A,
  N as a,
  ne as s
};
//# sourceMappingURL=autosnooze-card-BFzPPKX8.js.map
