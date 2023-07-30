module.exports = (err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            message: err.message
        }
    });

    if (process.env.NODE_ENV === 'development') {
        res.send({
            error: {
                message: err.message,
                stack: err.stack
            }
        });
    }
}
