import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SERVICE_ACCOUNT = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
);

if (!getApps().length) {
  initializeApp({
    credential: cert(SERVICE_ACCOUNT),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  const { viewer, points, key } = req.query;

  // Check API key
  if (key !== process.env.MASTER_API_KEY) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  if (!viewer || !points) {
    return res.status(400).json({ error: "Missing viewer or points parameter" });
  }

  try {
    const docRef = db.collection("leaderboard").doc(viewer);
    const doc = await docRef.get();

    if (doc.exists) {
      await docRef.update({
        points: doc.data().points + Number(points),
      });
    } else {
      await docRef.set({
        name: viewer,
        points: Number(points),
      });
    }

    const snapshot = await db.collection("leaderboard").get();
    const results = snapshot.docs.map(d => d.data());

    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    console.error("Firestore error:", err);
    return res.status(500).json({ error: err.message });
  }
}
