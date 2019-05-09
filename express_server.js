// Required Modules:
const express = require('express');
const morgan = require('morgan'); // console logs get/post request to help with development
const cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// Gloal Objects:
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  iaDFej: { longURL: "http://lighthouse.ca", userID: "kRYfIf"}
};

const users = { 
  "aJ48lW": {
    id: "aJ48lW", 
    email: "test@test.com", 
    password: "test"
  },
  "kRYfIf": {
    id: "kRYfIf", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

// Global functions:
function generateRandomString() {
  const char = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let output = '';
  for (let i = 0; i < 6; i++){
    output += char[Math.floor(Math.random() * char.length)];
  };
  return output;
}

function emailLookUp(email){
  for (let person in users){
    if (users[person].email === email){
      return users[person];
    }
  }
  return false;
}

function urlsForUser(id){
  let output = {};
  for (let links in urlDatabase){
    if (urlDatabase[links].userID === id){
      output[links] = urlDatabase[links];
    }
  }
  return output;
}


// Server endpoints:
app.get('/', (req, res) => {
  if (req.cookies.user_id){
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  } 
});

app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: users[req.cookies.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if(req.cookies.user_id){
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const userlink = urlsForUser(req.cookies.user_id)
  if (!urlDatabase[req.params.shortURL] || !userlink[req.params.shortURL]){  //Make sure the shortURL link exists in the first place so website doesn't crash
    res.status('400');
    res.send('This url does not exist or not available for you to edit')
  }
  
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[req.cookies.user_id]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.post('/urls', (req, res) => {
  const short = generateRandomString();
  urlDatabase[short] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }; // updating urlDatabase with objects of shortURL: longURL/userID 
  res.redirect('/urls/'+short);
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect('/urls/');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/login', (req, res) =>{
  if (req.cookies.user_id){
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render('urls_login', templateVars);
  }
});

app.get ('/register', (req,res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render('urls_register', templateVars);
});

app.post ('/register', (req,res) =>{
  
  if (!req.body.email || !req.body.password || emailLookUp(req.body.email)){
    res.status('400');
    res.send('Error 400 - Bad Request!');
  }
  
  newID = generateRandomString();
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', newID); //issued cookie upon registration
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const userAccount = emailLookUp(req.body.email);
  if (userAccount){
    if (userAccount.password === req.body.password){
      res.cookie('user_id', userAccount.id); //issued cookie after log in
      res.redirect('/urls');
    } else {
      res.status('403')
      res.send('Error 403 - Forbidden!');      
    }
  } else {
    res.status('403')
    res.send('Error 403 - Forbidden!');
  } 
  
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});