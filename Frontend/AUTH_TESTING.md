# Kyxun Supabase Auth Localhost Test Matrix

Use this matrix with the app running on `http://localhost:3000` and the Supabase project configured with localhost redirect URLs:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/reset-password`

| Area | Local path | Steps | Expected Supabase/frontend result | Expected error text | Pass/Fail | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Email signup confirmation | `/signup` | Create an account with a new email and valid password. | The app shows a check-your-email message and does not enter the app until the confirmation link is opened. Supabase sends the Confirm Sign Up email through configured SMTP. | If SMTP is broken: Supabase sign-up email send error. |  |  |
| Confirmed signup link | Email link -> `/auth/callback` | Open the confirmation link from the signup email. | Supabase exchanges the code, Kyxun saves the session, and redirects to `/plan`. | Expired/used links return the Supabase callback error on `/login`. |  |  |
| Weak password rule | `/signup` | Try password `123`. | The frontend blocks before Supabase call. | `Password must be at least 8 characters.` |  |  |
| Supabase password requirements | `/signup` | Try a password that passes Kyxun length but violates Supabase rules, such as missing required character classes. | Supabase rejects the signup and Kyxun shows the Supabase error. | Usually `Password should contain...` or `Password is too weak`. |  | Depends on exact Supabase policy. |
| Signup disabled | `/signup` | Turn Allow new users to sign up OFF in Supabase, then submit a valid new signup. | Supabase blocks registration. Turn the setting back ON after testing. | Commonly `Signups not allowed for this instance` or `User signups are disabled`. |  |  |
| Password login | `/login` | Sign in with a confirmed email and correct password. | Kyxun redirects to `/plan`. | Wrong password commonly returns `Invalid login credentials`. |  |  |
| Unconfirmed login | `/login` | Try to sign in before clicking the signup confirmation email. | Supabase blocks login. | Commonly `Email not confirmed`. |  |  |
| Forgot password email | `/login` | Open Forgot Password, enter the account email, submit. | Supabase sends the Reset Password email; Kyxun shows a reset-email-sent message. | Rate limits may return an email send limit error. |  |  |
| Reset password link | Email link -> `/reset-password` | Open the reset email link, enter a valid new password. | Kyxun updates the password through Supabase and returns to `/login`; Supabase sends Password Changed alert. | Expired/used links show reset session/link errors. |  |  |
| Password changed alert | Email inbox | After a successful reset or settings password change, check the account email. | Supabase sends the Password Changed security email. | None expected. |  |  |
| Current password required | `/settings` or Plan Settings -> Security | Try updating password with new password but no current password. | Kyxun blocks before Supabase call. | `Enter your current password first.` or `Current password is required.` |  |  |
| Wrong current password | `/settings` or Plan Settings -> Security | Enter the wrong current password and a valid new password. | Supabase rejects the update. | Commonly `Current password is incorrect` or `Invalid credentials`. |  |  |
| Correct current password | `/settings` or Plan Settings -> Security | Enter the correct current password and valid new password. | Supabase updates the password. | None expected. |  |  |
| Reauthentication code | `/settings` or Plan Settings -> Security | Click Send Verification Code, enter received code with current and new password. | Supabase accepts the nonce when reauthentication is required by policy. | Expired/wrong code may return `Reauthentication not valid` or `OTP expired`. |  |  |
| Secure email change | `/settings` or Plan Settings -> Security | Enter a different new email and submit. | Supabase sends confirmation links to both old and new addresses when Secure email change is ON. | Existing/invalid email may return Supabase validation or conflict errors. |  |  |
| Email address changed alert | Old inbox | After both secure email change links are opened, check the old email inbox. | Supabase sends Email Address Changed alert. | None expected. |  |  |
| Magic link send | `/login` | Enter a confirmed user email in Magic link or code, click Send link. | Supabase sends a magic link and OTP/code email. | Unknown user with no auto-create returns a user-not-found style error. |  |  |
| Magic OTP verify | `/login` | Enter the email code and click Verify code. | Kyxun saves the session and redirects to `/plan`. | Expired/wrong code commonly returns `Token has expired or is invalid`. |  |  |
| Magic link click | Email link -> `/auth/callback` | Click the magic link instead of entering the code. | Supabase exchanges the code and Kyxun redirects to `/plan`. | Expired/used links return callback errors on `/login`. |  |  |
| Phone changed template | N/A | No current Kyxun UI collects phone numbers. | Not testable until SMS/phone auth is added. | N/A |  | Template can remain configured in Supabase. |
| Reauthentication for destructive action | Future account deletion hardening | Delete account currently uses a browser confirmation only. | Supabase reauth can be added later for stronger account deletion protection. | N/A |  | Current implementation is not wired to force reauth for deletion. |

## Current Flow Coverage

| Flow | Status in Kyxun | Where |
| --- | --- | --- |
| Email/password signup | Available, with email-confirmation handling | `/signup` |
| Password policy errors | Available | `/signup`, `/reset-password`, `/settings` |
| Email/password login | Available | `/login` |
| Forgot password email | Available | `/login` |
| Password reset after email link | Available | `/reset-password` |
| Password update with current password | Available | `/settings`, Plan Settings modal |
| Reauthentication nonce for password update | Available | `/settings`, Plan Settings modal |
| Secure email change | Available | `/settings`, Plan Settings modal |
| Google OAuth | Available | `/signup`, `/login`, `/auth/callback` |
| Magic link and email OTP login | Available | `/login`, `/auth/callback` |
| Phone number auth | Not currently applicable | N/A |
