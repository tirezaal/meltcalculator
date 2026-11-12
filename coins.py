"""Coin data. Fine metal weight is always derived: grams x fineness / 31.1034768,
unless the mint states a fixed fine content (asw/agw)."""

TROY_OZ_G = 31.1034768

def fine_oz(c):
    if c.get("fine_oz") is not None:
        return c["fine_oz"]
    return round(c["grams"] * c["fineness"] / TROY_OZ_G, 7)

# metal: "silver" or "gold"
# face: face value in dollars (used by junk silver math)
COINS = [
    # ---- silver: nickels and dimes
    dict(slug="war-nickel", name="Jefferson War Nickel", short="War nickel", metal="silver",
         years="1942-1945", grams=5.00, fineness=0.35, face=0.05, group="Nickels",
         ident="Silver war nickels have a large mint mark (P, D or S) above Monticello on the back. 1942 is split: early 1942 nickels are regular copper-nickel, so check for the big mint mark.",
         mix="56% copper, 35% silver, 9% manganese"),
    dict(slug="barber-dime", name="Barber Dime", short="Barber dime", metal="silver",
         years="1892-1916", grams=2.50, fineness=0.90, face=0.10, group="Dimes",
         ident="Every Barber dime is 90% silver."),
    dict(slug="mercury-dime", name="Mercury Dime", short="Mercury dime", metal="silver",
         years="1916-1945", grams=2.50, fineness=0.90, face=0.10, group="Dimes",
         ident="Every Mercury (Winged Liberty Head) dime is 90% silver."),
    dict(slug="roosevelt-dime-silver", name="Roosevelt Dime (1946-1964)", short="Silver Roosevelt dime", metal="silver",
         years="1946-1964", grams=2.50, fineness=0.90, face=0.10, group="Dimes",
         ident="Roosevelt dimes dated 1964 and earlier are 90% silver. 1965 and later circulation dimes are copper-nickel clad with no silver."),
    # ---- quarters
    dict(slug="barber-quarter", name="Barber Quarter", short="Barber quarter", metal="silver",
         years="1892-1916", grams=6.25, fineness=0.90, face=0.25, group="Quarters",
         ident="Every Barber quarter is 90% silver."),
    dict(slug="standing-liberty-quarter", name="Standing Liberty Quarter", short="Standing Liberty quarter", metal="silver",
         years="1916-1930", grams=6.25, fineness=0.90, face=0.25, group="Quarters",
         ident="Every Standing Liberty quarter is 90% silver. Many have worn-off dates, which does not change the silver content."),
    dict(slug="washington-quarter-silver", name="Washington Quarter (1932-1964)", short="Silver Washington quarter", metal="silver",
         years="1932-1964", grams=6.25, fineness=0.90, face=0.25, group="Quarters",
         ident="Washington quarters dated 1964 and earlier are 90% silver. No quarters were struck in 1933. 1965 and later circulation quarters have no silver; the only later silver ones are collector issues like the 1976-S 40% Bicentennial and silver proof sets."),
    dict(slug="bicentennial-quarter-40", name="1976-S 40% Silver Bicentennial Quarter", short="1976-S silver Bicentennial quarter", metal="silver",
         years="1976", grams=5.75, fineness=0.40, face=0.25, group="Quarters",
         ident="Only the 1976-S quarters the Mint sold in its 40% silver three-coin uncirculated and proof sets contain silver. Bicentennial quarters found in circulation are copper-nickel clad, and the S-mint proofs in the regular six-coin proof sets are clad too, so an S mint mark alone does not mean silver. A silver one weighs 5.75 grams and its edge looks silvery gray; a clad one weighs 5.67 grams and shows a copper stripe on the edge."),
    # ---- halves
    dict(slug="barber-half", name="Barber Half Dollar", short="Barber half", metal="silver",
         years="1892-1915", grams=12.50, fineness=0.90, face=0.50, group="Half dollars",
         ident="Every Barber half dollar is 90% silver."),
    dict(slug="walking-liberty-half", name="Walking Liberty Half Dollar", short="Walking Liberty half", metal="silver",
         years="1916-1947", grams=12.50, fineness=0.90, face=0.50, group="Half dollars",
         ident="Every Walking Liberty half dollar is 90% silver."),
    dict(slug="franklin-half", name="Franklin Half Dollar", short="Franklin half", metal="silver",
         years="1948-1963", grams=12.50, fineness=0.90, face=0.50, group="Half dollars",
         ident="Every Franklin half dollar is 90% silver."),
    dict(slug="kennedy-half-1964", name="1964 Kennedy Half Dollar", short="1964 Kennedy half", metal="silver",
         years="1964", grams=12.50, fineness=0.90, face=0.50, group="Half dollars",
         ident="Only 1964 Kennedy halves are 90% silver. 1965-1970 are 40% silver, and circulation halves from 1971 on have no silver."),
    dict(slug="kennedy-half-40", name="Kennedy Half Dollar (1965-1970)", short="40% Kennedy half", metal="silver",
         years="1965-1970", grams=11.50, fineness=0.40, face=0.50, group="Half dollars",
         ident="Kennedy halves dated 1965 through 1970 are 40% silver. They look like later clad halves, so go by the date."),
    dict(slug="bicentennial-half-40", name="1976-S 40% Silver Bicentennial Half Dollar", short="1976-S silver Bicentennial half", metal="silver",
         years="1976", grams=11.50, fineness=0.40, face=0.50, group="Half dollars",
         ident="Only the 1976-S halves the Mint sold in its 40% silver three-coin uncirculated and proof sets contain silver. Bicentennial halves found in circulation are copper-nickel clad, and the S-mint proofs in the regular six-coin proof sets are clad too, so an S mint mark alone does not mean silver. A silver one weighs 11.50 grams and its edge looks silvery gray; a clad one weighs 11.34 grams and shows a copper stripe on the edge."),
    # ---- dollars
    dict(slug="morgan-dollar", name="Morgan Silver Dollar", short="Morgan dollar", metal="silver",
         years="1878-1904, 1921", grams=26.73, fineness=0.90, face=1.00, group="Dollars",
         ident="Every Morgan dollar is 90% silver. Many Morgans sell well over melt because of collector demand, so check the date and mint before selling one for metal."),
    dict(slug="peace-dollar", name="Peace Silver Dollar", short="Peace dollar", metal="silver",
         years="1921-1928, 1934-1935", grams=26.73, fineness=0.90, face=1.00, group="Dollars",
         ident="Every Peace dollar is 90% silver."),
    dict(slug="eisenhower-dollar-40", name="40% Silver Eisenhower Dollar", short="40% Ike dollar", metal="silver",
         years="1971-1976", grams=24.59, fineness=0.40, face=1.00, group="Dollars",
         ident="Only the 40% silver collector Eisenhower dollars contain silver: the S-mint uncirculated coins sold in blue packs and the S-mint silver proofs sold in brown boxes. An S mint mark or proof finish alone does not mean silver, because the Mint also struck copper-nickel clad S-mint proofs, including every Ike in the regular proof sets from 1973 through 1978. Ikes from circulation are copper-nickel with no silver."),
    # ---- silver bullion coins
    dict(slug="american-silver-eagle", name="American Silver Eagle", short="Silver Eagle", metal="silver",
         years="1986-present", grams=31.103, fineness=0.999, fine_oz=1.0, face=None, group="Silver bullion coins",
         ident="Each American Silver Eagle contains one troy ounce of .999 fine silver."),
    dict(slug="silver-maple-leaf", name="Silver Maple Leaf", short="Silver Maple Leaf", metal="silver",
         years="1988-present", grams=31.11, fineness=0.9999, fine_oz=1.0, face=None, group="Silver bullion coins",
         ident="Each 1 oz Canadian Silver Maple Leaf contains one troy ounce of .9999 fine silver."),
    # ---- gold
    dict(slug="double-eagle", name="$20 Gold Double Eagle", short="$20 Double Eagle", metal="gold",
         years="1850-1933", grams=33.436, fineness=0.90, face=None, group="US gold coins",
         ident="Liberty Head (1850-1907) and Saint-Gaudens (1907-1933) $20 gold pieces are 90% gold. Common dates trade near melt plus a premium; scarce dates are worth far more."),
    dict(slug="gold-eagle-10", name="$10 Gold Eagle", short="$10 Eagle", metal="gold",
         years="1838-1933", grams=16.718, fineness=0.90, face=None, group="US gold coins",
         ident="Liberty Head and Indian Head $10 gold pieces from 1838 on are 90% gold."),
    dict(slug="half-eagle", name="$5 Gold Half Eagle", short="$5 Half Eagle", metal="gold",
         years="1839-1929", grams=8.359, fineness=0.90, face=None, group="US gold coins",
         ident="Liberty Head and Indian Head $5 gold pieces from 1839 on are 90% gold."),
    dict(slug="quarter-eagle", name="$2.50 Gold Quarter Eagle", short="$2.50 Quarter Eagle", metal="gold",
         years="1840-1929", grams=4.18, fineness=0.90, face=None, group="US gold coins",
         ident="Liberty Head and Indian Head $2.50 gold pieces from 1840 on are 90% gold."),
    dict(slug="american-gold-eagle", name="American Gold Eagle (1 oz)", short="1 oz Gold Eagle", metal="gold",
         years="1986-present", grams=33.931, fineness=0.9167, fine_oz=1.0, face=None, group="Gold bullion coins",
         ident="The 1 oz American Gold Eagle contains one troy ounce of gold in a 22 karat alloy. Fractional sizes hold 1/2, 1/4 and 1/10 oz.",
         sizes=[("1 oz", 1.0), ("1/2 oz", 0.5), ("1/4 oz", 0.25), ("1/10 oz", 0.1)]),
    dict(slug="krugerrand", name="Gold Krugerrand (1 oz)", short="Krugerrand", metal="gold",
         years="1967-present", grams=33.93, fineness=0.9167, fine_oz=1.0, face=None, group="Gold bullion coins",
         ident="The 1 oz South African Krugerrand contains one troy ounce of gold in a 22 karat alloy."),
]

for c in COINS:
    c["oz"] = fine_oz(c)
