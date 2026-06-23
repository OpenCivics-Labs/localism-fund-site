/* ============================================================
   Localism Fund — static site generator
   index.html (the Fund) · intro.html (narrative walkthrough) ·
   round-01.html (retrospective + map) · experts.html ·
   <slug>.html (12 projects). No dependencies. node build.mjs
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(ROOT, "data");
const SRC = path.join(ROOT, "src");
const ASSETS = path.join(ROOT, "assets");
const DIST = path.join(ROOT, "dist");

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = esc;
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

const round = read("round01.json");
const fund = read("fund.json");
const experts = read("experts.json");
const BLOB = round.meta.repoBlobBase;
const ACC = round.accents || {};

const grantees = round.order.map((slug) => {
  const p = path.join(DATA, "grantees", slug + ".json");
  if (!fs.existsSync(p)) { console.warn("  ! missing data:", slug); return null; }
  try { const g = JSON.parse(fs.readFileSync(p, "utf8")); g.accent = ACC[slug] || "#8a7a4e"; return g; }
  catch (e) { console.warn("  ! bad JSON:", slug, e.message); return null; }
}).filter(Boolean);

const tierDot = { "Solid": "var(--tier-solid)", "Mixed": "var(--tier-mixed)", "Needs Follow-Up": "var(--tier-follow)", "Significant Concerns": "var(--tier-follow)" };
const chips = (arr, cls = "chip") => (arr || []).map((t) => `<span class="${cls}">${esc(t)}</span>`).join("");
const statBlock = (s) => `<div class="stat reveal"><div class="stat__value">${esc(s.value)}</div><div class="stat__label">${esc(s.label)}</div></div>`;
const sectionHead = (num, title, lede, ledeMax) => `<div class="section__head section__head--plain reveal">
  <h2 class="section__title">${esc(title)}</h2>
  ${lede ? `<p class="section__lede"${ledeMax ? ` style="max-width:${ledeMax}"` : ""}>${esc(lede)}</p>` : ""}
</div>`;

/* abstract dimension shapes — stroke = currentColor (lime) */
const dimShapes = {
  Political: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="40" cy="40" r="8"/><circle cx="15" cy="18" r="5.5"/><circle cx="65" cy="18" r="5.5"/><circle cx="15" cy="62" r="5.5"/><circle cx="65" cy="62" r="5.5"/><path d="M34 35 20 22M46 35 60 22M34 45 20 58M46 45 60 58" stroke-width="2.5"/></svg>`,
  Economic: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M62 30a26 26 0 1 0 3 22"/><path d="M64 18l1 13-12-2"/></svg>`,
  Cultural: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4"><circle cx="30" cy="33" r="16"/><circle cx="50" cy="33" r="16"/><circle cx="40" cy="51" r="16"/></svg>`,
  Ecological: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M14 58a26 26 0 0 1 52 0"/><path d="M26 58a14 14 0 0 1 28 0"/><circle cx="40" cy="58" r="3.2" fill="currentColor" stroke="none"/></svg>`,
  Ethereum: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><path d="M40 10 60 40 40 51 20 40Z"/><path d="M22 45 40 70 58 45 40 55Z"/></svg>`,
  Social: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="28" cy="32" r="10"/><circle cx="52" cy="32" r="10"/><path d="M22 56q18 13 36 0"/></svg>`,
  Technological: `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"><path d="M40 12 64 26 64 54 40 68 16 54 16 26Z"/><circle cx="40" cy="40" r="5.5" fill="currentColor" stroke="none"/></svg>`,
};

/* abstract distributed network — no centre, no names */
function expertGraph() {
  const POS = [[36, 52], [78, 30], [128, 44], [176, 26], [224, 52], [242, 104], [206, 142], [158, 124], [110, 150], [62, 134], [26, 100], [96, 86], [148, 80], [196, 96], [70, 74], [128, 116]];
  const EDG = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 0], [0, 14], [14, 1], [14, 11], [11, 2], [11, 12], [12, 3], [12, 13], [13, 5], [13, 6], [11, 15], [15, 12], [15, 7], [15, 8], [9, 14]];
  const edges = EDG.map(([a, b]) => `<line class="eedge" data-a="${a}" data-b="${b}" x1="${POS[a][0]}" y1="${POS[a][1]}" x2="${POS[b][0]}" y2="${POS[b][1]}"/>`).join("");
  const nodes = POS.map(([x, y], i) => `<g class="enode" data-i="${i}" tabindex="0" transform="translate(${x} ${y})"><circle class="av" r="${i % 4 === 0 ? 6 : 5}"/></g>`).join("");
  return `<svg class="netgraph egraph" viewBox="0 0 268 168" role="img" aria-label="The expert network — many connected practitioners, with no single centre"><g class="netgraph__g"><g class="edges">${edges}</g><g class="enodes">${nodes}</g></g></svg>`;
}

