// Centralized error handler
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);
    
    // Log stack trace only in development, avoid sending to client
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    let statusCode = err.statusCode || 500;
    let message = 'Internal Server Error';

    // Handle JSON parsing errors specifically
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON payload';
    } else if (err.code === 'ER_DUP_ENTRY') {
        // Handle MySQL duplicate entry gracefully
        statusCode = 409;
        message = 'A record with this value already exists.';
    } else if (err.statusCode) {
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        message: message
    });
};

module.exports = errorHandler;
