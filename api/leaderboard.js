app.get("/api/leaderboard", async (req, res) => {
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
    console.error("🔥 Firestore error:", err); // <-- log the real error
    return res.status(500).json({ error: err.message }); // <-- return the real message
  }
});
