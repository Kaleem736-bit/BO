require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const { initSocket } = require('./socket')
const authRoutes = require('./routes/auth')
const paymentsRoutes = require('./routes/payments')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentsRoutes)

const server = http.createServer(app)
initSocket(server)

const PORT = process.env.PORT || 4000
server.listen(PORT, ()=> console.log('Server listening on', PORT))
