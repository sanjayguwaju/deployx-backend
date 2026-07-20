const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/palikaos_live")
  .then(async () => {
    const db = mongoose.connection.db;
    const collection = db.collection("featureflags");
    try {
      await collection.dropIndex("key_1");
      console.log("Dropped key_1 index successfully.");
    } catch (err) {
      console.log("Index might not exist or another error:", err.message);
    }
    process.exit(0);
  });
