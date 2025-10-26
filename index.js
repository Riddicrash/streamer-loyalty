import express from "express";
import helmet from "helmet";
import cors from "cors";
import admin from "firebase-admin";

// Read service account either from base64 env var or raw JSON env var
let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  : process.env.FIREBASE_SERVICE_ACCOUNT || "";

if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT env var");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  console.error("Failed to parse service account JSON:", err);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const MASTER_API_KEY = process.env.MASTER_API_KEY || "devkey";
function requireApiKey(req, res, next) {
  const auth = req.headers.authorization || "";
  const match = auth.replace("Bearer ", "").trim();
  if (!match || match !== MASTER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/api/update", requireApiKey, async (req, res) => {
  try {
    const { viewer, points } = req.body;
    if (!viewer || typeof points !== "number") {
      return res.status(400).json({ error: "Invalid payload. Provide viewer (string) and points (number)." });
    }

    const id = viewer.toLowerCase();
    const ref = db.collection("viewers").doc(id);

    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const current = doc.exists ? (doc.data().points || 0) : 0;
      const updated = current + points;
      tx.set(ref, {
        name: viewer,
        points: updated,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    const newDoc = await ref.get();
    return res.json({ success: true, viewer: newDoc.data().name, total: newDoc.data().points });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/viewer/:name", async (req, res) => {
  const id = req.params.name.toLowerCase();
  const doc = await db.collection("viewers").doc(id).get();
  if (!doc.exists) return res.json({ viewer: req.params.name, points: 0 });
  return res.json({ viewer: doc.data().name, points: doc.data().points || 0 });
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50"), 200);
    const snap = await db.collection("viewers")
                       .orderBy("points", "desc")
                       .limit(limit)
                       .get();
    const results = [];
    snap.forEach(doc => {
      const d = doc.data();
      results.push({ name: d.name, points: d.points || 0 });
    });
    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => res.send("Riddicrash Loyalty API is running."));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
