import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function hiddenPassword(prompt) {
  if (!input.isTTY || typeof input.setRawMode !== 'function') throw new Error('Run this setup in an interactive terminal so the password can be hidden.');
  output.write(prompt);
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const onData = (key) => {
      if (key[0] === 3) { cleanup(); reject(new Error('Cancelled.')); return; }
      if (key[0] === 13 || key[0] === 10) { cleanup(); output.write('\n'); resolve(value); return; }
      if (key[0] === 127 || key[0] === 8) { value = value.slice(0, -1); return; }
      if (key[0] >= 32) { value += key.toString(); output.write('*'); }
    };
    const cleanup = () => { input.off('data', onData); input.setRawMode(false); };
    input.on('data', onData);
  });
}

const rl = createInterface({ input, output });
try {
  const email = (await rl.question('Admin email: ')).trim().toLowerCase();
  rl.close();
  const password = await hiddenPassword('Admin password (16+ characters): ');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 16) throw new Error('Use a valid email and a password of at least 16 characters.');
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const hash = await bcrypt.hash(password, 12);
  await db.execute('INSERT INTO admins (email,password_hash) VALUES (?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)', [email, hash]);
  await db.end();
  console.log('Admin account saved. Keep the password private; it is stored as a bcrypt hash.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { rl.close(); }
