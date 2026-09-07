/**
 * One-time profile capture.
 *
 * The only thing asked for is what the labs actually need: a first name and a
 * student ID. Both stay on this machine. Every personalised requirement across
 * weeks 2 to 5 is derived from them and shown back immediately, so the student
 * can sanity-check the values before they build anything on top of them.
 */

import { useState } from 'react';
import { isProfileComplete, resolveTokens, type StudentProfile } from '@/content/personalize';
import { isDesktop } from '@/state/desktop';

export function Onboarding({
  initial,
  onDone,
  onCancel,
}: {
  initial: StudentProfile;
  onDone: (p: StudentProfile) => void;
  onCancel?: () => void;
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [studentId, setStudentId] = useState(initial.studentId);

  const profile: StudentProfile = { firstName, studentId };
  const ready = isProfileComplete(profile);
  const t = resolveTokens(profile);

  return (
    <div className="onboard-scrim">
      <form
        className="onboard"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onDone(profile);
        }}
      >
        <h2>Let's personalise your labs</h2>
        <p>
          Every COS20007 lab hides requirements like <em>"the last four digits of your student ID"</em>{' '}
          inside the prose. Tell me once and I will fill them in everywhere — in the task text, the
          starter code, and the checks.
        </p>

        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Amy"
            autoFocus
          />
          <div className="help">Only the first letter is used, to pick your shape colour.</div>
        </div>

        <div className="field">
          <label htmlFor="studentId">Student ID</label>
          <input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 104321987"
            inputMode="numeric"
          />
          <div className="help">
            Kept {isDesktop ? 'on this computer' : 'in this browser'} only. Nothing is sent anywhere.
          </div>
        </div>

        {ready && (
          <div className="derived">
            <div style={{ fontWeight: 620, marginBottom: 7, fontSize: 12.5 }}>
              Your values for weeks 2–5
            </div>
            <div className="derived-row">
              <span>Shape colour (Lab 2.2)</span>
              <span>{`Color.${t.color2}`}</span>
            </div>
            <div className="derived-row">
              <span>Shape colour (Lab 4.1)</span>
              <span>{`Color.${t.color4}`}</span>
            </div>
            <div className="derived-row">
              <span>Shape constructor argument</span>
              <span>{t.shapeParam}</span>
            </div>
            <div className="derived-row">
              <span>Outline width (Lab 5.1)</span>
              <span>{`${t.outlineWidth} px`}</span>
            </div>
            <div className="derived-row">
              <span>PrivilegeEscalation pin (Lab 5.2)</span>
              <span>{t.XXXX}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 9 }}>
          <button type="submit" className="primary" disabled={!ready} style={{ flex: 1 }}>
            {ready ? 'Start learning' : 'Enter both to continue'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
