/* ============================================================================
 * FELIX — voice layer
 * ----------------------------------------------------------------------------
 * Three engines, chosen at runtime from the settings panel and remembered in
 * localStorage. Nothing here is committed with credentials.
 *
 *   'browser'     speechSynthesis + SpeechRecognition. Zero setup, robotic.
 *                 The default, so a plain deployment still works.
 *
 *   'elevenlabs'  FELIX still follows the scripted answers, but the voice is
 *                 ElevenLabs TTS. Needs an API key, which stays in the browser
 *                 — local/demo use only.
 *
 *   'agent'       A real ElevenLabs agent (LLM + STT + TTS + turn taking).
 *                 The script is not used at all; the agent answers freely and
 *                 handles interruption natively. Needs a PUBLIC agent id —
 *                 no key in the page.
 *
 * SDK: @elevenlabs/client 1.25.0, IIFE build, loaded on demand.
 *   ElevenLabsClient.Conversation.startSession({ agentId, connectionType, ...callbacks })
 *   → { endSession, setMicMuted, setVolume, getInputVolume, getOutputVolume }
 * ==========================================================================*/
(function () {
  'use strict';

  const SDK_URL = 'https://unpkg.com/@elevenlabs/client@1.25.0/dist/lib.iife.js';
  const TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech/';
  const STORE   = 'felix.voice.config';

  const VOICES = [
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte — conversational' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah — soft' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George — narrative' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel — authoritative' }
  ];

  /* Verified against openai-node 7.10.0. */
  const OA_VOICES = [
    { id: 'marin', name: 'Marin — recommended' },
    { id: 'cedar', name: 'Cedar — recommended' },
    { id: 'alloy', name: 'Alloy' }, { id: 'ash', name: 'Ash' }, { id: 'ballad', name: 'Ballad' },
    { id: 'coral', name: 'Coral' }, { id: 'echo', name: 'Echo' }, { id: 'sage', name: 'Sage' },
    { id: 'shimmer', name: 'Shimmer' }, { id: 'verse', name: 'Verse' }
  ];

  const DEFAULTS = {
    engine: 'browser',
    apiKey: '',
    voiceId: VOICES[0].id,
    modelId: 'eleven_flash_v2_5',   // ~75 ms; turbo_v2_5 trades latency for polish
    agentId: '',

    /* OpenAI */
    openaiKey: '',
    proxyUrl: '',                       // set this and the key never enters the browser
    chatModel: 'gpt-5.2',
    ttsModel: 'gpt-4o-mini-tts',
    oaVoice: 'marin',
    realtimeModel: 'gpt-realtime-2.1'
  };

  /* ── Config ─────────────────────────────────────────────────────── */

  let cfg = Object.assign({}, DEFAULTS);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
    cfg = Object.assign(cfg, saved);
  } catch (_) {}

  function setConfig(patch) {
    cfg = Object.assign(cfg, patch);
    try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (_) {}
    return cfg;
  }

  /* An engine only counts as selected if it has what it needs. */
  function engine() {
    if (cfg.engine === 'agent' && cfg.agentId) return 'agent';
    if (cfg.engine === 'elevenlabs' && cfg.apiKey) return 'elevenlabs';
    if (cfg.engine === 'openai' && (cfg.openaiKey || cfg.proxyUrl)) return 'openai';
    return 'browser';
  }

  /* True when a real model, not the keyword matcher, should answer. */
  const freeForm = () => engine() === 'openai';

  const oaBase = () => cfg.proxyUrl ? cfg.proxyUrl.replace(/\/$/, '') : 'https://api.openai.com/v1';

  function oaHeaders(extra) {
    const h = Object.assign({}, extra || {});
    if (!cfg.proxyUrl) h['Authorization'] = 'Bearer ' + cfg.openaiKey;
    return h;
  }

  async function oaError(res) {
    let msg = res.status + ' ' + res.statusText;
    try {
      const j = await res.json();
      if (j && j.error && j.error.message) msg = j.error.message;
    } catch (_) {}
    return new Error(msg);
  }

  /* ── Browser speech synthesis ───────────────────────────────────── */

  const tts = window.speechSynthesis;
  let browserVoice = null;

  function pickBrowserVoice() {
    if (!tts) return;
    const vs = tts.getVoices();
    if (!vs.length) return;
    const prefer = ['Samantha', 'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)', 'Karen'];
    browserVoice = prefer.map(n => vs.find(v => v.name === n)).find(Boolean)
      || vs.find(v => /^en[-_]US/i.test(v.lang))
      || vs.find(v => /^en/i.test(v.lang)) || vs[0];
  }
  if (tts) { pickBrowserVoice(); tts.addEventListener('voiceschanged', pickBrowserVoice); }

  function speakBrowser(text, onStart, onDone) {
    if (!tts) { if (onStart) onStart(); if (onDone) onDone(); return; }
    const u = new SpeechSynthesisUtterance(text);
    if (browserVoice) u.voice = browserVoice;
    u.rate = 1.02; u.pitch = 1;
    u.lang = (browserVoice && browserVoice.lang) || 'en-US';

    let done = false;
    const finish = () => { if (!done) { done = true; if (onDone) onDone(); } };
    u.onstart = () => { if (onStart) onStart(); };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(() => tts.speak(u), 60);
  }

  /* ── ElevenLabs text to speech ──────────────────────────────────── */

  let audioEl = null;
  const ttsCache = new Map();   // repeated lines cost nothing the second time

  async function fetchSpeech(text) {
    if (ttsCache.has(text)) return ttsCache.get(text);

    const res = await fetch(TTS_URL + encodeURIComponent(cfg.voiceId) + '?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': cfg.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        model_id: cfg.modelId,
        voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true, speed: 1.03 }
      })
    });

    if (!res.ok) {
      let detail = res.status + ' ' + res.statusText;
      try {
        const j = await res.json();
        if (j && j.detail) detail = j.detail.message || j.detail.status || JSON.stringify(j.detail);
      } catch (_) {}
      throw new Error(detail);
    }

    const url = URL.createObjectURL(await res.blob());
    if (ttsCache.size < 40) ttsCache.set(text, url);
    return url;
  }

  function speakEleven(text, onStart, onDone, onFail) {
    fetchSpeech(text).then(url => {
      audioEl = new Audio(url);
      audioEl.onplay = () => { if (onStart) onStart(); };
      audioEl.onended = () => { if (onDone) onDone(); };
      audioEl.onerror = () => { if (onDone) onDone(); };
      return audioEl.play();
    }).catch(err => {
      // Fall back rather than leaving the turn silent.
      if (onFail) onFail(err);
      speakBrowser(text, onStart, onDone);
    });
  }

  /* ── OpenAI text to speech ──────────────────────────────────────── */

  const oaCache = new Map();

  async function fetchOaSpeech(text) {
    if (oaCache.has(text)) return oaCache.get(text);

    const url = cfg.proxyUrl ? oaBase() + '/speech' : oaBase() + '/audio/speech';
    const res = await fetch(url, {
      method: 'POST',
      headers: oaHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        model: cfg.ttsModel,
        voice: cfg.oaVoice,
        input: text,
        response_format: 'mp3',
        instructions: 'Speak like a calm, efficient colleague on a phone call. Brisk but never clipped.'
      })
    });
    if (!res.ok) throw await oaError(res);

    const objUrl = URL.createObjectURL(await res.blob());
    if (oaCache.size < 40) oaCache.set(text, objUrl);
    return objUrl;
  }

  function speakOa(text, onStart, onDone, onFail) {
    fetchOaSpeech(text).then(url => {
      audioEl = new Audio(url);
      audioEl.onplay = () => { if (onStart) onStart(); };
      audioEl.onended = () => { if (onDone) onDone(); };
      audioEl.onerror = () => { if (onDone) onDone(); };
      return audioEl.play();
    }).catch(err => {
      if (onFail) onFail(err);
      speakBrowser(text, onStart, onDone);
    });
  }

  /* ── Public speak / cancel ──────────────────────────────────────── */

  function speak(text, opts) {
    opts = opts || {};
    cancel();
    if (!text) { if (opts.onDone) opts.onDone(); return; }

    const e = engine();
    if (e === 'elevenlabs')  speakEleven(text, opts.onStart, opts.onDone, opts.onError);
    else if (e === 'openai') speakOa(text, opts.onStart, opts.onDone, opts.onError);
    else                     speakBrowser(text, opts.onStart, opts.onDone);
  }

  function cancel() {
    if (tts && (tts.speaking || tts.pending)) tts.cancel();
    if (audioEl) {
      audioEl.onended = null; audioEl.onerror = null;
      try { audioEl.pause(); } catch (_) {}
      audioEl = null;
    }
  }

  /* ── ElevenLabs agent ───────────────────────────────────────────── */

  let sdkPromise = null;

  function loadSDK() {
    if (window.ElevenLabsClient) return Promise.resolve(window.ElevenLabsClient);
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = () => window.ElevenLabsClient
        ? resolve(window.ElevenLabsClient)
        : reject(new Error('ElevenLabs SDK loaded but exposed no global'));
      s.onerror = () => reject(new Error('Could not load the ElevenLabs SDK — check the network'));
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  let session = null;
  let levelFrame = null;

  /* handlers: onStatus, onMode, onMessage(role,text), onError, onLevel */
  async function agentStart(handlers) {
    const h = handlers || {};
    const SDK = await loadSDK();

    session = await SDK.Conversation.startSession({
      agentId: cfg.agentId,
      connectionType: 'webrtc',
      onConnect: () => { if (h.onStatus) h.onStatus('connected'); },
      onDisconnect: () => { stopLevel(); session = null; if (h.onStatus) h.onStatus('disconnected'); },
      onStatusChange: p => { if (h.onStatus) h.onStatus(p.status); },
      onModeChange: p => { if (h.onMode) h.onMode(p.mode); },          // 'speaking' | 'listening'
      onMessage: p => { if (h.onMessage) h.onMessage(p.role || (p.source === 'ai' ? 'agent' : 'user'), p.message); },
      onError: (msg, ctx) => { if (h.onError) h.onError(msg, ctx); }
    });

    if (h.onLevel) {
      (function loop() {
        if (!session) return;
        let v = 0;
        try { v = session.getInputVolume(); } catch (_) {}
        h.onLevel(v);
        levelFrame = requestAnimationFrame(loop);
      })();
    }
    return session;
  }

  function stopLevel() {
    if (levelFrame) cancelAnimationFrame(levelFrame);
    levelFrame = null;
  }

  async function agentStop() {
    stopLevel();
    if (!session) return;
    const s = session;
    session = null;
    try { await s.endSession(); } catch (_) {}
  }

  function agentMute(muted) {
    if (session && session.setMicMuted) { try { session.setMicMuted(muted); } catch (_) {} }
  }

  const agentActive = () => !!session;

  /* ── OpenAI Realtime, speech to speech over WebRTC ──────────────────
   * Verified against openai-node 7.10.0:
   *   POST /v1/realtime/client_secrets  -> { value: "ek_..." }   (ephemeral)
   *   POST /v1/realtime/calls           -> SDP answer            (multipart)
   * The older /realtime/sessions beta endpoint no longer connects.
   *
   * Session: semantic VAD with interrupt_response, input transcription on for
   * the live transcript, and the six FELIX tools from assets/tools.js.
   * ------------------------------------------------------------------ */

  let pc = null, dc = null, rtAudio = null, rtStream = null, rtLevel = null;

  async function mintToken() {
    const session = {
      type: 'realtime',
      model: cfg.realtimeModel,
      instructions: window.FELIX_PERSONA.systemPrompt,
      audio: {
        input: {
          transcription: { model: 'gpt-4o-mini-transcribe' },   // drives the live transcript
          turn_detection: {
            type: 'semantic_vad',       // waits for a finished thought, not just silence
            eagerness: 'medium',
            create_response: true,
            interrupt_response: true    // talking over FELIX cuts him off
          }
        },
        output: { voice: cfg.oaVoice }
      },
      tools: window.FelixTools.realtimeTools(),
      tool_choice: 'auto'
    };

    // With a proxy the key stays server-side; the proxy mints and returns the token.
    const url = cfg.proxyUrl ? oaBase() + '/realtime-token' : oaBase() + '/realtime/client_secrets';
    const res = await fetch(url, {
      method: 'POST',
      headers: oaHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ session: session })
    });
    if (!res.ok) throw await oaError(res);

    const j = await res.json();
    if (!j.value) throw new Error('No ephemeral token in the response');
    return j.value;
  }

  /* handlers: onStatus, onMode, onMessage(role,text), onError, onLevel */
  async function realtimeStart(handlers) {
    const h = handlers || {};
    if (h.onStatus) h.onStatus('connecting');

    const token = await mintToken();

    pc = new RTCPeerConnection();

    // Remote audio: the agent's voice.
    rtAudio = new Audio();
    rtAudio.autoplay = true;
    pc.ontrack = e => { rtAudio.srcObject = e.streams[0]; };

    rtStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    rtStream.getTracks().forEach(tr => pc.addTrack(tr, rtStream));

    dc = pc.createDataChannel('oai-events');
    dc.addEventListener('message', ev => {
      let m;
      try { m = JSON.parse(ev.data); } catch (_) { return; }
      handleRealtimeEvent(m, h);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // The SDK posts this as multipart with `sdp` and `session` parts.
    const form = new FormData();
    form.append('sdp', offer.sdp);
    form.append('session', JSON.stringify({ type: 'realtime', model: cfg.realtimeModel }));

    const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: form
    });
    if (!sdpRes.ok) throw await oaError(sdpRes);

    await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });
    if (h.onStatus) h.onStatus('connected');

    if (h.onLevel && rtStream) startRtLevel(h.onLevel);
    return true;
  }

  /* Map the realtime event stream onto the UI's speaking/listening/transcript. */
  function handleRealtimeEvent(m, h) {
    const type = m.type || '';

    if (type === 'response.output_audio.done' || type === 'response.done') {
      if (h.onMode) h.onMode('listening');
    } else if (type === 'response.created' || type === 'response.output_audio.delta') {
      if (h.onMode) h.onMode('speaking');
    } else if (type === 'input_audio_buffer.speech_started') {
      if (h.onMode) h.onMode('listening');
    }

    // What the agent said.
    if (type === 'response.output_audio_transcript.done' && m.transcript) {
      if (h.onMessage) h.onMessage('agent', m.transcript);
    }
    // What the rep said.
    if (type === 'conversation.item.input_audio_transcription.completed' && m.transcript) {
      if (h.onMessage) h.onMessage('user', m.transcript);
    }
    // The model asked for a tool. Run it locally and hand the result back.
    if (type === 'response.function_call_arguments.done') {
      const args = window.FelixTools.parseArgs(m.arguments);
      const result = window.FelixTools.run(m.name, args);
      if (h.onTool) h.onTool(m.name, args, result);
      sendToolResult(m.call_id, result);
    }

    if (type === 'error') {
      const msg = (m.error && m.error.message) || 'Realtime error';
      if (h.onError) h.onError(msg);
    }
  }

  /* conversation.item.create(function_call_output) then response.create,
   * so the model speaks its answer using the tool output. */
  function sendToolResult(callId, result) {
    if (!dc || dc.readyState !== 'open') return;
    dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(result) }
    }));
    dc.send(JSON.stringify({ type: 'response.create' }));
  }

  function startRtLevel(onLevel) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      ctx.createMediaStreamSource(rtStream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      (function loop() {
        if (!pc) { ctx.close().catch(() => {}); return; }
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        onLevel(Math.min(1, Math.sqrt(sum / data.length) * 6));
        rtLevel = requestAnimationFrame(loop);
      })();
    } catch (_) {}
  }

  function realtimeStop() {
    if (rtLevel) { cancelAnimationFrame(rtLevel); rtLevel = null; }
    if (dc) { try { dc.close(); } catch (_) {} dc = null; }
    if (rtStream) { rtStream.getTracks().forEach(tr => tr.stop()); rtStream = null; }
    if (rtAudio) { try { rtAudio.pause(); } catch (_) {} rtAudio.srcObject = null; rtAudio = null; }
    if (pc) { try { pc.close(); } catch (_) {} pc = null; }
  }

  function realtimeMute(muted) {
    if (rtStream) rtStream.getAudioTracks().forEach(tr => { tr.enabled = !muted; });
  }

  const realtimeActive = () => !!pc;

  /* ── Export ─────────────────────────────────────────────────────── */

  window.FelixVoice = {
    VOICES,
    OA_VOICES,
    freeForm,
    realtime: { start: realtimeStart, stop: realtimeStop, mute: realtimeMute, active: realtimeActive },
    config: () => Object.assign({}, cfg),
    setConfig,
    engine,
    speak,
    cancel,
    agent: { start: agentStart, stop: agentStop, mute: agentMute, active: agentActive },
    /* Used by the settings panel's Test button. */
    test(text) {
      return new Promise((resolve, reject) => {
        speak(text, { onDone: resolve, onError: reject });
      });
    }
  };
})();
