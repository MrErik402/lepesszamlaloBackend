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


let users = [];
let steps = [];
const USERS_FILE = path.join(__dirname, 'users.json')
const STEPS_FILE = path.join(__dirname, 'steps.json')
loadUsers()
loadSteps()
// ENDPOINTS . USER

app.get('/', (_req, res) => {
  res.send('Backend API by Bajai SZC Türr István Technikum - 13.A Szoftverfejlesztő')
})

//Get all user 

app.get('/users', (_req, res) => {
  res.send(users)
})

//Get one user by id

app.get('/users/:id', (req, res) => {
  let id = req.params.id; //Itt a hátsó .id-nek a neve meg kell egyezzen a getbe lévő :után
  let idx = users.findIndex(user => user.id == id);
  if (idx > -1) {
    return res.send(users[idx])
  }
  return res.status(400).send({message: 'Nincs ilyen felhasználó'})
})

//Get 404 oldal   

app.get('/404', (_req, res) => {
  res.status(400).send("Itt bizony egy nagyon csúnya hibuska van aranyapóm")
})

//POST new user (Hozzáírás)

app.post('/users', (req, res) => {
  let data = req.body;
  if(isEmailExists(data.email)){
    return res.status(400).send({message: 'Ez az e-mail cím már regisztrált!'})
  }
  data.id = getNextID()
  users.push(data)
  saveUsers()
  res.send({message: 'A felhasználó sikeresen regisztált!'})
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
    return res.send({message: 'Felhasználó törölve'});
  }
  return res.status(400).send({message: 'Nincs ilyen azonosítójű felhasználó'})
});
// Felhasználói adatok módosítása 

app.patch("/users/profile", (req, res) => {
  const {id, name, email } = req.body;
  console.log(req.body)
  let idx = users.findIndex(user => user.email == email && user.id != id);
  if(idx>-1){
    return res.status(400).send({message: "Ez az e-mail cím már foglalt!"})
  }

  idx = users.findIndex(user => user.id == id)
  console.log(idx)
  if(idx==-1){
    return res.status(400).send({message: "Nem található a felhasználó"})
  }
  users[idx].name = name
  users[idx].email = email

  saveUsers();

  return res.status(200).send({message: "A profil sikeresen módosítva!"});
});

// Jelszó módosítása 

app.patch("/users/password", (req, res) => {
  const { id, oldPassword, newPassword } = req.body;
  let idx = users.findIndex(user => user.id == id)

  if(idx==-1){
    return res.status(400).send({message: "Nem található a felhasználó"})
  }

  if(users[idx].password != oldPassword){
    return res.status(400).send({message: "A megadott jelenlegi jelszó nem megfelelő"})
  }

  users[idx].password = newPassword;
  saveUsers()

  return res.send({message: "A jelszó sikeresen módosítva"})
  })

//Felhasználó lekérdezése ID alapján

app.get("/users/profile/:id", (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  if (!user) return res.status(404).json({ message: "Felhasználó nem található" });
  res.json({ id: user.id, name: user.name, email: user.email });
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



// -----------------------------ENDPOINT - STEP---------------------------------

// GET all steps (all users)
app.get('/steps', (req, res)=> {
  res.send(steps);
});

// GET all steps by userId
app.get('/steps/user/:uid', (req, res)=> {
  let userId = req.params.uid;
  let idx = users.findIndex(user => user.id == userId);

  if (idx == -1){
      res.status(400).send({message: 'Nincs ilyen felhasználó!'});
      return
  }

  res.send(steps.filter(step => step.userId == userId));
});

// GET one step by id
app.get('/steps/:id', (req, res) => {
  let id = req.params.id;

  let idx = steps.findIndex(step => step.id == id);

  if (idx == -1){
      res.status(400).send({message: 'Nincs ilyen lépésadat!'});
      return
  }

  res.send(steps[idx]);
});

// POST new step
app.post('/steps', (req, res) => {
  let data = req.body;
  data.id = getNextID(steps);
  steps.push(data);
  saveSteps();
  res.send({message: 'A lépésszám felvéve!'});
});

// PATCH step by id
app.patch('/steps/:id', (req, res)=>{
  let id = req.params.id;
  let data = req.body;

  let idx = steps.findIndex(step => step.id == id);

  if (idx > -1) {
      steps[idx] = data;
      steps[idx].id = Number(id);
      saveSteps();
      return res.send({message: 'A lépésadat sikeresen módosítva'});
  }
  return res.status(400).send({message:'Nincs ilyen lépésadat!'});
});

// DELETE step by id
app.delete('/steps/:id', (req, res)=>{
  let id = req.params.id;
  let idx = steps.findIndex(step => step.id == id);

  if (idx == -1){
      res.status(400).send({message: 'Nincs ilyen lépésadat!'});
      return
  }

  steps.splice(idx, 1);
  saveSteps();
  res.send({message: 'Lépésadat sikeresen törölve!'});
});

// DELETE all steps by userId
app.delete('/steps/user/:uid', (req, res)=>{
  let userId = req.params.uid;
  let idx = users.findIndex(user => user.id == userId);

  if (idx == -1){
      res.status(400).send({message: 'Nincs ilyen felhasználó!'});
      return
  }
  
  steps = steps.filter( step => step.userId != userId);
  saveSteps();
  res.send({message: 'Lépésadatok sikeresen törölve!'});
});

// DELETE all steps of users
app.delete('/steps', (req, res)=>{
  steps = [];
  saveSteps();
  res.send({message: 'Az összes lépésadat sikeresen törölve!'});
}); 

app.listen(3000);


//Othet functions

function getNextID(type) {
  let nextID = 1
  let maxindex = 0
  switch (type) {
    case "steps":
      nextID = 1;
      if (steps.length === 0) {
        return nextID;
      }
      maxindex = 0;
      for (let i = 1; i < steps.length; i++) {
        if (steps[i].id > steps[maxindex].id) {
          maxindex = i;
        }
      }
    
      return steps[maxindex].id + 1;
      
  
    default:
      nextID = 1;
      if (users.length === 0) {
        return nextID;
      }
      maxindex = 0;
      for (let i = 1; i < users.length; i++) {
        if (users[i].id > users[maxindex].id) {
          maxindex = i;
        }
      }
    
      return users[maxindex].id + 1;
  }
  
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

function loadSteps(){
  if (fs.existsSync(STEPS_FILE)) {
    const raw = fs.readFileSync(STEPS_FILE);
    try {
      steps = JSON.parse(raw)
    } catch (error) {
      console.log("Itt hibára futott a hadművelett, ebből beolvasás nem lesz")
      steps = []
    }
  } else {
    saveSteps()
  }
}

function saveSteps(){
  fs.writeFileSync(STEPS_FILE, JSON.stringify(steps));
}
