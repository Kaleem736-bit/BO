const { Server } = require('socket.io')
const { GameManager } = require('./game')
const gm = new GameManager()
function initSocket(server){
  const io = new Server(server, { cors: { origin: '*' } })
  io.on('connection', socket=>{
    console.log('socket connected', socket.id)
    socket.on('joinRoom', ({ roomId, user }) => { socket.join(roomId); gm.joinRoom(roomId, socket.id, user, io) })
    socket.on('startGame', ({ roomId }) => gm.startGame(roomId, io))
    socket.on('playerAction', ({ roomId, action, amount }) => gm.playerAction(roomId, socket.id, action, amount, io))
    socket.on('chat', ({ roomId, msg, user }) => io.to(roomId).emit('chat', { user, msg }) )
    socket.on('disconnect', ()=>{ console.log('socket disconnected', socket.id); gm.leaveBySocket(socket.id, io) })
  })
}
module.exports = { initSocket }