/* ---------- shared shell ---------- */
function nav(navDark) {
  return `<nav class="nav${navDark ? " on-dark" : ""}">
  <a class="nav__brand" href="index.html"><span class="nav__logo" aria-hidden="true"></span><span>Localism&nbsp;Fund</span></a>
  <div class="nav__links">
    <a href="index.html#mission">Mission</a>
    <a href="index.html#rounds">Rounds</a>
    <a href="operators.html">Operators</a>
    <a href="experts.html">Expert&nbsp;Network</a>
    <a class="nav__round" href="round-01.html">Round 01</a>
    <a class="nav__round nav__round--ghost" href="round-02.html">Round&nbsp;02</a>
  </div>
</nav>`;
}
function footer(draft) {
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img class="footer__logo" src="assets/logo/localismfund-logo-03.svg" alt="Localism Fund" width="60" height="60">
        <h3 class="reveal">Funding the people closest to the place.</h3>
      </div>
      <div class="footer__col"><h4>Explore</h4><ul>
        <li><a href="index.html#mission">Mission</a></li>
        <li><a href="intro.html">Narrative intro</a></li>
        <li><a href="round-01.html">The retrospective</a></li>
        <li><a href="experts.html">Expert Network</a></li>
      </ul></div>
      <div class="footer__col"><h4>Connect</h4><ul>
        <li><a href="${attr(fund.meta.site)}" target="_blank" rel="noopener">localism.fund ↗</a></li>
        <li><a href="${attr(round.meta.repo)}" target="_blank" rel="noopener">Evaluations on GitHub ↗</a></li>
        <li><a href="${attr(experts.meta.twitter)}" target="_blank" rel="noopener">@localismfund ↗</a></li>
      </ul></div>
    </div>
    <div class="footer__note">
      <span>© Localism Fund</span>
    </div>
  </div>
</footer>`;
}
function layout({ title, desc, body, navDark = false, accentVar = "", draft = false, htmlClass = "" }) {
  return `<!doctype html>
<html lang="en"${htmlClass ? ` class="${htmlClass}"` : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta name="theme-color" content="#1a2b19">
<link rel="icon" href="assets/logo/localismfund-logo-01.svg">
<link rel="preload" href="assets/fonts/aquavit-semibold.otf" as="font" type="font/otf" crossorigin>
<link rel="stylesheet" href="styles.css">
</head>
<body${accentVar ? ` style="${accentVar}"` : ""}>
${nav(navDark)}
${body}
${footer(draft)}
<script src="app.js"></script>
</body>
</html>`;
}

/* ============================================================
   LANDING — index.html
   ============================================================ */
function landingPage() {
  const f = fund;
  const objs = f.mission.objectives.map((o, i) => `<div class="objcard reveal"><div class="n">${String(i + 1).padStart(2, "0")}</div><p>${esc(o)}</p></div>`).join("");
  const localismDims = f.dimensions.items.filter((d) => d.name !== "Ethereum");
  const ethDim = f.dimensions.items.find((d) => d.name === "Ethereum");
  const dimcards = localismDims.map((d) => `<div class="dimcompact reveal">
      <span class="dimcompact__ic">${dimShapes[d.name] || ""}</span>
      <div><h3>${esc(d.name)} localism</h3><p>${esc(d.body)}</p></div>
    </div>`).join("");
  const monogram = (name) => {
    const paren = name.match(/\(([A-Z]{2,5})\)/);
    if (paren) return paren[1];
    const caps = (name.match(/[A-Z]/g) || []);
    if (caps.length >= 2) return caps.slice(0, 3).join("");
    return name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };
  const partnerCats = ((f.partners && f.partners.groups) || []).map((gr) => `<div class="partnercat reveal"><h4 class="partnercat__h">${esc(gr.name)}</h4><div class="partnercards">${gr.items.map((it) => {
    const mark = it.domain
      ? `<span class="pcard2__mark" data-mono="${attr(monogram(it.name))}"><img class="pcard2__fav" src="assets/img/partners/${attr(it.domain)}.png" alt="" loading="lazy" onerror="this.closest('.pcard2__mark').classList.add('no-img')"></span>`
      : `<span class="pcard2__mark" aria-hidden="true">${esc(monogram(it.name))}</span>`;
    return `<div class="pcard2">${mark}<div class="pcard2__body"><b>${esc(it.name)}</b><span>${esc(it.note)}</span></div></div>`;
  }).join("")}</div></div>`).join("");
  const deepFaqItems = (f.deepFaq || []).map((q) => `<details class="disc"><summary>${esc(q.q)} <span class="disc__plus"></span></summary><div class="disc__body"><p>${esc(q.a)}</p></div></details>`).join("");
  const rounds = f.rounds.map((r) => {
    const acc = r.status === "live" ? "#c4623d" : "#8a9382";
    const stats = (r.stats || []).map((s) => `<div class="roundcard__stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
    const inner = `
      <div class="roundcard__num">${esc(r.num)}</div>
      <div>
        <div class="roundcard__title">Round ${esc(r.num)} — ${esc(r.title)}</div>
        <div class="roundcard__dek">${esc(r.dek)}</div>
        ${stats ? `<div class="roundcard__stats">${stats}</div>` : ""}
      </div>
      <div class="roundcard__side"><span class="statuschip ${r.status}">${esc(r.statusLabel)}</span>${r.href ? `<span class="arrow">→</span>` : ""}</div>`;
    return r.href
      ? `<a class="roundcard reveal" style="--accent:${acc}" href="${attr(r.href)}">${inner}</a>`
      : `<div class="roundcard is-coming reveal" style="--accent:${acc}">${inner}</div>`;
  }).join("");

  const body = `
<header class="hero hero--scene scene scene--tall scene--dark" data-darknav>
  <div class="scene__bg"><img class="parallax" data-parallax="0.16" src="assets/img/hero-liana.jpg" alt=""></div>
  <div class="scene__overlay" style="background:radial-gradient(135% 105% at 78% 6%, rgba(26,43,25,0.25), rgba(26,43,25,0.96) 80%)"></div>
  <div class="wrap">
    <p class="eyebrow hero__kicker reveal">${esc(f.kicker)}</p>
    <h1 class="reveal">${esc(f.heroTitle)}</h1>
    <p class="hero__dek reveal">${esc(f.heroDek)}</p>
    <div class="btnrow reveal">
      <a class="btn btn--lime" href="round-01.html">Explore Round 01 →</a>
      <a class="btn" href="experts.html" style="background:transparent;color:var(--paper);border:1px solid rgba(255,255,255,0.35)">Expert Network</a>
    </div>
    <p class="reveal" style="margin-top:1.7rem"><a href="intro.html" style="color:color-mix(in srgb,var(--paper) 64%, transparent);font-size:0.92rem;text-decoration:underline;text-underline-offset:4px">Read the narrative version →</a></p>
  </div>
</header>

<section class="section section--air" id="mission">
  <div class="wrap">
    <p class="eyebrow reveal">Why we exist</p>
    <p class="missionlead reveal">${esc(f.mission.paragraphs[0])}</p>
    ${f.mission.paragraphs.length > 1 ? `<div class="prose reveal">${f.mission.paragraphs.slice(1).map((p) => `<p>${esc(p)}</p>`).join("")}</div>` : ""}
    <div class="objgrid">${objs}</div>
  </div>
</section>

<section class="scene scene--mid scene--dark section--air" id="localism">
  <div class="wrap">
    <p class="eyebrow reveal">Localism</p>
    <h2 class="section__title reveal" style="max-width:34ch">Four dimensions of localism</h2>
    <p class="section__lede reveal" style="color:var(--paper);max-width:60ch">${esc(f.dimensions.lede)}</p>
    <div class="dimgrid2">${dimcards}</div>
    ${ethDim ? `<p class="railnote reveal"><span>On Ethereum rails.</span> ${esc(ethDim.body)}</p>` : ""}
  </div>
</section>

<section class="scene scene--mid scene--dark" id="model">
  <div class="wrap">
    <p class="eyebrow reveal">How it works</p>
    <h2 class="bigstatement reveal" style="margin-top:0.6rem">Fund the <span class="accent-word">hub</span>, not the project.</h2>
    <p class="scene__sub reveal">${esc(f.model.paragraphs[0])}</p>
  </div>
</section>

<section class="section section--air" id="rounds">
  <div class="wrap">
    <p class="eyebrow reveal">Rounds</p>
    <h2 class="section__title reveal" style="margin-bottom:clamp(1.5rem,4vw,2.5rem)">Organised by round</h2>
    <div class="roundlist">${rounds}</div>
  </div>
</section>

<section class="section section--alt section--air" id="experts-teaser">
  <div class="wrap">
    <div class="split">
      <div class="reveal">
        <p class="eyebrow">Expert Network</p>
        <h2 class="section__title" style="max-width:15ch;margin:0.3rem 0 1rem">${esc(f.expertsTeaser.lede)}</h2>
        <div class="prose"><p>${esc(f.expertsTeaser.body)}</p></div>
        <div class="btnrow"><a class="btn" href="${attr(f.expertsTeaser.href)}">${esc(f.expertsTeaser.cta)} →</a></div>
      </div>
      <div class="graphbox reveal">${expertGraph()}</div>
    </div>
  </div>
</section>

<section class="section section--alt section--air" id="partners">
  <div class="wrap">
    <p class="eyebrow reveal">Partners</p>
    <h2 class="section__title reveal" style="max-width:48ch">${esc(f.partners.lede)}</h2>
    <div class="partnercats">${partnerCats}</div>
  </div>
</section>`;

  return layout({ title: "Localism Fund — local hubs, funded close to the ground", desc: f.heroDek, body, navDark: true });
}

