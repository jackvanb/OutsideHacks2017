var express               = require("express"),
    ejs                   = require("ejs"),
    bodyParser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User                  = require("./models/User"),
    Group                 = require("./models/Groups"),
    GlobalGroup           = require("./models/GlobalGroup"),
    mongoose              = require("mongoose"),        
    session               = require("express-session");


var app = express();


app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({
    secret: "Mrs. Allen was my 10th grade CS teacher",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));


// ============
//  ROUTES
// ============


app.get("/lineup", isLoggedIn, function(req, res) {

    res.render("lineup", {lineup: getFullLineup(req.user.lineup), total: getTotal(req.user.lineup), isAuthenticated: req.isAuthenticated()});
});

// register route
app.post("/register", function(req, res) {
   var username = req.body.username.trim();
   var password = req.body.password.trim();
   var email = req.body.email.trim();
   User.register(new User({username: username, email: email, lineup: [], group: ""}), password, function(err, user){
       if(err){
           console.log(err);
           return res.render("homepage");
       }
      passport.authenticate("local")(req, res, function(){
         res.redirect("/setup");
      });
   });
});

app.get("/register", function(req, res) {
   res.render("register", {isAuthenticated: req.isAuthenticated()}) 
});

app.get("/setup", isLoggedIn, function(req, res) {
   var tiers = tier();
   res.render("setup", {artists: tiers, isAuthenticated: req.isAuthenticated()});
});


app.get("/groups/:groupID", isLoggedIn, function(req, res){
        Group.findById({"_id": req.params.groupID}, function(err, group){
           if (err){
               console.log(err);
           } else {
               res.render("groupPage", {group: group, isAuthenticated: req.isAuthenticated()});
           }
           
        });
        
});

app.post("/creategroup", function(req, res) {
    var Gcode = makeCode();
    var newGroup = {
      name: req.body.Gname,
      members: [req.user._id],
      code: Gcode
    };
    
    Group.create(newGroup, function(err, newly) {
        if (err) {
            console.log(err);
        } else {
            User.update(req.user._id, {"group": newly._id}, function(err, updated) {
                if(err){
                    console.log(err);
                } else {
                    res.redirect("/groups")
                    
                    
                }
            });
    
        }
    });
        
});

app.post("/joingroup/:groupID", function(req, res) {
    
});

app.get("/", function(req, res) {
//   console.log(req.user.group);
   res.render("homepage", {isAuthenticated: req.isAuthenticated()}); 
});

app.get("/groups", function(req, res) {
   res.render("groups", {isAuthenticated: req.isAuthenticated()})
              
   
});

app.get("/checkin", function(req, res) {
   res.render("checkIn", {artists: artists, isAuthenticated: req.isAuthenticated()}); 
    
});

app.post("/checkin", isLoggedIn, function(req, res) {
    var key = req.body.key;
    incrementPoints(key);
    res.redirect("/lineup")
})

app.get("/user/:userID", function(req, res){
   User.findById({"_id": req.params.userID}, function(err, user) {
       if(err){
           console.log(err);
       } else {
           res.render("user", {user: user, isAuthenticated: req.isAuthenticated});
       }
       
   });
});

app.get("/leaderboard", function(req, res) {
   User.find(function(err, users) {
      if (err) {
          console.log(err);
      } else {
       var sortedUsers = users.sort(function(a, b) {
            return getTotal(b.lineup) - getTotal(a.lineup);
        });  
      res.render("leaderboard", {isAuthenticated: req.isAuthenticated(), users: sortedUsers, getTotal: getTotal});
                 
      }
   });
});

app.post("/createlineup",isLoggedIn, function(req, res) {
    var lineUp = req.body.lineup.split(",");
    var updateObj = {lineup: lineUp};
    User.findByIdAndUpdate(req.user._id, updateObj, function(err, model) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/lineup");
        }
    });
    
});
 
//login route
app.post("/login", passport.authenticate("local", {
    successRedirect: "/lineup",
    failureRedirect: "/"
}), function(req, res) {
    
});

