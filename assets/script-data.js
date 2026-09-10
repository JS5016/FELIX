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
 *   roleplay hands the turn to the practice engine (see `roleplay` below)
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
      chips: ['What was my last interaction with her?', 'Practice this call with me', 'Nearby doctors around her office']
    },

    /* "Remind me — what was my last interaction with her?" — the one-line
       recall a rep asks in the parking lot, not the full history. */
    {
      id: 'last_interaction',
      keywords: [
        { w: 3, any: ['last interaction', 'last time', 'when did i last', 'last touch', 'last visit', 'last call with', 'where did we leave', 'what did we discuss', 'what did we cover', 'what did she ask', 'what did he ask', 'remind me'] },
        { w: 1, any: ['with her', 'about her', 'with him', 'yuki', 'watanabe'] }
      ],
      text: "September 1, in person — Pacrivex, early tolerability, and you walked her staff through the starter and titration pack. She asked for real-world discontinuation rates and you still owe her that.",
      speech: "September first, in person. Pacrivex, early tolerability, and you walked her staff through the starter and titration pack. She asked for real world discontinuation rates in the first eight weeks, and that is still open — the approved summary cleared M L R on August twenty sixth and has not gone out. That is the thread to pick up.",
      blocks: [
        {
          type: 'kv',
          title: 'Last interaction · Dr. Yuki Watanabe',
          rows: [
            ['When', 'September 1 · in-person, Suite 310'],
            ['Covered', 'Early tolerability in weeks 1–2'],
            ['Also', 'Walked her staff through the starter and titration pack'],
            ['She asked for', 'Real-world discontinuation rates, first 8 weeks'],
            ['Outcome', 'No commitment — she wanted the data first']
          ]
        },
        { type: 'callout', tone: 'warn', text: 'Still owed: the real-world discontinuation summary, MLR approved Aug 26 and not yet sent. Tolerability is now her third mention.' }
      ],
      chips: ['Practice this call with me', 'Her interaction history in more detail', 'Send her the discontinuation data']
    },

    /* ── Practice roleplay ───────────────────────────────────────────
       Matching here only opens the door; assets/app.js hands every turn
       after this one to the roleplay engine at the bottom of this file. */
    {
      id: 'roleplay_start',
      roleplay: true,
      keywords: [
        { w: 3, any: ['practice', 'practise', 'role play', 'roleplay', 'rehearse', 'run a drill', 'mock call', 'dry run', 'run it with me'] },
        { w: 3, any: ['you play', 'you be', 'pretend you are', 'pretend to be', 'act as', 'play the doctor', 'play dr', 'be dr'] },
        { w: 1, any: ['before i meet', "let's go", 'lets go', 'i will play myself', "i'll play myself", 'with me', 'this call'] }
      ],
      text: '',
      speech: ''
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
      chips: ['Send her the discontinuation data', 'Practice this call with me', 'Log my call with Dr. Watanabe']
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
      speech: "I'm built for the gaps between calls. Ask me who's nearby with an active suggestion, brief me on a customer before you walk in, check whether someone can see you now, or log a call and I'll draft the note. I'll also play the doctor so you can practice the call first, then score how it went.",
      blocks: [{
        type: 'panel',
        title: 'Try asking',
        items: [
          '“Who else is in the same building with an active suggestion?”',
          '“What was my last interaction with Dr. Watanabe?”',
          '“Let’s practice — you play Dr. Yuki and I’ll play myself.”',
          '“Is Dr. Raman free right now?”',
          '“Log my call with Dr. Watanabe.”'
        ]
      }],
      chips: ['Who else is nearby with an active suggestion?', 'Practice this call with me']
    }
  ],

  fallbacks: [
    {
      text: "I didn't catch that. I can find nearby customers with active suggestions, brief you on an HCP, run a practice call, or log a visit.",
      speech: "I didn't catch that. I can find nearby customers with active suggestions, brief you on an H C P, run a practice call, or log a visit.",
      chips: ['Who is nearby with an active suggestion?', 'Tell me about Dr. Watanabe', 'What can you do?']
    },
    {
      text: "Still not sure what you're after — try one of these, or ask “what can you do?”",
      speech: "Still not sure what you're after. Try one of these, or ask what can you do.",
      chips: ['What are my active suggestions for this week?', 'Practice this call with me', "What's next today?"]
    }
  ],

  /* ==========================================================================
   * PRACTICE ROLEPLAY
   * --------------------------------------------------------------------------
   * FELIX plays the doctor so the rep can rehearse before walking in, then
   * breaks character and scores the run. Once `roleplay_start` matches, every
   * turn goes to the engine in app.js instead of the matcher above.
   *
   * A persona is an objection ladder plus a marking scheme:
   *
   *   beats[]   the doctor's next line, in order. `cue` is what the rep has to
   *             do to earn it; miss the cue and she `press`es instead, and
   *             after `maxPress` misses the ladder moves on anyway so a demo
   *             never stalls. `end: true` closes the roleplay after the line.
   *   cues{}    per-dimension phrases that count as covering that dimension,
   *             scored across every rep turn, not just the matching one.
   *   coach{}   persona-specific replacement for a rubric row's hit/miss line.
   *
   * The doctor never volunteers a clinical figure — she raises the barriers
   * the CRM already knows about and makes the rep do the work.
   * ======================================================================== */
  roleplay: {
    defaultPersona: 'watanabe',
    maxPress: 2,

    /* Break character. Checked before anything else, so "gotta go" lands. */
    exit: ['gotta go', 'got to go', 'have to go', 'end the roleplay', 'end roleplay', 'stop the roleplay',
           'stop roleplay', 'end the practice', 'stop practice', 'end practice', 'break character',
           'out of character', 'drop character', "that's enough", 'thats enough', 'how did i do',
           'score me', 'debrief', 'end the drill', 'we are done', "we're done"],

    /* Step outside the scene for one turn — "hold on, Felix, what did she ask for?" */
    aside: ['hey felix', 'ok felix', 'okay felix', 'felix pause', 'pause felix', 'hold on felix',
            'wait felix', 'felix what', 'felix remind', 'timeout', 'time out', 'pause the roleplay'],

    asideFallback: {
      text: "Still in practice — I can pull her history, her barriers, or the approved materials. Say “gotta go” and I'll score the run.",
      speech: "Still in practice. I can pull her history, her barriers, or the approved materials. Say gotta go and I'll score the run."
    },

    /* Counts as discovery in any persona: an actual question, openly framed. */
    openQuestion: ['have you', 'has your', 'how did', 'how are', 'how has', 'how many', 'what would',
                   'what has', 'what do you', 'what did', "what's been", 'whats been', 'would that',
                   'would it help', 'could you', 'can you tell', 'who on', 'when do', 'tell me',
                   'walk me through', 'what is the', 'is that fair'],

    /* Scanned on every rep turn regardless of persona. */
    compliance: [
      { any: ['off label', 'off-label', 'unapproved use', 'any indication', 'outside the label'],
        flag: 'Off-label discussion — stay inside the approved indication.' },
      { any: ['no side effects', 'zero side effects', 'completely safe', 'perfectly safe', 'safest', 'risk free', 'risk-free', 'no risk'],
        flag: 'Absolute safety claim — not supportable and not approved copy.' },
      { any: ['cure', 'cures it', 'cured'],
        flag: '“Cure” is not an approved claim for Pacrivex.' },
      { any: ['guarantee', 'guaranteed', 'i promise'],
        flag: 'Guarantee language — drop it.' },
      { any: ['better than momelyx', 'beats momelyx', 'superior to', 'outperforms'],
        flag: 'Head-to-head superiority claim — the approved materials do not support one.' }
    ],

    /* Five dimensions, marked across the whole run. Personas can override
       any hit/miss line through `coach`. */
    rubric: [
      { id: 'continuity', label: 'Picked up the thread',
        hit:  'Opened on your last visit instead of starting cold.',
        miss: 'You started from scratch. Name the last conversation in your first two sentences — it is the cheapest credibility you have.' },
      { id: 'discovery', label: 'Asked before telling',
        hit:  'Asked an open question early and let her answer.',
        miss: 'You presented more than you asked. One open question tells you which objection is actually live today.' },
      { id: 'objection', label: 'Handled the live objection',
        hit:  'Heard the objection that was in front of you and answered that one.',
        miss: 'The objection moved and you did not move with it.' },
      { id: 'access', label: 'Answered the access barrier',
        hit:  'Named the access support and who owns it.',
        miss: 'An access barrier went unanswered. Coverage is the reason a start does not happen.' },
      { id: 'close', label: 'Closed on a next step',
        hit:  'Left with a specific, checkable next step.',
        miss: 'No commitment was asked for. Close on the next appropriate patient, not on “I’ll follow up”.' }
    ],

    verdicts: [
      { min: 5, text: "That's the call. Nothing I would change." },
      { min: 4, text: 'Strong run — one gap to close.' },
      { min: 3, text: 'Workable, but she left with an objection still open.' },
      { min: 2, text: 'She stayed polite and unconvinced. Worth another run.' },
      { min: 0, text: 'Rough. Run it again before you walk in.' }
    ],

    /* Every persona: never filed, never a real conversation. */
    disclaimer: 'Practice runs are never written to the CRM, and nothing said in character counts as a call record.',

    personas: {

      /* ── Dr. Yuki Watanabe — the call the rep is about to walk into ── */
      watanabe: {
        id: 'watanabe',
        name: 'Dr. Yuki Watanabe',
        short: 'Dr. Watanabe',
        initials: 'YW',
        match: ['yuki', 'watanabe'],

        setup: {
          text: "Practice mode — I'm Dr. Watanabe from here, working from the objections she has actually raised with you. Say **“gotta go”** whenever you want and I'll break character and score the run.",
          speech: "Practice mode. I'm Doctor Watanabe from here, working from the objections she has actually raised with you. Say gotta go whenever you want, and I'll break character and score the run. She's walking in now."
        },
        setupBlocks: [
          {
            type: 'kv',
            title: 'Practice run · Dr. Yuki Watanabe',
            rows: [
              ['Scene', 'Suite 310, between patients — she has about two minutes'],
              ['Open thread', 'Early tolerability, raised three times, still unanswered'],
              ['She asked for', 'Real-world discontinuation rates, first 8 weeks'],
              ['Scored on', 'Continuity · discovery · objection · access · close']
            ]
          },
          { type: 'callout', tone: 'info', text: 'Say “gotta go” to break character. Say “Felix, …” to step out for one question without ending the run.' }
        ],

        opening: {
          text: "Hi, this is Dr. Watanabe. I only have a minute — what did you want to cover on Pacrivex today?",
          speech: "Hi, this is Doctor Watanabe. I only have a minute. What did you want to cover on Pacrivex today?"
        },

        beats: [
          {
            id: 'experience',
            label: 'Asked how the starter pack landed',
            cue: ['starter pack', 'titration', 'new patient', 'how did it go', 'chance to use', 'used it', 'tried it',
                  'last time', 'since we', 'any patients', 'put anyone on', 'started anyone', 'how has it gone',
                  'discontinuation', 'tolerability', 'first two weeks', 'weeks one'],
            line: {
              text: "We tried it once. The pack was fine, but my nurse still had questions and the patient called back confused. I don't have time for extra steps.",
              speech: "We tried it once. The pack was fine, but my nurse still had questions, and the patient called back confused. I don't have time for extra steps."
            },
            press: [
              { text: "I've got about forty seconds before my next patient. What's the ask?",
                speech: "I've got about forty seconds before my next patient. What's the ask?" },
              { text: "You'll have to be quicker than that.",
                speech: "You'll have to be quicker than that." }
            ]
          },
          {
            id: 'workflow',
            label: 'Moved to the workflow problem, not the drug',
            cue: ['nurse', 'staff', 'one page', 'one-page', 'guide', 'walk your', 'walkthrough', 'walk through',
                  'training', 'hand it', 'hand directly', 'patient guide', 'workflow', 'extra steps', 'your team',
                  'ten minutes', 'save your'],
            line: {
              text: "Possibly. But I've also had a couple of patients run into coverage delays, and that makes me hesitant to start something new.",
              speech: "Possibly. But I've also had a couple of patients run into coverage delays, and that makes me hesitant to start something new."
            },
            press: [
              { text: "That's the part I already know. My problem is what happens after the prescription — my nurse fields those calls, not you.",
                speech: "That's the part I already know. My problem is what happens after the prescription. My nurse fields those calls, not you." },
              { text: "I'm not debating the molecule. I'm telling you the process costs my staff time.",
                speech: "I'm not debating the molecule. I'm telling you the process costs my staff time." }
            ]
          },
          {
            id: 'access',
            label: 'Answered the coverage barrier',
            cue: ['coverage', 'access', 'prior auth', 'authorization', 'benefit', 'copay', 'hub', 'paperwork',
                  'support team', 'specialty pharmacy', 'reimbursement', 'delays', 'access support', 'connect your team'],
            line: {
              text: "Alright. If your access team handles the paperwork and that guide keeps my nurse out of it, I'd consider it on the next appropriate patient.",
              speech: "Alright. If your access team handles the paperwork, and that guide keeps my nurse out of it, I'd consider it on the next appropriate patient."
            },
            press: [
              { text: "You're answering a question I didn't ask. The delays are the issue.",
                speech: "You're answering a question I didn't ask. The delays are the issue." },
              { text: "Again — coverage. If a patient waits two weeks, that lands on me, not on you.",
                speech: "Again. Coverage. If a patient waits two weeks, that lands on me, not on you." }
            ]
          },
          {
            id: 'close',
            label: 'Asked for a specific next step',
            end: true,
            cue: ['follow up', 'follow-up', 'next appropriate', 'next patient', 'next start', 'check back',
                  'come back', 'circle back', 'stop back', 'see how it went', 'leave the', "i'll leave",
                  'i will leave', 'send you', 'is that fair', 'does that work'],
            line: {
              text: "That's fair. Leave the guide, send my office the access contact, and follow up after my next start. I have to go.",
              speech: "That's fair. Leave the guide, send my office the access contact, and follow up after my next start. I have to go."
            },
            press: [
              { text: "Is there anything else? I'm already late.",
                speech: "Is there anything else? I'm already late." },
              { text: "Then we'll leave it there. Thanks for coming by.",
                speech: "Then we'll leave it there. Thanks for coming by." }
            ]
          }
        ],

        cues: {
          continuity: ['last time', 'last visit', 'september', 'when we spoke', 'when we met', 'titration',
                       'starter pack', 'you asked', 'we discussed', 'we talked about', 'last month', 'picked up'],
          discovery:  ['have you had a chance', 'how did it go', 'what happened', 'what did your nurse', 'how has'],
          objection:  ['nurse', 'staff', 'one page', 'one-page', 'patient guide', 'walk through', 'walkthrough',
                       'workflow', 'training', 'hand it', 'extra steps'],
          access:     ['coverage', 'access', 'prior auth', 'authorization', 'benefit', 'copay', 'paperwork',
                       'support', 'hub', 'reimbursement', 'specialty pharmacy'],
          close:      ['follow up', 'follow-up', 'next appropriate', 'next patient', 'next start', 'check back',
                       'come back', 'circle back', 'stop back', 'see how it went', "i'll leave", 'i will leave']
        },

        coach: {
          objection: { hit:  'She told you the pack was fine and her nurse was not — you followed the objection to workflow.',
                       miss: 'She told you the pack was fine and her nurse was not. You kept selling the pack; the objection had already moved to workflow.' },
          access:    { hit:  'You named the access support instead of arguing with the coverage delays.',
                       miss: 'Coverage delays were her second objection and you left them sitting. Name the access support and who on your side owns it.' },
          continuity:{ miss: 'Three visits in a row have been about tolerability. Opening on September 1 costs you one sentence and saves her explaining herself again.' }
        },

        debrief: {
          strong: [
            'You picked up the September 1 thread, followed the objection when it moved, and closed on her next appropriate patient.',
            'Keep the run short — she gave you a minute and you used it.'
          ],
          real: 'For the real call: the real-world discontinuation summary she asked for on September 1 is MLR approved and still unsent. Take it in with you.',
          chips: ['Send her the discontinuation data', 'Run it again', "What's next today?"]
        }
      },

      /* ── Dr. Priya Raman — the unsupported starts down the hall ────── */
      raman: {
        id: 'raman',
        name: 'Dr. Priya Raman',
        short: 'Dr. Raman',
        initials: 'PR',
        match: ['raman', 'priya'],

        setup: {
          text: "Practice mode — I'm Dr. Raman. Three new starts in thirty days, no titration support delivered, and she does not know that is a problem yet. Say **“gotta go”** to break character.",
          speech: "Practice mode. I'm Doctor Raman. Three new starts in thirty days, no titration support delivered, and she doesn't know that's a problem yet. Say gotta go to break character."
        },
        setupBlocks: [
          {
            type: 'kv',
            title: 'Practice run · Dr. Priya Raman',
            rows: [
              ['Scene', 'Suite 320, five minutes between patients'],
              ['The gap', 'Three new starts in 30 days, no titration pack with her staff'],
              ['Her view', 'Her staff handles starts; no one has told her there is a problem'],
              ['Scored on', 'Continuity · discovery · objection · access · close']
            ]
          }
        ],

        opening: {
          text: "You caught me between patients — five minutes. What is it?",
          speech: "You caught me between patients. Five minutes. What is it?"
        },

        beats: [
          {
            id: 'starts',
            label: 'Led with her own numbers',
            cue: ['three', 'new starts', 'started', 'thirty days', '30 days', 'last month', 'titration', 'support',
                  'pack', 'your patients', 'how are they doing'],
            line: {
              text: "My staff manages the starts, not me. If something were going wrong I'd have heard about it.",
              speech: "My staff manages the starts, not me. If something were going wrong, I'd have heard about it."
            },
            press: [
              { text: "I have four minutes now. What did you want?",
                speech: "I have four minutes now. What did you want?" },
              { text: "If this is a general detail, leave it with the front desk.",
                speech: "If this is a general detail, leave it with the front desk." }
            ]
          },
          {
            id: 'evidence',
            label: 'Made the risk concrete',
            cue: ['drop', 'drop-off', 'discontinu', 'week two', 'first two weeks', 'watanabe', 'same gap',
                  'called back', 'confused', 'nurse', 'happened on', 'early weeks', 'fragile'],
            line: {
              text: "That's a fair point. Dana handles our start paperwork — but she's also the one chasing prior authorizations all day, so I don't want to add to her list.",
              speech: "That's a fair point. Dana handles our start paperwork, but she's also the one chasing prior authorizations all day, so I don't want to add to her list."
            },
            press: [
              { text: "You'd have to show me an actual problem. My patients are doing fine as far as I know.",
                speech: "You'd have to show me an actual problem. My patients are doing fine, as far as I know." },
              { text: "I'm not going to change a process on a hunch.",
                speech: "I'm not going to change a process on a hunch." }
            ]
          },
          {
            id: 'access',
            label: 'Took work off Dana, not added it',
            cue: ['dana', 'access', 'prior auth', 'authorization', 'coverage', 'paperwork', 'we handle', 'our team',
                  'support', 'ten minutes', 'take it off', 'save her'],
            line: {
              text: "If it genuinely saves Dana time, do it. Ten minutes with her while I'm in clinic — not with me.",
              speech: "If it genuinely saves Dana time, then do it. Ten minutes with her while I'm in clinic. Not with me."
            },
            press: [
              { text: "That still sounds like more work for my staff.",
                speech: "That still sounds like more work for my staff." },
              { text: "Who is actually doing this, you or Dana?",
                speech: "Who is actually doing this? You, or Dana?" }
            ]
          },
          {
            id: 'close',
            label: 'Booked the time',
            end: true,
            cue: ['today', 'now', 'this afternoon', 'window', 'book', 'schedule', 'come back', 'follow up',
                  'twenty minutes', 'end of the window', 'set it up', 'tomorrow'],
            line: {
              text: "Fine — catch Dana in the afternoon window and set it up with her. If it works, tell me at my next appointment.",
              speech: "Fine. Catch Dana in the afternoon window and set it up with her. If it works, tell me at my next appointment."
            },
            press: [
              { text: "I need to get back. Anything else?",
                speech: "I need to get back. Anything else?" },
              { text: "Leave it with Dana and we'll see.",
                speech: "Leave it with Dana, and we'll see." }
            ]
          }
        ],

        cues: {
          continuity: ['last time', 'five weeks', 'thirty eight days', '38 days', 'when i was here', 'last visit', 'since'],
          discovery:  ['how are', 'what has', 'who on your', 'how does your', 'what happens when', 'who handles'],
          objection:  ['dana', 'staff', 'nurse', 'titration', 'pack', 'walk through', 'walkthrough', 'ten minutes', 'take it off'],
          access:     ['prior auth', 'authorization', 'coverage', 'access', 'paperwork', 'support', 'benefit'],
          close:      ['book', 'schedule', 'this afternoon', 'window', 'come back', 'follow up', 'set it up', 'tomorrow']
        },

        coach: {
          objection: { hit:  'You made the gap concrete with what happened on Dr. Watanabe’s panel instead of asserting it.',
                       miss: 'She will not act on a hunch. The three unsupported starts only matter once you show her the drop-offs that followed the same gap.' },
          access:    { hit:  'You framed it as work taken off Dana, which is the only version she says yes to.',
                       miss: 'Everything you offered added to her staff’s list. Frame the walkthrough as time saved for Dana, not time spent.' }
        },

        debrief: {
          strong: [
            'You led with her own numbers, made the risk concrete, and routed the work to Dana instead of to her.',
            'That is the version that fits inside five minutes.'
          ],
          real: 'For the real call: Dana has a 20-minute slot in about 20 minutes, and the suggestion expires in 5 days.',
          chips: ['Is she free right now?', 'Run it again', 'Tell me about Dr. Raman']
        }
      },

      /* ── Dr. Marcus Okonkwo — the competitor loyalist ──────────────── */
      okonkwo: {
        id: 'okonkwo',
        name: 'Dr. Marcus Okonkwo',
        short: 'Dr. Okonkwo',
        initials: 'MO',
        match: ['okonkwo', 'marcus'],

        setup: {
          text: "Practice mode — I'm Dr. Okonkwo. Momelyx loyalist, 14 to 4 against you, and tolerability is his stated reason. Say **“gotta go”** to break character.",
          speech: "Practice mode. I'm Doctor Okonkwo. Momelyx loyalist, fourteen to four against you, and tolerability is his stated reason. Say gotta go to break character."
        },
        setupBlocks: [
          {
            type: 'kv',
            title: 'Practice run · Dr. Marcus Okonkwo',
            rows: [
              ['Scene', 'Suite 145, ground floor — he rarely runs long'],
              ['His position', 'Momelyx works for him; no reason to change'],
              ['Stated objection', 'Tolerability in the first two weeks, raised in July'],
              ['Scored on', 'Continuity · discovery · objection · access · close']
            ]
          }
        ],

        opening: {
          text: "I write Momelyx and my patients do well on it. What's changed since July?",
          speech: "I write Momelyx, and my patients do well on it. What's changed since July?"
        },

        beats: [
          {
            id: 'why_now',
            label: 'Gave him a reason to re-open it',
            cue: ['july', 'last time', 'tolerability', 'new data', 'approved', 'summary', 'since we spoke', 'changed',
                  'discontinuation', 'first two weeks', 'weeks one'],
            line: {
              text: "That's the part I'm skeptical about. The two patients I started had trouble early, and I moved them back.",
              speech: "That's the part I'm skeptical about. The two patients I started had trouble early, and I moved them back."
            },
            press: [
              { text: "I'm not looking to change anything today.",
                speech: "I'm not looking to change anything today." },
              { text: "You'll need to give me a reason that isn't a brochure.",
                speech: "You'll need to give me a reason that isn't a brochure." }
            ]
          },
          {
            id: 'evidence',
            label: 'Answered with approved evidence, not opinion',
            cue: ['summary', 'data', 'approved', 'real world', 'real-world', 'eight weeks', 'titration', 'starter pack',
                  'dose', 'ramp', 'show you', 'on screen', 'prescribing information'],
            line: {
              text: "Alright, I'll look at it. Though honestly, half my hesitation is that switching creates coverage headaches for my front office.",
              speech: "Alright, I'll look at it. Though honestly, half my hesitation is that switching creates coverage headaches for my front office."
            },
            press: [
              { text: "Everyone has a summary. What does it actually show?",
                speech: "Everyone has a summary. What does it actually show?" },
              { text: "I've heard the claim. I want the data behind it.",
                speech: "I've heard the claim. I want the data behind it." }
            ]
          },
          {
            id: 'access',
            label: 'Cleared the office-level friction',
            cue: ['coverage', 'access', 'formulary', 'prior auth', 'authorization', 'front office', 'paperwork',
                  'support', 'copay', 'benefit', 'tier'],
            line: {
              text: "That helps. I'm not moving my panel, but I'd try one new start if the first two weeks are covered properly.",
              speech: "That helps. I'm not moving my panel, but I'd try one new start if the first two weeks are covered properly."
            },
            press: [
              { text: "You're still talking about the drug. My problem is the office.",
                speech: "You're still talking about the drug. My problem is the office." },
              { text: "Coverage. That's the question.",
                speech: "Coverage. That's the question." }
            ]
          },
          {
            id: 'close',
            label: 'Asked for the one start',
            end: true,
            cue: ['one start', 'one patient', 'next appropriate', 'next patient', 'try', 'would you consider',
                  'follow up', 'come back', 'check back', 'is that fair'],
            line: {
              text: "One patient. Send the summary and the titration pack to my nurse, and ask me about it in a month.",
              speech: "One patient. Send the summary and the titration pack to my nurse, and ask me about it in a month."
            },
            press: [
              { text: "Was there anything else?",
                speech: "Was there anything else?" },
              { text: "Then leave the materials and we'll talk another time.",
                speech: "Then leave the materials, and we'll talk another time." }
            ]
          }
        ],

        cues: {
          continuity: ['july', 'last time', 'when we spoke', 'you raised', 'you mentioned', 'three weeks ago', 'my email'],
          discovery:  ['what would it take', 'what have you seen', 'how do you decide', 'what happened with', 'which patients'],
          objection:  ['tolerability', 'titration', 'starter pack', 'summary', 'real world', 'real-world', 'eight weeks', 'dose', 'ramp'],
          access:     ['coverage', 'formulary', 'prior auth', 'authorization', 'front office', 'paperwork', 'support', 'copay', 'tier'],
          close:      ['one start', 'one patient', 'next appropriate', 'next patient', 'would you consider', 'follow up', 'come back', 'check back']
        },

        coach: {
          objection: { hit:  'You answered his early-tolerability experience with the approved summary rather than an opinion.',
                       miss: 'He gave you a real clinical experience and got a claim back. Answer it with the approved tolerability summary or not at all.' },
          close:     { hit:  'You asked for one start, which is the only close he can say yes to today.',
                       miss: 'Asking a loyalist to switch a panel ends the conversation. Ask for one new appropriate patient.' }
        },

        debrief: {
          strong: [
            'You re-opened a closed door with new approved data and asked for one start rather than the panel.',
            'That is how a loyalist moves — one patient at a time.'
          ],
          real: 'For the real call: his suggestion expires in 11 days, and the early tolerability summary is on your tablet.',
          chips: ['Why is Okonkwo only medium?', 'Run it again', "What's next today?"]
        }
      }
    }
  }
};

window.FELIX_SCRIPT = FELIX_SCRIPT;
