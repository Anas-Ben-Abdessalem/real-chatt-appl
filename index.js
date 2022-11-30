const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');


mongoose.connect('mongodb://127.0.0.1:27017/messageApp',
 { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO ERROR!!!!")
        console.log(err)
    });



app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({resave:true, secret: 'notagoodsecret', saveUninitialized:true }))
app.use(flash());
app.use((req,res,next) => {
    res.locals.messages = req.flash('fail');
    next();
})

// MAIN CODE
 app.get('/', (req,res) => {
    if (!req.session.user_id){
        res.redirect('/login');
    }else {
        res.redirect('/secret');
    }
});

app.get('/login', (req,res) => {
    res.render('index');
});

app.post('/login', async (req,res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if (user){
        const valid = await bcrypt.compare(password, user.password)
        
        if(valid){
            req.session.user_id = user._id;
            res.redirect('/secret');

        }
    }else{
    req.flash('fail','Wrong email or password');
    res.redirect('/login');
    }
});

app.get('/create',(req,res) => {
    res.render('create')
});

app.post('/create', async (req,res) => {
    const { name, lastName, birthDate, email, password } = req.body; 
    const user = await User.findOne({email});
    if(user){
        req.flash('fail', 'This email '+ email + ' is already signed up');
        req.flash('fail', email);
        res.redirect('/login');
    }else{
        const user = new User({name, lastName, birthDate, email, password});
        await user.save();
        req.session.user_id = user._id;
        res.redirect('/secret');
    }

});

app.get('/secret', async (req,res) => {
    if(req.session.user_id){
        let user =  await User.findOne({'_id':req.session.user_id});
        const { name, lastName, birthDate, ...others } = user
        res.render('userPage',{ name, lastName, birthDate})
    }else{
        res.redirect('/')
    }
});

 //setting the server up
app.listen(3000,'localhost',function() {
   console.log('Server Has Started\non 127.0.0.1 ')
});

