const app = require('./app');
const { query } = require('./config/db');

async function startServer() {
  try {
    await query('SELECT 1');
    const port = Number(process.env.PORT || 5000);
    app.listen(port, () => {
      console.log(`Sweety API running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
}

startServer();
