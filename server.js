const express = require('express')
const fs = require('fs')
const path = require('path')
var cors = require('cors')

const app = express()

//Middleware-ek
app.use(cors()); //CORS kikapcsolása (whitelist nélkül fut) 
app.use(express.json()) //JSON formátum megkövetelése
app.use(express.urlencoded({ extended: true })) // req.body-n keresztül átmenjen az adat


/*Emailcím, felhasználónév, jelszó */


let users = [

];
const USERS_FILE = path.join(__dirname, 'users.json')
loadUsers()
// ENDPOINTS

app.get('/', (req, res) => {
  res.send('Backend API by Bajai SZC Türr István Technikum - 13.A Szoftverfejlesztő')
})

//Get all user 

app.get('/users', (req, res) => {
  res.send(users)
})

//Get one user by id

app.get('/users/:id', (req, res) => {
  let id = req.params.id; //Itt a hátsó .id-nek a neve meg kell egyezzen a getbe lévő :után
  let idx = users.findIndex(user => user.id == id);
  if (idx > -1) {
    return res.send(users[idx])
  }
  return res.status(400).send({msg: 'Nincs ilyen felhasználó'})
})

//Get 404 oldal   

app.get('/404', (req, res) => {
  res.status(400).send("Itt bizony egy nagyon csúnya hibuska van aranyapóm")
})

//POST new user (Hozzáírás)

app.post('/users', (req, res) => {
  let data = req.body;
  if(isEmailExists(data.email)){
    return res.status(400).send({msg: 'Ez az e-mail cím már regisztrált!'})
  }
  data.id = getNextID()
  users.push(data)
  saveUsers()
  res.send({msg: 'A felhasználó sikeresen regisztált!'})
});


//POST check user login

app.post('/users/login', (req,res)=>{
  let {email, password} = req.body;
  let loggedUser = {}; 
  users.forEach(user => {
    if(user.email == email && user.password==password){
        loggedUser = user;
        return
    }
  })
  
  return res.send(loggedUser);
})


//DELETE user by id

app.delete('/users/:id', (req, res) => {
  let id = req.params.id;

  let idx = users.findIndex(user => user.id == id);
  if (idx > -1) {
    users.splice(idx, 1);
    saveUsers()
    return res.send({msg: 'Felhasználó törölve'});
  }
  return res.status(400).send({msg: 'Nincs ilyen azonosítójű felhasználó'})
});

//UPDATE user by id

app.patch('/users/:id', (req, res) => {
  let id = req.params.id;
  let data = req.body;
  let idx = users.findIndex(user => user.id == id);
  if (idx > -1) {
    users[idx] = data
    users[idx].id = Number(id)
    saveUsers()
    return res.send('A felhasználó módosítva!');
  }
  return res.status(400).send('Nincs ilyen azonosítójú felhasználó')
});


/* HF 

app.patch('/users/profile', (req,res)=>{})

lehessen módosítani a nevet és az email címet, arra viszont kell figyelni, hogy az emailt ne lehessen már regisztált e-mail címre váltani.

app.patch('users/password', (req,res) => jelszó módosítása, és legyen meg a validációk, biztonsági kritériumnak megfelelés és a jelenlegi jelszó is helyes 


  app.get('users/profile/:id, (req,res) =>{
    }

    profiladatok betöltése a megadott ID szerint
*/




app.listen(3000);


//Othet functions

function getNextID() {
  let nextID = 1;
  if (users.length === 0) {
    return nextID;
  }
  let maxindex = 0;
  for (let i = 1; i < users.length; i++) {
    if (users[i].id > users[maxindex].id) {
      maxindex = i;
    }
  }

  return users[maxindex].id + 1;
}

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE);
    try {
      users = JSON.parse(raw)
    } catch (error) {
      console.log("Itt hibára futott a hadművelett, ebből beolvasás nem lesz")
      users = []
    }
  } else {
    saveUsers()
  }
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

function isEmailExists(email){
  let exists = false;
  users.forEach(user => {
    if(user.email == email)
      exists = true
      return;
  })
  return exists
}