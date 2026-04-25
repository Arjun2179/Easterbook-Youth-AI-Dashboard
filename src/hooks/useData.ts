import { useState, useEffect, useMemo } from 'react';
import { computeFromRows } from '../shared/analyticsCore.js';

export type AgeFilter = 'all' | '13-14' | '15-17';

export interface Filters {
  age: AgeFilter;
  reliance: Set<string>;
  dayRange: [number, number];
}

export interface HeroStats {
  totalDailyPrompts: number;
  avgScreenTime: number;
  avgVerificationRate: number;
  avgEyeDryness: number;
}

export interface DailyTotal {
  day: number;
  totalPrompts: number;
  avgPrompts: number;
  avgVerification: number;
}

export interface WaffleData {
  verified: number;
  unverified: number;
}

export interface SlopePoint {
  complexity: number;
  label: string;
  verificationRate: number;
}

export interface SessionBucket {
  label: string;
  eyeDryness: number;
  neckPain: number;
  headaches: number;
  count: number;
}

export interface BreaksBucket {
  label: string;
  eyeDryness: number;
  neckPain: number;
  headaches: number;
  count: number;
}

export interface LatencyPoint {
  group: string;
  key: string;
  withAI: number;
  withoutAI: number;
  gap: number;
}

export interface CognitiveByReliance {
  group: string;
  key: string;
  planningSkill: number;
  confidenceWithoutAI: number;
  errorRate: number;
  acceptWithoutVerify: number;
}

export interface SocialByReliance {
  group: string;
  key: string;
  moodCheckins: number;
  emotionalSupport: number;
  socialMessaging: number;
  seriousTopics: number;
  piiShared: number;
  harmfulExposure: number;
}

export interface RelianceDistItem {
  label: string;
  key: string;
  count: number;
}

export interface AgeComparisonItem {
  group: string;
  ageKey: string;
  avgScreenTime: number;
  avgContinuousUseHrs: number;
  avgPromptsPerDay: number;
  count: number;
}

export interface BubbleItem {
  label: string;
  value: number;
  unit: string;
  description: string;
  color: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  reliance?: string;
}

export interface AppData {
  heroStats: HeroStats | null;
  dailyTotals: DailyTotal[];
  waffle: WaffleData | null;
  slope: SlopePoint[];
  sessionBuckets: SessionBucket[];
  breaksBuckets: BreaksBucket[];
  latencyComparison: LatencyPoint[];
  cognitiveByReliance: CognitiveByReliance[];
  socialByReliance: SocialByReliance[];
  relianceDist: RelianceDistItem[];
  ageComparison: AgeComparisonItem[];
  packedBubble: BubbleItem[];
  screenVsEye: ScatterPoint[];
  verifyVsError: ScatterPoint[];
}

interface RawRow {
  user_id: number;
  day: number;
  reliance_type: string;
  age_group: string;
  ai_prompts_per_day: number;
  screen_time_hours: number;
  verification_rate: number;
  eye_dryness_score: number;
  neck_pain_score: number;
  verification_complexity: number;
  continuous_use_minutes: number;
  ai_for_social_messages: number;
  serious_topics_with_ai: number;
  pii_shared: number;
  mood_checkins: number;
  emotional_support_requests: number;
  harmful_exposure_count: number;
  confidence_without_ai: number;
  ai_reliance_baseline: number;
  decision_latency_with_ai_sec: number;
  decision_latency_without_ai_sec: number;
  headaches_per_week: number;
  accept_without_verification: number;
  planning_skill: number;
  error_rate: number;
  breaks_taken: number;
}

const BASE_URL = import.meta.env.BASE_URL ?? '/';

async function fetchJson<T>(path: string): Promise<T> {
  const normalized = BASE_URL.replace(/\/$/, '') + path;
  const res = await fetch(normalized);
  return res.json() as Promise<T>;
}

function parseRawRows(data: { cols: string[]; rows: unknown[][] }): RawRow[] {
  const { cols, rows } = data;
  return rows.map((r) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = r[i]; });
    return obj as unknown as RawRow;
  });
}

function filtersAreDefault(f: Filters): boolean {
  return f.age === 'all' && (f.reliance.size === 3 || f.reliance.size === 0) && f.dayRange[0] <= 1 && f.dayRange[1] >= 15;
}

