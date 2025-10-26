import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { viewer, points, key } = req.query;

  if (key !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!viewer || !points) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const docRef = db.collection("leaderboard").doc(viewer);
  const doc = await docRef.get();

  if (doc.exists) {
    await docRef.update({ points: doc.data().points + parseInt(points) });
  } else {
    await docRef.set({ name: viewer, points: parseInt(points) });
  }

  const snapshot = await db.collection("leaderboard").get();
  const results = snapshot.docs.map(doc => doc.data());

  return res.json({ success: true, count: results.length, results });
}
