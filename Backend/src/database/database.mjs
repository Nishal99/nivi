import mysql2 from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create the connection pool with promise wrapper
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',  // your host, usually localhost
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Nivi@blares25',        // your MySQL password
  database: process.env.DB_NAME || 'visa_management',  // your database name
  waitForConnections: true,
   maxAllowedPacket: 16 * 1024 * 1024,  
  connectionLimit: 10,
  queueLimit: 0,
  // fail fast on bad hosts but allow a reasonable connect timeout
  connectTimeout: process.env.DB_CONNECT_TIMEOUT ? Number(process.env.DB_CONNECT_TIMEOUT) : 10000
};

const connection = mysql2.createPool(poolConfig);

// Get the promise wrapper
const promisePool = connection.promise();

// Try to get a connection with retries to give better startup resilience
async function testConnectionWithRetries(retries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await promisePool.getConnection();
      console.log('Connected to MySQL database...✅');
      conn.release();
      return;
    } catch (err) {
      console.error(`MySQL connection attempt ${attempt} failed:`,
        err && err.message ? err.message : err);
      if (attempt < retries) {
        console.log(`Retrying MySQL connection in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 2; // exponential backoff
        continue;
      }

      // Final failure: give actionable guidance
      console.error('\nFailed to connect to MySQL after', retries, 'attempts.');
      console.error('Common causes:');
      console.error('- MySQL server is not running. Start it (e.g., `sudo service mysql start` or use your OS service manager).');
      console.error('- DB_HOST/DB_PORT are incorrect in your .env. Current values:', {
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT
      });
      console.error('- Firewall or network blocking the connection to the DB host/port.');
      console.error('- Invalid DB credentials (DB_USER/DB_PASSWORD).');
      console.error('\nYou can also try connecting with the MySQL CLI:');
      console.error(`mysql -h ${poolConfig.host} -P ${poolConfig.port} -u ${poolConfig.user} -p`);

      // Re-throw the error so the caller can decide whether to exit
      throw err;
    }
  }
}

// Run the connection test on startup (do not block module export; callers may await the server start)
testConnectionWithRetries().catch(err => {
  // keep the original error logged above; optionally exit the process if desired
  console.error('Database startup check failed. See previous messages.');
});

export default promisePool;