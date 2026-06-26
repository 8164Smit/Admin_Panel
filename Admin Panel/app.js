require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const passport = require('passport');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const path = require('path');

const connectDB = require('./config/db');
const configurePassport = require('./config/passport');
const { setFlashLocals } = require('./middleware/flash');
const { setGlobals } = require('./middleware/globals');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const extraCategoryRoutes = require('./routes/extraCategoryRoutes');
const productRoutes = require('./routes/productRoutes');

const Admin = require('./models/Admin');

const startServer = async () => {
  await connectDB();
  
  // Auto-seed admin user for the in-memory database
  const adminExists = await Admin.findOne({ email: 'admin@adminpanel.com' });
  if (!adminExists) {
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@adminpanel.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('✅ Default Admin created: admin@adminpanel.com / admin123');
  }

  configurePassport(passport);

  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(setFlashLocals);
  app.use(setGlobals);

  app.get('/', (req, res) => res.redirect('/dashboard'));
  app.use('/auth', authRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/profile', profileRoutes);
  app.use('/category', categoryRoutes);
  app.use('/subcategory', subcategoryRoutes);
  app.use('/extracategory', extraCategoryRoutes);
  app.use('/product', productRoutes);

  app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found', layout: 'layouts/main' });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    req.flash('error', err.message || 'Something went wrong!');
    res.status(500).redirect('back');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
};

startServer();