interface BaseStaticData {
  heroStats: HeroStats;
  dailyTotals: DailyTotal[];
  waffle: WaffleData;
  slope: SlopePoint[];
  sessionBuckets: SessionBucket[];
  breaksBuckets: BreaksBucket[];
  latencyComparison: LatencyPoint[];
  cognitiveByReliance: CognitiveByReliance[];
  socialByReliance: SocialByReliance[];
  relianceDist: RelianceDistItem[];
  ageComparison: AgeComparisonItem[];
  packedBubble: BubbleItem[];
  screenVsEye: ScatterPoint[];
  verifyVsError: ScatterPoint[];
}

type AgeFilteredMap = Record<string, BaseStaticData>;

export function useData(filters: Filters): { data: AppData; loading: boolean } {
  const [baseData, setBaseData] = useState<BaseStaticData | null>(null);
  const [ageFiltered, setAgeFiltered] = useState<AgeFilteredMap>({});
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [
          heroStats, dailyTotals, waffle, slope,
          sessionBuckets, breaksBuckets, latencyComparison,
          cognitiveByReliance, socialByReliance, relianceDist, ageComparison, packedBubble,
          screenVsEye, verifyVsError,
          filtered, rawData,
        ] = await Promise.all([
          fetchJson<HeroStats>('/data/hero_stats.json'),
          fetchJson<DailyTotal[]>('/data/daily_totals.json'),
          fetchJson<WaffleData>('/data/waffle.json'),
          fetchJson<SlopePoint[]>('/data/slope.json'),
          fetchJson<SessionBucket[]>('/data/session_buckets.json'),
          fetchJson<BreaksBucket[]>('/data/breaks_buckets.json'),
          fetchJson<LatencyPoint[]>('/data/latency_comparison.json'),
          fetchJson<CognitiveByReliance[]>('/data/cognitive_by_reliance.json'),
          fetchJson<SocialByReliance[]>('/data/social_by_reliance.json'),
          fetchJson<RelianceDistItem[]>('/data/reliance_dist.json'),
          fetchJson<AgeComparisonItem[]>('/data/age_comparison.json'),
          fetchJson<BubbleItem[]>('/data/packed_bubble.json'),
          fetchJson<ScatterPoint[]>('/data/screen_vs_eye.json'),
          fetchJson<ScatterPoint[]>('/data/verify_vs_error.json'),
          fetchJson<AgeFilteredMap>('/data/age_filtered.json'),
          fetchJson<{ cols: string[]; rows: unknown[][] }>('/data/raw_rows.json'),
        ]);

        const base: BaseStaticData = {
          heroStats, dailyTotals, waffle, slope,
          sessionBuckets, breaksBuckets, latencyComparison,
          cognitiveByReliance, socialByReliance, relianceDist, ageComparison, packedBubble,
          screenVsEye, verifyVsError,
        };

        if (cancelled) return;
        setBaseData(base);
        setAgeFiltered(filtered);
        setRawRows(parseRawRows(rawData));
      } catch (e) {
        console.error('useData load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const data: AppData = useMemo(() => {
    const empty: AppData = {
      heroStats: null, dailyTotals: [], waffle: null,
      slope: [], sessionBuckets: [], breaksBuckets: [],
      latencyComparison: [], cognitiveByReliance: [], socialByReliance: [],
      relianceDist: [], ageComparison: [], packedBubble: [], screenVsEye: [], verifyVsError: [],
    };

    if (!baseData) return empty;

    const relianceActive = filters.reliance.size > 0 && filters.reliance.size < 3;
    const dayRangeActive = filters.dayRange[0] > 1 || filters.dayRange[1] < 15;
    const needsRecompute = relianceActive || dayRangeActive;

    if (!needsRecompute && filtersAreDefault(filters)) {
      const source: BaseStaticData =
        filters.age !== 'all' && ageFiltered[filters.age]
          ? ageFiltered[filters.age]
          : baseData;
      return { ...source };
    }

    let filtered = rawRows;
    if (filters.age !== 'all') filtered = filtered.filter((r) => r.age_group === filters.age);
    if (relianceActive) filtered = filtered.filter((r) => filters.reliance.has(r.reliance_type));
    if (dayRangeActive) filtered = filtered.filter((r) => r.day >= filters.dayRange[0] && r.day <= filters.dayRange[1]);

    if (!filtered.length) return { ...empty, heroStats: { totalDailyPrompts: 0, avgScreenTime: 0, avgVerificationRate: 0, avgEyeDryness: 0 }, waffle: { verified: 0, unverified: 100 } };

    return computeFromRows(filtered) as AppData;
  }, [baseData, ageFiltered, rawRows, filters]);

  return { data, loading };
}
