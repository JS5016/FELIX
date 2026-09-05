/* ============================================================================
 * Ask FELIX — voice agent
 * ----------------------------------------------------------------------------
 * No backend, no API keys.
 *   listening  → Web Speech API SpeechRecognition
 *   voice      → speechSynthesis
 *   brain      → assets/script-data.js
 *
 * Three modes, matching the product:
 *   welcome  logo + starter pills
 *   chat     transcript + composer (type, or mic to dictate)
 *   call     full-screen live voice call, hands-free turn taking
 * ==========================================================================*/
(function () {
  'use strict';

  const SCRIPT = window.FELIX_SCRIPT;

  const $ = id => document.getElementById(id);
  const el = {
    scroll:   $('ask-scroll'),
    welcome:  $('welcome'),
    starters: $('starters'),
    thread:   $('thread'),
    form:     $('form'),
    input:    $('input'),
    dictate:  $('btn-dictate'),
    call:     $('call'),
    callState:$('call-state'),
    callSub:  $('call-sub'),
    liveBox:  $('live-box'),
    callMic:  $('call-mic'),
    endCall:  $('end-call'),
    orb:      $('orb'),
    newBtn:   $('btn-new'),
    time:     $('sb-time')
  };

  const state = {
    lastNodeId: null,
    fallbackIndex: 0,
    mode: 'welcome',      // welcome | chat | call
    busy: false,
    speaking: false,
    listening: false,
    muted: false,
    dictating: false
  };

  /* ── Clock ──────────────────────────────────────────────────────── */

  function tickClock() {
    const d = new Date();
    let h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    el.time.textContent = `${h}:${m} ${ap} ${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* ── Tabs ───────────────────────────────────────────────────────── */

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      if (state.mode === 'call' && name !== 'ask') endCall();
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t === btn));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('is-active', p.id === 'panel-' + name));
    });
  });

  /* ── Rendering ──────────────────────────────────────────────────── */

  const esc = s => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
              <span>${esc(b.location)}</span>${b.walk ? `<span>·</span><span>${esc(b.walk)}</span>` : ''}
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

      case 'rx':
        return `
          <article class="card">
            ${b.title ? `<h4 class="card-title">${esc(b.title)}</h4>` : ''}
            <div class="rx">${b.rows.map(r => {
              const pct = Math.max(4, Math.round((r.value / (r.max || r.value)) * 100));
              return `<div class="rx-row${r.brand ? '' : ' is-comp'}">
                <span class="rx-name">${esc(r.name)}</span>
                <span class="rx-track"><span class="rx-fill" style="width:${pct}%"></span></span>
                <span class="rx-val">${esc(r.value)}</span>
              </div>
              ${r.sub ? `<div class="rx-row"><span></span><span class="hcp-sugg-why" style="margin:0">${esc(r.sub)}</span><span></span></div>` : ''}`;
            }).join('')}</div>
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
          <article class="card">
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
    wrap.innerHTML = role === 'felix'
      ? `<div class="msg-who">FELIX</div><div class="bubble"></div><div class="blocks"></div>`
      : `<div class="bubble"></div>`;
    el.thread.appendChild(wrap);

    const bubble = wrap.querySelector('.bubble');

    if (role === 'felix') {
      const host = wrap.querySelector('.blocks');
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

  function typeInto(node, text, done) {
    const html = rich(text);
    const plain = text.replace(/\*\*/g, '');
    let i = 0;
    const step = Math.max(1, Math.round(plain.length / 80));
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

  const scrollDown = () => { el.scroll.scrollTop = el.scroll.scrollHeight; };

  function thinking() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-felix';
    wrap.innerHTML = `<div class="msg-who">FELIX</div><div class="bubble typing"><i></i><i></i><i></i></div>`;
    el.thread.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  /* Starter pills on the welcome screen. */
  SCRIPT.starters.forEach(text => {
    const b = document.createElement('button');
    b.className = 'starter';
    b.type = 'button';
    b.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.4"/><path d="M3.5 3.2v5.2h5.2M12 7.6V12l3 1.8"/></svg><span></span>`;
    b.querySelector('span').textContent = text;
    b.addEventListener('click', () => send(text));
    el.starters.appendChild(b);
  });

  /* ── Script matching ────────────────────────────────────────────── */

  const normalize = s => ' ' + String(s).toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9':\s]/g, ' ')
    .replace(/\bdoctor\b/g, 'dr')
    .replace(/\s+/g, ' ')
    .trim() + ' ';

  function scoreNode(node, text) {
    if (node.only && !node.only.includes(state.lastNodeId)) return 0;

    let score = 0;
    (node.keywords || []).forEach(g => {
      if (g.any.some(p => text.includes(normalize(p).trim()))) score += g.w;
    });
    if (!score) return 0;

    if (node.after && node.after.includes(state.lastNodeId)) score += 1.5;
    if (node.only) score += 2;
    if (node.id === state.lastNodeId) score -= 1.5;
    return score;
  }

  function match(raw) {
    const text = normalize(raw);
    let best = null, bestScore = 0;
    SCRIPT.nodes.forEach(n => {
      const s = scoreNode(n, text);
      if (s > bestScore) { best = n; bestScore = s; }
    });
    return bestScore >= 3 ? best : null;
  }

  function reply(raw) {
    const node = match(raw);
    if (node) {
      state.lastNodeId = node.id;
      state.fallbackIndex = 0;
      return node;
    }
    const f = SCRIPT.fallbacks[state.fallbackIndex % SCRIPT.fallbacks.length];
    state.fallbackIndex++;
    return f;
  }

  /* ── Chat mode ──────────────────────────────────────────────────── */

  function send(text) {
    const clean = String(text || '').trim();
    if (!clean || state.busy) return;

    state.busy = true;
    stopDictation();
    cancelSpeech();

    if (state.mode === 'welcome') {
      state.mode = 'chat';
      el.welcome.hidden = true;
    }

    addMessage('user', clean);
    el.input.value = '';

    const ghost = thinking();

    setTimeout(() => {
      ghost.remove();
      const r = reply(clean);
      addMessage('felix', r.text, r.blocks);
      speak(r.speech || r.text.replace(/\*\*/g, ''));
      state.busy = false;
    }, 480 + Math.random() * 280);
  }

  el.form.addEventListener('submit', e => { e.preventDefault(); send(el.input.value); });

  el.newBtn.addEventListener('click', () => {
    if (state.mode === 'call') endCall();
    cancelSpeech();
    stopDictation();
    state.lastNodeId = null;
    state.fallbackIndex = 0;
    state.busy = false;
    state.mode = 'welcome';
    el.thread.innerHTML = '';
    el.welcome.hidden = false;
    el.input.value = '';
  });

  /* ── Text to speech ─────────────────────────────────────────────── */

  const tts = window.speechSynthesis;
  let voice = null;

  function pickVoice() {
    if (!tts) return;
    const vs = tts.getVoices();
    if (!vs.length) return;
    const prefer = ['Samantha', 'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)', 'Karen'];
    voice = prefer.map(n => vs.find(v => v.name === n)).find(Boolean)
         || vs.find(v => /^en[-_]US/i.test(v.lang))
         || vs.find(v => /^en/i.test(v.lang)) || vs[0];
  }
  if (tts) { pickVoice(); tts.addEventListener('voiceschanged', pickVoice); }

  function cancelSpeech() {
    if (tts && (tts.speaking || tts.pending)) tts.cancel();
    state.speaking = false;
    el.call.classList.remove('is-speaking');
  }

  /* onDone fires when speech finishes (or immediately if TTS is unavailable). */
  function speak(text, onDone) {
    if (!tts || !text) { if (onDone) onDone(); return; }
    cancelSpeech();

    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.02; u.pitch = 1;
    u.lang = (voice && voice.lang) || 'en-US';

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      state.speaking = false;
      el.call.classList.remove('is-speaking');
      if (onDone) onDone();
    };

    u.onstart = () => {
      state.speaking = true;
      if (state.mode === 'call') {
        el.call.classList.add('is-speaking');
        el.call.classList.remove('is-listening');
        setCallState('Agent is speaking…', 'Speak naturally');
      }
    };
    u.onend = finish;
    u.onerror = finish;

    setTimeout(() => tts.speak(u), 60);
  }

  /* ── Speech recognition ─────────────────────────────────────────── */

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;

  function newRecognizer(onFinal, onInterim, onEnd) {
    const r = new SR();
    r.lang = 'en-US';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    let finalText = '';

    r.onstart = () => { finalText = ''; state.listening = true; };

    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      if (onInterim) onInterim((finalText + interim).trim());
    };

    r.onerror = e => {
      state.listening = false;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') showBanner(
        'Microphone access is blocked. Allow it in your browser’s site settings, or type instead — the conversation works either way.');
    };

    r.onend = () => {
      state.listening = false;
      const said = finalText.trim();
      if (said && onFinal) onFinal(said);
      else if (onEnd) onEnd();
    };

    return r;
  }

  function stopRecognition() {
    if (recog && state.listening) { try { recog.stop(); } catch (_) {} }
    stopMeter();
  }

  /* ── Dictation (composer mic) ───────────────────────────────────── */

  function stopDictation() {
    state.dictating = false;
    el.dictate.classList.remove('is-live');
    stopRecognition();
  }

  el.dictate.addEventListener('click', () => {
    if (!SR) { el.input.focus(); return; }
    if (state.dictating) { stopDictation(); return; }

    cancelSpeech();
    state.dictating = true;
    el.dictate.classList.add('is-live');

    recog = newRecognizer(
      said => { stopDictation(); el.input.value = said; send(said); },
      partial => { el.input.value = partial; },
      () => stopDictation()
    );
    try { recog.start(); startMeter(); } catch (_) { stopDictation(); }
  });

  /* ── Live voice call ────────────────────────────────────────────── */

  function setCallState(title, sub) {
    el.callState.textContent = title;
    if (sub !== undefined) el.callSub.textContent = sub;
  }

  function liveTurn(role, text, interim) {
    const div = document.createElement('div');
    div.className = 'live-turn ' + (role === 'you' ? 'you' : 'agent') + (interim ? ' interim' : '');
    div.innerHTML = `<div class="live-role">${role === 'you' ? 'YOU' : 'AGENT'}</div><div class="live-text"></div>`;
    div.querySelector('.live-text').textContent = text;
    el.liveBox.appendChild(div);
    el.liveBox.scrollTop = el.liveBox.scrollHeight;
    return div;
  }

  let interimNode = null;

  function startCall() {
    if (state.mode === 'call') return;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === 'ask'));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('is-active', p.id === 'panel-ask'));

    state.mode = 'call';
    state.muted = false;
    el.callMic.classList.remove('is-muted');
    el.liveBox.innerHTML = '';
    el.call.hidden = false;
    setCallState('Connecting…', 'Speak naturally');

    if (!SR) showBanner('This browser can’t listen — speech recognition needs Chrome, Edge, or Safari. FELIX will still speak; use End Conversation and type instead.');

    setTimeout(() => {
      const g = SCRIPT.callGreeting;
      liveTurn('agent', g.text);
      agentSays(g.speech || g.text);
    }, 700);
  }

  function agentSays(speech) {
    el.call.classList.remove('is-listening');   // speaking wins over listening
    el.call.classList.add('is-speaking');
    setCallState('Agent is speaking…', 'Speak naturally');
    speak(speech, () => { if (state.mode === 'call') listenInCall(); });
  }

  function listenInCall() {
    if (state.mode !== 'call' || state.muted) {
      if (state.mode === 'call') setCallState('Muted', 'Tap the mic to unmute');
      return;
    }
    if (!SR) { setCallState('Your turn', 'Speech recognition unavailable in this browser'); return; }

    el.call.classList.remove('is-speaking');
    el.call.classList.add('is-listening');
    setCallState('Listening…', 'Speak naturally');
    interimNode = null;

    recog = newRecognizer(
      said => {
        if (interimNode) { interimNode.remove(); interimNode = null; }
        liveTurn('you', said);
        el.call.classList.remove('is-listening');
        setCallState('Thinking…', '');
        stopMeter();

        setTimeout(() => {
          if (state.mode !== 'call') return;
          const r = reply(said);
          liveTurn('agent', r.text.replace(/\*\*/g, ''));
          agentSays(r.speech || r.text.replace(/\*\*/g, ''));
        }, 420);
      },
      partial => {
        if (!partial) return;
        if (!interimNode) interimNode = liveTurn('you', partial, true);
        else { interimNode.querySelector('.live-text').textContent = partial; el.liveBox.scrollTop = el.liveBox.scrollHeight; }
      },
      () => {
        // Nothing heard — keep the line open.
        if (interimNode) { interimNode.remove(); interimNode = null; }
        if (state.mode === 'call' && !state.muted && !state.speaking) setTimeout(listenInCall, 350);
      }
    );

    try { recog.start(); startMeter(); } catch (_) {}
  }

  function endCall() {
    state.mode = el.thread.children.length ? 'chat' : 'welcome';
    el.welcome.hidden = state.mode === 'chat';
    cancelSpeech();
    stopRecognition();
    el.call.classList.remove('is-speaking', 'is-listening');
    el.call.hidden = true;
  }

  $('btn-call').addEventListener('click', startCall);
  $('btn-call-2').addEventListener('click', startCall);
  el.endCall.addEventListener('click', endCall);

  /* Tap the orb to interrupt FELIX mid-sentence. */
  el.orb.addEventListener('click', () => {
    if (state.speaking) { cancelSpeech(); listenInCall(); }
    else if (!state.listening) listenInCall();
  });

  el.callMic.addEventListener('click', () => {
    state.muted = !state.muted;
    el.callMic.classList.toggle('is-muted', state.muted);
    if (state.muted) { stopRecognition(); setCallState('Muted', 'Tap the mic to unmute'); }
    else if (!state.speaking) listenInCall();
  });

  /* ── Mic level → orb scale ──────────────────────────────────────── */

  let audioCtx = null, micStream = null, frame = null;

  function startMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      if (!state.listening) { stream.getTracks().forEach(t => t.stop()); return; }
      micStream = stream;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const an = audioCtx.createAnalyser();
      an.fftSize = 512;
      audioCtx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      (function loop() {
        if (!state.listening) return;
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        el.call.style.setProperty('--level', Math.min(1, Math.sqrt(sum / data.length) * 6).toFixed(3));
        frame = requestAnimationFrame(loop);
      })();
    }).catch(() => {});
  }

  function stopMeter() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    el.call.style.setProperty('--level', '0');
  }

  /* ── Banner ─────────────────────────────────────────────────────── */

  let banner = null;
  function showBanner(msg) {
    if (banner) { banner.textContent = msg; return; }
    banner = document.createElement('div');
    banner.className = 'banner';
    banner.textContent = msg;
    document.querySelector('.composer-wrap').prepend(banner);
  }

  if (!SR) showBanner('This browser can’t listen — speech recognition needs Chrome, Edge, or Safari. Typing and the suggestions run the same conversation.');
})();
