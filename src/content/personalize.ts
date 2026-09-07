/**
 * Resolves the per-student values the labs demand.
 *
 * Every COS20007 lab hides personalised requirements inside prose:
 *   Lab 2.1 #12  reset to 21474836XXXX      (XXXX = last four of student ID)
 *   Lab 2.2 #4   Azure if first name A-L, else Chocolate
 *   Lab 4.1 #12  Azure if first name A-K, else Chocolate; param = 1XX
 *   Lab 5.1 #19  outline (5 + X) px wide    (X = last digit)
 *   Lab 5.2      PrivilegeEscalation pin    (last four of student ID)
 *
 * Students routinely get these wrong, or lose time re-deriving them. Entered
 * once, they render into every task statement, seed file and generated test.
 */

export interface StudentProfile {
  firstName: string;
  studentId: string;
}

export const DEFAULT_PROFILE: StudentProfile = { firstName: '', studentId: '' };

export interface ResolvedTokens {
  first: string;
  id: string;
  /** Last digit, last two, last four. */
  X: string;
  XX: string;
  XXXX: string;
  /** Lab 2.2 rule: first letter A-L -> Azure, else Chocolate. */
  color2: string;
  /** Lab 4.1 rule: first letter A-K -> Azure, else Chocolate. */
  color4: string;
  /** Lab 2.2 / 4.1: shape constructor argument, 1 followed by last two digits. */
  shapeParam: string;
  /** Lab 5.1: black outline width in pixels. */
  outlineWidth: string;
  /** Lab 2.1 #12, exactly as the PDF writes it. */
  resetLiteral: string;
  /** Whether that literal actually fits in a C# int (it does not). */
  resetLiteralFitsInt: boolean;
}

const INT_MAX = 2147483647;

function digitsOf(studentId: string): string {
  const d = (studentId || '').replace(/\D/g, '');
  return d || '0000';
}

function initial(firstName: string): string {
  const c = (firstName || '').trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : 'A';
}

export function resolveTokens(profile: StudentProfile): ResolvedTokens {
  const digits = digitsOf(profile.studentId);
  const X = digits.slice(-1);
  const XX = digits.slice(-2).padStart(2, '0');
  const XXXX = digits.slice(-4).padStart(4, '0');
  const letter = initial(profile.firstName);

  const resetLiteral = `21474836${XXXX}`;

  return {
    first: profile.firstName.trim() || 'your name',
    id: profile.studentId.trim() || 'your student ID',
    X,
    XX,
    XXXX,
    color2: letter <= 'L' ? 'Azure' : 'Chocolate',
    color4: letter <= 'K' ? 'Azure' : 'Chocolate',
    shapeParam: `1${XX}`,
    outlineWidth: String(5 + Number(X)),
    resetLiteral,
    resetLiteralFitsInt: Number(resetLiteral) <= INT_MAX,
  };
}

const TOKEN = /\{\{(\w+)\}\}/g;

/** Substitute {{token}} placeholders anywhere in content or seed code. */
export function personalize(text: string, tokens: ResolvedTokens): string {
  return text.replace(TOKEN, (whole, key: string) => {
    const v = (tokens as unknown as Record<string, unknown>)[key];
    return v === undefined ? whole : String(v);
  });
}

/** True once the profile is complete enough to render personalised tasks. */
export function isProfileComplete(p: StudentProfile): boolean {
  return p.firstName.trim().length > 0 && digitsOf(p.studentId).length >= 4 && /\d/.test(p.studentId);
}
