/**
 * Quick check: product counts per category (same logic as GET /api/products/catalog-stats).
 * Usage: node scripts/checkDb.mjs   (from server/ folder, with .env present)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("ProductCheck", ProductSchema, "products");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in server/.env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const total = await Product.countDocuments({ isActive: { $ne: false } });
  const agg = await Product.aggregate([
    { $match: { isActive: { $ne: false } } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log("MongoDB:", uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
  console.log("Active products total:", total);
  console.log("By category:");
  for (const row of agg) {
    console.log(`  ${row._id || "(null)"}: ${row.count}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
