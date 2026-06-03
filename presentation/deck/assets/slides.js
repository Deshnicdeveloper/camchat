/* ===================================================================
   CamChat deck — slide content (injected into .reveal .slides)
   Faithful to SOFTWARE_REQUIREMENTS_SPECIFICATION_v2 (SRS)
   Icons only (no emoji).
   =================================================================== */
const SHOTS = 'assets/shots/';
const ic   = (id) => `<svg class="ic"><use href="#i-${id}"/></svg>`;
const chip = (id, cls='') => `<span class="chip ${cls}"><svg><use href="#i-${id}"/></svg></span>`;
const brand = `<div class="brandmark"><span class="dot"><svg><use href="#i-message"/></svg></span>CAMCHAT · SRS v1.0</div>`;

/* small helper for a labelled phone mockup */
const phone = (file, cap, cls='') =>
  `<figure class="phone ${cls}"><img src="${SHOTS}${file}" alt="${cap}"><span class="glare"></span>
   <figcaption class="phone-cap">${cap}</figcaption></figure>`;

/* ---- header block for content slides ---- */
const head = (kick, title, sub='') => `
  <div class="kicker">${kick}</div>
  <h2 data-anim="up">${title}</h2>
  <div class="accent-bar" data-anim="left"></div>
  ${sub?`<p class="lead" data-anim="up">${sub}</p>`:''}`;

const SLIDES = [];

/* ============================== 1 · TITLE ============================== */
SLIDES.push(`
<section data-background-gradient="linear-gradient(150deg,#0C2F52,#0A1E33 55%,#081627)">
  <div class="blob" style="width:360px;height:360px;right:6%;top:8%;background:radial-gradient(circle,#2E6FC7,transparent 70%)"></div>
  <div class="blob" style="width:240px;height:240px;left:4%;bottom:6%;background:radial-gradient(circle,#0F9D58,transparent 70%);animation-delay:1.4s"></div>
  <div class="wrap" style="flex-direction:row;align-items:center;gap:40px;">
    <div style="flex:1.25;">
      <div class="kicker" data-anim="left">Software Requirements Specification · v1.0</div>
      <h1 data-anim="up" style="font-size:3.4em;background:linear-gradient(120deg,#fff,#7FB2F0);-webkit-background-clip:text;background-clip:text;color:transparent;">CamChat</h1>
      <div class="accent-bar" data-anim="left" style="width:150px;height:6px;"></div>
      <p data-anim="up" class="d1" style="font-size:.84em;color:#DCE8F8;max-width:15em;line-height:1.35;">
        A real-time mobile messaging <strong>system</strong>, engineered for Cameroon.</p>
      <div class="tags" data-anim="up" style="margin-top:22px;max-width:24em;">
        <span class="tag">${ic('message')} Real-time chat</span>
        <span class="tag">${ic('status')} 24h Status</span>
        <span class="tag">${ic('phone')} Voice &amp; Video</span>
        <span class="tag">${ic('globe')} Bilingual EN/FR</span>
        <span class="tag">${ic('moon')} Dark mode</span>
      </div>
      <p data-anim="fade" class="d4 tiny" style="margin-top:30px;line-height:1.7;">
        Mobile Application Development · Institut Universitaire des Grandes Écoles des Tropiques (IUGET)<br>
        Instructor: Mr. Smith Wills · Academic Year 2025/2026<br>
        React Native · Expo · TypeScript · Firebase · Supabase · Agora
      </p>
    </div>
    <div style="flex:.85;display:flex;justify-content:center;">
      <div class="float" style="width:280px;">${phone('IMG_0186.jpg','Chat list')}</div>
    </div>
  </div>
</section>`);

