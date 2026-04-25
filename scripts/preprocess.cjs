const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../Arjun/synthetic_eastbrook_user_day.csv');
const OUT_DIR = path.join(__dirname, '../public/data');

if (!fs.existsSync(CSV_PATH)) {
  console.error(`CSV file not found at: ${CSV_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

function parseRow(headers, line) {
  const values = line.split(',');
  const row = {};
  headers.forEach((header, index) => {
    const raw = (values[index] || '').trim();
    row[header] = NUMERIC_RE.test(raw) ? parseFloat(raw) : raw;
  });
  return row;
}

function write(name, data) {
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data));
  console.log(`Wrote ${name}`);
}

async function main() {
  const { computeFromRows } = await import(pathToFileURL(path.join(__dirname, '../src/shared/analyticsCore.js')).href);

  const rawCsv = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = rawCsv.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((header) => header.trim());
  const allRows = lines.slice(1).map((line) => parseRow(headers, line));
  const asIsRows = allRows.filter((row) => row.phase === 'AS-IS');

  console.log(`Total rows: ${allRows.length}, AS-IS rows: ${asIsRows.length}`);
  console.log('Age groups found:', [...new Set(asIsRows.map((row) => row.age_group))]);

  const allStats = computeFromRows(asIsRows);
  console.log('Hero stats (all):', allStats.heroStats);

  write('hero_stats.json', allStats.heroStats);
  write('daily_totals.json', allStats.dailyTotals);
  write('waffle.json', allStats.waffle);
  write('slope.json', allStats.slope);
  write('session_buckets.json', allStats.sessionBuckets);
  write('breaks_buckets.json', allStats.breaksBuckets);
  write('latency_comparison.json', allStats.latencyComparison);
  write('cognitive_by_reliance.json', allStats.cognitiveByReliance);
  write('social_by_reliance.json', allStats.socialByReliance);
  write('reliance_dist.json', allStats.relianceDist);
  write('packed_bubble.json', allStats.packedBubble);
  write('screen_vs_eye.json', allStats.screenVsEye);
  write('verify_vs_error.json', allStats.verifyVsError);
  write('age_comparison.json', allStats.ageComparison);

  const ageFiltered = {};
  for (const ageGroup of [...new Set(asIsRows.map((row) => row.age_group))]) {
    const ageRows = asIsRows.filter((row) => row.age_group === ageGroup);
    console.log(`Age group ${ageGroup}: ${ageRows.length} rows`);
    ageFiltered[ageGroup] = computeFromRows(ageRows);
  }
  write('age_filtered.json', ageFiltered);

  const rawRows = {
    cols: headers,
    rows: asIsRows.map((row) => headers.map((header) => row[header])),
  };
  write('raw_rows.json', rawRows);
  console.log(`Exported ${rawRows.rows.length} raw rows (${rawRows.cols.length} cols)`);

  console.log('\n✅ Dashboard JSON data files written to public/data/');
}

main().catch((error) => {
  console.error('Failed to preprocess dashboard data:', error);
  process.exit(1);
});
