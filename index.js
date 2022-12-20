const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const multer = require('multer');
const methodOverride = require('method-override');
const fs = require("fs");


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
app.use(methodOverride('_method'));
app.use(session({resave:true, secret: 'notagoodsecret', saveUninitialized:true }))
app.use(flash());
app.use((req,res,next) => {
    res.locals.messages = req.flash('fail');
    next();
})

// MAIN CODE
 app.get('/', async(req,res) => {
    if (!req.session.user_id){
        res.redirect('/login');
    }else {
        let id = await bcrypt.hash(String(req.session.user_id),12)
        res.redirect(`/users/${id.replaceAll('/','')}`);
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
            let id = await bcrypt.hash(String(user._id),12);
            id = id.replaceAll('/','');
            res.redirect(`/users/${id }`);

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
        const user = new User({name, lastName, birthDate, email, password, registerDate:new Date()});
        await user.save();
        req.session.user_id = user._id;
        let id = await bcrypt.hash(String(user._id),12);
        res.redirect(`/users/${ id.replaceAll('/','')}`);
    }

});

app.get('/users/:id', async (req,res) => {
    if(req.session.user_id){
        let user =  await User.findOne({'_id':req.session.user_id});
        const { name, lastName, birthDate, profile, ...others } = user;
       //rendering 10 PEOPLE

        let result = await User.aggregate([
            {
                $sort:{
                    registerDate: -1
                }
            },
            {
                $facet: {
                    totalUsers: [{$count: "email"}],
                    data:[{ $skip: 0 }, { $limit: 15 }]
                }
            }
        ]);
        let dbL = result[0].totalUsers[0].email

        result = result[0].data;
        let id = await bcrypt.hash(String(user._id),12);
        id = id.replaceAll('/','');
        res.render('userPage',{ name, lastName, birthDate, profile, result,dbL, includeEdit:false,id })
    }else{
        res.redirect('/')
    }
});

app.patch('/users/:id', async function(req, res) {
    
    let user =  await User.findOne({'_id':req.session.user_id});
    
    
    const Storage = multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, "./public/media/uploads");
        },
        filename:async function(req, file, callback) {
            callback(null, file.originalname);
            if (file.originalname != ""){
                const path = "./public/media/uploads/" + user.profile;

                
                    fs.unlink(path, function (err) {
                        return 0
                    });
                    user.profile = file.originalname;
                    await user.save()
              
                
                }
            }
    });

    const upload = multer({
        storage: Storage
    }).array("imgUploader",1); //Field name and max count
    upload(req, res, function(err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!");
    });

   
    const {id} = req.params
    res.redirect(`/users/${id}`);
});

app.get('/users/:id/edit', async(req, res) => {
    let user =  await User.findOne({'_id':req.session.user_id});
    const { name, lastName, birthDate, profile, ...others } = user;
   //rendering 10 PEOPLE

    let result = await User.aggregate([
        {
            $sort:{
                registerDate: -1
            }
        },
        {
            $facet: {
                totalUsers: [{$count: "email"}],
                data:[{ $skip: 0 }, { $limit: 15 }]
            }
        }
    ]);
    let dbL = result[0].totalUsers[0].email

    result = result[0].data;
    let id = await bcrypt.hash(String(user._id),12);
    id = id.replaceAll('/','');
    res.render('userPage',{ name, lastName, birthDate, profile, result,dbL, includeEdit:true,id })
});

app.get('/moreUsers', async (req,res) => {
    
    let result = await User.aggregate([
        {
            $sort:{
                registerDate: -1
            }
        },
        {
            $facet: {
                totalUsers: [{$count: "email"}],
                data:[{ $skip:  Number(req.query.skip) }, { $limit: 10 }]
            }
        }
    ]);
    let total = result[0].totalUsers[0].email; 


    result = result[0].data;
    let lst = [];
    for (item of result){
        lst.push({ 
            name : item.name,
            lastName : item.lastName,
            profile : item.profile
          });
    };
    result = lst;
    res.json({result:result, total:total});
});

 //setting the server up
app.listen(3000,'localhost',function() {
   console.log('Server Has Started\non localhost')
});

