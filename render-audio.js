#!/usr/bin/env node
/* ============================================================================
 * FELIX — render the practice call to audio files
 * ----------------------------------------------------------------------------
 * Speaks every line of the demo script with a real voice and writes the clips
 * to audio/, so practice-call-audio.html can play the call with no API key,
 * no network and no latency — the version to use on stage.
 *
 *   ELEVENLABS_API_KEY=... node render-audio.js
 *   OPENAI_API_KEY=...     node render-audio.js --openai
 *
 * Options:
 *   --openai            use OpenAI speech instead of ElevenLabs
 *   --rep=VOICE         override a speaker's voice (also --felix=, --yuki=)
 *   --out=DIR           output directory (default: audio)
 *   --list              print the script and exit, without calling anything
 *
 * Commit the audio/ directory and the page plays it for everyone who opens it.
 * Node 18+ (needs global fetch). No dependencies.
 * ==========================================================================*/

const fs = require('fs');
const path = require('path');

/* ── The script, read from the same source the app speaks from ─────── */

global.window = {};
eval(fs.readFileSync(path.join(__dirname, 'assets/script-data.js'), 'utf8') + '\nwindow.FELIX_SCRIPT = FELIX_SCRIPT;');
const S = window.FELIX_SCRIPT;

const node = id => S.nodes.find(n => n.id === id);
const yuki = S.roleplay.personas.watanabe;
const beat = id => yuki.beats.find(b => b.id === id);

const LINES = [
  ['rep',   'Hey FELIX — I’m here at Fierce Pharma with a large pharma audience, and everyone wants to see what you can do.'],
  ['felix', S.callGreeting.speech],
  ['rep',   'Thank you, FELIX. I am actually a bit rushed, I’m about to meet Dr. Yuki Watanabe. Remind me — what was my last interaction with her?'],
  ['felix', node('last_interaction').speech],
  ['rep',   'Before I meet Dr. Yuki, let’s practice. You play Dr. Yuki, and I’ll play myself. Let’s go.'],
  ['felix', yuki.setup.speech],
  ['yuki',  yuki.opening.speech],
  ['rep',   'Dr. Yuki, thanks for the time. Last time we discussed the titration challenges and reviewed the starter pack. Have you had a chance to use it with a new patient?'],
  ['yuki',  beat('experience').line.speech],
  ['rep',   'That’s helpful. It sounds like the bigger issue now is workflow rather than titration itself. We have a simple one-page patient guide your nurse can hand directly to the patient. Would that help?'],
  ['yuki',  beat('workflow').line.speech],
  ['rep',   'Understood. I’ll leave the one-page guide today and connect your team with the available access support. I’ll follow up after your next appropriate patient start to see if those two things made the process easier.'],
  ['yuki',  beat('access').line.speech],
  ['rep',   'Alright Felix, gotta go!'],
  ['felix', 'Out of character. You landed five of five. ' + S.roleplay.verdicts.find(v => v.min === 5).text
            + ' ' + yuki.debrief.strong[0] + ' ' + yuki.debrief.real]
];

/* ── Voices ─────────────────────────────────────────────────────────
 * ElevenLabs uses eleven_multilingual_v2 rather than the flash model the
 * live page uses: this runs once, so quality beats latency.
 * ----------------------------------------------------------------- */

const EL = {
  rep:   'onwK4e9ZLuTAKqWW03F9',   // Daniel
  felix: 'EXAVITQu4vr4xnSDxMaL',   // Sarah
  yuki:  'XB0fDUnXU5powFXDhCwa'    // Charlotte
};

const OA = { rep: 'ash', felix: 'sage', yuki: 'coral' };

const STYLE = {
  rep:   'A pharmaceutical sales rep in his mid-thirties, standing in a clinic corridor. Warm, quick and professional, slightly rushed but never breathless. Natural conversational rhythm, not an announcer.',
  felix: 'A calm, efficient voice assistant briefing a colleague on a phone call. Brisk and precise, never chirpy. Read numbers and dates plainly.',
  yuki:  'A hematologist between patients. Clipped, mildly skeptical, courteous but unsentimental. Short sentences, a little impatient.'
};

