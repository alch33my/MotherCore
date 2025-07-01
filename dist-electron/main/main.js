"use strict";
const electron = require("electron");
const url = require("url");
const path = require("path");
const Database = require("better-sqlite3");
const bcryptjs = require("bcryptjs");
require("fs");
const require$$0 = require("crypto");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __filename$2 = url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
path.dirname(__filename$2);
class DatabaseManager {
  db;
  static instance = null;
  constructor() {
    const userDataPath = electron.app.getPath("userData");
    const dbPath = path.join(userDataPath, "mothercore.db");
    this.db = new Database(dbPath, { verbose: console.log });
    this.initializeTables();
  }
  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  initializeTables() {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS auth (
        id INTEGER PRIMARY KEY,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        organization_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(organization_id) REFERENCES organizations(id)
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        spine_color TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id)
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        name TEXT NOT NULL,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(book_id) REFERENCES books(id)
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        chapter_id TEXT,
        title TEXT NOT NULL,
        content BLOB,
        content_text TEXT,
        page_type TEXT DEFAULT 'note',
        tags TEXT,
        position INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(chapter_id) REFERENCES chapters(id)
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        page_id TEXT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(page_id) REFERENCES pages(id)
      )
    `).run();
  }
  saveAuthCredentials(passwordHash, salt) {
    const stmt = this.db.prepare(`
      INSERT INTO auth (password_hash, salt) VALUES (?, ?)
    `);
    return stmt.run(passwordHash, salt);
  }
  getAuthCredentials() {
    const stmt = this.db.prepare("SELECT * FROM auth ORDER BY created_at DESC LIMIT 1");
    return stmt.get();
  }
  // Organization methods
  createOrganization(organization) {
    const { id, name, description = null, color = null, icon = null } = organization;
    const stmt = this.db.prepare(`
      INSERT INTO organizations (id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(id, name, description, color, icon);
    return result;
  }
  getOrganizations() {
    return this.db.prepare("SELECT * FROM organizations ORDER BY name").all();
  }
  getOrganization(id) {
    return this.db.prepare("SELECT * FROM organizations WHERE id = ?").get(id);
  }
  updateOrganization(organization) {
    const { id, name, description = null, color = null, icon = null } = organization;
    const stmt = this.db.prepare(`
      UPDATE organizations
      SET name = ?, description = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(name, description, color, icon, id);
  }
  deleteOrganization(id) {
    return this.db.prepare("DELETE FROM organizations WHERE id = ?").run(id);
  }
  // Project methods
  createProject(project) {
    const { id, organization_id, name, description = null, color = null } = project;
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, organization_id, name, description, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(id, organization_id, name, description, color);
  }
  getProjects(organizationId) {
    if (organizationId) {
      return this.db.prepare("SELECT * FROM projects WHERE organization_id = ? ORDER BY name").all(organizationId);
    }
    return this.db.prepare("SELECT * FROM projects ORDER BY name").all();
  }
  getProject(id) {
    return this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  }
  updateProject(project) {
    const { id, organization_id, name, description = null, color = null } = project;
    const stmt = this.db.prepare(`
      UPDATE projects
      SET organization_id = ?, name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(organization_id, name, description, color, id);
  }
  deleteProject(id) {
    return this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }
  // Book methods
  createBook(book) {
    const { id, project_id, name, description = null, cover_image = null, spine_color = null, position = null } = book;
    const stmt = this.db.prepare(`
      INSERT INTO books (id, project_id, name, description, cover_image, spine_color, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(id, project_id, name, description, cover_image, spine_color, position);
  }
  getBooks(projectId) {
    if (projectId) {
      return this.db.prepare("SELECT * FROM books WHERE project_id = ? ORDER BY position, name").all(projectId);
    }
    return this.db.prepare("SELECT * FROM books ORDER BY position, name").all();
  }
  getBook(id) {
    return this.db.prepare("SELECT * FROM books WHERE id = ?").get(id);
  }
  updateBook(book) {
    const { id, project_id, name, description = null, cover_image = null, spine_color = null, position = null } = book;
    const stmt = this.db.prepare(`
      UPDATE books
      SET project_id = ?, name = ?, description = ?, cover_image = ?, spine_color = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(project_id, name, description, cover_image, spine_color, position, id);
  }
  deleteBook(id) {
    return this.db.prepare("DELETE FROM books WHERE id = ?").run(id);
  }
  // Chapter methods
  createChapter(chapter) {
    const { id, book_id, name, position = null } = chapter;
    const stmt = this.db.prepare(`
      INSERT INTO chapters (id, book_id, name, position)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(id, book_id, name, position);
  }
  getChapters(bookId) {
    if (bookId) {
      return this.db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY position, name").all(bookId);
    }
    return this.db.prepare("SELECT * FROM chapters ORDER BY position, name").all();
  }
  getChapter(id) {
    return this.db.prepare("SELECT * FROM chapters WHERE id = ?").get(id);
  }
  updateChapter(chapter) {
    const { id, book_id, name, position = null } = chapter;
    const stmt = this.db.prepare(`
      UPDATE chapters
      SET book_id = ?, name = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(book_id, name, position, id);
  }
  deleteChapter(id) {
    return this.db.prepare("DELETE FROM chapters WHERE id = ?").run(id);
  }
  // Page methods
  createPage(page) {
    const { id, chapter_id, title, content = null, content_text = null, page_type = "note", tags = null, position = null } = page;
    const stmt = this.db.prepare(`
      INSERT INTO pages (id, chapter_id, title, content, content_text, page_type, tags, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const contentStr = content ? typeof content === "object" ? JSON.stringify(content) : content : null;
    return stmt.run(id, chapter_id, title, contentStr, content_text, page_type, tags, position);
  }
  getPages(chapterId) {
    if (chapterId) {
      return this.db.prepare("SELECT id, chapter_id, title, page_type, tags, position, created_at, updated_at FROM pages WHERE chapter_id = ? ORDER BY position, title").all(chapterId);
    }
    return this.db.prepare("SELECT id, chapter_id, title, page_type, tags, position, created_at, updated_at FROM pages ORDER BY position, title").all();
  }
  getPage(id) {
    return this.db.prepare("SELECT * FROM pages WHERE id = ?").get(id);
  }
  getPageContent(id) {
    const result = this.db.prepare("SELECT content FROM pages WHERE id = ?").get(id);
    if (!result) {
      return null;
    }
    try {
      return JSON.parse(result.content);
    } catch {
      return result.content;
    }
  }
  updatePageContent(id, content, plainText) {
    const contentStr = typeof content === "object" ? JSON.stringify(content) : content;
    const stmt = this.db.prepare(`
      UPDATE pages
      SET content = ?, content_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(contentStr, plainText, id);
  }
  updatePage(page) {
    const { id, chapter_id, title, page_type = "note", tags = null, position = null } = page;
    const stmt = this.db.prepare(`
      UPDATE pages
      SET chapter_id = ?, title = ?, page_type = ?, tags = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(chapter_id, title, page_type, tags, position, id);
  }
  deletePage(id) {
    return this.db.prepare("DELETE FROM pages WHERE id = ?").run(id);
  }
  close() {
    this.db.close();
  }
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dist = {};
var v1 = {};
var rng = {};
var hasRequiredRng;
function requireRng() {
  if (hasRequiredRng) return rng;
  hasRequiredRng = 1;
  Object.defineProperty(rng, "__esModule", {
    value: true
  });
  rng.default = rng$1;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const rnds8Pool = new Uint8Array(256);
  let poolPtr = rnds8Pool.length;
  function rng$1() {
    if (poolPtr > rnds8Pool.length - 16) {
      _crypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
  return rng;
}
var stringify = {};
var validate = {};
var regex = {};
var hasRequiredRegex;
function requireRegex() {
  if (hasRequiredRegex) return regex;
  hasRequiredRegex = 1;
  Object.defineProperty(regex, "__esModule", {
    value: true
  });
  regex.default = void 0;
  var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  regex.default = _default;
  return regex;
}
var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate;
  hasRequiredValidate = 1;
  Object.defineProperty(validate, "__esModule", {
    value: true
  });
  validate.default = void 0;
  var _regex = _interopRequireDefault(/* @__PURE__ */ requireRegex());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function validate$1(uuid2) {
    return typeof uuid2 === "string" && _regex.default.test(uuid2);
  }
  var _default = validate$1;
  validate.default = _default;
  return validate;
}
var hasRequiredStringify;
function requireStringify() {
  if (hasRequiredStringify) return stringify;
  hasRequiredStringify = 1;
  Object.defineProperty(stringify, "__esModule", {
    value: true
  });
  stringify.default = void 0;
  stringify.unsafeStringify = unsafeStringify;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }
  function stringify$1(arr, offset = 0) {
    const uuid2 = unsafeStringify(arr, offset);
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid2;
  }
  var _default = stringify$1;
  stringify.default = _default;
  return stringify;
}
var hasRequiredV1;
function requireV1() {
  if (hasRequiredV1) return v1;
  hasRequiredV1 = 1;
  Object.defineProperty(v1, "__esModule", {
    value: true
  });
  v1.default = void 0;
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng());
  var _stringify = /* @__PURE__ */ requireStringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  let _nodeId;
  let _clockseq;
  let _lastMSecs = 0;
  let _lastNSecs = 0;
  function v1$1(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node || _nodeId;
    let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      }
      if (clockseq == null) {
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
      }
    }
    let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
    let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === void 0) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 122192928e5;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i++] = tl >>> 24 & 255;
    b[i++] = tl >>> 16 & 255;
    b[i++] = tl >>> 8 & 255;
    b[i++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i++] = tmh >>> 8 & 255;
    b[i++] = tmh & 255;
    b[i++] = tmh >>> 24 & 15 | 16;
    b[i++] = tmh >>> 16 & 255;
    b[i++] = clockseq >>> 8 | 128;
    b[i++] = clockseq & 255;
    for (let n = 0; n < 6; ++n) {
      b[i + n] = node[n];
    }
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = v1$1;
  v1.default = _default;
  return v1;
}
var v3 = {};
var v35 = {};
var parse = {};
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse;
  hasRequiredParse = 1;
  Object.defineProperty(parse, "__esModule", {
    value: true
  });
  parse.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function parse$1(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid2.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid2.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid2.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid2.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid2.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = parse$1;
  parse.default = _default;
  return parse;
}
var hasRequiredV35;
function requireV35() {
  if (hasRequiredV35) return v35;
  hasRequiredV35 = 1;
  Object.defineProperty(v35, "__esModule", {
    value: true
  });
  v35.URL = v35.DNS = void 0;
  v35.default = v35$1;
  var _stringify = /* @__PURE__ */ requireStringify();
  var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0; i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
  const DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  v35.DNS = DNS;
  const URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  v35.URL = URL2;
  function v35$1(name, version2, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      var _namespace;
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (((_namespace = namespace) === null || _namespace === void 0 ? void 0 : _namespace.length) !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version2;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = bytes[i];
        }
        return buf;
      }
      return (0, _stringify.unsafeStringify)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {
    }
    generateUUID.DNS = DNS;
    generateUUID.URL = URL2;
    return generateUUID;
  }
  return v35;
}
var md5 = {};
var hasRequiredMd5;
function requireMd5() {
  if (hasRequiredMd5) return md5;
  hasRequiredMd5 = 1;
  Object.defineProperty(md5, "__esModule", {
    value: true
  });
  md5.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function md5$1(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = md5$1;
  md5.default = _default;
  return md5;
}
var hasRequiredV3;
function requireV3() {
  if (hasRequiredV3) return v3;
  hasRequiredV3 = 1;
  Object.defineProperty(v3, "__esModule", {
    value: true
  });
  v3.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35());
  var _md = _interopRequireDefault(/* @__PURE__ */ requireMd5());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v3$1 = (0, _v.default)("v3", 48, _md.default);
  var _default = v3$1;
  v3.default = _default;
  return v3;
}
var v4$1 = {};
var native = {};
var hasRequiredNative;
function requireNative() {
  if (hasRequiredNative) return native;
  hasRequiredNative = 1;
  Object.defineProperty(native, "__esModule", {
    value: true
  });
  native.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _default = {
    randomUUID: _crypto.default.randomUUID
  };
  native.default = _default;
  return native;
}
var hasRequiredV4;
function requireV4() {
  if (hasRequiredV4) return v4$1;
  hasRequiredV4 = 1;
  Object.defineProperty(v4$1, "__esModule", {
    value: true
  });
  v4$1.default = void 0;
  var _native = _interopRequireDefault(/* @__PURE__ */ requireNative());
  var _rng = _interopRequireDefault(/* @__PURE__ */ requireRng());
  var _stringify = /* @__PURE__ */ requireStringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function v42(options, buf, offset) {
    if (_native.default.randomUUID && !buf && !options) {
      return _native.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0; i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(rnds);
  }
  var _default = v42;
  v4$1.default = _default;
  return v4$1;
}
var v5 = {};
var sha1 = {};
var hasRequiredSha1;
function requireSha1() {
  if (hasRequiredSha1) return sha1;
  hasRequiredSha1 = 1;
  Object.defineProperty(sha1, "__esModule", {
    value: true
  });
  sha1.default = void 0;
  var _crypto = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function sha1$1(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = sha1$1;
  sha1.default = _default;
  return sha1;
}
var hasRequiredV5;
function requireV5() {
  if (hasRequiredV5) return v5;
  hasRequiredV5 = 1;
  Object.defineProperty(v5, "__esModule", {
    value: true
  });
  v5.default = void 0;
  var _v = _interopRequireDefault(/* @__PURE__ */ requireV35());
  var _sha = _interopRequireDefault(/* @__PURE__ */ requireSha1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const v5$1 = (0, _v.default)("v5", 80, _sha.default);
  var _default = v5$1;
  v5.default = _default;
  return v5;
}
var nil = {};
var hasRequiredNil;
function requireNil() {
  if (hasRequiredNil) return nil;
  hasRequiredNil = 1;
  Object.defineProperty(nil, "__esModule", {
    value: true
  });
  nil.default = void 0;
  var _default = "00000000-0000-0000-0000-000000000000";
  nil.default = _default;
  return nil;
}
var version = {};
var hasRequiredVersion;
function requireVersion() {
  if (hasRequiredVersion) return version;
  hasRequiredVersion = 1;
  Object.defineProperty(version, "__esModule", {
    value: true
  });
  version.default = void 0;
  var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function version$1(uuid2) {
    if (!(0, _validate.default)(uuid2)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid2.slice(14, 15), 16);
  }
  var _default = version$1;
  version.default = _default;
  return version;
}
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  (function(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "NIL", {
      enumerable: true,
      get: function() {
        return _nil.default;
      }
    });
    Object.defineProperty(exports, "parse", {
      enumerable: true,
      get: function() {
        return _parse.default;
      }
    });
    Object.defineProperty(exports, "stringify", {
      enumerable: true,
      get: function() {
        return _stringify.default;
      }
    });
    Object.defineProperty(exports, "v1", {
      enumerable: true,
      get: function() {
        return _v.default;
      }
    });
    Object.defineProperty(exports, "v3", {
      enumerable: true,
      get: function() {
        return _v2.default;
      }
    });
    Object.defineProperty(exports, "v4", {
      enumerable: true,
      get: function() {
        return _v3.default;
      }
    });
    Object.defineProperty(exports, "v5", {
      enumerable: true,
      get: function() {
        return _v4.default;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _validate.default;
      }
    });
    Object.defineProperty(exports, "version", {
      enumerable: true,
      get: function() {
        return _version.default;
      }
    });
    var _v = _interopRequireDefault(/* @__PURE__ */ requireV1());
    var _v2 = _interopRequireDefault(/* @__PURE__ */ requireV3());
    var _v3 = _interopRequireDefault(/* @__PURE__ */ requireV4());
    var _v4 = _interopRequireDefault(/* @__PURE__ */ requireV5());
    var _nil = _interopRequireDefault(/* @__PURE__ */ requireNil());
    var _version = _interopRequireDefault(/* @__PURE__ */ requireVersion());
    var _validate = _interopRequireDefault(/* @__PURE__ */ requireValidate());
    var _stringify = _interopRequireDefault(/* @__PURE__ */ requireStringify());
    var _parse = _interopRequireDefault(/* @__PURE__ */ requireParse());
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
  })(dist);
  return dist;
}
var distExports = /* @__PURE__ */ requireDist();
const uuid = /* @__PURE__ */ getDefaultExportFromCjs(distExports);
uuid.v1;
uuid.v3;
const v4 = uuid.v4;
uuid.v5;
uuid.NIL;
uuid.version;
uuid.validate;
uuid.stringify;
uuid.parse;
const __filename$1 = url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
let dbManager;
let mainWindow = null;
function createWindow() {
  const preloadPath = electron.app.isPackaged ? path.join(__dirname$1, "..", "preload", "preload.js") : path.join(__dirname$1, "../../dist-electron/preload/preload.js");
  console.log("Preload script path:", preloadPath);
  console.log("Current directory:", __dirname$1);
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0a0a0a",
    title: "MotherCore Digital Library",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
      // Allow access to Node.js APIs in preload script
    },
    // Remove default frame for custom title bar
    frame: false
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../../dist/index.html"));
  }
  mainWindow.webContents.openDevTools();
}
function initializeApplication() {
  try {
    console.log("Initializing database...");
    dbManager = DatabaseManager.getInstance();
    console.log("Database initialized successfully");
    electron.ipcMain.handle("minimizeWindow", () => {
      if (mainWindow) mainWindow.minimize();
      return true;
    });
    electron.ipcMain.handle("maximizeWindow", () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
      return true;
    });
    electron.ipcMain.handle("closeWindow", () => {
      if (mainWindow) mainWindow.close();
      return true;
    });
    electron.ipcMain.handle("check-auth-status", () => {
      const credentials = dbManager.getAuthCredentials();
      return !!credentials;
    });
    electron.ipcMain.handle("setup-auth", async (event, password) => {
      try {
        const salt = bcryptjs.genSaltSync(10);
        const passwordHash = bcryptjs.hashSync(password, salt);
        dbManager.saveAuthCredentials(passwordHash, salt);
        return { success: true };
      } catch (error) {
        console.error("Auth setup error:", error);
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("authenticate", async (event, password) => {
      try {
        const auth = dbManager.getAuthCredentials();
        if (!auth) return false;
        return bcryptjs.compareSync(password, auth.password_hash);
      } catch (error) {
        console.error("Authentication error:", error);
        return false;
      }
    });
    electron.ipcMain.handle("create-organization", async (_, data) => {
      try {
        const id = v4();
        await dbManager.createOrganization({
          id,
          ...data
        });
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-organizations", async () => {
      try {
        const organizations = await dbManager.getOrganizations();
        return { success: true, organizations };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("create-project", async (_, data) => {
      try {
        const id = v4();
        await dbManager.createProject({
          id,
          ...data
        });
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-projects", async (_, orgId) => {
      try {
        const projects = await dbManager.getProjects(orgId);
        return { success: true, projects };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("create-book", async (_, data) => {
      try {
        const id = v4();
        await dbManager.createBook({
          id,
          ...data
        });
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-books", async (_, projectId) => {
      try {
        const books = await dbManager.getBooks(projectId);
        return { success: true, books };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("create-chapter", async (_, data) => {
      try {
        const id = v4();
        await dbManager.createChapter({
          id,
          ...data
        });
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-chapters", async (_, bookId) => {
      try {
        const chapters = await dbManager.getChapters(bookId);
        return { success: true, chapters };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("create-page", async (_, data) => {
      try {
        const id = v4();
        await dbManager.createPage({
          id,
          ...data
        });
        return { success: true, id };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-pages", async (_, chapterId) => {
      try {
        const pages = await dbManager.getPages(chapterId);
        return { success: true, pages };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("get-page-content", async (_, pageId) => {
      try {
        const content = await dbManager.getPageContent(pageId);
        return { success: true, content };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("update-page-content", async (_, pageId, content, plainText) => {
      try {
        await dbManager.updatePageContent(pageId, content, plainText);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    electron.ipcMain.handle("select-directory", async () => {
      const result = await electron.dialog.showOpenDialog({
        properties: ["openDirectory"]
      });
      if (result.canceled) {
        return { canceled: true };
      }
      return { canceled: false, path: result.filePaths[0] };
    });
    electron.ipcMain.on("log-error", (_, error) => {
      console.error("Application Error:", error);
    });
  } catch (error) {
    console.error("Error initializing application:", error);
  }
}
electron.app.whenReady().then(() => {
  initializeApplication();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", function() {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("will-quit", () => {
  if (dbManager) {
    dbManager.close();
  }
});
