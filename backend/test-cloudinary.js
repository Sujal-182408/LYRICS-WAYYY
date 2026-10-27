import "dotenv/config";
import { testCloudinaryConnection } from "./config/cloudinary.js";

const connected = await testCloudinaryConnection();

if (!connected) {
  process.exitCode = 1;
}