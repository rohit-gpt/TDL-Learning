var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");

mongoose.connect("mongodb://localhost/tdl_learning");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(flash());

var studentSchema = new mongoose.Schema({
	name: String,
	school: String,
	rollno: String,
	email: String,
	contact: Number
});

var Students = mongoose.model("Student", studentSchema);

var courseSchema = new mongoose.Schema({
	title: String,
	code: String,
	school: String,
	details: String,
	duration: Number,
	prerequisites: String,
	classPerWeek: Number,
	taughtBy: String,
	createdOn: Date,
	students: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student"
		}
	]
});

var Courses = mongoose.model("Course", courseSchema);

var schoolSchema = new mongoose.Schema({
	name: String,
	password: String,
	courses: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course"

		}
	]
});

var Schools = mongoose.model("School", schoolSchema);

var adminSchema = new mongoose.Schema({
	username: String,
	password: String,
	schools: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "School"
		}
	]
});

adminSchema.plugin(passportLocalMongoose);

var Admin = mongoose.model("Admin", adminSchema);

// Admin.register(new Admin({
// 	username: "tdlcoordinator@ansaluniversity.edu.in"
// }), "tdlcoordinator");

// Passport Configuration
app.use(require("express-session")({
	secret: "This website rocks!",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

schoolLoggedIn = false;

app.get("/admin/login", function(req, res) {
	res.render("adminLogin", {message: req.flash("error")});
});

// app.post("/adminLogin", passport.authenticate("local", 
// 	{
// 		successRedirect: "/admin",
// 		failureRedirect: "/admin/login"
// 	}), function(req, res) {
// });

app.get("/admin/login/incorrect", function(req, res) {
	req.flash("error", "Incorrect Username/Password");
	res.redirect("/admin/login");
});

app.get("/schools", function(req, res) {
	res.redirect("/schools/login");
});

app.post("/adminLogin", passport.authenticate("local", 
	{
		failureRedirect: "/admin/login/incorrect"
	}), function(req, res) {
	req.flash("success", "Successfully Logged In");
	res.redirect("/admin/" + req.user._id);
});

app.get("/admin/logout", isLoggedIn, function(req, res) {
	req.logout();
	req.flash("error", "Logged Out!")
	res.redirect("/admin/login");
});

app.get("/admin", function(req, res) {
	res.redirect("/admin/login");
});

// app.post("/adminLogin", function(req, res) {
// 	Admin.findOne({username: req.body.username}, function(err, found) {
// 		if(err) {
// 			console.log(err);
// 		}
// 		else {
// 			res.redirect("/admin/" + found._id);
// 		}
// 	});
// });

app.get("/admin/:id", isLoggedIn, function(req, res) {
	Admin.findById(req.params.id).populate("schools").exec(function(err, found) {
		if(err) {
			console.log(err);
		}
		else {
			console.log(found);
			res.render("adminDashboard", {admin: found, message: req.flash("success")});
		}
	});
});

app.get("/admin/:id/schools/new", isLoggedIn, function(req, res) {
	Admin.findById(req.params.id, function(err, found) {
		if(err) {
			console.log(err);
		}
		else
		{
			res.render("newSchool", {admin: found});
		}
	});
});

// app.post("/admin/:id/schools", function(req, res) {
// 	Admin.findById(req.parans.id, function(err, found) {
// 		if(err) {
// 			console.log(err);
// 		}
// 		else {
// 			Schools.register(new Schools({username: req.body.schoolName}), req.body.newPassword, function(err, created) {
// 				if(err) {
// 					console.log(err);
// 					res.redirect("/admin/" + req.params.id + "/schools/new");
// 				}
// 				else {
// 					found.schools.push(created);
// 					found.save();
// 					res.redirect("/admin/" + req.params.id);
// 				}
// 			});
// 		}
// 	});
// });

app.post("/admin/:id/schools", isLoggedIn, function(req, res) {
	Admin.findById(req.params.id, function(err, found) {
		if(err) {
			console.log(err);
		}
		else
		{
			Schools.create({
				name: req.body.schoolName,
				password: req.body.newPassword
			}, function(err, created) {
				if(err) {
					console.log(err);
				} else {
					created.save();
					found.schools.push(created);
					found.save();
					req.flash("success", "Successfully Created New School");
					res.redirect("/admin/" + req.params.id);
				}
			});
		}
	});
});

app.get("/admin/:id/schools/:schoolId/update", isLoggedIn, function(req, res) {
	Admin.findById(req.params.id, function(err, foundAdmin) {
		if(err) {
			console.log(err);
		} else {
			Schools.findById(req.params.schoolId, function(err, foundSchool) {
				if(err) {
					console.log(err);
				} else {
					res.render("schoolUpdate", {admin: foundAdmin, school: foundSchool});
				}
			});
		}
	});
});

app.put("/admin/:id/schools/:schoolId", isLoggedIn, function(req, res) {
	Schools.findByIdAndUpdate(req.params.schoolId, req.body.update, function(err, updatedSchool) {
		if(err) {
			console.log(err);
		}
		else {
			req.flash("success", "Successfully Updated School");
			res.redirect("/admin/" + req.params.id);
		}
	});
});



app.get("/admin/:id/schools/:schoolId/delete", isLoggedIn, function(req, res) {
	Schools.findByIdAndRemove(req.params.schoolId, function(err, deleted) {
		if(err){
			console.log(err);
		}
		else
		{
			req.flash("success", "Successfully Removed School");
			res.redirect("/admin/" + req.params.id);
		}
	});
});

// ================================================================================================================

app.get("/schools/login", function(req, res) {
	res.render("schoolsLogin", {message: req.flash("error")});
});

app.post("/schools/login", function(req, res) {
	Schools.findOne({name: req.body.username}, function(err, foundSchool) {
		if(err) {
			console.log(err);
		} else {
			if(req.body.password == foundSchool.password) {
				schoolLoggedIn = true;
				req.flash("success", "Login Success!");
				res.redirect("/schools/" + foundSchool._id);
			}
			else {
				req.flash("error", "Username/password does not match");
				res.redirect("/schools/login");
			}
		}
	});
});

app.get("/schools/:id/courses/new", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, foundSchool) {
		if(err) {
			console.log(err);
		} else {
			res.render("newCourse", {school: foundSchool});
		}
	});
});

