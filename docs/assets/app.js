(function(){
  "use strict";
  var base = window.SPOT || {gold:0, silver:0, as_of:""};
  var spot = {gold:base.gold, silver:base.silver};
  var bad = {gold:false, silver:false};
  var KEY = "mc:spot", DASH = "--";
  var STALE_HOURS = 36;

  function money(n){ return "$" + n.toLocaleString("en-US",{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  // ---- validation
  // kinds: count = whole number 0 or more; amount = number 0 or more; price = number above 0
  function check(el){
    var kind = el.getAttribute("data-kind") || "amount";
    var raw = String(el.value).replace(/[$,\s]/g, "");
    var msg = "", v = NaN;
    if(raw === "") msg = "Enter a number.";
    else if(!/^\d*\.?\d+$|^\d+\.$/.test(raw)) msg = /^-/.test(raw) ? "Can't be negative." : "Numbers only.";
    else {
      v = parseFloat(raw);
      if(kind === "count" && v % 1 !== 0) msg = "Whole numbers only.";
      else if(kind === "price" && !(v > 0)) msg = "Price has to be above zero.";
    }
    var err = el.parentNode.querySelector(".err");
    if(msg){
      if(!err){
        err = document.createElement("div"); err.className = "err"; err.id = el.id + "-err";
        el.parentNode.appendChild(err);
      }
      err.textContent = msg;
      el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", err.id);
      return {ok:false, v:0};
    }
    if(err) err.remove();
    el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
    return {ok:true, v:v};
  }
  function fields(list){
    var ok = true, vals = list.map(function(el){ var r = check(el); if(!r.ok) ok = false; return r.v; });
    return {ok:ok, v:vals};
  }
  function setOut(id, text){ var el = document.getElementById(id); if(el) el.textContent = text; }

  // ---- custom spot (kept on this device only)
  function loadCustom(){
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if(s && s.gold > 0 && s.silver > 0) return s; } catch(e){}
    return null;
  }
  function saveCustom(s){ try { if(s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch(e){} }
  var custom = loadCustom();
  if(custom){ spot.gold = custom.gold; spot.silver = custom.silver; }

  // ---- price source line
  function renderSource(){
    var d = new Date(base.as_of), el = $("[data-asof]");
    if(el && !isNaN(d)){
      el.textContent = d.toLocaleString("en-US", {month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short"});
    }
    var stale = $("[data-stale]");
    if(stale) stale.hidden = isNaN(d) || (Date.now() - d.getTime()) < STALE_HOURS * 3600e3;
  }

  // show only the spot box for the metal in use
  function showSpot(scope, metal){
    $$("[data-spotwrap]", scope).forEach(function(w){ w.hidden = metal && w.getAttribute("data-spotwrap") !== metal; });
  }

  function render(){
    $$("[data-spot]").forEach(function(el){ el.textContent = money(spot[el.getAttribute("data-spot")]); });
    $$("[data-melt]").forEach(function(el){
      var oz = parseFloat(el.getAttribute("data-oz")), m = el.getAttribute("data-melt"), mult = parseFloat(el.getAttribute("data-mult") || 1);
      el.textContent = money(oz * spot[m] * mult);
    });
    $$("[data-custom-flag]").forEach(function(el){ el.hidden = !custom; });
    $$("input[data-spotin]").forEach(function(el){
      if(document.activeElement !== el && !el.getAttribute("aria-invalid")) el.value = spot[el.getAttribute("data-spotin")].toFixed(2);
    });

    // home calculator
    if($("#calc")){
      var sel = $("#coin"), opt = sel.options[sel.selectedIndex];
      var oz = parseFloat(opt.getAttribute("data-oz")), metal = opt.getAttribute("data-metal");
      showSpot($("#calc"), metal);
      var f = fields([$("#qty")]);
      $("#out-metal").textContent = metal === "gold" ? "Gold" : "Silver";
      var link = $("#out-link"); if(link){ link.href = "/coins/" + sel.value + "/"; link.textContent = "More on the " + opt.getAttribute("data-short"); }
      if(f.ok && !bad[metal]){
        var per = oz * spot[metal];
        setOut("out-total", money(per * f.v[0])); setOut("out-per", money(per)); setOut("out-oz", (oz * f.v[0]).toFixed(4) + " oz");
      } else { setOut("out-total", DASH); setOut("out-per", DASH); setOut("out-oz", DASH); }
    }

    // coin page
    if($("#coin-calc")){
      var box = $("#coin-calc"), cz = parseFloat(box.getAttribute("data-oz")), cm = box.getAttribute("data-metal");
      var cf = fields([$("#coin-qty")]);
      setOut("coin-total", cf.ok && !bad[cm] ? money(cz * spot[cm] * cf.v[0]) : DASH);
    }

    // junk silver
    if($("#junk")){
      var basis = $("#j-basis"), per90 = parseFloat(basis.value);
      $("#j-90").setAttribute("data-face-oz", per90);
      var ins = $$("input[data-face-oz]"), jf = fields(ins);
      var basisLabel = basis.options[basis.selectedIndex].getAttribute("data-label");
      setOut("junk-basis", basisLabel);
      if(jf.ok && !bad.silver){
        var ozT = 0; ins.forEach(function(el, i){ ozT += parseFloat(el.getAttribute("data-face-oz")) * jf.v[i]; });
        setOut("junk-total", money(ozT * spot.silver)); setOut("junk-oz", ozT.toFixed(4) + " oz");
      } else { setOut("junk-total", DASH); setOut("junk-oz", DASH); }
    }

    // bars and rounds
    if($("#bullion")){
      var bm = $("#b-metal").value, unit = $("#b-unit").value, pur = parseFloat($("#b-purity").value);
      showSpot($("#bullion"), bm);
      var bf = fields([$("#b-weight"), $("#b-qty")]);
      var toOz = unit === "g" ? 1/31.1034768 : unit === "kg" ? 1000/31.1034768 : unit === "dwt" ? 0.05 : 1;
      if(bf.ok && !bad[bm]){
        var fine = bf.v[0] * toOz * pur * bf.v[1];
        setOut("b-total", money(fine * spot[bm])); setOut("b-oz", fine.toFixed(4) + " oz");
      } else { setOut("b-total", DASH); setOut("b-oz", DASH); }
    }
  }

  document.addEventListener("input", function(e){
    var t = e.target;
    if(t.matches && t.matches("input[data-spotin]")){
      var m = t.getAttribute("data-spotin"), r = check(t);
      bad[m] = !r.ok;
      if(r.ok){ spot[m] = r.v; custom = {gold:spot.gold, silver:spot.silver}; saveCustom(custom); }
    }
    render();
  });
  document.addEventListener("change", function(e){
    if(e.target && e.target.id === "b-metal"){
      var ps = $("#b-purity"), lists = {};
      try { lists = JSON.parse(ps.getAttribute("data-purities")); } catch(err){}
      ps.innerHTML = "";
      (lists[e.target.value] || []).forEach(function(p){ var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; ps.appendChild(o); });
    }
    render();
  });
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest("[data-back]");
    if(b){
      var fromHere = false;
      try { fromHere = document.referrer && new URL(document.referrer).origin === location.origin; } catch(err){}
      if(fromHere && history.length > 1){ e.preventDefault(); history.back(); }
      return;
    }
    if(e.target.matches && e.target.matches("[data-reset-spot]")){
      custom = null; saveCustom(null); bad.gold = bad.silver = false;
      spot.gold = base.gold; spot.silver = base.silver;
      $$("input[data-spotin]").forEach(function(el){
        var err = el.parentNode.querySelector(".err"); if(err) err.remove();
        el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); el.value = "";
      });
      render();
    }
  });

  // pick up a newer price if the page was cached
  try {
    fetch("/data/spot.json", {cache:"no-cache"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if(d && d.gold > 0 && d.silver > 0){
        base = d;
        if(!custom){ spot.gold = d.gold; spot.silver = d.silver; }
        renderSource(); render();
      }
    }).catch(function(){});
  } catch(e){}

  renderSource();
  render();
})();
