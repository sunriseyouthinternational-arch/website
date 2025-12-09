module.exports = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: '晨光國際少年團 API - Sunrise Youth International API',
    timestamp: new Date().toISOString()
  });
};
