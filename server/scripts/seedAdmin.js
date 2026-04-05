import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Client } = pg;

const rounds = 10;

/** Initial login stored in DB only after first seed; change password via DB or a future admin UI. */
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'physio123';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  const { rows } = await client.query(
    'SELECT id FROM physio_admin_users WHERE username = $1',
    [DEFAULT_ADMIN_USERNAME]
  );
  if (rows.length > 0) {
    console.log(
      `User "${DEFAULT_ADMIN_USERNAME}" already exists — credentials are only in the database; not updating.`
    );
    await client.end();
    return;
  }

  const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, rounds);
  const result = await client.query(
    `INSERT INTO physio_admin_users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username`,
    [DEFAULT_ADMIN_USERNAME, hash]
  );
  console.log('Created default admin in database:', result.rows[0]);
  console.log(
    `Login: username="${DEFAULT_ADMIN_USERNAME}" (change password by updating physio_admin_users.password_hash in Postgres).`
  );
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