const WHO = { rep: 'John · rep', felix: 'FELIX', yuki: 'Dr. Yuki Watanabe' };

/* ── Arguments ──────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const flag = name => args.some(a => a === '--' + name);
const value = name => {
  const hit = args.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : null;
};

const useOpenAI = flag('openai');
const outDir = path.resolve(__dirname, value('out') || 'audio');
const voices = Object.assign({}, useOpenAI ? OA : EL);
['rep', 'felix', 'yuki'].forEach(r => { const v = value(r); if (v) voices[r] = v; });

if (flag('list')) {
  LINES.forEach(([role, text], i) => console.log(String(i + 1).padStart(2, '0') + '  ' + WHO[role].padEnd(18) + text));
  process.exit(0);
}

const KEY = useOpenAI ? process.env.OPENAI_API_KEY : process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('\x1b[31m' + (useOpenAI ? 'OPENAI_API_KEY' : 'ELEVENLABS_API_KEY') + ' is not set.\x1b[0m');
  console.error(useOpenAI
    ? '  OPENAI_API_KEY=sk-... node render-audio.js --openai'
    : '  ELEVENLABS_API_KEY=... node render-audio.js        (or --openai for OpenAI voices)');
  process.exit(1);
}

/* ── Synthesis ──────────────────────────────────────────────────────── */

async function speak(role, text) {
  const url = useOpenAI
    ? 'https://api.openai.com/v1/audio/speech'
    : 'https://api.elevenlabs.io/v1/text-to-speech/' + voices[role] + '?output_format=mp3_44100_128';

  const headers = useOpenAI
    ? { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
    : { 'xi-api-key': KEY, 'Content-Type': 'application/json' };

  const body = useOpenAI
    ? { model: 'gpt-4o-mini-tts', voice: voices[role], input: text, instructions: STYLE[role], response_format: 'mp3' }
    : {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true }
      };

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

  if (!res.ok) {
    let detail = res.status + ' ' + res.statusText;
    try {
      const j = await res.json();
      const d = j && (j.detail || j.error);
      if (d) detail = d.message || d.status || JSON.stringify(d);
    } catch (_) {}
    throw new Error(detail);
  }
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const files = [];
  const parts = [];

  for (let i = 0; i < LINES.length; i++) {
    const [role, text] = LINES[i];
    const name = 'line-' + String(i + 1).padStart(2, '0') + '-' + role + '.mp3';
    process.stdout.write('  ' + String(i + 1).padStart(2, '0') + '/' + LINES.length + '  ' + WHO[role].padEnd(18));

    try {
      const buf = await speak(role, text);
      fs.writeFileSync(path.join(outDir, name), buf);
      files.push({ role, file: name, text });
      parts.push(buf);
      console.log('\x1b[32m' + (buf.length / 1024).toFixed(0) + ' KB\x1b[0m');
    } catch (err) {
      console.log('\x1b[31mfailed — ' + err.message + '\x1b[0m');
      process.exit(1);
    }
  }

  /* One file for the whole call, for anywhere that wants a single asset.
     Plain MP3 frame concatenation: every clip came from the same encoder. */
  fs.writeFileSync(path.join(outDir, 'practice-call.mp3'), Buffer.concat(parts));

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({
    engine: useOpenAI ? 'openai' : 'elevenlabs',
    voices,
    rendered: new Date().toISOString(),
    whole: 'practice-call.mp3',
    files
  }, null, 2) + '\n');

  const kb = Math.round(Buffer.concat(parts).length / 1024);
  console.log('\nWrote ' + files.length + ' clips + practice-call.mp3 (' + kb + ' KB) to ' + path.relative(__dirname, outDir) + '/');
  console.log('Open practice-call-audio.html — it plays these now, with no key.');
})();
