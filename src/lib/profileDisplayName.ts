/** `public.profiles` stores `first_name` / `last_name`, not `full_name`. */

export function profileFullName(profile: {
  first_name?: string | null;
  last_name?: string | null;
}): string | null {
  const parts = [profile.first_name?.trim(), profile.last_name?.trim()].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

/** Shape many UIs expect after joining name parts (legacy `full_name` field). */
export function profileForUi(row: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return {
    id: row.id,
    full_name: profileFullName(row),
    email: row.email ?? null,
    phone: row.phone ?? null,
  };
}
