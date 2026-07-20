const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/palata_mms")
  .then(async () => {
    const db = mongoose.connection.db;
    const flags = await db.collection("featureflags").find({}).toArray();
    console.log(JSON.stringify(flags, null, 2));
    process.exit(0);
  });
