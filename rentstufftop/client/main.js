/*
	meteor add accounts-ui						for accounts
	meteor add accounts-password
	meteor add iron:router 						for routing
	meteor add themeteorchef:jquery-validation 	for validator
	meteor add easy:search 						for searching
	meteor add lepozepo:cloudinary 				for image upload
	npm install -g meteorite			windows only, add meteorite
	meteor add mrt:jquery-ui					add jquery-ui
	meteor add twbs:bootstrap					for bootstrap 3
	meteor add tsega:bootstrap3-datetimepicker	for calendar
	meteor add u2622:persistent-session			for persistent sessions
*/


Postings = new Mongo.Collection('postings');

//Subscribe to usernames
Meteor.subscribe("users");

Router.configure({
	layoutTemplate: 'ApplicationLayout'
});

Router.route('/',{
	name: 'home',
	template: 'home'
});

Router.route('/register',{
	name: 'register'
});

Router.route('/login',{
	name: 'login'
})

Router.route('/posting/:postingId/confirm',function(){
	this.render('confirm', {
		data: {
			postingId: this.params.postingId
			},
		});
	},{
		name: 'confirm'
});

/*
Router.route('/account',{
	name: 'account'
})
*/
Router.route('/newPosting',{
	name: 'newPosting'
});

//onStop hook is executed whenever we LEAVE a route
Router.onStop(function(){
	//register the previous route location in a session variable
	Session.set("previousLocationPath", Router.current().url);
});


Router.route('/posting/:_id',{
	name: 'posting',
	template: 'posting',
	data: function(){		//retrieves current posting id,
		var currentPosting = this.params._id; //returns posting info
		return Postings.findOne({_id: currentPosting});
		}
	});

Router.route('/profile/:createdBy', function(){
	this.render('profile', {
		data: {
			username: this.params.createdBy
			},
		});
	},{
		name: 'profile'
});

	Template.navigation.helpers({
		'loggedinUser': function(){
			user = Meteor.users.findOne({_id: Meteor.userId()});
			if(user){
				var username = user.username;
			}
			return username;
		}
	});

	Template.navigation.events({
		'click .logout': function(event){
			var currentRoute = Router.current().route.getName();
			//Router.go(currentRoute);
			console.log(this._id);
			console.log(currentRoute);
			Meteor.logout();
			document.location.reload(true);
			//Meteor.logout();
			//location.reload(); //refresh the page
		}
	});

	Template.displayPostings.helpers({
		'posting': function(){
			return Postings.find({}, {sort: {createdAt: -1}});
		},
		'timedifference': function(){

			postedDate = this.createdAt;
			currentDate = new Date();

			return getTimeDifference(postedDate, currentDate);
		}
	});

	Template.posting.helpers({
		'user': function(){
			var postingOwner = this.createdBy;
			user = Meteor.users.findOne({_id: postingOwner});
			if(user){
				var username = user.username;
			} 
			return username;
		},
		'timedifference': function(){
			postedDate = this.createdAt;
			currentDate = new Date();

			return getTimeDifference(postedDate, currentDate);
		}

	});

	Template.confirm.helpers({
		'posting': function(){
			postingId = this.postingId;
			return Postings.findOne({_id: postingId});
		},
		'daysBooked': function(){
			daysBooked = Session.get("daysBooked");
			console.log(daysBooked);
			daysBooked = getDate(daysBooked);
			return daysBooked;
		}
	});

	Template.confirm.events({
		'submit form': function(){
			event.preventDefault();
			currentUsername = Meteor.user().username;
			console.log(currentUsername);
			console.log(this.postingId);
			postingId = this.postingId;
			addedDays = Session.get("daysBooked");
			console.log(addedDays);
			posting = Postings.findOne({_id: postingId});
			console.log(posting);
			console.log(posting.daysBooked);
			console.log(posting.daysBooked.postingBookings);
			newBooking = {username: currentUsername, booked: addedDays};
			posting.daysBooked.postingBookings.push(newBooking);	//get current postingBookings array and push newBookings
			newBookingsArray = posting.daysBooked.postingBookings;	//update postingBookings in the database
			Postings.update({_id: postingId}, {$set:{daysBooked: {postingBookings: newBookingsArray}}});
		}
	});

	Template.profile.helpers({
		'posting': function(){
			profileOwner = this.username;
			return Postings.find({createdBy: profileOwner}, 
					{sort: {createdAt: -1}});
		},
		'timedifference': function(){
			postedDate = this.createdAt;
			currentDate = new Date();

			return getTimeDifference(postedDate, currentDate);
		}
	});

	Template.accountPostings.helpers({
		'posting': function(){
			var currentUser = Meteor.userId();
			return Postings.find({createdBy: currentUser}, 
					{sort: {createdAt: -1}});
		}
	});

	Template.newPosting.events({
		'submit form': function(){
			event.preventDefault();
			var currentUser = Meteor.userId();
			user = Meteor.users.findOne({_id: currentUser});
			if (user){
				var currentUsername = user.username;
			}
			var title = $('[name="title"]').val();
			var description = $('[name="description"]').val();
			var location = $('[name="location"]').val();
			var rentalrate = $('[name="rentalrate"]').val();
			var postingImages = Session.get("selected_images");
			if (postingImages == null){
				postingImages = { imageId: []}
			}
			var bookingsArray = [];
			var results = Postings.insert({title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: new Date(),
							createdBy: currentUsername,
							postingImages: postingImages,
							daysBooked: daysBooked = {
								postingBookings: []
							}
			});
			Session.set("selected_images", null);	
			Router.go('posting', {_id: results});
		}
	});

		Template.register.onRendered(function(){
		var validator = $('.register').validate({
			submitHandler: function(event){
				var email = $('[name=email]').val();
				var username = $('[name=username]').val();
				var password = $('[name=password]').val();
				Accounts.createUser({
					email: email,
					username: username,
					password: password
				}, function(error){
					if(error){
						if(error.reason == "Email already exists."){
							validator.showErrors({
								email: error.reason
								});
							}
						if(error.reason == "Username already exists."){
							validator.showErrors({
								username:error.reason
							});
						}	
					}
					else {
						Router.go('/');
					}
				});				
			}
		});
			
	});

	Template.login.onRendered(function(){
		var validator = $('.login').validate({
			submitHandler: function(event){
			var email = $('[name=email]').val();
			var password = $('[name=password]').val();
			Meteor.loginWithPassword(email, password, function(error){
				if(error){
					if(error.reason == "User not found"){	//if user not found,
						var username = getUsername(email);	//create a new user
						console.log(username);
						console.log(email);
						console.log(password);
						Accounts.createUser({
						email: email,
						username: username,
						password: password
					}, function(error){
					if(error){
						if(error.reason == "Email already exists."){
							validator.showErrors({
								email: error.reason
								});
							}
						if(error.reason == "Username already exists."){
							validator.showErrors({
								email:error.reason
							});
						}	
					}
					else {
						Router.go(Session.get("previousLocationPath"));
					}
				});
					}
					if(error.reason == "Incorrect password"){
						validator.showErrors({
							password: error.reason
						});
					}
				} 	
					else{
						var currentRoute = Router.current().route.getName();
						if(currentRoute == "login"){
						Router.go(Session.get("previousLocationPath"));
						}
					}
				});
			}
		});
	});

	$.validator.setDefaults({
		rules:{
				email: {
					required: true,
					email: true
				},
				password: {
					required: true,
				}
			},
		messages: {
				email: {
					required: "You must enter an email address.",
					email: "You've entered an invalid email address."	
				},
				password: {
					required: "A password is required."
				}
			}
	});

