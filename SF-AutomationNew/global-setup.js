// global-setup.js
// Runs once before all tests to prepare output directories.

const fs   = require('fs');
const path = require('path');

module.exports = async () => {
  const dirs = ['screenshots', 'test-results', 'playwright-report'];
  for (const dir of dirs) {
    const full = path.join(__dirname, dir);
    if (!fs.existsSync(full)) {
      fs.mkdirSync(full, { recursive: true });
    }
  }
  console.log('  Output directories ready.');
};
