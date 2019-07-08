//jshint esversion:6
const express=require("express");
const app= express();
const bodyParser=require("body-parser");
const ejs=require("ejs");
const lodash=require("lodash");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const {check,validationResult}=require("express-validator");
const flash=require("connect-flash");
const multer=require("multer");
const multerConfig={
  storage:multer.diskStorage({
    destination:function(req,file,next){
      next(null,"public/images");

    },
    filename:function(req,file,next){
      const ext=file.mimetype.split("/")[1];
      next(null,file.fieldname+"-"+Date.now()+"."+ext);

    }
  }),
  fileFilter:function(req,file,next){
    if(!file)
    next();

  const image=file.mimetype.startsWith("image/");
  if(image){
    next(null,true);

  }
  else{
    next({message:"File not supported"},false);
  }


}};



//var popup = require('popups');
mongoose.set('useFindAndModify', false);
var currrentUser;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//app.use(expressValidator());

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized: false,

}));

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});













app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
  username:String,
  password:String,
  formsArray:Array
});
const formSchema=new mongoose.Schema({
  username:String,
  formTitle:String,
  formSubmission:Array

});

userSchema.plugin(passportLocalMongoose);
const Form=new mongoose.model("Form",formSchema);
const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});







app.get("/",function(req,res){
  var documents=[];
  Form.find({},function(err,docs){
    if(err)
    console.log(err);
    documents=docs;
    function compare(x,y){
      if(x.formSubmission.length<y.formSubmission.length){
        return -1;
      }
      if(x.formSubmission.length>y.formSubmission.length){
        return 1;
      }
      return 0;
    }
    documents.sort(compare);
    //console.log(documents);
    res.render("home",{docs:documents});
  });
//console.log(documents);

});
var success;
app.get("/login",function(req,res){
  let s;
  if(success)
  {success=undefined;
  s="Successfully Registered";}


  res.render("login",{success:s});
});
app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
      //console.log("path1");
      //res.redirect("/login");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        console.log("hi");
        //res.send("HI");
        res.redirect("/user/"+user.username);
      });

    }
  });


app.get("/logout",function(req,res){
  var logout = function (req, res, next) {
   // Get rid of the session token. Then call `logout`; it does no harm.
   req.logout();
   req.session.destroy(function (err) {
     if (err) { return next(err); }
     // The response should indicate that the user is no longer authenticated.
     return res.send({ authenticated: req.isAuthenticated() });
   });
 };
  res.redirect("/");
});



});
var newForm={fields:[]};
app.get("/user/:currrentUser",function(req,res){

  if(req.isAuthenticated()){
    newForm={};
    //userForms=User.find({username:req.params.currrentUser},"formsArray").then((output)=>{
      //console.log(output);
    //});
    //User.find({},function(err,docs){
      //if(err)
      //console.log(err);
      //else{
        //console.log(docs);
      //}
    //});
            var d;
user=req.params.currrentUser;
    User.find({username:user},function(err,docs){
      if(err)
      console.log(err);
      else{
          //console.log(docs);
        res.render("user",{user:user,d:docs});

      }
    });
    console.log(d);
    //res.redirect('back');



  }

  else{
    res.redirect("/login");
  }
});
app.get("/formHeader/:user",function(req,res){
  newForm={fields:[]};
  currrentUser=req.params.user;
  res.render("formHeader",{user:currrentUser});
});
app.post("/formHeader/:user",function(req,res){
  currrentUser=req.params.user;
  newForm.creator=currrentUser;
  newForm.formTitle=req.body.formTitle;
  newForm.fieldTime=req.body.fieldTime;
  newForm.setTime=Math.floor(Date.now() / 1000);
  newForm.submissionArray=[];
  res.redirect("/newForm/"+currrentUser);
});
function isActive(form){
  var period;
  if(form.fieldTime=="twelve"){
    period=12*3600;

  }
  else if(form.fieldTime=="twentyFour")
  period=24*3600;
  else
  period=48*3600;

  if(form.setTime+period<Math.floor(Date.now() / 1000))
  {console.log("false");return false;}
  else
  {console.log("true");return true;}

}


