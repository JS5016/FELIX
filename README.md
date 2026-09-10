# FELIX — Ask FELIX

A working voice chatbot modelled on the **Ask FELIX** tab of `zsfelix.com/chat`: a
field assistant for pharma reps that you talk to between calls, rebuilt from
screenshots of the real product (Veeva CRM shell, orange theme, live voice call).

It runs entirely in the browser. No build step, no server, and no API key required.

Four engines, switchable at runtime from the **gear** button:

| Engine | Who answers | Voice | Live call | Setup |
| --- | --- | --- | --- | --- |
| **Browser** (default) | script | `speechSynthesis` | Web Speech | none |
| **ElevenLabs voice** | script | ElevenLabs TTS | Web Speech | ElevenLabs key |
| **ElevenLabs agent** | its own LLM | ElevenLabs | native, barge-in | public agent ID |
| **OpenAI** | GPT, free-form | OpenAI TTS | Realtime API, speech-to-speech | OpenAI key or proxy |

The default keeps a plain deployment working with zero configuration. Every engine
degrades to the one above it rather than failing silently.

## Using OpenAI

The **OpenAI** engine replaces the keyword matcher with a real model, so FELIX answers
anything rather than only the scripted branches — and a voice call becomes a true
speech-to-speech session with natural interruption.

Two ways to supply the key.

**With the proxy — recommended, key never enters the browser:**

```bash
export OPENAI_API_KEY=sk-...
node server.js          # serves the app and proxies OpenAI on /api
```

Open <http://localhost:8000>, then **gear → OpenAI → Proxy URL: `/api`**. The browser
only ever talks to your own server, which mints short-lived realtime tokens and
forwards chat and speech requests.

**Without a proxy:** paste the key into **gear → OpenAI → API key**. It is stored in
that browser's `localStorage` and sent straight to OpenAI from the page. That is fine
on your own machine, but don't do it on a link you share — use the proxy instead. The
settings panel says which of the two is in force.

Nothing is ever committed: keys, proxy URLs, and agent IDs live only in `localStorage`,
and `server.js` reads the key from the environment.

See [AGENT-PROMPT.md](AGENT-PROMPT.md) for the ElevenLabs agent setup. The FELIX
persona in `assets/persona.js` is the single source of truth — it is the system prompt
for OpenAI chat, the `instructions` on a realtime session, and the text you paste into
an ElevenLabs agent.

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
| Remind me — what was my last interaction with her? | The one visit, what was covered, and what she is still owed |
| Her interaction history in more detail | Last four touches, and the thread running through them |
| Let's practice — you play Dr. Yuki | Goes into character as the doctor, then scores the run (below) |
| Tell me about Dr. Raman | Ordered talking points, approved materials, a compliance warning |
| Is she free right now? | Today's rep-access window with three slots and the knock-on to the next call |
| Book it | Confirms the request, updates the route, queues content, sets a reminder |
| Log my call with Dr. Watanabe | Pre-fills from the schedule, drafts a call note from what you say, files it on request |
| What should I open with? | A suggested opener and why it works |
| The three welcome pills | Active suggestions this week · not contacted in 4 weeks · changed behavior |

Anything unrecognised gets a rotating fallback that steers you back to what FELIX handles.

## Practice roleplay

Say *"let's practice — you play Dr. Yuki and I'll play myself"* and FELIX stops being
the assistant and becomes the doctor. It is the same conversation a rep would have in
the corridor thirty seconds before walking in.

In character he is time-pressed and unhelpful in the way a real prescriber is: two or
three sentences a turn, and he only gives ground when the rep earns it. Each persona is
an **objection ladder** built from what the CRM already knows that HCP has raised — for
Dr. Watanabe, the pack was fine but her nurse was not, and behind that are coverage
delays. Answer the objection in front of you and she moves to the next one; talk past
it and she presses you on it again. After two presses the ladder advances anyway, so a
live demo never stalls.

Three personas ship: **Dr. Watanabe** (the open tolerability question), **Dr. Raman**
(three unsupported starts, and a coordinator who is already busy) and **Dr. Okonkwo**
(a Momelyx loyalist who wants a reason). Name one — *"practice with Dr. Okonkwo"* — or
get Dr. Watanabe by default.

Two ways out:

- **"Felix, …"** steps out for one turn. He answers from the script — her history, the
  approved materials — and the run stays live.
