// ===== 物流调研计划工作台 =====
(function(){
"use strict";
const STORE_KEY = "surveyPlanState";
const STEPS = [
  {id:"s1", label:"基本信息", num:1},
  {id:"s2", label:"城市总览", num:2},
  {id:"s3", label:"产业勾选", num:3},
  {id:"s4", label:"物流园区", num:4},
  {id:"s5", label:"快递节点", num:5},
  {id:"s6", label:"政府部门", num:6},
  {id:"sum", label:"汇总导出", num:7}
];
const PROVINCES = [...new Set(Object.values(CITY_DATA.cities).map(c=>c.meta.province))]; // 已有知识库城市的省份

// ---- state ----
let state = loadState();
function defaultState(){
  return {
    province: PROVINCES[0] || "", city: "", district: "", site: "",
    dateStart: "", dateEnd: "", period: "", team: "",
    industries: {},   // {name:{checked,N}}
    commerce: {},
    order: {},        // {groupKey:[firmName...]} 主备选调换后的顺序
    parks: {},        // {name:true}
    nodes: {},        // {brand|name:true}
    gov: {},          // {dept|idx:true}
    curStep: 0
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  }catch(e){ return defaultState(); }
}
let saveTimer = null;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
    const el = document.getElementById("saveHint");
    if(el){ el.textContent = "已自动保存 " + new Date().toLocaleTimeString("zh-CN",{hour12:false}); }
  }, 250);
}
function cityData(){ return state.city ? CITY_DATA.cities[state.city] : null; }
function cityReady(){ return !!cityData(); }
function ensureCityState(){
  const c = cityData(); if(!c) return;
  // 初始化勾选结构（保留已有值）
  [...c.surveyIndustries, ...c.surveyCommerce].forEach(g=>{
    const pool = c.surveyIndustries.includes(g) ? state.industries : state.commerce;
    if(!pool[g.name]) pool[g.name] = {checked:false, N:3};
    if(!state.order[g.name]) state.order[g.name] = null;
  });
  c.parks.forEach(p=>{ if(!(p.name in state.parks)) state.parks[p.name]=false; });
  c.expressNodes.forEach(b=>b.nodes.forEach(n=>{
    const k = b.brand+"|"+n.name; if(!(k in state.nodes)) state.nodes[k]=false; }));
  c.governmentDepartments.forEach(d=>d.items.forEach((it,i)=>{
    const k = d.dept+"|"+i; if(!(k in state.gov)) state.gov[k]=true; }));
}

// ---- utils ----
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function el(id){ return document.getElementById(id); }
function assignPrimaryBackup(firms, N){
  const sorted = [...firms].sort((a,b)=>a.tier-b.tier);
  return { primary: sorted.slice(0,N), backup: sorted.slice(N, N+Math.ceil(N/2)) };
}
function orderedFirms(group, isIndustry){
  const pool = isIndustry ? state.industries : state.commerce;
  const cfg = pool[group.name] || {checked:false,N:3};
  const ord = state.order[group.name];
  if(ord && ord.length === group.firms.length){
    const map = {}; group.firms.forEach(f=>map[f.name]=f);
    return ord.map(n=>map[n]).filter(Boolean);
  }
  return [...group.firms].sort((a,b)=>a.tier-b.tier);
}

// ---- 导航 ----
let curStep = 0;
function renderStepBar(){
  el("stepBar").innerHTML = STEPS.map((s,i)=>{
    const cls = i===curStep ? "step-tab active" : "step-tab" + (stepDone(i) ? " done" : "");
    return '<div class="'+cls+'" data-i="'+i+'"><span class="num">'+(stepDone(i)&&i!==curStep?"✓":s.num)+'</span>'+s.label+'</div>';
  }).join("");
  document.querySelectorAll(".step-tab").forEach(t=>{
    t.addEventListener("click", ()=>{ gotoStep(parseInt(t.dataset.i,10)); });
  });
}
function stepDone(i){
  if(i===0) return !!state.city;
  return true;
}
function gotoStep(i){
  if(i<0||i>=STEPS.length) return;
  // 进入2-6步需先选城市
  if(i>=1 && i<=5 && !cityReady()){ curStep=0; renderAll(); alert("请先在第1步选择项目所在城市"); return; }
  curStep = i; state.curStep = i; save(); renderAll();
  window.scrollTo({top:0});
}

// ---- 渲染入口 ----
function renderAll(){
  renderStepBar();
  const box = el("sections");
  box.innerHTML = STEPS.map(s=>'<div class="section" id="'+s.id+'"></div>').join("");
  renderStep1(); renderStep2(); renderStep3(); renderStep4(); renderStep5(); renderStep6(); renderSummary();
  document.querySelectorAll(".section").forEach((d,i)=>{ d.classList.toggle("active", i===curStep); });
  el("btnPrev").style.visibility = curStep===0 ? "hidden":"visible";
  el("btnNext").textContent = curStep===STEPS.length-1 ? "导出 Word 调研计划" : "下一步 →";
  const badge = el("cityBadge");
  badge.textContent = state.city ? state.city + (state.district?(" · "+state.district):"") : "未选择城市";
}

