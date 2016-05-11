/*
	meteor add accounts-ui						for accounts
	meteor add accounts-password
	meteor add iron:router 						for routing
	meteor add themeteorchef:jquery-validation 	for validator
	meteor add easy:search 						for searching
	meteor add lepozepo:cloudinary 				for image upload
*/


Postings = new Mongo.Collection('postings');

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

Router.route('/account',{
	name: 'account'
})

Router.route('/newPosting',{
	name: 'newPosting'
});

Router.route('/posting/:_id',{
	name: 'posting',
	template: 'posting',
	data: function(){		//retrieves current posting id,
		var currentPosting = this.params._id; //returns posting info
		return Postings.findOne({_id: currentPosting});
		}
	});



	Template.navigation.events({
		'click .logout': function(event){
			Meteor.logout();
			location.reload(); //refresh the page
		}
	});

	Template.displayPostings.helpers({
		'posting': function(){
			return Postings.find({}, {sort: {createdAt: -1}});
		},
		'timedifference': function(){
			var currentTime = new Date();
			var postingTime = this.createdAt;
			return postingTime;
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
			var title = $('[name="title"]').val();
			var description = $('[name="description"]').val();
			var location = $('[name="location"]').val();
			var rentalrate = $('[name="rentalrate"]').val();
			console.log(Session.get("selected_images"));
			var results = Postings.insert({title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: new Date(),
							createdBy: currentUser
			});
			//Router.go('posting', {_id: results});
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
						Router.go("home");
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
						Router.go("home");
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
			files.push(file)
			console.log(files);
			Cloudinary._upload_file(files[0], {}, function(err, res){
				if(err){
					console.log(error);
					return;
				}
				var imageId = res.public_id;
				console.log(res);
				console.log(res.public_id);
				imageArray.push(imageId);
				console.log(imageArray);
				$('.image_holder').append(
					$.cloudinary.image(res.public_id)
				);
			});
			console.log(imageArray);
			var postingImages = {
				imageId: imageArray
			}
			Session.set("selected_images", postingImages);
			console.log(Session.get("selected_images"));
		}
		}
	});