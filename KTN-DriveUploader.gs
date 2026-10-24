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

var TOKEN = "ktn-drive-2026";     // must match VITE_DRIVE_TOKEN in the app
var ROOT_FOLDER_NAME = "KTN Worksheets";  // top folder created in the KTN Drive

var VERSION = "books-list-v4";  // bump when redeploying; check it at the /exec URL

function doGet(e) {
  var p = (e && e.parameter) || {};
  var rootName = p.root || "KTN Books";
  // Open  <EXEC_URL>?action=list   to see exactly what the app would receive.
  if (p.action === "list") {
    return json({ ok: true, books: listBooks(rootName) });
  }
  // Open  <EXEC_URL>?debug=1   to see which folders/files the script can see.
  if (p.debug) {
    var root = findFolderByName(rootName);
    if (!root) {
      var names = [];
      var top = DriveApp.getRootFolder().getFolders();
      while (top.hasNext()) names.push(top.next().getName());
      return json({ ok: true, found: false, lookingFor: rootName,
        runningAs: Session.getEffectiveUser().getEmail(),
        note: "No folder named '" + rootName + "' is visible to this account.",
        topLevelFoldersInThisDrive: names });
    }
    var tree = [];
    var cats = root.getFolders();
    while (cats.hasNext()) {
      var cat = cats.next();
      var subsArr = [];
      var subs = cat.getFolders();
      while (subs.hasNext()) {
        var s = subs.next();
        subsArr.push({ name: s.getName(), files: countFiles(s) });
      }
      tree.push({ category: cat.getName(), filesDirectly: countFiles(cat), subfolders: subsArr });
    }
    return json({ ok: true, found: true, rootName: root.getName(), rootId: root.getId(),
      runningAs: Session.getEffectiveUser().getEmail(), version: VERSION, tree: tree });
  }
  return json({
    ok: true,
    msg: "KTN Drive Uploader is running.",
    version: VERSION,
    actions: ["upload", "list", "rename", "replace", "delete", "notify"]
  });
}

// Keep a file's original extension when a teacher renames it to a plain title.
function withExt(newName, oldName) {
  newName = String(newName || "").trim() || oldName;
  var m = String(oldName).match(/\.[A-Za-z0-9]+$/);
  if (m && newName.slice(-m[0].length).toLowerCase() !== m[0].toLowerCase()) return newName + m[0];
  return newName;
}

function countFiles(folder) {
  var n = 0, it = folder.getFiles();
  while (it.hasNext()) { it.next(); n++; }
  return n;
}
function listBooks(rootName) {
  var root = findFolderByName(rootName);
  if (!root) return [];
  var books = [];
  var cats = root.getFolders();
  while (cats.hasNext()) {
    var cat = cats.next();
    var catName = cat.getName();
    collectFiles(cat, catName, "", books);
    var subs = cat.getFolders();
    while (subs.hasNext()) {
      var sub = subs.next();
      collectFiles(sub, catName, sub.getName(), books);
    }
  }
  return books;
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
      return json({ ok: true, books: listBooks(req.root || "KTN Books") });
    }
    if (req.action === "rename") {
      var rf = DriveApp.getFileById(req.fileId);
      rf.setName(withExt(req.name, rf.getName()));
      return json({ ok: true, fileId: req.fileId, name: rf.getName() });
    }
    if (req.action === "replace") {
      // Swap a chapter's PDF for a new one, keeping the same name/location.
      var oldF = DriveApp.getFileById(req.fileId);
      var keepName = oldF.getName();
      var parents = oldF.getParents();
      var folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
      var bytes = Utilities.base64Decode(req.dataBase64);
      var blob = Utilities.newBlob(bytes, req.mime || "application/pdf", keepName);
      var nf = folder.createFile(blob);
      nf.setName(keepName);
      nf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      oldF.setTrashed(true);
      var rid = nf.getId();
      return json({
        ok: true, fileId: rid, name: nf.getName(),
        openUrl: "https://drive.google.com/file/d/" + rid + "/view",
        viewUrl: "https://drive.google.com/file/d/" + rid + "/preview",
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + rid
      });
    }
    if (req.action === "delete") {
      DriveApp.getFileById(req.fileId).setTrashed(true);
      return json({ ok: true, deleted: true });
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