// ===== 第1步 基本信息 =====
function renderStep1(){
  const s = el("s1");
  const citiesInProvince = Object.keys(CITY_DATA.cities).filter(x=>CITY_DATA.cities[x].meta.province===state.province);
  if(state.city && !citiesInProvince.includes(state.city)) state.province = CITY_DATA.cities[state.city].meta.province;
  const cities = citiesInProvince;
  const c = cityData();
  const districts = c ? c.overview.districts : [];
  s.innerHTML =
    '<div class="card"><h2>1. 项目基本信息</h2>'+
    '<div class="form-grid">'+
    '<div class="form-item"><label>省份</label><select id="inProvince">'+PROVINCES.map(p=>'<option '+(state.province===p?"selected":"")+'>'+p+'</option>').join("")+'</select></div>'+
    '<div class="form-item"><label>城市（知识库已收录）</label><select id="inCity"><option value="">请选择城市</option>'+cities.map(x=>'<option value="'+esc(x)+'" '+(state.city===x?"selected":"")+'>'+esc(x)+'</option>').join("")+'</select></div>'+
    '<div class="form-item"><label>区县</label><select id="inDistrict"><option value="">请选择区县</option>'+districts.map(d=>'<option '+(state.district===d?"selected":"")+'>'+esc(d)+'</option>').join("")+'</select></div>'+
    '<div class="form-item"><label>具体项目地块选址</label><input id="inSite" placeholder="可选，未定可跳过" value="'+esc(state.site)+'"></div>'+
    '</div></div>'+
    '<div class="card"><h2>调研安排</h2>'+
    '<div class="form-grid">'+
    '<div class="form-item"><label>调研开始时间</label><input type="date" id="inDateStart" value="'+esc(state.dateStart)+'"></div>'+
    '<div class="form-item"><label>调研结束时间</label><input type="date" id="inDateEnd" value="'+esc(state.dateEnd)+'"></div>'+
    '<div class="form-item"><label>调研周期</label><input id="inPeriod" placeholder="如：5个工作日" value="'+esc(state.period)+'"></div>'+
    '<div class="form-item" style="grid-column:1/-1"><label>调研人员（名单）</label><textarea id="inTeam" placeholder="如：李娜、于江涛、王茜、莫裔婷">'+esc(state.team)+'</textarea></div>'+
    '</div><p class="hint" style="margin-top:8px">选择城市后，第2-6步将自动加载该城市的调研知识库。</p></div>';
  el("inProvince").addEventListener("change", e=>{
    const p = e.target.value;
    if(p===state.province) return;
    const cityInP = state.city && CITY_DATA.cities[state.city] && CITY_DATA.cities[state.city].meta.province===p;
    if(cityInP){ state.province = p; save(); return; }
    if(state.city && hasAnySelection()){
      if(!confirm("切换省份将清空当前勾选状态，确认切换？")){ e.target.value = state.province; return; }
      const keep = {dateStart:state.dateStart,dateEnd:state.dateEnd,period:state.period,team:state.team,site:state.site};
      state = Object.assign(defaultState(), keep, {province:p, curStep:0});
    } else {
      state.province = p; state.city = ""; state.district = "";
    }
    save(); curStep = 0; renderAll();
  });
  el("inCity").addEventListener("change", e=>{
    const v = e.target.value;
    if(v && state.city && v!==state.city && hasAnySelection()){
      if(!confirm("切换城市将清空当前勾选状态，确认切换？")){ e.target.value = state.city; return; }
      const keep = {dateStart:state.dateStart,dateEnd:state.dateEnd,period:state.period,team:state.team,site:state.site};
      state = Object.assign(defaultState(), keep, {city:v, curStep:1});
    } else {
      state.city = v; state.district = "";
    }
    if(v) ensureCityState();
    save(); curStep = v?1:0; renderAll();
  });
  el("inDistrict").addEventListener("change", e=>{ state.district=e.target.value; save(); });
  el("inSite").addEventListener("input", e=>{ state.site=e.target.value; save(); });
  el("inDateStart").addEventListener("input", e=>{ state.dateStart=e.target.value; save(); });
  el("inDateEnd").addEventListener("input", e=>{ state.dateEnd=e.target.value; save(); });
  el("inPeriod").addEventListener("input", e=>{ state.period=e.target.value; save(); });
  el("inTeam").addEventListener("input", e=>{ state.team=e.target.value; save(); });
}
function hasAnySelection(){
  return Object.values(state.industries).some(v=>v.checked) || Object.values(state.commerce).some(v=>v.checked)
    || Object.values(state.parks).some(Boolean) || Object.values(state.nodes).some(Boolean);
}

