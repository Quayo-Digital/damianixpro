/**
 * Concatenates selected Supabase migrations into one SQL file for Dashboard → SQL Editor
 * when `supabase db push` cannot reach the API. Source of truth remains supabase/migrations/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');
const outPath = path.join(root, 'supabase', 'scripts', 'apply-20260504-rbac-staff-bundle.sql');

const FILES = [
  '20260504120000_rbac_roles_accountant_facility_manager.sql',
  '20260504180000_staff_read_properties_and_units.sql',
  '20260504183000_staff_read_property_announcements.sql',
  '20260504184500_property_media_select_agents_and_staff.sql',
  '20260505100000_handle_new_user_allow_accountant_signup.sql',
  '20260505110000_handle_new_user_staff_invite_only.sql',
];

let out = `-- AUTO-GENERATED — do not edit. Run: npm run build:supabase-manual-bundle\n`;
out += `-- Paste into Supabase SQL Editor when CLI cannot reach api.supabase.com.\n\n`;

for (const name of FILES) {
  const filePath = path.join(migrationsDir, name);
  if (!fs.existsSync(filePath)) {
    console.error('Missing migration:', filePath);
    process.exit(1);
  }
  out += `\n-- ========== ${name} ==========\n\n`;
  out += fs.readFileSync(filePath, 'utf8').replace(/\s+$/, '');
  out += '\n\n';
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', path.relative(root, outPath));
