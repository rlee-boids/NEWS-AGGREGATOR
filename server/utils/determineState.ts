import { stateKeywords } from './stateKeywords';

// Function to determine state based on title, description, and user states
export const determineState = (title: string, description: string, userStates: string[]): string => {
  for (const state of userStates) {
    const keywords = stateKeywords[state];
    if (keywords && keywords.some((keyword) => title.includes(keyword) || description.includes(keyword))) {
      return state;
    }
  }
  return 'General'; // Default to "General" if no state is matched
};