// ===== 第2步 城市总览 =====
function renderStep2(){
  const s = el("s2"); const c = cityData();
  if(!c){ s.innerHTML=""; return; }
  const o = c.overview;
  let html = '<div class="card"><h2>2. '+esc(state.city)+'城市总览</h2>';
  html += '<h3>行政区划</h3><div>'+o.districts.map(d=>'<span class="tag">'+esc(d)+(state.district===d?"（项目所在）":"")+'</span>').join("")+'</div>';
  html += '<p class="hint" style="margin-top:6px">'+esc(o.locationNote)+'</p>';
  html += '<h3>物流枢纽定位</h3><p>'+esc(o.logisticsHub.positioning)+'</p><p style="font-size:13px;margin-top:4px">'+esc(o.logisticsHub.transport)+'</p>';
  html += '<ul style="font-size:13px;margin:6px 0 0 18px">'+o.logisticsHub.regionalRelations.map(r=>'<li>'+esc(r)+'</li>').join("")+'</ul>';
  html += '<p class="src">来源：'+esc(o.logisticsHub.source)+'</p></div>';

  const v = o.expressVolume;
  html += '<div class="card"><h3 style="margin-top:0">快递订单体量（邮政管理局口径）</h3><div class="kpi-row">'+
    '<div class="kpi"><div class="k-label">年快递业务量</div><div class="k-value">'+esc(v.annualVolume)+'</div><div class="k-sub">同比 '+esc(v.growth)+'</div></div>'+
    '<div class="kpi"><div class="k-label">日均快递单量</div><div class="k-value">'+esc(v.dailyAvg)+'</div><div class="k-sub">年量÷365推算</div></div>'+
    '<div class="kpi"><div class="k-label">快递业务收入</div><div class="k-value">'+esc(v.revenue)+'</div></div>'+
    '</div><p style="font-size:13px">'+esc(v.extra)+'</p><p class="src">来源：'+esc(v.source)+'</p></div>';

  html += '<div class="card"><h3 style="margin-top:0">产业概述</h3><div class="tbl-wrap"><table class="tbl"><tr><th>产业</th><th>规模</th><th>全国/全省地位</th><th>代表企业</th><th>分布区县</th></tr>'+
    o.industries.map(i=>'<tr><td><b>'+esc(i.name)+'</b></td><td>'+esc(i.scale)+'</td><td>'+esc(i.nationalPosition)+'</td><td>'+i.repFirms.map(esc).join('、')+'</td><td>'+i.counties.map(esc).join('、')+'</td></tr>').join("")+'</table></div></div>';

  const lv = {"高":"demand-high","中":"demand-mid","低":""};
  html += '<div class="card"><h3 style="margin-top:0">用仓需求企业（按需求强度排序）</h3>'+
    o.warehouseDemand.map(w=>'<div class="check-row" style="cursor:default"><div class="cr-main"><div class="cr-title">'+esc(w.segment)+' <span class="'+lv[w.demandLevel]+'">需求强度：'+esc(w.demandLevel)+'</span></div><div class="cr-sub">'+esc(w.analysis)+'</div></div></div>').join("")+'</div>';

  html += '<div class="card"><h3 style="margin-top:0">园区定位建议</h3>'+
    o.parkPositioningAdvice.map(a=>'<div class="check-row" style="cursor:default"><div class="cr-main"><div class="cr-title">方向：'+esc(a.direction)+'</div><div class="cr-sub">理由：'+esc(a.rationale)+'</div></div></div>').join("")+
    '<p class="hint">以上为调研准备阶段预置的深度分析结论，可在实地调研后修订。</p></div>';
  s.innerHTML = html;
}

