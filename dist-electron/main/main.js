import { app as e, BrowserWindow as t } from "electron";
import n from "path";
function i() {
  const o = new t({
    width: 1200,
    height: 800,
    backgroundColor: "#0a0a0a",
    title: "MotherCore Digital Library",
    webPreferences: {
      preload: n.join(__dirname, "../preload/preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  });
  process.env.VITE_DEV_SERVER_URL ? (o.loadURL(process.env.VITE_DEV_SERVER_URL), o.webContents.openDevTools()) : o.loadFile(n.join(__dirname, "../../dist/index.html"));
}
e.whenReady().then(() => {
  i(), e.on("activate", function() {
    t.getAllWindows().length === 0 && i();
  });
});
e.on("window-all-closed", function() {
  process.platform !== "darwin" && e.quit();
});
