# FELIX — Ask FELIX

A working voice chatbot modelled on the **Ask FELIX** tab of `zsfelix.com/chat`: a
field assistant for pharma reps that you talk to between calls, rebuilt from
screenshots of the real product (Veeva CRM shell, orange theme, live voice call).

It runs entirely in the browser. No build step, no server, and no API key required.

Three voice engines, switchable at runtime from the **gear** button:

| Engine | Conversation | Voice | Setup |
| --- | --- | --- | --- |
| **Browser** (default) | scripted | `speechSynthesis` | none |
| **ElevenLabs voice** | scripted | ElevenLabs TTS | API key |
| **ElevenLabs agent** | real LLM, free-form | ElevenLabs | public agent ID |

The default keeps a plain deployment working with zero configuration. See
[AGENT-PROMPT.md](AGENT-PROMPT.md) for the agent setup and a ready-to-paste
FELIX system prompt.

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

In **ElevenLabs agent** mode the same screen is driven by a real agent instead: the
SDK owns recognition, the LLM, the voice and barge-in, and the app just mirrors its
state into this UI. Tap-to-interrupt is disabled there because you can simply talk
over it.

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

## Voice engines

`assets/voice.js` is the only file that talks to a speech backend, so the rest of the
app is engine-agnostic — it calls `Voice.speak(text, { onStart, onDone })` and lets the
layer decide.

**ElevenLabs voice** posts to `POST /v1/text-to-speech/{voice_id}` with `eleven_flash_v2_5`
(~75 ms) by default, caches repeated lines as object URLs, and falls back to the browser
voice if the request fails so a turn is never silent. The key is held in `localStorage`
and sent from the page — fine locally, not for a public link.

**ElevenLabs agent** loads `@elevenlabs/client` (IIFE build, on demand) and calls
`Conversation.startSession({ agentId, connectionType: 'webrtc' })`. `onModeChange` drives
the orb, `onMessage` fills the transcript, `getInputVolume()` scales the orb, and
`setMicMuted()` backs the mute button. Only a **public** agent ID is needed, so no
credential is ever in the page. If the SDK cannot load, the call falls back to the
scripted voice with a visible banner.

## Files

```
index.html              Veeva shell, tabs, welcome / chat / call views, settings sheet
assets/styles.css       light orange theme and components
assets/voice.js         voice engines: browser, ElevenLabs TTS, ElevenLabs agent
assets/app.js           call state machine, script matching, rendering
assets/script-data.js   the scripted conversation — edit this to change the demo
AGENT-PROMPT.md         ElevenLabs agent setup + the FELIX system prompt
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
