// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static('public'));

const SECRET = 'CHANGE_THIS_SECRET_TO_A_STRONG_VALUE';
const db = new Database('./db.sqlite');

// --- DB init ---
db.prepare(`
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  first_name TEXT, last_name TEXT, phone TEXT, country TEXT,
  email TEXT UNIQUE, password_hash TEXT, avatar TEXT,
  balance REAL DEFAULT 0, lang TEXT DEFAULT 'ar', verified INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS verifications(
  id TEXT PRIMARY KEY, user_id TEXT, code TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS transactions(
  id TEXT PRIMARY KEY, user_id TEXT, type TEXT, method TEXT, amount REAL, status TEXT, meta TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS games(
  id TEXT PRIMARY KEY, room_id TEXT, seed TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, result TEXT
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS rooms(
  id TEXT PRIMARY KEY, name TEXT, level TEXT, table_image TEXT, max_players INTEGER DEFAULT 4, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

// ensure rooms: ruby/emerald/gold with different max players (allow 2 or 4)
const upsertRoom = db.prepare('INSERT OR REPLACE INTO rooms(id,name,level,table_image,max_players) VALUES (@id,@name,@level,@table_image,@max_players)');
upsertRoom.run({id:'room_ruby', name:'الياقوت', level:'beginner', table_image:'طاولة غرفة الياقوت', max_players:4});
upsertRoom.run({id:'room_emerald', name:'الزمرد', level:'intermediate', table_image:'طاولة غرفة الزمرجد', max_players:4});
upsertRoom.run({id:'room_gold', name:'الغرفة الذهبية', level:'expert', table_image:'طاولة الغرفة الذهبيه', max_players:4});

// nodemailer mock transport (prints to console). Replace with SMTP settings for production.
const transporter = nodemailer.createTransport({ jsonTransport: true });

function generateCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }

function authMiddleware(req,res,next){
  const header = req.headers['authorization'];
  if(!header) return res.status(401).json({error:'no_auth'});
  const token = header.split(' ')[1];
  try {
    const data = jwt.verify(token, SECRET);
    req.user = data;
    next();
  } catch(e){
    return res.status(401).json({error:'invalid_token'});
  }
}

// --- API ---
// Registration (returns userId and sends mock verification)
app.post('/api/register', async (req,res)=>{
  try {
    const {first_name,last_name,phone,country,email,password,lang,avatar} = req.body;
    if(!email || !password) return res.status(400).json({error:'missing'});
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users(id,first_name,last_name,phone,country,email,password_hash,avatar,lang) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, first_name||'', last_name||'', phone||'', country||'', email, hash, avatar||'', lang||'ar');
    // create verification
    const code = generateCode();
    const vid = uuidv4();
    db.prepare('INSERT INTO verifications(id,user_id,code) VALUES (?,?,?)').run(vid, id, code);
    // send mail (mock)
    transporter.sendMail({ to: email, subject: 'رمز التحقق', text: `رمز التحقق: ${code}` }, (err, info) => {
      console.log('Mock verification sent:', {to: email, code});
    });
    return res.json({ ok: true, userId: id });
  } catch(e){
    return res.status(400).json({ error: 'register_failed', details: e.message });
  }
});

app.post('/api/verify-email', (req,res)=>{
  const {userId, code} = req.body;
  const row = db.prepare('SELECT * FROM verifications WHERE user_id=? AND code=?').get(userId, code);
  if(!row) return res.status(400).json({error:'invalid_code'});
  db.prepare('UPDATE users SET verified=1 WHERE id=?').run(userId);
  db.prepare('DELETE FROM verifications WHERE id=?').run(row.id);
  return res.json({ok:true});
});

app.post('/api/login', async (req,res)=>{
  const {email,password} = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if(!user) return res.status(400).json({error:'invalid'});
  const match = await bcrypt.compare(password, user.password_hash);
  if(!match) return res.status(400).json({error:'invalid'});
  const token = jwt.sign({id:user.id,email:user.email,lang:user.lang}, SECRET, {expiresIn:'7d'});
  return res.json({ok:true, token, user:{id:user.id,first_name:user.first_name,last_name:user.last_name,avatar:user.avatar,balance:user.balance,lang:user.lang,verified:user.verified}});
});

app.get('/api/rooms', (req,res)=>{
  const rows = db.prepare('SELECT id,name,level,table_image,max_players FROM rooms').all();
  res.json(rows);
});

app.post('/api/request-deposit', authMiddleware, (req,res)=>{
  const {method, amount, meta} = req.body;
  if(!amount || amount <= 0) return res.status(400).json({error:'invalid_amount'});
  const id = uuidv4();
  db.prepare('INSERT INTO transactions(id,user_id,type,method,amount,status,meta) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.user.id, 'credit', method, amount, 'pending', JSON.stringify(meta||{}));
  return res.json({ok:true, id});
});

app.post('/api/request-withdraw', authMiddleware, (req,res)=>{
  const {method, amount, meta} = req.body;
  if(!amount || amount <= 0) return res.status(400).json({error:'invalid_amount'});
  const user = db.prepare('SELECT balance FROM users WHERE id=?').get(req.user.id);
  if(!user || user.balance < amount) return res.status(400).json({error:'insufficient'});
  const id = uuidv4();
  db.prepare('INSERT INTO transactions(id,user_id,type,method,amount,status,meta) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.user.id, 'debit', method, amount, 'pending', JSON.stringify(meta||{}));
  return res.json({ok:true, id});
});

app.post('/api/update-profile', authMiddleware, (req,res)=>{
  const {first_name,last_name,avatar,lang,phone,country} = req.body;
  db.prepare('UPDATE users SET first_name=?, last_name=?, avatar=?, lang=?, phone=?, country=? WHERE id=?')
    .run(first_name,last_name,avatar,lang,phone,country, req.user.id);
  return res.json({ok:true});
});

app.get('/api/me', authMiddleware, (req,res)=>{
  const user = db.prepare('SELECT id,first_name,last_name,avatar,balance,lang,email,verified,phone,country FROM users WHERE id=?').get(req.user.id);
  res.json(user || {});
});

// admin contact (simple message log file)
app.post('/api/contact-support', authMiddleware, (req,res)=>{
  const {subject, message} = req.body;
  const log = `[${new Date().toISOString()}] user:${req.user.id} subject:${subject} message:${message}\n`;
  fs.appendFileSync(path.join(__dirname, 'support.log'), log);
  return res.json({ok:true});
});

// Serve client
app.get('/', (req,res)=> res.sendFile(__dirname + '/client/index.html'));

// ---- Game engine in-memory state (demo) ----
const roomsState = {
  room_ruby: { players: [], deck: [], pot:0, phase:'idle', currentDealer:0 },
  room_emerald: { players: [], deck: [], pot:0, phase:'idle', currentDealer:0 },
  room_gold: { players: [], deck: [], pot:0, phase:'idle', currentDealer:0 }
};

function makeDeck(){
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push({id: r+s, rank:r, suit:s})));
  return deck;
}

function shuffleWithSeed(deck, seed){
  const arr = deck.slice();
  let h = crypto.createHash('sha256').update(seed).digest();
  for(let i = arr.length -1; i>0; i--){
    const idx = h[i % h.length] % (i+1);
    [arr[i], arr[idx]] = [arr[idx], arr[i]];
    h = crypto.createHash('sha256').update(h).digest();
  }
  return arr;
}

io.on('connection', socket => {
  socket.user = null;
  console.log('socket connected', socket.id);

  socket.on('auth', (token)=>{
    try {
      const data = jwt.verify(token, SECRET);
      socket.user = data;
      socket.emit('auth_ok', {id:data.id, email:data.email});
    } catch(e){
      socket.emit('auth_err');
    }
  });

  socket.on('join_room', ({roomId, seatChoice})=>{
    if(!socket.user) return socket.emit('error','not_auth');
    const state = roomsState[roomId];
    if(!state) return socket.emit('error','no_room');
    // check existing seats and max players
    const roomsInfo = db.prepare('SELECT max_players FROM rooms WHERE id=?').get(roomId);
    const maxPlayers = roomsInfo ? roomsInfo.max_players : 4;
    // prevent duplicate
    if(state.players.find(p => p.id === socket.user.id)){
      // update socketId
      state.players.forEach(p => { if(p.id === socket.user.id) p.socketId = socket.id; });
    } else {
      if(state.players.length >= maxPlayers) return socket.emit('error','room_full');
      // add player
      const userRow = db.prepare('SELECT id,first_name,last_name,avatar,balance FROM users WHERE id=?').get(socket.user.id);
      state.players.push({
        id: socket.user.id,
        socketId: socket.id,
        name: (userRow ? (userRow.first_name || userRow.last_name || userRow.id) : socket.user.email),
        avatar: userRow ? userRow.avatar : '',
        balance: userRow ? userRow.balance : 0
      });
    }
    socket.join(roomId);
    io.to(roomId).emit('room_state', { players: state.players.map(p => ({id:p.id, name:p.name, avatar:p.avatar, balance:p.balance})), pot: state.pot, phase: state.phase });
  });

  socket.on('leave_room', ({roomId})=>{
    const state = roomsState[roomId];
    if(!state) return;
    state.players = state.players.filter(p => p.socketId !== socket.id && p.id !== (socket.user && socket.user.id));
    socket.leave(roomId);
    io.to(roomId).emit('room_state', { players: state.players });
  });

  socket.on('chat_message', ({roomId, content, isPrivate, toUserId})=>{
    if(isPrivate && toUserId){
      // send to target only (and sender)
      const targetSocket = Object.values(io.sockets.sockets).find(s => s.user && s.user.id === toUserId);
      if(targetSocket) targetSocket.emit('chat_message', {from: socket.user.id, content, private:true});
      socket.emit('chat_message', {from: socket.user.id, content, private:true});
    } else {
      io.to(roomId).emit('chat_message', {from: socket.user.id, content, private:false});
    }
  });

  socket.on('start_round', ({roomId})=>{
    if(!socket.user) return socket.emit('error','not_auth');
    const state = roomsState[roomId];
    if(!state) return socket.emit('error','no_room');
    if(state.players.length < 2) return socket.emit('error','not_enough_players');
    // create deck and shuffle with seed
    const seed = crypto.randomBytes(16).toString('hex');
    state.deck = shuffleWithSeed(makeDeck(), seed);
    state.pot = 0;
    state.phase = 'dealing';
    const players = state.players.slice(0, state.players.length); // use all connected players
    const deals = [];
    players.forEach(p => {
      const c1 = state.deck.pop();
      const c2 = state.deck.pop();
      deals.push({playerId: p.id, cards: [c1, c2]});
    });
    // save game record
    const gid = uuidv4();
    db.prepare('INSERT INTO games(id,room_id,seed) VALUES (?,?,?)').run(gid, roomId, seed);
    // send cards privately
    deals.forEach(d => {
      const s = Object.values(io.sockets.sockets).find(x => x.user && x.user.id === d.playerId);
      if(s) s.emit('deal_cards', {cards: d.cards});
    });
    io.to(roomId).emit('round_started', {players: players.map(p => p.id), seedHash: crypto.createHash('sha256').update(seed).digest('hex')});
  });

  socket.on('player_action', ({roomId, action, amount})=>{
    if(!socket.user) return;
    const state = roomsState[roomId];
    if(!state) return;
    io.to(roomId).emit('player_action', {playerId: socket.user.id, action, amount});
    if(action === 'bet' || action === 'raise'){
      state.pot += Number(amount || 0);
      io.to(roomId).emit('pot_update', {pot: state.pot});
    }
  });

  socket.on('disconnect', ()=>{
    Object.keys(roomsState).forEach(rid => {
      const st = roomsState[rid];
      st.players = st.players.filter(p => p.socketId !== socket.id);
      io.to(rid).emit('room_state', {players: st.players});
    });
    console.log('socket disconnected', socket.id);
  });
});

server.listen(3000, ()=> console.log('Server running on http://localhost:3000'));