/*Username from email*/
function getUsername(email){
	var username = "";
	var i = 0;
		while(email[i] != '@'){
			username += email[i];
			i++;
		}
	return username;
}


/*Datetimepicker.format() to .disabledDate() format, 
	ex: 16/05/2016*/
function toCompactDate(date){
	var compactDate = "";
	compactDate += date[8];
	compactDate += date[9];
	compactDate += "/";
	compactDate += date[5];
	compactDate += date[6];
	compactDate += "/"
	compactDate += date[0];
	compactDate += date[1];
	compactDate += date[2];
	compactDate += date[3];
	return compactDate;
}

/*Datetimepicker.disabledDate() format to readable date*/
function getDate(daysBooked){
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
	
	if(daysBooked[3] != 0){	//if two digit month, concatenate
		var month = daysBooked[3].concat(daysBooked[4]);
	}
	else {
		var month = daysBooked[4];
	}
	intmonth = parseInt(month);
	if(daysBooked[0] != 0){ //check if two digit date
	return monthNames[intmonth-1] + " " + daysBooked[0] + daysBooked[1]
		+ ", " + daysBooked[6] + daysBooked[7] + daysBooked[8] + daysBooked[9];
}	//else only return daysBooked[1] for date
	return monthNames[intmonth-1] + " " + daysBooked[1]
		+ ", " + daysBooked[6] + daysBooked[7] + daysBooked[8] + daysBooked[9];
}

/* Search Box */
/*
	Template.searchbox.helpers({
		postingsIndex: () => PostingsIndex
	});
*/
/* Image Upload*/

