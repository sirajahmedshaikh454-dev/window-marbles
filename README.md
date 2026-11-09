# Window Marbles

Every browser window you open is a peephole into **one shared world**, placed exactly where the window sits on your screen. The bottom edge of each window is a ledge. Click to drop a marble: it bounces, rolls off the end of the ledge, falls out of the window, and lands in whichever window you've put underneath.

You build the track by **dragging real windows around your desktop**.

## Run it

```bash
npm start
```

Open http://localhost:5200, then press **+ window** (or open the same address in another window). Drag the new window so it sits a little lower and to the side of the first one. Click near the top of the first window and watch the marble cross over.

No dependencies: just Node 18+ and Chrome or Edge. `npm test` checks the physics and the window logic.

## The game

- Somewhere inside one of your windows there's a **teal cup**. Get a marble into it to score, and a new cup appears elsewhere.
- If the cup isn't in the window you're looking at, a teal arrow on the edge points to it.
- The blueprint grid is fixed to the screen, not to the window, so the windows line up like holes cut in one sheet of paper.

## How it works

- Each window works out the part of the screen it covers from `screenX/Y` and the window's outer and inner size, then shares that with the others over a `BroadcastChannel` five times a second.
- The **oldest open window runs the physics** for everyone and broadcasts the marbles every frame; the others just draw. Close it and the next-oldest takes over, keeping the score.
- Each physics frame is split into small steps, so a fast marble can't skip through a ledge.
- Minimized windows report a size of 0 and are left out of the world.

## Limits

- Window positions come from the browser. Window borders and title bars differ slightly between systems, so a marble may cross a window edge a few pixels off.
- Marbles don't bump into each other.
- Windows on two different monitors work as long as the browser reports one continuous screen layout.

---

<details>
<summary>Spoiler: the easter egg</summary>

Type **rain** in any window. Eight marbles drop along the top of every open window at once.

</details>
