import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Not found: ${req.method} ${req.path}`, 404, 'not_found'));
}
