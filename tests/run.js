const E = require('./engine.js');
let fails = 0;
function check(name, cond){ console.log((cond?'PASS ':'FAIL ')+name); if(!cond) fails++; }

// hand ranking
const rank = c => E.evaluate7(c)[0];
check('straight flush', rank(['AS','KS','QS','JS','TS','2H','3D'])===8);
check('wheel straight', rank(['AS','2H','3D','4C','5S','9H','KD'])===4);
check('quads', rank(['AS','AH','AD','AC','KH','2D','3C'])===7);
check('full house', rank(['AS','AH','AD','KH','KC','2D','3C'])===6);
check('AA beats KK', E.compareScores(E.evaluate7(['AS','AH','2D','5H','9C','QD','3C']),E.evaluate7(['KS','KH','2D','5H','9C','QD','3C']))>0);
check('hand label', E.handLabel(E.evaluate7(['KS','KH','KD','4C','4S','9H','2D']))==='Full House, Kings full of Fours');
check('royal flush label', E.handLabel(E.evaluate7(['AS','KS','QS','JS','TS','2H','3D']))==='Royal Flush');

const table = n => { let s = E.newTable('T'); for (let i=0;i<n;i++) s = E.addPlayer(s,'p'+i,'P'+i); return s; };
const act = (s, type, amt) => { const p = s.players[s.turnSeat]; const r = E.applyAction(s, p.id, type, amt); return r.ok ? E.advanceAfterAction(r.state) : r; };

// can't restart a hand that is in progress (two people tapping "Deal")
{ let s = E.startHand(table(3)).state; const r = E.startHand(s); check('no double deal mid-hand', !r.ok); }

// heads-up: dealer is SB and acts first pre-flop
{ const s = E.startHand(table(2)).state; const d = s.players[s.dealerSeat];
  check('heads-up dealer posts SB and acts first', d.bet===5 && s.turnSeat===s.dealerSeat); }

// minimum raise enforced
{ const s = E.startHand(table(3)).state; const p = s.players[s.turnSeat];
  check('raise below minimum rejected', !E.applyAction(JSON.parse(JSON.stringify(s)), p.id, 'raise', 15).ok);
  check('min raise accepted', E.applyAction(s, p.id, 'raise', 20).ok); }

// raise for exactly all your chips counts as all-in
{ const s = E.startHand(table(2)).state; const p = s.players[s.turnSeat];
  const r = E.applyAction(s, p.id, 'raise', p.bet + p.chips); check('raise of whole stack = all-in', r.ok && p.allIn && p.chips===0); }

// blinds put both players all-in: hand runs out to showdown by itself
{ let s = table(2); s.players[0].chips = 5; s.players[1].chips = 8;
  const r = E.startHand(s); check('all-in from blinds runs to showdown', r.ok && r.state.stage==='showdown' && r.state.community.length===5);
  check('chips conserved after blind all-in', r.state.players.reduce((a,p)=>a+p.chips,0)===13); }

// folding to a win ends the hand
{ let s = E.startHand(table(2)).state; s = act(s,'fold');
  check('fold ends hand with a winner', s.stage==='showdown' && s.winners.length===1); }

// rebuy only when busted and between hands
{ let s = table(2); check('no rebuy with chips', !E.rebuy(s,'p0').ok);
  s.players[0].chips = 0; check('rebuy when busted', E.rebuy(s,'p0').ok && s.players[0].chips===E.START_CHIPS); }

// away players are skipped when dealing
{ let s = table(3); s.players[2].away = true; s = E.startHand(s).state;
  check('away player not dealt in', !s.players[2].inHand); }

// chip conservation over random multi-player hands
const total = s => s.players.reduce((a,p)=>a+p.chips+p.totalBet,0);
for (const n of [2,3,5,9]){
  let s = table(n);
  const start = total(s); let ok = true;
  for (let h=0; h<200 && ok; h++){
    const r = E.startHand(s); if(!r.ok) break; s = r.state;
    let g=0;
    while (E.isBetting(s) && g++<400){
      const p=s.players[s.turnSeat], toCall=s.currentBet-p.bet, roll=Math.random();
      const minT = s.currentBet + s.minRaise;
      let res = roll<0.07 ? E.applyAction(s,p.id,'allin') :
                (roll<0.2 && toCall>0) ? E.applyAction(s,p.id,'fold') :
                (roll<0.3 && p.chips > minT - p.bet) ? E.applyAction(s,p.id,'raise', minT + Math.floor(Math.random()*(p.chips - (minT-p.bet)))) :
                toCall>0 ? E.applyAction(s,p.id,'call') : E.applyAction(s,p.id,'check');
      if(!res.ok){ console.log('  unexpected error:', res.error); ok=false; break; }
      s=E.advanceAfterAction(res.state);
    }
    if (g>=400 || total(s)!==start) ok=false;
    s = E.readyForNextHand(s);
  }
  check(`chips conserved over 200 hands, ${n} players`, ok);
}
process.exit(fails?1:0);
