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
const urlDatabase = { }

//users information is added here. Ids are random.
const users = { }

const { emailLooker ,generateRandomString} = require("./helpers.js");


//this function returns an object that contains URLs by userID
const userURLs = function (userID) {
  let final = {};
  for (let key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      final[key] = urlDatabase[key];
    }
  }
  return final;
}


//on the get route for /urls, if the user is logged in (through cookies), we render urls_index.
//otherwise, we redirect them to the login page.
app.get("/urls", (req, res) => {
  const cookie = req.session.userID
  if (cookie) {
    const templateVars = {
      urls: userURLs(cookie),
      username: req.session["username"],
      user: users[req.session["userID"]]
    };
    res.render("urls_index", templateVars);
  } else {
    res.send("Please login to see url");
  }
});

//urls on the urls_new template in views. Otherwise, we redirect them to the login page.
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
  }
  if (req.session.userId) {
    res.redirect("/urls"); // when a user already logged-in, the register page does not appear
  } else {
    res.render("urls_register", templateVars);
  }
  
});


app.get("/login", (req, res) => {
  const templateVars = { 
    user: users[req.session.userId] 
  }
  if (req.session.userId) {
    res.redirect("/urls"); // when a user already logged-in, the login page does not appear
  } else {
    res.render("urls_login", templateVars);
  }
  
});

//if you are logged in, you will see your own short url page. 

app.get('/urls/:shortURL', (req, res) => {
if (urlDatabase[req.params.shortURL]) {

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.userId],
    date: urlDatabase[req.params.shortURL].dateCreated,
    wrongUser: function() {
      let output = false;
      if (!userURLs(req.session.userId, urlDatabase)[req.params.shortURL]) {
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
  const longURL = urlDatabase[req.params.shortURL]["longURL"]
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('https://http.cat/404');
  }
});



//we will render the registration page at root
app.get("/", (req, res) => {
  if (users[req.session.userId]) {
    res.redirect("/urls");
  }

  res.redirect("/login");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//when on login, we check if user email and password match what's in our database (passwords are hashed),
//and redirect the user to their own shorturls page. Otherwise, it will throw error
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


//registers a user when they input information that already existent within the database.
//hashes the password, passes it to the users object, redirects the user to urls.
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
});



//posts a users unique links to urls page.
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userID = req.session["userID"];
  if (!users[userID]) {
    res.status(403).send('403 Forbidden')
    return;
  }
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID, };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const userID = req.session["userID"];
  if (userID === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL, userID, };
  }
  res.redirect(`/urls`);       
});


//allows the user to delete their own urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"];
  if (userID === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect(`/urls`);
});


//allows the user to logout, clears their cookies.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`TinyURL server listening on port ${PORT}!`);
});