exports.setGlobals = (req, res, next) => {
  res.locals.admin = req.user || null;
  res.locals.currentPath = req.path;
  next();
};