var otherUserForms=[];
app.get("/userHome/:user",function(req,res){
  otherUserForms=[];
  currrentUser=req.params.user;
  User.find({username:{$ne:currrentUser}},function(err,docs){
    if(err)
    console.log(err);
    else{

      docs.forEach(function(e){

          //console.log(e.username);
          for(let k=0;k<e.formsArray.length;k++){
            //console.log(e.formsArray[k]);
            //e.formsArray[k].forEach(function(ed){
              //ed = ed.replace(/\s+/g, '-').toLowerCase();
            //});

            if(e.formsArray[k].formTitle!=undefined){
            e.formsArray[k].formTitle=e.formsArray[k].formTitle.replace(/\s+/g, '-').toLowerCase();
            
            otherUserForms.push(e.formsArray[k]);}
          }
          console.log(otherUserForms);

      });
      //console.log(otherUserForms);
      res.render("userHome",{user:currrentUser,docs:otherUserForms});
    }


  });

app.get("/fillform/:user/:creator/:form",function(req,res){
  var user=req.params.user;
  var formCreator=req.params.creator;
  var formTitle=req.params.form;
  var form;
  User.find({username:formCreator},function(err,docs){
    if(err)
    console.log(err);
    else{
      docs.forEach(function(e){
        for(var i=0;i<e.formsArray.length;i++){
          //console.log(e.formsArray[i].formTitle.replace(/\s+/g, '-').toLowerCase());
          if(e.formsArray[i].formTitle.replace(/\s+/g, '-').toLowerCase()==formTitle){
            res.render("formSubmit",{user:user,form1:e.formsArray[i]});


          }
        }
      });
    }



  });

});

app.post("/formSubmission/:user/:creator/:title",multer(multerConfig).single("photo"),function(req,res){
  var submission={};
  if(req.file){
    req.body.photo=req.file.filename;
  }

  User.find({username:req.params.creator},function(err,docs){
    if(err)
    console.log(err);
    else{

        docs.forEach(function(e,index){
          for(var i=0;i<e.formsArray.length;i++){
            //console.log(e.formsArray[i].formTitle.replace(/\s+/g, '-').toLowerCase());
            if(e.formsArray[i].formTitle.replace(/\s+/g, '-').toLowerCase()==req.params.title.replace(/\s+/g, '-').toLowerCase()){
              console.log("line 248");

              submission=req.body;
              submission.submitter=req.params.user;

              //console.log(submission);
              Form.find({username:req.params.creator},function(err,docs){
                if(err)
                console.log(err);
                else{
                  if(!docs.length){
                    console.log("line 259");
                    var submit=new Form({
                      username:req.params.creator,
                      formTitle:req.params.title.replace(/\s+/g, '-').toLowerCase(),
                      formSubmission:[submission]
                    });
                    submit.save(function(err){
                      if(err)
                      console.log(err);
                    });


                  }
                  else{
                    console.log("line 273");
                    for(var i=0;i<docs.length;i++){
                      for(var j=0;j<docs[i].formSubmission.length;j++){

                         Form.find({formTitle:req.params.title.replace(/\s+/g, '-').toLowerCase()},function(err,output){
                           if(err)
                           console.log(err);
                           else{
                             if(!output.length){
                               var newDoc=new Form({
                                 username:req.params.creator,
                                 formTitle:req.params.title.replace(/\s+/g, '-').toLowerCase(),
                                 formSubmission:[submission]
                               });
                               newDoc.save(function(err){
                                 if(err)
                                 console.log(err);
                               });
                             }
                             else{
                               Form.findOneAndUpdate({username:req.params.creator,formTitle:req.params.title.replace(/\s+/g, '-').toLowerCase()},{
                                 $push:{formSubmission:submission}
                               },function(err,aff,resp){if(err)console.log(err); else{console.log("successfully updated "+req.params.title.replace(/\s+/g, '-').toLowerCase());}});





                             }

                           }
                         });




                      }
                    }

                  }
                }
              });


              //console.log(e.formsArray[i].submissionArray);
              //User.update({username:req.params.creator},{$push:{"formsArray.i.formSubmission":submission}});


              //e.formsArray[i].submissionArray.push(req.body);
              //console.log(e.formsArray[i].submissionArray);





            }
          }
          //e.save(function(err){
            //if(err)
            //console.log(err);
            //else
            //console.log("successful");
          //});
        });



    }
    //docs.save().then(function(err,updatedObject){
      //if(err)console.log(err);
      //console.log("successfully submitted");
    //});





  });
res.redirect("/user/"+req.params.user);
});



});

function isThere(username){


}


var errors=[];

app.get("/signup",function(req,res){
  //req.session.errors=null;
  res.render("signup",{errors:errors});
});

