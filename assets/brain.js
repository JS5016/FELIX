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
 * Runs the tool loop against assets/tools.js, so a typed turn has the same
 * capability as a live call.
 *
 * Endpoint: POST /v1/chat/completions   (verified against openai-node 7.10.0)
 * ==========================================================================*/
(function () {
  'use strict';

  const API = 'https://api.openai.com/v1/chat/completions';
  const MAX_TURNS = 20;       // keep the request small; this is a between-calls assistant
  const MAX_TOOL_HOPS = 4;   // guard against a tool-call loop

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

  async function post(cfg, messages) {
    const res = await fetch(endpoint(cfg), {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify({
        model: cfg.chatModel,
        messages,
        tools: window.FelixTools.chatTools(),
        tool_choice: 'auto',
        max_completion_tokens: 500
      })
    });

    if (!res.ok) {
      let msg = res.status + ' ' + res.statusText;
      try {
        const j = await res.json();
        if (j && j.error && j.error.message) msg = j.error.message;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  /* Resolves to { text, tools: [{name,args,result}] }, or rejects readably.
   * Runs the tool loop so typed turns get the same capability as a voice call. */
  async function ask(text, cfg, onTool) {
    const persona = window.FELIX_PERSONA;
    const before = history.slice();          // for rollback on failure

    history.push({ role: 'user', content: text });
    if (history.length > MAX_TURNS) history = history.slice(-MAX_TURNS);

    const used = [];

    try {
      for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
        const data = await post(cfg, [{ role: 'system', content: persona.systemPrompt }].concat(history));
        const msg = data.choices && data.choices[0] && data.choices[0].message;
        if (!msg) throw new Error('The model returned no message');

        const calls = msg.tool_calls || [];
        if (!calls.length) {
          const reply = (msg.content || '').trim();
          if (!reply) throw new Error('The model returned an empty reply');
          history.push({ role: 'assistant', content: reply });
          return { text: reply, tools: used };
        }

        // The assistant turn must be recorded before its tool results.
        history.push({ role: 'assistant', content: msg.content || null, tool_calls: calls });

        for (const c of calls) {
          const name = c.function && c.function.name;
          const args = window.FelixTools.parseArgs(c.function && c.function.arguments);
          const result = window.FelixTools.run(name, args);
          used.push({ name, args, result });
          if (onTool) onTool(name, args, result);
          history.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
        }
      }
      throw new Error('Stopped after ' + MAX_TOOL_HOPS + ' tool rounds without a final answer');
    } catch (err) {
      history = before;                      // don't poison the next attempt
      throw err;
    }
  }

  window.FelixBrain = { ask, reset };
})();
