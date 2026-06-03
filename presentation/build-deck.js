const PptxGenJS = require('pptxgenjs');
const pptx = new PptxGenJS();

pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'WIDE';
pptx.author = 'CamChat';
pptx.company = 'CamChat';
pptx.title = 'CamChat — Product & Engineering Overview';

// ---- Palette ----
const C = {
  primary: '1034A6',
  primaryDark: '0A2070',
  primaryLight: '3D5FC4',
  faint: 'EAF0FF',
  bg: 'FFFFFF',
  surface: 'F4F6FC',
  ink: '0D0D0D',
  sub: '5B6472',
  white: 'FFFFFF',
  green: '007A5E',
  red: 'CE1126',
  yellow: 'FCD116',
  teal: '10B981',
};
const FONT = 'Arial';
const W = 13.333, H = 7.5;

// ---- Helpers ----
function footer(slide, n) {
  slide.addText('CamChat', { x: 0.5, y: 7.0, w: 3, h: 0.3, fontFace: FONT, fontSize: 9, color: C.sub, bold: true });
  slide.addText(`${n}`, { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 9, color: C.sub, align: 'right' });
}
function sectionHeader(slide, kicker, title, color) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.45, fill: { color: color || C.primary } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.45, w: W, h: 0.06, fill: { color: C.yellow } });
  slide.addText(kicker.toUpperCase(), { x: 0.6, y: 0.28, w: 10, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: C.yellow, charSpacing: 2 });
  slide.addText(title, { x: 0.6, y: 0.55, w: 12, h: 0.8, fontFace: FONT, fontSize: 30, bold: true, color: C.white });
}
function card(slide, x, y, w, h, fill) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill || C.surface }, line: { color: 'E5E9F5', width: 1 }, shadow: { type: 'outer', color: 'B9C2DA', blur: 6, offset: 2, angle: 90, opacity: 0.35 } });
}
function iconTile(slide, x, y, glyph, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.78, h: 0.78, rectRadius: 0.14, fill: { color: color } });
  slide.addText(glyph, { x, y, w: 0.78, h: 0.78, align: 'center', valign: 'middle', fontSize: 26, color: C.white });
}

// =================== SLIDE 1 — TITLE ===================
let s = pptx.addSlide();
s.background = { color: C.primary };
// layered accents
s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.primary } });
s.addShape(pptx.ShapeType.chevron, { x: 7.6, y: -1.5, w: 8, h: 10.5, fill: { color: C.primaryDark }, rotate: 12 });
s.addShape(pptx.ShapeType.ellipse, { x: 10.4, y: 4.7, w: 4.2, h: 4.2, fill: { color: C.primaryLight, transparency: 55 } });
// flag accent bar
s.addShape(pptx.ShapeType.rect, { x: 0.9, y: 2.0, w: 0.16, h: 1.9, fill: { color: C.green } });
s.addShape(pptx.ShapeType.rect, { x: 1.06, y: 2.0, w: 0.16, h: 1.9, fill: { color: C.red } });
s.addShape(pptx.ShapeType.rect, { x: 1.22, y: 2.0, w: 0.16, h: 1.9, fill: { color: C.yellow } });

s.addText('CamChat', { x: 1.6, y: 2.0, w: 9, h: 1.3, fontFace: FONT, fontSize: 64, bold: true, color: C.white });
s.addText('A WhatsApp-style messenger, built for Cameroon 🇨🇲', { x: 1.62, y: 3.25, w: 10, h: 0.6, fontFace: FONT, fontSize: 22, color: 'D6DEF8' });
s.addText('Real-time chat • Status • Voice & Video calls • Bilingual • Dark mode', { x: 1.62, y: 3.95, w: 11, h: 0.5, fontFace: FONT, fontSize: 14, color: 'AEBDF0' });
s.addText('Product & Engineering Overview', { x: 1.62, y: 5.6, w: 8, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: C.yellow, charSpacing: 2 });
s.addText('React Native · Expo · TypeScript · Firebase · Supabase', { x: 1.62, y: 6.0, w: 10, h: 0.4, fontFace: FONT, fontSize: 12, color: 'AEBDF0' });

