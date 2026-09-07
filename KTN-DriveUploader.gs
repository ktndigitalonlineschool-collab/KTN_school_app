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
    return json({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
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
