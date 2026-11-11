"""Builds the static site into docs/. Run after fetch_spot.py."""
import json, html, pathlib, datetime
from coins import COINS, TROY_OZ_G

ROOT = pathlib.Path(__file__).parent
DOCS = ROOT / "docs"
SITE = "https://meltcalculator.plainsmadeco.com"
ETSY = "https://www.etsy.com/shop/PlainsMadeCo"
SPOT = json.loads((DOCS / "data" / "spot.json").read_text())

def esc(s): return html.escape(str(s), quote=True)
def money(n): return "${:,.2f}".format(n)
def melt(c, mult=1): return c["oz"] * SPOT[c["metal"]] * mult

from zoneinfo import ZoneInfo
def as_of_text(long=False):
    try:
        d = datetime.datetime.fromisoformat(SPOT["as_of"].replace("Z", "+00:00")).astimezone(ZoneInfo("America/Chicago"))
    except Exception:
        d = datetime.datetime.now(ZoneInfo("America/Chicago"))
    if long:
        return d.strftime("%b %-d, %-I:%M %p ") + d.tzname()
    return d.strftime("%b %-d, %Y")
ASOF = as_of_text()
ASOF_LONG = as_of_text(True)
SOURCE = SPOT.get("source", "xaus.com")
LISTINGS = {
    "coins": ("Coin Collection Tracker", "https://www.etsy.com/listing/4533946828/coin-collection-tracker-app-excel",
              "Track your whole collection",
              "Logs every coin with its silver and gold content and values the lot at today's spot. App plus Excel spreadsheet, works offline, no account."),
    "junk": ("Junk Silver Calculator", "https://www.etsy.com/listing/4545013082/junk-silver-calculator-excel-spreadsheet",
             "Keep track of a junk silver pile",
             "Tracks your lots, what you paid, dealer offers, and what it's all worth at any spot price. App plus Excel spreadsheet, works offline."),
    "bullion": ("Gold and Silver Inventory Tracker", "https://www.etsy.com/listing/4544380206/bullion-stack-tracker-gold-silver",
                "Track your stack",
                "Logs bars, rounds and bullion coins with cost basis and values the whole stack at today's spot. App plus Excel spreadsheet, works offline."),
}

GROUP_ORDER = ["Nickels", "Dimes", "Quarters", "Half dollars", "Dollars",
               "Silver bullion coins", "US gold coins", "Gold bullion coins"]
ROLLS = {"Dimes": 50, "Quarters": 40, "Half dollars": 20, "Dollars": 20, "Nickels": 40}
NAV = [("/", "Calculator"), ("/junk-silver/", "Junk silver"), ("/bars-and-rounds/", "Bars and rounds"),
       ("/is-my-coin-silver/", "Is it silver?"), ("/about/", "About")]

