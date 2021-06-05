require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./models/user");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const { nextTick } = require("process");
// const { rawListeners } = require("./models/user");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
//copy down
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// authenticate user
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//copy up
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.err_msg = req.flash("err_msg");
  next();
});

// connect to mongoDB
mongoose
  .connect("mongodb://localhost:27017/systemDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connnecting to mongoDB.");
  })
  .catch((e) => {
    console.log(e);
  });

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res, next) => {
  let { fullname, usertype, username, password, password2 } = req.body;
  //password matching
  if (password !== password2) {
    req.flash("err_msg", "Passwords don't match. Please check.");
    res.redirect("/register");
  } else {
    //email not registered yet
    try {
      let foundUser = await User.findOne({ username });
      if (foundUser) {
        req.flash("err_msg", "Email has been registered. Please check.");
        res.redirect("/register");
      } else {
        let newUser = new User(req.body);
        await User.register(newUser, password);
        req.flash(
          "success_msg",
          "Account has been created. You can login now."
        );
        res.redirect("/login");
      }
    } catch (err) {
      next();
    }
  }
});

app.listen(3000, () => {
  console.log("Server is now running on port 3000.");
});