/* ============================== 2 · AGENDA ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Contents','What this presentation covers',
    'A complete walk-through of the CamChat <strong>system</strong> as defined by its SRS — from architecture and actors to functional, interface and non-functional requirements.')}
  <div class="grid g3" style="margin-top:18px;">
    ${[
      ['layers','System Architecture','BaaS perspective &amp; components'],
      ['users','Actors &amp; Use Cases','User classes and interactions'],
      ['grid','Functional Requirements','10 modules · 70+ requirements'],
      ['code','Class &amp; Data Model','UML classes &amp; Firestore design'],
      ['server','Interface Requirements','Hardware · software · comms'],
      ['gauge','Non-Functional Reqs','Performance · security · UX'],
    ].map((c,i)=>`
      <div class="card lift" data-anim="up" style="display:flex;gap:16px;align-items:center;" >
        ${chip(c[0], i%2?'':'')}
        <div><div class="ct">${c[1]}</div><div class="cd">${c[2]}</div></div>
      </div>`).join('')}
  </div>
  ${brand}
</div></section>`);

/* ============================== 3 · INTRODUCTION ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 1 · Introduction','Purpose &amp; product scope')}
  <div class="grid g2" style="margin-top:6px;grid-template-columns:1.05fr .95fr;align-items:start;">
    <div class="col" style="gap:16px;">
      <ul class="flist" data-anim="up">
        <li>${ic('check2')}<span>Defines the <b>complete requirements</b> for CamChat — functionality, interfaces, constraints and quality attributes.</span></li>
        <li>${ic('check2')}<span>A cross-platform app delivering <b>text, multimedia, voice notes, voice &amp; video calls</b> and <b>24-hour status</b>.</span></li>
        <li>${ic('check2')}<span>Built on a <b>Backend-as-a-Service</b> architecture: Firebase, Supabase and Agora.</span></li>
        <li>${ic('check2')}<span>Follows <b>IEEE Std 830-1998</b> and <b>ISO/IEC/IEEE 29148:2018</b>.</span></li>
      </ul>
    </div>
    <div class="card" data-anim="right" style="align-self:stretch;">
      <div class="ct" style="font-size:.6em;display:flex;align-items:center;gap:10px;">${ic('flag')} Localized for Cameroon</div>
      <div class="grid g2" style="margin-top:14px;gap:14px;">
        ${[
          ['phone','+237 default','Country code pre-selected'],
          ['globe','English &amp; French','Full bilingual interface'],
          ['eye','Local identity','Cameroonian onboarding &amp; branding'],
          ['user','Globally usable','Accessible beyond Cameroon'],
        ].map(c=>`<div style="display:flex;gap:12px;align-items:flex-start;">
          ${chip(c[0],'sm green')}<div><div style="font-size:.46em;color:#fff;font-weight:700">${c[1]}</div>
          <div style="font-size:.36em;color:#AFC2DC">${c[2]}</div></div></div>`).join('')}
      </div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 4 · ARCHITECTURE (SYSTEM) ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 2 · Product Perspective','System architecture — a Backend-as-a-Service design',
    'A single React Native client communicates directly with managed cloud services — each chosen for what it does best.')}
  <div style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:4px;">
  <svg viewBox="0 0 1080 430" style="width:100%;max-height:430px;" data-anim="fade">
    <defs>
      <linearGradient id="gClient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2E6FC7"/><stop offset="1" stop-color="#1F4E79"/></linearGradient>
      <linearGradient id="gNode" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#13314f"/><stop offset="1" stop-color="#0e2740"/></linearGradient>
    </defs>
    <!-- client -->
    <g>
      <rect x="410" y="20" width="260" height="92" rx="18" fill="url(#gClient)" stroke="#7FB2F0" stroke-opacity=".5"/>
      <text x="540" y="55" text-anchor="middle" fill="#fff" font-size="22" font-weight="700">Mobile Client</text>
      <text x="540" y="82" text-anchor="middle" fill="#CFE0F6" font-size="14">React Native · Expo · TypeScript</text>
    </g>
    <!-- connectors -->
    ${[[170,'#2E6FC7'],[400,'#16b06a'],[680,'#f0533f'],[910,'#FFC629']].map((c)=>`
      <path class="draw" style="--len:240" d="M540 112 V160 H${c[0]} V250" fill="none" stroke="${c[1]}" stroke-opacity=".55" stroke-width="2.5"/>
      <path class="flow" d="M540 112 V160 H${c[0]} V250" fill="none" stroke="${c[1]}" stroke-width="2.5" stroke-opacity=".9"/>
      <circle class="pulse" cx="${c[0]}" cy="250" r="4" fill="${c[1]}"/>`).join('')}
    <!-- service nodes -->
    ${[
      [60,'Firebase','Auth · Firestore · FCM','i-database'],
      [290,'Cloud Firestore','Real-time chat &amp; presence','i-bolt'],
      [570,'Supabase Storage','Media · voice notes · status','i-cloud'],
      [800,'Agora RTC','Voice &amp; video channels','i-video'],
    ].map((n,i)=>`
      <g>
        <rect x="${n[0]}" y="250" width="220" height="118" rx="16" fill="url(#gNode)" stroke="#7FB2F0" stroke-opacity=".28"/>
        <rect x="${n[0]}" y="250" width="220" height="4" rx="2" fill="${['#2E6FC7','#16b06a','#f0533f','#FFC629'][i]}"/>
        <text x="${n[0]+20}" y="294" fill="#fff" font-size="17" font-weight="700">${n[1]}</text>
        <text x="${n[0]+20}" y="320" fill="#AFC2DC" font-size="12.5">${n[2]}</text>
      </g>`).join('')}
    <text x="540" y="405" text-anchor="middle" fill="#8FA6C6" font-size="13" font-style="italic">
      HTTPS (TLS 1.2+) · Firestore WebSocket listeners · Agora UDP/RTP · FCM / APNs push</text>
  </svg>
  </div>
  ${brand}
</div></section>`);

/* ============================== 5 · USER CLASSES ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 2 · User Classes','Who interacts with the system')}
  <div class="grid g4" style="margin-top:14px;">
    ${[
      ['user','Unregistered User','Has installed the app but not registered. Sees onboarding and enters a phone number.','Onboarding only','blue'],
      ['user','Registered User','Completed phone verification &amp; profile setup. Uses all communication features.','Full app access','green'],
      ['shield','Group Administrator','A registered user with elevated rights inside a specific group conversation.','+ Group management','gold'],
      ['server','System Services','External cloud services — Firebase, Supabase, Agora, FCM — interacting programmatically.','Service-level API','red'],
    ].map((c,i)=>`
      <div class="card lift" data-anim="up" style="display:flex;flex-direction:column;gap:12px;">
        <div class="topbar" style="background:${['#2E6FC7','#16b06a','#FFC629','#f0533f'][i]}"></div>
        ${chip(c[0],c[4])}
        <div class="ct">${c[1]}</div>
        <div class="cd" style="flex:1">${c[2]}</div>
        <div class="tag" style="align-self:flex-start">${ic('key')} ${c[3]}</div>
      </div>`).join('')}
  </div>
  ${brand}
</div></section>`);

/* ============================== 6 · USE CASE DIAGRAM ============================== */
function actor(x,y,label,color='#7FB2F0'){
  return `<g class="uc-actor">
    <circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${color}" stroke-width="2.4"/>
    <line x1="${x}" y1="${y+11}" x2="${x}" y2="${y+42}" stroke="${color}" stroke-width="2.4"/>
    <line x1="${x-16}" y1="${y+22}" x2="${x+16}" y2="${y+22}" stroke="${color}" stroke-width="2.4"/>
    <line x1="${x}" y1="${y+42}" x2="${x-14}" y2="${y+66}" stroke="${color}" stroke-width="2.4"/>
    <line x1="${x}" y1="${y+42}" x2="${x+14}" y2="${y+66}" stroke="${color}" stroke-width="2.4"/>
    <text x="${x}" y="${y+86}" text-anchor="middle" fill="#D2E0F2" font-size="13" font-weight="700">${label}</text>
  </g>`;
}
function uc(x,y,label){
  return `<g><ellipse cx="${x}" cy="${y}" rx="92" ry="27" fill="#13314f" stroke="#2E6FC7" stroke-opacity=".6" stroke-width="1.6"/>
    <text x="${x}" y="${y+4}" text-anchor="middle" fill="#E8F0FB" font-size="12.5" font-weight="600">${label}</text></g>`;
}
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 6 · Use Case Diagram','How actors interact with CamChat')}
  <div style="flex:1;display:flex;align-items:center;justify-content:center;">
  <svg viewBox="0 0 1120 470" style="width:100%;max-height:440px;" data-anim="fade">
    <!-- system boundary -->
    <rect x="290" y="20" width="540" height="430" rx="20" fill="rgba(46,111,199,.05)" stroke="#7FB2F0" stroke-opacity=".4" stroke-dasharray="6 6"/>
    <text x="560" y="46" text-anchor="middle" fill="#7FB2F0" font-size="15" font-weight="800" letter-spacing="2">CAMCHAT SYSTEM</text>
    <!-- connector lines (drawn) -->
    <g stroke-opacity=".5" stroke-width="1.6" fill="none">
      <path class="draw" style="--len:300" d="M150 150 L468 95"  stroke="#2E6FC7"/>
      <path class="draw" style="--len:300" d="M150 250 L468 95"  stroke="#16b06a"/>
      <path class="draw" style="--len:300" d="M150 250 L468 165" stroke="#16b06a"/>
      <path class="draw" style="--len:300" d="M150 250 L468 235" stroke="#16b06a"/>
      <path class="draw" style="--len:300" d="M150 250 L468 305" stroke="#16b06a"/>
      <path class="draw" style="--len:300" d="M150 250 L468 375" stroke="#16b06a"/>
      <path class="draw" style="--len:300" d="M150 360 L652 305" stroke="#FFC629"/>
      <path class="draw" style="--len:300" d="M970 230 L652 165" stroke="#f0533f"/>
      <path class="draw" style="--len:300" d="M970 230 L652 235" stroke="#f0533f"/>
      <path class="draw" style="--len:300" d="M970 230 L652 375" stroke="#f0533f"/>
    </g>
    <!-- use cases (2 columns) -->
    ${uc(468,95,'Register &amp; Verify')}
    ${uc(468,165,'Messaging &amp; Media')}
    ${uc(468,235,'Voice Notes')}
    ${uc(468,305,'Manage Groups')}
    ${uc(468,375,'Manage Profile')}
    ${uc(652,95,'Sync Contacts')}
    ${uc(652,165,'Status / Stories')}
    ${uc(652,235,'Voice &amp; Video Call')}
    ${uc(652,305,'Settings &amp; QR')}
    ${uc(652,375,'Notifications')}
    <!-- actors -->
    ${actor(150,110,'Unregistered','#7FB2F0')}
    ${actor(150,210,'Registered User','#16b06a')}
    ${actor(150,320,'Group Admin','#FFC629')}
    ${actor(970,190,'System Services','#f0533f')}
  </svg>
  </div>
  ${brand}
