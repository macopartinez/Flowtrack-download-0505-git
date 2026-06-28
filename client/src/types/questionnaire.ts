export type UsageMode = 'personal' | 'professional';

export type QuestionType = 'options' | 'scale' | 'textarea' | 'usage' | 'consent' | 'continent' | 'country';

export interface Continent {
  id: string;
  name: string;
  countries: string[];
}

export const CONTINENTS: Continent[] = [
  {
    id: 'europe',
    name: 'Europe',
    countries: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Austria', 'Greece', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Ireland', 'Russia']
  },
  {
    id: 'north-america',
    name: 'North America',
    countries: ['United States', 'Canada', 'Mexico', 'Cuba', 'Puerto Rico', 'Dominican Republic', 'Jamaica', 'Trinidad and Tobago']
  },
  {
    id: 'south-america',
    name: 'South America',
    countries: ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Ecuador', 'Bolivia', 'Uruguay', 'Paraguay', 'Guyana', 'Suriname']
  },
  {
    id: 'asia',
    name: 'Asia',
    countries: ['Japan', 'South Korea', 'China', 'India', 'Indonesia', 'Malaysia', 'Singapore', 'Philippines', 'Thailand', 'Vietnam', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Turkey', 'Israel', 'United Arab Emirates', 'Saudi Arabia', 'Iran', 'Iraq', 'Afghanistan', 'Nepal', 'Myanmar', 'Cambodia', 'Laos', 'Taiwan', 'Hong Kong', 'Kazakhstan', 'Uzbekistan']
  },
  {
    id: 'africa',
    name: 'Africa',
    countries: ['South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Ghana', 'Tanzania', 'Ethiopia', 'Uganda', 'Rwanda', 'Algeria', 'Tunisia', 'Libya', 'Senegal', 'Ivory Coast', 'Cameroon', 'Democratic Republic of Congo', 'Angola', 'Mozambique', 'Zimbabwe', 'Botswana', 'Namibia', 'Zambia', 'Malawi']
  },
  {
    id: 'oceania',
    name: 'Oceania',
    countries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Tonga', 'Micronesia']
  }
];

export interface QuestionOption {
  main: string;
  sub?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  hint?: string;
  options?: QuestionOption[] | string[];
  scaleMin?: string;
  scaleMax?: string;
  scaleSteps?: number;
  placeholder?: string;
  required?: boolean;
}

export interface QuestionnaireStep {
  id: string;
  phase: string;
  title: string;
  subtitle: string;
  questions: Question[];
  warningBoxes?: WarningBox[];
  showConsent?: boolean;
}

export interface WarningBox {
  type: 'warning' | 'success' | 'info';
  title: string;
  content: string;
}

