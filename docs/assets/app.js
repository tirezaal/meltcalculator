(function(){
  "use strict";
  var base = window.SPOT || {gold:0, silver:0, as_of:""};
  var spot = {gold:base.gold, silver:base.silver};
  var bad = {gold:false, silver:false};
  var KEY = "mc:spot", DASH = "--";
  var STALE_HOURS = 36, MAX_INPUT = 1e12;
  function validPrice(n){ return typeof n === "number" && Number.isFinite(n) && n > 0 && n <= MAX_INPUT; }

  function money(n){ if(!Number.isFinite(n)) return DASH; return "$" + n.toLocaleString("en-US",{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  // ---- validation
  // kinds: count = whole number 0 or more; amount = number 0 or more; price = number above 0
  function check(el){
    var kind = el.getAttribute("data-kind") || "amount";
    var raw = String(el.value).trim().replace(/^\$\s*/, "");
    var msg = "", v = NaN;
    // commas only as thousands separators (1,250.50); no inner spaces
    var okNum = /^(\d{1,3}(,\d{3})+|\d+)(\.\d*)?$|^\.\d+$/;
    if(raw === "") msg = "Enter a number.";
    else if(/^-/.test(raw)) msg = "Can't be negative.";
    else if(!okNum.test(raw)) msg = /,/.test(raw) ? "Use a period for decimals, like 1.5." : "Numbers only, no spaces.";
    else {
      v = parseFloat(raw.replace(/,/g, ""));
      if(!Number.isFinite(v) || v > MAX_INPUT) msg = "Enter a finite number no greater than 1,000,000,000,000.";
      else if(kind === "count" && v % 1 !== 0) msg = "Whole numbers only.";
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
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if(s && validPrice(s.gold) && validPrice(s.silver)) return s; } catch(e){}
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
    if(stale) stale.hidden = !isNaN(d) && (Date.now() - d.getTime()) < STALE_HOURS * 3600e3;
  }

  // show only the spot box for the metal in use
  function showSpot(scope, metal){
    $$("[data-spotwrap]", scope).forEach(function(w){ w.hidden = metal && w.getAttribute("data-spotwrap") !== metal; });
  }

  function render(){
    $$("[data-quote-label]").forEach(function(el){ el.textContent = custom ? "your custom spot" : "the latest available spot"; });
    $$("[data-spot]").forEach(function(el){ var m = el.getAttribute("data-spot"); el.textContent = bad[m] ? DASH : money(spot[m]); });
    $$("[data-melt]").forEach(function(el){
      var oz = parseFloat(el.getAttribute("data-oz")), m = el.getAttribute("data-melt"), mult = parseFloat(el.getAttribute("data-mult") || 1);
      el.textContent = bad[m] ? DASH : money(oz * spot[m] * mult);
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
      setOut("selected-coin", opt.textContent);
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
      var fineBasis = $("#b-basis") && $("#b-basis").value === "fine";
      $("#b-purity").disabled = !!fineBasis;
      setOut("b-weight-label", fineBasis ? "Fine metal content per piece" : "Gross weight per piece");
      if(fineBasis) pur = 1;
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
      // any other field left invalid goes back to its starting value
      $$("input[aria-invalid]").forEach(function(el){
        el.value = el.defaultValue;
        var err = el.parentNode.querySelector(".err"); if(err) err.remove();
        el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
      });
      render();
      refreshSpot(true);
    }
  });

  // Refresh a persistent tab, while retaining the latest good quote on failure.
  var refreshing = false, lastAttempt = 0;
  function refreshSpot(force){
    renderSource();
    if(refreshing || (!force && Date.now() - lastAttempt < 60000)) return;
    refreshing = true; lastAttempt = Date.now();
    var controller = new AbortController();
    var timeout = setTimeout(function(){ controller.abort(); }, 10000);
    fetch("/data/spot.json", {cache:"no-cache", signal:controller.signal})
      .then(function(r){ if(!r.ok) throw new Error("Quote unavailable"); return r.json(); })
      .then(function(d){
        var stamp = d && Date.parse(d.as_of), previous = Date.parse(base.as_of);
        if(!d || !validPrice(d.gold) || !validPrice(d.silver) || !Number.isFinite(stamp) || stamp > Date.now() + 300000 || (Number.isFinite(previous) && stamp < previous)) return;
        base = d;
        if(!custom){ spot.gold = d.gold; spot.silver = d.silver; }
        renderSource(); render();
      })
      .catch(function(){ /* Keep the last successful quote and its real timestamp. */ })
      .finally(function(){ clearTimeout(timeout); refreshing = false; renderSource(); });
  }
  setInterval(renderSource, 60000);
  setInterval(function(){ if(!document.hidden) refreshSpot(false); }, 300000);
  window.addEventListener("focus", function(){ refreshSpot(false); });
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) refreshSpot(false); });
  renderSource();
  render();
  refreshSpot(true);
})();
