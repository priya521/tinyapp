const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.set("view engine", "ejs");


//sample url database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID2" }
};


const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "1234"
  }
}




const { emailLooker } = require("./helpers.js");

const { generateRandomString } = require("./helpers.js");


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



//this function returns an object that contains URLs by userID
const userURLs = function (userID) {
  let final = {};
  for (let key in urlDatabase) {
    console.log("keys", key);
    console.log("userID", userID);
    if (userID === urlDatabase[key].userID) {
      final[key] = urlDatabase[key];
    }
  }
  console.log("final for userURLS", final);
  return final;
}



app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  for (let id in users) {
    if (users[id]['email'] === userEmail && bcrypt.compareSync(userPassword, users[id]['password'])) {
      req.session.userID = emailLooker(userEmail, users);
      res.redirect("/urls");
      return;
    }
  }
  res.status(403);
  res.send("Invalid username or password.");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('urls');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10)
  const randomID = generateRandomString();
  if (email === '' || password === '') {
    res.status(400);
    res.send("Invalid input! Please try again")
    return;
  } else if (emailLooker(email, users)) {
    res.status(400);
    res.send("email already exists")
  } else {
    users[randomID] = { id: randomID, email, password: hashedPassword }
    req.session.userID = randomID;
    req.session.username = email;
    res.redirect(`urls`);
  }
})
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: userURLs(req.session.userId),
    user: users[req.session.userId]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const cookie = req.session.userID
  if (cookie) {
    const templateVars = {
      urls: urlDatabase,
      username: req.session["username"],
      user: users[req.session["userID"]]
    };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login")
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
        if (!userURLs(req.session.userId)[req.params.shortURL]) {
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