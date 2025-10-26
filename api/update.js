import admin from "firebase-admin";

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
      )
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { viewer, points, key } = req.query;

  // Security check
  if (key !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!viewer || !points) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const docRef = db.collection("leaderboard").doc(viewer);
  const doc = await docRef.get();

  let newPoints = parseInt(points);

  if (doc.exists) {
    // Increment existing points
    newPoints = doc.data().points + newPoints;
    await docRef.update({ points: newPoints });
  } else {
    // First-time viewer, create document with starting points
    await docRef.set({ name: viewer, points: newPoints });
  }

  // Return updated viewer info
  return res.json({ success: true, results: [{ name: viewer, points: newPoints }] });
}
