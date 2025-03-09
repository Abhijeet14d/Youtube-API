const express = require('express');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
dotenv.config();
const connectDB = require('./config/db.config.js');
const userRoutes = require('./routes/user.routes.js');
const videoRouter = require('./routes/video.routes.js');
connectDB();
const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}))

app.use("/api/user", userRoutes);
app.use("/api/video", videoRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});