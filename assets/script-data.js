/* ============================================================================
 * FELIX — predefined conversation script
 * ----------------------------------------------------------------------------
 * This file is the whole "brain" of the Ask FELIX voice agent. There is no
 * model call: each turn is matched against the nodes below by keyword score,
 * and the winning node supplies what FELIX says (`speech`), what is written in
 * the thread (`text`), and the rich cards rendered underneath it (`blocks`).
 *
 * To change the demo, edit this file only — app.js never needs to know the
 * script.
 *
 * NODE SHAPE
 *   id       unique string
 *   keywords [{ w: weight, any: [...phrases] }]  — a phrase hit adds `w`
 *   after    [nodeIds]  — score is boosted when it directly follows one of these
 *   only     [nodeIds]  — node can ONLY match right after one of these turns
 *   text     what appears in the transcript bubble
 *   speech   what is spoken aloud (defaults to `text` with markup stripped)
 *   blocks   rich cards, see BLOCK TYPES below
 *   chips    suggested follow-up utterances shown after the turn
 *
 * BLOCK TYPES
 *   hcp        { name, initials, specialty, tier, location, walk, priority,
 *                suggestion, reason, meta:[{label,value}], tags:[] }
 *   panel      { title, items:[string] }        — bullet list
 *   kv         { title, rows:[[label, value]] } — key/value table
 *   slots      { title, options:[{time, label, status}] }
 *   checklist  { title, items:[string] }
 *   note       { title, body }                  — draft call note
 *   callout    { tone: 'info'|'warn'|'good', text }
 * ==========================================================================*/

