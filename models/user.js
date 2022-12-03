const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthDate: {
        type:Date,
        required:true
    },
    registerDate:{
        type:Date,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength:8,
        required: true,
        unique: true
    },
    profile:{
        type:String,
        default: 'defaultImage.png'
    }
});

const messageSchema = new mongoose.Schema({
    content: String,
    time: String
});

const gateSchema = new mongoose.Schema({
    receiver: String,
    sender: String,
    messages: [messageSchema]
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', userSchema);