app.get("/login", function(req, res) {
    res.render("login", {isAuthenticated: req.isAuthenticated()})
});

//logout route
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});



// Tier 1: Platinum: First Row  
// Tier 2: Gold: Alt-J - Bleachers 
// Tier 3: Silver: Sleigh Bells - Noname
// Tier 4: Bronze: Kali Uchis - 

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Server Has Started!");
});

var artists = {
    
    "Metallica": {tier: 1, points: 562, image: "https://pbs.twimg.com/profile_images/766360293953802240/kt0hiSmv.jpg", 
                    description: "Metallica is an American heavy metal band based in San Rafael, California."},
    "Gorillaz" : {tier: 1, points: 467, image: "https://www.infiniteenergycenter.com/assets/img/Gorillaz-Event-Image-670x350-003-fac56d40b2.jpg", 
                    description: "Gorillaz are an English virtual band created in 1998 by musician Damon Albarn and artist Jamie Hewlett."},
    "Lorde" : {tier: 1, points: 434, image:"http://static1.squarespace.com/static/58b1faf01b631bccf54e27dc/t/58b9d0ecb8a79b3eca1833dd/1488572652898/lorde-site.jpg?format=1000w", 
                    description:"Ella Marija Lani Yelich-O'Connor, better known by her stage name Lorde, is a New Zealand singer-songwriter and record producer."},
    "The Who" : {tier: 1, points: 435, image:"http://www.thewho.com/wp-content/gallery/views_1/64_the_city_640.jpg",
                description:"The Who are an English rock band that formed in 1964."},
    "A Tribe Called Quest" : {tier: 1, points:233, image: "http://thesource.com/wp-content/uploads/2016/11/A-Tribe-Called-Quest-1989.jpg",
                                description: "A Tribe Called Quest is an American hip-hop collective formed in 1985."},
    "ScHoolboy Q": {tier: 2, points: 189, image: "http://thenumberfest.com/wp-content/uploads/2015/01/schoolboy-q-press-2014-650.jpg", 
                    description: "Schoolboy Q is an American hip hop recording artist from South Central Los Angeles, California."},
    "Vance Joy" : {tier: 2, points: 167, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Vance_Joy_at_Sommarkrysset%2C_Stockholm.jpg/220px-Vance_Joy_at_Sommarkrysset%2C_Stockholm.jpg", 
                    description: "James Gabriel Keogh, better known as Vance Joy, is an Australian singer-songwriter."},
    "Young The Giant" : {tier: 2, points: 188, image: "https://a2-images.myspacecdn.com/images03/22/76b5cfafc7e54f699c14dae13120ca3e/600x600.jpg",
                            description: "Young the Giant is an American rock band that formed in Irvine, California, in 2004. "},
    "Action Bronson" : {tier: 2, points: 140, image:"https://images.genius.com/4c92d833aae01e64b71a556bb1cb9f0b.990x660x1.jpg", 
                        description: "Arian Asllani, better known by the stage name Action Bronson, is an American rapper and former chef."},
    "Alt J" : {tier: 2, points: 125, image: "https://pbs.twimg.com/profile_images/847091337870675968/w9J6SPFD.jpg",
                description: "alt-J, stylized as ∆, are an English indie rock band formed in 2007 in Leeds, by Gwil Sainsbury, Joe Newman, Thom Sonny Green and Gus Unger-Hamilton."},
    "Sleigh Bells" : {tier: 3, points: 101, image:"https://static01.nyt.com/images/2012/02/13/arts/sleigh/sleigh-jumbo.jpg",
                        description: "Sleigh Bells is an American noise pop musical duo based in Brooklyn, New York, formed in 2008."},
    "Royal Blood" : {tier: 3, points: 103, image:"https://static.independent.co.uk/s3fs-public/thumbnails/image/2014/06/27/14/royal-blood.jpg",
                        description: "Royal Blood are an English rock duo formed in Brighton in 2013."},
    "Dawes" : {tier: 3, points: 97, image:"https://media.npr.org/assets/img/2013/04/22/1358283943mn2a7311noahabrams_wide-c339bd7505a99c757f3cef4694c51016e42c424f.jpg?s=1400",
                        description: "Dawes is an American folk rock band from Los Angeles, California. "},
    "Thundercat" : {tier: 3, points: 87, image:"http://ima.ulximg.com/image/src/artist/1466713157_7d87652ae2eecc14a39b0f56aa50fd38.jpg/70430947efe461f84300ab3f26f23780/1466713157_a2f51704a5c68a71b8e830697aad42ed.jpg",
                        description: "Stephen Bruner, better known by his stage name Thundercat, is an American multi-genre bass guitarist, producer and singer from Los Angeles, California."},
    "Noname" : {tier: 3, points: 83, image:"https://pixel.nymag.com/imgs/daily/vulture/2016/10/27/27-noname.w1200.h630.jpg",
                        description: "Fatimah Warner, better known by her stage name Noname, is an American poet and hip hop recording artist from the Bronzeville neighborhood of Chicago, Illinois."},
    "Kali Uchis" : {tier: 4, points: 68, image: "http://scoremoreshows.com/wp-content/uploads/2015/11/tumblr_ntnrnsK1Yb1sz5f6xo6_1280.jpg",
                    description: "Karly Loaiza, better known as her stage name Kali Uchis, is a Colombian-American singer, songwriter, record producer, music video director, and fashion designer from Alexandria, Virginia."},
    "Joseph" : {tier: 4, points: 40, image: "https://static1.squarespace.com/static/51f750ffe4b0dcb62541171d/t/5744636bab48de86e9048efb/1464099704968/20160412_ATORecords_Joseph_EbruYildiz_294-2_RETOUCHEDCROPPED2+copy.jpg?format=1500w",
                    description: "Joseph is an American folk band from Portland, Oregon."},
    "Frenship" : {tier: 4, points: 27, image: "http://www.wearefrenship.com/wp-content/uploads/2016/08/FRENSHIP-press-photo-2016-billboard-650.jpg",
                    description: "Frenship is an American indie pop duo, consisting of James Sunderland and Brett Hite."},
    "San Fermin" : {tier: 4, points: 33, image: "https://media.npr.org/assets/img/2015/04/13/_images_uploads_gallery_san_fermin_band_photo_-credit_denny_renshaw-_wide-d5487a358a6055bd85a5b49efef6d358edd4e302.jpg?s=1400",
                    description: "San Fermin is an American indie rock band, led by Brooklyn-based composer and songwriter Ellis Ludwig-Leone."},
    "Jacob Banks" : {tier: 4, points: 32, image: "https://smhttp-ssl-33667.nexcesscdn.net/manual/wp-content/uploads/2015/12/jacob-banks-cover-1050x590.jpg",
                    description: "Jacob Banks is a British singer-songwriter from Birmingham."}
        
    }; //artist object
    
