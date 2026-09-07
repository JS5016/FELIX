/* ============================================================================
 * FELIX — tools
 * ----------------------------------------------------------------------------
 * Six function tools the model can call, plus a local executor over the demo
 * territory data. Shared by both free-form engines:
 *
 *   realtime   declared in the session's `tools`; the model emits
 *              response.function_call_arguments.done, we run the tool and
 *              return a conversation.item.create / function_call_output.
 *   chat       declared as `tools` on /v1/chat/completions; the model returns
 *              tool_calls, we run them and post role:"tool" messages back.
 *
 * Every executor is synchronous and offline — this is demo data, not a CRM.
 * Swapping TERRITORY for real API calls is the only change needed to make
 * these live.
 *
 * Schemas verified against openai 7.10.0 (RealtimeFunctionTool /
 * ChatCompletionTool: { type:'function', name, description, parameters }).
 * ==========================================================================*/
(function () {
  'use strict';

  /* ── Territory data ─────────────────────────────────────────────── */

  const TERRITORY = {
    rep: { name: 'John Delgado', territory: 'Fort Worth', product: 'Pacrivex' },

    hcps: {
      watanabe: {
        id: 'watanabe',
        name: 'Dr. Yuki Watanabe',
        specialty: 'Hematology / Internal Medicine',
        segment: 'High priority target',
        location: 'University Rehabilitation Center, Suite 310, Fort Worth',
        prescribing: { Pacrivex: { trx: 16, nrx: 9 }, Momelyx: { trx: 12 }, Ruxoril: { trx: 9 } },
        last_touch: { date: 'September 1', channel: 'in person', topic: 'Pacrivex — early tolerability, starter and titration pack' },
        history: [
          { date: 'Sept 1', channel: 'in person', note: 'Early tolerability and the titration pack. Asked for real-world discontinuation rates.' },
          { date: 'Aug 11', channel: 'phone', note: 'Formulary coverage for the Meridian and Cascade plans.' },
          { date: 'Jul 22', channel: 'in person', note: 'First raised tolerability in weeks 1 to 2.' },
          { date: 'Jun 30', channel: 'email', note: 'Dosing guide sent, opened twice, no reply.' }
        ],
        barriers: [
          { barrier: 'Early tolerability in weeks 1–2', raised: 3, status: 'open',
            evidence: 'Real-world discontinuation summary, MLR approved Aug 26 — not yet sent',
            counter: 'Share the 8-week real-world discontinuation data and re-offer the staff titration walkthrough.' }
        ],
        nba: { action: 'Close the open tolerability question', priority: 'high', expires_in_days: 9,
               why: 'Raised three times and still unanswered; her growth has flattened after four months.' },
        access: 'Seen today; call note still unlogged.'
      },

      raman: {
        id: 'raman',
        name: 'Dr. Priya Raman',
        specialty: 'Hematology / Oncology',
        segment: 'High priority target',
        location: 'University Rehabilitation Center, Suite 320, Fort Worth',
        prescribing: { Pacrivex: { trx: 11, nrx: 6, recent_starts_30d: 3 } },
        last_touch: { date: '38 days ago', channel: 'in person', topic: 'Pacrivex' },
        history: [{ date: '38 days ago', channel: 'in person', note: 'Routine detail. No titration support left with staff.' }],
        barriers: [
          { barrier: 'Staff never received the titration pack', raised: 1, status: 'open',
            evidence: 'Three new starts in 30 days with no support delivered',
            counter: 'Offer a ten-minute staff walkthrough of the starter and titration pack now.' }
        ],
        nba: { action: 'Walk the staff through the Pacrivex titration pack', priority: 'high', expires_in_days: 5,
               why: 'Three unsupported new starts — the same gap that caused early drop-offs on Dr. Watanabe’s panel.' },
        access: 'Afternoon rep window. Coordinator Dana has 20 minutes free in about 20 minutes; a tighter 15-minute slot about 50 minutes out; window closes in roughly 1 hour 40. Tomorrow 9:45 am has 30 minutes.'
      },

      okonkwo: {
        id: 'okonkwo',
        name: 'Dr. Marcus Okonkwo',
        specialty: 'Internal Medicine',
        segment: 'Medium priority target',
        location: 'University Rehabilitation Center, Suite 145, Fort Worth',
        prescribing: { Pacrivex: { trx: 4, nrx: 2 }, Momelyx: { trx: 14 } },
        last_touch: { date: '3 weeks ago', channel: 'email', topic: 'Pacrivex' },
        history: [{ date: 'July', channel: 'in person', note: 'Raised tolerability as his objection. Momelyx loyalist.' }],
        barriers: [
          { barrier: 'Momelyx loyalty, tolerability doubts', raised: 1, status: 'open',
            evidence: 'Early tolerability summary, MLR approved Aug 26',
            counter: 'Leave the tolerability summary and ask what it would take for one more start.' }
        ],
        nba: { action: 'Share the Pacrivex early tolerability data', priority: 'medium', expires_in_days: 11,
               why: 'Writes Momelyx 14 to Pacrivex 4; no urgency until he tries another start.' },
        access: 'Ground floor, three minutes away. Rarely runs long.'
      },

      castellanos: {
        id: 'castellanos',
        name: 'Dr. Nina Castellanos',
        specialty: 'Hematology',
        segment: 'High priority target',
        location: 'Fort Worth (off-site)',
        prescribing: { Pacrivex: { trx: 22, trend_30d: '-31%' }, Momelyx: { trend_30d: 'up' } },
        last_touch: { date: '46 days ago', channel: 'in person', topic: 'Pacrivex' },
        history: [{ date: '46 days ago', channel: 'in person', note: 'No contact since. Largest lapsed writer.' }],
        barriers: [{ barrier: 'Unknown — no recent contact', raised: 0, status: 'undiagnosed',
                     evidence: 'None', counter: 'Book a discovery call; the decline is the largest in the territory.' }],
        nba: { action: 'Re-engage before the decline sets', priority: 'high', expires_in_days: 7,
               why: 'Down 31% on Pacrivex with Momelyx up, and 46 days since any contact.' },
        access: 'Not in this building.'
      },

      whitfield: {
        id: 'whitfield',
        name: 'Dr. Alan Whitfield',
        specialty: 'Internal Medicine',
        segment: 'High priority target',
        location: 'Arlington — about a 35 minute drive',
        prescribing: { Pacrivex: { trx: 8, nrx: 3 } },
        last_touch: { date: '41 days ago', channel: 'in person', topic: 'Formulary' },
        history: [{ date: '41 days ago', channel: 'in person', note: 'Formulary questions left open.' }],
        barriers: [{ barrier: 'Formulary coverage uncertainty', raised: 2, status: 'open',
                     evidence: 'Coverage update approved Aug 26', counter: 'Walk through the updated coverage tiers.' }],
        nba: { action: 'Formulary coverage update', priority: 'medium', expires_in_days: 14,
               why: 'Two open questions and 41 days since contact.' },
        access: 'Confirmed appointment later today.'
      }
    },

    materials: [
      { name: 'Pacrivex starter and titration pack', approved: 'Aug 26', use: 'leave-behind' },
      { name: 'Pacrivex early tolerability summary', approved: 'Aug 26', use: 'present on screen' },
      { name: 'Pacrivex real-world discontinuation summary', approved: 'Aug 26', use: 'answers Dr. Watanabe’s open question' },
      { name: 'Prescribing information (current)', approved: 'current', use: 'required alongside any piece' }
    ],

    retired: ['Pre-August tolerability deck — retired, removed from the tablet'],

    insights: [
      { headline: 'Dr. Nina Castellanos is the biggest risk', detail: 'Pacrivex down 31% in 30 days, Momelyx up, 46 days since contact. Largest lapsed writer at 22 TRx.' },
      { headline: 'Dr. Priya Raman is growing but fragile', detail: 'Three new starts in 30 days with no titration support delivered.' },
      { headline: 'Dr. Yuki Watanabe has flattened', detail: 'Four months of growth then flat, lining up with the tolerability question she keeps raising.' },
      { headline: 'Two overdue HCPs are in this building', detail: 'Raman at 38 days and Okonkwo at 31 days are both on site right now.' }
    ],

    notContacted: [
      { name: 'Dr. Nina Castellanos', days: 46, priority: 'high' },
      { name: 'Dr. Alan Whitfield', days: 41, priority: 'high' },
      { name: 'Dr. Priya Raman', days: 38, priority: 'high' },
      { name: 'Dr. Marcus Okonkwo', days: 31, priority: 'medium' },
      { name: 'Dr. Sara Lindqvist', days: 29, priority: 'medium' }
    ]
  };

  /* Loose name matching, so "raman" / "priya" / "Dr. Raman" all resolve. */
  function findHcp(q) {
    if (!q) return null;
    const s = String(q).toLowerCase().replace(/^(dr|doctor)\.?\s+/, '').trim();
    const list = Object.values(TERRITORY.hcps);
    return list.find(h => h.id === s)
        || list.find(h => h.name.toLowerCase().includes(s))
        || list.find(h => s.split(/\s+/).some(w => w.length > 2 && h.name.toLowerCase().includes(w)))
        || null;
  }

  const notFound = q => ({
    error: 'No HCP matching "' + q + '" in this territory.',
    known: Object.values(TERRITORY.hcps).map(h => h.name)
  });

  /* ── Tool definitions ───────────────────────────────────────────── */

  const DEFS = [
    {
      name: 'hcp_profile',
      description: 'Look up a prescriber: specialty, segment, location, prescribing volumes for Pacrivex and competitors, and the most recent interaction. Use whenever the rep asks who someone is or how they prescribe.',
      parameters: {
        type: 'object',
        properties: { hcp: { type: 'string', description: 'HCP name or surname, e.g. "Watanabe" or "Dr. Raman".' } },
        required: ['hcp']
      },
      run: a => {
        const h = findHcp(a.hcp);
        if (!h) return notFound(a.hcp);
        return {
          name: h.name, specialty: h.specialty, segment: h.segment, location: h.location,
          prescribing: h.prescribing, last_touch: h.last_touch, access: h.access
        };
      }
    },

    {
      name: 'call_prep',
      description: 'Build a pre-call brief for one HCP: why to see them now, ordered talking points, approved materials to bring, and the suggested opener. Use before the rep walks into a visit.',
      parameters: {
        type: 'object',
        properties: { hcp: { type: 'string', description: 'HCP name or surname.' } },
        required: ['hcp']
      },
      run: a => {
        const h = findHcp(a.hcp);
        if (!h) return notFound(a.hcp);
        const barrier = h.barriers[0];
        return {
          name: h.name,
          why_now: h.nba.why,
          talking_points: [
            barrier ? 'Open on: ' + barrier.counter : 'Open on their most recent open question.',
            'Reference their own numbers: ' + JSON.stringify(h.prescribing),
            'Confirm the next concrete step before leaving.'
          ],
          materials: TERRITORY.materials,
          compliance: 'On-label only. Log any adverse event within 24 hours.',
          access: h.access
        };
      }
    },

    {
      name: 'barrier_lookup',
      description: 'Return the known objections or access barriers for an HCP, how many times each was raised, whether it is still open, and the approved evidence that answers it.',
      parameters: {
        type: 'object',
        properties: { hcp: { type: 'string', description: 'HCP name or surname.' } },
        required: ['hcp']
      },
      run: a => {
        const h = findHcp(a.hcp);
        if (!h) return notFound(a.hcp);
        return { name: h.name, barriers: h.barriers };
      }
    },

    {
      name: 'next_best_action',
      description: 'Return the active suggestion for one HCP, or the ranked list across the territory when no HCP is given. Includes priority, expiry, and the reason it fired.',
      parameters: {
        type: 'object',
        properties: {
          hcp: { type: 'string', description: 'Optional. Omit for the ranked territory list.' },
          nearby_only: { type: 'boolean', description: 'Only HCPs in University Rehabilitation Center.' }
        }
      },
      run: a => {
        if (a.hcp) {
          const h = findHcp(a.hcp);
          if (!h) return notFound(a.hcp);
          return { name: h.name, suggestion: h.nba, access: h.access };
        }
        const rank = { high: 0, medium: 1, low: 2 };
        let list = Object.values(TERRITORY.hcps);
        if (a.nearby_only) list = list.filter(h => h.location.includes('University Rehabilitation Center'));
        return {
          suggestions: list
            .sort((x, y) => rank[x.nba.priority] - rank[y.nba.priority] || x.nba.expires_in_days - y.nba.expires_in_days)
            .map(h => ({ name: h.name, location: h.location, ...h.nba }))
        };
      }
    },

    {
      name: 'territory_insights',
      description: 'Territory-level analytics: behaviour changes over the last 30 days and customers with no contact in four weeks or more. Use for "what changed", "who am I neglecting", "how is my territory doing".',
      parameters: {
        type: 'object',
        properties: {
          focus: { type: 'string', enum: ['behaviour_change', 'not_contacted', 'all'], description: 'Which slice to return. Defaults to all.' }
        }
      },
      run: a => {
        const f = a.focus || 'all';
        const out = {};
        if (f === 'behaviour_change' || f === 'all') out.behaviour_change = TERRITORY.insights;
        if (f === 'not_contacted' || f === 'all') out.not_contacted_4_weeks = TERRITORY.notContacted;
        return out;
      }
    },

    {
      name: 'crm_notes',
      description: 'Read past call notes for an HCP, or draft and file a new one. Always draft first and read it back to the rep; only file after they approve out loud.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['read', 'draft', 'file'], description: 'read past notes, draft a new one, or file the drafted note.' },
          hcp: { type: 'string', description: 'HCP name or surname.' },
          summary: { type: 'string', description: 'For draft: what happened in the rep’s own words.' }
        },
        required: ['action', 'hcp']
      },
      run: a => {
        const h = findHcp(a.hcp);
        if (!h) return notFound(a.hcp);

        if (a.action === 'read') return { name: h.name, notes: h.history };

        if (a.action === 'draft') {
          return {
            status: 'draft — not yet in the CRM',
            name: h.name,
            note: {
              hcp: h.name,
              location: h.location,
              product: TERRITORY.rep.product,
              summary: a.summary || '(no summary given — ask the rep how the visit went)',
              samples: 'none recorded',
              adverse_events: 'none reported',
              next_step: h.barriers[0] ? h.barriers[0].counter : 'Follow up within one week.'
            },
            reminder: 'Read this back and only file it once the rep approves.'
          };
        }

        return {
          status: 'filed',
          name: h.name,
          confirmation: 'Call note synced to the CRM against today’s visit, and the follow-up is on tomorrow’s list.'
        };
      }
    }
  ];

  /* ── Wire formats ───────────────────────────────────────────────── */

  const schema = d => ({ name: d.name, description: d.description, parameters: d.parameters });

  /* Realtime: flat { type:'function', name, description, parameters } */
  const realtimeTools = () => DEFS.map(d => Object.assign({ type: 'function' }, schema(d)));

  /* Chat completions: nested under `function` */
  const chatTools = () => DEFS.map(d => ({ type: 'function', function: schema(d) }));

  /* Returns the tool result as an object; never throws. */
  function run(name, args) {
    const def = DEFS.find(d => d.name === name);
    if (!def) return { error: 'Unknown tool: ' + name };
    try {
      return def.run(args || {});
    } catch (err) {
      return { error: 'Tool ' + name + ' failed: ' + err.message };
    }
  }

  function parseArgs(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (_) { return {}; }
  }

  window.FelixTools = { DEFS, TERRITORY, realtimeTools, chatTools, run, parseArgs, findHcp };
})();
