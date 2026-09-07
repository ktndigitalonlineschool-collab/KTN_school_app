# Auto-upload worksheets to the KTN Google Drive (free)

This connects the app to the school's own Google Drive so that when a teacher
uploads a worksheet (or a student uploads their work), the file is saved into
the KTN Drive automatically — no manual Drive step — and students can view and
download it inside the app. It uses a tiny Google Apps Script as a free backend
(no server, no credit card).

## 1. Create the script (on the KTN Google account)
1. Sign in to Google as **ktndigitalonlineschool@gmail.com**.
2. Go to **script.google.com** → **New project**.
3. Delete the sample code, paste the whole contents of **`KTN-DriveUploader.gs`**.
4. Near the top, change `var TOKEN = "CHANGE-ME-to-a-secret";` to your own secret
   phrase (any text). Remember it.
5. Click **Save** (disk icon).

## 2. Deploy it as a Web app
1. Click **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. **Execute as:** Me (the KTN account).  **Who has access:** Anyone.
4. **Deploy.** Google asks you to **authorise** — allow it (it's your own script
   writing to your own Drive).
5. Copy the **Web app URL** (ends in `/exec`).

## 3. Tell the app about it
In the project's `.env` add:
```
VITE_DRIVE_ENDPOINT=https://script.google.com/macros/s/AKf...your.../exec
VITE_DRIVE_TOKEN=the-same-secret-you-set-in-the-script
```
(Also add both on Vercel → Settings → Environment Variables, then redeploy.)

Restart `npm run dev`. Now the teacher's assignment form and the student page
show an **Upload** button; files land in **KTN Worksheets / <Grade>** in the KTN
Drive, and open in an in-app viewer with a Download option.

## Notes
- Files are set to **"anyone with the link — Viewer"** so students can open them.
  They live in the KTN Drive, owned by the school.
- Worksheets go to `KTN Worksheets/<Grade>`; student work goes to
  `KTN Worksheets/Submissions/<Grade>`.
- Free Google account = 15 GB, enough for many years of small worksheets.
- If uploads fail, re-check: the TOKEN matches in both places, the deployment is
  "Anyone" access, and you authorised the script. If you edit the script later,
  use **Deploy → Manage deployments → Edit → New version** so the URL keeps working.
- If the keys are absent, the app quietly falls back to the paste-a-link method —
  nothing breaks.
