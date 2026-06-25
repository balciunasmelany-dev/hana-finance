export const FIXED_EXPENSES = {
  personal_ars: [
    { name: 'Psicóloga',        nameKo: '심리상담',    amount: 160000, category: 'health'    },
    { name: 'Carrefour',        nameKo: '마트',        amount: 120000, category: 'home'      },
    { name: 'Verdulería',       nameKo: '채소가게',    amount: 80000,  category: 'food'      },
    { name: 'Inglés (4 clases)',nameKo: '영어 수업',   amount: 72000,  category: 'education' },
    { name: 'Voley',            nameKo: '배구',        amount: 30000,  category: 'health'    },
    { name: 'Celular Tuenti',   nameKo: '휴대폰',      amount: 18000,  category: 'other'     },
    { name: 'Amazon Prime',     nameKo: '아마존 프라임',amount: 7863,  category: 'leisure'   },
  ],
  shared_ars: [
    { name: '½ Flow',           amount: 80000  },
    { name: '½ Alarma',         amount: 70069  },
    { name: '½ Naturgy',        amount: 48510  },
    { name: '½ Municipal',      amount: 33997  },
    { name: '½ Edenor',         amount: 15924  },
  ],
  usd: [
    { name: 'Netflix',  nameKo: '넷플릭스', amount: 22.28 },
    { name: 'Claude',   nameKo: '클로드',   amount: 20.00 },
    { name: 'Coursera', nameKo: '코세라',   amount: 30.00 },
    { name: 'HBO',      nameKo: 'HBO',      amount: 6.99  },
  ]
}

export const FINANCIAL_PROFILE = {
  salary_base_usd:         1500,
  salary_bonus_usd:        1600,
  salary_aguinaldo_usd:    2250,
  salary_day_range:        '29–31',
  weekly_budget_ars:       95000,
  monthly_saving_goal_usd: 500,
  emergency_fund_goal_usd: 3000,
  initial_savings_usd:     121,
  usd_subscriptions:       79.27,
  upcoming_dues: [
    { name: 'Go-cuota',   amount: 52633,  date: '2026-07-10' },
    { name: 'Monotributo', amount: 200000, date: '2026-07-31' },
  ]
}

export const CATEGORIES = [
  { id: 'transport', emoji: '🚗', labelEs: 'Transp.',  labelKo: '교통' },
  { id: 'food',      emoji: '🍱', labelEs: 'Comida',   labelKo: '음식' },
  { id: 'home',      emoji: '🏠', labelEs: 'Hogar',    labelKo: '생활' },
  { id: 'clothes',   emoji: '👗', labelEs: 'Ropa',     labelKo: '의류' },
  { id: 'health',    emoji: '💊', labelEs: 'Salud',    labelKo: '건강' },
  { id: 'leisure',   emoji: '🎉', labelEs: 'Ocio',     labelKo: '여가' },
  { id: 'education', emoji: '📚', labelEs: 'Educ.',    labelKo: '교육' },
  { id: 'other',     emoji: '❓', labelEs: 'Otro',     labelKo: '기타' },
]

export const IMPULSE_CATEGORIES = ['home', 'clothes', 'leisure']

export const MOTIVATIONAL_QUOTES = [
  { ko: '한 걸음씩',              es: 'Un paso a la vez' },
  { ko: '꿈을 향해',              es: 'Hacia el sueño' },
  { ko: '할 수 있어요',            es: 'Podés hacerlo' },
  { ko: '저축은 미래의 선물이에요', es: 'El ahorro es un regalo al futuro' },
  { ko: '오늘도 수고했어요',       es: 'Hoy también lo diste todo' },
  { ko: '여행은 최고의 교육이에요', es: 'Viajar es la mejor educación' },
]