export interface QuestionnaireAnswers {
  usageMode?: UsageMode;
  consent?: boolean;
  [key: string]: string | boolean | number | UsageMode | undefined;
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  // Step 0: Warning + consent
  {
    id: 'warning',
    phase: 'Before we begin',
    title: "This questionnaire is not a surveillance tool",
    subtitle: "It's a space to step back and understand a relationship — including your own part in it.",
    questions: [],
    showConsent: true,
    warningBoxes: [
      {
        type: 'warning',
        title: 'Our approach',
        content: "What this tool does: it guides you through self-reflection, using a social media signal as a simple starting point.\n\nWhat it doesn't do: it won't tell you \"who blocked you\" for the purpose of confrontation or control.\n\nIf you're going through intense distress right now, please reach out to someone you trust, or a professional, first."
      },
      {
        type: 'success',
        title: 'Our philosophy',
        content: "When a connection breaks, it's natural to ask \"why them?\". Here, we also gently look at your own side — not to assign blame, but because understanding yourself is the part you can actually act on."
      }
    ]
  },
  // Step 1: Usage
  {
    id: 'usage',
    phase: 'Step 1 — Usage',
    title: 'How will you use this tool?',
    subtitle: 'This answer adapts the experience and features offered at the end.',
    questions: [
      {
        id: 'usageMode',
        type: 'usage',
        label: 'Select your usage type',
        required: true
      }
    ]
  },
  // Step 2: Relationship profile
  {
    id: 'profile',
    phase: 'Phase 1 — You',
    title: 'How do you experience your close relationships?',
    subtitle: 'Before talking about the other person, let\'s take a moment for you.',
    questions: [
      {
        id: 'q1',
        type: 'options',
        label: 'In general, how do you experience your close relationships?',
        required: true,
        options: [
          { main: 'With a lot of investment', sub: 'I give a lot, sometimes more than I receive' },
          { main: 'With some distance', sub: 'I find it hard to open up easily' },
          { main: 'In a balanced way', sub: 'I adapt depending on the person' },
          { main: 'With a lot of anxiety', sub: 'The fear of losing people is often present' }
        ]
      },
      {
        id: 'q2',
        type: 'options',
        label: 'When a conflict comes up in a relationship, you tend to...',
        required: true,
        options: [
          'Approach the other person to talk about it directly',
          'Take a step back and wait',
          'Turn it over in your mind without bringing it up',
          'Avoid the subject to keep the peace'
        ]
      },
      {
        id: 'q2_pattern',
        type: 'options',
        label: 'Is this the first time you\'ve experienced this kind of disconnection?',
        required: true,
        options: [
          { main: 'Yes, this feels completely new to me', sub: 'It\'s the first time I experience something like this' },
          { main: 'No — I\'ve been through something similar before', sub: 'I recognize this feeling' },
          { main: 'It happens to me more often than I\'d like', sub: 'It may be a recurring pattern for me' },
          { main: 'I\'m not sure', sub: 'I haven\'t thought about it this way' }
        ]
      }
    ]
  },
  // Step 3: The relationship
  {
    id: 'relation',
    phase: 'Phase 2 — The relationship',
    title: 'Let\'s talk about this particular relationship',
    subtitle: 'No names. Only what you observed and felt.',
    questions: [
      {
        id: 'q3',
        type: 'options',
        label: 'What was the nature of this connection?',
        required: true,
        options: [
          { main: 'Family', sub: 'Parent, sibling, blood relative' },
          { main: 'Deep friendship', sub: 'Someone you trusted' },
          { main: 'Romantic relationship', sub: 'Partner, ex, or someone emotionally significant' },
          { main: 'Acquaintance or colleague', sub: 'Someone present in your daily life' }
        ]
      },
      {
        id: 'q4',
        type: 'options',
        label: 'How present was this relationship in your real life, beyond social media?',
        required: true,
        options: [
          { main: 'Almost entirely online', sub: 'We rarely or never connected offline' },
          { main: 'A mix of both', sub: 'Online and offline interactions both mattered' },
          { main: 'Mostly real-life', sub: 'Social media was just a way to stay in touch' },
          { main: 'Very central to my daily life', sub: 'This person was deeply present in my reality' }
        ]
      },
      {
        id: 'q5',
        type: 'options',
        label: 'Before this signal, had you felt something change?',
        required: true,
        options: [
          'Yes, I had sensed things cooling off',
          'A little, but I didn\'t want to believe it',
          'No, it came as a complete surprise',
          'I\'m not sure'
        ]
      },
      {
        id: 'q5_last_interaction',
        type: 'options',
        label: 'What was your last real interaction with this person like?',
        required: true,
        options: [
          { main: 'A genuine exchange — things seemed fine', sub: 'Nothing pointed to a problem' },
          { main: 'A tense or unresolved moment', sub: 'There was friction neither of us addressed' },
          { main: 'I honestly can\'t remember', sub: 'We had already drifted apart' },
          { main: 'A silence neither of us broke', sub: 'We both let it fade' }
        ]
      }
    ]
  },
  // Step 4: Introspection
  {
    id: 'introspection',
    phase: 'Phase 3 — Your honest perspective',
    title: 'Looking at your side of the story',
    subtitle: 'The most courageous part. There are no right or wrong answers here.',
    questions: [
      {
        id: 'q6_text',
        type: 'textarea',
        label: 'Looking back, is there anything you might have done differently?',
        hint: 'A word said too quickly, a moment missed, being less available than you wanted to be — or maybe nothing comes to mind, and that\'s okay too.',
        placeholder: 'Think out loud here, without judging yourself...',
        required: false
      },
      {
        id: 'q6',
        type: 'options',
        label: 'In this relationship, how did you balance your needs and theirs?',
        required: true,
        options: [
          { main: 'I tried to keep a balance', sub: 'Giving and receiving felt fairly even' },
          { main: 'I often put their needs first', sub: 'Sometimes I forgot my own' },
          { main: 'I often put my own needs first', sub: 'It was my usual way of functioning' },
          { main: 'It varied a lot', sub: 'It depended on the moment' },
          { main: 'I\'m not sure' }
        ]
      },
      {
        id: 'q7_text',
        type: 'textarea',
        label: 'If this person could speak to you freely, what might they say?',
        hint: 'Try to step into their shoes, with honesty.',
        placeholder: 'It\'s not easy. But this is where understanding begins...',
        required: false
      },
      {
        id: 'q6_emotional_debt',
        type: 'textarea',
        label: 'Is there something you never said that you wish you had?',
        hint: 'This stays between you and Waler.',
        placeholder: 'Take your time. This is a safe space...',
        required: false
      },
      {
        id: 'q6_responsibility',
        type: 'options',
        label: 'How do you see the responsibility for what happened?',
        required: true,
        options: [
          { main: '1 — Mostly outside my control', sub: 'Circumstances or their choices drove it' },
          { main: '2 — A little on me', sub: 'But mostly other factors were at play' },
          { main: '3 — Shared between us', sub: 'It takes two in a relationship' },
          { main: '4 — Largely my part', sub: 'Looking back, I see things I\'d change' },
          { main: '5 — Mostly my responsibility', sub: 'I\'m clear about my role in it' }
        ]
      }
    ]
  },
  // Step 5: The signal
  {
    id: 'signal',
    phase: 'Phase 4 — The received signal',
    title: 'The unfollow as a message',
    subtitle: 'A small online gesture that can say something real. Let\'s read it without dramatizing.',
    questions: [
      {
        id: 'q7',
        type: 'options',
        label: 'What does this gesture represent to you?',
        required: true,
        options: [
          { main: 'A definitive rejection', sub: 'I experience it as a total, irreversible break' },
          { main: 'A need for temporary distance', sub: 'This person may just need space' },
          { main: 'A message I didn\'t know how to read before', sub: 'The sign of a tension that already existed' },
          { main: 'I don\'t know yet', sub: 'That\'s why I\'m doing this questionnaire' }
        ]
      },
      {
        id: 'q8',
        type: 'options',
        label: 'How did you react internally when you discovered it?',
        required: true,
        options: [
          { main: 'Anger or a sense of injustice', sub: 'This feels unfair to me' },
          { main: 'Sadness and pain', sub: 'It hurts deeply' },
          { main: 'Confusion', sub: 'I don\'t understand why' },
          { main: 'Relief mixed with pain', sub: 'Part of me saw it coming' },
          { main: 'Several of these at once', sub: 'It\'s complicated and layered' }
        ]
      }
    ]
  },
  // Step 6: The future
  {
    id: 'future',
    phase: 'Phase 5 — The future',
    title: 'What do you hope happens next?',
    subtitle: 'This is about orienting yourself toward what you want to build.',
    questions: [
      {
        id: 'q9_hope',
        type: 'options',
        label: 'What do you hope for?',
        required: true,
        options: [
          { main: 'I hope we reconnect one day', sub: 'The door isn\'t closed for me' },
          { main: 'I think it\'s better for both of us to move on', sub: 'This chapter needs to end' },
          { main: 'I\'m not ready to think about that yet', sub: 'I need more time to process' },
          { main: 'I want to reach out but don\'t know how', sub: 'I\'m caught between wanting and fearing' },
          { main: 'I want to understand before deciding anything', sub: 'Clarity first, action later' }
        ]
      },
      {
        id: 'q9_future_self',
        type: 'textarea',
        label: 'What kind of person do you want to be in your next close relationship?',
        hint: 'Take your time. This answer is for you, not for them.',
        placeholder: 'Think about the version of yourself you want to become...',
        required: false
      }
    ]
  },
  // Step 7: Summary
  {
    id: 'summary',
    phase: 'Complete reflection',
    title: 'Thank you for this honesty.',
    subtitle: 'Asking yourself these questions openly is one of the most mature things a person can do.',
    questions: []
  }
];

