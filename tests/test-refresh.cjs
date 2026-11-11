// Node >=18: deterministic refresh, failure, stale-age and custom-price tests.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(require('node:path').join(__dirname, '..', 'docs', 'assets', 'app.js'), 'utf8');
async function run(custom = null) {
  let now = Date.now(), calls = 0, payload, fail = false;
  const base = {gold:4000, silver:50, as_of:new Date(now).toISOString()};
  payload = {...base, silver:60};
  const events = {}, intervals = [], stale = {hidden:true}, date = {};
  const price = {textContent:'', getAttribute:()=> 'silver'};
  const doc = {hidden:false, activeElement:null,
    querySelector:s => s === '[data-stale]' ? stale : s === '[data-asof]' ? date : null,
    querySelectorAll:s => s === '[data-spot]' ? [price] : [],
    addEventListener:(n,f) => events[n]=f};
  class Clock extends Date { static now(){return now;} }
  vm.runInNewContext(code, {window:{SPOT:base, addEventListener:(n,f)=>events[n]=f},
    document:doc, Date:Clock, AbortController, Number, JSON,
    localStorage:{getItem:()=>custom ? JSON.stringify(custom):null, setItem(){},removeItem(){}},
    setTimeout:()=>1,clearTimeout(){},setInterval:(f,ms)=>intervals.push({f,ms}),
    fetch:async()=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>payload};}});
  const flush = async()=>{for(let i=0;i<12;i++) await Promise.resolve();};
  await flush();
  assert.equal(price.textContent, custom ? '$30.00':'$60.00');
  assert.equal(stale.hidden,true);
  assert.deepEqual(intervals.map(x=>x.ms),[60000,300000]);
  now+=60001;payload={...base,silver:70,as_of:new Date(now).toISOString()};
  events.focus();await flush();assert.equal(calls,2);
  assert.equal(price.textContent,custom ? '$30.00':'$70.00');
  now+=60001;payload={...base,silver:Infinity};events.visibilitychange();await flush();
  assert.equal(price.textContent,custom ? '$30.00':'$70.00');
  now+=37*3600000;fail=true;intervals[0].f();assert.equal(stale.hidden,false);
  intervals[1].f();await flush();assert.equal(stale.hidden,false);
  assert.equal(price.textContent,custom ? '$30.00':'$70.00');
  now+=60001;fail=false;payload={...base,silver:80,as_of:new Date(now).toISOString()};
  events.focus();await flush();assert.equal(stale.hidden,true);
  assert.equal(price.textContent,custom ? '$30.00':'$80.00');
  const before=calls;doc.hidden=true;intervals[1].f();await flush();assert.equal(calls,before);
}
(async()=>{await run();await run({silver:30,gold:4000});console.log('PASS: startup, focus, visibility, periodic refresh, stale age, offline recovery, invalid feed, hidden tab, custom override');})();