const FELIX_SCRIPT = {

  /* Spoken/shown when the tab loads or after Restart. */
  greeting: {
    id: 'greeting',
    text: "Hi Jordan. You're at Bayview Medical Plaza and your next confirmed call isn't until 3:30. Say “Hey FELIX” whenever you're ready.",
    chips: [
      'Hey FELIX, I wrapped up early with Dr. Yuki, who else is in the same building with an active suggestion?',
      "What's left on my day?"
    ]
  },

  nodes: [

    /* ── 1. The opening line from the script ──────────────────────────── */
    {
      id: 'nearby',
      keywords: [
        { w: 3, any: ['same building', 'in the building', 'this building', 'who else', 'anyone else', 'nearby', 'near me', 'close by'] },
        { w: 2, any: ['active suggestion', 'suggestions', 'suggestion'] },
        { w: 2, any: ['wrapped up', 'wrapped', 'finished early', 'wrapping up', 'done early', 'ended early', 'got out early'] },
        { w: 1, any: ['yuki', 'hey felix', 'free time', 'time to kill', 'extra time'] }
      ],
      text: "Nice — finishing early with Dr. Yuki frees up **47 minutes** before your 3:30 at Northgate. Two HCPs in this building have active suggestions right now.",
      speech: "Nice — finishing early with Doctor Yuki frees up 47 minutes before your 3:30 at Northgate. Two H C Ps in this building have active suggestions right now. Doctor Amara Chen in Suite 402, high priority, and Doctor Ravi Patel in Suite 210, medium. Chen is the stronger use of the window — want the detail?",
      blocks: [
        {
          type: 'hcp',
          name: 'Dr. Amara Chen', initials: 'AC',
          specialty: 'Interventional Cardiology', tier: 'Tier A',
          location: 'Suite 402 · two floors up', walk: '3 min walk',
          priority: 'high',
          suggestion: 'Share the ODYSSEY-3 12-month outcomes',
          reason: 'New data published Aug 28. Tier A writer, trending down 12% quarter over quarter.',
          meta: [
            { label: 'Last touch', value: '41 days ago, in person' },
            { label: 'Preferred channel', value: 'In person, mornings' },
            { label: 'Suggestion expires', value: 'In 6 days' }
          ],
          tags: ['Open to reps today', 'Speaker program alum']
        },
        {
          type: 'hcp',
          name: 'Dr. Ravi Patel', initials: 'RP',
          specialty: 'Internal Medicine', tier: 'Tier B',
          location: 'Suite 210 · ground floor', walk: '2 min walk',
          priority: 'medium',
          suggestion: 'Confirm the Meridian Health formulary win',
          reason: 'Effective Oct 1, and 60% of his panel is Meridian-covered.',
          meta: [
            { label: 'Last touch', value: '12 days ago, email' },
            { label: 'Open items', value: '2 sample requests pending' },
            { label: 'Suggestion expires', value: 'In 12 days' }
          ],
          tags: ['Sample requests pending']
        },
        {
          type: 'callout', tone: 'info',
          text: 'Dr. Chen is the stronger use of the window — she has the tighter expiry and the bigger drop in share.'
        }
      ],
      chips: [
        'Tell me more about Dr. Chen',
        'Is she free right now?',
        'Why is Dr. Patel only medium?'
      ]
    },

    /* ── 2. Detail on Dr. Chen ────────────────────────────────────────── */
    {
      id: 'chen_detail',
      keywords: [
        { w: 3, any: ['chen', 'amara'] },
        { w: 2, any: ['tell me more', 'more about', 'details', 'brief me', 'background', 'why her', "what's the suggestion", 'what is the suggestion'] },
        { w: 1, any: ['first one', 'the cardiologist', 'suite 402'] }
      ],
      after: ['nearby'],
      text: "Here's the full picture on Dr. Chen.",
      speech: "Here's the full picture on Doctor Chen. She's a Tier A interventional cardiologist. Her share dropped twelve percent last quarter, mostly to a competitor's once-daily option, and the ODYSSEY-3 twelve-month data published on August 28th answers her main objection. Lead with the durability curve, then the elderly subgroup — she's asked about it twice. One compliance note: the pediatric indication is not approved, so keep off it.",
      blocks: [
        {
          type: 'kv',
          title: 'Dr. Amara Chen · Suite 402',
          rows: [
            ['Specialty', 'Interventional Cardiology · Tier A'],
            ['Affiliation', 'Bayview Cardiac Institute'],
            ['Share trend', '▼ 12% QoQ — shifting to a once-daily competitor'],
            ['Last 3 touches', 'Jul 29 in person · Jun 12 email · May 30 in person'],
            ['Open request', 'Asked twice for elderly subgroup data']
          ]
        },
        {
          type: 'panel',
          title: 'Talking points, in order',
          items: [
            'Open on the ODYSSEY-3 12-month durability curve — it directly answers the once-daily objection she raised in July.',
            'Then the elderly subgroup analysis she has now asked for twice.',
            'Close by confirming her preferred sample quantity before the Oct 1 formulary change.'
          ]
        },
        {
          type: 'checklist',
          title: 'Approved materials, ready on your tablet',
          items: [
            'ODYSSEY-3 12-month outcomes deck — approved Sept 2',
            'Elderly subgroup one-pager — approved Sept 2',
            'Prescribing information — current version'
          ]
        },
        {
          type: 'callout', tone: 'warn',
          text: 'Compliance: the pediatric indication is not approved. Keep the discussion on-label, and log any adverse event within 24 hours.'
        }
      ],
      chips: [
        'Is she free right now?',
        'What should I open with?',
        'What about Dr. Patel?'
      ]
    },

    /* ── 3. Availability ──────────────────────────────────────────────── */
    {
      id: 'chen_availability',
      keywords: [
        { w: 3, any: ['free right now', 'is she free', 'is she available', 'available now', 'can i see her', 'can i drop in', 'see her now', 'walk in', 'is he free', 'office hours', 'right now'] },
        { w: 1, any: ['now', 'today', 'time'] }
      ],
      after: ['nearby', 'chen_detail'],
      text: "Her office keeps Tuesday afternoons open for reps, and Dana — her scheduler — has a 20-minute slot at 2:40. It's 2:18 now, so you'd get there with time to spare.",
      speech: "Her office keeps Tuesday afternoons open for reps, and Dana, her scheduler, has a twenty minute slot at 2:40. It's 2:18 now, so you'd get there with time to spare. That still leaves you a comfortable eighteen minute drive to Northgate. Want me to request it?",
      blocks: [
        {
          type: 'slots',
          title: 'Dr. Chen · rep access window, today',
          options: [
            { time: '2:40 pm', label: '20 minutes · Suite 402', status: 'open' },
            { time: '3:05 pm', label: '15 minutes · would make Northgate tight', status: 'tight' },
            { time: '4:00 pm', label: 'Window closes', status: 'closed' }
          ]
        },
        {
          type: 'callout', tone: 'good',
          text: 'A 2:40 visit still leaves an 18-minute drive to Northgate with 12 minutes of buffer.'
        }
      ],
      chips: [
        'Yes, book the 2:40',
        'Try a different time',
        'No, go see Dr. Patel instead'
      ]
    },

    /* ── 4. Booking confirmation ──────────────────────────────────────── */
    {
      id: 'book',
      keywords: [
        { w: 3, any: ['book it', 'book the', 'yes book', 'lock it in', 'set it up', 'request it', 'schedule it', 'put it on my calendar', 'add it to my schedule', 'go ahead', "let's do it", 'do it'] },
        { w: 2, any: ['yes', 'yeah', 'yep', 'sure', 'please'] }
      ],
      only: ['chen_availability', 'alt_time'],
      text: "Done — 2:40 pm with Dr. Chen is requested and your route is updated.",
      speech: "Done. I've requested 2:40 with Doctor Chen's office and pinned Suite 402 to your route. The ODYSSEY-3 deck and the elderly subgroup one-pager are queued on your tablet. I'll nudge you at 2:35, and I'm holding Doctor Patel as a backup in case the visit runs short.",
      blocks: [
        {
          type: 'checklist',
          title: 'Handled for you',
          items: [
            '2:40 pm request sent to Dana at Suite 402 — confirmation usually lands within 5 minutes',
            'Suite 402 pinned to your route; Northgate arrival re-estimated at 3:22',
            'ODYSSEY-3 deck and elderly subgroup one-pager queued on your tablet',
            'Reminder set for 2:35',
            'Dr. Patel held as a backup if the visit runs short'
          ]
        }
      ],
      chips: [
        'Log my call with Dr. Yuki',
        'What should I open with?',
        "What's after this?"
      ]
    },

    /* ── 4b. Different time ───────────────────────────────────────────── */
    {
      id: 'alt_time',
      keywords: [
        { w: 3, any: ['different time', 'another time', 'later', 'something else', 'other options', 'not then'] }
      ],
      only: ['chen_availability'],
      text: "The 3:05 slot is the only other one today, and it puts your Northgate arrival at 3:41 — eleven minutes late. Tomorrow she has 11:15 am open, which fits your Bayview loop cleanly.",
      speech: "The 3:05 slot is the only other one today, and it puts your Northgate arrival at 3:41 — eleven minutes late. Tomorrow she has 11:15 in the morning open, which fits your Bayview loop cleanly. My recommendation is still the 2:40 today. Which would you like?",
      blocks: [
        {
          type: 'slots',
          title: 'Alternatives',
          options: [
            { time: 'Today 3:05 pm', label: 'Arrives at Northgate 3:41 — 11 min late', status: 'tight' },
            { time: 'Tomorrow 11:15 am', label: '30 minutes · fits your Bayview loop', status: 'open' }
          ]
        }
      ],
      chips: ['Book the 2:40 today after all', 'Take tomorrow at 11:15', 'Go see Dr. Patel instead']
    },

    /* ── 5. Dr. Patel ─────────────────────────────────────────────────── */
    {
      id: 'patel',
      keywords: [
        { w: 3, any: ['patel', 'ravi'] },
        { w: 2, any: ['only medium', 'why medium', 'the other one', 'second one', 'internal medicine', 'suite 210', 'instead'] }
      ],
      text: "Dr. Patel scores medium because his suggestion doesn't bite until the formulary change lands on Oct 1 — there's no urgency this week, and email has worked well with him.",
      speech: "Doctor Patel scores medium because his suggestion doesn't bite until the formulary change lands on October first. There's no urgency this week, and email has worked well with him — he replied to the last two. If you have ten minutes after Doctor Chen, the highest-value thing is confirming his sample quantities in person. Otherwise I can draft the email.",
      blocks: [
        {
          type: 'kv',
          title: 'Dr. Ravi Patel · Suite 210',
          rows: [
            ['Specialty', 'Internal Medicine · Tier B'],
            ['Panel', '~60% Meridian Health covered'],
            ['Open items', '2 sample requests, submitted Aug 27'],
            ['Channel', 'Email — replied to the last 2'],
            ['Why medium', 'No urgency until the Oct 1 formulary effective date']
          ]
        },
        {
          type: 'panel',
          title: 'If you do stop by',
          items: [
            'Confirm sample quantities before Oct 1 so the first covered scripts are easy.',
            'Leave the Meridian coverage summary — approved Sept 2.',
            'Ten minutes is enough; he rarely runs long.'
          ]
        }
      ],
      chips: ['Draft the email to Dr. Patel', 'Back to Dr. Chen', "What's after this?"]
    },

    {
      id: 'patel_email',
      keywords: [{ w: 3, any: ['draft the email', 'send him an email', 'write the email', 'email him', 'draft an email'] }],
      after: ['patel'],
      text: "Drafted. It's sitting in your outbox for review — nothing sends until you approve it.",
      speech: "Drafted. It's in your outbox for review — nothing sends until you approve it.",
      blocks: [
        {
          type: 'note',
          title: 'Draft · to Dr. Ravi Patel — awaiting your approval',
          body: "Subject: Meridian Health coverage, effective October 1\n\nDr. Patel,\n\nQuick note ahead of October 1: Meridian Health has added our therapy to the preferred tier, which covers roughly 60% of your panel.\n\nI've attached the approved coverage summary. Your two sample requests from August 27 are still open — reply with the quantities you'd like and I'll have them to your office before the effective date.\n\nHappy to stop by Suite 210 if that's easier.\n\n— Jordan Ellis"
        },
        { type: 'callout', tone: 'info', text: 'Attachment: Meridian coverage summary — approved Sept 2.' }
      ],
      chips: ['Back to Dr. Chen', 'Log my call with Dr. Yuki', "That's all for now"]
    },

    /* ── 6. Logging the Yuki call ─────────────────────────────────────── */
    {
      id: 'log_start',
      keywords: [
        { w: 3, any: ['log my call', 'log the call', 'log my visit', 'write up', 'call note', 'log yuki', 'log it'] },
        { w: 1, any: ['yuki', 'log'] }
      ],
      text: "Ready. Your calendar has Dr. Yuki from 1:52 to 2:14 — 22 minutes, in person, Suite 310. Tell me how it went and I'll draft the note for your review.",
      speech: "Ready. Your calendar has Doctor Yuki from 1:52 to 2:14 — twenty two minutes, in person, Suite 310. Tell me how it went and I'll draft the note for your review before anything reaches the C R M.",
      blocks: [
        {
          type: 'kv',
          title: 'Pre-filled from your calendar',
          rows: [
            ['HCP', 'Dr. Hana Yuki · Cardiology · Tier A'],
            ['When', 'Today, 1:52 – 2:14 pm (22 min)'],
            ['Where', 'Bayview Medical Plaza, Suite 310'],
            ['Type', 'In-person detail'],
            ['Samples', 'None recorded — say so if that changed']
          ]
        }
      ],
      chips: [
        'She’s interested but wants payer data',
        'It went well, she asked about prior authorization',
        'Cancel the note'
      ]
    },

    {
      id: 'log_outcome',
      keywords: [
        { w: 3, any: ['payer data', 'prior authorization', 'prior auth', 'went well', 'interested', 'she asked', 'coverage question', 'it was good', 'positive'] }
      ],
      only: ['log_start'],
      text: "Got it. Here's the draft — read it back and I'll file it, or tell me what to change.",
      speech: "Got it. Here's the draft. Read it over, and I'll file it when you say so. I also spotted a follow-up: the payer one-pager was approved on September second, so I've queued a suggestion to send it to her tomorrow morning.",
      blocks: [
        {
          type: 'note',
          title: 'Draft call note · Dr. Hana Yuki · Sept 8, 1:52–2:14 pm',
          body: "In-person detail, Bayview Suite 310, 22 minutes.\n\nDiscussed current efficacy data. Dr. Yuki is receptive to the therapy but raised prior-authorization burden as her main barrier — reports two recent denials that were later overturned on appeal.\n\nRequested payer coverage detail for Meridian Health and Cascade Blue.\n\nNo samples left. No adverse events reported.\n\nNext step: send the approved payer coverage one-pager and follow up within one week."
        },
        {
          type: 'checklist',
          title: 'Follow-ups I queued',
          items: [
            'Send the payer coverage one-pager (approved Sept 2) — tomorrow, 8:00 am',
            'New suggestion created: “Follow up on payer coverage — Dr. Yuki”, expires in 9 days'
          ]
        },
        { type: 'callout', tone: 'info', text: 'Nothing is written to the CRM until you say “file it”.' }
      ],
      chips: ['File it', 'Change the next step', "What's after this?"]
    },

    {
      id: 'log_file',
      keywords: [{ w: 3, any: ['file it', 'save it', 'submit it', 'send it to crm', 'looks good', 'thats right', "that's right", 'approve it'] }],
      only: ['log_outcome'],
      text: "Filed. The note is in the CRM against today's visit and the follow-up is on tomorrow's list.",
      speech: "Filed. The note is in the C R M against today's visit, and the follow-up is on tomorrow's list. That clears your only outstanding write-up for the day.",
      blocks: [{ type: 'callout', tone: 'good', text: 'Call note synced · 2:21 pm · no outstanding write-ups today.' }],
      chips: ['What’s after this?', "That's all for now"]
    },

    /* ── 7. Opener / coaching ─────────────────────────────────────────── */
    {
      id: 'opener',
      keywords: [
        { w: 3, any: ['what should i open with', 'how should i open', 'opening line', 'what do i say', 'how do i start', 'first thing i say', 'what should i lead with', 'lead with'] }
      ],
      text: "Keep it short and tie it to what she asked you for last time.",
      speech: "Keep it short and tie it straight to what she asked you for last time. Something like: Doctor Chen, last time you wanted to see whether the effect held past six months. The twelve month ODYSSEY-3 data came out ten days ago, and I brought the elderly subgroup you asked about twice. Two minutes? That names her objection, gives her the new fact, and asks for a small commitment.",
      blocks: [
        {
          type: 'note',
          title: 'Suggested opener',
          body: "“Dr. Chen — last time you wanted to know whether the effect held past six months. The 12-month ODYSSEY-3 data published ten days ago, and I brought the elderly subgroup you've asked about twice. Two minutes?”"
        },
        {
          type: 'panel',
          title: 'Why it works',
          items: [
            'Names her own objection back to her, so it does not sound like a generic detail.',
            'Leads with the new fact, which is the only reason this visit is worth her time.',
            'Asks for a small, easy commitment rather than an open-ended meeting.'
          ]
        }
      ],
      chips: ['Is she free right now?', 'What should I leave behind?', "What's after this?"]
    },

    {
      id: 'leave_behind',
      keywords: [
        { w: 3, any: ['leave behind', 'what content', 'what materials', 'what should i bring', 'what do i bring', 'which deck'] }
      ],
      text: "Two pieces, both approved and already on your tablet.",
      speech: "Two pieces, both approved and already on your tablet. The ODYSSEY-3 twelve month outcomes deck, and the elderly subgroup one-pager. Leave the one-pager — it's the thing she actually asked for. Current prescribing information goes with either.",
      blocks: [
        {
          type: 'checklist',
          title: 'Approved for use today',
          items: [
            'ODYSSEY-3 12-month outcomes deck — approved Sept 2 — present on screen',
            'Elderly subgroup one-pager — approved Sept 2 — leave behind',
            'Prescribing information — current version — required with either piece'
          ]
        },
        { type: 'callout', tone: 'warn', text: 'The older 6-month deck is retired as of Sept 2. I removed it from your tablet.' }
      ],
      chips: ['Is she free right now?', 'What should I open with?', "What's after this?"]
    },

    /* ── 8. Schedule / wrap ───────────────────────────────────────────── */
    {
      id: 'whats_next',
      keywords: [
        { w: 3, any: ["what's after this", 'what is after this', "what's next", 'what is next', 'rest of my day', 'my day', 'my schedule', 'what else today', "what's left", 'after that'] }
      ],
      text: "After Bayview you're clear until 3:30.",
      speech: "After Bayview you're clear until 3:30, when you're with Doctor Elena Sandoval at Northgate Cardiovascular, Suite 415 — eighteen minutes by car. She's confirmed. Then territory wrap-up at 4:30. The only thing outstanding is the Doctor Yuki call note.",
      blocks: [
        {
          type: 'kv',
          title: 'Remaining today',
          rows: [
            ['2:40 pm', 'Dr. Amara Chen — Bayview, Suite 402 (requested)'],
            ['3:30 pm', 'Dr. Elena Sandoval — Northgate, Suite 415 (confirmed, 18 min drive)'],
            ['4:30 pm', 'Territory wrap-up'],
            ['Outstanding', 'Dr. Yuki call note not yet logged']
          ]
        }
      ],
      chips: ['Log my call with Dr. Yuki', 'Brief me on Dr. Sandoval', "That's all for now"]
    },

    {
      id: 'sandoval',
      keywords: [{ w: 3, any: ['sandoval', 'elena', '3:30', 'northgate'] }],
      text: "Dr. Sandoval, 3:30 at Northgate Suite 415 — electrophysiology, Tier A, and a reliable speaker.",
      speech: "Doctor Sandoval, 3:30 at Northgate Suite 415. Electrophysiology, Tier A, and a reliable speaker — she's done two of the last three regional programs. Her open suggestion is the invitation to the October 14th program; seats close September 26th. Last touch was three weeks ago and it was positive.",
      blocks: [
        {
          type: 'kv',
          title: 'Dr. Elena Sandoval · Northgate Suite 415',
          rows: [
            ['Specialty', 'Electrophysiology · Tier A'],
            ['Open suggestion', 'Invite to the Oct 14 regional speaker program'],
            ['Deadline', 'Seats close Sept 26'],
            ['Last touch', '3 weeks ago, in person — positive']
          ]
        }
      ],
      chips: ['Log my call with Dr. Yuki', "That's all for now"]
    },

    {
      id: 'wrap',
      keywords: [
        { w: 3, any: ["that's all", 'thats all', 'thank you', 'thanks felix', 'thanks', 'nothing else', "i'm good", 'im good', 'goodbye', 'bye', 'done for now'] }
      ],
      text: "You're set. I'll nudge you at 2:35 for Suite 402.",
      speech: "You're set. I'll nudge you at 2:35 for Suite 402, and again when it's time to leave for Northgate. Go get it, Jordan.",
      blocks: [],
      chips: ['Hey FELIX, I wrapped up early with Dr. Yuki, who else is in the same building with an active suggestion?']
    },

    /* ── Utility intents ──────────────────────────────────────────────── */
    {
      id: 'who_is_yuki',
      keywords: [{ w: 3, any: ['who is dr yuki', 'who is yuki', 'about yuki', 'tell me about yuki'] }],
      text: "Dr. Hana Yuki — Cardiology, Tier A, Suite 310 in this building. You just left her at 2:14.",
      speech: "Doctor Hana Yuki — Cardiology, Tier A, Suite 310 in this building. You just left her at 2:14, a twenty two minute in-person detail. Her call note is still unlogged, if you want to do it while it's fresh.",
      blocks: [],
      chips: ['Log my call with Dr. Yuki', 'Who else is nearby?']
    },

    {
      id: 'help',
      keywords: [{ w: 3, any: ['what can you do', 'help', 'how does this work', 'what can i ask'] }],
      text: "I'm built for the gaps between calls. Ask me things like:",
      speech: "I'm built for the gaps between calls. Ask me who's nearby with an active suggestion, brief me on a customer before you walk in, check whether someone can see you now, or log a call and I'll draft the note.",
      blocks: [{
        type: 'panel',
        title: 'Try asking',
        items: [
          '“Who else is in the same building with an active suggestion?”',
          '“Tell me more about Dr. Chen.”',
          '“Is she free right now?”',
          '“Log my call with Dr. Yuki.”',
          '“What’s after this?”'
        ]
      }],
      chips: ['Hey FELIX, I wrapped up early with Dr. Yuki, who else is in the same building with an active suggestion?']
    }
  ],

  /* Rotating replies when nothing scores high enough. */
  fallbacks: [
    {
      text: "I didn't catch that one. I can find nearby customers with active suggestions, brief you on an HCP, check availability, or log a call.",
      speech: "I didn't catch that one. I can find nearby customers with active suggestions, brief you on an H C P, check availability, or log a call.",
      chips: ['Who else is nearby with a suggestion?', 'Tell me more about Dr. Chen', 'What can you do?']
    },
    {
      text: "Still not sure what you're after — try one of these, or ask “what can you do?”",
      speech: "Still not sure what you're after. Try one of these, or ask what can you do.",
      chips: ['Is she free right now?', 'Log my call with Dr. Yuki', "What's after this?"]
    }
  ]
};

window.FELIX_SCRIPT = FELIX_SCRIPT;