</div></section>`);

/* ============================== 7 · FUNCTIONAL REQUIREMENTS OVERVIEW ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3 · Functional Requirements','Ten modules, seventy-plus requirements')}
  <div class="grid g4" style="margin-top:8px;gap:16px;">
    ${[
      ['key','Authentication','FR-1 · 21','blue'],
      ['users','Chat &amp; Contacts','FR-2 · 17','green'],
      ['message','Messaging','FR-3 · 24','blue'],
      ['mic','Voice Notes','FR-4 · 7','red'],
      ['shield','Group Chat','FR-5 · 12','gold'],
      ['status','Status / Stories','FR-6 · 8','green'],
      ['phone','Voice &amp; Video','FR-7 · 13','red'],
      ['bell','Notifications','FR-8 · 6','blue'],
      ['settings','Settings &amp; i18n','FR-9 · 6','gold'],
      ['cloud','Media Storage','FR-10 · 6','green'],
    ].map((c)=>`
      <div class="card lift" data-anim="pop" style="display:flex;gap:14px;align-items:center;padding:16px 16px;">
        ${chip(c[0],'sm '+c[3])}
        <div><div style="font-size:.46em;color:#fff;font-weight:700">${c[1]}</div>
        <div style="font-size:.34em;color:var(--mut);letter-spacing:.04em;margin-top:.2em">${c[2]} requirements</div></div>
      </div>`).join('')}
  </div>
  ${brand}
</div></section>`);

