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

  const DEFAULTS = {
    engine: 'browser',
    apiKey: '',
    voiceId: VOICES[0].id,
    modelId: 'eleven_flash_v2_5',   // ~75 ms; turbo_v2_5 trades latency for polish
    agentId: ''
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
    return 'browser';
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

  /* ── Public speak / cancel ──────────────────────────────────────── */

  function speak(text, opts) {
    opts = opts || {};
    cancel();
    if (!text) { if (opts.onDone) opts.onDone(); return; }

    if (engine() === 'elevenlabs') speakEleven(text, opts.onStart, opts.onDone, opts.onError);
    else speakBrowser(text, opts.onStart, opts.onDone);
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

  /* ── Export ─────────────────────────────────────────────────────── */

  window.FelixVoice = {
    VOICES,
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
