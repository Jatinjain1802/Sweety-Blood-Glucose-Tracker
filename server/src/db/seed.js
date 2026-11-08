const { insertSampleData } = require("./sampleData");

/**
 * ============================================================================
 * 🌸 SWEETY — DATABASE SEED ENTRYPOINT
 * ============================================================================
 *
 * 🎓 Learning Note — Code Reusability (DRY Principle):
 * Instead of duplicating doctor and patient insertion logic across both
 * seed.js and sampleData.js, seed.js delegates to the centralized
 * insertSampleData function.
 *
 * This guarantees that running:
 *   - npm run seed
 *   - node src/db/seed.js
 *   - node src/db/sampleData.js
 * will always generate the exact same high-quality test environment with
 * doctors and patient records!
 * ============================================================================
 */

async function seedDatabase(options = {}) {
  return insertSampleData(options);
}

if (require.main === module) {
  seedDatabase({ closePool: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
