/* ============================================================================
 * FELIX — OpenAI brain
 * ----------------------------------------------------------------------------
 * Replaces the keyword matcher with a real model for typed and dictated turns,
 * so FELIX answers anything instead of only the scripted branches.
 *
 * Credentials come from one of two places, decided by the settings sheet:
 *   proxy   POST {proxyUrl}/chat        — key stays on the server (preferred)
 *   direct  POST api.openai.com/v1/...  — key lives in this browser
 *
 * Endpoint: POST /v1/chat/completions   (verified against openai-node 7.10.0)
 * ==========================================================================*/
(function () {
  'use strict';

  const API = 'https://api.openai.com/v1/chat/completions';
  const MAX_TURNS = 16;   // keep the request small; this is a between-calls assistant

  let history = [];

  function reset() { history = []; }

  function endpoint(cfg) {
    return cfg.proxyUrl ? cfg.proxyUrl.replace(/\/$/, '') + '/chat' : API;
  }

  function headers(cfg) {
    const h = { 'Content-Type': 'application/json' };
    if (!cfg.proxyUrl) h['Authorization'] = 'Bearer ' + cfg.openaiKey;
    return h;
  }

  /* Resolves to the reply text, or rejects with a readable message. */
  async function ask(text, cfg) {
    const persona = window.FELIX_PERSONA;

    history.push({ role: 'user', content: text });
    if (history.length > MAX_TURNS) history = history.slice(-MAX_TURNS);

    const res = await fetch(endpoint(cfg), {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify({
        model: cfg.chatModel,
        messages: [{ role: 'system', content: persona.systemPrompt }].concat(history),
        max_completion_tokens: 400
      })
    });

    if (!res.ok) {
      let msg = res.status + ' ' + res.statusText;
      try {
        const j = await res.json();
        if (j && j.error && j.error.message) msg = j.error.message;
      } catch (_) {}
      history.pop();                       // don't poison the next attempt
      throw new Error(msg);
    }

    const data = await res.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message
      ? (data.choices[0].message.content || '').trim()
      : '';

    if (!reply) { history.pop(); throw new Error('The model returned an empty reply'); }

    history.push({ role: 'assistant', content: reply });
    return reply;
  }

  window.FelixBrain = { ask, reset };
})();
