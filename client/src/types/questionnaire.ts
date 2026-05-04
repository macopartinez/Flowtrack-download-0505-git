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
  // Step 0: Warning
  {
    id: 'warning',
    phase: 'Before we begin',
    title: "This questionnaire is not a surveillance tool",
    subtitle: "It's designed to help you understand yourself — and better understand your relationships.",
    questions: [],
    showConsent: true,
    warningBoxes: [
      {
        type: 'warning',
        title: 'Our approach',
        content: "What this tool does: it guides you in self-reflection, using social media signals as a starting point.\n\nWhat it doesn't do: it doesn't tell you \"who blocked you\" for the purpose of confrontation or control.\n\nWarning: if you're in a state of intense distress, please talk to a trusted person or professional first."
      },
      {
        type: 'success',
        title: 'Our philosophy',
        content: "When a connection breaks, the first question isn't \"why them?\" — it's \"who am I in this relationship?\""
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
  // Step 2: Demographics (NEW)
  {
    id: 'demographics',
    phase: 'Step 2 — About you',
    title: 'A few details to personalize your experience',
    subtitle: 'This helps us provide more relevant insights.',
    questions: [
      {
        id: 'gender',
        type: 'options',
        label: 'How do you identify?',
        required: true,
        options: [
          'Woman',
          'Man',
          'Non-binary',
          'Prefer not to say'
        ]
      },
      {
        id: 'age_range',
        type: 'options',
        label: 'What is your age range?',
        required: true,
        options: [
          '18-24',
          '25-34',
          '35-44',
          '45-54',
          '55+'
        ]
      },
      {
        id: 'continent',
        type: 'options',
        label: 'Which continent are you living in?',
        required: true,
        options: [
          'Europe',
          'North America',
          'South America',
          'Asia',
          'Africa',
          'Oceania'
        ]
      },
      {
        id: 'country',
        type: 'country',
        label: 'Which country are you living in?',
        required: true
      }
    ]
  },
  // Step 3: Relationship profile
  {
    id: 'profile',
    phase: 'Phase 1 — You',
    title: 'How do you position yourself in your relationships?',
    subtitle: 'Before talking about the other person, let\'s take a moment for you.',
    questions: [
      {
        id: 'q1',
        type: 'options',
        label: 'In general, how do you experience your close relationships?',
        required: true,
        options: [
          { main: 'With a lot of investment', sub: 'I give a lot, sometimes too much' },
          { main: 'With some distance', sub: 'I find it hard to open up easily' },
          { main: 'In a balanced way', sub: 'I adapt depending on the person' },
          { main: 'With a lot of anxiety', sub: 'The fear of losing people is often present' }
        ]
      },
      {
        id: 'q2',
        type: 'options',
        label: 'When facing conflict in a relationship, you tend to...',
        required: true,
        options: [
          'Approach the other person to talk about it directly',
          'Take a step back and wait',
          'Ruminate without talking about it',
          'Avoid the subject to preserve peace'
        ]
      }
    ]
  },
  // Step 3: Pattern repetition (NEW)
  {
    id: 'pattern',
    phase: 'Phase 1.5 — Pattern recognition',
    title: 'Is this the first time you\'ve experienced this kind of disconnection?',
    subtitle: 'Understanding patterns helps us understand ourselves.',
    questions: [
      {
        id: 'q2_pattern',
        type: 'options',
        label: 'Has this happened before?',
        required: true,
        options: [
          { main: 'Yes, this feels completely new to me', sub: 'This is the first time I experience something like this' },
          { main: 'No — I\'ve been through something similar before', sub: 'I recognize this feeling' },
          { main: 'Actually, this happens to me more often than I\'d like to admit', sub: 'It\'s a recurring pattern in my relationships' },
          { main: 'I\'m not sure', sub: 'I haven\'t thought about it this way' }
        ]
      }
    ]
  },
  // Step 4: The relationship
  {
    id: 'relation',
    phase: 'Phase 2 — The relationship',
    title: 'Let\'s talk about this particular relationship',
    subtitle: 'No names. Only what you feel.',
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
        label: 'Did this relationship have a place in your real life — beyond the virtual?',
        required: true,
        options: [
          { main: 'Only online', sub: 'We never met or interacted outside social media' },
          { main: 'Mostly virtual', sub: 'We knew each other in real life but rarely connected offline' },
          { main: 'Balanced', sub: 'Both online and offline interactions were important' },
          { main: 'Primarily real-life', sub: 'Social media was just a way to stay in touch' },
          { main: 'Very central to my life', sub: 'This person was deeply present in my daily reality' }
        ]
      },
      {
        id: 'q5',
        type: 'options',
        label: 'Before this social media signal, had you felt something change?',
        required: true,
        options: [
          'Yes, I had sensed a cooling off',
          'A little, but I didn\'t want to believe it',
          'No, it came as a complete surprise',
          'I\'m not sure'
        ]
      },
      {
        id: 'q5_last_interaction',
        type: 'options',
        label: 'What was the last real interaction you had with this person?',
        required: true,
        options: [
          { main: 'A genuine conversation — things seemed fine', sub: 'Nothing indicated a problem' },
          { main: 'A tense or unresolved moment', sub: 'There was friction we didn\'t address' },
          { main: 'Something I said or did that I regret', sub: 'I can pinpoint a specific moment' },
          { main: 'I honestly can\'t remember — we had drifted apart already', sub: 'The distance was already there' },
          { main: 'A moment of silence that neither of us broke', sub: 'We both let it fade' }
        ]
      }
    ]
  },
  // Step 5: Introspection
  {
    id: 'introspection',
    phase: 'Phase 3 — The difficult question',
    title: 'Who were you in this relationship?',
    subtitle: 'The most courageous part. There\'s no right or wrong answer.',
    questions: [
      {
        id: 'q6_text',
        type: 'textarea',
        label: 'Were there moments when you might have hurt this person — even unintentionally?',
        hint: 'A word said too quickly, a forgotten moment, repeated unavailability...',
        placeholder: 'Think out loud here, without judging yourself...',
        required: false
      },
      {
        id: 'q6',
        type: 'options',
        label: 'Do you tend to put your needs before the other person\'s?',
        required: true,
        options: [
          'Often, it\'s my usual way of functioning',
          'Sometimes, without always being aware of it',
          'Rarely — I tended to forget myself instead',
          'I don\'t really know'
        ]
      },
      {
        id: 'q7_text',
        type: 'textarea',
        label: 'If this person could speak to you freely, what might they have told you?',
        hint: 'Try to put yourself in their shoes, with honesty.',
        placeholder: 'It\'s not easy. But this is where understanding begins...',
        required: false
      },
      {
        id: 'q6_emotional_debt',
        type: 'textarea',
        label: 'Is there something you never said to this person that you wish you had?',
        hint: 'This stays between you and Waler...',
        placeholder: 'Take your time. This is a safe space...',
        required: false
      },
      {
        id: 'q6_responsibility',
        type: 'options',
        label: 'On a scale of 1 to 5, how much do you feel responsible for what happened?',
        required: true,
        options: [
          { main: '1 — Not at all', sub: 'I don\'t see what I could have done differently' },
          { main: '2 — Maybe a little', sub: 'But mostly it was their choice' },
          { main: '3 — We both played a part', sub: 'It takes two in a relationship' },
          { main: '4 — I could have done better', sub: 'Looking back, I see my mistakes' },
          { main: '5 — I know exactly what I did', sub: 'And I carry it' }
        ]
      }
    ]
  },
  // Step 6: The signal
  {
    id: 'signal',
    phase: 'Phase 4 — The received signal',
    title: 'The unfollow as a message',
    subtitle: 'A virtual gesture that often says something real. Let\'s try to understand it without dramatizing.',
    questions: [
      {
        id: 'q7',
        type: 'options',
        label: 'What does this gesture represent to you?',
        required: true,
        options: [
          { main: 'A definitive rejection', sub: 'I experience it as a total and irreversible break' },
          { main: 'A need for temporary distance', sub: 'This person may need space' },
          { main: 'A message I didn\'t know how to read before', sub: 'The signal of a tension that already existed' },
          { main: 'I don\'t know yet', sub: 'That\'s why I\'m doing this questionnaire' }
        ]
      },
      {
        id: 'q8',
        type: 'options',
        label: 'How did you react internally when you discovered it?',
        required: true,
        options: [
          { main: 'Anger or feeling of injustice', sub: 'This feels unfair to me' },
          { main: 'Sadness and pain', sub: 'It hurts deeply' },
          { main: 'Confusion or incomprehension', sub: 'I don\'t understand why' },
          { main: 'Relief mixed with pain', sub: 'Part of me knew this was coming' },
          { main: 'Several of these emotions at once', sub: 'It\'s complicated and layered' }
        ]
      }
    ]
  },
  // Step 8: The Future (NEW PHASE)
  {
    id: 'future',
    phase: 'Phase 5 — The future',
    title: 'What do you hope happens next with this person?',
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
          { main: 'I want to reach out but I don\'t know how', sub: 'I\'m stuck between wanting and fearing' },
          { main: 'I want to understand before I decide anything', sub: 'Clarity first, action later' }
        ]
      },
      {
        id: 'q9_future_self',
        type: 'textarea',
        label: 'What kind of person do you want to be in your next close relationship?',
        hint: 'Take your time. This answer is for you, not for them.',
        placeholder: 'Think about the version of yourself you want to become...',
        required: false
      },
      {
        id: 'q9_reflection_frequency',
        type: 'options',
        label: 'How often do you reflect on your role in relationship difficulties?',
        required: true,
        options: [
          'Rarely — I tend to focus on what others did',
          'Sometimes — when things get bad enough',
          'Often — I\'m always questioning myself',
          'Almost never — I prefer to move forward without looking back'
        ]
      }
    ]
  },
  // Step 9: Engagement (NEW - before conversion wall)
  {
    id: 'engagement',
    phase: 'One last question',
    title: 'What brought you here today?',
    subtitle: 'Understanding your motivation helps us serve you better.',
    questions: [
      {
        id: 'q10_motivation',
        type: 'options',
        label: 'Why did you start this questionnaire?',
        required: true,
        options: [
          { main: 'I just noticed someone close unfollowed or blocked me', sub: 'This is fresh and painful' },
          { main: 'I\'ve been feeling disconnected from someone for a while', sub: 'The distance has been growing' },
          { main: 'I want to understand my patterns in relationships', sub: 'I\'m ready to look at myself honestly' },
          { main: 'A coach or therapist suggested this tool', sub: 'I\'m working on myself with support' },
          { main: 'I\'m just curious about what this is', sub: 'Exploring without specific urgency' }
        ]
      }
    ]
  },
  // Step 10: Summary
  {
    id: 'summary',
    phase: 'Complete reflection',
    title: 'Thank you for this courage.',
    subtitle: 'Asking yourself these questions honestly is one of the most mature acts a human being can do.',
    questions: []
  }
];