// =================== SLIDE 2 — VISION ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'The Vision', 'Familiar UX, rooted in local identity');
s.addText('CamChat is not a clone.', { x: 0.6, y: 1.9, w: 12, h: 0.5, fontFace: FONT, fontSize: 22, bold: true, color: C.primary });
s.addText('It takes the proven, frictionless patterns people already trust — 1-on-1 & group chat, 24-hour status, voice notes, and calls — and grounds them in a distinctly Cameroonian experience.',
  { x: 0.6, y: 2.45, w: 7.4, h: 1.4, fontFace: FONT, fontSize: 15, color: C.sub, lineSpacingMultiple: 1.3 });

const pillars = [
  ['🌍', 'Bilingual by design', 'English & French — Cameroon’s official languages — switchable anytime.'],
  ['🇨🇲', 'Cultural identity', 'Egyptian-Blue brand, +237 default, local touches in copy & onboarding.'],
  ['⚡', 'Built to feel instant', 'Cached-first UI, optimistic navigation, offline-friendly sync.'],
];
pillars.forEach((p, i) => {
  const y = 2.0 + i * 1.55;
  card(s, 8.3, y, 4.4, 1.4);
  iconTile(s, 8.55, y + 0.31, p[0], C.primary);
  s.addText(p[1], { x: 9.45, y: y + 0.2, w: 3.1, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: C.ink });
  s.addText(p[2], { x: 9.45, y: y + 0.6, w: 3.1, h: 0.7, fontFace: FONT, fontSize: 10.5, color: C.sub });
});
footer(s, 2);

// =================== SLIDE 3 — SNAPSHOT ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'At a Glance', 'A complete messaging platform');
const stats = [
  ['1:1 & Group', 'Real-time chat', C.primary],
  ['24 hrs', 'Status / stories', C.green],
  ['Voice + Video', 'In-app calling', C.red],
  ['EN / FR', 'Full bilingual UI', C.primaryLight],
];
stats.forEach((st, i) => {
  const x = 0.6 + i * 3.07;
  card(s, x, 2.1, 2.8, 2.2, C.white);
  s.addShape(pptx.ShapeType.rect, { x: x, y: 2.1, w: 2.8, h: 0.14, fill: { color: st[2] } });
  s.addText(st[0], { x: x, y: 2.7, w: 2.8, h: 0.7, align: 'center', fontFace: FONT, fontSize: 26, bold: true, color: st[2] });
  s.addText(st[1], { x: x, y: 3.5, w: 2.8, h: 0.5, align: 'center', fontFace: FONT, fontSize: 13, color: C.sub });
});
s.addText('Plus: media sharing, voice notes, message reactions & replies, read receipts, typing indicators, QR contact sharing, push notifications, and a full dark mode.',
  { x: 0.6, y: 4.8, w: 12.1, h: 1.0, fontFace: FONT, fontSize: 14, color: C.sub, align: 'center', lineSpacingMultiple: 1.3 });
footer(s, 3);

// =================== SLIDE 4 — FEATURES GRID ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Features', 'What CamChat ships with');
const feats = [
  ['💬', 'Messaging', 'Text, media, voice notes, reactions, replies, stars, delete.'],
  ['👥', 'Groups', 'Create groups, admins, add/remove members, group info.'],
  ['📸', 'Status', 'Text & media stories, 24-hr expiry, viewers, auto-advance.'],
  ['📞', 'Calls', 'Voice & video calling with Agora, full-screen call UI.'],
  ['🔔', 'Notifications', 'Push for messages, calls & status replies via Cloud Functions.'],
  ['🌓', 'Dark mode', 'Runtime light/dark theming across every screen.'],
];
feats.forEach((f, i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = 0.6 + col * 4.13, y = 2.0 + row * 2.35;
  card(s, x, y, 3.85, 2.05, C.white);
  iconTile(s, x + 0.28, y + 0.28, f[0], i % 2 ? C.primaryLight : C.primary);
  s.addText(f[1], { x: x + 1.25, y: y + 0.34, w: 2.4, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: C.ink });
  s.addText(f[2], { x: x + 0.3, y: y + 1.15, w: 3.3, h: 0.8, fontFace: FONT, fontSize: 11.5, color: C.sub, lineSpacingMultiple: 1.2 });
});
footer(s, 4);

