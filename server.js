import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {createServer} from 'http';
import {Server} from 'socket.io';

dotenv.config();

import {connectDB} from './src/config/database.js';
import {createAdmin} from './src/scripts/createAdmin.js';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import callRoutes from './src/routes/callRoutes.js';
import postRoutes from './src/routes/postRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import storyRoutes from './src/routes/storyRoutes.js';
import followRoutes from './src/routes/followRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import notificationRoutes from './src/routes/notificationsRoutes.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: 'connected',
        timestamp: new Date().toISOString()
    });
});

io.on('connection', (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined`);
    });

    socket.on('leave', (userId) => {
        socket.leave(`user_${userId}`);
        console.log(`User ${userId} left`);
    });

    socket.on('sendMessage', (data) => {
        io.to(`user_${data.receiverId}`).emit('newMessage', data);
        socket.emit('messageSent', data);
    });

    socket.on('typing', (data) => {
        io.to(`user_${data.receiverId}`).emit('userTyping', {
            userId: data.userId,
            username: data.username
        });
    });

    socket.on('startCall', (data) => {
        io.to(`user_${data.receiverId}`).emit('incomingCall', data);
    });

    socket.on('endCall', (data) => {
        io.to(`user_${data.receiverId}`).emit('callEnded', data);
    });

    socket.on('newNotification', (data) => {
        io.to(`user_${data.userId}`).emit('notificationReceived', data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    await createAdmin();

    server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔐 Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
    });
});