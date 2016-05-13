/*
	meteor add accounts-ui						for accounts
	meteor add accounts-password
	meteor add iron:router 						for routing
	meteor add themeteorchef:jquery-validation 	for validator
	meteor add easy:search 						for searching
	meteor add lepozepo:cloudinary 				for image upload
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
	})

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
			var results = Postings.insert({title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: new Date(),
							createdBy: currentUsername,
							postingImages: postingImages 
			});
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
						Router.go(Session.get("previousLocationPath"));
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
					if(error.reason == "User not found"){
						validator.showErrors({
							email: error.reason
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