// ===== GLOBALS =====
let userApiKey = '';
let currentImgEl = null;

// ===== TOGGLE & FILTER =====
function toggleTool(id){
  const ws=document.getElementById('ws-'+id);
  const card=ws.closest('.tool-card');
  const isOpen=ws.classList.contains('visible');
  document.querySelectorAll('.workspace').forEach(w=>w.classList.remove('visible'));
  document.querySelectorAll('.tool-card').forEach(c=>c.classList.remove('open'));
  if(!isOpen){ws.classList.add('visible');card.classList.add('open');if(id==='uc')updateUcUnits();if(id==='curr')initCurrency();if(id==='cp')updateColor();}
}
function filterTools(){
  const q=document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('.tool-card').forEach(card=>{
    card.style.display=card.innerText.toLowerCase().includes(q)?'':'none';
  });
}
function filterCat(cat,btn){
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tool-card').forEach(card=>{
    card.style.display=(cat==='all'||card.dataset.cat===cat)?'':'none';
  });
}
function copyOutput(id){
  const el=document.getElementById(id);
  navigator.clipboard.writeText(el.textContent||el.innerText);
}

// ===== WORD COUNTER =====
function runWordCounter(){
  const t=document.getElementById('wc-input').value;
  document.getElementById('wc-words').textContent=t.trim()===''?0:t.trim().split(/\s+/).length;
  document.getElementById('wc-chars').textContent=t.length;
  document.getElementById('wc-sentences').textContent=(t.match(/[.!?]+/g)||[]).length;
  document.getElementById('wc-read').textContent=Math.max(1,Math.ceil((t.trim()===''?0:t.trim().split(/\s+/).length)/200))+' min';
}

// ===== CASE =====
function convertCase(type){
  const v=document.getElementById('cc-input').value;
  const r={upper:v.toUpperCase(),lower:v.toLowerCase(),title:v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),sentence:v.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g,c=>c.toUpperCase())};
  document.getElementById('cc-output').textContent=r[type];
}

// ===== REVERSER =====
function reverseText(m){
  const v=document.getElementById('tr-input').value;
  document.getElementById('tr-output').textContent=m==='chars'?v.split('').reverse().join(''):v.split(' ').reverse().join(' ');
}

// ===== DUPES =====
function removeDupes(){
  const lines=document.getElementById('dl-input').value.split('\n');
  const u=[...new Set(lines.map(l=>l.trim()).filter(l=>l!==''))];
  document.getElementById('dl-output').textContent=u.join('\n')+'\n\n✅ Removed '+(lines.length-u.length)+' duplicate(s). '+u.length+' unique lines.';
}

// ===== TEXT DIFF =====
function runDiff(){
  const aLines=document.getElementById('diff-a').value.split('\n');
  const bLines=document.getElementById('diff-b').value.split('\n');
  const out=document.getElementById('diff-output');
  let html='<div style="font-family:monospace;font-size:13px;">';
  const max=Math.max(aLines.length,bLines.length);
  let adds=0,removes=0;
  for(let i=0;i<max;i++){
    const a=aLines[i]||'',b=bLines[i]||'';
    if(a===b)html+=`<div class="diff-line" style="color:var(--muted);">&nbsp;&nbsp;${escH(a)}</div>`;
    else{
      if(a)html+=`<div class="diff-line diff-removed">− ${escH(a)}</div>`,removes++;
      if(b)html+=`<div class="diff-line diff-added">+ ${escH(b)}</div>`,adds++;
    }
  }
  html+=`</div><div style="margin-top:8px;font-size:12px;color:var(--muted);">✅ ${adds} additions · ❌ ${removes} deletions</div>`;
  out.innerHTML=html;
}
function escH(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ===== GRAMMAR =====
async function checkGrammar(){
  const text=document.getElementById('gram-input').value.trim();
  if(!text){document.getElementById('gram-output').textContent='Please enter some text.';return;}
  document.getElementById('gram-output').textContent='⏳ Checking grammar...';
  try{
    const res=await fetch('https://api.languagetool.org/v2/check',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`text=${encodeURIComponent(text)}&language=en-US`});
    const data=await res.json();
    if(data.matches.length===0){document.getElementById('gram-output').textContent='✅ No grammar issues found! Your text looks great.';}
    else{
      let out='Found '+data.matches.length+' issue(s):\n\n';
      data.matches.forEach((m,i)=>{out+=`${i+1}. "${text.substr(m.offset,m.length)}" — ${m.message}\n   ✏️ Suggestion: ${m.replacements.slice(0,3).map(r=>r.value).join(', ')||'No suggestion'}\n\n`;});
      document.getElementById('gram-output').textContent=out;
    }
  }catch(e){document.getElementById('gram-output').textContent='⚠️ Grammar check failed. Please try again.';}
}

// ===== TRIMMER =====
function updateTrimmer(){
  const v=document.getElementById('trim-input').value;
  const lim=parseInt(document.getElementById('trim-limit').value)||160;
  document.getElementById('trim-count').textContent=v.length;
  document.getElementById('trim-left').textContent=Math.max(0,lim-v.length);
}
function doTrim(){
  const v=document.getElementById('trim-input').value;
  const lim=parseInt(document.getElementById('trim-limit').value)||160;
  document.getElementById('trim-output').textContent=v.substring(0,lim)+(v.length>lim?' [trimmed]':'');
}

// ===== CSV/JSON =====
function convertCsvJson(){
  const mode=document.getElementById('csvjson-mode').value;
  const input=document.getElementById('csvjson-input').value.trim();
  try{
    if(mode==='csv2json'){
      const lines=input.split('\n').filter(l=>l.trim());
      const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
      const result=lines.slice(1).map(line=>{
        const vals=line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)||[];
        const obj={};headers.forEach((h,i)=>obj[h]=(vals[i]||'').trim().replace(/^"|"$/g,''));return obj;
      });
      document.getElementById('csvjson-output').textContent=JSON.stringify(result,null,2);
    }else{
      const data=JSON.parse(input);
      if(!Array.isArray(data)||!data.length){document.getElementById('csvjson-output').textContent='Error: Input must be a JSON array.';return;}
      const headers=Object.keys(data[0]);
      const csv=[headers.join(','),...data.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))].join('\n');
      document.getElementById('csvjson-output').textContent=csv;
    }
  }catch(e){document.getElementById('csvjson-output').textContent='Error: '+e.message;}
}

// ===== LOREM IPSUM =====
const LP=['Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.','Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.','Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.','At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati.','Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.'];
function generateLorem(){document.getElementById('li-output').textContent=LP.slice(0,parseInt(document.getElementById('li-amount').value)).join('\n\n');}

// ===== QR CODE =====
function generateQR(){
  const text=encodeURIComponent(document.getElementById('qr-input').value.trim());
  const size=document.getElementById('qr-size').value;
  if(!text){document.getElementById('qr-result').innerHTML='<p style="color:var(--accent3);margin-top:8px;">Please enter text or URL.</p>';return;}
  const url=`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${text}&bgcolor=0b0c0f&color=f0ff44`;
  document.getElementById('qr-result').innerHTML=`<img src="${url}" style="margin-top:12px;display:block;border-radius:10px;" width="${size}" height="${size}" alt="QR Code"/><br/><a href="${url}" download="qrcode.png"><button class="ws-btn" style="margin-top:8px;">⬇ Download QR</button></a>`;
}

// ===== COLOR PICKER =====
function updateColor(){
  const hex=document.getElementById('cp-picker').value;
  document.getElementById('cp-hex').value=hex;
  document.getElementById('cp-preview').style.background=hex;
  const [r,g,b]=hv(hex);const [h,s,l]=rh(r,g,b);
  document.getElementById('cp-hex-out').textContent=hex.toUpperCase();
  document.getElementById('cp-rgb-out').textContent=`${r},${g},${b}`;
  document.getElementById('cp-hsl-out').textContent=`${h}°,${s}%,${l}%`;
}
function hexToRgb(){let hex=document.getElementById('cp-hex').value.trim();if(!hex.startsWith('#'))hex='#'+hex;if(/^#[0-9A-Fa-f]{6}$/.test(hex)){document.getElementById('cp-picker').value=hex;updateColor();}}
function hv(hex){return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function rh(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);switch(mx){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}

// ===== IMAGE COMPRESS =====
let compressImg=null;
function loadImageCompress(){
  const file=document.getElementById('imgcomp-file').files[0];if(!file)return;
  document.getElementById('imgcomp-output').textContent='✅ Image loaded: '+file.name+' ('+formatBytes(file.size)+')';
  const img=new Image();img.onload=()=>compressImg=img;img.src=URL.createObjectURL(file);
}
function compressImage(){
  if(!compressImg){document.getElementById('imgcomp-output').textContent='⚠️ Please choose an image first.';return;}
  const quality=parseInt(document.getElementById('imgcomp-quality').value)/100;
  const canvas=document.getElementById('imgCanvas');
  canvas.width=compressImg.naturalWidth;canvas.height=compressImg.naturalHeight;
  canvas.getContext('2d').drawImage(compressImg,0,0);
  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const origSize=compressImg.src.length;
    document.getElementById('imgcomp-output').innerHTML=`✅ Compressed! New size: ${formatBytes(blob.size)}<br/><a href="${url}" download="compressed.jpg"><button class="ws-btn" style="margin-top:8px;">⬇ Download</button></a>`;
  },'image/jpeg',quality);
}
function formatBytes(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(2)+'MB';}

// ===== IMAGE RESIZER =====
let resizeImg=null;
function loadImageResize(){
  const file=document.getElementById('imgres-file').files[0];if(!file)return;
  const img=new Image();
  img.onload=()=>{
    resizeImg=img;
    document.getElementById('imgres-info').textContent=`Original: ${img.naturalWidth}×${img.naturalHeight}px`;
    document.getElementById('imgres-w').value=img.naturalWidth;
    document.getElementById('imgres-h').value=img.naturalHeight;
  };
  img.src=URL.createObjectURL(file);
}
function resizeImage(){
  if(!resizeImg){document.getElementById('imgres-output').textContent='⚠️ Please choose an image first.';return;}
  const w=parseInt(document.getElementById('imgres-w').value)||resizeImg.naturalWidth;
  const h=parseInt(document.getElementById('imgres-h').value)||resizeImg.naturalHeight;
  const canvas=document.getElementById('imgCanvas');
  canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(resizeImg,0,0,w,h);
  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    document.getElementById('imgres-output').innerHTML=`✅ Resized to ${w}×${h}px<br/><a href="${url}" download="resized.png"><button class="ws-btn" style="margin-top:8px;">⬇ Download</button></a>`;
  });
}

