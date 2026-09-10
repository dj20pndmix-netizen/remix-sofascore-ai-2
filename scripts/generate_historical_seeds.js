import fs from 'fs';
import path from 'path';

const historyPath = path.join(process.cwd(), 'data', 'prediction_history.json');
const outputPath = path.join(process.cwd(), 'src', 'data', 'historicalSeeds.ts');

if (!fs.existsSync(historyPath)) {
  console.error('prediction_history.json not found');
  process.exit(1);
}

const raw = fs.readFileSync(historyPath, 'utf8');
const records = JSON.parse(raw);

console.log(`Read ${records.length} records from prediction_history.json`);

const tsContent = `/**
 * Pre-compiled authoritative historical prediction records
 * Bundled directly so serverless functions (Vercel) have immediate in-memory access
 * without relying on persistent local disk files.
 */
import type { HistoricalPredictionRecord } from '../types';

export const BUNDLED_HISTORICAL_SEEDS: HistoricalPredictionRecord[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log(`Successfully generated ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
