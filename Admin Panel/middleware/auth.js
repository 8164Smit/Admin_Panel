exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please login to access this page.');
  res.redirect('/auth/login');
};

exports.isGuest = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.redirect('/dashboard');
};
