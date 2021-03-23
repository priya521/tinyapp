const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const helper = require('./helpers.js');
const cookieParser = require('cookie-parser');


app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

app.use(cookieParser());

app.set("view engine", "ejs");

// Global databases
const urlDatabase = {};

const users = {};


//on the get route for /urls, if the user is logged in (through cookies), we render urls_index.
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: helper.userURLs(req.session.userId, urlDatabase),
    user: users[req.session.userId]
  };
  res.render("urls_index", templateVars);
});



//urls on the urls_new template in views. Otherwise, we redirect them to the login page.
app.get("/urls/new", (req, res) => {

  if (!users[req.session.userId]) {
    res.redirect('/login');
  }

  const templateVars = {
    user: users[req.session.userId]
  };

  res.render("urls_new", templateVars);
});


app.get("/register", (req, res) => {

  const templateVars = {
    user: users[req.session.userId]
  };

  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {

  const templateVars = {
    user: users[req.session.userId]
  };

  res.render("urls_login", templateVars);
});


//if you are logged in, you will see your own short url page. 
app.get("/urls/:shortURL", (req, res) => {

  if (urlDatabase[req.params.shortURL]) {

    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userId],
      wrongUser: function() {
        let output = false;
        if (!helper.userURLs(req.session.userId, urlDatabase)[req.params.shortURL]) {
          output = true;
        }
        return output;
      }
    };

    res.render("urls_show", templateVars);

  } else {
    res.status(404).send(`Error 404 - ${req.params.shortURL} not found.`);
  }

});


//at shortURL, if logged in, it will redirects to longURL when clicked on shortURL
app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});



//we will render the login page at root
app.get("/", (req, res) => {

  if (users[req.session.userId]) {
    res.redirect("/urls");
  }

  res.redirect("/login");
});


app.post("/login", (req, res) => {

  if (!helper.emailLookup(req.body.email, users)) {
    res.status(403).send("Error - email not found.");
  }

  if (!bcrypt.compareSync(req.body.password, helper.emailLookup(req.body.email, users).password)) {
    res.status(403).send("Error - incorrect password.");
  }

  req.session.userId = helper.emailLookup(req.body.email, users).id;
  res.redirect('/urls');
});



//allows the user to logout, clears their cookies.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {

  if (req.body.email === "") {
    res.status(400).send("Error - email left blank.");
  }

  if (req.body.password === "") {
    res.status(400).send("Error - password left blank.");
  }

  if (helper.emailLookup(req.body.email, users)) {
    res.status(400).send("Error - email already registered.");
  }

  if (req.body.email && req.body.password) {
    let newID = helper.generateRandomString();

    users[newID] = {
      id: newID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };

    req.session.userId = newID;
  }


  res.redirect('/urls');
});

app.post("/urls", (req, res) => {

  if (!req.session.userId) {
    res.status(401).send("Error - unauthorized access. Please log in to view your URLs.");
  }

  let newShort = helper.generateRandomString();
  urlDatabase[newShort] = {
    longURL: helper.httpify(req.body.longURL),
    userID: req.session.userId,
  };
  res.redirect(`/urls/${newShort}`);

});

app.post("/urls/:id", (req, res) => {

  if (req.session.userId === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = helper.httpify(req.body.longURL);
  }

  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => {

  if (req.session.userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyURL server listening on port ${PORT}!`);
});