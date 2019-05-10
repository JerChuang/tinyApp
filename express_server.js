// Required Modules:
const express = require('express');
const morgan = require('morgan'); // module that console logs get/post request to help with development
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['hippopotamus'],
  // Cookie Options
  maxAge: 60 * 60 * 1000 // expires in 1 hour
}))
app.use(bodyParser.urlencoded({extended: true}));

// Gloal Objects:
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW',
    counter: 0,
    visitors: [],
    visits: []
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW',
    counter: 0,
    visitors: [],
    visits: []
  },
  iaDFej: {
    longURL: 'http://lighthouse.ca',
    userID: 'kRYfIf',
    counter: 0,
    visitors: [],
    visits: []
  }
};

const users = {
  aJ48lW: {
    id: 'aJ48lW', 
    email: 'test@test.com', 
    password: '$2b$12$j49neYspr/OIvLHiv6Y1zOSqnzltqdTo9ZokeLiTdVGebcgrsprWa'
  },
  kRYfIf: {
    id: 'kRYfIf', 
    email: 'user2@example.com', 
    password: '$2b$12$KdvxpFZrhGLp4Af1ghCz4uUkkWHssRM0wuvbXEUfY3bBdICOPMFcy'
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

function emailLookUp(email){            //look up all e-mails in users object and return the matching user or return false if no match
  for (let person in users){
    if (users[person].email === email){
      return users[person];
    }
  }
  return false;
}

function urlsForUser(id){           //search for links that belong to the user, return new object with all links created by user
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
  if (req.session.user_id){
    res.redirect('/urls');
  } else {
    res.redirect('/login')
  } 
});

app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if(req.session.user_id){
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const userlink = urlsForUser(req.session.user_id)
  if (!urlDatabase[req.params.shortURL] || !userlink[req.params.shortURL]){  //check if link exists or belong to the user
    res.status('400');
    res.send('This url does not exist or not available for you to edit')
  }
  
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[req.session.user_id],
    counter: urlDatabase[req.params.shortURL].counter,
    visitors: urlDatabase[req.params.shortURL].visitors.length,
    visits: urlDatabase[req.params.shortURL].visits
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  urlDatabase[req.params.shortURL].counter += 1;  //increase count by 1 everytime a get request is sent for this link
  // check if there's visitor cookie, issue visitor cookie if it's a new visitor
  console.log(req.session.visitor_id);
  if(!req.session.visitor_id){
    let newID = generateRandomString();
    req.session.visitor_id = newID;
    urlDatabase[req.params.shortURL].visitors.push(newID)   //stores visitor id
    console.log(urlDatabase);
  } else { // if visitor has an exisiting id, but has not visited this link yet, store id in database
    if(!urlDatabase[req.params.shortURL].visitors.includes(req.session.visitor_id)){
      urlDatabase[req.params.shortURL].visitors.push(req.session.visitor_id)
    } 
  };
  // store timestamps and visitor id for each visit
  
  res.redirect(longURL);
});

app.post('/urls', (req, res) => {
  if (req.session.user_id){
    const short = generateRandomString();
    urlDatabase[short] = {              // updating urlDatabase with objects of shortURL: longURL/userID 
      longURL: req.body.longURL,
      userID: req.session.user_id,
      counter: 0,
      visitors: [],
      visits: []
    }; 
    res.redirect('/urls/'+short);
  } else {
    res.status('400');
    res.send('Please login')
  }
});

//listening for put requests to /urls/:shortURL
app.put('/urls/:shortURL', (req, res) => {
  const userlink = urlsForUser(req.session.user_id);
  if (!urlDatabase[req.params.shortURL] || !userlink[req.params.shortURL]){  //Check if link exists or belong to user
    res.status('400');
    res.send('This url does not exist or not available for you to edit')
  }

  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect('/urls/');
});

//listening for delete requests to /urls/:shortURL
app.delete('/urls/:shortURL', (req, res) => {
  const userlink = urlsForUser(req.session.user_id);
  if (!urlDatabase[req.params.shortURL] || !userlink[req.params.shortURL]){  //Check if link exists or belong to user
    res.status('400');
    res.send('This url does not exist or not available for you to delete')
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/login', (req, res) =>{
  if (req.session.user_id){
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render('urls_login', templateVars);
  }
});

app.get ('/register', (req,res) => {
  if (req.session.user_id){
    res.redirect('/urls');
  } else {
    const templateVars = {
    user: users[req.session.user_id]
    };
  res.render('urls_register', templateVars);
  }
});

app.post('/login', (req, res) => {
  const userAccount = emailLookUp(req.body.email);
  if (userAccount){ 
    if (bcrypt.compareSync(req.body.password, userAccount.password)){
      req.session.user_id = userAccount.id; //issued cookie after log in
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

app.post ('/register', (req,res) =>{
  if (!req.body.email || !req.body.password || emailLookUp(req.body.email)){
    res.status('400');
    res.send('Error 400 - Bad Request!');
  }
  
  newID = generateRandomString();
  users[newID] = {
    id: newID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 12)
  };
  req.session.user_id = newID; //issued cookie upon registration
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log( `TinyApp server listening on port ${PORT}!`);
});