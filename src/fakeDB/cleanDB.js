const mongoose = require('mongoose');
const FakeDB = require('./FakeDB');
require('dotenv').config();

mongoose.connect(process.env.DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }, async () => {
      const fakeDB = new FakeDB();
      console.log("Starting to populate DB...");
      await fakeDB.populate();
      await mongoose.connection.close();
      console.log("DB has been populated!");
  });