// ===== IMAGE TO BASE64 =====
function imageToBase64(){
  const file=document.getElementById('imgb64-file').files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>document.getElementById('imgb64-output').textContent=e.target.result;
  reader.readAsDataURL(file);
}

// ===== FAVICON GENERATOR =====
function generateFavicon(){
  const text=document.getElementById('fav-text').value||'U';
  const bg=document.getElementById('fav-bg').value;
  const fg=document.getElementById('fav-fg').value;
  const canvas=document.getElementById('imgCanvas');
  canvas.width=32;canvas.height=32;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,32,32);
  ctx.fillStyle=fg;ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(text.substring(0,2),16,16);
  const url=canvas.toDataURL('image/png');
  document.getElementById('fav-preview').innerHTML=`<img src="${url}" style="width:32px;height:32px;border:1px solid var(--border);border-radius:6px;margin-right:12px;"/><a href="${url}" download="favicon.png"><button class="ws-btn" style="margin-top:8px;">⬇ Download favicon.png</button></a>`;
}

// ===== GRADIENT =====
function updateGradient(){
  const c1=document.getElementById('grad-c1').value;
  const c2=document.getElementById('grad-c2').value;
  const c3=document.getElementById('grad-c3').value;
  const dir=document.getElementById('grad-dir').value;
  const type=document.getElementById('grad-type').value;
  let css,out;
  if(type==='radial'){css=`radial-gradient(circle, ${c1}, ${c2}, ${c3})`;out=`background: radial-gradient(circle, ${c1}, ${c2}, ${c3});`;}
  else{css=`linear-gradient(${dir}, ${c1}, ${c2}, ${c3})`;out=`background: linear-gradient(${dir}, ${c1}, ${c2}, ${c3});`;}
  document.getElementById('grad-preview').style.background=css;
  document.getElementById('grad-output').textContent=out;
}

// ===== PATTERN =====
function updatePattern(){
  const type=document.getElementById('pat-type').value;
  const c=document.getElementById('pat-c1').value;
  const bg=document.getElementById('pat-bg').value;
  let css='',out='';
  const patterns={
    dots:`background: radial-gradient(circle, ${c} 1px, ${bg} 1px); background-size: 20px 20px;`,
    grid:`background: linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px); background-color: ${bg}; background-size: 20px 20px;`,
    stripes:`background: repeating-linear-gradient(45deg, ${c}, ${c} 2px, ${bg} 2px, ${bg} 20px);`,
    zigzag:`background: linear-gradient(135deg, ${c} 25%, transparent 25%) -20px 0, linear-gradient(225deg, ${c} 25%, transparent 25%) -20px 0, linear-gradient(315deg, ${c} 25%, transparent 25%), linear-gradient(45deg, ${c} 25%, transparent 25%); background-size: 40px 40px; background-color: ${bg};`,
    checks:`background: ${c}; background-image: linear-gradient(45deg, ${bg} 25%, transparent 25%, transparent 75%, ${bg} 75%, ${bg}), linear-gradient(45deg, ${bg} 25%, transparent 25%, transparent 75%, ${bg} 75%, ${bg}); background-size: 40px 40px; background-position: 0 0, 20px 20px;`
  };
  out=patterns[type];
  const preview=document.getElementById('pat-preview');
  out.split(';').forEach(rule=>{if(rule.trim()){const[k,...v]=rule.split(':');if(k&&v.length)preview.style[k.trim().replace(/-([a-z])/g,(_,l)=>l.toUpperCase())]=v.join(':').trim();}});
  document.getElementById('pat-output').textContent=out;
}

// ===== META TAG =====
function generateMeta(){
  const t=document.getElementById('mt-title').value;const d=document.getElementById('mt-desc').value;const k=document.getElementById('mt-keywords').value;
  if(!t){document.getElementById('mt-output').textContent='Please enter a title.';return;}
  document.getElementById('mt-output').textContent=`<!-- Primary Meta Tags -->\n<title>${t}</title>\n<meta name="title" content="${t}">\n<meta name="description" content="${d}">\n<meta name="keywords" content="${k}">\n\n<!-- Open Graph -->\n<meta property="og:type" content="website">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d}">\n\n<!-- Twitter -->\n<meta property="twitter:card" content="summary_large_image">\n<meta property="twitter:title" content="${t}">\n<meta property="twitter:description" content="${d}">`;
}

// ===== KEYWORD DENSITY =====
const STOP=new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','get','has','him','his','how','man','new','now','old','see','two','way','who','did','its','let','put','say','she','too','use','with','that','this','have','from','they','will','been','your','said','each','more','when','which','their','what','about','would','there','could','after','other','than','then','some','into','most','also','over','such','where','these','first','well','just','were','very','even','back','good','much','some','time','year','know','take','them','make','like','come','here','think','people','should','really','going','those','still','because','where','since','through']);
function checkKeywords(){
  const text=document.getElementById('kd-input').value.toLowerCase();
  const words=text.match(/\b[a-z]{3,}\b/g)||[];
  const total=words.length;const freq={};words.forEach(w=>{freq[w]=(freq[w]||0)+1;});
  const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]).filter(([w])=>!STOP.has(w)).slice(0,15);
  document.getElementById('kd-output').innerHTML=sorted.map(([w,c])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);"><span>${w}</span><span style="color:var(--accent);">${c}× <span style="color:var(--muted)">(${((c/total)*100).toFixed(1)}%)</span></span></div>`).join('')||'No significant keywords found.';
}

// ===== SLUG =====
function generateSlug(){
  const slug=document.getElementById('sg-input').value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  document.getElementById('sg-output').textContent=slug||'your-slug-will-appear-here';
}

// ===== OPEN GRAPH =====
function generateOG(){
  const t=document.getElementById('og-title').value;const d=document.getElementById('og-desc').value;const u=document.getElementById('og-url').value;const i=document.getElementById('og-img').value;const tp=document.getElementById('og-type').value;
  document.getElementById('og-output').textContent=`<!-- Open Graph Meta Tags -->\n<meta property="og:type" content="${tp}">\n<meta property="og:url" content="${u}">\n<meta property="og:title" content="${t}">\n<meta property="og:description" content="${d}">\n<meta property="og:image" content="${i}">\n\n<!-- Twitter Card -->\n<meta property="twitter:card" content="summary_large_image">\n<meta property="twitter:url" content="${u}">\n<meta property="twitter:title" content="${t}">\n<meta property="twitter:description" content="${d}">\n<meta property="twitter:image" content="${i}">`;
}

// ===== ROBOTS.TXT =====
function generateRobots(){
  const sitemap=document.getElementById('rob-sitemap').value;
  const mode=document.getElementById('rob-mode').value;
  const disallow=document.getElementById('rob-disallow').value.split(',').map(s=>s.trim()).filter(Boolean);
  let out='';
  if(mode==='block'){out='User-agent: *\nDisallow: /';}
  else if(mode==='custom'){out='User-agent: Googlebot\nAllow: /\n\nUser-agent: *\nDisallow: /';}
  else{out='User-agent: *\nAllow: /';if(disallow.length)out+='\n'+disallow.map(d=>'Disallow: '+d).join('\n');}
  if(sitemap)out+='\n\nSitemap: '+sitemap;
  document.getElementById('rob-output').textContent=out;
}

