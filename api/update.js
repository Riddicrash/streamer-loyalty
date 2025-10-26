import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
          "base64"
        ).toString()
      )
    ),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { viewer, points, channel, key } = req.query;

  if (key !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!viewer || !points || !channel) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const docRef = db.collection("leaderboard").doc(viewer);
  const doc = await docRef.get();

  const incrementPoints = parseInt(points);

  if (doc.exists) {
    const data = doc.data();

    // Initialize chatPoints object if missing
    if (!data.chatPoints) data.chatPoints = {};

    // Use the actual channel name as key
    data.chatPoints[channel] = (data.chatPoints[channel] || 0) + incrementPoints;

    await docRef.update({ chatPoints: data.chatPoints });
  } else {
    // New viewer, initialize with this channel
    const newData = {
      name: viewer,
      chatPoints: {
        [channel]: incrementPoints,
      },
    };
    await docRef.set(newData);
  }

  // Return full leaderboard with totals
  const snapshot = await db.collection("leaderboard").get();
  const results = snapshot.docs.map((doc) => {
    const data = doc.data();
    const totalPoints = data.chatPoints
      ? Object.values(data.chatPoints).reduce((a, b) => a + b, 0)
      : 0;
    return { name: data.name, totalPoints, chatPoints: data.chatPoints };
  });

  return res.json({ success: true, count: results.length, results });
}
