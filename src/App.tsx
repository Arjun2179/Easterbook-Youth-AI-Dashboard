import { useState } from 'react';
import './index.css';
import { useData } from './hooks/useData';
import type { Filters } from './hooks/useData';
import { useReveal } from './hooks/useReveal';
import { HighlightProvider, useHighlight } from './hooks/useHighlight';
import FilterPanel from './components/FilterPanel';
import KpiCards from './components/KpiCards';
import ChartCard from './components/ChartCard';
import {
  AreaChart, Area,
  BarChart, Bar,
  ScatterChart, Scatter,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const RELIANCE_COLORS: Record<string, string> = {
  overreliance: '#EF4444',
  appropriate: '#22C55E',
  underreliance: '#6B7280',
};
const RELIANCE_LABELS: Record<string, string> = {
  overreliance: 'Over-reliant',
  appropriate: 'Appropriate',
  underreliance: 'Under-reliant',
};
const CHART_H = 220;

const DEFAULT_FILTERS: Filters = {
  age: 'all',
  reliance: new Set(['overreliance', 'appropriate', 'underreliance']),
  dayRange: [1, 15],
};

function RevealSection({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`reveal ${className}`} style={style}>{children}</div>;
}

function RQHeader({ rqNum, question, color, bgColor }: { rqNum: string; question: string; color: string; bgColor: string }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="reveal span-full" style={{ paddingTop: 14 }}>
      <div className="section-header" style={{ borderLeft: `4px solid ${color}`, paddingLeft: 14, margin: '0 0 2px' }}>
        <span className="section-rq-num" style={{ background: bgColor, color }}>{rqNum}:</span>
        <span className="section-rq-question">{question}</span>
        <span className="section-line" style={{ background: color, opacity: 0.35 }} />
      </div>
    </div>
  );
}

function HighlightBanner() {
  const { reliance, ageGroup, clear } = useHighlight();
  if (!reliance && !ageGroup) return null;
  const parts: string[] = [];
  if (reliance) parts.push(RELIANCE_LABELS[reliance] || reliance);
  if (ageGroup) parts.push(`Age ${ageGroup}`);
  return (
    <div className="highlight-banner">
      <span style={{ fontSize: 11, color: '#6B7280' }}>Highlighting:</span>
      {parts.map(p => <span key={p} className="highlight-badge">{p}</span>)}
      <button onClick={clear} className="highlight-clear">Clear All</button>
    </div>
  );
}

