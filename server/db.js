import pg from 'pg';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  max: 3,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  query_timeout: 5000,
  statement_timeout: 5000,
  connectionString:
    process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydatabase',
});
pool.on('error', (error) => console.error('Idle database connection failed:', error.message));

const normalizeJob = (row) => ({
  ...row,
  iconBg: row.iconBg || row.iconbg || '#383E56',
  points: Array.isArray(row.points) ? row.points : [],
});

const legacyDemoJobs = [
  {
    title: 'React.js Developer',
    company_name: 'Starbucks',
    date: 'March 2020 - April 2021',
    location: 'Remote',
    description: 'Built and maintained web applications for a modern retail brand.',
    points: [
      'Developed and maintained web applications using React.js and modern frontend tooling.',
      'Collaborated with designers and product teams to deliver polished experiences.',
      'Improved app responsiveness and accessibility across browsers and devices.',
    ],
    iconBg: '#383E56',
  },
  {
    title: 'React Native Developer',
    company_name: 'Tesla',
    date: 'Jan 2021 - Feb 2022',
    location: 'Austin, TX',
    description: 'Created customer-focused interfaces and internal tools for mobile experiences.',
    points: [
      'Built reusable UI patterns for cross-platform mobile applications.',
      'Worked closely with product and QA teams to improve release quality.',
      'Optimized runtime performance and reduced friction in the user flow.',
    ],
    iconBg: '#E6DEDD',
  },
  {
    title: 'Full Stack Developer',
    company_name: 'Meta',
    date: 'Jan 2023 - Present',
    location: 'Remote',
    description: 'Delivered end-to-end product experiences with a focus on maintainability and scale.',
    points: [
      'Built full-stack features from API design to UI implementation.',
      'Partnered with engineering teams to improve testing and deployment flows.',
      'Helped shape product architecture and performance improvements.',
    ],
    iconBg: '#E6DEDD',
  },
];

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      date VARCHAR(255) NOT NULL,
      location VARCHAR(255) DEFAULT '',
      description TEXT,
      points TEXT[] NOT NULL DEFAULT '{}',
      iconBg VARCHAR(32) DEFAULT '#383E56',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE jobs IN SHARE ROW EXCLUSIVE MODE');
    const { rows } = await client.query('SELECT * FROM jobs');
    // Replace only untouched tutorial seeds. Edited or user-added records survive.
    const legacyIds = rows.filter(row => legacyDemoJobs.some(seed =>
      Object.entries(seed).every(([key, value]) =>
        JSON.stringify(normalizeJob(row)[key]) === JSON.stringify(value))
    )).map(row => row.id);
    if (legacyIds.length) await client.query('DELETE FROM jobs WHERE id = ANY($1::int[])', [legacyIds]);
    if (!rows.length || legacyIds.length) {
      const jobs = JSON.parse(readFileSync(new URL('../shared/experience.json', import.meta.url), 'utf8'));
      for (const job of [...jobs].reverse()) {
        await client.query(
          `INSERT INTO jobs (title, company_name, date, location, description, points, iconBg)
           SELECT $1::varchar(255), $2::varchar(255), $3::varchar(255), $4::varchar(255), $5::text, $6::text[], $7::varchar(32)
           WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE title = $1 AND company_name = $2 AND date = $3)`,
          [job.title, job.company_name, job.date, job.location, job.description, job.points, job.iconBg]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listJobs() {
  const { rows } = await pool.query(
    'SELECT * FROM jobs ORDER BY created_at DESC, id DESC'
  );

  return rows.map(normalizeJob);
}

export async function createJob(job) {
  const sanitizedPoints = Array.isArray(job.points)
    ? job.points.filter(Boolean).map((point) => String(point).trim())
    : [];

  const { rows } = await pool.query(
    `INSERT INTO jobs (title, company_name, date, location, description, points, iconBg)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *;`,
    [
      job.title,
      job.company_name,
      job.date,
      job.location || '',
      job.description || '',
      sanitizedPoints,
      job.iconBg || '#383E56',
    ]
  );

  return normalizeJob(rows[0]);
}

export async function updateJob(id, job) {
  const existing = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);

  if (existing.rowCount === 0) {
    return null;
  }

  const updated = {
    ...existing.rows[0],
    ...job,
    points: Array.isArray(job.points)
      ? job.points.filter(Boolean).map((point) => String(point).trim())
      : existing.rows[0].points,
    iconBg: job.iconBg || existing.rows[0].iconbg || '#383E56',
  };

  const { rows } = await pool.query(
    `UPDATE jobs
     SET title = $1,
         company_name = $2,
         date = $3,
         location = $4,
         description = $5,
         points = $6,
         iconBg = $7
     WHERE id = $8
     RETURNING *;`,
    [
      updated.title,
      updated.company_name,
      updated.date,
      updated.location || '',
      updated.description || '',
      updated.points,
      updated.iconBg,
      id,
    ]
  );

  return normalizeJob(rows[0]);
}

export async function deleteJob(id) {
  const { rowCount } = await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
  return rowCount > 0;
}

export default pool;
