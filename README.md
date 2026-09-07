# KTN Digital Online School — React app

A mobile-style web app for KTN Digital Online School: home, about & history,
class timetable, teacher directory (with photos), news/announcements, and a
free-admission request form. Built with **React + Vite**, with an optional
**Firebase (Firestore)** backend so admission requests and news sync across
every device.

---

## 1. Run it on your computer

You need **Node.js 18+** installed (https://nodejs.org).

```bash
npm install      # download dependencies (first time only)
npm run dev      # start the app
```

Open the address it prints (usually http://localhost:5173).

At this point the app **already works** — it stores news and admission
requests in your browser (on-device). This is perfect for trying it out. The
catch: data saved on one device stays on that device. To have a parent submit
on their phone and see it on yours, turn on cloud storage below.

The staff area opens with the lock icon (top-right). The default PIN is
**1234** — change it in `.env` (see below).

---

## 2. Turn on cloud storage (Firebase) — so requests reach you anywhere

This is what makes it a real synced app. It's free for your size.

1. Go to https://console.firebase.google.com and create a project (you can use
   the school's Gmail account).
2. In the project, open **Build → Firestore Database → Create database**
   (start in test mode to begin; tighten the rules later).
3. Back on the project overview, add a **Web app** (the `</>` icon). Firebase
   shows you a config block with keys like `apiKey`, `projectId`, etc.
4. In this project folder, copy `.env.example` to a new file named `.env` and
   paste your values in:

   ```
   VITE_FIREBASE_API_KEY=AIza...your key...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   VITE_STAFF_PIN=choose-your-own
   ```
5. Stop the app (Ctrl+C) and run `npm run dev` again.

That's it. The app now reads and writes two Firestore collections:

- `applications` — every admission request
- `news` — announcements (seeded automatically on first run)

Nothing else in the code changes. The app detects the keys and switches from
on-device storage to the cloud on its own. You'll see a small **"Cloud sync
on"** badge on the staff screen when it's connected.

### How the data is stored

The whole storage layer lives in two small files:

- `src/lib/firebase.js` — reads your keys and connects to Firestore.
- `src/lib/store.js` — the read/write functions the app calls
  (`listNews`, `addNews`, `deleteNews`, `listApps`, `addApp`, `clearApps`).
  Each one uses Firestore when configured, or the browser otherwise.

If you'd rather use a spreadsheet or a different database later, `store.js` is
the only file you need to change.

---

## 3. Put it online (free)

Build the production files:

```bash
npm run build      # creates a "dist" folder
```

Then host it, free, on either:

- **Netlify** (https://app.netlify.com) — drag the `dist` folder onto the page,
  or connect the GitHub repo. Add your `VITE_...` values under
  Site settings → Environment variables.
- **Vercel** (https://vercel.com) — "New Project", import the repo, add the same
  environment variables.

You'll get a public link (e.g. `ktn-school.netlify.app`) you can share with
families.

---

## 4. Project structure

```
src/
  main.jsx            app entry
  App.jsx             screens, navigation, state
  index.css           all styles
  lib/
    firebase.js       Firebase connection (optional)
    store.js          storage: cloud OR on-device
    util.js           date helper, reduced-motion check
  data/
    content.js        timetable, milestones, teacher quotes, seed news
    teachers.js       28 teachers + their photos
    gallery.js        photo gallery
    icons.jsx         icon set + <Icon> component
  components/         Header, Nav, Lightbox, PinModal, SectionTitle
  views/              Home, About, Classes, Teachers, News, Apply, Staff
  assets/             logo, teacher photos, gallery images
```

---

## 5. Things to update

- **Phone number** on the About screen (`src/views/About.jsx`) is a placeholder.
- **Staff sign-in** is a shared PIN. For per-teacher logins later, Firebase
  Authentication (email + password) is the natural upgrade — it replaces the
  PIN check in `src/components/PinModal.jsx`.
- A couple of timetable entries list a teacher who isn't in the annual-book
  directory (e.g. Grade 6 Maths). Update `src/data/content.js` if needed.

---

## 6. The portal: Admin, Teacher, Student/Parent

The public school site (Home, About, Classes, Teachers, News, Apply) is open to
everyone. The **Sign in** button (top-right) opens the **portal**, which has
three roles:

- **Admin** — manage Students, Admissions, Teachers, Notices, Timetable and
  home-page Photos. When adding a teacher, the admin picks **one subject** and
  ticks the **grade(s)** they teach. Students belong to a grade, so a teacher is
  automatically responsible for the students in their assigned grade(s).
- **Teacher** — sees only their assigned grade(s), for their **own subject
  only**. They take **attendance** for their subject's class and enter
  **Sem 1 / Sem 2 marks** for that subject.
- **Student / Parent** — sees that child's marks and attendance **across all
  subjects and all teachers**, combined, with an overall attendance percentage
  and a per-subject breakdown.

### Demo logins (no setup needed)

The app ships with sample students, teachers and marks so you can explore every
screen in on-device mode:

- **Admin** — passcode `admin123`
- **Teacher** — code `T-101` (English, Grade 3), `T-103` (Maths, Grade 3), or `T-102` (English, Grades 5–6)
- **Student / Parent** — code `S-3001` … `S-3005` (Grade 3) or `S-5001` …
  `S-5003` (Grade 5)

Change the admin passcode in `.env` (`VITE_STAFF_PIN` is the old staff PIN;
the admin passcode lives in `src/data/school.js` as `ADMIN_PASSCODE` for the
demo — in production this is replaced by real logins, see below).

### Going to real logins (production)

Demo mode identifies people by a code with no password — fine for trying it out,
not for real student privacy. For production, switch to **Firebase
Authentication** (email + password):

1. Enable Email/Password sign-in in the Firebase console.
2. Create a `users` collection: one document per account with `role`
   (`admin` / `teacher` / `student`) and, for teachers/students, the linked
   record id.
3. Replace the three `login*` functions in `src/lib/auth.js` with Firebase
   Auth calls that look up the user's role. Everything else already keys off
   `session.role`, so no other screen changes.

Ask me and I'll wire this up for you.

### New data (Firestore collections / on-device keys)

- `students` — name, grade, code, parent, phone
- `staff` — teacher accounts (name, subject, grades, code)
- `marks` — one doc per `Grade|Subject|Term`, holding each student's score
- `attendance` — one doc per `Grade|Subject|Date`, holding each student's status
  (attendance is per subject class, since each teacher teaches one subject)
- `timetable` — admin-added class rows
- `gallery` — admin-added home-page photos

All of this lives behind the same `src/lib/store.js` — cloud when Firebase is
configured, on-device otherwise.

## 7. Ideas to add next

- **Report cards** — one tap turns a student's Sem 1 + Sem 2 marks into a
  printable PDF.
- **Photo uploads** from a phone (needs Firebase Storage; currently photos are
  added by link).
- **Homework / assignments** feed per grade.
- **Events calendar** (you already have the 2026–27 calendar).
- **Attendance analytics** for admin (class %, students below 75%).
