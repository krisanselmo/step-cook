import '@testing-library/jest-dom';

// jsdom has no scrollIntoView, which the chat panel calls on new messages.
// Server tests run in the node environment, without Element.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}