// =================== SLIDE 5 — ARCHITECTURE ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Architecture', 'A pragmatic hybrid backend', C.primaryDark);
// client
function box(x, y, w, h, title, sub, fill, tcol) {
  slideBox(s, x, y, w, h, title, sub, fill, tcol);
}
function slideBox(slide, x, y, w, h, title, sub, fill, tcol) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: 'D8DEF0', width: 1 } });
  slide.addText(title, { x, y: y + 0.14, w, h: 0.4, align: 'center', fontFace: FONT, fontSize: 15, bold: true, color: tcol });
  slide.addText(sub, { x: x + 0.15, y: y + 0.58, w: w - 0.3, h: h - 0.6, align: 'center', fontFace: FONT, fontSize: 10, color: tcol === C.white ? 'D9E0F5' : C.sub });
}
slideBox(s, 4.9, 1.95, 3.5, 1.15, 'React Native + Expo', 'TypeScript app · iOS & Android · expo-router', C.primary, C.white);
// three backends
slideBox(s, 0.7, 4.0, 3.7, 1.5, 'Firebase', 'Auth (phone) · Firestore real-time chats, groups, status · Cloud Functions for push', C.surface, C.ink);
slideBox(s, 4.8, 4.0, 3.7, 1.5, 'Supabase Storage', 'Media buckets: avatars, chat-media, voice-notes, statuses (public RLS)', C.surface, C.ink);
slideBox(s, 8.9, 4.0, 3.7, 1.5, 'Agora', 'Real-time voice & video call infrastructure (dev build)', C.surface, C.ink);
// connectors
[[3.0],[6.65],[10.3]].forEach(() => {});
s.addShape(pptx.ShapeType.line, { x: 6.65, y: 3.1, w: 0, h: 0.9, line: { color: C.primaryLight, width: 2 } });
s.addShape(pptx.ShapeType.line, { x: 2.55, y: 3.7, w: 8.2, h: 0, line: { color: C.primaryLight, width: 2, dashType: 'dash' } });
[2.55, 6.65, 10.75].forEach(x => s.addShape(pptx.ShapeType.line, { x, y: 3.7, w: 0, h: 0.3, line: { color: C.primaryLight, width: 2 } }));
s.addText('Messages & presence in Firestore · Heavy media in Supabase · Calls via Agora — each tool used for what it does best.',
  { x: 0.7, y: 5.8, w: 12, h: 0.6, align: 'center', fontFace: FONT, fontSize: 12.5, italic: true, color: C.sub });
footer(s, 5);

// =================== SLIDE 6 — TECH STACK ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Tech Stack', 'Production-grade, type-safe foundation');
const stack = [
  ['Frontend', ['React Native (Expo)', 'TypeScript (strict)', 'expo-router', 'Zustand state', 'expo-image']],
  ['Backend & Data', ['Firebase Auth', 'Cloud Firestore', 'Firebase Cloud Functions', 'Supabase Storage', 'Agora SDK']],
  ['Experience', ['i18n (EN/FR)', 'Runtime dark mode', 'Push notifications', 'Skeleton loading', 'Offline-first cache']],
];
stack.forEach((col, i) => {
  const x = 0.6 + i * 4.13;
  card(s, x, 2.0, 3.85, 4.4, C.white);
  s.addShape(pptx.ShapeType.roundRect, { x: x, y: 2.0, w: 3.85, h: 0.7, rectRadius: 0.1, fill: { color: [C.primary, C.green, C.primaryLight][i] } });
  s.addText(col[0], { x: x, y: 2.0, w: 3.85, h: 0.7, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 16, bold: true, color: C.white });
  col[1].forEach((item, j) => {
    const y = 3.0 + j * 0.66;
    s.addText('▸', { x: x + 0.3, y, w: 0.3, h: 0.4, fontFace: FONT, fontSize: 13, color: [C.primary, C.green, C.primaryLight][i], bold: true });
    s.addText(item, { x: x + 0.6, y, w: 3.0, h: 0.4, fontFace: FONT, fontSize: 13, color: C.ink });
  });
});
footer(s, 6);

