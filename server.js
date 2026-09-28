const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

// XAMPP defaults: user "root", empty password. Change here if yours differs.
const DB_NAME = process.env.DB_NAME || 'student_records';
const CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || ''
};

let pool;

async function initDb() {
  const conn = await mysql.createConnection(CONFIG);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4`);
  await conn.end();

  pool = mysql.createPool({ ...CONFIG, database: DB_NAME });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(150) NOT NULL,
      course     VARCHAR(150) NOT NULL,
      year       ENUM('1st Year','2nd Year','3rd Year','4th Year') NOT NULL DEFAULT '1st Year',
      status     ENUM('Active','Leave','Graduated') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const STATUSES = ['Active', 'Leave', 'Graduated'];

const toCode = n => `STU-${String(n).padStart(3, '0')}`;
const toNum = code => {
  const m = /^STU-(\d+)$/.exec(code);
  return m ? parseInt(m[1], 10) : null;
};
const out = r => ({ id: toCode(r.id), name: r.name, course: r.course, year: r.year, status: r.status });

function clean(body) {
  const name = String(body.name || '').trim();
  const course = String(body.course || '').trim();
  const { year, status } = body;
  if (!name || !course || !YEARS.includes(year) || !STATUSES.includes(status)) return null;
  return { name, course, year, status };
}

const wrap = fn => (req, res) =>
  fn(req, res).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

app.get('/api/records', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students ORDER BY id');
  res.json(rows.map(out));
}));

app.get('/api/records/:id', wrap(async (req, res) => {
  const n = toNum(req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [n]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(out(rows[0]));
}));

app.post('/api/records', wrap(async (req, res) => {
  const d = clean(req.body);
  if (!d) return res.status(400).json({ error: 'Invalid data' });
  const [result] = await pool.query(
    'INSERT INTO students (name, course, year, status) VALUES (?, ?, ?, ?)',
    [d.name, d.course, d.year, d.status]
  );
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
  res.status(201).json(out(rows[0]));
}));

app.put('/api/records/:id', wrap(async (req, res) => {
  const n = toNum(req.params.id);
  const d = clean(req.body);
  if (!n) return res.status(404).json({ error: 'Not found' });
  if (!d) return res.status(400).json({ error: 'Invalid data' });
  const [result] = await pool.query(
    'UPDATE students SET name=?, course=?, year=?, status=? WHERE id=?',
    [d.name, d.course, d.year, d.status, n]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [n]);
  res.json(out(rows[0]));
}));

app.delete('/api/records/:id', wrap(async (req, res) => {
  const n = toNum(req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  const [result] = await pool.query('DELETE FROM students WHERE id = ?', [n]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`)))
  .catch(err => {
    console.error('Could not connect to MySQL. Is MySQL running in XAMPP?');
    console.error(err.message);
    process.exit(1);
  });
