"""Pull gold and silver spot into docs/data/spot.json.
Keeps the last good price if the fetch fails or looks wrong."""
import json, urllib.request, datetime, pathlib, sys

OUT = pathlib.Path(__file__).parent / "docs" / "data" / "spot.json"
URL = "https://xaus.com/api/v1/spot?compact=1"

def load_old():
    try:
        return json.loads(OUT.read_text())
    except Exception:
        return None

def main():
    old = load_old()
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "meltcalculator.plainsmadeco.com"})
        with urllib.request.urlopen(req, timeout=20) as r:
            d = json.load(r)
        gold = float(d["spot_usd_oz"])
        silver = float(d["silver_usd_oz"])
        if not (500 < gold < 50000 and 3 < silver < 1000):
            raise ValueError(f"price out of range: gold {gold}, silver {silver}")
        as_of = d.get("price_as_of") or d.get("updated_at") or datetime.datetime.utcnow().isoformat() + "Z"
        new = {"gold": round(gold, 2), "silver": round(silver, 2), "as_of": as_of, "source": "xaus.com"}
    except Exception as e:
        print("spot fetch failed, keeping last price:", e, file=sys.stderr)
        if old is None:
            sys.exit(1)
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(new, indent=2) + "\n")
    print("spot updated:", new)

if __name__ == "__main__":
    main()
