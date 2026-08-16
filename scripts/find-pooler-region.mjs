// Find which Supabase pooler region hosts the project
// Runs inside GitHub Actions (has network access to poolers)
import pg from 'pg';

const url = new URL(process.env.DATABASE_URL ?? '');
const password = decodeURIComponent(url.password);

const regions = [
  'eu-west-1', 'eu-central-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
];
const poolerVersions = ['aws-1', 'aws-0'];

async function testRegion(region, version) {
  const host = `${version}-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    connectionString: `postgresql://postgres.tvsijgwkkfmeztigwvsn:${encodeURIComponent(password)}@${host}:6543/postgres?sslmode=require`,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch (e) {
    return false;
  }
}

for (const version of poolerVersions) {
  for (const region of regions) {
    const ok = await testRegion(region, version);
    console.log(`${ok ? '✅ FOUND' : '❌'} ${version}-${region}`);
    if (ok) {
      console.log(`POOLER=${version}-${region}`);
      process.exit(0);
    }
  }
}
process.exit(1);
