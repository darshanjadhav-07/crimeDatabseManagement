const env = require("dotenv");
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const pg = require('pg');
const session = require('express-session');
const flash = require('express-flash');
const { forEach } = require('lodash');
let life = 0;
var player = require('play-sound')(opts = {})
let isLogedIn = false;


env.config();
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

app.use(flash());

const db = new pg.Client({
    user:process.env.DB_USERNAME,
    host: "localhost",
    database: "crimeDatabaseManagement",
    password: process.env.DB_PASSWORD,
    port:5432
});

db.connect();

let officerName = "Darshan Jadhav"
let profilePic = "./public/images/p1.jpg";


app.get('/', function (req, res) {
    life = 0;
    isLogedIn = false;
    res.render("main", { officer: officerName, pic: profilePic });
})

app.get('/searchCriminal', function (req, res) {
    res.render("searchCriminal");
})

app.get('/DatabaseForm', function (req, res) {
    if (isLogedIn) {
        isLogedIn = false;
        res.render("DatabaseForm", { officer: officerName, pic: profilePic, message: req.flash() });
    }
    else {
        res.redirect("/enter");
    }
})

app.get('/crimeInfo', function (req, res) {
    // console.log(req.flash('success'));
    res.render("crimeInfo", { officer: officerName, pic: profilePic, message: req.flash() });

})

app.get('/enter', function (req, res) {
    if (life < 2) {
        res.render("enter");
    }
})

let mainCriminalNo;

app.post('/DatabaseForm', function (req, res) {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const criminal_no = req.body.criminal_no;
    const phone = req.body.phone;
    const location = req.body.location;
    mainCriminalNo = criminal_no;
    if (phone.length != 10) {
        req.flash('error', 'phone number should be of length 10');
        return res.redirect('/DatabaseForm');
    }
    if (criminal_no.length != 4) {
        req.flash('error', 'criminal number should be of length four');
        return res.redirect('/DatabaseForm');
    }

    db.query("INSERT INTO criminal (criminalno,fname,lname,phone,location) VALUES($1,$2,$3,$4,$5)",
        [criminal_no, fname, lname, phone, location], (error, res) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("criminal Stored successfully...");
            }
        });

    res.redirect('/crimeInfo');

    app.post('/crimeInfo', function (req, res) {
        let criminal_no = req.body.crime_no;
        let crime_type = req.body.crime_type;
        let crime_description = req.body.crime_description;
        let criminal_jail_loc = req.body.criminal_jail_loc;
        let criminal_punished_on = req.body.punished_on;
        let criminal_presion_period = req.body.presion_period;


        // console.log(criminal_presion_period);

       if(criminal_no != mainCriminalNo){
        req.flash('error', `Criminal number doesn't match the previous criminal number:${mainCriminalNo}`);
        return res.redirect('/crimeInfo');
       }

        db.query("INSERT INTO criminalJailInfo (criminal_no,crime_type,crime_description,criminal_jail_loc,criminal_punished_on,criminal_presion_period) VALUES($1,$2,$3,$4,$5,$6)",
            [criminal_no, crime_type, crime_description, criminal_jail_loc, criminal_punished_on, criminal_presion_period], (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    req.flash('success', 'criminalJailInfo stored successfully...');
                    callNextPage();
                }
            });

        let callNextPage = () => {
            res.redirect('/dataScucess');
        }

    });
});

app.post('/navbar', function (req, res) {
    isLogedIn = false;
    res.redirect('/');
})


app.post('/searchCriminal', function (req, res) {

    const curr_criminal_no = req.body.criminal_no;

    let criminalInfo = [];
    let dataEntered = new Promise(function (resolve, reject) {
        db.query("SELECT * FROM criminal WHERE criminalno = $1", [curr_criminal_no], (error, res) => {
            if (error) {
                reject(new Error("Error in criminal"));
            } else {
                criminalInfo.push(res.rows)
                resolve(criminalInfo);
            }
        })
    });

    dataEntered.then((gotData) => {

        return new Promise(function (resolve, reject) {
            db.query("SELECT * FROM criminalJailInfo WHERE criminal_no = $1",
                [curr_criminal_no], (error, res) => {

                    if (error) {
                        reject(new Error("Some problem in criminalJailInfo"))
                    }
                    else {
                        gotData.push(res.rows)
                        resolve(gotData);
                    }
                });
        })
    }).then((value) => {
        res.render("viewCriminalDetails", {
            criminal_no:value[0][0].criminalno,
            fname: value[0][0].fname,
            lname: value[0][0].lname,
            phone: value[0][0].phone,
            location: value[0][0].location,
            crime_type: value[1][0].crime_type,
            crime_description: value[1][0].crime_description,
            punished_on: value[1][0].criminal_punished_on,
            persion_period: value[1][0].criminal_presion_period,
            Presion_location: value[1][0].criminal_jail_loc
        });
    }, (error) => {
        console.log(error);
    })

    dataEntered.catch((error) => {
        console.log(error);
    })
})

var darshan = "ABCD";

app.get('/errorPage', function (req, res) {
    res.render("errorPage", { dar: darshan });
})

app.get('/emergency', function (req, res) {
    res.render("emergency");
})