def page(path, title, desc, body, jsonld=None):
    nav = "".join(f'<a href="{h}"{" aria-current=page" if h == path else ""}>{t}</a>' for h, t in NAV)
    ld = f'<script type="application/ld+json">{json.dumps(jsonld)}</script>' if jsonld else ""
    back = '<a class="back" href="/" data-back>&larr; Back</a>' if path != "/" else ""
    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#F5F0E6">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23161512'/%3E%3Ccircle cx='16' cy='16' r='10.5' fill='none' stroke='%23F5F0E6' stroke-width='1.5'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
{ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap">
  <a class="brand" href="/"><b>Melt Calculator</b><span>by PlainsMadeCo</span></a>
  <nav class="nav" aria-label="Main">{nav}</nav>
</div></header>
<div class="spotbar"><div class="wrap">
  <span>Silver <strong data-spot="silver">{money(SPOT['silver'])}</strong></span>
  <span>Gold <strong data-spot="gold">{money(SPOT['gold'])}</strong></span>
  <span>Spot from {esc(SOURCE)}, updated <span data-asof>{ASOF_LONG}</span></span>
  <span class="stale" data-stale hidden>Price may be out of date</span>
  <span data-custom-flag hidden>Using your custom spot</span>
</div></div>
<main id="main" class="wrap">
{back}{body}
</main>
<footer><div class="wrap">
  <span>Melt Calculator is made by <a href="https://plainsmadeco.com">PlainsMadeCo</a> in Lincoln, Nebraska.</span>
  <span>Spot prices refresh twice a day and are indicative, not a dealer quote. <a href="/about/">How the numbers work</a></span>
</div></footer>
<script>window.SPOT={json.dumps(SPOT)};</script>
<script src="/assets/app.js" defer></script>
</body>
</html>
"""
    f = DOCS / path.strip("/") / "index.html" if path != "/" else DOCS / "index.html"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(out)
    return path

def spot_inputs(metals=("silver", "gold"), first="silver"):
    boxes = ""
    for m in metals:
        hid = " hidden" if (len(metals) > 1 and m != first) else ""
        boxes += (f'<div data-spotwrap="{m}"{hid}><label for="sp-{m}">{m.title()} spot ($ per troy oz)</label>'
                  f'<input id="sp-{m}" inputmode="decimal" data-spotin="{m}" data-kind="price" autocomplete="off"></div>')
    return f"""<div>{boxes}</div>
    <button class="btnlink" type="button" data-reset-spot>Reset to today's spot</button>"""

def plug(kind="coins"):
    name, url, head, text = LISTINGS[kind]
    return f"""<aside class="plug"><h3>{esc(head)}</h3>
<p>The {esc(name)}: {esc(text)}</p>
<a href="{url}">See the {esc(name)} on Etsy</a></aside>"""

def by_group():
    g = {}
    for c in COINS: g.setdefault(c["group"], []).append(c)
    return [(k, g[k]) for k in GROUP_ORDER if k in g]

# ---------- home
def build_home():
    opts = ""
    for grp, cs in by_group():
        opts += f'<optgroup label="{esc(grp)}">' + "".join(
            f'<option value="{c["slug"]}" data-oz="{c["oz"]}" data-metal="{c["metal"]}" data-short="{esc(c["short"])}"'
            f'{" selected" if c["slug"] == "washington-quarter-silver" else ""}>{esc(c["name"])}{"" if "(" in c["name"] else " (" + c["years"] + ")"}</option>'
            for c in cs) + "</optgroup>"
    groups = ""
    for grp, cs in by_group():
        lis = "".join(f'<li><a href="/coins/{c["slug"]}/">{esc(c["short"])}</a><span data-melt="{c["metal"]}" data-oz="{c["oz"]}">{money(melt(c))}</span></li>' for c in cs)
        groups += f'<div class="group"><h3>{esc(grp)}</h3><ul>{lis}</ul></div>'
    q = next(c for c in COINS if c["slug"] == "washington-quarter-silver")
    body = f"""
<section class="hero">
  <div class="eyebrow">Silver and gold coin melt values</div>
  <h1>What's your silver and gold worth?</h1>
  <p class="lede">Pick a coin, enter how many you have, and see the metal value at today's spot price. Every number is worked out from the coin's real weight and purity.</p>
  <div class="calc" id="calc">
    <div class="in">
      <div><label for="coin">Coin</label><select id="coin">{opts}</select></div>
      <div><label for="qty">How many</label><input id="qty" type="number" inputmode="numeric" min="0" step="1" value="1" data-kind="count"></div>
      {spot_inputs()}
    </div>
    <div class="out" aria-live="polite">
      <div class="small">Melt value</div>
      <div class="big" id="out-total">{money(melt(q))}</div>
      <dl class="kv">
        <dt>Per coin</dt><dd id="out-per">{money(melt(q))}</dd>
        <dt><span id="out-metal">Silver</span> content</dt><dd id="out-oz">{q['oz']:.4f} oz</dd>
      </dl>
      <a class="note" id="out-link" href="/coins/{q['slug']}/">More on the {esc(q['short'])}</a>
    </div>
  </div>
</section>
<h2>Melt value of one coin, by type</h2>
<p class="small">At spot as of {ASOF}. Tap a coin for the full breakdown.</p>
<div class="groups">{groups}</div>
<h2>How melt value works</h2>
<p>Melt value is what the silver or gold inside a coin is worth at the current spot price. Think of it as a benchmark, not a price anyone has to pay: dealer offers on common worn silver often come in a little under melt, while scarce dates and high grades can sell well above it.</p>
<p>Not sure if a coin is silver at all? Check the <a href="/is-my-coin-silver/">is my coin silver guide</a>. Have a pile of old dimes, quarters and halves? Use the <a href="/junk-silver/">junk silver calculator</a>.</p>
{plug()}
"""
    ld = {"@context": "https://schema.org", "@type": "WebSite", "name": "Melt Calculator", "url": SITE + "/",
          "publisher": {"@type": "Organization", "name": "PlainsMadeCo", "url": "https://plainsmadeco.com"}}
    return page("/", "Coin Melt Value Calculator: Silver and Gold at Today's Spot | Melt Calculator",
                "Free melt value calculator for US silver and gold coins. Dimes, quarters, halves, Morgan dollars, war nickels and gold, priced at today's spot.", body, ld)

# ---------- coin pages
def build_coin(c):
    metal = c["metal"]
    per = melt(c)
    rows = [("1 coin", 1)]
    if c["group"] in ROLLS: rows.append((f"1 roll ({ROLLS[c['group']]} coins)", ROLLS[c["group"]]))
    rows += [("10 coins", 10), ("100 coins", 100)]
    if c.get("sizes"):
        rows = [(f"{lab} coin", r) for lab, r in c["sizes"]]
    trs = "".join(f'<tr><td>{esc(lab)}</td><td class="n">{c["oz"]*m:.4f} oz</td><td class="n" data-melt="{metal}" data-oz="{c["oz"]}" data-mult="{m}">{money(per*m)}</td></tr>' for lab, m in rows)
    face = f"<tr><td>Face value</td><td class=n>{money(c['face'])}</td></tr>" if c.get("face") else ""
    mix = f"<tr><td>Composition</td><td class=n>{esc(c['mix'])}</td></tr>" if c.get("mix") else f"<tr><td>Purity</td><td class=n>{c['fineness']*100:g}% {metal}</td></tr>"
    related = [x for x in COINS if x["group"] == c["group"] and x["slug"] != c["slug"]]
    rel = "".join(f'<li><a href="/coins/{x["slug"]}/">{esc(x["name"])}</a><span data-melt="{x["metal"]}" data-oz="{x["oz"]}">{money(melt(x))}</span></li>' for x in related)
    rel_html = f'<h2>Related coins</h2><div class="groups"><div class="group"><ul>{rel}</ul></div></div>' if rel else ""
    junk_line = '<p>Selling a mix of 90% coins by face value? The <a href="/junk-silver/">junk silver calculator</a> does it in one step.</p>' if c.get("face") and c["fineness"] in (0.9, 0.35, 0.4) else ""
    body = f"""
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Calculator</a> / {esc(c['group'])} / {esc(c['short'])}</nav>
<div class="eyebrow">{esc(c['group'])} · {esc(c['years'])}</div>
<h1>{esc(c['name'])} Melt Value</h1>
<p class="lede">A {esc(c['short'])} contains {c['oz']:.4f} troy ounces of {metal}. At today's spot of {money(SPOT[metal])}, that is <strong>{money(per)}</strong> in {metal} per coin.</p>
<div class="calc" id="coin-calc" data-oz="{c['oz']}" data-metal="{metal}">
  <div class="in">
    <div><label for="coin-qty">How many do you have?</label><input id="coin-qty" type="number" inputmode="numeric" min="0" step="1" value="1" data-kind="count"></div>
    {spot_inputs((metal,))}
  </div>
  <div class="out" aria-live="polite">
    <div class="small">Melt value</div>
    <div class="big" id="coin-total">{money(per)}</div>
    <div class="note">Per coin: <span class="mono" data-melt="{metal}" data-oz="{c['oz']}">{money(per)}</span></div>
  </div>
</div>
<h2>Quick values</h2>
<div class="tablewrap"><table><thead><tr><th>Amount</th><th class="n">Pure {metal}</th><th class="n">Melt value</th></tr></thead><tbody>{trs}</tbody></table></div>
<h2>Specifications</h2>
<div class="tablewrap"><table><tbody>
<tr><td>Years</td><td class="n">{esc(c['years'])}</td></tr>
{mix}
<tr><td>Total weight</td><td class="n">{c['grams']:g} g</td></tr>
<tr><td>Pure {metal} content</td><td class="n">{c['oz']:.4f} troy oz</td></tr>
{face}
</tbody></table></div>
<h2>How to tell</h2>
<p>{esc(c['ident'])}</p>
<h2>Melt value vs. selling price</h2>
<p>Melt value is the metal alone. What you get for a {esc(c['short'])} depends on condition, date and who is buying. Common worn coins usually sell close to melt. Key dates, rare mint marks and high grades can be worth much more, so look those up before selling for metal.</p>
{junk_line}
{rel_html}
{plug("bullion" if metal == "gold" or "bullion" in c["group"] else "coins")}
"""
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Melt Calculator", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": c["name"], "item": f"{SITE}/coins/{c['slug']}/"}]}
    return page(f"/coins/{c['slug']}/", f"{c['name']} Melt Value Today ({c['years']}) | Melt Calculator",
                f"How much is a {c['short']} worth in {metal}? {c['oz']:.4f} oz of {metal}, worth {money(per)} at spot as of {ASOF}. Calculator, specs and how to tell.", body, ld)

