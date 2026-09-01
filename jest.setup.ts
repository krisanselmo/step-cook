import '@testing-library/jest-dom';

// jsdom has no scrollIntoView, which the chat panel calls on new messages.
Element.prototype.scrollIntoView = jest.fn();