// ===== 第3步 产业勾选 + 主备选 =====
function renderGroupCard(g, isIndustry){
  const pool = isIndustry ? state.industries : state.commerce;
  const cfg = pool[g.name] || {checked:false,N:3};
  const firms = orderedFirms(g, isIndustry);
  const N = Math.max(1, cfg.N|0);
  const backupN = Math.ceil(N/2);
  let rows = "";
  firms.forEach((f,i)=>{
    let badge = "", btn = "";
    if(i < N){ badge = '<span class="badge badge-primary">主选</span>'; btn = '<button class="swap-btn" data-g="'+esc(g.name)+'" data-i="'+i+'" data-mode="out">移出主选</button>'; }
    else if(i < N + backupN){ badge = '<span class="badge badge-backup">备选</span>'; btn = '<button class="swap-btn" data-g="'+esc(g.name)+'" data-i="'+i+'" data-mode="in">调为主选</button>'; }
    rows += '<div class="firm-row"><span class="f-name">'+esc(f.name)+'</span><span class="f-loc">'+esc(f.location)+'</span>'+badge+btn+'</div>';
  });
  return '<div class="card">'+
    '<div class="ind-head"><input type="checkbox" data-gcheck="'+esc(g.name)+'" data-isind="'+(isIndustry?1:0)+'" '+(cfg.checked?"checked":"")+' style="width:17px;height:17px;accent-color:var(--primary)">'+
    '<span class="cr-title">'+esc(g.name)+'（'+g.firms.length+'家）</span>'+
    '<label style="font-size:13px;color:var(--sub)">目标调研企业数 N = <input type="number" min="1" max="'+g.firms.length+'" class="n-input" data-gn="'+esc(g.name)+'" data-isind="'+(isIndustry?1:0)+'" value="'+N+'"></label>'+
    '<span class="hint">自动生成 N家主选 + '+backupN+'家备选</span></div>'+
    (g.note?'<p class="hint" style="margin:6px 0 0">'+esc(g.note)+'</p>':"")+
    (cfg.checked ? '<div class="firm-list">'+rows+'</div>' : "")+
    '</div>';
}
function bindGroupEvents(scope){
  scope.querySelectorAll("[data-gcheck]").forEach(cb=>{
    cb.addEventListener("change", e=>{
      const name = e.target.dataset.gcheck, isInd = e.target.dataset.isind==="1";
      (isInd?state.industries:state.commerce)[name].checked = e.target.checked; save(); renderAll();
    });
  });
  scope.querySelectorAll("[data-gn]").forEach(inp=>{
    inp.addEventListener("change", e=>{
      const name = e.target.dataset.gn, isInd = e.target.dataset.isind==="1";
      const g = (isInd?cityData().surveyIndustries:cityData().surveyCommerce).find(x=>x.name===name);
      const v = Math.min(g.firms.length, Math.max(1, parseInt(e.target.value,10)||1));
      (isInd?state.industries:state.commerce)[name].N = v; save(); renderAll();
    });
  });
  scope.querySelectorAll(".swap-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      const name = b.dataset.g, idx = parseInt(b.dataset.i,10), mode = b.dataset.mode;
      const all = [...cityData().surveyIndustries, ...cityData().surveyCommerce];
      const g = all.find(x=>x.name===name);
      const isInd = cityData().surveyIndustries.includes(g);
      const cfg = (isInd?state.industries:state.commerce)[name];
      const N = Math.max(1, cfg.N|0);
      let ord = orderedFirms(g, isInd).map(f=>f.name);
      const cur = state.order[name];
      if(cur && cur.length===g.firms.length) ord = cur;
      if(mode==="in"){ // 调为主选：移到主选末位（位置N-1）
        const [x] = ord.splice(idx,1); ord.splice(N-1,0,x);
      } else { // 移出主选：移到主选边界后（位置N）
        const [x] = ord.splice(idx,1); ord.splice(N,0,x);
      }
      state.order[name] = ord; save(); renderAll();
    });
  });
}
function renderStep3(){
  const s = el("s3"); const c = cityData();
  if(!c){ s.innerHTML=""; return; }
  let html = '<div class="card"><h2>3. 勾选要调研的产业并设定企业数量</h2><p class="hint">勾选产业后展开企业名单；按推荐度自动分配 N家主选 + 约N/2家备选（1.5倍冗余用于备选或前置协调未果时替换），可手动调换主备选。</p></div>';
  html += '<h3 style="margin:6px 0 10px;font-size:15px;color:var(--primary)">本地生产企业</h3>';
  html += c.surveyIndustries.map(g=>renderGroupCard(g,true)).join("");
  html += '<h3 style="margin:18px 0 10px;font-size:15px;color:var(--primary)">商贸流通企业</h3>';
  html += c.surveyCommerce.map(g=>renderGroupCard(g,false)).join("");
  s.innerHTML = html;
  bindGroupEvents(s);
}

// ===== 第4步 物流园区 =====
function renderStep4(){
  const s = el("s4"); const c = cityData();
  if(!c){ s.innerHTML=""; return; }
  let html = '<div class="card"><h2>4. 物流市场总览与物流园区勾选</h2>'+
    '<p style="font-size:13px">'+esc(c.overview.warehouseDemand[0].analysis)+'</p>'+
    '<p class="hint">现存/在建/规划园区清单如下，勾选拟调研的园区（详细市场数据见第2步城市总览）。</p></div>';
  ["现存","在建","规划"].forEach(st=>{
    const list = c.parks.filter(p=>p.status===st);
    if(!list.length) return;
    html += '<h3 class="park-status">'+st+'物流园区（'+list.length+'个）</h3>';
    list.forEach(p=>{
      html += '<div class="check-row"><input type="checkbox" data-park="'+esc(p.name)+'" '+(state.parks[p.name]?"checked":"")+'>'+
        '<div class="cr-main"><div class="cr-title">'+esc(p.name)+'</div>'+
        '<div class="cr-sub">地点：'+esc(p.location)+(p.positioning?(' · 定位：'+esc(p.positioning)):"")+'</div></div></div>';
    });
  });
  s.innerHTML = html;
  s.querySelectorAll("[data-park]").forEach(cb=>{
    cb.addEventListener("change", e=>{ state.parks[e.target.dataset.park]=e.target.checked; save(); });
  });
}