// ============
//  DATA
// ============
mongoose.connect("mongodb://localhost/outside", {useMongoClient: true});


// ============
//  FUNCTIONS
// ============

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }

    res.redirect("/");
}

function getTier(artists, tier) {
    var result = {};
    for(var key in artists) {
        if(artists[key].tier == tier) {
            result[key] = artists[key];
        }
    }
    
    return result;
}

function tier() {
    var result = [];
    for(var i = 0; i < 5; i++) {
        result.push(getTier(artists, i));
    }
    return result;
}

function getFullLineup(lineup) {
    var result = {};
    
    lineup.forEach(function(l) {
        result[l] = artists[l];
        
    });
    
    return result;
    
    
}

function getTotal(lineup) {
    var total = 0;
    
    lineup.forEach(function(l) {
       total += artists[l].points; 
    });

    return total;
}

function makeCode(){
  var chars = 'acdefhiklmnoqrstuvwxyz0123456789'.split('');
  var result = '';
  for(var i=0; i<6; i++){
    var x = Math.floor(Math.random() * chars.length);
    result += chars[x];
  }
  
  if (result in codes){
    return makeCode();
      
  } else {
    codes.push(result);
    return result;
  }
      
}

var codes = [];

function incrementPoints(key) {
    artists[key].points =artists[key].points+ 1;
}