# Turning on secure logins (Firebase Authentication + rules)

Do this once. It replaces the open "test mode" with real email + password logins
and rules that stop anyone seeing another child's data.

## 1. Turn on Email/Password sign-in
Firebase console → **Build → Authentication → Get started** →
**Sign-in method** tab → enable **Email/Password** → Save.

## 2. Lock down the database with rules
Firebase console → **Build → Firestore Database → Rules** tab.
Delete what's there, paste the contents of **`firestore.rules`** (in this
project), and click **Publish**.

## 3. Create the FIRST admin (one-time bootstrap)
Because the rules only let an existing admin create accounts, you make the very
first one by hand:

1. **Authentication → Users → Add user.** Enter your admin email + a password.
   Copy the **User UID** it shows (a long string).
2. **Firestore Database → Start collection** (if you don't have one) named
   `users`. Add a document whose **Document ID is that UID**, with one field:
   - Field `role` (string) = `admin`
   (optionally `name` (string) = your name)
3. Done. You can now sign in to the app with that email + password as admin.

## 4. Everyone else is created inside the app
Signed in as admin:
- **Students tab** → fill the student's details **plus the parent's email and a
  temporary password** → Add. That creates the parent's login automatically.
- **Teachers tab** → name, subject, grade(s), **email + temporary password** →
  Add. That creates the teacher's login.

Teachers and parents then sign in with that email/password and can change it
anytime via **Forgot password** on the sign-in screen.

## 5. Deploying the live site
On Vercel, add the same six `VITE_FIREBASE_*` variables under
**Settings → Environment Variables**, then redeploy. (You do NOT set
`VITE_STAFF_PIN` for the secure version — it's only used by the demo mode.)

---

## Test checklist (do this before real families use it)
Sign in as each role and confirm:

- [ ] **Admin** can add students/teachers and see everything.
- [ ] **Teacher** sees only their grade(s) and their subject; can save marks and
      attendance for their class.
- [ ] **Teacher** does **not** see other grades or other subjects.
- [ ] **Student/Parent** sees their own marks + attendance across all subjects.
- [ ] **Student/Parent** cannot see anyone else's data.
- [ ] The **public site** (news, timetable, Apply form) still works when signed
      out.

If a screen shows no data when it should, it's almost always the rules or a
missing `users/{uid}` document — check step 2 and 3.

## Notes
- Firebase web API keys are **not secrets** — they're meant to live in the app.
  Security comes from these rules + Authentication, not from hiding the key.
- Removing a student/teacher in the app deletes their record, but not their
  Authentication login. To fully revoke access, also delete them under
  **Authentication → Users**.
- Firestore's free (Spark) plan is plenty for a school this size.

---

## Student "set your password" emails (on Accept)

When you tap **Accept & enrol** on an application (or **Send login invite** on an
existing student), the app:
1. generates the roll number and creates the student record,
2. creates their parent's login account, and
3. sends a **"set your password" email** using Firebase Authentication's own
   email — no external email service, works on the free Spark plan.

The parent clicks the link, chooses their own password, and signs in.

**No setup needed beyond enabling Email/Password** (already done). Two optional
touches in the Firebase console → Authentication → Templates → Password reset:
- change the **sender name** to "KTN Digital Online School",
- reword the message (e.g. "Welcome to KTN — set your password to see your
  child's marks and attendance").

Note: Firebase's email is a fixed template, so it can't include the roll number
itself. The roll number is shown to you on accept, and the parent sees it in
their portal after signing in. (If you ever want a fully custom welcome email
with the roll number embedded, that needs an external mail service — ask.)

Teachers don't get this email: they choose their password when they sign up, and
can use "Forgot password" on the sign-in screen anytime.

---

## Custom welcome email (optional, free — EmailJS)

The secure "set your password" link always comes from Firebase. If you also want
a **branded welcome email that includes the roll number**, set up EmailJS (free):

1. Create a free account at emailjs.com.
2. Add an **Email Service** (connect the school Gmail) → note the **Service ID**.
3. Create an **Email Template** with this "To" field: `{{to_email}}`, and a body
   that uses these variables:
   - `{{to_name}}`, `{{roll_number}}`, `{{grade}}`, `{{login_email}}`,
     `{{app_url}}`, `{{school_name}}`
   Suggested body:
   > Dear {{to_name}},
   > Welcome to {{school_name}}! Your child has been enrolled.
   > Roll number: {{roll_number}}   Class: {{grade}}
   > Sign-in email: {{login_email}}
   > You'll receive a separate secure email to set your password. After that,
   > sign in here: {{app_url}}
   Note the **Template ID**.
4. In **Account → General**, copy your **Public Key**.
5. Put all three (plus your site URL) in `.env`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxx
   VITE_APP_URL=https://ktn-school-app.vercel.app
   ```
   (Also add these on Vercel → Settings → Environment Variables, then redeploy.)

Now, on Accept & enrol (and "Send login invite"), the parent gets **two emails**:
the Firebase set-password link, and this branded welcome with their roll number.
EmailJS's free tier covers ~200 emails/month. If the keys are blank, only the
Firebase email is sent — nothing breaks.
