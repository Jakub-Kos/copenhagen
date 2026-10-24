import { useT } from '@/i18n/useT'

const Dot = ({ color, ring }: { color: string; ring?: boolean }) => (
  <span
    className="inline-block size-2.5 rounded-full align-middle"
    style={{ background: color, boxShadow: ring ? '0 0 0 2px var(--color-mustsee)' : undefined }}
  />
)

/** One quiet line explaining marker and line colours. */
export function MapLegend() {
  const { t } = useT()
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span><Dot color="var(--color-indoor)" /> {t('legendIndoor')}</span>
      <span><Dot color="var(--color-covered)" /> {t('legendCovered')}</span>
      <span><Dot color="var(--color-outdoor)" /> {t('legendOutdoor')}</span>
      <span><Dot color="#fff" ring /> {t('legendMust')}</span>
      <span className="font-semibold">
        <span style={{ color: '#008d41' }}>M1</span> <span style={{ color: '#d4a600' }}>M2</span>{' '}
        <span style={{ color: '#ff0a0a' }}>M3</span> <span style={{ color: '#009cd3' }}>M4</span> · <span className="text-slate-600 dark:text-slate-300">S-tog</span>
      </span>
      <span>
        <span className="inline-grid size-4 place-items-center rounded-full bg-[#0e7490] align-middle text-[7px] font-bold text-white">WC</span> {t('legendToilet')}
      </span>
      <span><Dot color="#92400e" /> {t('legendBench')}</span>
    </p>
  )
}
