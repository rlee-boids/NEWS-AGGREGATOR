import { stateKeywords } from './stateKeywords';

// Function to determine state based on title and description
export const determineState = (title: string, description: string): string => {
  for (const [state, keywords] of Object.entries(stateKeywords)) {
    if (keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      return state;
    }
  }
  return 'General'; // Default to "General" if no state is matched
};