app.post("/schools/:id/courses", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, foundSchool) {
		if(err) {
			console.log(err);
		}
		else {
			Courses.create(req.body.course, function(err, newCourse) {
				if(err) {
					console.log(err);
				}
				else 
				{
					newCourse.createdOn = Date.now();
					newCourse.school = foundSchool.name;
					newCourse.save();
					foundSchool.courses.push(newCourse);
					foundSchool.save();
					req.flash("success", "Course Created!")
					res.redirect("/schools/" + req.params.id);
				}
			})
		}
	})
})

app.get("/schools/:id", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id).populate("courses").exec(function(err, foundSchool) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("schoolDashboard", {school: foundSchool, message: req.flash("success")});
		}
	});
});

app.get("/schools/:id/courses/:courseId", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, foundSchool) {
		if(err) {
			console.log(err);
		}
		else {
			Courses.findById(req.params.courseId, function(err, foundCourse) {
				if(err) {
					console.log(err);
				}
				else {
					res.render("coursePage", {school: foundSchool, course: foundCourse, message: req.flash("success")});
				}
			});
		}
	});
});

app.get("/schools/:id/courses/:courseId/update", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, foundSchool) {
		if(err) {
			console.log(err);
		}
		else {
			Courses.findById(req.params.courseId, function(err, foundCourse) {
				if(err) {
					console.log(err);
				}
				else {
					res.render("courseUpdate", {school: foundSchool, course: foundCourse});
				}
			});
		}
	});
});

app.put("/schools/:id/courses/:courseId", isSchoolLoggedIn, function(req, res) {
	Courses.findByIdAndUpdate(req.params.courseId, req.body.updated, function(err, updatedCourse) {
		if(err) {
			console.log(err);
		}
		else {
			req.flash("success", "Course Updated Successfully!");
			res.redirect("/schools/" + req.params.id + "/courses/" + req.params.courseId);
		}
	})
})

app.get("/schools/:id/courses/:courseId/delete", isSchoolLoggedIn, function(req, res) {
	Courses.findByIdAndRemove(req.params.courseId, function(err, deleted) {
		if(err) {
			console.log(err);
		}
		else {
			req.flash("success", "Course Deleted Successfully");
			res.redirect("/schools/" + req.params.id);
		}
	});
});

app.get("/schools/:id/courses/:courseId/students", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, foundSchool) {
		if(err) {
			console.log(err);
		}
		else {
			Courses.findById(req.params.courseId).populate("students").exec(function(err, foundCourse) {
				if(err) {
					console.log(err);
				}
				else {
					res.render("students", {course: foundCourse, school: foundSchool});
				}
			});
		}
	});
});

app.get("/schools/:id/logout", isSchoolLoggedIn, function(req, res) {
	Schools.findById(req.params.id, function(err, found) {
		if(err) {
			console.log(err);
		}
		else {
			schoolLoggedIn = false;
			req.flash("error", "Logged Out!");
			res.redirect("/schools/login");
		}
	});
});

// ===============================================================================================================

app.get("/", function(req, res) {
	Courses.find({}, function(err, courses) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("landing", {courses: courses});
		}
	});
});

app.get("/courses/:id", function(req, res) {
	Courses.findById(req.params.id, function(err, foundCourse) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("course", {course: foundCourse});
		}
	});
});

app.get("/courses/:id/enroll", function(req, res) {
	Courses.findById(req.params.id, function(err, foundCourse) {
		if(err) {
			console.log(err);
		}
		else {
			res.render("enrollForm", {course: foundCourse});
		}
	});
});

app.post("/courses/:id/enroll", function(req, res) {
	Courses.findById(req.params.id, function(err, foundCourse) {
		if(err) {
			console.log(err);
		}
		else {
			Students.create(req.body.student, function(err, createdStudent) {
				if(err) {
					console.log(err);
				}
				else {
					createdStudent.save();
					foundCourse.students.push(createdStudent);
					foundCourse.save();
					res.redirect("/success");
				}
			});
		}
	});
});

app.get("/success", function(req, res) {
	res.render("success");
});

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "Please Login First!");
	res.redirect("/admin/login");
}

function isSchoolLoggedIn(req, res, next) {
	if(schoolLoggedIn == true) {
		return next();
	}
	req.flash("error", "Please Login First!");
	res.redirect("/schools/login");
}

app.listen(8000, function() {
	console.log("Server running on PORT 8000")
});
