const express = require("express");
const { router } = require('./routes/LogQueryRoutes');
const { connectConsumer } = require('./controllers/LogConsumer');

const app = express();
const PORT = 9001;

// **Start Consumer**
connectConsumer().catch(console.error);

// **Add Router to Express app**
app.use('/api/v1', router)

// **Start Express Server**
app.listen(PORT, () => console.log(`LogFilter API running on port ${PORT}`));

// **Graceful Shutdown**
process.on("SIGTERM", async () => {
    console.log("Shutting down LogFilter...");
    await consumer.disconnect();
    process.exit(0);
});