/* ============================== 8 · AUTHENTICATION ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3.1 · Authentication','Phone &amp; OTP — onboarding to first message')}
  <div class="row" style="margin-top:6px;gap:36px;align-items:center;flex:1;">
    <div style="display:flex;gap:22px;flex:none;">
      <div class="float" style="width:212px;">${phone('IMG_0175.jpg','Onboarding')}</div>
      <div class="float d1" style="width:212px;margin-top:26px;">${phone('IMG_0176.jpg','Get started')}</div>
    </div>
    <div class="col spread" style="gap:6px;">
      <div class="steps">
        ${[
          ['Enter phone number','Country selector defaults to <b>+237</b>; validated against <b>E.164</b>.'],
          ['Verify with OTP','One-time password via Firebase Auth; resend cooldown &amp; 10-minute expiry.'],
          ['Set up profile','Display name, avatar and optional About — editable anytime.'],
          ['Persistent session','Stays authenticated across restarts; logout clears the local session.'],
        ].map(s=>`<div class="step" data-anim="left"><div class="n"></div>
          <div><div class="stt">${s[0]}</div><div class="std">${s[1]}</div></div></div>`).join('')}
      </div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 9 · MESSAGING ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3.3 &amp; 3.4 · Messaging','Rich, real-time conversations')}
  <div class="row" style="margin-top:6px;gap:34px;flex:1;align-items:center;">
    <div class="col spread" style="gap:18px;">
      <div class="grid g2" style="gap:16px;">
        ${[
          ['message','Text &amp; media','Text, images, video, documents &amp; live location.'],
          ['mic','Voice notes','Record, cancel, send; waveform playback &amp; local cache.'],
          ['check2','Receipts','Sending · Sent · Delivered · Read, with timestamps.'],
          ['status','Interactions','Reply, emoji reactions, star &amp; delete; typing indicator.'],
        ].map(c=>`<div class="card lift" data-anim="up" style="display:flex;gap:14px;align-items:flex-start;">
          ${chip(c[0],'sm')}<div><div class="ct" style="font-size:.5em">${c[1]}</div>
          <div class="cd">${c[2]}</div></div></div>`).join('')}
      </div>
      <p class="tiny" data-anim="fade">All media is uploaded to Supabase Storage; the URL is stored in Firestore and streamed back on demand.</p>
    </div>
    <div style="display:flex;gap:20px;flex:none;">
      <div class="float" style="width:208px;">${phone('IMG_0185.jpg','Chat — light')}</div>
      <div class="float d1" style="width:208px;margin-top:24px;">${phone('IMG_0179.jpg','Chat — dark')}</div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 10 · GROUPS & STATUS ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3.5 &amp; 3.6 · Groups &amp; Status','Communities and 24-hour stories')}
  <div class="row" style="margin-top:6px;gap:34px;flex:1;align-items:center;">
    <div style="display:flex;gap:20px;flex:none;">
      <div class="float" style="width:208px;">${phone('IMG_0180.jpg','Status list')}</div>
      <div class="float d1" style="width:208px;margin-top:24px;">${phone('IMG_0181.jpg','Story viewer')}</div>
    </div>
    <div class="col spread" style="gap:18px;">
      <div class="card" data-anim="right">
        <div class="ct" style="font-size:.54em;display:flex;align-items:center;gap:10px">${ic('shield')} Group chat management</div>
        <ul class="flist" style="margin-top:12px;">
          <li>${ic('check2')}<span>Create groups with name, image &amp; initial members; creator becomes <b>admin</b>.</span></li>
          <li>${ic('check2')}<span>Admins add / remove members, promote or revoke admin rights, edit group info.</span></li>
          <li>${ic('check2')}<span>Any member can view group info and leave at any time.</span></li>
        </ul>
      </div>
      <div class="card" data-anim="right">
        <div class="ct" style="font-size:.54em;display:flex;align-items:center;gap:10px">${ic('status')} Status &amp; stories</div>
        <ul class="flist" style="margin-top:12px;">
          <li>${ic('check2')}<span>Text, image &amp; video statuses; viewed / unviewed rings &amp; <b>viewer tracking</b>.</span></li>
          <li>${ic('check2')}<span>Auto-expire after <b>24 hours</b>; creators may delete early.</span></li>
        </ul>
      </div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 11 · CALLS ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3.7 · Voice &amp; Video Calling','Real-time communication via Agora RTC')}
  <div class="row" style="margin-top:6px;gap:34px;flex:1;align-items:center;">
    <div class="col spread" style="gap:18px;">
      <div class="grid g2" style="gap:16px;">
        ${[
          ['phone','Initiate &amp; receive','Voice or video calls from chat or contacts; accept / decline screen.'],
          ['video','In-call controls','Mute, speaker, camera toggle &amp; front/rear switch.'],
          ['bolt','Agora channels','Streams established within 10 s; bitrate adapts to bandwidth.'],
          ['refresh','Call history','Type, direction &amp; duration logged; one-tap return call.'],
        ].map(c=>`<div class="card lift" data-anim="up" style="display:flex;gap:14px;align-items:flex-start;">
          ${chip(c[0],'sm red')}<div><div class="ct" style="font-size:.5em">${c[1]}</div>
          <div class="cd">${c[2]}</div></div></div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:20px;flex:none;">
      <div class="float" style="width:208px;">${phone('IMG_0178.jpg','Active call')}</div>
      <div class="float d1" style="width:208px;margin-top:24px;">${phone('IMG_0182.jpg','Call history')}</div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 12 · SETTINGS / I18N / DARK ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 3.9 · Settings, Localization &amp; Dark Mode','Personalization across the system')}
  <div class="row" style="margin-top:6px;gap:34px;flex:1;align-items:center;">
    <div style="display:flex;gap:20px;flex:none;">
      <div class="float" style="width:208px;">${phone('IMG_0183.jpg','Settings · dark')}</div>
      <div class="float d1" style="width:208px;margin-top:24px;">${phone('IMG_0186.jpg','Chat list · light')}</div>
    </div>
    <div class="col spread" style="gap:16px;">
      <ul class="flist" data-anim="right">
        <li>${ic('user')}<span>Edit <b>display name, avatar &amp; About</b> from a single Settings hub.</span></li>
        <li>${ic('globe')}<span><b>English / French</b> switch applies <b>instantly</b> — no restart (centralized i18n).</span></li>
        <li>${ic('moon')}<span>Runtime <b>dark mode</b> re-themes every screen from shared design tokens.</span></li>
        <li>${ic('qr')}<span>Generate &amp; scan a personal <b>QR code</b> to add contacts.</span></li>
      </ul>
      <div class="row" style="gap:14px;">
        <div class="tag">${ic('layers')} Centralized design tokens</div>
        <div class="tag">${ic('check2')} WCAG 2.1 AA contrast</div>
      </div>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 13 · CLASS DIAGRAM ============================== */