# ---------- junk silver
def build_junk():
    dime = next(c for c in COINS if c["slug"] == "mercury-dime")["oz"] / 0.10
    half40 = next(c for c in COINS if c["slug"] == "kennedy-half-40")["oz"] / 0.50
    nick = next(c for c in COINS if c["slug"] == "war-nickel")["oz"] / 0.05
    fields = [("j-90", "90% dimes, quarters and halves (pre-1965)", dime, "100.00"),
              ("j-40", "40% Kennedy halves (1965-1970)", half40, "0"),
              ("j-35", "35% war nickels (1942-1945)", nick, "0")]
    ins = "".join(f'<div><label for="{i}">{esc(l)}, face value ($)</label><input id="{i}" inputmode="decimal" data-face-oz="{oz}" value="{v}" data-kind="amount"></div>' for i, l, oz, v in fields)
    trs = "".join(f'<tr><td>{money(f)} face</td><td class="n">{dime*f:.3f} oz</td><td class="n" data-melt="silver" data-oz="{dime}" data-mult="{f}">{money(dime*f*SPOT["silver"])}</td></tr>' for f in (1, 10, 100, 1000))
    body = f"""
<section class="hero">
  <div class="eyebrow">Junk silver</div>
  <h1>Junk Silver Calculator</h1>
  <p class="lede">Enter the face value of your old silver coins and see what the silver inside is worth today. Add up dimes, quarters and halves together, since every 90% coin holds the same silver per dollar of face.</p>
  <div class="calc" id="junk">
    <div class="in">
      <div><label for="j-basis">90% silver weight</label><select id="j-basis">
        <option value="0.715" data-label="Circulated weight: 0.715 oz per $1 face of 90%" selected>Circulated (0.715 oz per $1 face)</option>
        <option value="{dime}" data-label="Full mint weight: {dime:.4f} oz per $1 face of 90%">Full mint weight ({dime:.4f} oz per $1 face)</option>
      </select></div>
      {ins}{spot_inputs(("silver",))}</div>
    <div class="out" aria-live="polite">
      <div class="small">Melt value</div>
      <div class="big" id="junk-total">{money(0.715*100*SPOT['silver'])}</div>
      <dl class="kv"><dt>Pure silver</dt><dd id="junk-oz">{0.715*100:.4f} oz</dd></dl>
      <div class="basis" id="junk-basis">Circulated weight: 0.715 oz per $1 face of 90%</div>
    </div>
  </div>
</section>
<h2>90% silver by face value</h2>
<div class="tablewrap"><table><thead><tr><th>Face value</th><th class="n">Pure silver</th><th class="n">Melt value</th></tr></thead><tbody>{trs}</tbody></table></div>
<h2>How the math works</h2>
<p>A new 90% dime holds {dime*0.1:.7f} troy oz of silver. Quarters and halves are exactly 2.5 and 5 times that, so every dollar of face value in 90% coins holds {dime:.4f} oz no matter which mix you have. Worn coins weigh a bit less, so most dealers figure 0.715 oz per dollar of face for circulated junk. The calculator uses that by default; switch to full mint weight for uncirculated coins.</p>
<p>40% Kennedy halves hold {half40:.4f} oz per dollar of face, and 35% war nickels hold {nick:.4f} oz per dollar of face.</p>
<p>Not sure what counts? See <a href="/is-my-coin-silver/">which US coins are silver</a>.</p>
{plug("junk")}
"""
    return page("/junk-silver/", "Junk Silver Calculator: 90% Silver Value by Face Value | Melt Calculator",
                f"Enter the face value of your pre-1965 dimes, quarters and halves and see the melt value. $1 face of 90% silver holds {dime:.4f} oz.", body)