// ===== 第5步 快递节点 =====
function renderStep5(){
  const s = el("s5"); const c = cityData();
  if(!c){ s.innerHTML=""; return; }
  let html = '<div class="card"><h2>5. 快递物流企业节点勾选</h2><p class="hint">按品牌列出各快递企业在当地的枢纽节点（分拨中心/集配站/站点）及具体地点，勾选拟调研的节点。</p></div>';
  c.expressNodes.forEach(b=>{
    html += '<h3 class="park-status">'+esc(b.brand)+'</h3>';
    b.nodes.forEach(n=>{
      const k = b.brand+"|"+n.name;
      html += '<div class="check-row"><input type="checkbox" data-node="'+esc(k)+'" '+(state.nodes[k]?"checked":"")+'>'+
        '<div class="cr-main"><div class="cr-title"><span class="badge badge-type">'+esc(n.type)+'</span>'+esc(n.name)+'</div>'+
        '<div class="cr-sub">地点：'+esc(n.location)+(n.note?(' · '+esc(n.note)):"")+'</div></div></div>';
    });
  });
  s.innerHTML = html;
  s.querySelectorAll("[data-node]").forEach(cb=>{
    cb.addEventListener("change", e=>{ state.nodes[e.target.dataset.node]=e.target.checked; save(); });
  });
}

// ===== 第6步 政府部门 =====
function renderStep6(){
  const s = el("s6"); const c = cityData();
  if(!c){ s.innerHTML=""; return; }
  let html = '<div class="card"><h2>6. 政府部门调研清单勾选</h2><p class="hint">默认全部勾选；已经获取到的材料可取消勾选，导出时仅保留勾选项。</p></div>';
  c.governmentDepartments.forEach(d=>{
    html += '<div class="card"><h3 style="margin-top:0">'+esc(d.dept)+'</h3><p class="hint" style="margin-bottom:8px">调研目的：'+esc(d.purpose)+'</p>';
    d.items.forEach((it,i)=>{
      const k = d.dept+"|"+i;
      html += '<div class="check-row"><input type="checkbox" data-gov="'+esc(k)+'" '+(state.gov[k]?"checked":"")+'>'+
        '<div class="cr-main"><div class="cr-sub" style="font-size:13px;color:var(--text)"><b>（'+(i+1)+'）</b>'+esc(it)+'</div></div></div>';
    });
    html += '</div>';
  });
  s.innerHTML = html;
  s.querySelectorAll("[data-gov]").forEach(cb=>{
    cb.addEventListener("change", e=>{ state.gov[e.target.dataset.gov]=e.target.checked; save(); });
  });
}

