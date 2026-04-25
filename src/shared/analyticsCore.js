function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function r1(value) {
  return Math.round(value * 10) / 10;
}

function r2(value) {
  return Math.round(value * 100) / 100;
}

function r3(value) {
  return Math.round(value * 1000) / 1000;
}

function seededRandom(seed) {
  let current = seed;
  return () => {
    current = (current * 16807) % 2147483647;
    return current / 2147483647;
  };
}

function shuffle(values) {
  const next = seededRandom(42);
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(next() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const RELIANCE_TYPES = [
  { label: 'Over-reliant', key: 'overreliance' },
  { label: 'Appropriate', key: 'appropriate' },
  { label: 'Under-reliant', key: 'underreliance' },
];

const SESSION_BUCKETS = [
  { label: '< 60 min', min: 0, max: 60 },
  { label: '60–120 min', min: 60, max: 120 },
  { label: '120–180 min', min: 120, max: 180 },
  { label: '> 180 min', min: 180, max: Infinity },
];

const BREAK_BUCKETS = [
  { label: '0 Breaks', min: 0, max: 1 },
  { label: '1 Break', min: 1, max: 2 },
  { label: '2 Breaks', min: 2, max: 3 },
  { label: '3+ Breaks', min: 3, max: Infinity },
];

export function computeFromRows(rows) {
  const days = [...new Set(rows.map((row) => row.day))].sort((a, b) => a - b);

  const dailyTotals = days.map((day) => {
    const dayRows = rows.filter((row) => row.day === day);
    return {
      day,
      totalPrompts: Math.round(dayRows.reduce((sum, row) => sum + row.ai_prompts_per_day, 0)),
      avgPrompts: r1(avg(dayRows.map((row) => row.ai_prompts_per_day))),
      avgVerification: r2(avg(dayRows.map((row) => row.verification_rate))),
    };
  });

  const avgVerificationRate = Math.round(avg(rows.map((row) => row.verification_rate)) * 1000) / 10;
  const heroStats = {
    totalDailyPrompts: dailyTotals.length ? Math.round(avg(dailyTotals.map((row) => row.totalPrompts))) : 0,
    avgScreenTime: r1(avg(rows.map((row) => row.screen_time_hours))),
    avgVerificationRate,
    avgEyeDryness: r1(avg(rows.map((row) => row.eye_dryness_score))),
  };

  const waffle = {
    verified: Math.round(avgVerificationRate),
    unverified: 100 - Math.round(avgVerificationRate),
  };

  const slope = [1, 2, 3].map((complexity) => {
    const complexityRows = rows.filter((row) => row.verification_complexity === complexity);
    return {
      complexity,
      label: complexity === 1 ? 'Low' : complexity === 2 ? 'Medium' : 'High',
      verificationRate: complexityRows.length ? Math.round(avg(complexityRows.map((row) => row.verification_rate)) * 1000) / 10 : 0,
    };
  });

  const sessionBuckets = SESSION_BUCKETS.map((bucket) => {
    const bucketRows = rows.filter((row) => row.continuous_use_minutes >= bucket.min && row.continuous_use_minutes < bucket.max);
    return {
      label: bucket.label,
      eyeDryness: bucketRows.length ? r1(avg(bucketRows.map((row) => row.eye_dryness_score))) : 0,
      neckPain: bucketRows.length ? r1(avg(bucketRows.map((row) => row.neck_pain_score))) : 0,
      headaches: bucketRows.length ? r2(avg(bucketRows.map((row) => row.headaches_per_week))) : 0,
      count: bucketRows.length,
    };
  });

  const breaksBuckets = BREAK_BUCKETS.map((bucket) => {
    const bucketRows = rows.filter((row) => row.breaks_taken >= bucket.min && row.breaks_taken < bucket.max);
    return {
      label: bucket.label,
      eyeDryness: bucketRows.length ? r1(avg(bucketRows.map((row) => row.eye_dryness_score))) : 0,
      neckPain: bucketRows.length ? r1(avg(bucketRows.map((row) => row.neck_pain_score))) : 0,
      headaches: bucketRows.length ? r2(avg(bucketRows.map((row) => row.headaches_per_week))) : 0,
      count: bucketRows.length,
    };
  });

  const latencyComparison = RELIANCE_TYPES.map(({ label, key }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    return {
      group: label,
      key,
      withAI: relianceRows.length ? Math.round(avg(relianceRows.map((row) => row.decision_latency_with_ai_sec))) : 0,
      withoutAI: relianceRows.length ? Math.round(avg(relianceRows.map((row) => row.decision_latency_without_ai_sec))) : 0,
      gap: relianceRows.length ? Math.round(avg(relianceRows.map((row) => row.decision_latency_without_ai_sec - row.decision_latency_with_ai_sec))) : 0,
    };
  });

  const cognitiveByReliance = RELIANCE_TYPES.map(({ label, key }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    return {
      group: label,
      key,
      planningSkill: relianceRows.length ? r2(avg(relianceRows.map((row) => row.planning_skill))) : 0,
      confidenceWithoutAI: relianceRows.length ? r2(avg(relianceRows.map((row) => row.confidence_without_ai))) : 0,
      errorRate: relianceRows.length ? r2(avg(relianceRows.map((row) => row.error_rate))) : 0,
      acceptWithoutVerify: relianceRows.length ? r3(avg(relianceRows.map((row) => row.accept_without_verification))) : 0,
    };
  });

  const totalRows = rows.length || 1;
  const socialByReliance = RELIANCE_TYPES.map(({ label, key }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    const total = relianceRows.length || 1;
    return {
      group: label,
      key,
      moodCheckins: relianceRows.length ? r2(avg(relianceRows.map((row) => row.mood_checkins))) : 0,
      emotionalSupport: relianceRows.length ? r2(avg(relianceRows.map((row) => row.emotional_support_requests))) : 0,
      socialMessaging: Math.round((relianceRows.filter((row) => row.ai_for_social_messages === 1).length / total) * 100),
      seriousTopics: Math.round((relianceRows.filter((row) => row.serious_topics_with_ai === 1).length / total) * 100),
      piiShared: Math.round((relianceRows.filter((row) => row.pii_shared === 1).length / total) * 100),
      harmfulExposure: relianceRows.length ? r2(avg(relianceRows.map((row) => row.harmful_exposure_count))) : 0,
    };
  });

  const studentDominant = {};
  for (const row of rows) {
    if (!studentDominant[row.user_id]) studentDominant[row.user_id] = {};
    studentDominant[row.user_id][row.reliance_type] = (studentDominant[row.user_id][row.reliance_type] || 0) + 1;
  }

  const dominantCounts = { overreliance: 0, appropriate: 0, underreliance: 0 };
  for (const counts of Object.values(studentDominant)) {
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (dominant) dominantCounts[dominant] += 1;
  }

  const relianceDist = [
    { label: 'Appropriate', key: 'appropriate', count: dominantCounts.appropriate || 0 },
    { label: 'Over-reliant', key: 'overreliance', count: dominantCounts.overreliance || 0 },
    { label: 'Under-reliant', key: 'underreliance', count: dominantCounts.underreliance || 0 },
  ];

  const packedBubble = [
    { label: 'Social Messaging', value: Math.round((rows.filter((row) => row.ai_for_social_messages === 1).length / totalRows) * 1000) / 10, unit: '% of student-days', description: 'AI used for personal/social messages', color: '#DB2777' },
    { label: 'Serious Topics', value: Math.round((rows.filter((row) => row.serious_topics_with_ai === 1).length / totalRows) * 1000) / 10, unit: '% of student-days', description: 'AI consulted on serious life topics', color: '#9333EA' },
    { label: 'PII Shared', value: Math.round((rows.filter((row) => row.pii_shared === 1).length / totalRows) * 1000) / 10, unit: '% of student-days', description: 'Personal identifying info shared with AI', color: '#DC2626' },
    { label: 'Mood Check-ins', value: r2(avg(rows.map((row) => row.mood_checkins))), unit: 'avg/day', description: 'Daily emotional check-ins via AI', color: '#D97706' },
    { label: 'Emotional Support', value: r2(avg(rows.map((row) => row.emotional_support_requests))), unit: 'req/day', description: 'Emotional support requests sent to AI', color: '#2563EB' },
  ];

  const screenVsEye = shuffle(rows).slice(0, 500).map((row) => ({
    x: r1(row.screen_time_hours),
    y: r1(row.eye_dryness_score),
    reliance: row.reliance_type,
  }));

  const verifyVsError = shuffle(rows).slice(0, 400).map((row) => ({
    x: Math.round(row.verification_rate * 100),
    y: Math.round(row.error_rate * 1000) / 10,
    reliance: row.reliance_type,
  }));

  const ageComparison = ['13-14', '15-17']
    .map((ageGroup) => {
      const ageRows = rows.filter((row) => row.age_group === ageGroup);
      if (!ageRows.length) return null;
      return {
        group: ageGroup === '13-14' ? 'Ages 13-14' : 'Ages 15-17',
        ageKey: ageGroup,
        avgScreenTime: r1(ageRows.reduce((sum, row) => sum + row.screen_time_hours, 0) / ageRows.length),
        avgContinuousUseHrs: r1(ageRows.reduce((sum, row) => sum + row.continuous_use_minutes, 0) / ageRows.length / 60),
        avgPromptsPerDay: Math.round(ageRows.reduce((sum, row) => sum + row.ai_prompts_per_day, 0) / ageRows.length),
        count: ageRows.length,
      };
    })
    .filter(Boolean);

  return {
    heroStats,
    dailyTotals,
    waffle,
    slope,
    sessionBuckets,
    breaksBuckets,
    latencyComparison,
    cognitiveByReliance,
    socialByReliance,
    relianceDist,
    ageComparison,
    packedBubble,
    screenVsEye,
    verifyVsError,
  };
}