# ---------- bars and rounds
def build_bullion():
    silver_p = [["0.999", ".999 fine"], ["0.9999", ".9999 fine"], ["0.925", ".925 sterling"],
                ["0.9", ".900 US coin silver"], ["0.8", ".800 silver"]]
    gold_p = [["0.9999", ".9999 fine (24 karat)"], ["0.999", ".999 fine"], ["0.9167", "22 karat (.9167)"],
              ["0.9", ".900 US coin gold"], ["0.75", "18 karat (.750)"], ["0.585", "14 karat (.585)"], ["0.417", "10 karat (.417)"]]
    popts = "".join(f'<option value="{v}">{esc(l)}</option>' for v, l in silver_p)
    pdata = esc(json.dumps({"silver": silver_p, "gold": gold_p}))
    body = f"""
<section class="hero">
  <div class="eyebrow">Bars, rounds and scrap</div>
  <h1>Bar, Round and Scrap Melt Calculator</h1>
  <p class="lede">For anything sold by weight: silver bars and rounds, gold bars, sterling flatware or karat gold jewelry. Enter the weight and purity and get the metal value.</p>
  <div class="calc" id="bullion">
    <div class="in">
      <div class="row2">
        <div><label for="b-metal">Metal</label><select id="b-metal"><option value="silver">Silver</option><option value="gold">Gold</option></select></div>
        <div><label for="b-purity">Purity</label><select id="b-purity" data-purities="{pdata}">{popts}</select></div>
      </div>
      <div class="row2">
        <div><label for="b-weight">Weight</label><input id="b-weight" inputmode="decimal" value="10" data-kind="amount"></div>
        <div><label for="b-unit">Unit</label><select id="b-unit"><option value="oz">Troy ounces</option><option value="g">Grams</option><option value="kg">Kilograms</option><option value="dwt">Pennyweight (dwt)</option></select></div>
      </div>
      <div><label for="b-qty">How many pieces</label><input id="b-qty" type="number" inputmode="numeric" min="0" step="1" value="1" data-kind="count"></div>
      {spot_inputs()}
    </div>
    <div class="out" aria-live="polite">
      <div class="small">Melt value</div>
      <div class="big" id="b-total">{money(10*0.999*SPOT['silver'])}</div>
      <dl class="kv"><dt>Pure metal</dt><dd id="b-oz">{10*0.999:.4f} oz</dd></dl>
    </div>
  </div>
</section>
<h2>Units</h2>
<p>Precious metals are weighed in troy ounces. One troy ounce is {TROY_OZ_G} grams, a little heavier than a kitchen ounce. A pennyweight (dwt) is 1/20 of a troy ounce and is common for jewelry scrap.</p>
<p>A bar stamped "10 oz .999" holds 9.99 oz of pure silver. Dealers usually price .999 bars and rounds on the stamped weight plus or minus a premium.</p>
{plug()}
"""
    return page("/bars-and-rounds/", "Silver and Gold Bar, Round and Scrap Melt Calculator | Melt Calculator",
                "Melt value for silver and gold bars, rounds, sterling and karat gold by weight and purity, at today's spot price.", body)

