// Tiny drag modifier (avoids an extra dependency on @dnd-kit/modifiers).
export const restrictToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });
