# Felt & Fortune: developer notes

Single-file Texas Hold'em app (`index.html`, no build step). Virtual chips, up to 9 players.
The host picks the starting chips, blinds and turn timer.

## Architecture
- **Rules engine**: pure functions over one state object, between the `ENGINE START` / `ENGINE END`
  markers in `index.html`. `tests/engine.js` loads that block straight from `index.html`, so the
  tests always run the code that ships.
- **Networking (v3)**: messages go through public MQTT brokers over secure WebSockets
  (`wss://broker.emqx.io:8084` and `wss://broker.hivemq.com:8884`, via mqtt.js 5.10.4).
  Every message is published to **both** relays, and receivers drop duplicates by message id (`mid`).
- **Room isolation**: the topic is `feltfortune/v3/<sha256("room:"+CODE)[:32]>`. The payload is
  AES-GCM encrypted with a key derived by PBKDF2 from the room code. Strangers on the public broker see
  only random topic names and ciphertext.
- **Topics**: `/h` is the host's inbox. `/p/<inbox>` is each player's private inbox (a random id
  the player picks per session). `/all` carries host heartbeats, host-takeover announcements and "table closed".
- **Host = referee.** The host keeps the full state and sends each player a personal view
  (`viewFor`): no deck, nobody else's hole cards until shown down, and other players' private
  ids replaced with `seatN` aliases so they can't be used to send moves in someone else's name.
- **Presence**: players ping every 4 s, and the host heartbeats every 4 s. 16 s of silence counts
  as disconnected: the player is marked away, or the player's page shows "host isn't responding".
  The host gives everyone a grace period after its own tab was asleep, so a phone screen turning
  off doesn't mark the whole table away.
- **State versions**: every host commit bumps `state.ver`. Players ignore older or repeated
  versions, and ask for a resync when a heartbeat shows they missed one.
- **Resume**: the host's state is saved in `localStorage`. **Resume table** reopens the same room,
  and players' pings re-register them automatically. If the same table is opened in two places,
  the newer one wins and the older one steps down.

## Real-cards mode (`state.mode === 'chips'`)
- No deck and no hole cards. Streets still advance (preflop, flop, turn, river) so betting rounds
  and the "deal the flop" hints work as normal.
- At showdown, `doChipsShowdown` builds the main pot and side pots with `buildPots` (each pot lists
  the players who can win it). A pot only one player can win is paid out automatically (an uncalled
  bet). For the rest, `stage = 'award'`, and any seated player picks the winner(s) with
  `awardPot(state, potIndex, ids)`. Splits divide evenly, and the odd chip goes to the first player picked.
- Players see each other as `seatN` aliases, so the host maps those back to real ids before awarding.

## Showing cards
`showCards(state, id, 0 | 1 | 'both')` works once a hand is over. `viewFor` then reveals just those cards to everyone.

## Why friends couldn't join (v2 → v3)
v2 used PeerJS (WebRTC peer-to-peer). Two players on different networks need a TURN relay to connect.
PeerJS's free TURN server (`turn:*.turn.peerjs.com`) returned **no relay candidates** in testing,
so it's dead or overloaded. So joining only worked when both players were on the same network.
v3 drops peer-to-peer entirely. Everyone makes ordinary outbound secure-WebSocket connections
to the relays, which works on Wi-Fi, mobile data, and mixes of both.

## Known limits
- The relays are free community services with no uptime guarantee. Using two of them covers
  most outages. If both ever go away, swap in other public brokers in `RELAYS`, or a free
  private one (HiveMQ Cloud and EMQX Cloud both have free tiers).
- A player at the table who knows the room code and digs into dev tools could still read
  other players' join messages. This is fine for friends, but not for real-money play.
- A few strict networks block ports 8084/8884. Mobile data works around that.

## Tests
```
node tests/run.js
```
The tests cover hand ranking and labels, heads-up blinds, the min-raise rule, the double-deal
guard, blinds that put players all-in, rebuys, custom chips and blinds, sitting out, side pots,
showing cards, real-cards pots and awards (including splits), and chip conservation over hundreds
of random hands in both modes.
