const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.set("view engine", "ejs");

const urlDatabase = {};

//const users = {};
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const generateRandomString = function() {
  let alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let output = "";
  for (let i = 0; i < 6; i++) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
};

const httpify = function(link) {
  let output = link;
  if (output.substring(0, 4) === "www.") {
    output = "http://" + link;
  }
  if (output.substring(0, 11) !== "http://www." && output.substring(0, 12) !== "https://www.") {
    output = "http://www." + link;
  }
  return output;
};

const emailLookup = function(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return false;
};

const urlsForUser = function(id) {
  let output = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};


app.post("/login", (req, res) => {
  if (!emailLookup(req.body.email)) {
    res.status(403).send("Error - email not found.");
  }
  if (!bcrypt.compareSync(req.body.password, emailLookup(req.body.email).password)) {
    res.status(403).send("Error - incorrect password.");
  }
  req.session.userId = emailLookup(req.body.email).id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('urls');
});

app.post("/register", (req, res) => {
  if (req.body.email === "") {
    res.status(400).send("Error - email left blank.");
  }
  if (req.body.password === "") {
    res.status(400).send("Error - password left blank.");
  }
  if (emailLookup(req.body.email)) {
    res.status(400).send("Error - email already registered.");
  }
  let newID = generateRandomString();
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.userId = newID;
  console.log(users);
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.userId),
    user: users[req.session.userId]
  };
  res.render("urls_index", templateVars);
});

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

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user: users[req.session.userId],
      wrongUser: function() {
        let output = false;
        if (!urlsForUser(req.session.userId)[req.params.shortURL]) {
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

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let newShort = generateRandomString();
  urlDatabase[newShort] = {
    longURL: httpify(req.body.longURL),
    userID: req.session.userId
  };
  res.redirect(`/urls/${newShort}`);
});

app.post("/urls/:id", (req, res) => {
  if (req.session.userId === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = httpify(req.body.longURL);
  }
  res.redirect(`/urls/${req.params.id}`);
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