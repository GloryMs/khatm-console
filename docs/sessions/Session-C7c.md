Session: feat/C7c-totp-2fa — console side of FS-2.2 2FA. Preamble: contract:update; self-stop
if the enroll/confirm/challenge/reset surfaces or the totpRequired login signal are absent.
1. LOGIN: when the response signals totpRequired -> code-entry step (6-digit input, autofocus,
   paste-friendly); link to "use a recovery code" variant. Generic failure copy — do not
   distinguish wrong-code from lockout beyond what the error envelope provides.
2. ENROLLMENT: QR render of the otpauth:// URI (client-side QR lib consistent with existing deps
   — verify what's available before adding one) + manual-entry secret fallback + confirm-code
   step; recovery codes displayed via the EXISTING plaintext-once component with print/copy.
3. FORCED ENROLLMENT: on the distinct error code, route into a takeover enrollment screen —
   reuse the forced-password-change takeover pattern/component.
4. SECURITY SETTINGS surface (self-service): show 2FA status; re-enroll. USERS screen
   (tenant:admin): "Reset 2FA" action with confirm; on-behalf-of tab gains the same where the
   contract allows.
5. EN/AR keys same commit; RTL pass (QR screen, code inputs — digit fields stay LTR inside RTL
   layout, follow the existing number-input precedent if one exists, else record the choice).
DoD: npm run check green; live walkthrough EN+AR with a real authenticator app: enroll -> forced
flow for a key:manage holder -> challenge login -> recovery login -> admin reset -> re-enroll.
PR opened NOT merged; Majd EN/AR/RTL walkthrough = merge gate; STATE updated (KH-2.2 epic can be
marked CLOSED in STATE once this merges).
Self-stop: standard contract-gap rule.