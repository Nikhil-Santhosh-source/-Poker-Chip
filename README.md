# Felt & Fortune — deploying it as a real website

This is a single self-contained file (`index.html`) — no build step, no server code,
no database to set up. It uses **PeerJS** (a free WebRTC library with a free public
broker, no signup) so one browser tab acts as the "host" holding the game state, and
everyone else connects to it directly. Multiplayer works as long as the host keeps
that tab open.

## Fastest option: GitHub Pages (free, permanent link)

1. Go to github.com, sign in (or create a free account), and click **New repository**.
   Name it anything, e.g. `poker-night`. Keep it Public.
2. On the repo page, click **Add file → Upload files**, and upload `index.html`.
   Commit the change.
3. Go to **Settings → Pages**. Under "Build and deployment", set **Source** to
   "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a link after a minute or two, usually
   `https://<your-username>.github.io/poker-night/`. That's your permanent site —
   share it with friends any time.

## Even faster (no account): Netlify Drop

1. Go to **app.netlify.com/drop**.
2. Drag the `index.html` file onto the page.
3. You get an instant live link (something like `random-name-123.netlify.app`).
   Free, but the link is temporary unless you claim it with a free account.

## Cloudflare Pages / Vercel

Both have generous free tiers and support "drag and drop a folder to deploy" —
if you already use one of these, upload the same `index.html`.

## How a poker night actually works

1. Whoever wants to run the table opens the site, types their name, and taps
   **Host a table**. They get a short room code (e.g. `Q7K2X`).
2. They send that code (or tap **Copy invite** to copy the page link, which
   pre-fills the code) to friends.
3. Friends open the same site, type their name and the room code, tap **Join table**.
4. Anyone can tap **Deal next hand** once there are 2+ players. Play from there —
   fold / check / call / raise / all-in, with side pots handled automatically.
   On a computer you can use the keyboard: **F** fold, **C** check/call, **R** raise,
   **Enter** confirm, **L** hand log.

## Things worth knowing

- **The host's tab is the "server."** If the host closes their browser tab or loses
  internet, the table pauses. Reopening the same site shows a **Resume table**
  button that restores the last game state, and everyone else's page reconnects
  on its own. Players who refresh their page go straight back to their seat.
- **If someone drops mid-hand**, they're marked *away*: they check when they can and
  fold when they can't, so the table never waits on them.
- **This uses PeerJS's shared public broker**, which is free and requires no signup,
  but it's a shared community service — occasionally a connection may take a
  couple of retries. For a private group of friends this is normally fine.
- **Players never receive each other's hole cards** (or the deck). The host's own
  browser does hold the full state, so the host could peek using dev tools. Fine
  for a casual game with friends, but don't use it for real-money stakes.
- **Can't connect?** Some strict networks block direct connections. See
  "If connections still fail" in `NOTES.md` for adding your own free TURN relay.
- Chips are virtual and reset if everyone leaves and the host doesn't resume —
  there's no account system or persistent ledger across different game nights.