function umlBox(x,y,w,name,attrs,color='#2E6FC7'){
  const lh=18, headH=34, bodyH=attrs.length*lh+16, h=headH+bodyH;
  const rows = attrs.map((a,i)=>`<text class="uml-attr" x="${x+12}" y="${y+headH+18+i*lh}">${a}</text>`).join('');
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#0e2740" stroke="${color}" stroke-opacity=".7" stroke-width="1.8"/>
    <rect x="${x}" y="${y}" width="${w}" height="${headH}" rx="10" fill="${color}" fill-opacity=".22"/>
    <rect x="${x}" y="${y+headH-2}" width="${w}" height="2" fill="${color}" fill-opacity=".7"/>
    <text class="uml-name" x="${x+w/2}" y="${y+22}" text-anchor="middle">${name}</text>
    ${rows}
  </g>`;
}
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 6 · Class Diagram','Domain model derived from the data design')}
  <div style="flex:1;display:flex;align-items:center;justify-content:center;">
  <svg viewBox="0 0 1120 470" style="width:100%;max-height:445px;" data-anim="fade">
    <!-- relationship lines -->
    <g fill="none" stroke-width="1.8" stroke-opacity=".7">
      <path class="draw" style="--len:260" d="M250 120 H360" stroke="#7FB2F0"/>
      <path class="draw" style="--len:260" d="M600 120 H720" stroke="#7FB2F0"/>
      <path class="draw" style="--len:260" d="M250 150 C300 250 760 250 840 200" stroke="#16b06a"/>
      <path class="draw" style="--len:260" d="M470 200 V300" stroke="#FFC629"/>
      <path class="draw" style="--len:260" d="M150 200 V330" stroke="#f0533f"/>
      <path class="draw" style="--len:260" d="M250 175 C420 360 700 360 840 360" stroke="#f0533f"/>
    </g>
    <!-- multiplicity / labels -->
    <g fill="#9DB2CE" font-size="11" font-weight="700">
      <text x="262" y="112">1</text><text x="342" y="112">*</text>
      <text x="608" y="112">1</text><text x="704" y="112">*</text>
      <text x="305" y="240">1</text><text x="300" y="135">sends</text>
      <text x="478" y="255">1..*</text><text x="430" y="255">members</text>
      <text x="118" y="320">1</text><text x="78" y="290">posts</text>
      <text x="500" y="350">participants</text>
    </g>
    <!-- generalization: Group --|> Chat (hollow triangle near Chat) -->
    <path d="M460 200 V175 H470" fill="none" stroke="#FFC629" stroke-width="1.8" stroke-opacity=".7" class="draw" style="--len:120"/>
    ${umlBox(40,60,210,'User',['- uid: string','- displayName: string','- phoneNumber: E164','- photoURL: string','- about: string','- language: EN | FR','- onlineStatus: bool','+ updateProfile()'],'#2E6FC7')}
    ${umlBox(360,60,240,'Chat',['- chatId: string','- participants: User[*]','- lastMessage: Message','- unreadCounts: map','+ archive() / mute()'],'#7FB2F0')}
    ${umlBox(720,60,360,'Message',['- messageId: string','- senderId: User','- type: text|image|video|doc|audio','- content / mediaUrl: string','- status: sending..read','- reactions / replyTo / isStarred','+ react() / star() / delete()'],'#16b06a')}
    ${umlBox(360,210,240,'Group',['- groupId: string','- name / photoURL','- adminIds: User[*]','- memberIds: User[*]','+ addMember() / setAdmin()'],'#FFC629')}
    ${umlBox(40,330,250,'Status',['- statusId: string','- type: text|image|video','- mediaUrl / content','- expiresAt: createdAt+24h','- viewedBy: User[*]'],'#f0533f')}
    ${umlBox(840,330,240,'Call',['- callId: string','- type: voice | video','- direction / status','- startedAt / duration'],'#f0533f')}
  </svg>
  </div>
  <div class="legend" data-anim="fade" style="position:absolute;right:78px;bottom:30px;">
    <span><i style="background:#7FB2F0"></i>association</span>
    <span><i style="background:#FFC629"></i>generalization (Group → Chat)</span>
    <span><i style="background:#16b06a"></i>composition</span>
  </div>
  ${brand}
</div></section>`);

