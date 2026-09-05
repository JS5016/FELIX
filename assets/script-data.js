/* ============================================================================
 * Ask FELIX — predefined conversation script
 * ----------------------------------------------------------------------------
 * The whole "brain" of the agent. No model call: each turn is matched against
 * the nodes below by keyword score, and the winning node supplies what FELIX
 * says (`speech`), what appears in the transcript (`text`), and the cards
 * rendered underneath (`blocks`).
 *
 * Edit this file only — app.js never needs to know the script.
 *
 * NODE SHAPE
 *   id       unique string
 *   keywords [{ w: weight, any: [...phrases] }] — a phrase hit adds `w`
 *   after    [nodeIds] — score boosted when it directly follows one of these
 *   only     [nodeIds] — can ONLY match right after one of these turns
 *   text     transcript copy
 *   speech   spoken copy (numbers/abbreviations written out for TTS)
 *   blocks   rich cards (types documented in app.js blockHTML)
 *   chips    suggested follow-ups
 *
 * All names, products, and figures are fictional demo data.
 * ==========================================================================*/

const FELIX_SCRIPT = {

  rep: 'John',

  /* The three pills on the welcome screen. */
  starters: [
    'What are my active suggestions for this week?',
    'Show me the list of customers who I have not contacted in the last 4 weeks?',
    'Which HCPs have changed behavior recently?'
  ],

  /* Spoken when a live voice call connects. */
  callGreeting: {
    text: "Hi John, FELIX here. You're at University Rehabilitation Center in Fort Worth. What do you need?",
    speech: "Hi John, FELIX here. You're at University Rehabilitation Center in Fort Worth. What do you need?"
  },

  nodes: [

    /* ── The line from the brief ──────────────────────────────────── */
    {
      id: 'nearby',
      keywords: [
        { w: 3, any: ['same building', 'in the building', 'this building', 'who else', 'anyone else', 'nearby', 'near me', 'close by', 'around her office', 'around the office'] },
        { w: 2, any: ['active suggestion', 'suggestions', 'suggestion'] },
        { w: 2, any: ['wrapped up', 'wrapped', 'finished early', 'wrapping up', 'done early', 'ended early', 'got out early', 'ran short'] },
        { w: 1, any: ['yuki', 'watanabe', 'hey felix', 'free time', 'extra time'] }
      ],
      text: "Good — wrapping early with Dr. Watanabe gives you about **45 minutes**. Two prescribers in University Rehabilitation Center have active suggestions today.",
      speech: "Good. Wrapping early with Doctor Watanabe gives you about forty five minutes. Two prescribers in University Rehabilitation Center have active suggestions today. Doctor Priya Raman in Suite 320, high priority, same floor as Doctor Watanabe. And Doctor Marcus Okonkwo in Suite 145 on the ground floor, medium. Raman is the better use of the window — want the detail?",
      blocks: [
        {
          type: 'hcp',
          name: 'Dr. Priya Raman', initials: 'PR',
          specialty: 'Hematology / Oncology', tier: 'High priority target',
          location: 'Suite 320 · same floor as Dr. Watanabe', walk: '1 min walk',
          priority: 'high',
          suggestion: 'Walk the staff through the Pacrivex titration pack',
          reason: 'Three new starts in the last 30 days with no titration support delivered — the same gap that drove the tolerability drop-offs on her panel.',
          meta: [
            { label: 'Pacrivex TRx', value: '11 · NRx 6' },
            { label: 'Last touch', value: '38 days ago, in person' },
            { label: 'Suggestion expires', value: 'In 5 days' }
          ],
          tags: ['Open to reps today', 'Titration pack not yet delivered']
        },
        {
          type: 'hcp',
          name: 'Dr. Marcus Okonkwo', initials: 'MO',
          specialty: 'Internal Medicine', tier: 'Medium priority target',
          location: 'Suite 145 · ground floor', walk: '3 min walk',
          priority: 'medium',
          suggestion: 'Share the Pacrivex early tolerability data',
          reason: 'Writes Momelyx at 14 TRx against 4 for Pacrivex. Tolerability is the objection he raised in July.',
          meta: [
            { label: 'Pacrivex TRx', value: '4 · NRx 2' },
            { label: 'Last touch', value: '3 weeks ago, email' },
            { label: 'Suggestion expires', value: 'In 11 days' }
          ],
          tags: ['Momelyx loyalist']
        },
        {
          type: 'callout', tone: 'info',
          text: 'Dr. Raman is the stronger stop — same floor, tighter expiry, and three unsupported new starts on the line.'
        }
      ],
      chips: ['Tell me about Dr. Raman', 'Is she free right now?', 'Why is Okonkwo only medium?']
    },

    /* ── Dr. Watanabe profile (mirrors the live transcript) ───────── */
    {
      id: 'yuki_profile',
      keywords: [
        { w: 3, any: ['yuki', 'watanabe'] },
        { w: 2, any: ['tell me about', 'who is', 'brief me', 'profile', 'background', 'summary'] }
      ],
      text: "Dr. Yuki Watanabe — hematology and internal medicine in Fort Worth, a high priority target affiliated with University Rehabilitation Center.",
      speech: "Doctor Yuki Watanabe is a hematology and internal medicine specialist in Fort Worth, and she is a high priority target, affiliated with University Rehabilitation Center. On prescribing, she has about sixteen total prescriptions for Pacrivex with about nine new prescriptions, and she also writes competitors Momelyx at about twelve total prescriptions and Ruxoril at about nine. Your most recent touch was an in person call on September first about Pacrivex, focused on early tolerability concerns and walking the staff through the starter and titration pack. What do you want next, her recent interaction history in more detail, or nearby doctors you can see around her office?",
      blocks: [
        {
          type: 'kv',
          title: 'Dr. Yuki Watanabe',
          rows: [
            ['Specialty', 'Hematology · Internal Medicine'],
            ['Location', 'Fort Worth, TX'],
            ['Affiliation', 'University Rehabilitation Center'],
            ['Segment', 'High priority target']
          ]
        },
        {
          type: 'rx',
          title: 'Prescribing',
          rows: [
            { name: 'Pacrivex', value: 16, sub: 'TRx · 9 NRx', max: 16, brand: true },
            { name: 'Momelyx', value: 12, sub: 'TRx · competitor', max: 16 },
            { name: 'Ruxoril', value: 9, sub: 'TRx · competitor', max: 16 }
          ]
        },
        {
          type: 'kv',
          title: 'Most recent touch',
          rows: [
            ['When', 'September 1 · in-person call'],
            ['Product', 'Pacrivex'],
            ['Focus', 'Early tolerability concerns'],
            ['Also covered', 'Walked staff through the starter and titration pack']
          ]
        }
      ],
      chips: ['Her interaction history in more detail', 'Nearby doctors around her office', 'Log my call with Dr. Watanabe']
    },

    {
      id: 'yuki_history',
      keywords: [
        { w: 3, any: ['interaction history', 'more detail', 'recent history', 'history in more detail', 'past interactions', 'previous calls', 'touch history'] }
      ],
      after: ['yuki_profile'],
      text: "Her last four touches, most recent first.",
      speech: "Here are her last four touches. September first, in person, Pacrivex, early tolerability and the titration pack — she asked for real world discontinuation rates. August eleventh, a phone call on formulary coverage. July twenty second, in person, where she first raised tolerability. And June thirtieth, an email with the dosing guide, which she opened twice. The through line is tolerability: she has raised it three times and it is still open.",
      blocks: [
        {
          type: 'kv',
          title: 'Interaction history',
          rows: [
            ['Sept 1 · in person', 'Pacrivex — early tolerability, titration pack. Asked for real-world discontinuation rates.'],
            ['Aug 11 · phone', 'Formulary coverage for the Meridian and Cascade plans.'],
            ['Jul 22 · in person', 'First raised tolerability in weeks 1–2.'],
            ['Jun 30 · email', 'Dosing guide sent — opened twice, no reply.']
          ]
        },
        { type: 'callout', tone: 'warn', text: 'Tolerability has come up three times and is still open. The real-world discontinuation data she asked for on Sept 1 has not been sent.' }
      ],
      chips: ['Send her the discontinuation data', 'Nearby doctors around her office', 'Log my call with Dr. Watanabe']
    },

    {
      id: 'send_data',
      keywords: [{ w: 3, any: ['send her the', 'send the discontinuation', 'send discontinuation', 'send it to her', 'send the data'] }],
      after: ['yuki_history'],
      text: "Drafted and waiting in your outbox — nothing sends until you approve it.",
      speech: "Drafted and waiting in your outbox. Nothing sends until you approve it.",
      blocks: [
        {
          type: 'note',
          title: 'Draft · to Dr. Yuki Watanabe — awaiting approval',
          body: "Subject: Real-world discontinuation data you asked about\n\nDr. Watanabe,\n\nFollowing up on September 1 — you asked for real-world discontinuation rates for Pacrivex in the first eight weeks. The approved summary is attached.\n\nHappy to walk your staff through the titration pack again if that would help the early weeks.\n\n— John"
        },
        { type: 'callout', tone: 'info', text: 'Attachment: Pacrivex real-world discontinuation summary — MLR approved Aug 26.' }
      ],
      chips: ['Nearby doctors around her office', "What's next today?"]
    },

    /* ── Dr. Raman ───────────────────────────────────────────────── */
    {
      id: 'raman',
      keywords: [
        { w: 3, any: ['raman', 'priya'] },
        { w: 2, any: ['tell me about', 'more about', 'details', 'brief me', 'why her', 'first one', 'suite 320'] }
      ],
      after: ['nearby'],
      text: "Here's the picture on Dr. Raman.",
      speech: "Here's the picture on Doctor Raman. Hematology oncology, high priority, Suite 320 — the same floor you're on. Eleven total Pacrivex prescriptions, six of them new, and three of those starts landed in the last thirty days with no titration support delivered. That is exactly the gap that produced early drop-offs on Doctor Watanabe's panel. Lead with the titration pack, offer the staff walkthrough, and confirm who on her team handles new starts.",
      blocks: [
        {
          type: 'kv',
          title: 'Dr. Priya Raman · Suite 320',
          rows: [
            ['Specialty', 'Hematology / Oncology · high priority'],
            ['Affiliation', 'University Rehabilitation Center'],
            ['Pacrivex', '11 TRx · 6 NRx · 3 starts in the last 30 days'],
            ['Gap', 'No titration pack delivered to her staff'],
            ['Last touch', '38 days ago, in person']
          ]
        },
        {
          type: 'panel',
          title: 'Talking points, in order',
          items: [
            'Open on the three recent starts — she has the volume, the support has not followed.',
            'Offer the staff walkthrough of the starter and titration pack; it is the same fix that steadied Dr. Watanabe’s early weeks.',
            'Confirm who on her team owns new starts, so the pack reaches the right person.'
          ]
        },
        {
          type: 'checklist',
          title: 'Approved materials on your tablet',
          items: [
            'Pacrivex starter and titration pack — MLR approved Aug 26',
            'Early tolerability summary — MLR approved Aug 26',
            'Prescribing information — current version'
          ]
        },
        { type: 'callout', tone: 'warn', text: 'On-label only. Log any adverse event within 24 hours of the conversation.' }
      ],
      chips: ['Is she free right now?', 'What should I open with?', 'What about Dr. Okonkwo?']
    },

    /* ── Availability ────────────────────────────────────────────── */
    {
      id: 'availability',
      keywords: [
        { w: 3, any: ['free right now', 'is she free', 'is she available', 'available now', 'can i see her', 'can i drop in', 'see her now', 'walk in', 'office hours', 'right now', 'is he free'] },
        { w: 1, any: ['now', 'today'] }
      ],
      after: ['nearby', 'raman'],
      text: "Her office keeps an afternoon window for reps, and her coordinator Dana has a 20-minute slot open shortly.",
      speech: "Her office keeps an afternoon window for reps, and her coordinator Dana has a twenty minute slot open in about twenty minutes. That still leaves you clear for your next confirmed call. Want me to request it?",
      blocks: [
        {
          type: 'slots',
          title: 'Dr. Raman · rep access window, today',
          options: [
            { time: 'In 20 minutes', label: '20 minutes · Suite 320', status: 'open' },
            { time: 'In 50 minutes', label: '15 minutes · would make your next call tight', status: 'tight' },
            { time: 'In 1 hr 40 min', label: 'Window closes', status: 'closed' }
          ]
        },
        { type: 'callout', tone: 'good', text: 'Taking the first slot still leaves a comfortable buffer before your next confirmed call.' }
      ],
      chips: ['Yes, book it', 'Try a different time', 'Go see Dr. Okonkwo instead']
    },

    {
      id: 'book',
      keywords: [
        { w: 3, any: ['book it', 'book the', 'yes book', 'lock it in', 'set it up', 'request it', 'schedule it', 'add it to my schedule', 'go ahead', "let's do it", 'do it'] },
        { w: 2, any: ['yes', 'yeah', 'yep', 'sure', 'please'] }
      ],
      only: ['availability', 'alt_time'],
      text: "Done — the slot is requested and your route is updated.",
      speech: "Done. I've requested the slot with Doctor Raman's office and pinned Suite 320 to your route. The titration pack and the early tolerability summary are queued on your tablet. I'll remind you five minutes before, and I'm holding Doctor Okonkwo as a backup if the visit runs short.",
      blocks: [
        {
          type: 'checklist',
          title: 'Handled for you',
          items: [
            'Slot requested with Dana at Suite 320 — confirmation usually lands within 5 minutes',
            'Suite 320 pinned to your route; next-call arrival re-estimated',
            'Titration pack and early tolerability summary queued on your tablet',
            'Reminder set for 5 minutes before',
            'Dr. Okonkwo held as a backup if the visit runs short'
          ]
        }
      ],
      chips: ['What should I open with?', 'Log my call with Dr. Watanabe', "What's next today?"]
    },

    {
      id: 'alt_time',
      keywords: [{ w: 3, any: ['different time', 'another time', 'later', 'other options', 'not then'] }],
      only: ['availability'],
      text: "One other slot today, and a cleaner one tomorrow.",
      speech: "There's one other slot today, but it makes your next confirmed call tight. Tomorrow morning she has thirty minutes at nine forty five, which fits your Fort Worth loop cleanly. My recommendation is still the slot today. Which would you like?",
      blocks: [
        {
          type: 'slots',
          title: 'Alternatives',
          options: [
            { time: 'Today, in 50 min', label: '15 minutes · makes your next call tight', status: 'tight' },
            { time: 'Tomorrow 9:45 am', label: '30 minutes · fits your Fort Worth loop', status: 'open' }
          ]
        }
      ],
      chips: ['Book the slot today after all', 'Take tomorrow at 9:45', 'Go see Dr. Okonkwo instead']
    },

    /* ── Dr. Okonkwo ─────────────────────────────────────────────── */
    {
      id: 'okonkwo',
      keywords: [
        { w: 3, any: ['okonkwo', 'marcus'] },
        { w: 2, any: ['only medium', 'why medium', 'the other one', 'second one', 'internal medicine', 'suite 145', 'instead'] }
      ],
      text: "Dr. Okonkwo scores medium because he's a Momelyx loyalist with low Pacrivex volume — a longer play than Dr. Raman.",
      speech: "Doctor Okonkwo scores medium because he's a Momelyx loyalist. Fourteen total prescriptions for Momelyx against four for Pacrivex, and the objection he raised in July was tolerability. That's a longer play than Doctor Raman, where three new starts are already on the line. If you have ten minutes after Raman, the highest value move is leaving the early tolerability summary and asking what would make him try one more start.",
      blocks: [
        {
          type: 'rx',
          title: 'Dr. Marcus Okonkwo · Suite 145',
          rows: [
            { name: 'Momelyx', value: 14, sub: 'TRx · competitor', max: 14 },
            { name: 'Pacrivex', value: 4, sub: 'TRx · 2 NRx', max: 14, brand: true }
          ]
        },
        {
          type: 'panel',
          title: 'If you do stop by',
          items: [
            'Leave the early tolerability summary — it answers the objection he raised in July.',
            'Ask what it would take for one more Pacrivex start; you need the real barrier, not the stated one.',
            'Ten minutes is enough. He rarely runs long.'
          ]
        }
      ],
      chips: ['Back to Dr. Raman', 'Log my call with Dr. Watanabe', "What's next today?"]
    },

    /* ── Coaching ────────────────────────────────────────────────── */
    {
      id: 'opener',
      keywords: [{ w: 3, any: ['what should i open with', 'how should i open', 'opening line', 'what do i say', 'how do i start', 'lead with', 'first thing i say'] }],
      text: "Keep it short and put her own numbers in the first sentence.",
      speech: "Keep it short and put her own numbers in the first sentence. Something like: Doctor Raman, you've started three patients on Pacrivex in the last month and your staff never got the titration pack. I've got ten minutes to walk them through it — is now bad? That names a real gap, offers a fix rather than a pitch, and asks for a small commitment.",
      blocks: [
        {
          type: 'note',
          title: 'Suggested opener',
          body: "“Dr. Raman — you've started three patients on Pacrivex in the last month, and your staff never got the titration pack. I've got ten minutes to walk them through it. Is now bad?”"
        },
        {
          type: 'panel',
          title: 'Why it works',
          items: [
            'Leads with her own data, so it does not sound like a generic detail.',
            'Offers a fix for a gap rather than a product pitch.',
            '“Is now bad?” is far easier to say yes to than “do you have time?”'
          ]
        }
      ],
      chips: ['Is she free right now?', 'What should I leave behind?', "What's next today?"]
    },

    {
      id: 'leave_behind',
      keywords: [{ w: 3, any: ['leave behind', 'what content', 'what materials', 'what should i bring', 'what do i bring', 'which deck'] }],
      text: "Two pieces, both MLR approved and already on your tablet.",
      speech: "Two pieces, both approved and already on your tablet. The Pacrivex starter and titration pack, which is the leave-behind, and the early tolerability summary to present on screen. Current prescribing information goes with either.",
      blocks: [
        {
          type: 'checklist',
          title: 'Approved for use today',
          items: [
            'Pacrivex starter and titration pack — approved Aug 26 — leave behind',
            'Early tolerability summary — approved Aug 26 — present on screen',
            'Prescribing information — current version — required with either piece'
          ]
        },
        { type: 'callout', tone: 'warn', text: 'The pre-August tolerability deck is retired. I removed it from your tablet.' }
      ],
      chips: ['Is she free right now?', 'What should I open with?', "What's next today?"]
    },

    /* ── Call logging ────────────────────────────────────────────── */
    {
      id: 'log_start',
      keywords: [
        { w: 3, any: ['log my call', 'log the call', 'log my visit', 'write up', 'call note', 'log it'] },
        { w: 1, any: ['yuki', 'watanabe', 'log'] }
      ],
      text: "Ready. Tell me how it went and I'll draft the note for your review.",
      speech: "Ready. I have the visit pre-filled from your schedule — Doctor Watanabe, in person, Suite 310. Tell me how it went and I'll draft the note for your review before anything reaches the C R M.",
      blocks: [
        {
          type: 'kv',
          title: 'Pre-filled from your schedule',
          rows: [
            ['HCP', 'Dr. Yuki Watanabe · Hematology / Internal Medicine'],
            ['Where', 'University Rehabilitation Center, Suite 310'],
            ['Type', 'In-person call'],
            ['Product', 'Pacrivex'],
            ['Samples', 'None recorded — say so if that changed']
          ]
        }
      ],
      chips: ['She wants real-world discontinuation data', 'It went well, tolerability came up again', 'Cancel the note']
    },

    {
      id: 'log_outcome',
      keywords: [{ w: 3, any: ['discontinuation', 'tolerability', 'went well', 'interested', 'she asked', 'she wants', 'it was good', 'positive'] }],
      only: ['log_start'],
      text: "Here's the draft — say “file it” and it goes to the CRM, or tell me what to change.",
      speech: "Here's the draft. Say file it and it goes to the C R M, or tell me what to change. I also queued a follow-up: the real world discontinuation summary was approved on August twenty sixth, so I've scheduled it to go out tomorrow morning.",
      blocks: [
        {
          type: 'note',
          title: 'Draft call note · Dr. Yuki Watanabe',
          body: "In-person call, University Rehabilitation Center, Suite 310. Product: Pacrivex.\n\nDiscussed early tolerability in weeks 1–2, which Dr. Watanabe has now raised three times. Walked her staff through the starter and titration pack.\n\nShe requested real-world discontinuation rates for the first eight weeks before committing to further starts.\n\nNo samples left. No adverse events reported.\n\nNext step: send the approved real-world discontinuation summary and follow up within one week."
        },
        {
          type: 'checklist',
          title: 'Follow-ups queued',
          items: [
            'Send the real-world discontinuation summary (approved Aug 26) — tomorrow, 8:00 am',
            'New suggestion created: “Close the tolerability question — Dr. Watanabe”, expires in 9 days'
          ]
        },
        { type: 'callout', tone: 'info', text: 'Nothing is written to the CRM until you say “file it”.' }
      ],
      chips: ['File it', 'Change the next step', "What's next today?"]
    },

    {
      id: 'log_file',
      keywords: [{ w: 3, any: ['file it', 'save it', 'submit it', 'send it to crm', 'looks good', 'approve it', "that's right", 'thats right'] }],
      only: ['log_outcome'],
      text: "Filed. The note is in the CRM and the follow-up is on tomorrow's list.",
      speech: "Filed. The note is in the C R M against today's visit, and the follow-up is on tomorrow's list. That clears your only outstanding write-up.",
      blocks: [{ type: 'callout', tone: 'good', text: 'Call note synced · no outstanding write-ups today.' }],
      chips: ["What's next today?", "That's all for now"]
    },

    /* ── The three welcome starters ──────────────────────────────── */
    {
      id: 'week_suggestions',
      keywords: [{ w: 3, any: ['active suggestions for this week', 'suggestions this week', 'my active suggestions', 'this week', 'my suggestions'] }],
      text: "Six active suggestions this week. Four are worth your time.",
      speech: "You have six active suggestions this week, and four are worth your time. Doctor Priya Raman, high priority, the titration pack walkthrough, expiring in five days. Doctor Yuki Watanabe, high, close the tolerability question. Doctor Marcus Okonkwo, medium, early tolerability data. And Doctor Alan Whitfield, medium, a formulary coverage update. The other two are low priority speaker program invitations.",
      blocks: [
        {
          type: 'kv',
          title: 'Active this week',
          rows: [
            ['Dr. Priya Raman · HIGH', 'Titration pack walkthrough — expires in 5 days'],
            ['Dr. Yuki Watanabe · HIGH', 'Close the open tolerability question — expires in 9 days'],
            ['Dr. Marcus Okonkwo · MED', 'Share early tolerability data — expires in 11 days'],
            ['Dr. Alan Whitfield · MED', 'Formulary coverage update — expires in 14 days'],
            ['2 more · LOW', 'Speaker program invitations — expire in 21 days']
          ]
        }
      ],
      chips: ['Tell me about Dr. Raman', 'Who is nearby right now?', 'Which HCPs have changed behavior recently?']
    },

    {
      id: 'not_contacted',
      keywords: [{ w: 3, any: ['not contacted', 'have not contacted', "haven't contacted", 'last 4 weeks', 'last four weeks', 'not seen', 'overdue'] }],
      text: "Five customers have gone four weeks or more without contact. Three are high priority.",
      speech: "Five customers have gone four weeks or more without contact, and three of them are high priority. Doctor Priya Raman, thirty eight days. Doctor Alan Whitfield, forty one days. Doctor Nina Castellanos, forty six days, and she's your biggest lapsed writer. Then two medium priority targets at around thirty days. Raman is in this building right now, if you want to close one today.",
      blocks: [
        {
          type: 'kv',
          title: 'No contact in 4+ weeks',
          rows: [
            ['Dr. Priya Raman · HIGH', '38 days — in this building right now'],
            ['Dr. Alan Whitfield · HIGH', '41 days — Arlington, Thursday loop'],
            ['Dr. Nina Castellanos · HIGH', '46 days — largest lapsed writer, 22 TRx'],
            ['Dr. Marcus Okonkwo · MED', '31 days — Suite 145, this building'],
            ['Dr. Sara Lindqvist · MED', '29 days — Denton']
          ]
        },
        { type: 'callout', tone: 'info', text: 'Two of these five are in this building today — Raman and Okonkwo.' }
      ],
      chips: ['Tell me about Dr. Raman', 'Is she free right now?', 'What are my active suggestions for this week?']
    },

    {
      id: 'changed_behavior',
      keywords: [{ w: 3, any: ['changed behavior', 'changed behaviour', 'behavior change', 'trending', 'shifted', 'changed recently'] }],
      text: "Three meaningful shifts in the last 30 days.",
      speech: "Three meaningful shifts in the last thirty days. Doctor Nina Castellanos is down thirty one percent on Pacrivex and up on Momelyx — that's the one to worry about. Doctor Priya Raman is up, three new starts, but with no titration support, so those starts are fragile. And Doctor Yuki Watanabe has flattened after four months of growth, which lines up with the tolerability question she keeps raising.",
      blocks: [
        {
          type: 'kv',
          title: 'Behavior change · last 30 days',
          rows: [
            ['Dr. Nina Castellanos', '▼ 31% Pacrivex, ▲ Momelyx — 46 days since contact'],
            ['Dr. Priya Raman', '▲ 3 new starts — but no titration support delivered'],
            ['Dr. Yuki Watanabe', 'Flat after 4 months of growth — open tolerability question']
          ]
        },
        { type: 'callout', tone: 'warn', text: 'Castellanos is the real risk: the largest decline and the longest gap since contact.' }
      ],
      chips: ['Who is nearby right now?', 'Tell me about Dr. Raman', 'What are my active suggestions for this week?']
    },

    /* ── Schedule / utility ──────────────────────────────────────── */
    {
      id: 'whats_next',
      keywords: [{ w: 3, any: ["what's next", 'what is next', 'rest of my day', 'my day', 'my schedule', 'what else today', "what's left", 'after this', "what's after"] }],
      text: "Two stops left after this building.",
      speech: "After this building you have two stops. Doctor Alan Whitfield in Arlington, confirmed, about a thirty five minute drive. Then your territory wrap-up. The only thing outstanding is the Doctor Watanabe call note.",
      blocks: [
        {
          type: 'kv',
          title: 'Remaining today',
          rows: [
            ['Next', 'Dr. Priya Raman — Suite 320 (if you book it)'],
            ['Then', 'Dr. Alan Whitfield — Arlington, confirmed · ~35 min drive'],
            ['Last', 'Territory wrap-up'],
            ['Outstanding', 'Dr. Watanabe call note not yet logged']
          ]
        }
      ],
      chips: ['Log my call with Dr. Watanabe', 'Is Dr. Raman free right now?', "That's all for now"]
    },

    {
      id: 'wrap',
      keywords: [{ w: 3, any: ["that's all", 'thats all', 'thank you', 'thanks felix', 'thanks', 'nothing else', "i'm good", 'im good', 'goodbye', 'bye', 'done for now'] }],
      text: "You're set. I'll remind you before the Suite 320 window.",
      speech: "You're set. I'll remind you before the Suite 320 window, and again when it's time to head to Arlington. Go get it, John.",
      blocks: [],
      chips: ['Who else is nearby with an active suggestion?']
    },

    {
      id: 'help',
      keywords: [{ w: 3, any: ['what can you do', 'help', 'how does this work', 'what can i ask'] }],
      text: "I'm built for the gaps between calls. Try asking:",
      speech: "I'm built for the gaps between calls. Ask me who's nearby with an active suggestion, brief me on a customer before you walk in, check whether someone can see you now, or log a call and I'll draft the note.",
      blocks: [{
        type: 'panel',
        title: 'Try asking',
        items: [
          '“Who else is in the same building with an active suggestion?”',
          '“Tell me about Dr. Watanabe.”',
          '“Is Dr. Raman free right now?”',
          '“Log my call with Dr. Watanabe.”',
          '“Which HCPs have changed behavior recently?”'
        ]
      }],
      chips: ['Who else is nearby with an active suggestion?', 'What are my active suggestions for this week?']
    }
  ],

  fallbacks: [
    {
      text: "I didn't catch that. I can find nearby customers with active suggestions, brief you on an HCP, check availability, or log a call.",
      speech: "I didn't catch that. I can find nearby customers with active suggestions, brief you on an H C P, check availability, or log a call.",
      chips: ['Who is nearby with an active suggestion?', 'Tell me about Dr. Watanabe', 'What can you do?']
    },
    {
      text: "Still not sure what you're after — try one of these, or ask “what can you do?”",
      speech: "Still not sure what you're after. Try one of these, or ask what can you do.",
      chips: ['What are my active suggestions for this week?', 'Log my call with Dr. Watanabe', "What's next today?"]
    }
  ]
};

window.FELIX_SCRIPT = FELIX_SCRIPT;
