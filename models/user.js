const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // No puede haber dos usuarios con el mismo nombre
    },
    passwordHash: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);