var u;
app.post("/signup",function(req,res){
  errors=[];
  //req.check("password","password is invalid").isLength({min:4}).equals(req.body.confirmPassword);
  //var errors=req.validationErrors();
  //if(errors){
    //req.session.errors=errors;
    //res.redirect("/signup");
  //}

      User.findOne({username:req.body.username},function(er,doc){
        if(er)
        console.log(er);
        else{
          if(doc){
        u=false;
        console.log("I got called!!!");
        let salt=["123","abc","1","1997"];
        let sugUsername="";
        salt.forEach(function(e){
          if(User.exists({username:req.body.username+e})){
            //console.log("in here!!");
            sugUsername+=req.body.username+e+"/";
          }
        });
        console.log(sugUsername);
        errors.push("That username is already taken!!Try:"+sugUsername);
         res.redirect("/signup");}
        else{let t=true;
          if(!req.body.username||!req.body.password||!req.body.confirmPassword)
            {errors.push("Please fill in all the fields!");
            t=false;}
            //res.redirect("/signup");}
          if(req.body.password.length<5){
            errors.push("Password should have a minimum length of 5");
            t=false;
            //res.redirect("/signup");
          }
          if(req.body.password!=req.body.confirmPassword){
            errors.push("Password and Confirm password fields have different values");
            t=false;
          }
          if(t){
          User.register({username:req.body.username},req.body.password,function(err,user){
            if(err){
              console.log(err);
              res.redirect("/signup");
            }
            else{
              passport.authenticate("local")(req,response,function(){
                //success="Successfully Registered!"
                //res.redirect("/login");
              });
            }


          });
          res.redirect("/login");
        }
        else{
          res.redirect("/signup");
        }




        }

    }});







console.log(u);
//console.log(errors);


//console.log(errors+isThere(req.body.username));



});

app.get("/newForm/:user",function(req,res){
  currrentUser=req.params.user;
  res.render("newForm",{user:currrentUser,newForm:newForm});
});
app.post("/newForm/:user",function(req,res){
  //newForm.push(req.body.formTitle);
    currrentUser=req.params.user;
   console.log(newForm);
  //User.findOneAndUpdate({username:currrentUser},{$push:{formsArray:newForm}});

  User.update(
    {username:currrentUser},
    {$push:{formsArray:newForm}},{upsert:true}, function(err){
        if(err){
                console.log(err);
        }else{
                console.log("Successfully added");
        }
  });

  res.redirect("/user/"+currrentUser);
  });

  var defaultOptions=[[{fieldName:"Weight",fieldType:"number"},{fieldName:"age",fieldType:"number"},{fieldName:"Height",fieldType:"number"},{fieldName:"Eating patterns",fieldType:"text"}],[{fieldName:"Name",fieldType:"text"},{fieldName:"Daily calorie consumption",fieldType:"number"},{fieldName:"age",fieldType:"number"},{fieldName:"Your picture",fieldType:"file"}]];

  app.get("/addInput/:user",function(req,res){
    currrentUser=req.params.user;
    res.render("addField",{user:currrentUser});


  });
  app.get("/customTemplates/:user",function(req,res){
    res.render("customTemplates",{options:defaultOptions,user:req.params.user});

  });
  app.post("/customTemplates/:user",function(req,res){
    var index=req.body.optionIndex;
    for(var k=0;k<defaultOptions[index].length;k++){
      newForm.fields.push(defaultOptions[index][k]);
    }
    res.redirect("/newForm/"+req.params.user);

  });

app.post("/addInput/:user",function(req,res){
  currrentUser=req.params.user;
  var options={
    fieldName:req.body.fieldName,
    fieldType:req.body.fieldType
  };
  newForm.fields.push(options);
  res.redirect("/newForm/"+currrentUser);

});

app.get("/viewSubmission/:user/:formTitle",function(req,res){
  Form.find({username:req.params.user,formTitle:req.params.formTitle.replace(/\s+/g, '-').toLowerCase()},function(err,docs){
    if(err)
    console.log(err);
    else{
      console.log(docs);
      console.log("length is "+docs.length);
      if(docs.length>0){
      var dok=docs[0];
      var submission1=[];
      var result=[];
      dok.formSubmission.forEach(function(e){
        submission1=[];
        for(let [key,value] of Object.entries(e)){
          if(key!="button")
          submission1.push(`${key}:${value}`);
        }
        result.push(submission1);
      });


   console.log(result);

    res.render("viewSubmission",{docs:result,user:req.params.user});
  }
  else{
    console.log("// WARNING: ");
    res.render("viewSubmission",{docs:[],user:req.params.user});
  }
  }

  });
});







app.listen(3000,function(){
  console.log("Listening in port 3000");
});