/* ============================== 14 · FIRESTORE DATA MODEL ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 6.3 · Firestore Data Model','Six collections, secured by rules')}
  <div class="card" data-anim="up" style="margin-top:6px;padding:8px 10px;">
  <table class="tbl">
    <thead><tr><th>Collection</th><th>Document ID</th><th>Key fields</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><code>users</code></td><td>uid</td><td>displayName, phoneNumber, photoURL, about, language, onlineStatus, lastSeen, fcmToken</td><td>Created after OTP</td></tr>
      <tr><td><code>chats</code></td><td>chatId</td><td>participants[], lastMessage{}, lastMessageAt, unreadCounts{}</td><td>Direct &amp; group</td></tr>
      <tr><td><code>chats/{id}/messages</code></td><td>messageId</td><td>senderId, type, content, mediaUrl, timestamp, status, reactions{}, replyTo, isStarred, isDeleted</td><td>Subcollection</td></tr>
      <tr><td><code>groups</code></td><td>groupId</td><td>name, photoURL, adminIds[], memberIds[], createdAt, createdBy</td><td>Group metadata</td></tr>
      <tr><td><code>statuses</code></td><td>statusId</td><td>userId, type, content, mediaUrl, createdAt, expiresAt, viewedBy[]</td><td>Expires +24h</td></tr>
      <tr><td><code>calls</code></td><td>callId</td><td>callerId, receiverId, type, status, startedAt, endedAt, duration</td><td>Logged on end</td></tr>
    </tbody>
  </table>
  </div>
  ${brand}
</div></section>`);

/* ============================== 15 · EXTERNAL INTERFACES ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 4 · External Interface Requirements','Hardware, software &amp; communication')}
  <div class="grid g3" style="margin-top:8px;align-items:start;">
    <div class="card" data-anim="up">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('camera')} Hardware</div>
      <ul class="flist" style="margin-top:12px;">
        <li>${ic('check2')}<span><b>Camera</b> — photos, video, calls, QR</span></li>
        <li>${ic('check2')}<span><b>Microphone</b> — voice notes &amp; calls</span></li>
        <li>${ic('check2')}<span><b>GPS</b> — location messages</span></li>
        <li>${ic('check2')}<span><b>Contacts</b> — user discovery</span></li>
      </ul>
    </div>
    <div class="card" data-anim="up" class="d1">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('server')} Software</div>
      <ul class="flist" style="margin-top:12px;">
        <li>${ic('check2')}<span><b>Firebase Auth</b> — phone OTP &amp; sessions</span></li>
        <li>${ic('check2')}<span><b>Cloud Firestore</b> — real-time data</span></li>
        <li>${ic('check2')}<span><b>Supabase</b> — media storage</span></li>
        <li>${ic('check2')}<span><b>Agora · FCM · Expo</b> — calls, push, device</span></li>
      </ul>
    </div>
    <div class="card" data-anim="up" class="d2">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('globe')} Communication</div>
      <ul class="flist" style="margin-top:12px;">
        <li>${ic('lock')}<span><b>HTTPS / TLS 1.2+</b> — API &amp; media</span></li>
        <li>${ic('bolt')}<span><b>Firestore WebSockets</b> — live sync</span></li>
        <li>${ic('video')}<span><b>Agora UDP/RTP</b> — call streams</span></li>
        <li>${ic('bell')}<span><b>FCM / APNs</b> — push delivery</span></li>
      </ul>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 16 · NON-FUNCTIONAL (metrics) ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 5 · Non-Functional Requirements','Performance, security &amp; experience targets')}
  <div class="grid g4" style="margin-top:6px;">
    ${[
      ['1','s','Text message delivery','#2E6FC7'],
      ['3','s','Splash screen on launch','#16b06a'],
      ['10','s','Call connection','#f0533f'],
      ['30','','Messages per initial page','#FFC629'],
    ].map(s=>`<div class="stat" data-anim="pop"><div class="num"><span class="count" data-to="${s[0]}">0</span>${s[1]?`<span style="font-size:.4em;font-weight:700">${s[1]}</span>`:''}</div><div class="lab">${s[2]}</div></div>`).join('')}
  </div>
  <div class="grid g3" style="margin-top:22px;align-items:start;">
    <div class="card" data-anim="up">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('shield')} Security</div>
      <ul class="flist" style="margin-top:10px;">
        <li>${ic('lock')}<span>OTP auth before any protected resource</span></li>
        <li>${ic('lock')}<span>Firestore rules &amp; Supabase policies enforce access</span></li>
        <li>${ic('lock')}<span>TLS 1.2+ in transit; conversation data is participant-only</span></li>
      </ul>
    </div>
    <div class="card" data-anim="up" class="d1">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('gauge')} Usability</div>
      <ul class="flist" style="margin-top:10px;">
        <li>${ic('check2')}<span>Register → first message in &lt; 5 minutes</span></li>
        <li>${ic('check2')}<span>Core actions in ≤ 2 taps; 44×44 touch targets</span></li>
        <li>${ic('check2')}<span>Instant EN/FR switch; WCAG 2.1 AA contrast</span></li>
      </ul>
    </div>
    <div class="card" data-anim="up" class="d2">
      <div class="ct" style="display:flex;align-items:center;gap:10px">${ic('refresh')} Reliability &amp; scale</div>
      <ul class="flist" style="margin-top:10px;">
        <li>${ic('check2')}<span>Auto-reconnect &amp; retry of failed messages</span></li>
        <li>${ic('check2')}<span>Indexed, paginated queries scale with data</span></li>
        <li>${ic('check2')}<span>TypeScript strict · ESLint · feature-based modules</span></li>
      </ul>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 17 · TECH STACK ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Implementation','A production-grade, type-safe foundation')}
  <div class="grid g3" style="margin-top:10px;align-items:start;">
    ${[
      ['Frontend','#2E6FC7','code',['React Native (Expo)','TypeScript — strict mode','expo-router navigation','Zustand state','expo-image rendering']],
      ['Backend &amp; data','#16b06a','database',['Firebase Authentication','Cloud Firestore','Cloud Functions (FCM)','Supabase Storage','Agora RTC SDK']],
      ['Experience','#FFC629','status',['i18n — English / French','Runtime dark mode','Push notifications','Skeleton loading states','Offline-first caching']],
    ].map((c,i)=>`
      <div class="card" data-anim="up">
        <div style="height:6px;border-radius:6px;background:${c[1]};margin:-4px 0 14px"></div>
        <div class="ct" style="display:flex;align-items:center;gap:10px;font-size:.6em">${ic(c[2])} ${c[0]}</div>
        <ul class="flist" style="margin-top:14px;">
          ${c[3].map(x=>`<li>${ic('check2')}<span>${x}</span></li>`).join('')}
        </ul>
      </div>`).join('')}
  </div>
  ${brand}
</div></section>`);

/* ============================== 18 · BRAND / PALETTE ============================== */
SLIDES.push(`
<section><div class="wrap">
  ${head('Chapter 5.8 · Design Requirements','One visual language, two themes')}
  <div class="grid g2" style="margin-top:6px;grid-template-columns:1.1fr .9fr;align-items:start;">
    <div>
      <div class="grid g3" data-anim="up" style="gap:14px;">
        <div class="sw" style="background:#1F4E79">Egyptian Blue<small>#1F4E79 · brand</small></div>
        <div class="sw" style="background:#2E6FC7">Primary<small>#2E6FC7</small></div>
        <div class="sw" style="background:#0F9D58">Cameroon Green<small>#0F9D58</small></div>
        <div class="sw" style="background:#E0301E">Cameroon Red<small>#E0301E</small></div>
        <div class="sw" style="background:#FFC629;color:#3a2b00">Cameroon Yellow<small>#FFC629</small></div>
        <div class="sw" style="background:#0C1622">Ink<small>#0C1622</small></div>
      </div>
    </div>
    <div class="card" data-anim="right">
      <div class="ct" style="font-size:.58em">Tokens, not hard-codes</div>
      <ul class="flist" style="margin-top:12px;">
        <li>${ic('layers')}<span><b>Egyptian Blue (#1F4E79)</b> is the primary brand color throughout.</span></li>
        <li>${ic('check2')}<span>All styling flows from <b>centralized design tokens</b> — no hard-coded values.</span></li>
        <li>${ic('check2')}<span>Consistent typography, spacing &amp; icon set on every screen.</span></li>
        <li>${ic('flag')}<span>Cameroonian cultural elements in onboarding &amp; branding.</span></li>
      </ul>
    </div>
  </div>
  ${brand}
</div></section>`);

