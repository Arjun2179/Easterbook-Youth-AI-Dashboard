import { useEffect, useRef, useState } from 'react';
import type { HeroStats } from '../hooks/useData';

function AnimNum({ target, suffix = '', decimals = 0, color }: { target: number; suffix?: string; decimals?: number; color: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => { started.current = false; setVal(0); }, [target]);

  useEffect(() => {
    if (started.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        obs.disconnect();
        const t0 = performance.now();
        const dur = 1200;
        function tick(now: number) {
          const p = Math.min((now - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(target * ease);
          if (p < 1) requestAnimationFrame(tick);
          else setVal(target);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span ref={ref} className="kpi-value" style={{ color }}>{display}{suffix}</span>;
}

const KPIS = [
  {
    key: 'totalDailyPrompts' as const,
    label: 'Daily AI Prompts',
    suffix: '',
    decimals: 0,
    color: '#1D4ED8',
    borderColor: '#1D4ED8',
    sub: 'total per day across all students',
    benchmark: 'Pew 2025: 64% of U.S. teens use AI chatbots daily',
  },
  {
    key: 'avgScreenTime' as const,
    label: 'Avg Screen Time',
    suffix: ' hrs',
    decimals: 1,
    color: '#DC2626',
    borderColor: '#DC2626',
    sub: 'per student per day',
    benchmark: 'Risk threshold: >5 hrs/day · Almutairi et al. 2024',
  },
  {
    key: 'avgVerificationRate' as const,
    label: 'Verification Rate',
    suffix: '%',
    decimals: 0,
    color: '#D97706',
    borderColor: '#D97706',
    sub: 'of AI outputs independently fact-checked',
    benchmark: 'Concern: <60% verification · Zhang et al. 2024',
  },
  {
    key: 'avgEyeDryness' as const,
    label: 'Eye Dryness Score',
    suffix: ' / 10',
    decimals: 1,
    color: '#7C3AED',
    borderColor: '#7C3AED',
    sub: 'average severity (clinical scale)',
    benchmark: 'Clinical concern: >5/10 · Rajani et al. 2022',
  },
] as const;

export default function KpiCards({ stats }: { stats: HeroStats }) {
  return (
    <>
      {KPIS.map((k) => (
        <div key={k.key} className="card kpi-card" style={{ borderTopColor: k.borderColor }}>
          <span className="kpi-label">{k.label}</span>
          <AnimNum target={stats[k.key]} suffix={k.suffix} decimals={k.decimals} color={k.color} />
          <span className="kpi-sub">{k.sub}</span>
          <span className="kpi-benchmark">{k.benchmark}</span>
        </div>
      ))}
    </>
  );
}
