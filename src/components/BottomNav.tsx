import { useTranslation } from 'react-i18next'

type Tab = 'home' | 'expenses' | 'savings' | 'calculator' | 'settings'

const NAV_ITEMS: { id: Tab; emoji: string; ko: string }[] = [
  { id: 'home',       emoji: '🏠', ko: '홈'  },
  { id: 'expenses',   emoji: '📝', ko: '지출' },
  { id: 'savings',    emoji: '🌸', ko: '저축' },
  { id: 'calculator', emoji: '🧮', ko: '환율' },
  { id: 'settings',   emoji: '⚙️', ko: '설정' },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { t, i18n } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-bottom"
      style={{ borderColor: '#F0E8D5', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.emoji}</span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: active === item.id ? 700 : 400,
                color: active === item.id ? '#1A7A6E' : '#9E8872',
                lineHeight: 1.2,
              }}
            >
              {i18n.language === 'ko' ? item.ko : t(`nav.${item.id}`)}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