# ---------- is my coin silver
def build_guide():
    rows = [
        ("Cents", "None. Pennies were never silver. 1943 steel cents are steel, not silver.", None),
        ("Nickels", "1942-1945 war nickels with a large mint mark over Monticello are 35% silver.", "war-nickel"),
        ("Dimes", "1964 and earlier are 90% silver. 1965 and later are not.", "roosevelt-dime-silver"),
        ("Quarters", "1964 and earlier are 90% silver. 1965 and later circulation quarters are not.", "washington-quarter-silver"),
        ("Half dollars", "1964 and earlier are 90% silver. 1965-1970 Kennedy halves are 40% silver. 1971 and later circulation halves are not.", "kennedy-half-1964"),
        ("Dollars", "Morgan and Peace dollars are 90% silver. Only S-mint collector Eisenhower dollars are 40% silver. Susan B. Anthony, Sacagawea and Presidential dollars have no silver.", "morgan-dollar"),
    ]
    trs = "".join(f'<tr><td>{esc(d)}</td><td>{esc(t)}{f" <a href=/coins/{s}/>Melt value</a>" if s else ""}</td></tr>' for d, t, s in rows)
    body = f"""
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Calculator</a> / Is my coin silver?</nav>
<h1>Is My Coin Silver?</h1>
<p class="lede">For US coins the date answers it almost every time. The cutoff is 1964: dimes, quarters and halves dated 1964 or earlier are 90% silver.</p>
<h2>By denomination</h2>
<div class="tablewrap"><table><thead><tr><th>Coin</th><th>Which ones are silver</th></tr></thead><tbody>{trs}</tbody></table></div>
<h2>Check the edge</h2>
<p>Look at the edge of a dime, quarter or half. A 90% silver coin is silver all the way through, so the edge is solid silver colored. A clad coin from 1965 on shows a copper stripe between two layers.</p>
<h2>Exceptions to know</h2>
<p>Silver proof sets from 1992 on include silver dimes, quarters and halves with later dates. The 1976-S Bicentennial quarter, half and dollar were also sold in 40% silver collector sets. These look like ordinary coins, so check the mint mark and whether they came from a proof or mint set.</p>
<p>Ready to add it up? Use the <a href="/">melt calculator</a> or the <a href="/junk-silver/">junk silver calculator</a>.</p>
{plug()}
"""
    return page("/is-my-coin-silver/", "Is My Coin Silver? Which US Coins Are Silver by Year | Melt Calculator",
                "Which US coins are silver: dimes, quarters and halves dated 1964 and earlier are 90% silver. Full guide by denomination, plus the edge test.", body)

