"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineState = void 0;
const stateKeywords_1 = require("../config/stateKeywords"); // Adjust the path as needed
// Function to determine state based on title and description
const determineState = (title, description) => {
    for (const [state, keywords] of Object.entries(stateKeywords_1.stateKeywords)) {
        if (keywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
            return state;
        }
    }
    return 'General'; // Default to "General" if no state is matched
};
exports.determineState = determineState;
