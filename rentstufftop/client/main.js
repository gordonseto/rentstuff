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

Router.route('/newPosting',{
	name: 'newPosting'
});

Router.route('/posting/:_id',{
	name: 'posting',
	template: 'posting',
	data: function(){
		var currentPosting = this.params._id;
		return Postings.findOne({_id: currentPosting});
		}
	});


if(Meteor.isClient){

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


	Template.newPosting.events({
		'submit form': function(){
			event.preventDefault();
			var title = $('[name="title"]').val();
			var description = $('[name="description"]').val();
			var location = $('[name="location"]').val();
			var rentalrate = $('[name="rentalrate"]').val();
			console.log(title);
			var results = Postings.insert({title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: new Date()
			});
			Router.go('posting', {_id: results});
		}
	});

		Template.register.onRendered(function(){
		var validator = $('.register').validate({
			submitHandler: function(event){
				var email = $('[name=email]').val();
				var password = $('[name=password]').val();
				Accounts.createUser({
					email: email,
					password: password
				}, function(error){
					if(error){
						if(error.reason == "Email already exists."){
							validator.showErrors({
								email: error.reason
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

}

if(Meteor.isServer){

}