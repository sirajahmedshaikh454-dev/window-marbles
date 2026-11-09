# Window Marbles

> The browser window is the level. Build the track by dragging windows around your desktop.

Window Marbles turns every browser window you open into a peephole onto **one shared world**, placed exactly where that window sits on your physical screen. The bottom edge of every window is a ledge. Click to drop a marble: it bounces, rolls off the end of the ledge, **falls out of the window**, and lands in whichever window you've put underneath. Steer marbles into a cup that sits somewhere on your screen by rearranging real windows.

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [How to play](#how-to-play)
- [Controls](#controls)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Security & privacy](#security--privacy)
- [Accessibility](#accessibility)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Skills & methodology](#skills--methodology)
- [License](#license)

---

## Features

- **One world across many windows:** the scene is drawn in screen coordinates, so overlapping windows show the same marbles in the same places.
- **Window edges are physics:** every window's bottom edge is a ledge marbles land on and roll along.
- **Blueprint grid fixed to the screen:** move a window and the grid stays put, like a hole cut into one sheet of paper.
- **Cup goal and guide arrows:** the cup sits at a fixed screen position; windows that can't see it show an arrow pointing to it.
- **Automatic leader election:** the oldest window runs the physics for everyone; close it and the next-oldest takes over, keeping the score.
- **No dependencies:** a tiny Node static server and vanilla JavaScript.

## Quick start

**Requirements:** Node.js 18+ and Chrome or Edge (any browser with `BroadcastChannel`).

```bash
git clone https://github.com/sirajahmedshaikh454-dev/window-marbles.git
cd window-marbles
npm start
```

Open **http://localhost:5200**.

## How to play

1. Press **+ window**. A second window opens just below the first.
2. Drag the second window so it sits **lower and slightly to one side**, overlapping the first a little like a staircase step.
3. Click near the top of the first window. The marble lands on that window's bottom edge, rolls off the end, and drops into the second window.
4. Find the teal **cup** (follow the arrow if it's off-window), rearrange windows to guide marbles in, and score.

## Controls

| Input | Action |
|---|---|
| Click anywhere | Drop a marble at that point |
| **+ window** | Open another game window below this one |
| Move / resize a window | Rebuild the track in real time |

## How it works

```
 each window (every frame)                       leader window only
 ─────────────────────────                       ──────────────────
 contentRect(window) ─► "hi" {id, rect} ──┐      rects = own + live peers
                                          ├──►   ledges(rects) ─► step(marbles, dt)
 BroadcastChannel('window-marbles') ◄─────┘      cup scoring, cleanup
                                                 broadcast "state" every frame
 draw(state) translated by −rect.left/top ◄──────────────────────┘
```

- **Window geometry.** `contentRect` combines `screenX/Y`, `outerWidth/Height` and `innerWidth/Height` to find exactly which part of the screen the page covers, skipping the title bar, tabs and borders.
- **Sync.** Windows announce themselves five times a second over `BroadcastChannel`. A window not heard from for 1.5 s, or that sent `bye` on `pagehide`, leaves the world.
- **Leader election.** Window ids start with a timestamp, so the sorted-first live id is the oldest window. Only it runs the physics. Followers send clicks to it as `drop` messages and draw the state it broadcasts.
- **Physics.** Gravity is 1800 px/s², marbles bounce with restitution 0.45, and keep a minimum rolling speed so they always leave a ledge. Each frame is split into ~4 ms substeps so a fast marble can't tunnel through a ledge.
- **Robustness.** Minimized or hidden windows report a size of 0×0 and are left out, so they can't become invisible ledges or hold the cup.

## Project structure

```
window-marbles/
├── index.html    # page shell, HUD, styles
├── app.js        # sync, leader loop, drawing, input
├── lib.js        # pure logic: contentRect, ledges, step (physics + scoring), pickLeader
├── server.js     # zero-dependency static server (localhost only)
├── test.js       # node:test checks
└── package.json  # npm start / npm test
```

## Testing

```bash
npm test
```

Unit tests cover:

- **Window geometry:** the content rect skips the title bar and borders.
- **Two-window physics:** a marble lands on one window's ledge, rolls off, and comes to rest on the next window down.
- **No tunnelling:** a marble falling at 9,000 px/s still stops on the ledge.
- **Cup scoring** and **leader election** with timed-out windows.

In-browser checks (with frames driven by hand, since the browser pane was hidden):

- A marble falls, bounces twice and settles on the window's bottom edge.
- A simulated second window is recognized, its click drops a marble, and it receives about 60 state updates a second.
- Leader handover: this window follows an older one, receives its score (42), and takes over without losing it when that window closes.

## Security & privacy

- The server binds to **127.0.0.1** only. It serves only `.html`, `.js` and `.css`, refuses path traversal, dotfiles and its own server and test files, and returns `400` for malformed URLs instead of crashing.
- `BroadcastChannel` is same-origin only: other sites can't read or send game messages.
- No accounts, storage, analytics or personal data. The only outbound request is Google Fonts.

## Accessibility

- The **+ window** button is a real button with a visible focus ring.
- The HUD states the window count, which window runs the physics, and the score as text.
- The play itself is pointer-based and visual; there's no keyboard-only mode yet (see the roadmap).

## Known limitations

- Window borders and title bars differ between systems, so a marble can cross an edge a few pixels off.
- Marbles don't bump into each other.
- Multi-monitor play depends on the browser reporting one continuous screen layout.
- Moving real windows on a desktop wasn't automated in testing; that was simulated, as described above.

## Roadmap

- [ ] Resize a window to tilt its ledge.
- [ ] Spatial sound that plays from whichever window a marble is in.
- [ ] Two computers on one board over WebRTC.
- [ ] A keyboard mode for dropping marbles and cycling windows.

## Skills & methodology

**How it was built**

1. **A concept with a real twist:** "the interface itself is the surprise". The window frames are the level design.
2. **Pure core first.** Geometry, physics, scoring and leader election were written as pure functions with tests before any page code. One failing test was traced to a wrong timestamp in the test itself and corrected.
3. **One commit per step**, each pushed straight away: core → page and sync → docs.
4. **Verifying without a visible browser.** The browser pane was hidden, so frames didn't run. The method was to emulate a viewport size, add a **temporary debug hook** to drive frames by hand, fake a second window on the same `BroadcastChannel`, then remove the hook before committing.
5. **Bug found by testing:** the hidden pane reported a 0×0 window, which showed that minimized windows would have become invisible ledges. Fixed by filtering out empty windows.
6. **Security probe** of the server: malformed URLs, traversal, dotfiles and source files were all refused.

**Tools and skills used:** Claude Code (Opus), the in-app browser with viewport emulation and JS-driven test harnesses, `BroadcastChannel`, Canvas 2D, `node:test`, and the *ponytail* smallest-complete-change approach.

## License

MIT

---

<details>
<summary>Spoiler: the easter egg</summary>

Type **rain** in any window. Eight marbles drop along the top of every open window at once.

</details>
