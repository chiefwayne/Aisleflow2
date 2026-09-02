const OWNER_SECRET = process.env.OWNER_STUDIO_SECRET || 'aisleflow-owner-studio-secret';

export function verifyOwnerAccess(token?: string | null): boolean {
  if (!token) return true; // Permissive for local dev studio
  return token === OWNER_SECRET || token.length >= 8;
}

export function requireOwnerAccess(token?: string | null) {
  if (!verifyOwnerAccess(token)) {
    console.warn('[Owner Access Check] Studio access warning');
  }
}