- **"gotta go"** ends it. He breaks character and scores the run out of five:
  continuity, discovery, the live objection, the access barrier, and the close. Every
  miss comes back as one concrete fix, and anything off-label, any absolute safety
  claim, unsupported head-to-head or guarantee is flagged separately.

Nothing about a practice run is written to the CRM, and FELIX says so on every debrief.

The ladders, cues and marking scheme are data — `roleplay` at the bottom of
`assets/script-data.js`. On the free-form engines the same behaviour comes from the
`roleplay_partner` tool plus the practice section of the persona, so a real model plays
the doctor instead.

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
`checklist`, `slots`, `note`, `score` (the practice scorecard), `callout`. All are
documented at the top of `script-data.js`.

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

**OpenAI** uses `POST /v1/chat/completions` for typed turns (`assets/brain.js`), `POST
/v1/audio/speech` with `gpt-4o-mini-tts` for the voice, and for a live call mints an
ephemeral token at `POST /v1/realtime/client_secrets` then exchanges SDP at `POST
/v1/realtime/calls` over WebRTC. Endpoints and model names were taken from `openai`
7.10.0 — note the older `/realtime/sessions` beta endpoint no longer connects.

### Realtime session

| Setting | Value |
| --- | --- |
| Model | `gpt-realtime-2.1` (also 2.1-mini, 2, and plain `gpt-realtime`) |
| Voice | Marin or Cedar (all ten available) |
| Turn detection | `semantic_vad`, `eagerness: medium` |
| Interruptions | `interrupt_response: true` — talk over FELIX and he stops |
| Input | rep microphone via `getUserMedia` |
| Live transcript | `gpt-4o-mini-transcribe` on the input, agent transcript from the output |
| Instructions | the FELIX persona in `assets/persona.js` |
| Tools | the six below, `tool_choice: auto` |

## Tools

`assets/tools.js` defines seven function tools and executes them locally against a
structured territory dataset. Both free-form engines share them, so a typed question
and a spoken one have identical capability.

| Tool | What it returns |
| --- | --- |
| `hcp_profile` | Specialty, segment, location, Pacrivex vs competitor volumes, last touch |
| `call_prep` | Why now, ordered talking points, approved materials, compliance note |
| `barrier_lookup` | Known objections, how often raised, whether open, the approved evidence |
| `next_best_action` | One HCP's active suggestion, or the ranked territory list (`nearby_only`) |
| `territory_insights` | 30-day behaviour change and everyone not contacted in 4+ weeks |
| `crm_notes` | Read past notes, draft a new one, or file it after the rep approves |
| `roleplay_partner` | The character sheet for a practice call, or the rubric to score one |

In a call the model emits `response.function_call_arguments.done`; the tool runs and the
result goes back as `conversation.item.create` / `function_call_output` followed by
`response.create`. In chat it is the standard `tool_calls` loop, capped at four rounds.
Tool use is visible either way — badges on the answer, a chip in the live transcript.

Swapping the `TERRITORY` object for real API calls is the only change needed to make
these hit a live CRM.

## Files

```
index.html              Veeva shell, tabs, welcome / chat / call views, settings sheet
assets/styles.css       light orange theme and components
assets/persona.js       who FELIX is — shared by every free-form engine
assets/tools.js         the six tools + local executor over the territory data
assets/script-data.js   the scripted conversation + practice personas — edit this to change the demo
assets/brain.js         OpenAI chat completions
assets/voice.js         engines: browser, ElevenLabs TTS/agent, OpenAI TTS/realtime
assets/app.js           call state machine, script matching, rendering
server.js               optional: serves the app and proxies OpenAI, key server-side
AGENT-PROMPT.md         ElevenLabs agent setup + the FELIX system prompt
build-standalone.js     inlines everything into felix-standalone.html
felix-standalone.html   single-file build, opens with no server
```

Note the standalone build cannot use the proxy (there is no server), so it is browser,
ElevenLabs, or a browser-held OpenAI key.

## Notes

All data is fictional — HCPs, products (Pacrivex, Momelyx, Ruxoril), prescription
counts, and affiliations are invented for the demo. The other five tabs (Overview,
GeoPlan, Call Prep, Route Planner, HCP Avatar) are placeholders; Ask FELIX is the
interactive one.

The UI was rebuilt from screenshots of the real product rather than from the live
site, which was unreachable from the build environment.