let agentInfo = [];
app.post('/enter',function(req,res){
    const security_cid = req.body.security_id;
    const security_cans = req.body.security_ans;
    
    
    function redirectHackerPage(){
        res.redirect('/emergency');
        player.play('./public/audios/security_alarm.mp3', function(err){
        if (err) throw err
        }); 
    }



    function redirectSameEnterPage(){
        life++;
        if(life < 2){
        res.redirect('/errorPage')
        }
        else{
            redirectHackerPage();   
         }
    }; 

    let isAgent = new Promise((resolve, reject)=>{
        db.query("SELECT * FROM agents WHERE securityId = $1 AND securityAns = $2",
            [security_cid, security_cans], function (error, res) {
                if (error) {
                    console.log("no error")
                    reject(error);
                }
                else if(res.rows.length == 0){
                        //   redirectSameEnterPage();
                        reject("not found");
                    }
                else{

                    console.log(res.rows.length == 0);
                    agentInfo.push(res.rows);
                    resolve(agentInfo);
                }    
                })
            })
    
    isAgent.then((value)=>{
        if (value[0][0].securityid == security_cid && value[0][0].securityans == security_cans) {
            isLogedIn = true;
            res.redirect('/DatabaseForm');
        }
        else {
            console.log(value[0][0].securityid)
            life++;
            if (life < 2) {
                res.redirect('/errorPage');
            }
            else {
                res.redirect('/emergency');
                player.play('./public/audios/security_alarm.mp3', function (err) {
                    if (err) throw err
                });
            }
        }
    },(error)=>{
        console.log("not an Agent");
        console.log(error);
        life++;
        if(life < 2){
        res.redirect('/errorPage'); 
        }
        else{
            res.redirect('/emergency');
            player.play('./public/audios/security_alarm.mp3', function(err){
            if (err) throw err
            });   
        }
    })

});


app.post('/errorPage', function (req, res) {
    if (life != 1) {
        res.redirect('/enter');
    }
    else {
        res.redirect('/main');
    }
});

app.get('/dataScucess', (req, res) => {
    res.render('dataScucess', { message: req.flash() });
});

app.get('/searchByLoc', (req, res) => {
    res.render('searchByLoc', { message: req.flash() });
});


let cityArr = [];
app.post('/searchByLoc',function(req,res){
   let city = req.body.cityName;

   let gotCity = new Promise((resolve,reject)=>{
       db.query("SELECT criminalno,fname,lname,location FROM criminal WHERE location = $1",
       [city],function(error,res){
        if(error){
            console.log("No data found");
            reject("No data found");
        }
        else{
            // console.log(res.rows[0].location);
            if(res.rows[0] == null){
                reject("No data found");
            }
            else if(city == res.rows[0].location){
                cityArr = [];
                let obj = {
                    criminal_no:"",
                    fname:"",
                    lname:""
                }
                res.rows.forEach(dataFun);
                function dataFun(data){
                    obj.criminal_no = data.criminalno;
                    obj.fname = data.fname;
                    obj.lname = data.lname;
                    cityArr.push(obj);
                    obj = {};
                } 
                resolve(cityArr);
            }
        }
       })
   })

let arrayCity = [];
let loc = "";
   gotCity.then((value)=>{
    res.render('viewByCity',{arrayCity:value,loc:city});
   },(error)=>{
    req.flash('error',`No data found matching ${city}`);
    res.redirect('/searchByLoc');
   })

   arrayCity = [];
})

app.get('/viewByCity', (req, res) => {
    res.render('viewByCity');
});


let allData = [];
let allData2 = [];
app.get('/viewAll', (req, res) => {
    let gotCity = new Promise((resolve,reject)=>{
        db.query("SELECT * FROM criminal",
        function(error,res){
         if(error){
             console.log("No data found");
             reject("No data found");
         }
         else{
            //  console.log(res.rows);
             if(res.rows[0] == null){
                 reject("No data found");
             }
             else{
                // console.log(res.rows);
                allData = [];
                 let obj = {
                     criminalno:"",
                     fname:"",
                     lname:"",
                     phone:"",
                     location:"",
                 }
                 res.rows.forEach(dataFun);
                 function dataFun(data){
                     obj.criminalno = data.criminalno;
                     obj.fname = data.fname;
                     obj.lname = data.lname;
                     obj.phone = data.phone;
                     obj.location = data.location;
                     allData.push(obj);
                     obj = {};
                 } 
                 console.log(allData)
                 resolve(allData);
             }
         }
        })
    })

    let mainAllData = [];
    let mainAllData2 = [];
    gotCity.then((values)=>{
        let gotCity2 = new Promise((resolve,reject)=>{
            db.query("SELECT * FROM criminaljailinfo",
            function(error,res){
             if(error){
                 console.log("No data found");
                 reject("No data found");
             }
             else{
                //  console.log(res.rows);
                    // console.log(res.rows);
                    allData2 = [];
                     let obj = {
                        crime_type:"",
                        crime_description:"",
                        criminal_jail_location:"",
                        criminal_punished_on:"",
                        criminal_presion_period:"",
                     }
                     res.rows.forEach(dataFun);
                     function dataFun(data){
                        obj.crime_type = data.crime_type;
                        obj.crime_description = data.crime_description;
                        obj.criminal_jail_location = data.criminal_jail_loc;
                        obj.criminal_punished_on = data.criminal_punished_on;
                        obj.criminal_presion_period = data.criminal_presion_period;
                         allData2.push(obj);
                         obj = {};
                     } 
                    //  console.log(allData)
                     resolve(allData2);
                 
             }
            })
        }).then((values2)=>{
            res.render('viewAll',{mainAllData:values,mainAllData2:values2,message:req.flash()});
        },(error)=>{
            req.flash("error","No data found");
             res.render('viewAll',{mainAllData:values,message:req.flash()});
        })
     },(error)=>{
             req.flash("error","No data found");
             res.render('viewAll',{mainAllData:values,message:req.flash()});
     })
     mainAllData = [];
     mainAllData2 = [];
});

app.get('/searchByLoc', (req, res) => {
    res.render('searchByLoc',{message:req.flash()});
});
app.get("/searchAgent",function(req,res){
    res.render("searchAgent");
})

app.listen(3000, function (req, res) {
    console.log("Serving on port 3000..")
});
