import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snap = await db.collection("viewers").orderBy("points", "desc").limit(50).get();
    const results = snap.docs.map(doc => ({ name: doc.data().name, points: doc.data().points || 0 }));
    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("🔥 Firestore error:", err);
    res.status(500).json({ error: err.message });
  }
}