def build_about():
    body = f"""
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Calculator</a> / About</nav>
<h1>About Melt Calculator</h1>
<p class="lede">Melt Calculator is a free tool from PlainsMadeCo, a one-person shop in Lincoln, Nebraska that builds software for coin collectors, stackers and dealers.</p>
<h2>How the numbers work</h2>
<p>Every coin's metal content is calculated from its official weight and purity: grams times purity, divided by {TROY_OZ_G} grams per troy ounce. Bullion coins use the fine content their mint states. Values are rounded only for display.</p>
<p>Gold and silver spot prices come from xaus.com and refresh automatically twice a day, around 7 AM and 3 PM Central. The bar at the top of every page shows when the last successful update happened, in your own time zone. If an update fails, the site keeps the last good price and flags it once it is more than a day and a half old.</p>
<p>Spot prices are indicative market prices, not a quote to buy or sell. You can type in your own spot price on any calculator, and it stays on your device.</p>
<h2>Contact</h2>
<p>Spot an error or want a coin added? Email <a href="mailto:ethanuhlir@gmail.com">ethanuhlir@gmail.com</a>. Dealers looking for inventory software can see what PlainsMadeCo builds at <a href="https://plainsmadeco.com">plainsmadeco.com</a>.</p>
{plug()}
"""
    return page("/about/", "About | Melt Calculator", "How Melt Calculator works out coin melt values, where the spot prices come from, and who makes it.", body)

def build_404():
    body = '<section class="hero"><h1>Page not found</h1><p class="lede">That page does not exist. Try the <a href="/">melt calculator</a>.</p></section>'
    page("/404/", "Page not found | Melt Calculator", "Page not found.", body)
    (DOCS / "404.html").write_text((DOCS / "404" / "index.html").read_text().replace('<link rel="canonical" href="' + SITE + '/404/">', ""))
    (DOCS / "404" / "index.html").unlink(); (DOCS / "404").rmdir()

def main():
    paths = [build_home(), build_junk(), build_bullion(), build_guide(), build_about()]
    paths += [build_coin(c) for c in COINS]
    build_404()
    today = datetime.date.today().isoformat()
    (DOCS / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>\n" for p in paths) + "</urlset>\n")
    (DOCS / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    (DOCS / "CNAME").write_text("meltcalculator.plainsmadeco.com\n")
    (DOCS / ".nojekyll").write_text("")
    print(f"built {len(paths)} pages")

if __name__ == "__main__":
    main()
