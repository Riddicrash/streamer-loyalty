import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const MASTER_API_KEY = process.env.MASTER_API_KEY || "devkey";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  const match = auth.replace("Bearer ", "").trim();
  if (!match || match !== MASTER_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { viewer, points } = req.body;
    if (!viewer || typeof points !== "number") {
      return res.status(400).json({ error: "Provide viewer (string) and points (number)." });
    }

    const id = viewer.toLowerCase();
    const ref = db.collection("viewers").doc(id);

    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const current = doc.exists ? (doc.data().points || 0) : 0;
      tx.set(ref, {
        name: viewer,
        points: current + points,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    const newDoc = await ref.get();
    return res.json({ success: true, viewer: newDoc.data().name, total: newDoc.data().points });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
