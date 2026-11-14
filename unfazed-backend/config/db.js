const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("MAIN ERROR:", error.message);

    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.log("\nSERVER:", address);
        console.log("SERVER ERROR:", server.error?.message);
        console.log("CAUSE:", server.error?.cause?.message);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;

trycatch (error); {
  console.log("MAIN ERROR:", error.message);

  if (error.reason?.servers) {
    for (const [address, server] of error.reason.servers) {
      console.log("\nSERVER:", address);
      console.dir(server.error, { depth: 5 });
    }
  }

  process.exit(1);
}