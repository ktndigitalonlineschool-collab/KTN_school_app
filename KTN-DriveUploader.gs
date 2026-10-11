/**
 * KTN Drive Uploader — a tiny free "backend" that lives on the KTN Google
 * account. The app sends a file here; this saves it into the school's Drive
 * (under "KTN Worksheets / <folder>"), makes it viewable by link, and returns
 * links the app uses to view / download the file.
 *
 * DEPLOY (once): see DRIVE-SETUP.md. In short:
 *   1. script.google.com (signed in as the KTN account) → New project
 *   2. Paste this whole file.
 *   3. Set TOKEN below to a secret of your choice (also put it in the app's .env).
 *   4. Deploy → New deployment → Web app → Execute as: Me →
 *      Who has access: Anyone → Deploy → copy the /exec URL into the app's .env.
 */

var TOKEN = "CHANGE-ME-to-a-secret";     // must match VITE_DRIVE_TOKEN in the app
var ROOT_FOLDER_NAME = "KTN Worksheets";  // top folder created in the KTN Drive

function doGet() {
  return json({ ok: true, msg: "KTN Drive Uploader is running." });
}

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.token !== TOKEN) return json({ ok: false, error: "Unauthorized" });

    if (req.action === "upload") {
      var folder = getFolderByPath(req.folder || "General");
      var bytes = Utilities.base64Decode(req.dataBase64);
      var blob = Utilities.newBlob(bytes, req.mime || "application/octet-stream", req.name || "file");
      // Override: remove any existing file of the same name in this folder first,
      // so re-uploading the same grade/subject/file replaces it (no duplicates).
      var existing = folder.getFilesByName(req.name || "file");
      while (existing.hasNext()) { existing.next().setTrashed(true); }
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var id = file.getId();
      return json({
        ok: true, fileId: id, name: file.getName(),
        viewUrl: "https://drive.google.com/file/d/" + id + "/preview",
        openUrl: "https://drive.google.com/file/d/" + id + "/view",
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + id
      });
    }
    if (req.action === "list") {
      // Walk "KTN Books" (or req.root) two levels deep and return every file.
      //   <root>/<Category>/<Subject-or-Level>/<file>
      //   <root>/<Category>/<file>            (also included)
      // Category = "Grade 4", "Tamil", "Korean", ...
      var rootName = req.root || "KTN Books";
      var root = findFolderByName(rootName);
      if (!root) return json({ ok: true, books: [] });
      var books = [];
      var cats = root.getFolders();
      while (cats.hasNext()) {
        var cat = cats.next();
        var catName = cat.getName();
        collectFiles(cat, catName, "", books);          // files directly in the category
        var subs = cat.getFolders();
        while (subs.hasNext()) {
          var sub = subs.next();
          collectFiles(sub, catName, sub.getName(), books); // files in subject / level
        }
      }
      return json({ ok: true, books: books });
    }
    if (req.action === "notify") {
      var to = req.to || NOTIFY_EMAIL;
      var subject = req.subject || "KTN website notification";
      var opts = { name: "KTN Digital Online School" };
      if (req.html) opts.htmlBody = req.html;
      MailApp.sendEmail(to, subject, req.body || "", opts);
      return json({ ok: true, sent: true });
    }
    return json({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

var NOTIFY_EMAIL = "ktndigitalonlineschool@gmail.com"; // where alerts are sent

function findFolderByName(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : null;
}
function collectFiles(folder, cat, sub, out) {
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var id = f.getId();
    out.push({
      category: cat, sub: sub, title: f.getName(), fileId: id,
      openUrl: "https://drive.google.com/file/d/" + id + "/view",
      viewUrl: "https://drive.google.com/file/d/" + id + "/preview",
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + id
    });
  }
}
function getFolderByPath(path) {
  var parent = getOrCreate(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
  String(path).split("/").filter(function (s) { return s; }).forEach(function (seg) {
    parent = getOrCreate(parent, seg);
  });
  return parent;
}
function getOrCreate(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