/* ============================================================
   ALTERNATIVE HOME — intro.html (narrative parallax walkthrough)
   ============================================================ */
function narrativePage() {
  const chapters = (fund.narrative && fund.narrative.chapters) || [];
  const wordify = (s) => { let wi = 0; return esc(s).split(/(\s+)/).map((tok) => /^\s+$/.test(tok) ? tok : `<span class="w" style="--i:${wi++}">${tok}</span>`).join(""); };
  const renderCh = (c, i) => {
    let inner;
    if (c.type === "dimensions") {
      const items = c.items.map((it) => `<div class="chdim"><h3>${esc(it.name)}</h3><p>${esc(it.note)}</p></div>`).join("");
      inner = `<p class="chlead ctext">${wordify(c.lead)}</p><div class="chdims">${items}</div>${c.rail ? `<p class="chrail">${esc(c.rail)}</p>` : ""}`;
    } else if (c.type === "cta") {
      const btns = c.buttons.map((x) => `<a class="btn ${x.primary ? "btn--lime" : ""}" href="${attr(x.href)}"${x.primary ? "" : ` style="background:transparent;color:var(--paper);border:1px solid rgba(255,255,255,0.35)"`}>${esc(x.label)} →</a>`).join("");
      inner = `<p class="chbig ctext">${wordify(c.text)}</p><div class="btnrow">${btns}</div>${c.altLink ? `<a class="beat__altlink" href="${attr(c.altLink.href)}">${esc(c.altLink.label)}</a>` : ""}`;
    } else {
      inner = `${c.kicker ? `<p class="eyebrow chkicker">${esc(c.kicker)}</p>` : ""}<p class="chbig ctext">${wordify(c.text)}${c.emph ? `<span class="emph">${esc(c.emph)}</span>` : ""}</p>${c.sub ? `<p class="chsub">${esc(c.sub)}</p>` : ""}`;
    }
    return `<div class="chapter${i === 0 ? " is-active" : ""}" data-ch="${i}"><div class="wrap">${inner}</div></div>`;
  };
  const toc = chapters.map((c, i) => `<li${i === 0 ? ' class="is-active"' : ""}><button data-go="${i}"><span class="toc__n">${String(i + 1).padStart(2, "0")}</span><span class="toc__t">${esc(c.toc)}</span></button></li>`).join("");
  const body = `<div class="progress"></div>
<div class="report" style="height:${chapters.length * 100}vh">
  <nav class="toc" aria-label="Contents"><ol>${toc}</ol></nav>
  <div class="stage">
    <div class="stage__bg"><div class="photo"></div><div class="orb orb--1"></div><div class="orb orb--2"></div><div class="orb orb--3"></div></div>
    <div class="stage__frame">${chapters.map(renderCh).join("\n")}</div>
  </div>
</div>`;
  return layout({ title: "Localism Fund — why we exist", desc: fund.heroDek, body, navDark: true });
}

/* ============================================================
   MAP — equirectangular SVG locator
   ============================================================ */
const projLL = (lon, lat) => [lon + 180, 90 - lat];
let _landPaths = null;
function worldLandPaths() {
  if (_landPaths !== null) return _landPaths;
  const geo = JSON.parse(fs.readFileSync(path.join(DATA, "world.geo.json"), "utf8"));
  let land = "";
  for (const f of geo.features) {
    const geom = f.geometry; if (!geom) continue;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
    for (const poly of polys) for (const ring of poly) {
      let d = "", prevLon = null;
      for (const pt of ring) {
        const lon = pt[0], lat = pt[1], [x, y] = projLL(lon, lat);
        if (prevLon !== null && Math.abs(lon - prevLon) > 180) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
        else d += (d ? " L " : "M ") + `${x.toFixed(1)} ${y.toFixed(1)}`;
        prevLon = lon;
      }
      d += " Z"; land += `<path d="${d}"/>`;
    }
  }
  _landPaths = land; return land;
}
function grantMiniMap(g) {
  const pts = (round.locations || {})[g.slug] || [];
  if (!pts.length) return "";
  const markers = pts.map((p) => { const [lat, lon] = p, [x, y] = projLL(lon, lat); return `<circle class="mk-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><circle class="mk" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`; }).join("");
  return `<svg class="minimap" viewBox="0 6 360 142" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Location of ${attr(g.region || g.name)}"><g class="land">${worldLandPaths()}</g><g class="mks">${markers}</g></svg>`;
}
function buildMap() {
  const land = worldLandPaths();
  const proj = projLL;
  let markers = "";
  grantees.forEach((g) => {
    const pts = (round.locations || {})[g.slug] || [];
    pts.forEach((p) => {
      const [lat, lon] = p, [x, y] = proj(lon, lat);
      markers += `<a href="${attr(g.slug)}.html" style="--accent:${attr(g.accent)}">
        <circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>
        <text class="lbl" x="${x.toFixed(1)}" y="${(y - 5).toFixed(1)}">${esc(g.shortName || g.name)}</text>
        <title>${esc(g.name)} — ${esc(g.region)}</title>
      </a>`;
    });
  });
  return `<div class="mapwrap reveal">
    <svg class="map" viewBox="0 6 360 142" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Round 01 project locations">
      <g class="land">${land}</g><g class="markers">${markers}</g>
    </svg>
    <p class="mapcap">Twelve hubs across six continents — hover or tap a marker to open its story.</p>
  </div>`;
}

