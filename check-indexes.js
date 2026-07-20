const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/palikaos_live")
  .then(async () => {
    const db = mongoose.connection.db;
    const collection = db.collection("featureflags");
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    process.exit(0);
  });