function CascadeEffect({ stats }: { stats: { totalDailyPrompts: number; avgVerificationRate: number; avgEyeDryness: number; avgScreenTime: number } | null }) {
  const ref = useReveal<HTMLDivElement>();
  const prompts = stats?.totalDailyPrompts ?? 14119;
  const verification = stats?.avgVerificationRate ?? 56;
  const eyeDryness = stats?.avgEyeDryness ?? 7.1;
  const screenTime = stats?.avgScreenTime ?? 8.6;

  return (
    <div ref={ref} className="reveal span-full" style={{ marginTop: 12 }}>
      <div className="cascade-section">
        <div className="cascade-header">
          <div className="cascade-num">◆</div>
          <span className="cascade-title">Cross-RQ Impact Summary — The Compounding Cascade</span>
        </div>
        <div className="cascade-grid">
          <div className="cascade-tile" style={{ borderTopColor: '#1D4ED8' }}>
            <div className="cascade-icon">⚡</div>
            <div className="cascade-metric" style={{ color: '#1D4ED8' }}>{prompts.toLocaleString()}</div>
            <div className="cascade-metric-label">prompts / day (RQ1)</div>
            <div className="cascade-metric-desc">Total Daily AI Prompt Load</div>
          </div>
          <div className="cascade-tile" style={{ borderTopColor: '#D97706' }}>
            <div className="cascade-icon">✗</div>
            <div className="cascade-metric" style={{ color: '#EF4444' }}>{100 - verification}%</div>
            <div className="cascade-metric-label">outputs unverified (RQ2)</div>
            <div className="cascade-metric-desc">Students Skipping Verification</div>
          </div>
          <div className="cascade-tile" style={{ borderTopColor: '#DC2626' }}>
            <div className="cascade-icon">👁</div>
            <div className="cascade-metric" style={{ color: '#7C3AED' }}>{eyeDryness} / 10</div>
            <div className="cascade-metric-label">avg eye dryness (RQ3)</div>
            <div className="cascade-metric-desc">Clinical Concern Threshold: &gt;5/10</div>
          </div>
          <div className="cascade-tile" style={{ borderTopColor: '#7C3AED' }}>
            <div className="cascade-icon">⏱</div>
            <div className="cascade-metric" style={{ color: '#D97706' }}>{screenTime} hrs</div>
            <div className="cascade-metric-label">avg screen time / day (RQ3)</div>
            <div className="cascade-metric-desc">Risk Threshold: &gt;5 hrs/day</div>
          </div>
        </div>
        <div className="cascade-narrative">
          <strong>The cascade mechanism:</strong> The data across all five RQs reveals a compounding pattern. High-volume AI use (RQ1: 14,119 prompts/day) trains students to rely on AI as a cognitive shortcut, directly lowering their verification effort (RQ2: 44% unverified, r = −0.638 with error rate). Extended sessions drive physical symptoms (RQ3: eye dryness r = 0.954 with screen time). Over-reliant students lose cognitive independence faster — their latency gap is +65s vs. +28s for under-reliant peers, and 68.4% accept AI outputs without verification (RQ4). And because AI fulfills social-emotional needs (RQ5: mood check-ins, serious topics, PII sharing), students delay seeking human support, deepening attachment. Without a systematic intervention — session limits, real-time verification prompts, and educator dashboards — the cascade will amplify as AI access expands.
        </div>
        <div className="citations-strip">
          Pew Research Center (2025) &middot; Common Sense Media (2025) &middot; APA (2025) &middot; Zhang et al. (2024) &middot; Lyell &amp; Coiera (2017) &middot; Pitts et al. (2025) &middot; Rajani et al. (2022) &middot; Almutairi et al. (2024) &middot; Norwegian NIPH (2024) &middot; Zhai et al. (2024) &middot; Clark (2025)
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const { data, loading } = useData(filters);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', flexDirection: 'column', gap: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid #E5E7EB', borderTop: '3px solid #1D4ED8',
          animation: 'spin 0.9s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#6B7280', fontSize: '0.88rem' }}>Loading dashboard…</div>
      </div>
    );
  }

  const rq1Color = '#1D4ED8'; const rq1Bg = '#EFF6FF';
  const rq2Color = '#D97706'; const rq2Bg = '#FFFBEB';
  const rq3Color = '#DC2626'; const rq3Bg = '#FEF2F2';
  const rq4Color = '#7C3AED'; const rq4Bg = '#F5F3FF';
  const rq5Color = '#DB2777'; const rq5Bg = '#FDF2F8';

  // RQ1 transforms
  const dailyData = data.dailyTotals.map(d => ({ ...d, label: `D${d.day}` }));
  const relianceTotal = data.relianceDist.reduce((s, d) => s + d.count, 0);
  const pieData = data.relianceDist.map(d => ({
    name: d.label, value: d.count,
    pct: relianceTotal > 0 ? Math.round(d.count / relianceTotal * 100) : 0,
    fill: RELIANCE_COLORS[d.key] ?? '#94A3B8',
  }));

  // RQ2 transforms
  const waffleData = data.waffle ? [{ name: 'Outputs', Verified: data.waffle.verified, Unverified: data.waffle.unverified }] : [];
  const scatterVerify = ['overreliance', 'appropriate', 'underreliance'].map(r => ({
    key: r, label: RELIANCE_LABELS[r], color: RELIANCE_COLORS[r],
    pts: data.verifyVsError.filter(p => p.reliance === r),
  }));

  // RQ4 transforms
  const acceptData = data.cognitiveByReliance.map(d => ({
    group: d.group,
    'Accepts Unverified': parseFloat((d.acceptWithoutVerify * 100).toFixed(1)),
    'Verifies First': parseFloat(((1 - d.acceptWithoutVerify) * 100).toFixed(1)),
  }));

  // RQ5 transforms
  const socialRiskData = data.socialByReliance.map(d => ({
    group: d.group,
    'Serious Topics (%)': d.seriousTopics,
    'PII Shared (%)': d.piiShared,
    'Harmful Exposure': Math.round(d.harmfulExposure * 10),
  }));
  const emotionalData = data.socialByReliance.map(d => ({
    group: d.group, 'Mood Check-ins': d.moodCheckins, 'Emotional Support': d.emotionalSupport,
  }));
  const scatterScreen = ['overreliance', 'appropriate', 'underreliance'].map(r => ({
    key: r, label: RELIANCE_LABELS[r], color: RELIANCE_COLORS[r],
    pts: data.screenVsEye.filter(p => p.reliance === r),
  }));

  return (
    <div className="dashboard">
      <HighlightBanner />

      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-title">Eastbrook Youth AI Well-Being Initiative</span>
          <div className="dash-subtitle">
            AS-IS Analytics Dashboard &middot; Week 7 Observation (Days 1–15) &middot; n = 400 Students &middot;
            Saint Louis University MIF 2026 &middot; Dr. Tatiana Cardona
          </div>
        </div>
        <div className="dataset-badge">AS-IS &middot; DAYS 1–15 &middot; 400 STUDENTS &middot; 6,000 ROWS</div>
      </header>

      <FilterPanel filters={filters} onChange={setFilters} />

      {data.heroStats && (
        <RevealSection className="dash-grid grid-4 section-gap">
          <KpiCards stats={data.heroStats} />
        </RevealSection>
      )}

      {/* ── RQ1 ─────────────────────────────────────────── */}
      <RQHeader rqNum="RQ1" question="How intensively are students using AI tools, and does usage pattern differ by reliance type and age?" color={rq1Color} bgColor={rq1Bg} />
      <RevealSection className="dash-grid grid-3 section-gap">

        <ChartCard num="01" title="Daily AI Prompt Volume" subtitle="Total prompts per day · 400 students · Days 1–15" color={rq1Color}
          insight="Sustained ~14,119 prompts/day. Pew (2025): 64% of U.S. teens use AI chatbots daily — Eastbrook mirrors a documented generational shift.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Total Prompts', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown) => [(v as number).toLocaleString(), 'Total Prompts']} labelFormatter={l => `Day ${String(l).replace('D', '')}`} />
                <Area type="monotone" dataKey="totalPrompts" stroke={rq1Color} fill="#DBEAFE" strokeWidth={2} name="Total Prompts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="02" title="Dominant Reliance Profile per Student" subtitle="Each student's most frequent AI reliance pattern · n = 400" color={rq1Color}
          insight="92.5% appropriate · 5.8% over-reliant (23 students) — highest-priority intervention target driving all downstream risk indicators.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, pct }: { name: string; pct: number }) => `${name}: ${pct}%`} labelLine={true}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${v} students`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="03" title="Screen Time & Continuous Use by Age Group" subtitle="Avg daily screen time and longest unbroken session · by age cohort" color={rq1Color}
          insight="Both groups exceed WHO 2-hr/day limit by 4×. Ages 15–17 show higher exposure — a direct physical risk trigger (Almutairi et al., 2024).">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={data.ageComparison} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Age Group', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}h`}
                  label={{ value: 'Hours / Day', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)} hrs`, String(name)]} labelFormatter={l => `Age Group: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="avgScreenTime" name="Screen Time (hrs/day)" fill={rq1Color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgContinuousUseHrs" name="Continuous Use (hrs)" fill="#93C5FD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </RevealSection>

      {/* ── RQ2 ─────────────────────────────────────────── */}
      <RQHeader rqNum="RQ2" question="How often do students verify AI outputs, and how does verification behavior correlate with downstream error rates?" color={rq2Color} bgColor={rq2Bg} />
      <RevealSection className="dash-grid grid-3 section-gap">

        <ChartCard num="04" title="AI Output Verification Rate" subtitle="Verified vs. unverified AI outputs · 6,000 student-days" color={rq2Color}
          insight="Only 56% of outputs verified — 44% accepted unchecked. Zhang et al. (2024): unverified AI use negatively impacts learning efficiency.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart layout="vertical" data={waffleData} margin={{ top: 4, right: 40, left: 10, bottom: 40 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Percentage of AI Outputs (%)', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={55} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Output type: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Verified" stackId="a" fill="#22C55E" name="Verified ✓" />
                <Bar dataKey="Unverified" stackId="a" fill="#EF4444" name="Unverified ✗" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="05" title="Verification Rate by Task Complexity" subtitle="How fact-checking behavior shifts as difficulty increases" color={rq2Color}
          insight="Verification drops 25.6 pp from low (66%) to high complexity (40.4%) — students skip fact-checking exactly when stakes are highest.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <AreaChart data={data.slope} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Task Complexity Level', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown) => [`${(v as number).toFixed(1)}%`, 'Verification Rate']} labelFormatter={l => `Complexity: ${l}`} />
                <Area type="monotone" dataKey="verificationRate" stroke={rq2Color} fill="#FEF3C7" strokeWidth={2} name="Verification Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="06" title="Verification Rate vs. Error Rate" subtitle="Per student-day · r = −0.638 · n = 400 sample points" color={rq2Color}
          insight="Strong inverse relationship (r = −0.638): more verification → fewer errors. Over-reliant students cluster in low-verification, high-error quadrant.">
          <div style={{ padding: '12px 16px 8px' }}>
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: rq2Color, paddingRight: 8, marginBottom: -4 }}>r = −0.638</div>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <ScatterChart margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis type="number" dataKey="x" name="Verification Rate" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Verification Rate (%)', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis type="number" dataKey="y" name="Error Rate"
                  tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}%`, String(name)]} labelFormatter={() => 'Student-Day Observation'} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                {scatterVerify.map(s => (
                  <Scatter key={s.key} name={s.label} data={s.pts} fill={s.color} opacity={0.7} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </RevealSection>

      {/* ── RQ3 ─────────────────────────────────────────── */}
      <RQHeader rqNum="RQ3" question="What physical discomfort symptoms are students experiencing, and how are they linked to AI session patterns?" color={rq3Color} bgColor={rq3Bg} />
      <RevealSection className="dash-grid grid-2 section-gap">

        <ChartCard num="07" title="Physical Symptoms by Continuous Session Duration" subtitle="Avg eye dryness, neck pain & headaches by session length" color={rq3Color}
          insight="Sessions >180 min show 3.3× higher eye dryness (7.8 vs. 2.4/10). Session limits are the most controllable physical health lever.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={data.sessionBuckets} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Session Duration', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, String(name)]} labelFormatter={l => `Session length: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="eyeDryness" name="Eye Dryness (0–10)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                <Bar dataKey="neckPain" name="Neck Pain (0–10)" fill={rq3Color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="headaches" name="Headaches/week" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="08" title="Physical Symptoms by Number of Breaks Taken" subtitle="Does break frequency reduce physical symptom severity?" color={rq3Color}
          insight="Zero-break sessions show the highest symptom burden. Even one break produces measurable symptom reduction across all three indicators.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={data.breaksBuckets} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Breaks Taken', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, String(name)]} labelFormatter={l => `Breaks: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="eyeDryness" name="Eye Dryness (0–10)" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                <Bar dataKey="neckPain" name="Neck Pain (0–10)" fill={rq3Color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="headaches" name="Headaches/week" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </RevealSection>
      <RevealSection className="dash-grid section-gap" style={{ gridTemplateColumns: '1fr' }}>
        <ChartCard num="09" title="Screen Time vs. Eye Dryness Score" subtitle="Per student-day · r = 0.954 · n = 500 sample points" color={rq3Color}
          insight="Near-perfect correlation (r = 0.954) — screen time is the strongest single predictor of eye dryness. Eastbrook avg 8.6 hrs/day far exceeds the 5 hr/day clinical risk threshold.">
          <div style={{ padding: '12px 16px 8px' }}>
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: rq3Color, paddingRight: 8, marginBottom: -4 }}>r = 0.954</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 4, right: 16, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis type="number" dataKey="x" name="Screen Time" domain={[0, 16]}
                  tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}h`}
                  label={{ value: 'Screen Time (hrs/day)', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis type="number" dataKey="y" name="Eye Dryness" domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Eye Dryness (0–10)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(2)}`, name as string]} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                {scatterScreen.map(s => (
                  <Scatter key={s.key} name={s.label} data={s.pts} fill={s.color} opacity={0.6} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </RevealSection>

      {/* ── RQ4 ─────────────────────────────────────────── */}
      <RQHeader rqNum="RQ4" question="How does AI over-reliance affect students' cognitive independence, planning skills, and decision-making ability?" color={rq4Color} bgColor={rq4Bg} />
      <RevealSection className="dash-grid grid-2 section-gap">

        <ChartCard num="10" title="Decision Latency: With vs. Without AI" subtitle="Avg seconds to decide · grouped by dominant reliance type" color={rq4Color}
          insight="Over-reliant students take 65s longer to decide without AI vs. +28s for under-reliant — measurable erosion of independent reasoning (Pitts et al., 2025).">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={data.latencyComparison} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}s`}
                  label={{ value: 'Decision Time (seconds)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v} seconds`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="withAI" name="With AI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withoutAI" name="Without AI" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="11" title="Cognitive Skill Indicators by Reliance Type" subtitle="Planning skill and AI-free confidence · normalized 0–1 scale" color={rq4Color}
          insight="Over-reliant: planning skill 0.47 vs. 0.60 (appropriate). Both indicators confirm measurable erosion of cognitive independence.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={data.cognitiveByReliance} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} domain={[0, 5]}
                  label={{ value: 'Score (0–5 scale)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(2)}`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="planningSkill" name="Planning Skill" fill={rq4Color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="confidenceWithoutAI" name="Confidence w/o AI" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </RevealSection>
      <RevealSection className="dash-grid section-gap" style={{ gridTemplateColumns: '1fr' }}>
        <ChartCard num="12" title="Output Acceptance Without Verification by Reliance Type" subtitle="% of AI outputs accepted unverified vs. verified first · by reliance group" color={rq4Color}
          insight="Over-reliant students accept 68.4% of outputs without verification vs. 0% in appropriate/under-reliant groups — the direct mechanism of cognitive erosion (Lyell & Coiera, 2017).">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={acceptData} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`} domain={[0, 100]}
                  label={{ value: '% of AI Outputs', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Accepts Unverified" stackId="a" fill="#EF4444" />
                <Bar dataKey="Verifies First" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </RevealSection>

      {/* ── RQ5 ─────────────────────────────────────────── */}
      <RQHeader rqNum="RQ5" question="How are students using AI for social and emotional support, and what risks does this create?" color={rq5Color} bgColor={rq5Bg} />
      <RevealSection className="dash-grid grid-2 section-gap">

        <ChartCard num="13" title="Social & Emotional AI Behavior Landscape" subtitle="Five key social-emotional indicators · frequency per student-day" color={rq5Color}
          insight="AI is woven into students' emotional lives daily. APA (2025): adolescents are less equipped to distinguish AI-simulated empathy from genuine human connection.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart layout="vertical" data={data.packedBubble} margin={{ top: 4, right: 16, left: 8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Frequency / Prevalence', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} width={140} />
                <Tooltip formatter={(v: unknown, _n: unknown, props: { payload?: { unit?: string; description?: string } }) => [`${v} ${props.payload?.unit ?? ''}`, props.payload?.description ?? 'Social indicator']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.packedBubble.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard num="14" title="Social Risk Behaviors by Reliance Type" subtitle="Serious topics, PII sharing & harmful exposure · by reliance group" color={rq5Color}
          insight="Over-reliant students show higher rates of all three risk behaviors. Clark (2025): 32% of AI therapeutic interactions endorsed harmful proposals when tested.">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={socialRiskData} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: '% Students / Avg per Day', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Serious Topics (%)" fill="#9333EA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PII Shared (%)" fill={rq3Color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Harmful Exposure" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </RevealSection>
      <RevealSection className="dash-grid section-gap" style={{ gridTemplateColumns: '1fr' }}>
        <ChartCard num="15" title="Emotional AI Usage: Mood Check-ins & Support by Reliance Type" subtitle="Average daily emotional AI interactions stacked by type · per reliance group" color={rq5Color}
          insight="Over-reliant students turn to AI for emotional regulation more often, potentially displacing peer relationships critical to healthy adolescent development (Common Sense Media, 2025).">
          <div style={{ padding: '12px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={emotionalData} margin={{ top: 4, right: 8, left: 12, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -26, fill: '#9CA3AF', fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }}
                  label={{ value: 'Avg Daily Interactions', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 9, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(2)} /day`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Mood Check-ins" stackId="a" fill="#D97706" />
                <Bar dataKey="Emotional Support" stackId="a" fill={rq5Color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </RevealSection>

      <CascadeEffect stats={data.heroStats} />

      <footer className="dash-footer">
        Eastbrook Youth AI Well-Being Study &middot; AS-IS Phase &middot; Days 1–15 &middot; 400 Students &middot; 6,000 Student-Day Observations<br />
        Dataset: synthetic_eastbrook_user_day.csv &middot; Saint Louis University MIF 2026 &middot; Dr. Tatiana Cardona<br />
        Team: Tejaswini (PM) · Pavani (BA) · Vardhan (Data Analyst) · Vinay (Technical Lead) · Arjun (Documentation Lead)
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HighlightProvider>
      <DashboardContent />
    </HighlightProvider>
  );
}