// =================== SLIDE 7 — DESIGN SYSTEM ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Design System', 'One source of truth for the UI');
s.addText('Brand palette', { x: 0.6, y: 1.85, w: 6, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: C.ink });
const swatches = [['Egyptian Blue', C.primary], ['Primary Dark', C.primaryDark], ['Primary Light', C.primaryLight], ['Cameroon Green', C.green], ['Cameroon Red', C.red], ['Cameroon Yellow', C.yellow]];
swatches.forEach((sw, i) => {
  const x = 0.6 + (i % 3) * 2.55, y = 2.35 + Math.floor(i / 3) * 1.5;
  s.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.3, h: 1.1, rectRadius: 0.1, fill: { color: sw[1] } });
  s.addText(sw[0], { x, y: y + 0.72, w: 2.3, h: 0.35, align: 'center', fontFace: FONT, fontSize: 10, bold: true, color: sw[1] === C.yellow ? C.ink : C.white });
  s.addText('#' + sw[1], { x, y: y + 0.18, w: 2.3, h: 0.3, align: 'center', fontFace: FONT, fontSize: 9, color: sw[1] === C.yellow ? C.ink : 'D9E0F5' });
});
card(s, 8.5, 2.35, 4.2, 4.0, C.white);
s.addText('Tokens, not hardcodes', { x: 8.75, y: 2.55, w: 3.7, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: C.primary });
[['Typography', 'Inter — 4 weights, fixed scale'], ['Spacing', 'xs → xxxl consistent rhythm'], ['Radius', 'sm / md / lg / full'], ['Theming', 'Light & dark palettes share keys'], ['i18n', 'Every string via t()']].forEach((r, j) => {
  const y = 3.1 + j * 0.62;
  s.addText(r[0], { x: 8.75, y, w: 1.5, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: C.ink });
  s.addText(r[1], { x: 10.2, y, w: 2.4, h: 0.4, fontFace: FONT, fontSize: 10.5, color: C.sub });
});
footer(s, 7);

// =================== SLIDE 8 — DARK MODE ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Dark Mode', 'Runtime theming across every screen', C.primaryDark);
// light mock
s.addShape(pptx.ShapeType.roundRect, { x: 1.6, y: 2.1, w: 3.6, h: 4.4, rectRadius: 0.2, fill: { color: 'FFFFFF' }, line: { color: 'D8DEF0', width: 1.5 } });
s.addShape(pptx.ShapeType.rect, { x: 1.6, y: 2.1, w: 3.6, h: 0.7, fill: { color: C.primary } });
s.addText('Light', { x: 1.6, y: 2.25, w: 3.6, h: 0.4, align: 'center', fontFace: FONT, fontSize: 13, bold: true, color: C.white });
[0,1,2,3].forEach(i => { s.addShape(pptx.ShapeType.roundRect, { x: 1.9, y: 3.1 + i*0.8, w: 3.0, h: 0.6, rectRadius: 0.08, fill: { color: 'F0F2FF' } }); });
// dark mock
s.addShape(pptx.ShapeType.roundRect, { x: 8.1, y: 2.1, w: 3.6, h: 4.4, rectRadius: 0.2, fill: { color: '121218' }, line: { color: '2E2E38', width: 1.5 } });
s.addShape(pptx.ShapeType.rect, { x: 8.1, y: 2.1, w: 3.6, h: 0.7, fill: { color: '5B7CFF' } });
s.addText('Dark', { x: 8.1, y: 2.25, w: 3.6, h: 0.4, align: 'center', fontFace: FONT, fontSize: 13, bold: true, color: C.white });
[0,1,2,3].forEach(i => { s.addShape(pptx.ShapeType.roundRect, { x: 8.4, y: 3.1 + i*0.8, w: 3.0, h: 0.6, rectRadius: 0.08, fill: { color: '26262F' } }); });
// middle note
s.addShape(pptx.ShapeType.ellipse, { x: 6.15, y: 4.0, w: 1.0, h: 1.0, fill: { color: C.yellow } });
s.addText('⟳', { x: 6.15, y: 4.0, w: 1.0, h: 1.0, align: 'center', valign: 'middle', fontSize: 30, bold: true, color: C.primaryDark });
s.addText('A single useColors() hook swaps a shared palette at runtime — one toggle re-themes the whole app.',
  { x: 1.6, y: 6.7, w: 10.1, h: 0.5, align: 'center', fontFace: FONT, fontSize: 12.5, italic: true, color: C.sub });
