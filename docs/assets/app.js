(function(){
  "use strict";
  var base = window.SPOT || {gold:0, silver:0, as_of:""};
  var spot = {gold:base.gold, silver:base.silver};
  var KEY = "mc:spot";

  function money(n){
    if(!isFinite(n)) return "$0.00";
    return "$" + n.toLocaleString("en-US",{minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function num(v){ var n = parseFloat(String(v).replace(/[$,\s]/g,"")); return isFinite(n) && n >= 0 ? n : 0; }
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  function loadCustom(){
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if(s && s.gold > 0 && s.silver > 0) return s; } catch(e){}
    return null;
  }
  function saveCustom(s){ try { if(s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch(e){} }

  var custom = loadCustom();
  if(custom){ spot.gold = custom.gold; spot.silver = custom.silver; }

  function render(){
    // spot bar and static values
    $$("[data-spot]").forEach(function(el){ el.textContent = money(spot[el.getAttribute("data-spot")]); });
    $$("[data-melt]").forEach(function(el){
      var oz = num(el.getAttribute("data-oz")), m = el.getAttribute("data-melt"), mult = num(el.getAttribute("data-mult") || 1);
      el.textContent = money(oz * spot[m] * mult);
    });
    $$("[data-custom-flag]").forEach(function(el){ el.hidden = !custom; });
    $$("input[data-spotin]").forEach(function(el){
      if(document.activeElement !== el) el.value = spot[el.getAttribute("data-spotin")].toFixed(2);
    });

    // main calculator
    var calc = $("#calc");
    if(calc){
      var sel = $("#coin"), opt = sel.options[sel.selectedIndex];
      var oz = num(opt.getAttribute("data-oz")), metal = opt.getAttribute("data-metal");
      var qty = num($("#qty").value);
      var per = oz * spot[metal];
      $("#out-total").textContent = money(per * qty);
      $("#out-per").textContent = money(per);
      $("#out-oz").textContent = (oz * qty).toFixed(4) + " oz";
      $("#out-metal").textContent = metal === "gold" ? "Gold" : "Silver";
      var link = $("#out-link"); if(link){ link.href = "/coins/" + sel.value + "/"; link.textContent = "More on the " + opt.getAttribute("data-short"); }
    }

    // per-coin page quantity
    var q = $("#coin-qty");
    if(q){
      var box = $("#coin-calc");
      var cz = num(box.getAttribute("data-oz")), cm = box.getAttribute("data-metal");
      $("#coin-total").textContent = money(cz * spot[cm] * num(q.value));
    }

    // junk silver by face value
    if($("#junk")){
      var total = 0, ozTotal = 0;
      $$("input[data-face-oz]").forEach(function(el){
        var o = num(el.getAttribute("data-face-oz")) * num(el.value);
        ozTotal += o; total += o * spot.silver;
      });
      $("#junk-total").textContent = money(total);
      $("#junk-oz").textContent = ozTotal.toFixed(4) + " oz";
    }

    // bullion bars and rounds
    if($("#bullion")){
      var w = num($("#b-weight").value), unit = $("#b-unit").value, pur = num($("#b-purity").value), bm = $("#b-metal").value, bq = num($("#b-qty").value);
      var toOz = unit === "g" ? 1/31.1034768 : unit === "kg" ? 1000/31.1034768 : unit === "dwt" ? 0.05 : 1;
      var fine = w * toOz * pur * bq;
      $("#b-total").textContent = money(fine * spot[bm]);
      $("#b-oz").textContent = fine.toFixed(4) + " oz";
    }
  }

  document.addEventListener("input", function(e){
    var t = e.target;
    if(t.matches && t.matches("input[data-spotin]")){
      var v = num(t.value);
      if(v > 0){
        spot[t.getAttribute("data-spotin")] = v;
        custom = {gold:spot.gold, silver:spot.silver};
        saveCustom(custom);
      }
    }
    render();
  });
  document.addEventListener("change", render);
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest("[data-back]");
    if(b){
      var fromHere = false;
      try { fromHere = document.referrer && new URL(document.referrer).origin === location.origin; } catch(err){}
      if(fromHere && history.length > 1){ e.preventDefault(); history.back(); }
      return;
    }
    if(e.target.matches && e.target.matches("[data-reset-spot]")){
      custom = null; saveCustom(null);
      spot.gold = base.gold; spot.silver = base.silver;
      $$("input[data-spotin]").forEach(function(el){ el.value = ""; });
      render();
    }
  });

  // pick up a newer daily price if the page was cached
  try {
    fetch("/data/spot.json", {cache:"no-cache"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if(d && d.gold > 0 && d.silver > 0){
        base = d;
        if(!custom){ spot.gold = d.gold; spot.silver = d.silver; }
        render();
      }
    }).catch(function(){});
  } catch(e){}

  render();
})();
