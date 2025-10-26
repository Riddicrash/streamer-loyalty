import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()))
  });
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
    return res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
