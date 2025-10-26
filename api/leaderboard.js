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
  const { viewer } = req.query;

  try {
    let snapshot;
    if (viewer) {
      // Return a specific viewer
      const doc = await db.collection("leaderboard").doc(viewer).get();
      if (!doc.exists) {
        return res.json({ success: true, results: [{ name: viewer, points: 0 }] });
      }
      return res.json({ success: true, results: [doc.data()] });
    } else {
      // Return full leaderboard sorted by points descending
      snapshot = await db.collection("leaderboard")
                         .orderBy("points", "desc")
                         .get();
      const results = snapshot.docs.map(doc => doc.data());
      return res.json({ success: true, results });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
