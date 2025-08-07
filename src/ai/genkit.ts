import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Configure Genkit with minimal setup
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash'
});
