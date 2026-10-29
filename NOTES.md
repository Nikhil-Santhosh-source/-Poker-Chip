# Felt & Fortune: developer notes

Single-file Texas Hold'em app (`index.html`, no build step). Virtual chips, 1000 start, blinds 5/10, up to 9 players.

## Architecture
- **Rules engine**: pure functions over one state object, between the `ENGINE START` / `ENGINE END`
  markers in `index.html`. `tests/engine.js` loads that block straight from `index.html`, so the
  tests always run the code that ships (no copy to keep in sync).
- **Networking**: PeerJS (WebRTC). The host's browser holds the real state. Its PeerJS id is
  `feltfortune-v2-<ROOM CODE>`. Players connect with a random PeerJS id and send
  `{type:'join', id, name}`. Their player id is kept in `sessionStorage`, so each tab is its own player and a reload keeps your seat.
- The host sends each player a **personal view** (`viewFor`): no deck, and nobody else's hole cards
  until they're shown down.
- Messages from player to host: `join`, `start`, `action`, `rebuy`, `leave`. From host to player:
  `state`, `error`, `rejected` (table full), `closed`.

## Why joining used to fail (fixed)
1. **Error messages were invisible in the lobby.** The toast lived inside the hidden table screen,
   so join errors never showed up. Toasts are now global, and the lobby also shows errors inline.
2. **The custom ICE config removed PeerJS's working TURN relay.** The Open Relay demo
   credentials (`openrelayproject`) no longer work. Overriding `config` dropped PeerJS's own
   default TURN servers (`turn:*.turn.peerjs.com`), so players on different networks couldn't connect.
   The PeerJS defaults are now back, plus an extra STUN server.
3. **The host lost its room code when the tab went to the background.** On phones the broker
   socket drops when you switch apps (e.g. to WhatsApp to share the code), and the table can't be found
   until it re-registers. The host now reconnects automatically: on an interval, and on `visibilitychange`.
4. **Player PeerJS ids collided.** The joiner's PeerJS id was a fixed id from `localStorage`. With
   two tabs, or a fast reconnect, that gave `unavailable-id`. Joiners now get a random PeerJS id.
5. PeerJS wasn't pinned (`peerjs@1`), so its version could change silently. It's now pinned to `1.5.5`.

## Other fixes
- Two players tapping **Deal** at the same time restarted the hand that was in progress. A hand
  can't be dealt now while one is running.
- Players who reconnected stayed "sitting out" forever. Now they're dealt back in.
- A player who disconnected mid-hand froze the table when their turn came. Away players now
  auto-check, or auto-fold if there's a bet.
- The raise slider snapped to multiples of 10, so **Max** could send less than a real all-in.
- The minimum raise wasn't enforced by the host.
- The burn card is used before each street. Shuffling uses `crypto.getRandomValues`.
- The **Resume** button failed if you clicked it within a few seconds of a reload. It now retries
  while the broker frees the old id. Players reconnect automatically when the host comes back.
- Players can **rebuy** when they're out of chips, and they can **leave** the table cleanly.

## If connections still fail
Some strict networks (certain mobile carriers, corporate Wi-Fi) need a TURN relay. PeerJS's free
relay is shared and best-effort. For the most reliable setup, create a free TURN account
(metered.ca or Cloudflare Calls) and add its server to `ICE_SERVERS` in `index.html`.
Long term, a small WebSocket server would also remove the need for the host to keep their tab open.

## Tests
```
node tests/run.js
```
The tests cover hand ranking, labels, heads-up blinds, the min-raise rule, the double-deal guard,
blinds that put players all-in, rebuys, and chip conservation over hundreds of random hands for 2, 3, 5 and 9 players.
