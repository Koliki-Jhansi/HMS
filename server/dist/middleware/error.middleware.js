"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    console.error(`💥 [${req.method} ${req.originalUrl}] Error:`, err);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error occurred';
    // Handle Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        message = `Duplicate value error: ${field} '${value}' is already in use. Please use another value.`;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors || {}).map((e) => e.message);
        message = `Validation Error: ${errors.join(', ')}`;
    }
    // Handle Mongoose cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ID format for field '${err.path}': '${err.value}'`;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token. Please log in again.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please log in again.';
    }
    // Handle MongoDB disconnected / timeout
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
        statusCode = 503;
        message = 'Database service temporarily unavailable. MongoDB connection is not active.';
    }
    res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        ...(process.env.NODE_ENV !== 'production' && {
            errorName: err.name,
            details: err.message,
            stack: err.stack,
        }),
    });
};
exports.errorHandler = errorHandler;
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