/* ============================================================
   ROUND 01 — round-01.html
   ============================================================ */
function round01Page() {
  const cards = grantees.map((g, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `<a class="pcard reveal" style="--accent:#4a7339" href="${attr(g.slug)}.html">
      <div class="pcard__top"><span class="pcard__num">${n}</span><span class="tier" data-tier="${attr(g.verdict.tier)}">${esc(g.verdict.tier)}</span></div>
      <div class="pcard__name">${esc(g.name)}</div>
      <div class="pcard__place">${esc(g.place)}</div>
      <p class="pcard__tag">${esc(g.tagline)}</p>
      <div class="pcard__foot"><div class="pcard__themes">${chips((g.themes || []).slice(0, 3))}</div><span class="arrow">→</span></div>
    </a>`;
  }).join("\n");
  const tierPills = (round.tierSummary || []).map((t) =>
    `<span class="tierpill"><span class="dot" style="background:${tierDot[t.tier] || "var(--ink)"}"></span><b>${esc(t.count)}</b> ${esc(t.tier)} <span style="color:var(--ink-faint)">· ${esc(t.note)}</span></span>`
  ).join("");
  const statbar = (round.byNumbers || []).map((s) => `<div class="statbar__item"><div class="statbar__v">${esc(s.value)}</div><div class="statbar__l">${esc(s.label)}</div></div>`).join("");
  const insights = (round.insights || []).map((i) => `<li><b>${esc(i.lead)}</b> ${esc(i.body)}</li>`).join("");

  const body = `
<header class="hero" data-darknav>
  <div class="wrap">
    <p class="eyebrow hero__kicker reveal">${esc(round.kicker)}</p>
    <h1 class="reveal">${esc(round.title)}</h1>
    <p class="hero__dek reveal">${esc(round.dek)}</p>
    <div class="statbar reveal">${statbar}</div>
  </div>
</header>

<section class="section" id="overview">
  <div class="wrap">
    ${sectionHead("01", "The round")}
    <div class="prose reveal">${round.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="tiers reveal">${tierPills}</div>
  </div>
</section>

<section class="section section--ink" id="findings">
  <div class="wrap">
    ${sectionHead("02", "What we found", round.findings.lede, "38ch")}
    <div class="found2">
      <div class="prose reveal">${round.findings.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
      ${insights ? `<div class="reveal"><p class="eyebrow" style="color:var(--lime);margin-bottom:1rem">What it taught us</p><ul class="insights">${insights}</ul></div>` : ""}
    </div>
  </div>
</section>

<section class="section section--alt" id="projects">
  <div class="wrap">
    ${sectionHead("03", "The projects", "Twelve hubs, each with the same brief. Find them on the map, scan the cohort, then open any one for the full story and the evidence behind it.")}
    ${buildMap()}
    <div class="projects">${cards}</div>
  </div>
</section>

<section class="section" id="method">
  <div class="wrap">
    ${sectionHead("04", "How we read them")}
    <div class="prose reveal">${round.method.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="btnrow reveal" style="margin-top:1.8rem">
      <a class="btn" href="https://gov.gitcoin.co/t/localism-fund-initial-progress-reflections-report/24947" target="_blank" rel="noopener">Progress &amp; reflections report →</a>
      <a class="btn" href="${attr(round.meta.repo)}" target="_blank" rel="noopener">All evaluations on GitHub →</a>
    </div>
  </div>
</section>`;

  return layout({ title: "Round 01: Local Grant Programs — Localism Fund", desc: round.dek, body, navDark: true, draft: true });
}

/* ============================================================
   OPERATORS — operators.html
   ============================================================ */
function operatorsPage() {
  const o = experts.operators;
  const cards = (o.items || []).map((p) => { const ini = String(p.name || "").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); return `<div class="opcard reveal"><span class="opcard__avatar" aria-hidden="true">${esc(ini)}</span><div class="opcard__body"><b>${esc(p.name)}</b><span class="opcard__org">${esc(p.org)}</span>${p.bio ? `<p class="opcard__bio">${esc(p.bio)}</p>` : ""}</div></div>`; }).join("");
  const resp = (o.responsibilities || []).map((r) => `<div class="dcard reveal"><h3>${esc(r.name)}</h3><p>${esc(r.body)}</p></div>`).join("");
  const body = `
<header class="hero" data-darknav>
  <div class="wrap">
    <p class="eyebrow hero__kicker reveal">Localism Fund · Operators</p>
    <h1 class="reveal">Who runs it.</h1>
    <p class="hero__dek reveal">${esc(o.blurb || "")}</p>
  </div>
</header>
<section class="section" id="operators">
  <div class="wrap">
    <div class="section__head section__head--plain reveal"><h2 class="section__title">The operator team</h2></div>
    <div class="opgrid">${cards}</div>
  </div>
</section>
<section class="section section--alt" id="responsibilities">
  <div class="wrap">
    <div class="section__head section__head--plain reveal"><h2 class="section__title">What operators do</h2></div>
    <div class="cardgrid">${resp}</div>
  </div>
</section>`;
  return layout({ title: "Operators — Localism Fund", desc: o.blurb || "The Localism Fund operator team.", body, navDark: true });
}

