# FELIX — Ask FELIX

A working voice chatbot modelled on the **Ask FELIX** tab of `zsfelix.com/chat`: a
field assistant for pharma reps that you talk to between calls.

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

Use Chrome, Edge, or Safari — Firefox has no `SpeechRecognition` and will fall back
to text input, which runs the same conversation.

## Talking to it

- **Tap the mic** and speak, or **hold the space bar** as push-to-talk.
- **Type** into the box instead — the script matches spoken and typed input the same way.
- **Tap a suggestion chip** to send that exact line.
- Tapping the mic while FELIX is talking **interrupts him** (barge-in).
- **Voice on/off** mutes the spoken replies; **Restart** clears the thread.

If the mic is blocked or unavailable, a banner says so and everything still works by typing.

## The script

The demo opens on the line from the brief:

> *"Hey FELIX, I wrapped up early with Dr. Yuki — who else is in the same building with an active suggestion?"*

From there it supports a real back-and-forth:

| Ask | FELIX does |
| --- | --- |
| Who else is nearby with a suggestion? | Two HCP cards with priority, suite, walk time, the active suggestion and why it fired |
| Tell me more about Dr. Chen | Full profile, ordered talking points, approved materials, a compliance warning |
| Is she free right now? | Today's rep-access window with three slots and the impact on the next appointment |
| Book the 2:40 | Confirms the request, updates the route, queues content, sets a reminder |
| Why is Dr. Patel only medium? | Explains the scoring, and can draft the email to him |
| Log my call with Dr. Yuki | Pre-fills from the calendar, drafts a call note from what you say, files it on request |
| What should I open with? | A suggested opener and why it works |
| What's after this? | The rest of the day, plus a brief on the next HCP |

Anything unrecognised gets a rotating fallback that steers you back to what FELIX handles.

## Editing the conversation

`assets/script-data.js` is the whole brain — `app.js` never needs to know the script.
Each node declares weighted keyword groups, the text shown, the text spoken (separate,
so the voice can read numbers and abbreviations naturally), rich cards, and follow-up chips:

```js
{
  id: 'chen_availability',
  keywords: [{ w: 3, any: ['is she free', 'available now', 'can i see her'] }],
  after: ['nearby', 'chen_detail'],   // scores higher right after these turns
  only: ['chen_availability'],        // (on other nodes) can ONLY follow these turns
  text:   "Her office keeps Tuesday afternoons open for reps…",
  speech: "Her office keeps Tuesday afternoons open for reps…",  // read aloud
  blocks: [ { type: 'slots', … } ],
  chips:  ['Yes, book the 2:40', 'Try a different time']
}
```

Matching normalises the utterance, scores every node by keyword weight, boosts nodes
that fit the conversational context, and takes the best node above a threshold. `only`
is what makes short replies like "yes" or "file it" resolve correctly — they only mean
something after a specific question.

Card types available to `blocks`: `hcp`, `kv`, `panel`, `checklist`, `slots`, `note`,
`callout`. All are documented at the top of `script-data.js`.

## Files

```
index.html              layout, tabs, the four panels
assets/styles.css       theme and components
assets/app.js           speech in/out, script matching, rendering
assets/script-data.js   the conversation — edit this to change the demo
```

## Notes

All data is fictional — HCPs, products, trial names, and formulary details are invented
for the demo. The other three tabs (My Day, Suggestions, Customers) are static context
for the scenario; Ask FELIX is the interactive one.