footer(s, 8);

// =================== SLIDE 9 — ENGINEERING HIGHLIGHTS ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Engineering', 'Hard problems, solved');
const wins = [
  ['🛡️', 'Storage RLS, debugged to root', 'Traced an opaque "schema is invalid" error to a recursive RLS policy & restrictive templates — fixed with SECURITY DEFINER + clean policies.'],
  ['⚡', 'Latency cut from ~30s → ~1s', 'Parallelized Firestore contact lookups and added a persistent participant cache so chats open instantly.'],
  ['🌓', 'App-wide dark mode rollout', 'Migrated ~40 screens/components to a runtime theme — verified with a scripted, batch-committed conversion.'],
  ['🧩', 'Right tool for each job', 'Firestore for live data, Supabase for media, Agora for calls — a clean hybrid that scales.'],
];
wins.forEach((wv, i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 2.0 + Math.floor(i / 2) * 2.3;
  card(s, x, y, 5.85, 2.0, C.white);
  iconTile(s, x + 0.3, y + 0.6, wv[0], i % 2 ? C.green : C.primary);
  s.addText(wv[1], { x: x + 1.3, y: y + 0.25, w: 4.4, h: 0.6, fontFace: FONT, fontSize: 15, bold: true, color: C.primary });
  s.addText(wv[2], { x: x + 1.3, y: y + 0.85, w: 4.4, h: 1.0, fontFace: FONT, fontSize: 11, color: C.sub, lineSpacingMultiple: 1.2 });
});
footer(s, 9);

// =================== SLIDE 10 — BY THE NUMBERS (chart) ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'By the Numbers', 'Scope of the build', C.primaryDark);
// stat tiles
const nums = [['10', 'Build phases'], ['40+', 'Screens & components'], ['2', 'Languages (EN/FR)'], ['4', 'Storage buckets']];
nums.forEach((nv, i) => {
  const x = 0.6 + i * 3.07;
  s.addShape(pptx.ShapeType.roundRect, { x, y: 2.0, w: 2.8, h: 1.5, rectRadius: 0.12, fill: { color: C.faint } });
  s.addText(nv[0], { x, y: 2.15, w: 2.8, h: 0.8, align: 'center', fontFace: FONT, fontSize: 34, bold: true, color: C.primary });
  s.addText(nv[1], { x, y: 2.95, w: 2.8, h: 0.4, align: 'center', fontFace: FONT, fontSize: 12, color: C.sub });
});
// doughnut chart — feature surface composition
s.addText('Surface composition', { x: 0.6, y: 3.9, w: 6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: C.ink });
const dataChartPie = [{ name: 'Modules', labels: ['Chat', 'Status', 'Calls', 'Settings', 'Auth/Onboarding'], values: [38, 18, 16, 18, 10] }];
s.addChart(pptx.ChartType.doughnut, dataChartPie, {
  x: 0.6, y: 4.2, w: 5.6, h: 2.7, holeSize: 58,
  chartColors: [C.primary, C.green, C.red, C.primaryLight, C.yellow],
  showLegend: true, legendPos: 'r', legendFontSize: 11, legendColor: C.ink,
  dataBorder: { pct: 0, color: 'FFFFFF' }, showValue: false,
});
// bar chart — effort by phase area
s.addText('Engineering focus (relative effort)', { x: 7.0, y: 3.9, w: 6, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: C.ink });
const dataBar = [{ name: 'Effort', labels: ['Messaging', 'Calls', 'Status', 'Theming', 'Backend/RLS'], values: [9, 7, 6, 8, 7] }];
s.addChart(pptx.ChartType.bar, dataBar, {
  x: 7.0, y: 4.2, w: 5.7, h: 2.7, barDir: 'bar',
  chartColors: [C.primaryLight], showValue: false,
  catAxisLabelColor: C.ink, catAxisLabelFontSize: 10,
  valAxisHidden: true, valGridLine: { style: 'none' }, showLegend: false,
});
footer(s, 10);