// Questionnaire « professionnel » : même structure (8 étapes, mêmes types) que
// la version personnelle pour réutiliser le renderer générique d'Onboard, mais
// orienté prospection / CRM Instagram (leads, setting en DM, conversion).
// Les étapes 0 (warning + consent) et 1 (usage) sont partagées ; seules les
// phases 2→6 changent. Les ids de questions sont préfixés `p` pour distinguer
// les réponses pro des réponses perso lors de la génération d'insights.
export const PRO_QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  // Step 0: Warning + consent (pro-toned)
  {
    id: 'warning',
    phase: 'Before we begin',
    title: "This is not a tool to spy on prospects",
    subtitle: "It's a way to manage your relationships and your pipeline — ethically and without losing track of anyone.",
    questions: [],
    showConsent: true,
    warningBoxes: [
      {
        type: 'warning',
        title: 'Our approach',
        content: "What this tool does: it helps you read social signals (follows, replies, engagement) to nurture real business relationships and never let a warm lead go cold.\n\nWhat it doesn't do: it won't help you pressure, manipulate, or harass anyone. Relationships you can't keep honestly aren't worth keeping.",
      },
      {
        type: 'success',
        title: 'Our philosophy',
        content: "The best sellers don't chase — they pay attention. Here we help you stay organized and human at scale, so the right follow-up reaches the right person at the right time.",
      },
    ],
  },
  // Step 1: Usage (shared)
  {
    id: 'usage',
    phase: 'Step 1 — Usage',
    title: 'How will you use this tool?',
    subtitle: 'This answer adapts the experience and features offered at the end.',
    questions: [
      {
        id: 'usageMode',
        type: 'usage',
        label: 'Select your usage type',
        required: true,
      },
    ],
  },
  // Step 2: Your activity
  {
    id: 'activity',
    phase: 'Phase 1 — Your activity',
    title: 'Tell us about your activity',
    subtitle: 'So we can tailor your pipeline and the signals that matter to you.',
    questions: [
      {
        id: 'p_activity',
        type: 'options',
        label: 'What best describes what you do?',
        required: true,
        options: [
          { main: 'Coach or consultant', sub: 'I sell my expertise or services' },
          { main: 'Creator or influencer', sub: 'I monetize an audience' },
          { main: 'Freelance or service provider', sub: 'I work with clients one-on-one' },
          { main: 'E-commerce or product', sub: 'I sell a product or a brand' },
          { main: 'Agency or small business', sub: 'I manage a team or several clients' },
        ],
      },
      {
        id: 'p_volume',
        type: 'options',
        label: 'How many prospects or clients are you in touch with at once?',
        required: true,
        options: [
          { main: 'Fewer than 10', sub: 'I keep it small and personal' },
          { main: '10 to 50', sub: 'Starting to be hard to track' },
          { main: '50 to 200', sub: 'I definitely lose some along the way' },
          { main: 'More than 200', sub: 'I need real organization' },
        ],
      },
      {
        id: 'p_channel',
        type: 'options',
        label: 'Where do most of your client relationships happen?',
        required: true,
        options: [
          { main: 'Mostly in DMs', sub: 'Instagram conversations are my main channel' },
          { main: 'A mix of DMs and calls', sub: 'I qualify in DM, then close on a call' },
          { main: 'Mostly calls or offline', sub: 'Social media just opens the door' },
          { main: 'Through comments and content', sub: 'Engagement drives my relationships' },
        ],
      },
    ],
  },
  // Step 3: Your prospects
  {
    id: 'prospects',
    phase: 'Phase 2 — Your prospects',
    title: 'How do you handle your prospects today?',
    subtitle: 'No judgment — just a snapshot of how you work right now.',
    questions: [
      {
        id: 'p_source',
        type: 'options',
        label: 'How do prospects usually come to you?',
        required: true,
        options: [
          { main: 'They DM me first', sub: 'Inbound — they reach out' },
          { main: 'I reach out to them', sub: 'Outbound — I start the conversation' },
          { main: 'Through my content', sub: 'They warm up before contacting me' },
          { main: 'Referrals and word of mouth', sub: 'Existing clients send me people' },
        ],
      },
      {
        id: 'p_tracking',
        type: 'options',
        label: 'How do you keep track of your conversations?',
        required: true,
        options: [
          { main: 'In my head', sub: 'I rely on memory' },
          { main: 'Notes or a spreadsheet', sub: 'Manual, and easy to forget' },
          { main: 'A dedicated CRM', sub: 'I already have a system' },
          { main: "I don't really track", sub: 'And I know I lose leads because of it' },
        ],
      },
      {
        id: 'p_qualify',
        type: 'options',
        label: 'When a prospect shows interest, you tend to...',
        required: true,
        options: [
          'Qualify their needs before presenting anything',
          'Present my offer quickly to gauge interest',
          'Wait for them to ask about price or details',
          'It depends on the person and the moment',
        ],
      },
    ],
  },
  // Step 4: Your honest approach
  {
    id: 'approach',
    phase: 'Phase 3 — Your honest approach',
    title: 'Looking at your own side of the sale',
    subtitle: 'The most useful part. There are no right or wrong answers here.',
    questions: [
      {
        id: 'p_lostlead_text',
        type: 'textarea',
        label: 'Think of a prospect who went cold. What do you think really happened?',
        hint: 'A slow reply, a pitch too soon, a follow-up you never sent — or maybe it just wasn\'t the right fit.',
        placeholder: 'Think out loud here, without blaming yourself or them...',
        required: false,
      },
      {
        id: 'p_strength',
        type: 'options',
        label: 'What is your biggest strength in building client relationships?',
        required: true,
        options: [
          { main: 'Building trust', sub: 'People feel comfortable with me' },
          { main: 'Closing', sub: 'I\'m good at the final step' },
          { main: 'Consistency and follow-up', sub: 'I stay present over time' },
          { main: 'Attraction and content', sub: 'I draw the right people in' },
        ],
      },
      {
        id: 'p_gap',
        type: 'options',
        label: 'Where do you lose the most prospects?',
        required: true,
        options: [
          { main: 'At the first message', sub: 'Conversations don\'t even start' },
          { main: 'Mid-conversation', sub: 'Interest fades before the offer' },
          { main: 'At the offer or the price', sub: 'They hesitate and disappear' },
          { main: 'After the call — no follow-up', sub: 'I drop the ball afterwards' },
        ],
      },
      {
        id: 'p_followup_text',
        type: 'textarea',
        label: 'What\'s one thing you keep meaning to improve in your follow-up?',
        hint: 'Be honest — this is the thing a good system could fix for you.',
        placeholder: 'Take your time...',
        required: false,
      },
    ],
  },
  // Step 5: Reading the signals
  {
    id: 'signal',
    phase: 'Phase 4 — Reading the signals',
    title: 'When a prospect goes quiet or unfollows',
    subtitle: 'A small online gesture often carries a real business signal. Let\'s read it without overreacting.',
    questions: [
      {
        id: 'p_unfollow_meaning',
        type: 'options',
        label: 'When a prospect unfollows or goes silent, you read it as...',
        required: true,
        options: [
          { main: 'A lost lead', sub: 'It\'s over, I move on' },
          { main: 'A "not right now"', sub: 'The timing is off, not the fit' },
          { main: 'A sign I moved too fast', sub: 'I may have pushed the offer too early' },
          { main: 'I honestly don\'t track it', sub: 'And I probably should' },
        ],
      },
      {
        id: 'p_reaction',
        type: 'options',
        label: 'How do you usually react?',
        required: true,
        options: [
          { main: 'I follow up with value', sub: 'I re-open the conversation thoughtfully' },
          { main: 'I let it go', sub: 'I focus my energy elsewhere' },
          { main: 'I take it personally', sub: 'It affects my motivation' },
          { main: 'I analyze what went wrong', sub: 'I look for the lesson' },
        ],
      },
    ],
  },
  // Step 6: Your goals
  {
    id: 'goals',
    phase: 'Phase 5 — Your goals',
    title: 'What do you want this tool to do for you?',
    subtitle: 'This helps us put the right features in front of you.',
    questions: [
      {
        id: 'p_goal',
        type: 'options',
        label: 'What matters most to you right now?',
        required: true,
        options: [
          { main: 'Never let a warm lead go cold', sub: 'Catch the signals in time' },
          { main: 'Organize my pipeline', sub: 'See every prospect at a glance' },
          { main: 'Convert more of my conversations', sub: 'Turn interest into clients' },
          { main: 'Save time on follow-up', sub: 'Know who to message and when' },
        ],
      },
      {
        id: 'p_goal_text',
        type: 'textarea',
        label: 'In 3 months, what would make this tool a no-brainer for you?',
        hint: 'Describe the outcome that would make you say "I can\'t work without this".',
        placeholder: 'Think about the result, not the feature...',
        required: false,
      },
    ],
  },
  // Step 7: Summary
  {
    id: 'summary',
    phase: 'Setup complete',
    title: 'You\'re ready to build a real pipeline.',
    subtitle: 'Knowing how you work is the first step to never losing a lead again.',
    questions: [],
  },
];

// Renvoie le bon jeu d'étapes selon le mode d'usage. Par défaut (mode non encore
// choisi, étapes 0→1) on retombe sur la version personnelle, dont les étapes
// partagées sont identiques en structure.
export function getQuestionnaireSteps(mode: UsageMode | null | undefined): QuestionnaireStep[] {
  return mode === 'professional' ? PRO_QUESTIONNAIRE_STEPS : QUESTIONNAIRE_STEPS;
}
