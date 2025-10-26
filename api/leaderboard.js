import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString())
    )
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("leaderboard").get();
    const results = snapshot.docs.map(doc => doc.data());
    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
