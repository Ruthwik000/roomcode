import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  ablyApiKey: process.env.ABLY_API_KEY || ''
};

export function validateConfig(): boolean {
  if (!config.ablyApiKey) {
    console.error('ABLY_API_KEY is not set in .env file');
    return false;
  }
  return true;
}
