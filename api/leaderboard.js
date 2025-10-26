import admin from "firebase-admin";

// Initialize Firebase (only once)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
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
}
