// Offline site guide: matches keywords in a question to pages on this site. No network, no AI.
(function(){
  "use strict";
  var IDX = window.HELP_INDEX || {pages:[], coins:[]};
  var byUrl = {};
  IDX.pages.concat(IDX.coins).forEach(function(p){ byUrl[p.u] = p; });

  // spelling and slang folded into the words the index uses
  var SYN = {
    pennies:"cent", penny:"cent", cents:"cent", nickels:"nickel", dimes:"dime", quarters:"quarter",
    halves:"half", "half-dollar":"half", "50c":"half", dollars:"dollar", "silver-dollar":"dollar",
    ike:"eisenhower", ikes:"eisenhower", jfk:"kennedy", ben:"franklin", walker:"walking", walkers:"walking",
    merc:"mercury", mercs:"mercury", morgans:"morgan", peaces:"peace", slq:"standing",
    ase:"silver eagle", ases:"silver eagle", age:"gold eagle", maples:"maple", krugerrands:"krugerrand", kruger:"krugerrand",
    bars:"bar", rounds:"round", ingot:"bar", ingots:"bar", bullion:"bar",
    jewelry:"scrap", jewellery:"scrap", ring:"scrap", rings:"scrap", chain:"scrap", necklace:"scrap", flatware:"sterling", silverware:"sterling",
    "14k":"14 karat", "10k":"10 karat", "18k":"18 karat", "22k":"22 karat", "24k":"24 karat", kt:"karat", carat:"karat",
    grams:"gram", g:"gram", kilo:"kilogram", kg:"kilogram", dwt:"pennyweight", ozt:"ounce", oz:"ounce", ounces:"ounce",
    "pre-1965":"junk", "90%":"junk", constitutional:"junk", "face-value":"face",
    price:"spot", prices:"spot", worth:"value", sell:"value", selling:"value", buy:"value",
    wartime:"war", app:"tracker", spreadsheet:"tracker", excel:"tracker", track:"tracker", tracking:"tracker",
    email:"contact", mistake:"contact", error:"contact", wrong:"contact"
  };

  // year ranges for silver issues by denomination
  var YEARS = {
    nickel: [[1942, 1945, "war-nickel"]],
    dime: [[1892, 1916, "barber-dime"], [1916, 1945, "mercury-dime"], [1946, 1964, "roosevelt-dime-silver"]],
    quarter: [[1892, 1916, "barber-quarter"], [1916, 1930, "standing-liberty-quarter"], [1932, 1964, "washington-quarter-silver"]],
    half: [[1892, 1915, "barber-half"], [1916, 1947, "walking-liberty-half"], [1948, 1963, "franklin-half"], [1964, 1964, "kennedy-half-1964"], [1965, 1970, "kennedy-half-40"]],
    dollar: [[1878, 1904, "morgan-dollar"], [1921, 1921, "morgan-dollar"], [1921, 1928, "peace-dollar"], [1934, 1935, "peace-dollar"], [1971, 1976, "eisenhower-dollar-40"]]
  };
  var DENOM_NAME = {nickel:"nickel", dime:"dime", quarter:"quarter", half:"half dollar", dollar:"dollar", cent:"penny"};

  function words(q){
    var raw = q.toLowerCase().replace(/[?!.,;:'"()]/g, " ").replace(/half dollar/g, "half").replace(/silver dollar/g, "silver-dollar").replace(/face value/g, "face-value").split(/\s+/).filter(Boolean);
    var out = [];
    raw.forEach(function(w){ var s = SYN[w]; if(s) out.push.apply(out, s.split(" ")); else { out.push(w); if(/[^s]s$/.test(w)) out.push(w.slice(0, -1)); } });
    return out;
  }

  function score(entry, ws, text){
    var s = 0;
    entry.k.forEach(function(k){
      if(k.indexOf(" ") > -1){ if(text.indexOf(k) > -1) s += 3; }
      else if(ws.indexOf(k) > -1) s += 1;
    });
    return s;
  }

  function coinBy(slug){ return byUrl["/coins/" + slug + "/"]; }

  function answer(q){
    var ws = words(q), text = " " + ws.join(" ") + " ";
    var res = [], seen = {}, note = "";
    function add(p, why){ if(p && !seen[p.u]){ seen[p.u] = 1; res.push({p:p, why:why || p.d}); } }

    // a year plus a denomination: route straight to the right coin
    var ym = q.match(/\b(1[789]\d\d|20[0-3]\d)\b/), denom = null;
    ["cent", "nickel", "dime", "quarter", "half", "dollar"].forEach(function(d){ if(ws.indexOf(d) > -1 && !denom) denom = d; });
    var SERIES = {kennedy:"half", franklin:"half", walking:"half", morgan:"dollar", peace:"dollar", eisenhower:"dollar",
                  mercury:"dime", roosevelt:"dime", washington:"quarter", standing:"quarter", lincoln:"cent", wheat:"cent", jefferson:"nickel"};
    if(!denom) Object.keys(SERIES).forEach(function(s){ if(!denom && ws.indexOf(s) > -1) denom = SERIES[s]; });
    if(ym && denom){
      var y = +ym[1], hits = (YEARS[denom] || []).filter(function(r){ return y >= r[0] && y <= r[1]; });
      if(hits.length){
        hits.forEach(function(r){ add(coinBy(r[2]), "A " + y + " " + DENOM_NAME[denom] + " in this series: see its silver content and melt value."); });
        if(denom === "dollar" && y >= 1971) note = "Only some Eisenhower dollars are silver. The page explains how to tell.";
      } else {
        note = denom === "cent" ? "Pennies were never made of silver, so a " + y + " penny has no silver melt value."
             : "A " + y + " " + DENOM_NAME[denom] + " from circulation most likely has no silver in it.";
        add(byUrl["/is-my-coin-silver/"], "Which years and coins are silver, and the exceptions to know.");
      }
    }

    var pool = res.length ? IDX.pages : IDX.pages.concat(IDX.coins);
    var all = pool.map(function(p){ return {p:p, s:score(p, ws, text)}; })
      .filter(function(x){ return x.s > 0; })
      .sort(function(a, b){ return b.s - a.s; });
    all.forEach(function(x){ if(res.length < 3) add(x.p); });
    return {res:res.slice(0, 3), note:note};
  }

  // ---- panel
  var CHIPS = ["Is my coin silver?", "Junk silver by face value", "Silver bars and rounds", "14k gold jewelry", "1964 quarter", "Where do prices come from?"];
  var btn, panel, input, out, open = false, lastFocus = null;

  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }

  function show(q){
    out.innerHTML = "";
    if(!q.trim()){ return; }
    var a = answer(q);
    if(a.note) out.appendChild(el("p", "help-note", a.note));
    if(!a.res.length){
      out.appendChild(el("p", "help-note", "I couldn't match that to a page. Try a coin name with its year, like \"1943 nickel\", or one of the topics below."));
      a.res = ["/", "/is-my-coin-silver/", "/about/"].map(function(u){ return {p:byUrl[u], why:byUrl[u].d}; });
    }
    out.appendChild(el("div", "help-label", a.res.length === 1 ? "Here's where to look" : "Here's where to look"));
    var ul = el("ul", "help-results");
    a.res.forEach(function(r){
      var li = el("li"), link = el("a", null, r.p.t);
      link.href = r.p.u;
      if(/^https?:/.test(r.p.u)){ link.target = "_blank"; link.rel = "noopener"; }
      link.appendChild(el("span", "help-why", r.why));
      link.appendChild(el("span", "help-go", "\u2192"));
      li.appendChild(link);
      ul.appendChild(li);
    });
    out.appendChild(ul);
  }

  function setOpen(v){
    open = v; panel.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false");
    btn.classList.toggle("is-open", v); document.documentElement.classList.toggle("help-open", v);
    if(v){ lastFocus = document.activeElement; input.focus(); }
    else if(lastFocus && lastFocus.focus){ lastFocus.focus(); }
  }

  var ICON_Q = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2.9-1.2 1.7v.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_S = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function build(){
    btn = el("button", "help-btn");
    btn.innerHTML = ICON_Q + '<span>Ask a question</span>';
    btn.type = "button"; btn.setAttribute("aria-controls", "help-panel"); btn.setAttribute("aria-expanded", "false");

    panel = el("div", "help-panel"); panel.id = "help-panel"; panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-labelledby", "help-title");

    var head = el("div", "help-head");
    var av = el("div", "help-avatar"); av.innerHTML = ICON_Q;
    var ht = el("div", "help-titles");
    var h2 = el("div", "help-title", "Hi! What can I help you find?"); h2.id = "help-title";
    ht.appendChild(h2);
    ht.appendChild(el("div", "help-sub", "Ask about a coin, a year, or a pile of silver and I'll point you to the right page."));
    var x = el("button", "help-x"); x.type = "button"; x.innerHTML = ICON_X; x.setAttribute("aria-label", "Close help");
    head.appendChild(av); head.appendChild(ht); head.appendChild(x);

    var body = el("div", "help-body");
    var form = el("form", "help-form");
    var lab = el("label", "help-sr", "Your question"); lab.setAttribute("for", "help-q");
    var box = el("div", "help-search"); var si = el("span", "help-si"); si.innerHTML = ICON_S;
    input = el("input"); input.id = "help-q"; input.type = "search"; input.autocomplete = "off"; input.enterKeyHint = "search";
    input.placeholder = "Try \"1964 quarter\" or \"14k ring\"";
    box.appendChild(si); box.appendChild(input);
    form.appendChild(lab); form.appendChild(box);
    out = el("div", "help-out"); out.setAttribute("aria-live", "polite");
    var chipWrap = el("div", "help-popular");
    chipWrap.appendChild(el("div", "help-label", "Popular questions"));
    var chips = el("div", "help-chips");
    CHIPS.forEach(function(c){ var b = el("button", "help-chip", c); b.type = "button"; b.addEventListener("click", function(){ input.value = c; show(c); input.focus(); }); chips.appendChild(b); });
    chipWrap.appendChild(chips);
    body.appendChild(form); body.appendChild(out); body.appendChild(chipWrap);

    panel.appendChild(head); panel.appendChild(body);
    panel.appendChild(el("p", "help-foot", "Runs right on this page. Your question isn't sent anywhere."));
    document.body.appendChild(panel); document.body.appendChild(btn);

    btn.addEventListener("click", function(){ setOpen(!open); });
    x.addEventListener("click", function(){ setOpen(false); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-help-open]"), function(b){
      b.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); setOpen(true); });
    });
    form.addEventListener("submit", function(e){ e.preventDefault(); show(input.value); });
    var t; input.addEventListener("input", function(){ clearTimeout(t); t = setTimeout(function(){ show(input.value); }, 180); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && open) setOpen(false); });
    document.addEventListener("click", function(e){ if(open && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
  }

  window.MeltHelp = {answer:answer};
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
