module.exports = (err, req, res) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
  });

  if (process.env.NODE_ENV === "development") {
    res.json({
      message: err.message,
      stack: err.stack,
    });
  }
};
