import '@testing-library/jest-dom';

// jsdom n'implémente pas scrollIntoView, utilisé par le panneau de chat pour
// suivre les nouveaux messages.
Element.prototype.scrollIntoView = jest.fn();
