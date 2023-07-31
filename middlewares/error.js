module.exports = (err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        message: err.message
    });

    if (process.env.NODE_ENV === 'development') {
        res.send({
            message: err.message,
            stack: err.stack
        });
    }
}
