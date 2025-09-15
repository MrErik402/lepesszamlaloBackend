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

// GET all steps by userID

app.get("/steps/user/:userID", (req,res) =>{
  let userStep = []
  let data = req.params;
  let id = req.params.userID; //Itt a hátsó .id-nek a neve meg kell egyezzen a getbe lévő :után
  let idx = steps.findIndex(step => step.userID == id); 
  if (idx > -1) {
    for (let i = 0; i < steps.length; i++) {
      if(steps[i].userID == data.userID){
        userStep.push(steps[i])
      }
    }
    res.send(userStep)
   
  }
  return res.status(400).send({msg: 'Nincs ilyen felhasználó'})
})

// GET one step by stepID
app.get("/steps/:id", (req,res)=>{
  let data = req.params;
  let id = req.params.id; //Itt a hátsó .id-nek a neve meg kell egyezzen a getbe lévő :után
  let idx = steps.findIndex(step => step.id == id); 
  if (idx > -1) {
    res.send(steps[idx])
  }
  return res.status(400).send({msg: 'Nincs ilyen lépés'})
})
// POST new step
app.post("/steps/user/:userID", (req,res)=>{
  let data = req.body;
  data.id = getNextID("steps")
  steps.push(data)
  saveSteps()
  res.send({msg: 'A lépés sikeresen hozzáadva'})
})
// PATCH step by stepID
app.patch("/steps/:id", (req,res)=>{
  const {id, date, count } = req.body;
  let idx = steps.findIndex(step => step.id == id)
  if(idx==-1){
    return res.status(400).send({message: "Nem található a lépés"})
  }
  steps[idx].date = date
  steps[idx].count = count

  saveSteps();

  return res.status(200).send({message: "A lépés sikeresen módosítva!"});
})
// DELETE step by stepID
app.delete("/steps/:id", (req,res)=>{
  let id = req.params.id;
  let idx = steps.findIndex(step => step.id == id);
  if (idx > -1) {
    steps.splice(idx, 1);
    saveSteps()
    return res.send({msg: 'Lépés törölve'});
  }
  return res.status(400).send({msg: 'Nincs ilyen azonosítójű lépés'})
})
// DELETE all steps by userID
app.delete("/steps/user/:userID",(req,res)=>{
  let id = req.params.userID;

  let data = req.params
  let arrayCount = steps.length;
  let idx = steps.findIndex(step => step.userID == id);
  if (idx > -1) {
    for (let i = 0; i < arrayCount; i++) {
      if(steps[i].userID == data.userID){
        steps.splice(idx, 1);
        saveSteps()
      }
    }
    return res.send({msg: 'Lépések törölve a felhasználótól'});
  }
  return res.status(400).send({msg: 'Nincs ilyen azonosítójű lépés'})
})

app.delete("/steps", (_req,res)=>{
  steps = []
  saveSteps()
  res.send({message: "Sikeresen törölve az összes lépés!"})
})

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