/* ============================================================
   EXPERT NETWORK — experts.html
   ============================================================ */
function expertsPage() {
  const e = experts;
  const opItems = e.operators.items;
  const domains = e.domains.items.map((d) => `<div class="dcard reveal"><div class="dcard__k">Domain</div><h3>${esc(d.name)}</h3><p>${esc(d.body)}</p></div>`).join("");
  const steps = e.lifecycle.steps.map((s) => `<div class="step reveal"><div class="step__n"></div><h4>${esc(s.title)}</h4><p>${esc(s.body)}</p></div>`).join("");
  const roster = (e.roster.members || []).map((m) => {
    const isOp = opItems.some((o) => m.includes(o.name) || o.name.includes(m));
    return `<li class="${isOp ? "is-op" : ""}">${esc(m)}${isOp ? `<span class="role">Operator</span>` : ""}</li>`;
  }).join("");
  const roles = e.round01.roles.map((r) => `<div class="dcard reveal"><div class="dcard__k">Role</div><h3>${esc(r.name)}</h3><p>${esc(r.body)}</p></div>`).join("");
  const rubric = e.round01.rubric.map((r) => `<li><span class="nm">${esc(r.name)}</span><span class="w">${esc(r.weight)}</span></li>`).join("");
  const joinLinks = e.join.links.map((l) => `<a class="btn ${l.primary ? "btn--lime" : ""}" href="${attr(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("");
  const faqItems = (e.faq || []).map((q) => `<details class="disc"><summary>${esc(q.q)} <span class="disc__plus"></span></summary><div class="disc__body"><p>${esc(q.a)}</p></div></details>`).join("");
  const elig = ((e.eligibility && e.eligibility.items) || []).map((x) => `<li>${esc(x)}</li>`).join("");

  const body = `
<header class="hero" data-darknav>
  <div class="wrap">
    <p class="eyebrow hero__kicker reveal">${esc(e.kicker)}</p>
    <h1 class="reveal">${esc(e.heroTitle)}</h1>
    <p class="hero__dek reveal">${esc(e.heroDek)}</p>
    <a class="scrollcue reveal" href="#what"><span></span> How it works</a>
  </div>
</header>

<section class="section" id="what">
  <div class="wrap">
    ${sectionHead("01", "What it is", e.what.lede)}
    <div class="prose reveal">${e.what.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="statband">${e.stats.map(statBlock).join("")}</div>
  </div>
</section>

<section class="section section--alt" id="domains">
  <div class="wrap">
    ${sectionHead("02", "Three domains of expertise", "Experts bring proven experience across one or more of these.")}
    <div class="cardgrid">${domains}</div>
  </div>
</section>

<section class="section" id="network">
  <div class="wrap">
    ${sectionHead("03", "The network", e.roster.lede)}
    <ul class="roster reveal">${roster}</ul>
    <p class="rosternote reveal">${esc(e.roster.note)}</p>
  </div>
</section>

<section class="section section--alt" id="round01">
  <div class="wrap">
    ${sectionHead("04", "Inside Round 01", e.round01.lede)}
    <div class="cardgrid">${roles}</div>
    <div class="reveal" style="margin-top:clamp(2rem,5vw,3.2rem)">
      <p class="eyebrow">How applications were scored</p>
      <ul class="rubric">${rubric}</ul>
      <div class="round01-note">
        <span>${esc(e.round01.matching)}</span>
        <span>${esc(e.round01.compensation)}</span>
      </div>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <div class="section__head section__head--plain reveal"><h2 class="section__title">Questions, answered</h2></div>
    <div class="faq">${faqItems}</div>
  </div>
</section>

<section class="scene scene--mid scene--dark" id="lifecycle">
  <div class="wrap">
    <div class="section__head section__head--plain reveal">
      <h2 class="section__title">The engagement lifecycle</h2>
      <p class="section__lede" style="color:var(--lime)">${esc(e.lifecycle.lede)}</p>
    </div>
    <div class="steps">${steps}</div>
  </div>
</section>

<section class="section" id="join">
  <div class="wrap">
    <div class="reveal" style="max-width:var(--prose)">
      <p class="eyebrow">Join</p>
      <h2 class="section__title" style="font-size:clamp(1.8rem,3.6vw,2.8rem);margin:0.3rem 0 0.8rem">${esc(e.join.lede)}</h2>
      <p style="color:var(--ink-2)">${esc(e.join.body)}</p>
      ${e.eligibility ? `<p class="eyebrow" style="margin-top:1.7rem">${esc(e.eligibility.lede)}</p><ul class="eligibility">${elig}</ul>` : ""}
      <div class="btnrow" style="margin-top:1.8rem">${joinLinks}</div>
    </div>
  </div>
</section>`;

  return layout({ title: "Expert Network — Localism Fund", desc: e.heroDek, body, navDark: true });
}

/* ============================================================
   PROJECT PAGE — <slug>.html
   ============================================================ */
function source(href, t, d) {
  return `<a class="sourcelink" href="${attr(href)}" target="_blank" rel="noopener"><span class="t">${esc(t)} <span aria-hidden="true">↗</span></span><span class="d">${esc(d)}</span></a>`;
}
function projectPage(g, i) {
  const n = String(i + 1).padStart(2, "0");
  const prev = grantees[(i - 1 + grantees.length) % grantees.length];
  const next = grantees[(i + 1) % grantees.length];
  const accentVar = "--accent:#4a7339";
  const gHead = (label) => `<p class="ghead reveal">${esc(label)}</p>`;
  const sig = g.signatureStory || {};
  const storyList = (g.stories && g.stories.length) ? g.stories : ((sig.title || sig.text) ? [{ title: sig.title, text: sig.text, quote: sig.quote, quoteAttribution: sig.quoteAttribution }] : []);
  const sigBlock = storyList.length
    ? `<div class="stories">${storyList.map((s, si) => `<figure class="signature" style="${accentVar}"><p class="eyebrow signature__label">Story ${si + 1}</p>${s.text ? `<p class="signature__text">${esc(s.text)}</p>` : ""}${s.quote && String(s.quote).trim() ? `<blockquote class="signature__quote">“${esc(s.quote)}”${s.quoteAttribution ? `<span class="signature__cite">${esc(s.quoteAttribution)}</span>` : ""}</blockquote>` : ""}</figure>`).join("")}</div>` : "";
  const storiesSection = sigBlock ? `<section class="gsec" style="${accentVar}"><div class="wrap">${gHead("Stories from the ground")}${sigBlock}</div></section>` : "";
  const outs = (g.outcomes || []).map((o) => `<div class="outcome"><span class="ostat" data-s="${attr(o.status)}">${esc(o.status)}</span><span>${esc(o.text)}</span></div>`).join("");
  const v = g.verdict || {};
  const resourceLinks = (g.resources && g.resources.length)
    ? `<div class="resgrid reveal">${g.resources.map((r) => `<a class="reslink" href="${attr(r.url)}" target="_blank" rel="noopener"><span class="reslink__type">${esc(r.type || "link")}</span><span class="reslink__label">${esc(r.label)} ↗</span></a>`).join("")}</div>`
    : "";
  const DIMS6 = ["Political", "Economic", "Cultural", "Ecological", "Social", "Technological"];
  const focus = new Set((g.localismFocus || []).map((s) => String(s).trim()));
  const dimstrip = DIMS6.map((d) => `<div class="dimstrip__item${focus.has(d) ? " is-on" : ""}"><span class="dimstrip__ic">${dimShapes[d] || ""}</span><span class="dimstrip__nm">${esc(d)}</span></div>`).join("");
  const mini = grantMiniMap(g);
  const opChecks = (g.operatorChecks && g.operatorChecks.length)
    ? `<section class="opcheck" style="${accentVar}"><div class="wrap"><div class="opcheck__box reveal"><p class="opcheck__label">⚠ Temporary · operator review — validate before publishing</p><ul class="opcheck__list">${g.operatorChecks.map((c) => `<li>${esc(c)}</li>`).join("")}</ul><p class="opcheck__note">Internal review aid — to be removed before this retrospective goes public.</p></div></div></section>`
    : "";
  const teamSection = (g.team && g.team.length)
    ? `<section class="gsec" style="${accentVar}"><div class="wrap">${gHead("The team")}<ul class="teamlist">${g.team.map((m) => `<li><span class="tm__name">${esc(m.name)}</span>${m.role ? `<span class="tm__role">${esc(m.role)}</span>` : ""}</li>`).join("")}</ul></div></section>`
    : "";
  const fundingBlock = g.funding ? (() => {
    const G = Number(g.funding.granted) || 0, M = Number(g.funding.matched) || 0;
    const disb = g.funding.disbursements || [];
    const maxA = Math.max(1, ...disb.map((d) => Number(d.amount) || 0));
    const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("en-US");
    const bar = `<div class="fundbar"><div class="fundbar__seg fundbar__seg--grant" style="flex:${G || 1}"><b>${fmt(G)}</b><span>Localism Fund grant</span></div>${M > 0 ? `<div class="fundbar__seg fundbar__seg--match" style="flex:${M}"><b>${fmt(M)}</b><span>Matched locally</span></div>` : ""}</div>`;
    const total = G + M;
    const totalBox = total > 0 ? `<div class="fundtotal"><span class="fundtotal__l">Total committed</span><span class="fundtotal__v">${fmt(total)}</span></div>` : "";
    const stream = disb.length
      ? `<div class="stream">${disb.map((d) => `<div class="stream__row"><span class="stream__to">${esc(d.to)}</span><span class="stream__track"><span class="stream__fill" style="width:${Math.max(5, Math.round((Number(d.amount) || 0) / maxA * 100))}%"></span></span><span class="stream__amt">${fmt(d.amount)}</span><span class="stream__for">${esc(d.purpose)}</span></div>`).join("")}</div>`
      : `<p class="stream__none">No grant funds were verifiably disbursed to independent local projects — the money stayed in the program treasury or covered the hub's own costs.</p>`;
    const note = g.fundingNote ? `<div class="fundnote reveal"><span class="fundnote__ic" aria-hidden="true">!</span><div><p class="fundnote__h">Why the money didn't move as planned</p><p>${esc(g.fundingNote)}</p></div></div>` : "";
    return `<section class="gsec" style="${accentVar}"><div class="wrap">${gHead("The money — granted vs matched")}${bar}${totalBox}${stream}${note}</div></section>`;
  })() : "";
  const corrRows = (g.correlation || []).map((c) => `<div class="corr__row reveal">
      <div class="corr__proposed">${esc(c.proposed)}</div>
      <div class="corr__mid"><span class="corr__status" data-s="${attr(c.status)}">${esc(c.status)}</span></div>
      <div class="corr__outcome">${esc(c.outcome)}</div>
    </div>`).join("");
  const compare = (g.correlation && g.correlation.length) ? `
<section class="gsec" style="${accentVar}">
  <div class="wrap">
    ${gHead("Proposed → accomplished")}
    <div class="corr">
      <div class="corr__head"><span>What they proposed</span><span></span><span>What actually happened</span></div>
      ${corrRows}
    </div>
  </div>
</section>` : (g.proposed ? `
<section class="gsec" style="${accentVar}">
  <div class="wrap">
    ${gHead("Proposed vs. what happened")}
    <div class="compare">
      <div class="compare__col compare__col--plan reveal">
        <div class="compare__h"><span class="compare__k">Proposed</span><h3>What they set out to do</h3></div>
        ${g.proposed.summary ? `<p class="compare__summary">${esc(g.proposed.summary)}</p>` : ""}
        <ul class="plist">${(g.proposed.points || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
      <div class="compare__col compare__col--did reveal">
        <div class="compare__h"><span class="compare__k">Accomplished</span><h3>What actually happened</h3></div>
        <ul class="dlist">${(g.delivered || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>
    </div>
  </div>
</section>` : "");

  const body = `
<header class="phero reveal" style="${accentVar}">
  <div class="wrap">
    <a class="phero__back" href="round-01.html#projects">← Round 01 · all projects</a>
    <div class="phero__grid">
      <div>
        <div class="phero__index">${n} / 12</div>
        <h1>${esc(g.name)}</h1>
        <p class="phero__place">${esc(g.place)}</p>
        ${g.leads ? `<p class="phero__people">Run by <b>${esc(g.leads)}</b>${g.hub ? ` · ${esc(g.hub)}` : ""}</p>` : (g.hub ? `<p class="phero__people"><b>${esc(g.hub)}</b></p>` : "")}
        <div class="phero__chips">${chips(g.themes)}${chips((g.localismFocus || []).map((x) => x + " localism"))}</div>
      </div>
      ${mini ? `<div class="phero__map">${mini}<p class="phero__maploc">${esc(g.region || "")}</p></div>` : ""}
    </div>
  </div>
</header>

<section class="why" style="${accentVar}"><div class="wrap"><p class="why__statement reveal">${esc(g.whyItMattered)}</p></div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  ${gHead("Where it focuses")}
  ${(g.dimensionEvidence && g.dimensionEvidence.length)
    ? `<div class="dimfocus reveal">${g.dimensionEvidence.map((e) => `<div class="dimfocus__row"><div class="dimfocus__g"><span class="dimfocus__ic">${dimShapes[e.dimension] || ""}</span><span class="dimfocus__nm">${esc(e.dimension)}</span></div><p class="dimfocus__ev">${esc(e.evidence)}</p></div>`).join("")}</div>`
    : `<div class="dimstrip reveal">${dimstrip}</div>`}
</div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  ${gHead("By the numbers")}
  <div class="pstats">${(g.stats || []).map(statBlock).join("")}</div>
  <div class="pstatus reveal"><span class="tier" data-tier="${attr(v.tier)}">${esc(v.tier)}</span><p class="pstatus__desc">${esc(g.status)}</p></div>
</div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  ${gHead("The story")}
  <div class="prose reveal">${(g.story || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
</div></section>
${storiesSection}
${teamSection}
${compare}
${fundingBlock}

<section class="gsec" style="${accentVar}"><div class="wrap">
  <div class="oc-grid">
    <div class="oc-col"><p class="ghead">Outcomes</p><div class="outcomes">${outs}</div></div>
    <div class="oc-col timeline reveal"><p class="ghead">Timeline</p><ol class="tl">${((g.timeline && g.timeline.length ? g.timeline : (round.timeline || [])).map((t) => `<li><span class="tl__when">${esc(t.when)}</span><span class="tl__what">${esc(t.what)}</span></li>`)).join("")}</ol></div>
  </div>
</div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  ${gHead("Operator evaluation")}
  <div class="honest reveal" style="${accentVar}">
    ${v.line ? `<p class="honest__line">“${esc(v.line)}”</p>` : ""}
    <div class="honest__verdict">
      <span><span class="k">Tier</span><span class="v">${esc(v.tier)}</span></span>
      <span><span class="k">Score</span><span class="v honest__score">${esc(v.composite)}<span style="color:var(--ink-faint)">/35</span></span></span>
      <span><span class="k">Finances</span><span class="v">${esc(v.financial)}</span></span>
    </div>
    <p>${esc(g.honesty)}</p>
  </div>
</div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  ${gHead("Sources & evidence")}
  <div class="sources reveal">
    ${source(BLOB + encodeURI(g.links.evaluation), "Full evaluation", "The four-phase AI assessment, verified")}
    ${source(BLOB + encodeURI(g.links.stewardEval), "Steward companion", "Human judgement & follow-ups")}
    ${source(BLOB + encodeURI(g.links.report), "Grantee report", "What the hub told us")}
    ${source(BLOB + encodeURI(g.links.application), "Original application", "What they set out to do")}
  </div>
  ${g.resources && g.resources.length ? `<p class="ghead ghead--sub">External links &amp; media</p>${resourceLinks}` : ""}
</div></section>

${opChecks}

<nav class="pnav">
  <a class="prev" href="${attr(prev.slug)}.html"><div class="dir">← Previous</div><div class="nm">${esc(prev.shortName || prev.name)}</div></a>
  <a class="next" href="${attr(next.slug)}.html"><div class="dir">Next →</div><div class="nm">${esc(next.shortName || next.name)}</div></a>
</nav>`;

  return layout({ title: `${g.name} — Localism Fund Round 01`, desc: g.tagline, body, navDark: false, accentVar, draft: true });
}

