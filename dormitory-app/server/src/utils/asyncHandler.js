// Wraps an async Express handler so a rejected promise reaches the error middleware
// instead of becoming an unhandled rejection that crashes the process.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
