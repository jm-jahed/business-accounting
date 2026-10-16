import readline from 'readline';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Discover environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { dbManager, SuperAdminUser } from '@accounting/database';

import { Writable } from 'stream';

function hiddenQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);

    // Muted writable stream so typed characters are completely suppressed from terminal output
    const mutedStream = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutedStream,
      terminal: true,
    });

    if (process.stdin.isTTY) {
      let input = '';
      const onData = (char: Buffer) => {
        const str = char.toString('utf8');
        if (str === '\n' || str === '\r' || str === '\u0004') {
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(input.trim());
        } else if (str === '\u0003') {
          process.exit(1);
        } else if (str === '\b' || str === '\x7f') {
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
        } else {
          input += str;
        }
      };

      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      rl.question('', (answer) => {
        process.stdout.write('\n');
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

function promptText(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

export async function seedSuperAdmin(options?: { email?: string; name?: string; password?: string }) {
  await dbManager.connect();

  // 1. Refuse if ANY active SUPER_ADMIN already exists
  const existingSuperAdmin = await SuperAdminUser.findOne({ role: 'SUPER_ADMIN' });
  if (existingSuperAdmin) {
    console.error('❌ Refusal: A SUPER_ADMIN already exists in super_admin_users collection.');
    console.error('Only one initial bootstrap SUPER_ADMIN can be created via seed:admin.');
    return { success: false, reason: 'ALREADY_EXISTS' };
  }

  const email = (options?.email || (await promptText('Enter Super Admin email: '))).trim().toLowerCase();
  const name = (options?.name || (await promptText('Enter Super Admin full name: '))).trim();

  let password = options?.password;
  if (!password) {
    password = await hiddenQuestion('Enter initial password (min 12 characters, input hidden): ');
  }

  if (!email || !name || !password) {
    console.error('❌ Error: Email, name, and password are required.');
    return { success: false, reason: 'INVALID_INPUT' };
  }

  if (password.length < 12) {
    console.error('❌ Error: Super Admin password must be at least 12 characters.');
    return { success: false, reason: 'PASSWORD_TOO_SHORT' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = new SuperAdminUser({
    email,
    name,
    passwordHash,
    role: 'SUPER_ADMIN',
    status: 'active',
    isTotpEnabled: false,
    mustChangePassword: true, // Mandatory password change on first login
    failedLoginAttempts: 0,
    recoveryCodeHashes: [],
  });

  await admin.save();

  console.log('✅ Initial SUPER_ADMIN successfully created in super_admin_users collection.');
  console.log(`   Account: ${email}`);
  console.log('   Security Policy: First-login mandatory password change and TOTP setup required.');
  console.log('   Note: Client User collection was untouched.');

  return { success: true, email };
}

// Auto-run if executed directly
if (require.main === module) {
  seedSuperAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during seed:admin:', err.message);
      process.exit(1);
    });
}
