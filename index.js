const express = require('express');
const app = express();
const bodyParser = require('body-parser');


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

 // MAIN CODE
app.get('/',(req,res) => {
    res.render('index');
});

 //setting the server up
app.listen(3000,'127.0.0.1',function() {
   console.log('Server Has Started\non 127.0.0.1 ')
});

