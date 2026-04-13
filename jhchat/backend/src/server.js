const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.set('io', io);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const sectRoutes = require('./routes/sect');
const marriageRoutes = require('./routes/marriage');
const skillRoutes = require('./routes/skill');
const itemRoutes = require('./routes/item');
const gameRoutes = require('./routes/game');
const petRoutes = require('./routes/pet');
const alchemyRoutes = require('./routes/alchemy');
const miscRoutes = require('./routes/misc');
const chatRoutes = require('./routes/chat');
const commandRoutes = require('./routes/command');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sects', sectRoutes);
app.use('/api/marriage', marriageRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/alchemy', alchemyRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

require('./socket')(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = { app, server, io };