// ===== 汇总与导出 =====
function collectSelection(){
  const c = cityData();
  const ind = c.surveyIndustries.filter(g=>state.industries[g.name] && state.industries[g.name].checked)
    .map(g=>{
      const N = Math.max(1, state.industries[g.name].N|0);
      const firms = orderedFirms(g, true);
      return { name:g.name, N,
        primary: firms.slice(0,N).map(f=>({name:f.name,location:f.location})),
        backup: firms.slice(N, N+Math.ceil(N/2)).map(f=>({name:f.name,location:f.location})) };
    });
  const com = c.surveyCommerce.filter(g=>state.commerce[g.name] && state.commerce[g.name].checked)
    .map(g=>{
      const N = Math.max(1, state.commerce[g.name].N|0);
      const firms = orderedFirms(g, false);
      return { name:g.name, N,
        primary: firms.slice(0,N).map(f=>({name:f.name,location:f.location})),
        backup: firms.slice(N, N+Math.ceil(N/2)).map(f=>({name:f.name,location:f.location})) };
    });
  const parks = c.parks.filter(p=>state.parks[p.name]);
  const nodes = [];
  c.expressNodes.forEach(b=>b.nodes.forEach(n=>{ if(state.nodes[b.brand+"|"+n.name]) nodes.push({brand:b.brand,type:n.type,name:n.name,location:n.location}); }));
  const gov = c.governmentDepartments.map(d=>({dept:d.dept, purpose:d.purpose, items:d.items.filter((it,i)=>state.gov[d.dept+"|"+i])})).filter(d=>d.items.length);
  return {ind, com, parks, nodes, gov};
}
function renderSummary(){
  const s = el("sum"); const c = cityData();
  if(!c){ s.innerHTML = '<div class="card"><h2>汇总导出</h2><p class="hint">请先在第1步选择城市。</p></div>'; return; }
  const sel = collectSelection();
  const pCount = sel.ind.reduce((a,g)=>a+g.primary.length,0) + sel.com.reduce((a,g)=>a+g.primary.length,0);
  const bCount = sel.ind.reduce((a,g)=>a+g.backup.length,0) + sel.com.reduce((a,g)=>a+g.backup.length,0);
  let html = '<div class="card"><h2>调研计划汇总</h2>'+
    '<div class="sum-grid">'+
    '<div class="sum-item"><div class="s-num">'+(sel.ind.length+sel.com.length)+'</div><div class="s-label">勾选产业/门类</div></div>'+
    '<div class="sum-item"><div class="s-num">'+pCount+'<span style="font-size:13px;color:var(--sub)">+'+bCount+'</span></div><div class="s-label">主选 / 备选企业</div></div>'+
    '<div class="sum-item"><div class="s-num">'+sel.parks.length+'</div><div class="s-label">物流园区</div></div>'+
    '<div class="sum-item"><div class="s-num">'+sel.nodes.length+'</div><div class="s-label">快递节点</div></div>'+
    '<div class="sum-item"><div class="s-num">'+sel.gov.length+'</div><div class="s-label">政府部门（保留'+sel.gov.reduce((a,d)=>a+d.items.length,0)+'项）</div></div>'+
    '</div>';
  html += '<h3>基本信息</h3><p style="font-size:13px">'+esc(state.city)+' '+esc(state.district)+(state.site?(' · '+esc(state.site)):"")+
    '｜调研时间：'+esc(state.dateStart||"待定")+' 至 '+esc(state.dateEnd||"待定")+(state.period?('（'+esc(state.period)+'）'):"")+
    (state.team?('｜调研人员：'+esc(state.team)):"")+'</p>';
  const groupRow = g=>'<tr><td>'+esc(g.name)+'（N='+g.N+'）</td><td>'+g.primary.map(f=>esc(f.name)).join("、")+'</td><td>'+g.backup.map(f=>esc(f.name)).join("、")+'</td></tr>';
  if(sel.ind.length||sel.com.length){
    html += '<h3>拟调研企业（主选/备选）</h3><div class="tbl-wrap"><table class="tbl"><tr><th>产业/门类</th><th>主选</th><th>备选</th></tr>'+
      sel.ind.map(groupRow).join("")+sel.com.map(groupRow).join("")+'</table></div>';
  } else { html += '<p class="hint" style="margin-top:8px">尚未勾选任何产业，请回到第3步。</p>'; }
  if(sel.parks.length) html += '<h3>拟调研物流园区（'+sel.parks.length+'个）</h3><p style="font-size:13px">'+sel.parks.map(p=>esc(p.name)+'（'+esc(p.status)+'·'+esc(p.location)+'）').join("；")+'</p>';
  if(sel.nodes.length) html += '<h3>拟调研快递节点（'+sel.nodes.length+'个）</h3><p style="font-size:13px">'+sel.nodes.map(n=>esc(n.brand)+'·'+esc(n.type)+'：'+esc(n.name)).join("；")+'</p>';
  html += '<div style="margin-top:16px"><button class="btn btn-primary" id="btnExport" style="font-size:15px;padding:10px 24px">导出 Word 调研计划</button>'+
    '<span class="hint" style="margin-left:10px" id="exportHint">生成 .docx 文件，结构对齐《项目调研计划》参考模板</span></div></div>';
  s.innerHTML = html;
  const be = el("btnExport"); if(be) be.addEventListener("click", exportWord);
}
function exportWord(){
  const c = cityData();
  if(!c){ alert("请先选择城市"); return; }
  if(typeof docx === "undefined"){ alert("Word 生成组件(docx.js)加载失败，请检查网络后刷新页面重试"); return; }
  const sel = collectSelection();
  const D = docx, FONT = "Microsoft YaHei";
  const THEME = "1F4E79", SUB = "2F5B94", GRAY = "6B7B8D", TEXT = "262626";
  const BD = {style:D.BorderStyle.SINGLE, size:4, color:"A6BBD6"};
  const run = (t,opts)=>new D.TextRun(Object.assign({text:t, font:FONT, size:22, color:TEXT}, opts||{}));
  const para = (t,opts)=>new D.Paragraph(Object.assign({children:[run(t,opts&&opts.run)], spacing:{after:120, line:300}, alignment:D.AlignmentType.JUSTIFIED}, opts));
  const head = (t,lv)=>{
    const h1 = lv===D.HeadingLevel.HEADING_1;
    return new D.Paragraph({heading:lv, spacing:{before:h1?360:260, after:h1?180:120},
      children:[new D.TextRun({text:t, font:FONT, bold:true, size:h1?30:24, color:h1?THEME:SUB})]});
  };
  const cell = (t,{bold,width,header,align}={})=>new D.TableCell({
    width: width?{size:width,type:D.WidthType.DXA}:undefined,
    shading: header?{fill:"E9F1FA"}:undefined,
    verticalAlign:D.VerticalAlign.CENTER,
    children:[new D.Paragraph({alignment:align||(header?D.AlignmentType.CENTER:D.AlignmentType.LEFT),
      spacing:{before:30, after:30, line:280},
      children:[new D.TextRun({text:String(t==null?"":t),font:FONT,size:header?21:20,bold:!!bold||!!header,color:header?THEME:TEXT})]})]
  });
  // 宽度 100% 自适应窗口 + AUTOFIT 按内容自动调整列宽；columnWidths 仅作初始比例参考
  const table = (widths, rows)=>new D.Table({
    width:{size:100,type:D.WidthType.PERCENTAGE},
    columnWidths:widths, layout:D.TableLayoutType.AUTOFIT,
    borders:{top:BD,left:BD,bottom:BD,right:BD,insideHorizontal:BD,insideVertical:BD},
    margins:{top:60, bottom:60, left:140, right:140},
    rows
  });
  const firmHeader = ()=>new D.TableRow({tableHeader:true, children:[cell("类别",{bold:true,header:true,width:1500}),cell("拟调研企业",{bold:true,header:true,width:3400}),cell("地点",{bold:true,header:true,width:2400}),cell("主选/备选",{bold:true,header:true,width:800})]});
  const labelCell = (t,w)=>cell(t,{bold:true,width:w,header:true,align:D.AlignmentType.LEFT});

  const dateStr = (state.dateStart||"X月X日") + " - " + (state.dateEnd||"X月X日");
  const children = [];
  // 标题区：主标题 + 副题（地点/时间）+ 分隔线
  children.push(new D.Paragraph({alignment:D.AlignmentType.CENTER, spacing:{before:120, after:120},
    children:[new D.TextRun({text:state.city+"项目调研计划",font:FONT,bold:true,size:44,color:THEME})]}));
  children.push(new D.Paragraph({alignment:D.AlignmentType.CENTER, spacing:{after:60, line:280},
    children:[run(state.city+" "+(state.district||"")+(state.site?(" · "+state.site):"")+"｜"+dateStr,{size:20,color:GRAY})]}));
  children.push(new D.Paragraph({border:{bottom:{style:D.BorderStyle.SINGLE, size:8, color:THEME}}, spacing:{after:280}, children:[]}));
  children.push(para("为了更加详细、准确地把握"+state.city+(state.district||"")+"物流园区项目的设计需求，充分保证园区定位清晰、业态规划符合当地产业发展，以及保证园区配套建设的经济性和先进性，拟开展项目实地调研，调研范围覆盖"+state.city+"及下辖"+c.overview.districts.join("、")+"。初步拟定调研计划如下："));

  children.push(head("一、拟调研时间", D.HeadingLevel.HEADING_1));
  children.push(para((/^\d/.test(dateStr)?state.city+"调研：":"")+dateStr+(state.period?("（"+state.period+"）"):"")));
  children.push(para("（以上为初步计划调研时间，具体时间以实际为准）", {run:{size:20,color:GRAY}}));

  children.push(head("二、调研人员及行程初步计划", D.HeadingLevel.HEADING_1));
  children.push(table([1800,7200], [
    new D.TableRow({children:[labelCell("调研时间",1800), cell(dateStr,{width:7200})]}),
    new D.TableRow({children:[labelCell("调研团队",1800), cell(state.team||"待定",{width:7200})]}),
    new D.TableRow({children:[labelCell("调研目标",1800), cell("充分调研产业情况及物流特点、本地物流园区现状与需求，从而判断当地产业对物流园区规模、功能的需求，为后续的整体方案设计、园区规划进行指导。",{width:7200})]}),
    new D.TableRow({children:[labelCell("调研内容",1800), cell("充分了解"+state.city+"整体规划与政策、当地产业情况、物流特点、物流需求，以及当前物流园区现状，具体详见调研收集资料及调研目标企业。",{width:7200})]})
  ]));

  children.push(head("三、前置性收集相关材料", D.HeadingLevel.HEADING_1));
  sel.gov.forEach((d,i)=>{
    children.push(para((i+1)+"、"+d.dept+"调研相关："+d.purpose, {run:{bold:true}, spacing:{before:120, after:100, line:300}}));
    d.items.forEach((it,j)=>children.push(new D.Paragraph({indent:{left:480}, spacing:{after:80, line:300}, alignment:D.AlignmentType.JUSTIFIED, children:[run("（"+(j+1)+"）"+it,{size:21})]})));
  });

  children.push(head("四、拟调研企业清单", D.HeadingLevel.HEADING_1));
  const firmRows = gs=>{
    const rows=[];
    gs.forEach(g=>{
      g.primary.forEach(f=>rows.push(new D.TableRow({children:[cell(g.name,{width:1500}),cell(f.name,{width:3400}),cell(f.location,{width:2400}),cell("主选",{width:800,align:D.AlignmentType.CENTER})]})));
      g.backup.forEach(f=>rows.push(new D.TableRow({children:[cell(g.name,{width:1500}),cell(f.name,{width:3400}),cell(f.location,{width:2400}),cell("备选",{width:800,align:D.AlignmentType.CENTER})]})));
    });
    return rows;
  };
  children.push(head("（一）本地生产企业", D.HeadingLevel.HEADING_2));
  children.push(para("调研对象：当地具有代表性的汽车零部件、绿色食品、纺织服装、农产品等相关企业；受访人员：企业负责人及相关部门（仓储、物流、电商、销售等）负责人；调研内容：企业规模、主营产品、当前仓储运输模式、物流成本及痛点，农特产品企业的生产加工情况、产品种类，以及各企业对入园的需求意向、期望的园区服务（如冷链、仓配一体）等。",{run:{size:20,color:"3F3F3F"}, spacing:{after:160, line:280}}));
  if(sel.ind.length) children.push(table([1500,3400,2400,800], [firmHeader(), ...firmRows(sel.ind)]));
  else children.push(para("（未勾选）",{run:{size:20,color:GRAY}}));

  children.push(head("（二）商贸流通企业", D.HeadingLevel.HEADING_2));
  children.push(para("调研对象：当地具有代表性的电商/酒水/医药/电器/食品/日化品经销商、连锁超市（便利店）、批发市场等商贸流通企业；受访人员：企业负责人及相关部门（仓储、物流、电商、销售等）负责人；调研内容：主营品类、销售渠道（线上线下）、当前仓储面积及位置、配送模式（自营/外包）、物流成本占比、痛点及对第三方仓储配送的需求与期望服务等。",{run:{size:20,color:"3F3F3F"}, spacing:{after:160, line:280}}));
  if(sel.com.length) children.push(table([1500,3400,2400,800], [firmHeader(), ...firmRows(sel.com)]));
  else children.push(para("（未勾选）",{run:{size:20,color:GRAY}}));

  children.push(head("（三）快递物流企业", D.HeadingLevel.HEADING_2));
  children.push(para("调研对象：顺丰、圆通、韵达、中通、申通等主流快递物流企业；受访人员：企业负责人（场地负责人）；调研内容：日均上下行单量、货物运输流向、车队规模、场地面积及租金、设备使用情况、末端网点覆盖情况、现有痛点（场地/用工）、对智能仓储/共配中心的需求、与电商/经销商的合作模式、入园意向等。",{run:{size:20,color:"3F3F3F"}, spacing:{after:160, line:280}}));
  if(sel.nodes.length) children.push(table([1400,1800,5800], [new D.TableRow({tableHeader:true, children:[cell("品牌",{bold:true,header:true,width:1400}),cell("节点类型",{bold:true,header:true,width:1800}),cell("节点名称及地点",{bold:true,header:true,width:5800})]}),
    ...sel.nodes.map(n=>new D.TableRow({children:[cell(n.brand,{width:1400}),cell(n.type,{width:1800}),cell(n.name+"（"+n.location+"）",{width:5800})]}))]));
  else children.push(para("（未勾选）",{run:{size:20,color:GRAY}}));

  children.push(head("（四）当地物流园区", D.HeadingLevel.HEADING_2));
  children.push(para("调研对象：当地大型物流园区、产业园区等；受访人员：园区负责人、园区代表企业；调研内容：园区规划定位、入驻企业行业分布、园区主要货类、货量、已建物流设施（仓库/冷库）、物流服务配套情况、企业反馈的物流痛点、园区智慧化升级计划、园区租金、招商优惠政策等。",{run:{size:20,color:"3F3F3F"}, spacing:{after:160, line:280}}));
  if(sel.parks.length) children.push(table([1400,3900,3600], [new D.TableRow({tableHeader:true, children:[cell("状态",{bold:true,header:true,width:1400}),cell("园区名称",{bold:true,header:true,width:3900}),cell("地点",{bold:true,header:true,width:3600})]}),
    ...sel.parks.map(p=>new D.TableRow({children:[cell(p.status,{width:1400}),cell(p.name,{width:3900}),cell(p.location,{width:3600})]}))]));
  else children.push(para("（未勾选）",{run:{size:20,color:GRAY}}));

  const doc = new D.Document({
    styles:{default:{document:{run:{font:FONT, size:21}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838}, margin:{top:1250,bottom:1250,left:1300,right:1300}}}, children}]
  });
  const citySafe = state.city||"项目";
  const fname = citySafe+"项目调研计划_"+new Date().toISOString().slice(0,10).replace(/-/g,"")+".docx";
  const hint = el("exportHint");
  if(hint){ hint.textContent = "正在生成 Word 文档…"; hint.style.color = "var(--warn)"; }
  D.Packer.toBlob(doc).then(blob=>{
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = fname;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    if(hint){
      hint.innerHTML = "已导出：<b>"+esc(fname)+"</b>（已保存至浏览器默认下载文件夹，如「下载/Downloads」；可在浏览器下载记录中查看，Chrome 按 Ctrl/⌘+J）";
      hint.style.color = "var(--ok)";
    }
  }).catch(err=>{ console.error(err); alert("Word 生成失败："+err.message); if(hint){ hint.textContent = "生成 .docx 文件，结构对齐《项目调研计划》参考模板"; hint.style.color = ""; } });
}

// ---- init ----
if(state.city) ensureCityState();
curStep = state.curStep || 0;
if(curStep>=1 && curStep<=5 && !cityReady()) curStep = 0;
el("btnPrev").addEventListener("click", ()=>gotoStep(curStep-1));
el("btnNext").addEventListener("click", ()=>{
  if(curStep===STEPS.length-1){ exportWord(); return; }
  gotoStep(curStep+1);
});
el("btnReset").addEventListener("click", ()=>{
  if(confirm("确认重置全部输入与勾选状态？此操作不可撤销。")){
    localStorage.removeItem(STORE_KEY);
    state = defaultState(); curStep = 0; renderAll();
  }
});
renderAll();
})();