/* ============================================================
   ROUND 02 — round-02.html (Local Meetups LATAM) + meetup pages
   ============================================================ */
function meetupMiniMap(m) {
  if (!m.coords || m.coords.length < 2) return "";
  const [lat, lon] = m.coords, [x, y] = projLL(lon, lat);
  return `<svg class="minimap" viewBox="0 6 360 142" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Location of ${attr(m.name)}"><g class="land">${worldLandPaths()}</g><g class="mks"><circle class="mk-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><circle class="mk" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/></g></svg>`;
}
function buildMeetupMap() {
  const land = worldLandPaths();
  let markers = "";
  ((fund.round02 && fund.round02.meetups.items) || []).forEach((m) => {
    if (!m.coords || m.coords.length < 2) return;
    const [lat, lon] = m.coords, [x, y] = projLL(lon, lat);
    markers += `<a href="${attr(m.slug)}.html" style="--accent:#4a7339"><circle class="halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/><title>${esc(m.name)} — ${esc(m.place)}</title></a>`;
  });
  return `<div class="mapwrap reveal"><svg class="map" viewBox="0 6 360 142" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Round 02 meetup locations"><g class="land">${land}</g><g class="markers">${markers}</g></svg><p class="mapcap">Ten meetups across Latin America — hover or tap a marker to open it.</p></div>`;
}
function round02Page() {
  const r = fund.round02;
  if (!r) return "";
  const meetups = r.meetups.items || [];
  const cards = meetups.map((m, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `<a class="pcard reveal" style="--accent:#4a7339" href="${attr(m.slug)}.html">
      <div class="pcard__top"><span class="pcard__num">${n}</span><span class="chip">${esc(m.country)}</span></div>
      <div class="pcard__name">${esc(m.name)}</div>
      <div class="pcard__place">${esc(m.place)}</div>
      <p class="pcard__tag">A year of consistent, content-first Ethereum gatherings.</p>
      <div class="pcard__foot"><div class="pcard__themes">${chips(["Approved · onboarding"])}</div><span class="arrow">→</span></div>
    </a>`;
  }).join("\n");
  const statbar = (r.stats || []).map((s) => `<div class="statbar__item"><div class="statbar__v">${esc(s.value)}</div><div class="statbar__l">${esc(s.label)}</div></div>`).join("");
  const how = (r.how.items || []).map((h) => `<li>${esc(h)}</li>`).join("");
  const links = (r.status.links || []).map((l) => `<a class="btn${l.primary ? " btn--lime" : ""}" href="${attr(l.href)}"${/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)} →</a>`).join("");
  const body = `
<header class="hero" data-darknav>
  <div class="wrap">
    <p class="eyebrow hero__kicker reveal">${esc(r.kicker)}</p>
    <h1 class="reveal">${esc(r.heroTitle)}</h1>
    <p class="hero__dek reveal">${esc(r.dek)}</p>
    <p class="reveal" style="margin-top:1rem"><span class="statuschip live">${esc(r.statusLabel)}</span></p>
    <div class="statbar reveal">${statbar}</div>
  </div>
</header>

<section class="section" id="overview">
  <div class="wrap">
    ${sectionHead("01", "The round")}
    <p class="missionlead reveal" style="max-width:42ch">${esc(r.idea.lede)}</p>
    <div class="prose reveal">${r.idea.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  </div>
</section>

<section class="section section--alt" id="meetups">
  <div class="wrap">
    ${sectionHead("02", "The meetups", r.meetups.lede)}
    ${buildMeetupMap()}
    <div class="projects">${cards}</div>
  </div>
</section>

<section class="section" id="support">
  <div class="wrap">
    ${sectionHead("03", "How the funding works")}
    <ul class="howlist reveal">${how}</ul>
  </div>
</section>

<section class="section section--alt" id="status">
  <div class="wrap">
    ${sectionHead("04", r.status.lede)}
    <div class="prose reveal" style="max-width:62ch"><p>${esc(r.status.body)}</p></div>
    <div class="btnrow reveal" style="margin-top:1.6rem">${links}</div>
  </div>
</section>`;
  return layout({ title: "Round 02 — Local Meetups LATAM · Localism Fund", desc: r.dek, body, navDark: true });
}
function meetupPage(m, i) {
  const all = (fund.round02 && fund.round02.meetups.items) || [];
  const n = String(i + 1).padStart(2, "0");
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const accentVar = "--accent:#4a7339";
  const mini = meetupMiniMap(m);
  const isSeries = (m.cities || "").includes("·");
  const body = `
<header class="phero reveal" style="${accentVar}">
  <div class="wrap">
    <a class="phero__back" href="round-02.html#meetups">← Round 02 · all meetups</a>
    <div class="phero__grid">
      <div>
        <div class="phero__index">${n} / ${all.length}</div>
        <h1>${esc(m.name)}</h1>
        <p class="phero__place">${esc(m.place)}</p>
        <div class="phero__chips"><span class="chip">${esc(m.country)}</span><span class="chip">Round 02 · Local Meetups</span></div>
      </div>
      ${mini ? `<div class="phero__map">${mini}<p class="phero__maploc">${esc(m.cities || m.place)}</p></div>` : ""}
    </div>
  </div>
</header>

<section class="why" style="${accentVar}"><div class="wrap"><p class="why__statement reveal">A grassroots Ethereum meetup${isSeries ? " series" : ""} in ${esc(m.place)} — one of ten communities in Round 02's Local Meetups LATAM, hosting consistent local gatherings for a year following Devconnect 2025.</p></div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  <p class="ghead reveal">The support</p>
  <ul class="howlist reveal">
    <li>$3,000 for twelve months of consistent, content-first meetups — roughly $250–375 per gathering.</li>
    <li>An initial $750 is released once the organiser completes their Post-Approval Form.</li>
    <li>The remaining $2,250 is released quarterly, contingent on activity updates filed via Karma GAP.</li>
  </ul>
</div></section>

<section class="gsec" style="${accentVar}"><div class="wrap">
  <p class="ghead reveal">Status</p>
  <div class="pstatus reveal"><span class="tier" data-tier="Solid">Approved</span><p class="pstatus__desc">Selected in the first wave and onboarding now. Disbursement begins once the Post-Approval Form is complete, then runs quarterly across the twelve-month period. Updates and reports will appear on the Round 02 results portal as the year unfolds.</p></div>
  <div class="sources reveal" style="margin-top:clamp(1.6rem,4vw,2.6rem)">
    ${source("https://www.localism.fund/2cc06d2570f280598c8ad093d9fedc8f", "Round 02 results &amp; reports", "Live tracker on the Localism Fund portal")}
    ${source("https://gov.gitcoin.co/t/localism-fund-initial-progress-reflections-report/24947", "Progress &amp; reflections report", "How Round 02 was designed")}
  </div>
</div></section>

<nav class="pnav">
  <a class="prev" href="${attr(prev.slug)}.html"><div class="dir">← Previous</div><div class="nm">${esc(prev.name)}</div></a>
  <a class="next" href="${attr(next.slug)}.html"><div class="dir">Next →</div><div class="nm">${esc(next.name)}</div></a>
</nav>`;
  return layout({ title: `${m.name} — Round 02 · Localism Fund`, desc: `${m.name}, ${m.place} — a Round 02 Local Meetups LATAM community.`, body, navDark: false, accentVar });
}

/* ---------- emit ---------- */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(ASSETS, path.join(DIST, "assets"));
fs.copyFileSync(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));
fs.copyFileSync(path.join(SRC, "app.js"), path.join(DIST, "app.js"));
fs.writeFileSync(path.join(DIST, "index.html"), landingPage());
fs.writeFileSync(path.join(DIST, "intro.html"), narrativePage());
fs.writeFileSync(path.join(DIST, "round-01.html"), round01Page());
fs.writeFileSync(path.join(DIST, "round-02.html"), round02Page());
((fund.round02 && fund.round02.meetups.items) || []).forEach((m, i) => fs.writeFileSync(path.join(DIST, m.slug + ".html"), meetupPage(m, i)));
fs.writeFileSync(path.join(DIST, "experts.html"), expertsPage());
fs.writeFileSync(path.join(DIST, "operators.html"), operatorsPage());
grantees.forEach((g, i) => fs.writeFileSync(path.join(DIST, g.slug + ".html"), projectPage(g, i)));

console.log(`✓ built ${grantees.length + 6 + ((fund.round02 && fund.round02.meetups.items.length) || 0)} pages -> dist/`);
console.log(`  index · intro · round-01 · round-02 · experts · operators · ${grantees.length} projects`);
