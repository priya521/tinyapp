// emailLookup - uses a user's email to find and return that user's object with the userDatabase.
const emailLookup = function(email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return false;
};

// generateRandomString - generates a random 6-digit alphanumeric string, for URL and cookie generation.
const generateRandomString = function() {
  let alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let output = "";
  for (let i = 0; i < 6; i++) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
};



// httpify - used to ensure all URLs have the http://www. or https://www. prefix
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

// urlsForUser - used to scan the urlDatabase and returns all URLs owned by the id in an object
const userURLs = function(id, database) {
  let output = {};
  for (let url in database) {
    if (id === database[url].userID) {
      output[url] = database[url];
    }
  }
  return output;
};

module.exports = { emailLookup, generateRandomString,  httpify, userURLs };