// ===== SITEMAP =====
function generateSitemap(){
  const urls=document.getElementById('sitemap-urls').value.split('\n').map(u=>u.trim()).filter(u=>u.startsWith('http'));
  const freq=document.getElementById('sitemap-freq').value;
  const today=new Date().toISOString().split('T')[0];
  let xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(u=>{xml+=`  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;});
  xml+='</urlset>';
  document.getElementById('sitemap-output').textContent=xml;
}

// ===== READABILITY =====
function checkReadability(){
  const text=document.getElementById('read-input').value.trim();
  if(!text){document.getElementById('read-output').textContent='Please enter some text.';return;}
  const sentences=(text.match(/[.!?]+/g)||[]).length||1;
  const words=text.trim().split(/\s+/).length;
  const syllables=text.toLowerCase().replace(/[^a-z]/g,' ').split(/\s+/).reduce((acc,w)=>{return acc+(w.match(/[aeiouy]{1,2}/g)||['x']).length;},0);
  const fk=206.835-1.015*(words/sentences)-84.6*(syllables/words);
  const score=Math.max(0,Math.min(100,Math.round(fk)));
  let level='',color='';
  if(score>=90){level='Very Easy — 5th Grade';color='var(--accent2)';}
  else if(score>=80){level='Easy — 6th Grade';color='var(--accent2)';}
  else if(score>=70){level='Fairly Easy — 7th Grade';color='var(--accent)';}
  else if(score>=60){level='Standard — 8th-9th Grade';color='var(--accent)';}
  else if(score>=50){level='Fairly Difficult — 10th-12th Grade';color='var(--accent3)';}
  else{level='Difficult — College Level';color='var(--accent3)';}
  document.getElementById('read-output').innerHTML=`<strong style="font-size:28px;font-family:Syne;color:${color};">${score}/100</strong>\n<span style="color:${color};">${level}</span>\n\nWords: ${words} | Sentences: ${sentences} | Avg words/sentence: ${(words/sentences).toFixed(1)}`;
}

// ===== UTM BUILDER =====
function buildUTM(){
  const url=document.getElementById('utm-url').value;
  const src=document.getElementById('utm-source').value;
  const med=document.getElementById('utm-medium').value;
  const cam=document.getElementById('utm-campaign').value;
  const con=document.getElementById('utm-content').value;
  if(!url||!src){document.getElementById('utm-output').textContent='Enter URL and Source to build link.';return;}
  let link=url+'?utm_source='+encodeURIComponent(src);
  if(med)link+='&utm_medium='+encodeURIComponent(med);
  if(cam)link+='&utm_campaign='+encodeURIComponent(cam);
  if(con)link+='&utm_content='+encodeURIComponent(con);
  document.getElementById('utm-output').textContent=link;
}

// ===== PERCENTAGE =====
function calcPercent(){
  const type=document.getElementById('pc-type').value;
  const a=parseFloat(document.getElementById('pc-a').value),b=parseFloat(document.getElementById('pc-b').value);
  if(isNaN(a)||isNaN(b)){document.getElementById('pc-output').textContent='Please enter both values.';return;}
  let r='';
  if(type==='pct')r=`${a}% of ${b} = ${+(a/100*b).toFixed(6)}`;
  else if(type==='of')r=`${a} is ${+((a/b)*100).toFixed(4)}% of ${b}`;
  else r=`% change from ${a} to ${b} = ${+(((b-a)/a)*100).toFixed(4)}%`;
  document.getElementById('pc-output').textContent='✅ '+r;
}

// ===== UNIT CONVERTER =====
const UCU={length:{m:'Meters',km:'Kilometers',mi:'Miles',ft:'Feet',in:'Inches',cm:'Centimeters',mm:'Millimeters'},weight:{kg:'Kilograms',g:'Grams',lb:'Pounds',oz:'Ounces',t:'Metric Tons'},temp:{c:'Celsius',f:'Fahrenheit',k:'Kelvin'},speed:{'m/s':'m/s','km/h':'km/h',mph:'mph',knots:'Knots'}};
const UCB={m:1,km:1000,mi:1609.34,ft:0.3048,in:0.0254,cm:0.01,mm:0.001,kg:1,g:0.001,lb:0.453592,oz:0.0283495,t:1000,'m/s':1,'km/h':0.277778,mph:0.44704,knots:0.514444};
function updateUcUnits(){
  const cat=document.getElementById('uc-cat').value;
  ['uc-from','uc-to'].forEach(id=>{const s=document.getElementById(id);s.innerHTML=Object.entries(UCU[cat]).map(([v,n])=>`<option value="${v}">${n}</option>`).join('');});
  document.getElementById('uc-to').selectedIndex=1;
}
function convertUnit(){
  const val=parseFloat(document.getElementById('uc-val').value),from=document.getElementById('uc-from').value,to=document.getElementById('uc-to').value,cat=document.getElementById('uc-cat').value;
  if(isNaN(val)){document.getElementById('uc-output').textContent='';return;}
  let result;
  if(cat==='temp'){let c;if(from==='c')c=val;else if(from==='f')c=(val-32)*5/9;else c=val-273.15;if(to==='c')result=c;else if(to==='f')result=c*9/5+32;else result=c+273.15;}
  else result=val*UCB[from]/UCB[to];
  document.getElementById('uc-output').textContent=`✅ ${val} ${from} = ${parseFloat(result.toFixed(6))} ${to}`;
}

// ===== NUMBER BASE =====
function convertBase(){
  const from=parseInt(document.getElementById('bh-from').value),input=document.getElementById('bh-input').value.trim();
  if(!input){['dec','bin','hex','oct'].forEach(id=>document.getElementById('bh-'+id).textContent='—');return;}
  try{const d=parseInt(input,from);document.getElementById('bh-dec').textContent=d;document.getElementById('bh-bin').textContent=d.toString(2);document.getElementById('bh-hex').textContent=d.toString(16).toUpperCase();document.getElementById('bh-oct').textContent=d.toString(8);}
  catch{['dec','bin','hex','oct'].forEach(id=>document.getElementById('bh-'+id).textContent='Error');}
}

// ===== SCIENTIFIC CALC =====
let sciExpr='';
function sciInput(v){sciExpr+=v;document.getElementById('sci-display').value=sciExpr;}
function sciClear(){sciExpr='';document.getElementById('sci-display').value='';document.getElementById('sci-output').textContent='';}
function sciEquals(){try{const r=eval(sciExpr.replace(/π/g,Math.PI).replace(/e/g,Math.E));document.getElementById('sci-output').textContent='= '+r;sciExpr=String(r);}catch{document.getElementById('sci-output').textContent='Error';sciExpr='';}}
function sciFunc(f){
  const v=parseFloat(sciExpr)||0;
  if(f==='sqrt'){document.getElementById('sci-output').textContent='= '+Math.sqrt(v);sciExpr=String(Math.sqrt(v));}
  else if(f==='sq'){document.getElementById('sci-output').textContent='= '+v*v;sciExpr=String(v*v);}
  else if(f==='sin'){document.getElementById('sci-output').textContent='= '+Math.sin(v*Math.PI/180).toFixed(8);}
  else if(f==='cos'){document.getElementById('sci-output').textContent='= '+Math.cos(v*Math.PI/180).toFixed(8);}
  document.getElementById('sci-display').value=sciExpr;
}

// ===== AGE CALC =====
function calcAge(){
  const dob=new Date(document.getElementById('age-dob').value);if(!dob.getTime()){document.getElementById('age-output').textContent='Please select a date.';return;}
  const now=new Date();const diff=now-dob;
  const years=Math.floor(diff/31557600000);const months=Math.floor((diff%31557600000)/2629800000);const days=Math.floor((diff%2629800000)/86400000);
  const totalDays=Math.floor(diff/86400000);const totalHours=Math.floor(diff/3600000);
  document.getElementById('age-output').textContent=`🎂 You are:\n${years} years, ${months} months, ${days} days old\n\n📊 That's also:\n${totalDays.toLocaleString()} total days\n${totalHours.toLocaleString()} total hours\n${Math.floor(totalHours*60).toLocaleString()} total minutes`;
}

// ===== DATE DIFF =====
function calcDateDiff(){
  const a=new Date(document.getElementById('datediff-a').value),b=new Date(document.getElementById('datediff-b').value);
  if(!a.getTime()||!b.getTime()){document.getElementById('datediff-output').textContent='Please select both dates.';return;}
  const diff=Math.abs(b-a);
  document.getElementById('datediff-output').textContent=`📅 Difference:\n${Math.floor(diff/86400000)} days\n${(diff/604800000).toFixed(2)} weeks\n${(diff/2629800000).toFixed(2)} months\n${(diff/31557600000).toFixed(4)} years`;
}

// ===== EMI CALC =====
function calcEMI(){
  const p=parseFloat(document.getElementById('emi-principal').value),r=parseFloat(document.getElementById('emi-rate').value)/100/12,n=parseInt(document.getElementById('emi-tenure').value);
  if(!p||!r||!n){document.getElementById('emi-output').textContent='Please fill all fields.';return;}
  const emi=p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
  const total=emi*n;const interest=total-p;
  document.getElementById('emi-output').textContent=`💰 Monthly EMI: ${emi.toFixed(2)}\n📊 Total Payment: ${total.toFixed(2)}\n💸 Total Interest: ${interest.toFixed(2)}\n🏦 Principal: ${p.toFixed(2)}`;
}

// ===== CURRENCY =====
const CURRENCIES=['USD','EUR','GBP','INR','JPY','CAD','AUD','CHF','CNY','AED','SGD','MXN','BRL','KRW','NOK','SEK','DKK','NZD','ZAR','RUB','HKD','MYR','THB','IDR','PKR','TRY'];
let ratesCache={};
function initCurrency(){
  ['curr-from','curr-to'].forEach(id=>{const s=document.getElementById(id);if(!s.options.length)CURRENCIES.forEach(c=>s.add(new Option(c,c)));});
  document.getElementById('curr-from').value='USD';
  document.getElementById('curr-to').value='INR';
}
async function convertCurrency(){
  const amt=parseFloat(document.getElementById('curr-amount').value)||1;
  const from=document.getElementById('curr-from').value,to=document.getElementById('curr-to').value;
  document.getElementById('curr-output').textContent='⏳ Fetching live rates...';
  try{
    if(!ratesCache[from]){
      const res=await fetch(`https://open.er-api.com/v6/latest/${from}`);
      const data=await res.json();ratesCache[from]=data.rates;
    }
    const rate=ratesCache[from][to];
    document.getElementById('curr-output').textContent=`💱 ${amt} ${from} = ${(amt*rate).toFixed(4)} ${to}\n\nRate: 1 ${from} = ${rate} ${to}\n(Live rate from open.er-api.com)`;
  }catch{document.getElementById('curr-output').textContent='⚠️ Could not fetch live rates. Please try again.';}
}
function swapCurrency(){const f=document.getElementById('curr-from').value,t=document.getElementById('curr-to').value;document.getElementById('curr-from').value=t;document.getElementById('curr-to').value=f;}

// ===== TIME ZONE =====
function convertTZ(){
  const timeVal=document.getElementById('tz-time').value;
  const from=document.getElementById('tz-from').value,to=document.getElementById('tz-to').value;
  if(!timeVal){document.getElementById('tz-output').textContent='Please select a date and time.';return;}
  try{
    const date=new Date(timeVal);
    const fromStr=date.toLocaleString('en-US',{timeZone:from,dateStyle:'medium',timeStyle:'short'});
    const toStr=date.toLocaleString('en-US',{timeZone:to,dateStyle:'medium',timeStyle:'short'});
    document.getElementById('tz-output').textContent=`🕐 ${from}:\n${fromStr}\n\n🕑 ${to}:\n${toStr}`;
  }catch{document.getElementById('tz-output').textContent='⚠️ Conversion failed. Please try again.';}
}

// ===== PASSWORD =====
function generatePassword(){
  const len=parseInt(document.getElementById('pass-len').value);
  let chars='';
  if(document.getElementById('pass-upper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if(document.getElementById('pass-lower').checked)chars+='abcdefghijklmnopqrstuvwxyz';
  if(document.getElementById('pass-num').checked)chars+='0123456789';
  if(document.getElementById('pass-sym').checked)chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
  if(!chars){document.getElementById('pass-output').textContent='Please select at least one option.';return;}
  let pwd='';for(let i=0;i<len;i++)pwd+=chars[Math.floor(Math.random()*chars.length)];
  document.getElementById('pass-output').textContent=pwd;
  const score=Math.min(100,len*2+(chars.length>50?30:chars.length>30?20:10));
  const bar=document.getElementById('pass-strength');
  const label=document.getElementById('pass-strength-label');
  if(score<40){bar.style.background='var(--accent3)';bar.style.width=score+'%';label.textContent='Weak';}
  else if(score<70){bar.style.background='var(--accent)';bar.style.width=score+'%';label.textContent='Medium';}
  else{bar.style.background='var(--accent2)';bar.style.width=score+'%';label.textContent='Strong ✅';}
}

// ===== UUID =====
function generateUUID(){
  const count=parseInt(document.getElementById('uuid-count').value);
  const uuids=[];for(let i=0;i<count;i++)uuids.push(([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
  document.getElementById('uuid-output').textContent=uuids.join('\n');
}

// ===== HASH =====
function generateHash(){
  const text=document.getElementById('hash-input').value;
  if(!text){document.getElementById('hash-output').textContent='';return;}
  document.getElementById('hash-output').innerHTML=`<span style="color:var(--muted);">MD5:</span> ${CryptoJS.MD5(text)}\n<span style="color:var(--muted);">SHA-1:</span> ${CryptoJS.SHA1(text)}\n<span style="color:var(--muted);">SHA-256:</span> ${CryptoJS.SHA256(text)}\n<span style="color:var(--muted);">SHA-512:</span> ${CryptoJS.SHA512(text).toString().substring(0,64)}...`;
}

// ===== JSON =====
function formatJSON(){
  try{const parsed=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').textContent=JSON.stringify(parsed,null,2);}
  catch(e){document.getElementById('json-output').textContent='❌ Invalid JSON: '+e.message;}
}
function minifyJSON(){
  try{const parsed=JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').textContent=JSON.stringify(parsed);}
  catch(e){document.getElementById('json-output').textContent='❌ Invalid JSON: '+e.message;}
}
function validateJSON(){
  try{JSON.parse(document.getElementById('json-input').value);document.getElementById('json-output').textContent='✅ Valid JSON!';}
  catch(e){document.getElementById('json-output').textContent='❌ Invalid JSON: '+e.message;}
}

// ===== BASE64 =====
function encodeBase64(){
  try{document.getElementById('b64-output').textContent=btoa(unescape(encodeURIComponent(document.getElementById('b64-input').value)));}
  catch(e){document.getElementById('b64-output').textContent='Error encoding: '+e.message;}
}
function decodeBase64(){
  try{document.getElementById('b64-output').textContent=decodeURIComponent(escape(atob(document.getElementById('b64-input').value)));}
  catch(e){document.getElementById('b64-output').textContent='Error decoding: Invalid Base64 string.';}
}

// ===== IP LOOKUP =====
async function lookupIP(){
  const ip=document.getElementById('ip-input').value.trim();
  document.getElementById('ip-output').textContent='⏳ Looking up...';
  try{
    const url=ip?`https://ipapi.co/${ip}/json/`:'https://ipapi.co/json/';
    const res=await fetch(url);const d=await res.json();
    if(d.error){document.getElementById('ip-output').textContent='❌ '+d.reason;return;}
    document.getElementById('ip-output').textContent=`🌐 IP: ${d.ip}\n📍 Location: ${d.city}, ${d.region}, ${d.country_name}\n🗺️ Coordinates: ${d.latitude}, ${d.longitude}\n🏢 ISP: ${d.org}\n⏰ Timezone: ${d.timezone}\n📮 Postal: ${d.postal}\n🌍 Currency: ${d.currency}`;
  }catch{document.getElementById('ip-output').textContent='⚠️ Lookup failed. Please try again.';}
}

// ===== REGEX =====
function testRegex(){
  const pattern=document.getElementById('regex-pattern').value;
  const text=document.getElementById('regex-text').value;
  if(!pattern||!text){document.getElementById('regex-result').textContent='';document.getElementById('regex-output').textContent='';return;}
  try{
    let flags='';if(document.getElementById('regex-gi').checked)flags+='g';if(document.getElementById('regex-ci').checked)flags+='i';
    const regex=new RegExp(pattern,flags);
    const matches=[...text.matchAll(new RegExp(pattern,flags.includes('g')?flags:flags+'g'))];
    document.getElementById('regex-result').innerHTML=`<span style="color:var(--accent2);">✅ Found ${matches.length} match(es)</span>`;
    const highlighted=text.replace(new RegExp(pattern,flags.includes('g')?flags:flags+'g'),m=>`<span class="regex-match">${escH(m)}</span>`);
    document.getElementById('regex-output').innerHTML=highlighted;
  }catch(e){document.getElementById('regex-result').innerHTML=`<span style="color:var(--accent3);">❌ Invalid regex: ${e.message}</span>`;}
}

// ===== AI KEY =====
function saveApiKey(){
  userApiKey=document.getElementById('global-api-key').value.trim();
  document.getElementById('api-key-status').textContent=userApiKey?'✅ Key saved for this session!':'⚠️ Please enter a key.';
}

// ===== AI CALL =====
async function callAI(prompt){
  if(!userApiKey){return 'Please enter your Anthropic API key above first.';}
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':userApiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
  const data=await res.json();
  if(data.error)return '❌ API Error: '+data.error.message;
  return data.content[0].text;
}

// ===== AI REWRITER =====
async function aiRewrite(){
  const text=document.getElementById('rewrite-input').value.trim();
  const tone=document.getElementById('rewrite-tone').value;
  if(!text){document.getElementById('rewrite-output').textContent='Please enter text to rewrite.';return;}
  document.getElementById('rewrite-output').textContent='⏳ AI is rewriting...';
  const result=await callAI(`Rewrite the following text in a ${tone} tone. Only provide the rewritten text, nothing else:\n\n${text}`);
  document.getElementById('rewrite-output').textContent=result;
}

// ===== AI TITLES =====
async function aiGenerateTitles(){
  const topic=document.getElementById('title-input').value.trim();
  const type=document.getElementById('title-type').value;
  if(!topic){document.getElementById('title-output').textContent='Please describe your topic.';return;}
  document.getElementById('title-output').textContent='⏳ AI is generating titles...';
  const result=await callAI(`Generate 8 catchy, SEO-optimized ${type} titles for this topic: "${topic}". Number them 1-8. Only provide the numbered list, nothing else.`);
  document.getElementById('title-output').textContent=result;
}

// ===== AI BIO =====
async function aiGenerateBio(){
  const name=document.getElementById('bio-name').value;
  const role=document.getElementById('bio-role').value;
  const skills=document.getElementById('bio-skills').value;
  const platform=document.getElementById('bio-platform').value;
  if(!name||!role){document.getElementById('bio-output').textContent='Please enter your name and role.';return;}
  document.getElementById('bio-output').textContent='⏳ AI is writing your bio...';
  const result=await callAI(`Write a professional bio for ${platform} for:\nName: ${name}\nRole: ${role}\nSkills/Achievements: ${skills}\n\nWrite only the bio, no extra text.`);
  document.getElementById('bio-output').textContent=result;
}

// ===== AI META DESC =====
async function aiMetaDesc(){
  const page=document.getElementById('metaai-page').value;
  const content=document.getElementById('metaai-content').value;
  const keyword=document.getElementById('metaai-keyword').value;
  if(!page){document.getElementById('metaai-output').textContent='Please enter a page title.';return;}
  document.getElementById('metaai-output').textContent='⏳ AI is writing...';
  const result=await callAI(`Write 3 SEO meta descriptions (150-160 chars each) for a page titled "${page}". Content: ${content}. ${keyword?'Target keyword: '+keyword+'.'  :''} Number them 1-3. Only the descriptions, nothing else.`);
  document.getElementById('metaai-output').textContent=result;
}

// ===== AI SUMMARIZER =====
async function aiSummarize(){
  const text=document.getElementById('summ-input').value.trim();
  const length=document.getElementById('summ-length').value;
  if(!text){document.getElementById('summ-output').textContent='Please enter text to summarize.';return;}
  document.getElementById('summ-output').textContent='⏳ AI is summarizing...';
  const instructions={short:'in 2-3 sentences',medium:'in one concise paragraph',bullets:'as 5-7 bullet points'};
  const result=await callAI(`Summarize the following text ${instructions[length]}. Only provide the summary, nothing else:\n\n${text}`);
  document.getElementById('summ-output').textContent=result;
}

// ===== INIT =====
updateUcUnits();updateColor();updateGradient();updatePattern();

// ===== PDF TOOLS =====
const pdfFileStore={};
const pdfFileArrays={};

function pdfDzOver(e,id){e.preventDefault();document.getElementById(id).classList.add('dragover');}
function pdfDzLeave(id){document.getElementById(id).classList.remove('dragover');}
function pdfDzDrop(e,tool){e.preventDefault();pdfDzLeave('dz-'+tool);pdfAddFiles(tool,e.dataTransfer.files);}

function pdfAddFiles(tool,files){
  if(!pdfFileArrays[tool])pdfFileArrays[tool]=[];
  Array.from(files).forEach(f=>{if(f.type==='application/pdf'||f.type.startsWith('image/'))pdfFileArrays[tool].push(f);});
  pdfRenderList(tool);
}
function pdfRenderList(tool){
  const el=document.getElementById('fl-'+tool);if(!el)return;
  el.innerHTML=pdfFileArrays[tool].map((f,i)=>`<div class="pdf-file-item"><span>📄 ${f.name}</span><span>${(f.size/1024).toFixed(1)}KB</span><button onclick="pdfRemoveFile('${tool}',${i})">✕</button></div>`).join('');
}
function pdfRemoveFile(tool,idx){pdfFileArrays[tool].splice(idx,1);pdfRenderList(tool);}
function pdfStoreFile(tool,input){
  const f=input.files[0];if(f){pdfFileStore[tool]=f;document.getElementById('out-'+tool).textContent='✅ Loaded: '+f.name+' ('+(f.size/1024).toFixed(1)+'KB)';}
}
async function pdfLoadInfo(tool,input){
  const f=input.files[0];if(!f)return;
  pdfFileStore[tool]=f;
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const n=pdf.getPageCount();
    const el=document.getElementById(tool+'-info');
    if(el)el.innerHTML=`<div style="font-size:12px;color:var(--accent2);margin-top:6px;padding:6px 10px;background:rgba(68,240,200,0.08);border-radius:8px;">📄 ${f.name} — <strong>${n} pages</strong></div>`;
  }catch(e){document.getElementById('out-'+tool).textContent='❌ '+e.message;}
}
function pdfDownload(bytes,name){
  const blob=new Blob([bytes],{type:'application/pdf'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
}
function pdfSetOut(id,msg){document.getElementById('out-'+id).innerHTML=msg;}
function pdfParsePages(str,total){
  const pages=new Set();
  str.split(',').forEach(part=>{
    part=part.trim();
    if(part.includes('-')){const[a,b]=part.split('-').map(Number);for(let i=a;i<=Math.min(b,total);i++)pages.add(i);}
    else if(part){const n=parseInt(part);if(n>=1&&n<=total)pages.add(n);}
  });
  return[...pages].sort((a,b)=>a-b);
}

async function pdfMerge(){
  const files=pdfFileArrays['pdfmerge']||[];
  if(files.length<2){pdfSetOut('pdfmerge','⚠️ Please add at least 2 PDF files.');return;}
  pdfSetOut('pdfmerge','⏳ Merging...');
  try{
    const merged=await PDFLib.PDFDocument.create();
    for(const f of files){
      const buf=await f.arrayBuffer();
      const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
      const pages=await merged.copyPages(pdf,pdf.getPageIndices());
      pages.forEach(p=>merged.addPage(p));
    }
    pdfDownload(await merged.save(),'merged.pdf');
    pdfSetOut('pdfmerge','✅ Merged '+files.length+' files! Download started.');
  }catch(e){pdfSetOut('pdfmerge','❌ Error: '+e.message);}
}

async function pdfExtract(){
  const f=pdfFileStore['pdfextract'];if(!f){pdfSetOut('pdfextract','⚠️ Please select a PDF.');return;}
  try{
    const buf=await f.arrayBuffer();
    const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const total=src.getPageCount();
    const pages=pdfParsePages(document.getElementById('pdfextract-pages').value,total);
    if(!pages.length){pdfSetOut('pdfextract','⚠️ No valid pages specified.');return;}
    const out=await PDFLib.PDFDocument.create();
    const copied=await out.copyPages(src,pages.map(n=>n-1));
    copied.forEach(p=>out.addPage(p));
    pdfDownload(await out.save(),'extracted.pdf');
    pdfSetOut('pdfextract','✅ Extracted '+pages.length+' pages! Download started.');
  }catch(e){pdfSetOut('pdfextract','❌ Error: '+e.message);}
}

async function pdfReorder(){
  const f=pdfFileStore['pdfreorder'];if(!f){pdfSetOut('pdfreorder','⚠️ Please select a PDF.');return;}
  try{
    const buf=await f.arrayBuffer();
    const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const total=src.getPageCount();
    const order=document.getElementById('pdfreorder-pages').value.split(',').map(s=>parseInt(s.trim())).filter(n=>n>=1&&n<=total);
    if(!order.length){pdfSetOut('pdfreorder','⚠️ Please enter page order.');return;}
    const out=await PDFLib.PDFDocument.create();
    const pages=await out.copyPages(src,order.map(n=>n-1));
    pages.forEach(p=>out.addPage(p));
    pdfDownload(await out.save(),'reordered.pdf');
    pdfSetOut('pdfreorder','✅ Reordered! Download started.');
  }catch(e){pdfSetOut('pdfreorder','❌ Error: '+e.message);}
}

async function pdfSplit(){
  const f=pdfFileStore['pdfsplit'];if(!f){pdfSetOut('pdfsplit','⚠️ Please select a PDF.');return;}
  const mode=document.getElementById('pdfsplit-mode').value;
  const val=document.getElementById('pdfsplit-value').value.trim();
  pdfSetOut('pdfsplit','⏳ Splitting...');
  try{
    const buf=await f.arrayBuffer();
    const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const total=src.getPageCount();
    if(mode==='all'){
      for(let i=0;i<total;i++){const out=await PDFLib.PDFDocument.create();const[p]=await out.copyPages(src,[i]);out.addPage(p);pdfDownload(await out.save(),`page_${i+1}.pdf`);}
      pdfSetOut('pdfsplit',`✅ Split into ${total} pages! Downloads started.`);
    }else if(mode==='half'){
      const mid=Math.floor(total/2);
      for(const[s,e,n]of[[0,mid,'part1'],[mid,total,'part2']]){
        const out=await PDFLib.PDFDocument.create();
        const pages=await out.copyPages(src,[...Array(e-s).keys()].map(i=>i+s));
        pages.forEach(p=>out.addPage(p));pdfDownload(await out.save(),n+'.pdf');
      }
      pdfSetOut('pdfsplit','✅ Split in half! 2 files downloaded.');
    }else if(mode==='every'){
      const n=parseInt(val)||2;let part=1;
      for(let i=0;i<total;i+=n){
        const out=await PDFLib.PDFDocument.create();const end=Math.min(i+n,total);
        const pages=await out.copyPages(src,[...Array(end-i).keys()].map(k=>k+i));
        pages.forEach(p=>out.addPage(p));pdfDownload(await out.save(),`part_${part++}.pdf`);
      }
      pdfSetOut('pdfsplit',`✅ Split every ${n} pages!`);
    }else{
      const ranges=val.split(',').map(r=>{const[a,b]=r.split('-').map(Number);return[a||1,b||a||1];});
      for(const[a,b]of ranges){
        const out=await PDFLib.PDFDocument.create();
        const indices=[...Array(b-a+1).keys()].map(i=>i+a-1).filter(i=>i<total);
        const pages=await out.copyPages(src,indices);pages.forEach(p=>out.addPage(p));
        pdfDownload(await out.save(),`pages_${a}-${b}.pdf`);
      }
      pdfSetOut('pdfsplit',`✅ Split into ${ranges.length} parts!`);
    }
  }catch(e){pdfSetOut('pdfsplit','❌ Error: '+e.message);}
}

async function pdfDeletePages(){
  const f=pdfFileStore['pdfdelete'];if(!f){pdfSetOut('pdfdelete','⚠️ Please select a PDF.');return;}
  try{
    const buf=await f.arrayBuffer();
    const src=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const total=src.getPageCount();
    const toDelete=new Set(pdfParsePages(document.getElementById('pdfdelete-pages').value,total));
    const keep=[...Array(total).keys()].filter(i=>!toDelete.has(i+1));
    if(!keep.length){pdfSetOut('pdfdelete','⚠️ Cannot delete all pages.');return;}
    const out=await PDFLib.PDFDocument.create();
    const pages=await out.copyPages(src,keep);
    pages.forEach(p=>out.addPage(p));
    pdfDownload(await out.save(),'deleted_pages.pdf');
    pdfSetOut('pdfdelete',`✅ Deleted ${toDelete.size} pages. ${keep.length} remain. Download started.`);
  }catch(e){pdfSetOut('pdfdelete','❌ Error: '+e.message);}
}

async function pdfCompress(input){
  const f=input.files[0];if(!f)return;
  pdfSetOut('pdfcompress','⏳ Compressing...');
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    pdf.setTitle('');pdf.setAuthor('');pdf.setSubject('');pdf.setKeywords([]);pdf.setProducer('');pdf.setCreator('');
    const bytes=await pdf.save({useObjectStreams:true});
    pdfDownload(bytes,'compressed.pdf');
    const saved=Math.max(0,((f.size-bytes.length)/f.size*100)).toFixed(1);
    pdfSetOut('pdfcompress',`✅ Original: ${(f.size/1024).toFixed(1)}KB → Compressed: ${(bytes.length/1024).toFixed(1)}KB (${saved}% saved)`);
  }catch(e){pdfSetOut('pdfcompress','❌ Error: '+e.message);}
}

async function pdfProtect(){
  const f=pdfFileStore['pdfprotect'];if(!f){pdfSetOut('pdfprotect','⚠️ Please select a PDF.');return;}
  const p1=document.getElementById('pdfprotect-pass').value;
  const p2=document.getElementById('pdfprotect-pass2').value;
  if(!p1){pdfSetOut('pdfprotect','⚠️ Please enter a password.');return;}
  if(p1!==p2){pdfSetOut('pdfprotect','⚠️ Passwords do not match.');return;}
  pdfSetOut('pdfprotect','⏳ Encrypting...');
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const bytes=await pdf.save({userPassword:p1,ownerPassword:p1+'_owner',permissions:{printing:'lowResolution',modifying:false,copying:false}});
    pdfDownload(bytes,'protected.pdf');
    pdfSetOut('pdfprotect','✅ PDF protected with password! Download started.');
  }catch(e){pdfSetOut('pdfprotect','❌ Error: '+e.message);}
}

async function pdfWatermark(){
  const f=pdfFileStore['pdfwm'];if(!f){pdfSetOut('pdfwm','⚠️ Please select a PDF.');return;}
  const text=document.getElementById('pdfwm-text').value.trim();
  if(!text){pdfSetOut('pdfwm','⚠️ Please enter watermark text.');return;}
  const hex=document.getElementById('pdfwm-color').value;
  const opacity=parseInt(document.getElementById('pdfwm-opacity').value)/100;
  pdfSetOut('pdfwm','⏳ Adding watermark...');
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const font=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    for(const page of pdf.getPages()){
      const{width,height}=page.getSize();
      page.drawText(text,{x:width/2-text.length*14,y:height/2,size:48,font,color:PDFLib.rgb(r,g,b),opacity,rotate:PDFLib.degrees(-45)});
    }
    pdfDownload(await pdf.save(),'watermarked.pdf');
    pdfSetOut('pdfwm','✅ Watermark added! Download started.');
  }catch(e){pdfSetOut('pdfwm','❌ Error: '+e.message);}
}

async function pdfRotate(){
  const f=pdfFileStore['pdfrotate'];if(!f){pdfSetOut('pdfrotate','⚠️ Please select a PDF.');return;}
  const deg=parseInt(document.getElementById('pdfrotate-deg').value);
  const pagesStr=document.getElementById('pdfrotate-pages').value.trim();
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const total=pdf.getPageCount();
    const targets=pagesStr?pdfParsePages(pagesStr,total):[...Array(total).keys()].map(i=>i+1);
    targets.forEach(n=>{const page=pdf.getPage(n-1);page.setRotation(PDFLib.degrees((page.getRotation().angle+deg)%360));});
    pdfDownload(await pdf.save(),'rotated.pdf');
    pdfSetOut('pdfrotate',`✅ Rotated ${targets.length} pages by ${deg}°! Download started.`);
  }catch(e){pdfSetOut('pdfrotate','❌ Error: '+e.message);}
}

async function pdfPageNumbers(){
  const f=pdfFileStore['pdfpagenum'];if(!f){pdfSetOut('pdfpagenum','⚠️ Please select a PDF.');return;}
  const pos=document.getElementById('pdfpagenum-pos').value;
  const start=parseInt(document.getElementById('pdfpagenum-start').value)||1;
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    const font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    pdf.getPages().forEach((page,i)=>{
      const{width,height}=page.getSize();const num=String(i+start);const size=12;
      const tw=font.widthOfTextAtSize(num,size);
      let x=width/2-tw/2,y=20;
      if(pos==='bottom-right'){x=width-30;y=20;}else if(pos==='bottom-left'){x=10;y=20;}else if(pos==='top-center'){y=height-30;}
      page.drawText(num,{x,y,size,font,color:PDFLib.rgb(0,0,0)});
    });
    pdfDownload(await pdf.save(),'numbered.pdf');
    pdfSetOut('pdfpagenum','✅ Page numbers added! Download started.');
  }catch(e){pdfSetOut('pdfpagenum','❌ Error: '+e.message);}
}

async function pdfLoadMeta(input){
  const f=input.files[0];if(!f)return;
  pdfFileStore['pdfmeta']=f;
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    document.getElementById('pdfmeta-title').value=pdf.getTitle()||'';
    document.getElementById('pdfmeta-author').value=pdf.getAuthor()||'';
    document.getElementById('pdfmeta-subject').value=pdf.getSubject()||'';
    document.getElementById('pdfmeta-keywords').value=(pdf.getKeywords()||[]).join(', ');
    document.getElementById('pdfmeta-fields').style.display='block';
  }catch(e){pdfSetOut('pdfmeta','❌ Error: '+e.message);}
}
async function pdfSaveMeta(){
  const f=pdfFileStore['pdfmeta'];if(!f)return;
  try{
    const buf=await f.arrayBuffer();
    const pdf=await PDFLib.PDFDocument.load(buf,{ignoreEncryption:true});
    pdf.setTitle(document.getElementById('pdfmeta-title').value);
    pdf.setAuthor(document.getElementById('pdfmeta-author').value);
    pdf.setSubject(document.getElementById('pdfmeta-subject').value);
    pdf.setKeywords(document.getElementById('pdfmeta-keywords').value.split(',').map(k=>k.trim()));
    pdfDownload(await pdf.save(),'edited_metadata.pdf');
    pdfSetOut('pdfmeta','✅ Metadata saved! Download started.');
  }catch(e){pdfSetOut('pdfmeta','❌ Error: '+e.message);}
}

async function pdfImgToPDF(){
  const files=pdfFileArrays['pdfimg2pdf']||[];
  if(!files.length){pdfSetOut('pdfimg2pdf','⚠️ Please add image files.');return;}
  pdfSetOut('pdfimg2pdf','⏳ Converting...');
  try{
    const pdf=await PDFLib.PDFDocument.create();
    for(const f of files){
      const buf=await f.arrayBuffer();
      let img;
      if(f.type==='image/png')img=await pdf.embedPng(buf);
      else img=await pdf.embedJpg(buf);
      const page=pdf.addPage([img.width,img.height]);
      page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
    }
    pdfDownload(await pdf.save(),'images.pdf');
    pdfSetOut('pdfimg2pdf',`✅ ${files.length} image(s) converted! Download started.`);
  }catch(e){pdfSetOut('pdfimg2pdf','❌ Error: '+e.message);}
}

async function pdfRename(){
  const f=pdfFileStore['pdfrename'];if(!f){pdfSetOut('pdfrename','⚠️ Please select a PDF.');return;}
  const name=document.getElementById('pdfrename-name').value.trim();
  if(!name){pdfSetOut('pdfrename','⚠️ Please enter a filename.');return;}
  pdfDownload(new Uint8Array(await f.arrayBuffer()),name+'.pdf');
  pdfSetOut('pdfrename','✅ Renamed to "'+name+'.pdf"! Download started.');
}

// ===== CODE FORMATTER =====
function formatCode(){
  const code=document.getElementById('codefmt-input').value.trim();
  const lang=document.getElementById('codefmt-lang').value;
  if(!code){document.getElementById('codefmt-output').textContent='Please paste some code.';return;}
  try{
    if(lang==='json'){
      const parsed=JSON.parse(code);
      document.getElementById('codefmt-output').textContent=JSON.stringify(parsed,null,2);
      return;
    }
    if(lang==='html'){
      let out='';let indent=0;
      const tags=code.replace(/>\s*</g,'>\n<').split('\n');
      tags.forEach(line=>{
        line=line.trim();
        if(!line)return;
        if(line.match(/^<\//)&&indent>0)indent--;
        out+='  '.repeat(indent)+line+'\n';
        if(line.match(/^<[^/!][^>]*[^/]>$/)&&!line.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i))indent++;
      });
      document.getElementById('codefmt-output').textContent=out.trim();
      return;
    }
    if(lang==='css'){
      let out=code.replace(/\{/g,' {\n').replace(/\}/g,'}\n').replace(/;/g,';\n').replace(/\n\s*\n/g,'\n');
      const lines=out.split('\n');let ind=0;out='';
      lines.forEach(l=>{l=l.trim();if(!l)return;if(l==='}')ind=Math.max(0,ind-1);out+='  '.repeat(ind)+l+'\n';if(l.endsWith('{'))ind++;});
      document.getElementById('codefmt-output').textContent=out.trim();
      return;
    }
    if(lang==='sql'){
      const keywords=['SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','NOT','IN','BETWEEN','LIKE','ORDER BY','GROUP BY','HAVING','LIMIT','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','DROP TABLE','ALTER TABLE'];
      let out=code;
      keywords.forEach(k=>out=out.replace(new RegExp('\\b'+k+'\\b','gi'),'\n'+k.toUpperCase()));
      document.getElementById('codefmt-output').textContent=out.trim();
      return;
    }
    document.getElementById('codefmt-output').textContent=code;
  }catch(e){document.getElementById('codefmt-output').textContent='Error: '+e.message;}
}

// ===== NOTEPAD =====
(function initNotepad(){
  try{const saved=localStorage.getItem('utilixx_notepad');if(saved){const el=document.getElementById('notepad-input');if(el){el.value=saved;updateNotepadStats(saved);}}}catch(e){}
})();
function saveNotepad(){
  const v=document.getElementById('notepad-input').value;
  try{localStorage.setItem('utilixx_notepad',v);}catch(e){}
  updateNotepadStats(v);
  document.getElementById('notepad-status').textContent='✅ Saved at '+new Date().toLocaleTimeString();
}
function updateNotepadStats(v){
  document.getElementById('notepad-words').textContent=v.trim()?v.trim().split(/\s+/).length:0;
  document.getElementById('notepad-chars').textContent=v.length;
  document.getElementById('notepad-lines').textContent=v.split('\n').length;
}
function clearNotepad(){if(confirm('Clear all notes?')){document.getElementById('notepad-input').value='';saveNotepad();}}

// ===== HTML LIVE PREVIEW =====
function updateHtmlPreview(){
  const html=document.getElementById('htmlprev-input').value;
  const frame=document.getElementById('htmlprev-frame');
  const doc=frame.contentDocument||frame.contentWindow.document;
  doc.open();doc.write(`<style>body{font-family:system-ui;padding:12px;margin:0;font-size:14px;line-height:1.6;}*{box-sizing:border-box;}</style>${html}`);doc.close();
}

// ===== WORD FREQUENCY ANALYZER =====
const STOP_WORDS=new Set('i me my myself we our ours ourselves you your yours yourself yourselves he him his himself she her hers herself it its itself they them their theirs themselves what which who whom this that these those am is are was were be been being have has had having do does did doing a an the and but if or because as until while of at by for with about against between into through during before after above below to from up down in out on off over under again further then once here there when where why how all both each few more most other some such no nor not only own same so than too very s t can will just don should now d ll m o re ve y ain aren couldn didn doesn hadn hasn haven isn ma mightn mustn needn shan shouldn wasn weren won wouldn'.split(' '));
function analyzeWordFreq(){
  const text=document.getElementById('wfreq-input').value.toLowerCase();
  const top=parseInt(document.getElementById('wfreq-top').value)||15;
  const minLen=parseInt(document.getElementById('wfreq-minlen').value)||4;
  const filterStop=document.getElementById('wfreq-stop').checked;
  const words=text.match(/\b[a-z]{2,}\b/g)||[];
  const freq={};
  words.forEach(w=>{if(w.length>=minLen&&(!filterStop||!STOP_WORDS.has(w)))freq[w]=(freq[w]||0)+1;});
  const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,top);
  if(!sorted.length){document.getElementById('wfreq-chart').innerHTML='<p style="color:var(--muted);font-size:13px;text-align:center;padding:16px;">No words found. Try reducing minimum length.</p>';return;}
  const max=sorted[0][1];
  const colors=['#f0ff44','#44f0c8','#ff6b6b','#b464f0','#6495ed','#50d890','#f4a040'];
  let html='<div style="font-size:12px;">';
  sorted.forEach(([word,count],i)=>{
    const pct=Math.round(count/max*100);
    const color=colors[i%colors.length];
    html+=`<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-weight:600;color:var(--text);">${word}</span>
        <span style="color:var(--muted);">${count}×</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.5s;"></div>
      </div>
    </div>`;
  });
  html+=`</div><div style="margin-top:10px;font-size:11px;color:var(--muted);">Total words: ${words.length} · Unique: ${Object.keys(freq).length}</div>`;
  document.getElementById('wfreq-chart').innerHTML=html;
}

// ===== IMAGE CROPPER =====
let cropImg=null,cropFile=null,cropRatio='free';
let cropStartX=0,cropStartY=0,cropCurX=0,cropCurY=0,isCropping=false,isDragging=false;
let cropX=0,cropY=0,cropW=0,cropH=0;
function loadCropImage(input){
  const f=input.files[0];if(!f)return;
  cropFile=f;
  const img=document.getElementById('imgcrop-img');
  img.onload=()=>{
    cropImg=img;
    document.querySelector('.ws-dropzone[onclick*="imgcrop"]').style.display='none';
    document.getElementById('imgcrop-workspace').style.display='block';
    updateCropStats();
    setupCropEvents();
  };
  img.src=URL.createObjectURL(f);
}
function setupCropEvents(){
  const container=document.getElementById('imgcrop-container');
  const sel=document.getElementById('imgcrop-selection');
  container.onmousedown=e=>{
    const rect=container.getBoundingClientRect();
    cropStartX=e.clientX-rect.left;cropStartY=e.clientY-rect.top;
    isCropping=true;sel.style.display='block';
    e.preventDefault();
  };
  document.onmousemove=e=>{
    if(!isCropping)return;
    const rect=container.getBoundingClientRect();
    cropCurX=Math.max(0,Math.min(e.clientX-rect.left,rect.width));
    cropCurY=Math.max(0,Math.min(e.clientY-rect.top,rect.height));
    let x=Math.min(cropStartX,cropCurX),y=Math.min(cropStartY,cropCurY);
    let w=Math.abs(cropCurX-cropStartX),h=Math.abs(cropCurY-cropStartY);
    if(cropRatio!=='free'&&w>0){
      const[rw,rh]=cropRatio.split(':').map(Number);
      h=w*rh/rw;
      if(y+h>rect.height)h=rect.height-y;
    }
    cropX=x;cropY=y;cropW=w;cropH=h;
    sel.style.left=x+'px';sel.style.top=y+'px';sel.style.width=w+'px';sel.style.height=h+'px';
    const scaleX=cropImg.naturalWidth/rect.width;const scaleY=cropImg.naturalHeight/rect.height;
    document.getElementById('imgcrop-stats').innerHTML=`<div class="ws-stat"><strong>${Math.round(w*scaleX)}</strong>Crop W</div><div class="ws-stat"><strong>${Math.round(h*scaleY)}</strong>Crop H</div><div class="ws-stat"><strong>${cropImg.naturalWidth}×${cropImg.naturalHeight}</strong>Original</div>`;
  };
  document.onmouseup=()=>{isCropping=false;};
}
function setCropRatio(r){
  cropRatio=r;
  document.querySelectorAll('#ws-imgcrop .ws-btn').forEach(b=>b.style.borderColor='');
  event.target.style.borderColor='var(--accent)';
}
function updateCropStats(){
  if(!cropImg)return;
  document.getElementById('imgcrop-stats').innerHTML=`<div class="ws-stat"><strong>${cropImg.naturalWidth}×${cropImg.naturalHeight}</strong>Original Size</div>`;
}
function cropImage(){
  if(!cropImg||cropW<2||cropH<2){document.getElementById('imgcrop-output').textContent='⚠️ Please drag to select a crop area first.';return;}
  const container=document.getElementById('imgcrop-container');
  const rect=container.getBoundingClientRect();
  const scaleX=cropImg.naturalWidth/rect.width;const scaleY=cropImg.naturalHeight/rect.height;
  const canvas=document.getElementById('mainCanvas');
  canvas.width=Math.round(cropW*scaleX);canvas.height=Math.round(cropH*scaleY);
  canvas.getContext('2d').drawImage(cropImg,cropX*scaleX,cropY*scaleY,cropW*scaleX,cropH*scaleY,0,0,canvas.width,canvas.height);
  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    document.getElementById('imgcrop-output').innerHTML=`✅ Cropped to ${canvas.width}×${canvas.height}px (${(blob.size/1024).toFixed(1)}KB)<br/><a href="${url}" download="cropped.png"><button class="ws-btn" style="margin-top:8px;">⬇ Download Cropped Image</button></a>`;
  });
}

// ===== AI SOCIAL MEDIA CAPTIONS =====
async function aiCaptions(){
  const topic=document.getElementById('captions-input').value.trim();
  const platform=document.getElementById('captions-platform').value;
  const tone=document.getElementById('captions-tone').value;
  const hashtags=document.getElementById('captions-hashtags').checked;
  if(!topic){document.getElementById('captions-output').textContent='Please describe your post topic.';return;}
  document.getElementById('captions-output').textContent='⏳ AI is writing captions...';
  const hashtagNote=hashtags?'Include 5-10 relevant hashtags at the end of each caption.':'Do not include hashtags.';
  const result=await callAI(`Generate exactly 3 ${tone} ${platform} captions for this topic: "${topic}". ${hashtagNote} Format as:\n\nCaption 1:\n[caption text]\n\nCaption 2:\n[caption text]\n\nCaption 3:\n[caption text]\n\nOnly provide the captions, nothing else.`);
  document.getElementById('captions-output').textContent=result;
}

// ===== ROMAN NUMERAL CONVERTER =====
const romanVals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
function toRoman(num){
  if(num<1||num>3999)return'Out of range (1–3999)';
  let result='';
  for(const[val,sym]of romanVals){while(num>=val){result+=sym;num-=val;}}
  return result;
}
function fromRoman(str){
  const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  str=str.toUpperCase();
  let result=0;
  for(let i=0;i<str.length;i++){
    const curr=map[str[i]];const next=map[str[i+1]];
    if(!curr)return null;
    if(next&&curr<next){result+=next-curr;i++;}
    else result+=curr;
  }
  return result;
}
function convertRoman(){
  const mode=document.querySelector('#ws-roman [data-tab="roman-mode"]')?.dataset.val||'to-roman';
  const input=document.getElementById('roman-input').value.trim();
  const output=document.getElementById('roman-output');
  const breakdown=document.getElementById('roman-breakdown');
  if(!input){output.textContent='';breakdown.textContent='';return;}
  // Auto-detect mode
  if(/^[0-9]+$/.test(input)){
    const num=parseInt(input);
    const roman=toRoman(num);
    output.textContent=roman;
    breakdown.textContent=`${num} in Roman numerals`;
  } else if(/^[IVXLCDM]+$/i.test(input)){
    const num=fromRoman(input);
    if(num===null){output.textContent='Invalid Roman numeral';breakdown.textContent='';}
    else{output.textContent=num;breakdown.textContent=`${input.toUpperCase()} = ${num}`;}
  } else {
    output.textContent='Enter a number (1–3999) or Roman numeral';breakdown.textContent='';
  }
}

// ===== TIP & BILL SPLITTER =====
function setTipPct(pct){document.getElementById('tip-pct').value=pct;document.getElementById('tip-pct-val').textContent=pct;calcTip();}
function calcTip(){
  const bill=parseFloat(document.getElementById('tip-bill').value)||0;
  const pct=parseFloat(document.getElementById('tip-pct').value)||0;
  const people=parseInt(document.getElementById('tip-people').value)||1;
  const curr=document.getElementById('tip-currency').value;
  if(!bill){document.getElementById('tip-output').textContent='Please enter a bill amount.';return;}
  const tipAmt=bill*pct/100;
  const total=bill+tipAmt;
  const perPerson=total/people;
  const tipPerPerson=tipAmt/people;
  document.getElementById('tip-output').innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
<div class="result-card"><h4>Tip Amount</h4><div style="font-size:22px;font-family:Syne;font-weight:800;color:var(--accent);">${curr}${tipAmt.toFixed(2)}</div></div>
<div class="result-card"><h4>Total Bill</h4><div style="font-size:22px;font-family:Syne;font-weight:800;color:var(--text);">${curr}${total.toFixed(2)}</div></div>
<div class="result-card"><h4>Per Person</h4><div style="font-size:22px;font-family:Syne;font-weight:800;color:var(--accent2);">${curr}${perPerson.toFixed(2)}</div></div>
<div class="result-card"><h4>Tip Per Person</h4><div style="font-size:22px;font-family:Syne;font-weight:800;color:var(--muted);">${curr}${tipPerPerson.toFixed(2)}</div></div>
</div>`;
}

// ===== COLOR TEMPERATURE CONVERTER =====
function setColorTemp(k){document.getElementById('colortemp-slider').value=k;document.getElementById('colortemp-val').textContent=k;updateColorTemp();}
function kelvinToRgb(k){
  k=k/100;let r,g,b;
  if(k<=66){r=255;g=Math.min(255,Math.max(0,99.4708025861*Math.log(k)-161.1195681661));}
  else{r=Math.min(255,Math.max(0,329.698727446*Math.pow(k-60,-0.1332047592)));g=Math.min(255,Math.max(0,288.1221695283*Math.pow(k-60,-0.0755148492)));}
  if(k>=66)b=255;
  else if(k<=19)b=0;
  else b=Math.min(255,Math.max(0,138.5177312231*Math.log(k-10)-305.0447927307));
  return[Math.round(r),Math.round(g),Math.round(b)];
}
function updateColorTemp(){
  const k=parseInt(document.getElementById('colortemp-slider').value);
  document.getElementById('colortemp-val').textContent=k;
  const[r,g,b]=kelvinToRgb(k);
  const hex=`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  document.getElementById('colortemp-preview').style.background=`rgb(${r},${g},${b})`;
  let label='',use='',emoji='';
  if(k<=1900){label='Candlelight';use='Romantic, moody photography';emoji='🕯️';}
  else if(k<=2500){label='Warm White / Incandescent';use='Home lighting, warm portraits';emoji='💡';}
  else if(k<=3200){label='Halogen / Tungsten';use='Studio warm lighting';emoji='🎬';}
  else if(k<=4000){label='Fluorescent / Cool White';use='Office lighting, product shots';emoji='🏢';}
  else if(k<=5000){label='Horizon Daylight';use='Morning/evening sunlight';emoji='🌅';}
  else if(k<=5500){label='Direct Sunlight / Flash';use='Outdoor photography, neutral';emoji='☀️';}
  else if(k<=6500){label='Overcast Sky / Daylight';use='Cloudy day, natural colors';emoji='🌤️';}
  else if(k<=7500){label='Slightly Overcast';use='Shade, slightly cool tones';emoji='🌥️';}
  else if(k<=10000){label='Blue Sky / Shade';use='Deep shade, very cool blue tones';emoji='🔵';}
  else{label='Clear Blue Sky';use='Extreme blue tones, artistic use';emoji='🌌';}
  document.getElementById('colortemp-output').innerHTML=`<strong>${emoji} ${label}</strong>\nKelvin: ${k}K\nRGB: rgb(${r}, ${g}, ${b})\nHEX: ${hex.toUpperCase()}\n\n💡 Use for: ${use}`;
}
// Init color temp on load
setTimeout(()=>{if(document.getElementById('colortemp-slider'))updateColorTemp();},100);

// ===== QUICK TTS =====
// Load voices whenever they become available
function loadQTTSVoices(){
  const voices=window.speechSynthesis.getVoices();
  const sel=document.getElementById('qtts-voice');
  if(!sel||!voices.length)return;
  const prev=sel.value;
  sel.innerHTML='';
  // Group by language
  const grouped={};
  voices.forEach((v,i)=>{
    const lang=v.lang.split('-')[0].toUpperCase();
    if(!grouped[lang])grouped[lang]=[];
    grouped[lang].push({v,i});
  });
  // Add English first, then others
  const langs=Object.keys(grouped).sort((a,b)=>a==='EN'?-1:b==='EN'?1:a.localeCompare(b));
  langs.forEach(lang=>{
    const grp=document.createElement('optgroup');
    grp.label=lang;
    grouped[lang].forEach(({v,i})=>{
      const opt=document.createElement('option');
      opt.value=i;
      opt.textContent=v.name.replace('Microsoft ','').replace('Google ','').replace('Apple ','');
      if(v.default)opt.selected=true;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  });
  if(prev)sel.value=prev;
  const out=document.getElementById('qtts-output');
  if(out&&!out.textContent)out.textContent='✅ '+voices.length+' voices loaded. Ready to speak!';
}
// Try loading immediately and also on voiceschanged
window.speechSynthesis.onvoiceschanged=loadQTTSVoices;
setTimeout(loadQTTSVoices,300);
setTimeout(loadQTTSVoices,1000);
// Also reload when user opens the tool
const _origT=window.T||function(){};
window.T=function(id){
  _origT(id);
  if(id==='quicktts')setTimeout(loadQTTSVoices,100);
};

function quickSpeak(){
  const text=document.getElementById('qtts-text').value.trim();
  if(!text){document.getElementById('qtts-output').textContent='⚠️ Please enter some text first.';return;}
  if(!window.speechSynthesis){document.getElementById('qtts-output').textContent='❌ Your browser does not support Speech Synthesis.';return;}
  window.speechSynthesis.cancel();
  setTimeout(()=>{
    const u=new SpeechSynthesisUtterance(text);
    const voices=window.speechSynthesis.getVoices();
    const idx=parseInt(document.getElementById('qtts-voice').value);
    if(voices[idx])u.voice=voices[idx];
    u.rate=parseFloat(document.getElementById('qtts-speed').value)||1;
    u.pitch=parseFloat(document.getElementById('qtts-pitch').value)||1;
    u.volume=1;
    const words=text.split(/\s+/).length;
    const estSec=Math.round(words/(u.rate*2.5));
    document.getElementById('qtts-output').textContent='🔊 Speaking ~'+estSec+'s...';
    u.onstart=()=>document.getElementById('qtts-output').textContent='🔊 Speaking...';
    u.onend=()=>document.getElementById('qtts-output').textContent='✅ Finished speaking!';
    u.onerror=(e)=>{if(e.error!=='interrupted')document.getElementById('qtts-output').textContent='❌ Error: '+e.error;};
    window.speechSynthesis.speak(u);
  },50);
}

function quickPause(){
  if(!window.speechSynthesis){return;}
  if(window.speechSynthesis.speaking){
    if(window.speechSynthesis.paused){
      window.speechSynthesis.resume();
      document.getElementById('qtts-output').textContent='🔊 Resumed...';
    } else {
      window.speechSynthesis.pause();
      document.getElementById('qtts-output').textContent='⏸ Paused — click Resume to continue';
    }
  } else {
    document.getElementById('qtts-output').textContent='⚠️ Nothing is playing.';
  }
}

function quickStop(){
  window.speechSynthesis.cancel();
  document.getElementById('qtts-output').textContent='⏹ Stopped.';
}

// ===== SPEECH TIME ESTIMATOR =====
function calcSpeechTime(){
  const text=document.getElementById('stime-input').value.trim();
  const wpm=parseInt(document.getElementById('stime-speed').value)||130;
  if(!text){document.getElementById('stime-output').textContent='';return;}
  const words=text.split(/\s+/).filter(w=>w).length;
  const chars=text.length;
  const sentences=(text.match(/[.!?]+/g)||[]).length||1;

  function fmt(sec){
    const m=Math.floor(sec/60),s=sec%60;
    return m>0?(s>0?`${m}m ${s}s`:`${m}m`):`${s}s`;
  }

  const totalSec=Math.ceil((words/wpm)*60);
  document.getElementById('stime-output').innerHTML=
    `<div style="font-size:28px;font-family:'Syne',sans-serif;font-weight:800;color:var(--accent);margin-bottom:4px;">${fmt(totalSec)}</div>`+
    `<div style="font-size:13px;color:var(--muted);margin-bottom:12px;">at ${wpm} words per minute</div>`+
    `<div style="font-size:13px;line-height:2;color:var(--text);">`+
    `📝 Words: <strong>${words.toLocaleString()}</strong> &nbsp;|&nbsp; `+
    `🔤 Characters: <strong>${chars.toLocaleString()}</strong> &nbsp;|&nbsp; `+
    `💬 Sentences: <strong>${sentences}</strong></div>`+
    `<div style="margin-top:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--border);padding-top:10px;">`+
    `🐌 Slow (100 wpm): ${fmt(Math.ceil(words/100*60))}<br/>`+
    `🚶 Average (130 wpm): ${fmt(Math.ceil(words/130*60))}<br/>`+
    `🏃 Fast (160 wpm): ${fmt(Math.ceil(words/160*60))}<br/>`+
    `🎤 Presentation (120 wpm): ${fmt(Math.ceil(words/120*60))}<br/>`+
    `📢 Podcast (150 wpm): ${fmt(Math.ceil(words/150*60))}`+
    `</div>`;
}
