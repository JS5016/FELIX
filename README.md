# FELIX — Ask FELIX

A working voice chatbot modelled on the **Ask FELIX** tab of `zsfelix.com/chat`: a
field assistant for pharma reps that you talk to between calls, rebuilt from
screenshots of the real product (Veeva CRM shell, orange theme, live voice call).

It runs entirely in the browser. No build step, no server, no API keys.

- **Listening** — Web Speech API (`SpeechRecognition`)
- **Voice** — `speechSynthesis`
- **Conversation** — a deterministic script in `assets/script-data.js`

## Run it

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly with `file://` also works, though some browsers only
grant microphone access over `http://localhost` or HTTPS.

Or just open `felix-standalone.html` — the whole app inlined into one file, no server.

Use Chrome, Edge, or Safari — Firefox has no `SpeechRecognition` and will fall back
to text input, which runs the same conversation.

## Three modes

Matching the real product, the composer offers *"Type a message, use your mic to
dictate, or start a live voice call."*

**Welcome** — the fox logo and three starter pills.

**Chat** — type, or tap the **mic** to dictate a single question. Replies stream in
with rich cards.

**Live voice call** — tap the **phone** or **waveform** button. Full-screen orb,
`Agent is speaking…` / `Listening…` states, a green LIVE TRANSCRIPT that fills in as
you talk, a mute button, and **End Conversation**. Turn taking is hands-free: FELIX
finishes speaking, then the mic reopens automatically. Tap the orb to interrupt him
mid-sentence.

If the mic is blocked or unavailable, a banner says so and everything still works by typing.

## The script

The demo opens on the line from the brief:

> *"Hey FELIX, I wrapped up early with Dr. Yuki — who else is in the same building with an active suggestion?"*

From there it supports a real back-and-forth:

| Ask | FELIX does |
| --- | --- |
| Who else is nearby with a suggestion? | Two HCP cards — priority, suite, walk time, the active suggestion and why it fired |
| Tell me about Dr. Watanabe | Profile, prescribing bars (Pacrivex vs Momelyx and Ruxoril), and the last touch |
| Her interaction history in more detail | Last four touches, and the thread running through them |
| Tell me about Dr. Raman | Ordered talking points, approved materials, a compliance warning |
| Is she free right now? | Today's rep-access window with three slots and the knock-on to the next call |
| Book it | Confirms the request, updates the route, queues content, sets a reminder |
| Log my call with Dr. Watanabe | Pre-fills from the schedule, drafts a call note from what you say, files it on request |
| What should I open with? | A suggested opener and why it works |
| The three welcome pills | Active suggestions this week · not contacted in 4 weeks · changed behavior |

Anything unrecognised gets a rotating fallback that steers you back to what FELIX handles.

## Editing the conversation

`assets/script-data.js` is the whole brain — `app.js` never needs to know the script.
Each node declares weighted keyword groups, the text shown, the text spoken (separate,
so the voice can read numbers and abbreviations naturally), rich cards, and follow-up chips:

```js
{
  id: 'availability',
  keywords: [{ w: 3, any: ['is she free', 'available now', 'can i see her'] }],
  after: ['nearby', 'raman'],   // scores higher right after these turns
  only: ['availability'],       // (on other nodes) can ONLY follow these turns
  text:   "Her office keeps Tuesday afternoons open for reps…",
  speech: "Her office keeps Tuesday afternoons open for reps…",  // read aloud
  blocks: [ { type: 'slots', … } ],
  chips:  ['Yes, book it', 'Try a different time']
}
```

Matching normalises the utterance, scores every node by keyword weight, boosts nodes
that fit the conversational context, and takes the best node above a threshold. `only`
is what makes short replies like "yes" or "file it" resolve correctly — they only mean
something after a specific question.

Card types available to `blocks`: `hcp`, `rx` (prescribing bars), `kv`, `panel`,
`checklist`, `slots`, `note`, `callout`. All are documented at the top of
`script-data.js`.

## Files

```
index.html              Veeva shell, tabs, welcome / chat / call views
assets/styles.css       light orange theme and components
assets/app.js           speech in/out, call state machine, matching, rendering
assets/script-data.js   the conversation — edit this to change the demo
build-standalone.js     inlines everything into felix-standalone.html
felix-standalone.html   single-file build, opens with no server
```

## Notes

All data is fictional — HCPs, products (Pacrivex, Momelyx, Ruxoril), prescription
counts, and affiliations are invented for the demo. The other five tabs (Overview,
GeoPlan, Call Prep, Route Planner, HCP Avatar) are placeholders; Ask FELIX is the
interactive one.

The UI was rebuilt from screenshots of the real product rather than from the live
site, which was unreachable from the build environment.
