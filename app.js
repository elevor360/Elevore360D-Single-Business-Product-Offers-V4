let data={businesses:[],capacity:200};let shopSettings=null,advertSettings={adverts:[]};const sessionRefresh=Date.now();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
async function load(){
 try{const r=await fetch(`businesses.json?fresh=${Date.now()}`,{cache:'no-store'});data=await r.json();}
 catch(e){console.warn('Using cached/offline data if available',e)}
 await Promise.all([loadExtra('business-settings.json',v=>shopSettings=v),loadExtra('advert-settings.json',v=>advertSettings=v)]);
 render();
}
async function loadExtra(file,fn){try{const r=await fetch(file+'?fresh='+Date.now(),{cache:'no-store'});if(r.ok)fn(await r.json())}catch(e){console.warn('Optional settings unavailable',file,e)}}
function active(){return (data.businesses||[]).filter(b=>b.active!==false)}
function img(b){return `${b.image}?v=${encodeURIComponent((data.version||'1.4.0')+'-'+sessionRefresh)}`}
function render(){
 const bs=active(), featured=bs.filter(b=>b.featured);renderShop();
 $('#updated').textContent=`Offers updated: ${data.updated||'recently'}`;
 $('#count').textContent=`${bs.length} participating businesses`;
 $('#adminCount').textContent=`Advertising spaces: ${bs.length} / ${data.capacity||200}`;
 const cats=['All',...new Set(bs.map(b=>b.category).filter(Boolean))];
 $('#categories').innerHTML=cats.map((c,i)=>`<button class="chip ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');
 $$('#categories button').forEach(x=>x.onclick=()=>{ $$('#categories button').forEach(y=>y.classList.remove('active'));x.classList.add('active');filter()});
 $('#featuredWrap').style.display=featured.length?'block':'none';
 $('#featured').innerHTML=featured.map(card).join('');
 renderListing(bs);
 $$('.deal-card').forEach(c=>c.onclick=()=>openBusiness(+c.dataset.id));
}
function card(b){return `<article class="deal-card" data-id="${b.id}">
 <img src="${img(b)}" alt="${b.name}">
 <div class="cardbody"><span class="category">${b.category||'Local Business'}</span>
 <h3>${b.name}</h3><div class="discount">${b.discount}% OFF</div>
 <p>${b.offer||''}</p></div></article>`}
function filter(){
 const q=$('#search').value.trim().toLowerCase(), cat=$('#categories .active')?.dataset.cat||'All';
 const visible=active().filter(b=>(!q||`${b.name} ${b.description||''} ${b.category||''}`.toLowerCase().includes(q))&&(cat==='All'||b.category===cat));renderListing(visible)
}

function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeUrl(v){try{const u=new URL(String(v),location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
function safeMedia(v){const f=String(v||'').trim();return /^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.(jpg|jpeg|png|webp|mp4|webm)$/i.test(f)?f:''}
function renderShop(){const d=document.getElementById('shopDetails');if(!d)return;const s=shopSettings;if(!s||!Object.values(s).some(Boolean)){d.hidden=true;return}d.hidden=false;const logo=safeMedia(s.logo);d.innerHTML=(logo?`<img src="${logo}" alt="Business logo" onerror="this.hidden=true">`:'')+`<div><strong>${safeText(s.name||'Local Deals')}</strong><p>${safeText(s.address||'')}</p><p>${s.phone?`<a href="tel:${safeText(String(s.phone).replace(/[^+\d]/g,''))}">${safeText(s.phone)}</a>`:''}${s.email?` &nbsp; <a href="mailto:${safeText(s.email)}">${safeText(s.email)}</a>`:''}</p></div>`}
function renderListing(bs){const ads=Array.isArray(advertSettings?.adverts)?advertSettings.adverts:[];let result='';bs.forEach((b,i)=>{result+=card(b);if(i===bs.length-1)return;const a=ads.find(x=>Number(x.position)===i+1&&x.enabled===true);if(!a)return;const filename=safeMedia(a.filename);if(!filename)return;const isVideo=/\.(mp4|webm)$/i.test(filename);const media=isVideo?`<video controls preload="metadata" playsinline src="${filename}"></video>`:`<img loading="lazy" src="${filename}" alt="${safeText(a.title||'Advertisement')}">`;const link=safeUrl(a.link);result+=`<aside class="listing-ad"><span class="ad-label">Advertisement</span>${a.title?`<h3>${safeText(a.title)}</h3>`:''}${link?`<a href="${safeText(link)}" target="_blank" rel="noopener noreferrer">${media}</a>`:media}${a.description?`<p>${safeText(a.description)}</p>`:''}${link?`<a class="ad-link" href="${safeText(link)}" target="_blank" rel="noopener noreferrer">Visit advertiser</a>`:''}</aside>`});$('#grid').innerHTML=result;$$('#grid .deal-card').forEach(c=>c.onclick=()=>openBusiness(+c.dataset.id))}

$('#search').addEventListener('input',filter);
function openBusiness(id){
 const b=active().find(x=>x.id===id); if(!b)return;
 $('#directory').hidden=true; $('#detail').hidden=false;
 $('#detail').innerHTML=`<button class="back" onclick="back()">← Back to deals</button>
 <div class="detailHero"><img src="${img(b)}" alt="${b.name}"></div>
 <div class="detailBody"><span class="category">${b.category||''}</span><h2>${b.name}</h2>
 <div class="bigDiscount">${b.discount}% OFF</div><p class="lead">${b.description||''}</p>
 <button class="showOffer" onclick="showOffer(${b.id})">SHOW THIS APP IN STORE</button>
 <div class="actions">
 ${b.phone?`<a href="tel:${b.phone.replace(/[^+\d]/g,'')}">Call</a>`:''}
 ${b.website?`<a href="${b.website}" target="_blank" rel="noopener">Website</a>`:''}
 ${b.address?`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">Directions</a>`:''}
 <button onclick="shareDeal(${b.id})">Share</button></div>
 <div class="info"><p><b>Address:</b> ${b.address||'Ask business'}</p><p><b>Opening hours:</b> ${b.openingHours||'Contact business'}</p>
 <p><b>Offer:</b> ${b.offer||''}</p><p><b>Terms:</b> ${b.terms||'Show this app before payment.'}</p>
 ${b.expires?`<p><b>Valid until:</b> ${b.expires}</p>`:''}</div></div>`;
 scrollTo(0,0);
}
function back(){ $('#detail').hidden=true;$('#directory').hidden=false;scrollTo(0,0)}
function showOffer(id){
 const b=active().find(x=>x.id===id);
 $('#offerModal').innerHTML=`<div class="offerBox"><img src="elevore360d-logo.jpg"><div class="valid">LIVE LOCAL DEAL</div><h2>${b.name}</h2><div class="offerPct">${b.discount}% OFF</div><p>${b.offer||''}</p><strong>SHOW THIS SCREEN BEFORE PAYMENT</strong><small>${b.terms||''}${b.expires?' • Valid until '+b.expires:''}</small><button onclick="closeOffer()">Close</button></div>`;
 $('#offerModal').classList.add('open');
}
function closeOffer(){$('#offerModal').classList.remove('open')}
async function shareDeal(id){const b=active().find(x=>x.id===id),t=`${b.name}: ${b.discount}% off with Elevore360D Local Deals`;if(navigator.share){try{await navigator.share({title:b.name,text:t,url:location.href})}catch(e){}}else{navigator.clipboard?.writeText(t+' '+location.href);alert('Deal copied to clipboard.');}}
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');
load();
document.addEventListener('DOMContentLoaded',()=>{const m=document.getElementById('shareAppModal'),o=document.getElementById('shareAppBtn'),c=document.getElementById('closeShareApp'),b=document.getElementById('backToDeals');const hide=()=>{if(m)m.hidden=true};if(o)o.addEventListener('click',()=>{if(m)m.hidden=false});if(c)c.addEventListener('click',hide);if(b)b.addEventListener('click',hide);if(m)m.addEventListener('click',e=>{if(e.target===m)hide()})});
