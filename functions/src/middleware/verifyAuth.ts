import { getAuth } from 'firebase-admin/auth';

/**
 * Extracts and verifies a Firebase ID token from the Authorization header.
 * Returns the decoded UID on success, null on failure.
 */
export async function verifyAuth(
  authHeader: string | undefined,
): Promise<{ uid: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}
