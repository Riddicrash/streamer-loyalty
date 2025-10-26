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
    const { viewer } = req.query;

    if (viewer) {
      // Return only one viewer
      const doc = await db.collection("leaderboard").doc(viewer).get();
      if (!doc.exists) return res.json({ success: true, results: [] });
      return res.json({ success: true, results: [doc.data()] });
    }

    // Otherwise return all
    const snapshot = await db.collection("leaderboard").get();
    const results = snapshot.docs.map(doc => doc.data());
    return res.json({ success: true, count: results.length, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
