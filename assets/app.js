/* ============================================================================
 * FELIX — Ask FELIX voice agent
 * ----------------------------------------------------------------------------
 * No backend, no API keys. Listening is the Web Speech API's SpeechRecognition,
 * the voice is speechSynthesis, and the conversation itself comes from
 * assets/script-data.js.
 * ==========================================================================*/
(function () {
  'use strict';

  const SCRIPT = window.FELIX_SCRIPT;

  const el = {
    thread:   document.getElementById('thread'),
    chips:    document.getElementById('chips'),
    form:     document.getElementById('form'),
    input:    document.getElementById('input'),
    mic:      document.getElementById('mic'),
    status:   document.getElementById('status'),
    banner:   document.getElementById('banner'),
    btnVoice: document.getElementById('btn-voice'),
    btnReset: document.getElementById('btn-restart')
  };

  const state = {
    lastNodeId: null,
    voiceOn: true,
    listening: false,
    speaking: false,
    fallbackIndex: 0,
    busy: false
  };

  /* ── Tabs ───────────────────────────────────────────────────────────── */

  function showTab(name) {
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('is-active', t.dataset.tab === name));
    document.querySelectorAll('.rail-btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.tab === name));
    document.querySelectorAll('.panel').forEach(p =>
      p.classList.toggle('is-active', p.id === 'panel-' + name));
  }

  document.querySelectorAll('[data-tab]').forEach(btn =>
    btn.addEventListener('click', () => showTab(btn.dataset.tab)));

  /* ── Rendering ──────────────────────────────────────────────────────── */

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* **bold** only — everything else is escaped first. */
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  function blockHTML(b) {
    switch (b.type) {

      case 'hcp':
        return `
          <article class="card hcp lvl-${esc(b.priority)}">
            <header class="hcp-head">
              <div class="hcp-av">${esc(b.initials || '')}</div>
              <div class="hcp-id">
                <h4>${esc(b.name)}</h4>
                <p>${esc(b.specialty)}${b.tier ? ' · ' + esc(b.tier) : ''}</p>
              </div>
              <span class="pri pri-${esc(b.priority)}">${esc(b.priority)}</span>
            </header>
            <div class="hcp-where">
              <svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
              <span>${esc(b.location)}</span>
              ${b.walk ? `<span class="dot">•</span><span>${esc(b.walk)}</span>` : ''}
            </div>
            <div class="hcp-sugg">
              <span class="hcp-sugg-label">Active suggestion</span>
              <p class="hcp-sugg-title">${esc(b.suggestion)}</p>
              <p class="hcp-sugg-why">${esc(b.reason)}</p>
            </div>
            ${(b.meta || []).length ? `<dl class="hcp-meta">${b.meta.map(m =>
              `<div><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`).join('')}</dl>` : ''}
            ${(b.tags || []).length ? `<div class="tags">${b.tags.map(t =>
              `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
          </article>`;

      case 'kv':
        return `
          <article class="card">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <dl class="kv">${b.rows.map(([k, v]) =>
              `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </article>`;

      case 'panel':
        return `
          <article class="card">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <ul class="bullets">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
          </article>`;

      case 'checklist':
        return `
          <article class="card">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <ul class="checks">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
          </article>`;

      case 'slots':
        return `
          <article class="card">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <ul class="slots">${b.options.map(o => `
              <li class="slot slot-${esc(o.status)}">
                <span class="slot-time">${esc(o.time)}</span>
                <span class="slot-label">${esc(o.label)}</span>
                <span class="slot-status">${esc(o.status)}</span>
              </li>`).join('')}</ul>
          </article>`;

      case 'note':
        return `
          <article class="card note">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <pre class="note-body">${esc(b.body)}</pre>
          </article>`;

      case 'callout':
        return `<div class="callout callout-${esc(b.tone || 'info')}">${esc(b.text)}</div>`;

      default:
        return '';
    }
  }

  function addMessage(role, text, blocks) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-' + role;
    wrap.innerHTML = `
      <div class="msg-av">${role === 'felix' ? 'F' : 'JE'}</div>
      <div class="msg-body">
        <div class="msg-who">${role === 'felix' ? 'FELIX' : 'You'}</div>
        <div class="bubble"></div>
        <div class="blocks"></div>
      </div>`;
    el.thread.appendChild(wrap);

    const bubble = wrap.querySelector('.bubble');
    const host   = wrap.querySelector('.blocks');

    if (role === 'felix') {
      typeInto(bubble, text, () => {
        host.innerHTML = (blocks || []).map(blockHTML).join('');
        requestAnimationFrame(() => {
          host.querySelectorAll('.card, .callout')
              .forEach((c, i) => setTimeout(() => c.classList.add('in'), i * 70));
          scrollDown();
        });
      });
    } else {
      bubble.textContent = text;
    }

    scrollDown();
    return wrap;
  }

  /* Character reveal, so FELIX's text lands roughly with the voice. */
  function typeInto(node, text, done) {
    const html = rich(text);
    const plain = text.replace(/\*\*/g, '');
    let i = 0;
    const step = Math.max(1, Math.round(plain.length / 90));

    const tick = setInterval(() => {
      i += step;
      if (i >= plain.length) {
        clearInterval(tick);
        node.innerHTML = html;
        if (done) done();
        scrollDown();
        return;
      }
      node.textContent = plain.slice(0, i);
      scrollDown();
    }, 16);
  }

  function scrollDown() {
    el.thread.scrollTop = el.thread.scrollHeight;
  }

  function thinking() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-felix';
    wrap.innerHTML = `
      <div class="msg-av">F</div>
      <div class="msg-body">
        <div class="msg-who">FELIX</div>
        <div class="bubble typing"><i></i><i></i><i></i></div>
      </div>`;
    el.thread.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function renderChips(list) {
    el.chips.innerHTML = '';
    (list || []).forEach(text => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => send(text));
      el.chips.appendChild(b);
    });
  }

  /* ── Script matching ────────────────────────────────────────────────── */

  const normalize = s => ' ' + String(s).toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9':\s]/g, ' ')
    .replace(/\bdoctor\b/g, 'dr')
    .replace(/\s+/g, ' ')
    .trim() + ' ';

  function scoreNode(node, text) {
    if (node.only && !node.only.includes(state.lastNodeId)) return 0;

    let score = 0;
    (node.keywords || []).forEach(group => {
      const hit = group.any.some(phrase => text.includes(' ' + normalize(phrase).trim() + ' ')
        || text.includes(normalize(phrase).trim()));
      if (hit) score += group.w;
    });

    if (!score) return 0;
    if (node.after && node.after.includes(state.lastNodeId)) score += 1.5;
    if (node.only) score += 2;               // context-gated nodes are strong signals
    if (node.id === state.lastNodeId) score -= 1.5; // discourage repeating a turn
    return score;
  }

  function match(raw) {
    const text = normalize(raw);
    let best = null, bestScore = 0;

    SCRIPT.nodes.forEach(node => {
      const s = scoreNode(node, text);
      if (s > bestScore) { best = node; bestScore = s; }
    });

    return bestScore >= 3 ? best : null;
  }

  /* ── Turn handling ──────────────────────────────────────────────────── */

  function send(text) {
    const clean = String(text || '').trim();
    if (!clean || state.busy) return;

    state.busy = true;
    stopListening();
    cancelSpeech();

    addMessage('user', clean);
    el.input.value = '';
    renderChips([]);
    setStatus('thinking', 'FELIX is thinking…');

    const ghost = thinking();

    setTimeout(() => {
      ghost.remove();

      const node = match(clean);
      let reply;

      if (node) {
        state.lastNodeId = node.id;
        state.fallbackIndex = 0;
        reply = node;
      } else {
        reply = SCRIPT.fallbacks[state.fallbackIndex % SCRIPT.fallbacks.length];
        state.fallbackIndex++;
      }

      addMessage('felix', reply.text, reply.blocks);
      renderChips(reply.chips);
      speak(reply.speech || reply.text.replace(/\*\*/g, ''));
      state.busy = false;
    }, 520 + Math.random() * 320);
  }

  el.form.addEventListener('submit', e => {
    e.preventDefault();
    send(el.input.value);
  });

  /* ── Status line ────────────────────────────────────────────────────── */

  function setStatus(kind, text) {
    el.status.className = 'status is-' + kind;
    el.status.querySelector('.status-text').textContent = text;
  }

  const IDLE_HINT = 'Tap the mic to start — try “Hey FELIX, I wrapped up early with Dr. Yuki…”';

  /* ── Text to speech ─────────────────────────────────────────────────── */

  const tts = window.speechSynthesis;
  let voice = null;

  function pickVoice() {
    if (!tts) return;
    const voices = tts.getVoices();
    if (!voices.length) return;
    const prefer = [
      'Google US English', 'Samantha', 'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)', 'Karen', 'Moira'
    ];
    voice = prefer.map(n => voices.find(v => v.name === n)).find(Boolean)
         || voices.find(v => /^en[-_]US/i.test(v.lang))
         || voices.find(v => /^en/i.test(v.lang))
         || voices[0];
  }

  if (tts) {
    pickVoice();
    tts.addEventListener('voiceschanged', pickVoice);
  }

  function cancelSpeech() {
    if (tts && (tts.speaking || tts.pending)) tts.cancel();
    state.speaking = false;
    document.body.classList.remove('is-speaking');
  }

  function speak(text) {
    if (!tts || !state.voiceOn || !text) {
      setStatus('idle', IDLE_HINT);
      return;
    }
    cancelSpeech();

    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.03;
    u.pitch = 1.0;
    u.lang = (voice && voice.lang) || 'en-US';

    u.onstart = () => {
      state.speaking = true;
      document.body.classList.add('is-speaking');
      setStatus('speaking', 'FELIX is speaking — tap the mic to interrupt');
    };
    u.onend = u.onerror = () => {
      state.speaking = false;
      document.body.classList.remove('is-speaking');
      if (!state.listening) setStatus('idle', IDLE_HINT);
    };

    // Chrome needs a beat after cancel() before the next utterance takes.
    setTimeout(() => tts.speak(u), 60);
  }

  /* ── Speech recognition ─────────────────────────────────────────────── */

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;

  function buildRecognizer() {
    const r = new SR();
    r.lang = 'en-US';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    let finalText = '';

    r.onstart = () => {
      finalText = '';
      state.listening = true;
      el.mic.classList.add('is-listening');
      document.body.classList.add('is-listening');
      setStatus('listening', 'Listening…');
    };

    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }
      el.input.value = (finalText + interim).trim();
    };

    r.onerror = e => {
      state.listening = false;
      el.mic.classList.remove('is-listening');
      document.body.classList.remove('is-listening');

      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showBanner('Microphone access is blocked. Allow it in your browser’s site settings, or type your question below — the conversation works either way.');
        setStatus('idle', 'Mic blocked — type instead');
      } else if (e.error === 'no-speech') {
        setStatus('idle', 'Didn’t hear anything — tap the mic and try again');
      } else {
        setStatus('idle', IDLE_HINT);
      }
    };

    r.onend = () => {
      state.listening = false;
      el.mic.classList.remove('is-listening');
      document.body.classList.remove('is-listening');
      const said = (finalText || el.input.value).trim();
      if (said) send(said);
      else if (!state.speaking && !state.busy) setStatus('idle', IDLE_HINT);
    };

    return r;
  }

  function startListening() {
    if (!SR) {
      el.input.focus();
      return;
    }
    cancelSpeech();                       // barge-in: talking over FELIX stops him
    stopMicMeter();
    try {
      recog = buildRecognizer();
      recog.start();
      startMicMeter();
    } catch (_) { /* start() throws if already running */ }
  }

  function stopListening() {
    stopMicMeter();
    if (recog && state.listening) {
      try { recog.stop(); } catch (_) {}
    }
  }

  el.mic.addEventListener('click', () => {
    if (state.listening) stopListening();
    else if (state.speaking) { cancelSpeech(); setStatus('idle', IDLE_HINT); }
    else startListening();
  });

  /* Space bar as push-to-talk, when not typing. */
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat) return;
    if (document.activeElement === el.input) return;
    if (!document.getElementById('panel-ask').classList.contains('is-active')) return;
    e.preventDefault();
    if (!state.listening) startListening();
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'Space' && state.listening && document.activeElement !== el.input) {
      e.preventDefault();
      stopListening();
    }
  });

  /* ── Mic level → orb size (best effort; falls back to CSS pulse) ────── */

  let audioCtx = null, micStream = null, meterFrame = null;

  function startMicMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (!state.listening) { stream.getTracks().forEach(t => t.stop()); return; }
      micStream = stream;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      (function loop() {
        if (!state.listening) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.min(1, Math.sqrt(sum / data.length) * 6);
        el.mic.style.setProperty('--level', level.toFixed(3));
        meterFrame = requestAnimationFrame(loop);
      })();
    }).catch(() => { /* recognition still works without the meter */ });
  }

  function stopMicMeter() {
    if (meterFrame) cancelAnimationFrame(meterFrame);
    meterFrame = null;
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    el.mic.style.setProperty('--level', '0');
  }

  /* ── Banner ─────────────────────────────────────────────────────────── */

  function showBanner(msg) {
    el.banner.textContent = msg;
    el.banner.hidden = false;
  }

  /* ── Controls ───────────────────────────────────────────────────────── */

  const btnVoice = el.btnVoice;
  btnVoice.addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    btnVoice.setAttribute('aria-pressed', String(state.voiceOn));
    btnVoice.classList.toggle('is-off', !state.voiceOn);
    btnVoice.querySelector('.ghost-label').textContent = state.voiceOn ? 'Voice on' : 'Voice off';
    if (!state.voiceOn) cancelSpeech();
  });

  el.btnReset.addEventListener('click', reset);

  function reset() {
    stopListening();
    cancelSpeech();
    state.lastNodeId = null;
    state.fallbackIndex = 0;
    state.busy = false;
    el.thread.innerHTML = '';
    el.input.value = '';
    addMessage('felix', SCRIPT.greeting.text, SCRIPT.greeting.blocks);
    renderChips(SCRIPT.greeting.chips);
    setStatus('idle', IDLE_HINT);
  }

  /* ── Boot ───────────────────────────────────────────────────────────── */

  if (!SR) {
    showBanner('This browser can’t listen — speech recognition needs Chrome, Edge, or Safari. You can still run the whole conversation by typing or tapping the suggestions below.');
  }
  if (!tts) {
    showBanner('This browser has no speech synthesis, so FELIX will reply in text only.');
  }

  reset();
  setStatus('idle', IDLE_HINT);
})();
