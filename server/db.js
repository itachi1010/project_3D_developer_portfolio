import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydatabase',
});

const normalizeJob = (row) => ({
  ...row,
  iconBg: row.iconBg || row.iconbg || '#383E56',
  points: Array.isArray(row.points) ? row.points : [],
});

const defaultJobs = [
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

  const { rowCount } = await pool.query('SELECT 1 FROM jobs LIMIT 1');

  if (rowCount === 0) {
    await Promise.all(
      defaultJobs.map((job) =>
        pool.query(
          `INSERT INTO jobs (title, company_name, date, location, description, points, iconBg)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            job.title,
            job.company_name,
            job.date,
            job.location,
            job.description,
            job.points,
            job.iconBg,
          ]
        )
      )
    );
  }
}

export async function listJobs() {
  const { rows } = await pool.query(
    'SELECT * FROM jobs ORDER BY created_at DESC'
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