// =================== SLIDE 11 — ROADMAP ===================
s = pptx.addSlide(); s.background = { color: C.bg };
sectionHeader(s, 'Roadmap', 'Where CamChat goes next');
const road = [
  ['Now', 'Shipped', 'Chat, groups, status, calls, dark mode, bilingual UI, push.', C.green],
  ['Next', 'In progress', 'System-theme option, message search, richer status replies.', C.primary],
  ['Later', 'Planned', 'End-to-end encryption, communities, payments (+237), web client.', C.primaryLight],
];
road.forEach((r, i) => {
  const y = 2.1 + i * 1.55;
  s.addShape(pptx.ShapeType.ellipse, { x: 0.85, y: y + 0.25, w: 0.45, h: 0.45, fill: { color: r[3] } });
  if (i < 2) s.addShape(pptx.ShapeType.line, { x: 1.07, y: y + 0.7, w: 0, h: 1.1, line: { color: 'D8DEF0', width: 2 } });
  card(s, 1.7, y, 10.9, 1.3, C.white);
  s.addText(r[0], { x: 1.95, y: y + 0.2, w: 1.6, h: 0.9, fontFace: FONT, fontSize: 22, bold: true, color: r[3] });
  s.addText(r[1].toUpperCase(), { x: 3.7, y: y + 0.22, w: 3, h: 0.35, fontFace: FONT, fontSize: 11, bold: true, color: r[3], charSpacing: 1 });
  s.addText(r[2], { x: 3.7, y: y + 0.6, w: 8.6, h: 0.55, fontFace: FONT, fontSize: 12.5, color: C.sub });
});
footer(s, 11);

// =================== SLIDE 12 — CLOSING ===================
s = pptx.addSlide(); s.background = { color: C.primary };
s.addShape(pptx.ShapeType.chevron, { x: -3, y: -1.5, w: 8, h: 10.5, fill: { color: C.primaryDark }, rotate: 8 });
s.addShape(pptx.ShapeType.ellipse, { x: -1.2, y: 4.6, w: 4, h: 4, fill: { color: C.primaryLight, transparency: 60 } });
s.addText('Thank you', { x: 1.0, y: 2.5, w: 11, h: 1.2, fontFace: FONT, fontSize: 56, bold: true, color: C.white });
s.addText('CamChat — chat like you’re home. 🇨🇲', { x: 1.05, y: 3.7, w: 11, h: 0.6, fontFace: FONT, fontSize: 22, color: 'D6DEF8' });
s.addShape(pptx.ShapeType.rect, { x: 1.05, y: 4.7, w: 2.2, h: 0.08, fill: { color: C.yellow } });
s.addText('Built with React Native · Expo · TypeScript · Firebase · Supabase · Agora',
  { x: 1.05, y: 5.0, w: 11, h: 0.5, fontFace: FONT, fontSize: 13, color: 'AEBDF0' });

pptx.writeFile({ fileName: '/home/daytona/project/CamChat_Presentation.pptx' }).then(f => {
  console.log('WROTE', f);
}).catch(e => { console.error('ERR', e); process.exit(1); });
