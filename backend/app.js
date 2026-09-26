const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const userRoutes = require('./routes/userRoutes');
const terminologyRoutes = require('./routes/terminologyRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/user', userRoutes);
app.use('/api/terminology', terminologyRoutes);

module.exports = app;