$.cloudinary.config({
	cloud_name: "gordonseto"
});

	Template.imageupload.events({
		//Submit form event
		'submit form': function(event, t){
			event.preventDefault();

			var imageArray = [];
			console.log(imageArray);
			var numuploads = $("#postingimages input").length; //count how many images to upload
			
			for(i = 1; i < numuploads+1; i++){ //loop through images

			var files = []
			var file = $('#postingimage'+i)[0].files[0];
			if(file != null){
			files.push(file)
			console.log(files);
			Cloudinary._upload_file(files[0], {}, function(err, res){
				
				if(err){
					console.log(error);
					return;
				}
				var imageId = res.secure_url;
				console.log(res);
				console.log(res.public_id);
				imageArray.push(imageId);
				console.log(imageArray);
				$('.image_holder').append(
					$.cloudinary.image(res.public_id)
					);
				});
			}
		}
			setTimeout(function(){
				console.log(imageArray);
				var postingImages = {
					imageId: imageArray
				}
				Session.set("selected_images", postingImages);
				console.log(Session.get("selected_images"));
			},numuploads*1000);
		}
	});

/*Time Difference Function*/

	function getTimeDifference(postedDate, currentDate){
			if(postedDate == null || currentDate == null){
				return;
			}
			postedDate.toUTCString();		//convert both 
			currentDate.toUTCString(); 		//dates to UTC

			postedDate = postedDate.getTime(); //convert both dates
			currentDate = currentDate.getTime();	//to ms			
			timedifference = currentDate - postedDate;
			timedifference /= 1000*60; //time difference is now in mins
			if(timedifference > 60){
				timedifference /= 60; //time difference is now in hours
				if(timedifference > 24){
					timedifference /= 24; //time difference is now in days
					if(timedifference > 30){
						timedifference /= 30; //time difference is now in months
						if(timedifference > 12){
							timedifference /= 12; //time difference is now in years
								timedifference = Math.round(timedifference);
									if (timedifference > 1){
									return timedifference + " years ago";
										}
									return timedifference + " year ago";
							}
						timedifference = Math.round(timedifference);
							if (timedifference > 1){
							return timedifference + " months ago";
								}
							return timedifference + " month ago";
					}
					timedifference = Math.round(timedifference);
					if (timedifference > 1){
					return timedifference + " days ago";
						}
					return timedifference + " day ago";
				}
				timedifference = Math.round(timedifference);
				if (timedifference > 1){
				return timedifference + " hours ago";
					}
				return timedifference + " hour ago";
			}
			timedifference = Math.round(timedifference);
			if (timedifference > 1){
			return timedifference + " minutes ago";
				}
			return timedifference + " minute ago";
	}

	/* Calendar */

Template.calendar.onRendered(function() {
	currentDate = new Date();
        $('#datetimepicker').datetimepicker({
        	format: 'DD/MM/YYYY',
            inline: true,
            sideBySide: true,
            useCurrent: true,
            showClose: true
        });
        $('#datetimepicker').data("DateTimePicker").hide();
});


Template.calendar.helpers({
	blockDates: function() {
	console.log(this);
		//wait for datetimepicker to render
		if($('#datetimepicker').data("DateTimePicker")){
		console.log(this._id);
		postingId = this._id;
		posting = Postings.findOne({_id: postingId});
		console.log(posting.daysBooked);
		console.log(posting.daysBooked.postingBookings);
		//Check blocked days by using ._map to put 
		//booked key in array blockedDays
		var blockedDays = posting.daysBooked.postingBookings.map(function(obj){
			return obj.booked;
		});	
		console.log(blockedDays);
		//disable the days in the calendar
		$('#datetimepicker').data("DateTimePicker").disabledDates(blockedDays);
    	}	
    }
});

Template.calendar.events({
	'submit form' (event, template){
		event.preventDefault();
		currentUser = Meteor.userId();
		currentDate = new Date();
		dateTime = $('#datetimepicker').data("DateTimePicker").date();	//get date from calendar
		if(dateTime){
			if(dateTime < currentDate){			//check if valid date
				alert('Please pick a valid date');
				$('#datetimepicker').data("DateTimePicker").date([currentDate]);
				return;
			}
			if(!currentUser){
				Router.go('/login');
			}
			else{
			dateTime = dateTime.format();
			dateTime = toCompactDate(dateTime);
			postingId = this._id;
			Session.set("daysBooked", dateTime);
			Router.go('/posting/'+postingId+'/confirm/');
			}
		}
		else{
			alert('Make sure to pick a booking time');
		}
	}/*,
	'click #book-date': function(){
		event.preventDefault();
		console.log(this._id);
		postingId = this._id;
		posting = Postings.findOne({_id: postingId});
		console.log(posting.daysBooked);
		console.log(posting.daysBooked.postingBookings);
		//Check blocked days by using ._map to put 
		//booked key in array blockedDays
		var blockedDays = posting.daysBooked.postingBookings.map(function(obj){
			return obj.booked;
		});	
		console.log(blockedDays);
		//disable the days in the calendar
		currentDate = $('#datetimepicker').data("DateTimePicker").date();
		console.log(currentDate);
		currentDate = currentDate.format();
		console.log(currentDate);
		$('#datetimepicker').data("DateTimePicker").disabledDates([currentDate]);
		$('#datetimepicker').data("DateTimePicker").disabledDates(blockedDays);		
	}*/
});