/* ============================== 19 · CLOSING ============================== */
SLIDES.push(`
<section data-background-gradient="linear-gradient(150deg,#0C2F52,#0A1E33 55%,#081627)">
  <div class="blob" style="width:320px;height:320px;left:-4%;top:14%;background:radial-gradient(circle,#0F9D58,transparent 70%)"></div>
  <div class="blob" style="width:300px;height:300px;right:2%;bottom:6%;background:radial-gradient(circle,#2E6FC7,transparent 70%);animation-delay:1.2s"></div>
  <div class="wrap center" style="text-align:center;">
    <div class="kicker" data-anim="up" style="justify-content:center">Thank you</div>
    <h1 data-anim="zoom" style="font-size:2.8em;background:linear-gradient(120deg,#fff,#7FB2F0);-webkit-background-clip:text;background-clip:text;color:transparent;">Chat like you’re home</h1>
    <div class="accent-bar" data-anim="left" style="width:160px;height:6px;margin:14px auto 22px;"></div>
    <p data-anim="up" class="d1" style="font-size:.62em;color:#C8D8EE;max-width:24em;">
      CamChat — a secure, reliable, culturally-relevant communication platform for Cameroon and beyond.</p>
    <div class="tags" data-anim="up" style="justify-content:center;margin-top:20px;max-width:34em;">
      <span class="tag">${ic('user')} Nkwenti Santung Deshnic</span>
      <span class="tag">${ic('user')} Winner Chiyere Madu</span>
      <span class="tag">${ic('user')} Tanyi Georges Nganyuo</span>
      <span class="tag">${ic('user')} Tchakoua Alain Miguel</span>
      <span class="tag">${ic('user')} Chituh Innocentia Kitcha</span>
    </div>
    <p data-anim="fade" class="d4 tiny" style="margin-top:26px;">
      IUGET · Mobile Application Development · 2025/2026 · Instructor: Mr. Smith Wills</p>
  </div>
</section>`);

/* ---- inject ---- */
document.querySelector('.reveal .slides').innerHTML = SLIDES.join('\n');
