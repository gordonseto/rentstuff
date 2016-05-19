/*
	meteor add accounts-ui						for accounts
	meteor add accounts-password
	meteor add iron:router 						for routing
	meteor add themeteorchef:jquery-validation 	for validator
	meteor add lepozepo:cloudinary 				for image upload
	npm install -g meteorite			windows only, add meteorite
	meteor add mrt:jquery-ui					add jquery-ui
	meteor add twbs:bootstrap					for bootstrap 3
	meteor add rajit:bootstrap3-datepicker 		for calendar
	meteor add meteorhacks:search-source		for searchbox
*/	


Postings = new Mongo.Collection('postings');
Rentstuff_Users = new Mongo.Collection('rentstuff_users');

//Search box
var options = {
	keepHistory: 1000*60*5,
	localSearch: true
};
var fields = ['title', 'description', 'location', 'rentalrate'];

PostingsSearch = new SearchSource('postings', fields, options);

//Maps function
Meteor.startup(function() {
	GoogleMaps.load();
});

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

Router.route('/posting/:_id/edit',{
	name: 'edit',
	template: 'edit',
	data: function(){		//retrieves current posting id,
		var currentPosting = this.params._id; //returns posting info
		return Postings.findOne({_id: currentPosting});
		}
	});

Router.route('/success', {
	name: 'success'
})
/*
Router.route('/account',{
	name: 'account'
})
*/
Router.route('/newPosting',{
	name: 'newPosting',
	onAfterAction: function(){
		if(!Meteor.userId()){	//if not a user, redirect to login
			Router.go('/login/');
		}
	}
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

	Template.ApplicationLayout.events({
		'click a': function(){
			PostingsSearch.search(null);
		}
	})

	Template.navigation.helpers({
		'loggedinUser': function(){
			return Meteor.user().username;
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

	Template.map.helpers({
		mapOptions: function(){
			if (GoogleMaps.loaded()){
				return {
					center: new google.maps.LatLng(51.1389, -114.162),
					zoom: 14
				};
			}
		}
	});

	Template.map.onCreated(function() {
  		// We can use the `ready` callback to interact with the map API once the map is ready.
  		GoogleMaps.ready('map', function(map) {
    		// Add a marker to the map once it's ready
    		position = searchAddress();
    		var marker = new google.maps.Marker({
    			position: {lat: position.lat, lng: position.lng},
    			map: map.instance
    		});
  		});
	});

	Template.searchbox.helpers({
  		getPostings: function() {
    		return PostingsSearch.getData({
      			transform: function(matchText, regExp) {
        			return matchText;
      			},
      			sort: {isoScore: -1}
    			});
  		}
	});

	Template.searchbox.events({
    	'keyup #search-box': function(event) {
    		setTimeout(function(){
        		var text = $(event.target).val().trim();
        		PostingsSearch.search(text);
 			}, 100);
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
		},
		isOwner: function(){
			if(Meteor.user()){
				return this.createdBy == Meteor.user().username;
			}
			return false;
		},
		'posting_is_saved': function(){
		if(Meteor.user()){	
			postingId = this._id;
			//get meteor username
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			//get current saved postings array from user profile
			if(currentUser){
			current_saved_postings = currentUser.saved_postings;
			//check if posting has already been saved
			var check = current_saved_postings.indexOf(postingId);
			if(check != -1){
				return true;
			} else{
				return false;
				}
			}
		}
		}
	});

	Template.posting.events({
		'click .save-posting': function(){
			if(!Meteor.userId()){	//if not logged in, redirect to login
				Router.go('login');
			}
			else {
			postingId = this._id;
			//get meteor username
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			//get current saved postings array from user profile
			current_saved_postings = currentUser.saved_postings;
			//check if posting has already been saved
			var check = current_saved_postings.indexOf(postingId);
			if(check != -1){
				return;
			} else{			
			//else push this posting id onto array
			current_saved_postings.push(this._id);
			//save new array into rentstuff_users profile
			Rentstuff_Users.update({_id: currentUser._id}, 
				{$set:{'saved_postings': current_saved_postings}});
				}
			}
		},
		'click .posting-saved': function(){
			postingId = this._id;
			//get meteor username
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			//get current saved postings array from user profile
			current_saved_postings = currentUser.saved_postings;
			//find index of posting in array
			var index = current_saved_postings.indexOf(postingId);
			if(index == -1){
				return;
			} else{			
			//delete this posting id from array
			current_saved_postings.splice(index, 1);
			//save new array into rentstuff_users profile
			Rentstuff_Users.update({_id: currentUser._id}, 
				{$set:{'saved_postings': current_saved_postings}});
			}
		},
		'click .bump': function(){
			createdAt = new Date();
			Postings.update({_id: this._id}, {$set: {createdAt: createdAt}});
		}
	});

	Template.posting_map.helpers({
		mapOptions: function(){
			if (GoogleMaps.loaded()){
				return {
					center: new google.maps.LatLng(this.geocode_address.lat, this.geocode_address.lng),
					zoom: 11
				};
			}
		}
	});

	Template.posting_map.onCreated(function() {
		//Get data context
		thiscontext = Template.currentData();
  		// We can use the `ready` callback to interact with the map API once the map is ready.
  		GoogleMaps.ready('map', function(map) {
    		// Add a marker to the map once it's ready
    		position = searchAddress();
    		var marker = new google.maps.Marker({
    			position: {lat: thiscontext.geocode_address.lat, lng: thiscontext.geocode_address.lng},
    			map: map.instance
    		});
  		});
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
			//get current user
			currentUsername = Meteor.user().username;
			console.log(currentUsername);
			console.log(this.postingId);
			//get posting id
			postingId = this.postingId;
			//get added days from session "daysBooked" set in posting events
			addedDays = Session.get("daysBooked");
			console.log(addedDays);
			if(addedDays){
				//find posting from db 
				posting = Postings.findOne({_id: postingId});
				console.log(posting);
				console.log(posting.daysBooked);
				console.log(posting.daysBooked.postingBookings);
				//Update account loaning
				//meteor username is same as rentstuff username
				postingOwner = posting.createdBy;
				console.log(postingOwner);
				postingOwner = Rentstuff_Users.findOne({username: postingOwner});
				console.log(postingOwner);
				//get current loans array
				loansArray = postingOwner.loans;
				console.log(loansArray);
				//loop through number of days booked
				numsDaysBooked = addedDays.length;
				for(i = 0; i<numDaysBooked; i++){
					//make new object "newBooking" with username and addedDays
					newBooking = {postingId: postingId, username: currentUsername, booked: addedDays[i]};
					//push newBooking onto previous saved array
					posting.daysBooked.postingBookings.push(newBooking);	
					newBookingsArray = posting.daysBooked.postingBookings;
					//insert newBooking into posting owner's loansArray
					loansArray = insert(newBooking, loansArray);
					console.log(loansArray);
				}	//update postingBookings in the database
				Postings.update({_id: postingId}, {$set:{daysBooked: {postingBookings: newBookingsArray}}});
				//update posting owner's loans array
				console.log(postingOwner._id);
				Rentstuff_Users.update({_id: postingOwner._id}, {$set:{loans: loansArray}})
				//Update account booking
				//meteor username is same as Rentstuff_Users username
				currentUser = Rentstuff_Users.findOne({username: currentUsername});
				console.log(currentUser);
				//get current bookings from user profile
				current_bookings = currentUser.bookings;
				console.log(current_bookings);
				//create object to add to array
				var bookingObj = {postingId: postingId, 
									days: addedDays}
				console.log(bookingObj);
				//check if posting has already been saved
				var check = current_bookings.indexOf(bookingObj);
				if(check != -1){
					return;
				} else{			
				//else push this bookingObj onto array
				current_bookings.push(bookingObj);
				console.log(current_bookings);
				//save new array into rentstuff_users profile
				Rentstuff_Users.update({_id: currentUser._id}, 
				{$set:{bookings: current_bookings}});
				}	
				Router.go('success');
			}
		}
	});


/*Insert Function for profile loanings*/
function insert(element, array){
	array.splice(locationOf(element,array) + 1, 0, element);
	return array;
}

/*Quicksort Function for profile loanings*/
function locationOf(element, array, start, end){
	if(array.length === 0)
	return -1;

	start = start || 0;
	end = end || array.length;
	var pivot = parseInt(start + (end-start) / 2, 10);
	if(new Date(array[pivot].booked).getTime() === new Date(element.booked).getTime())
		return pivot;
	if(end-start <=1) 
		return new Date(array[pivot].booked).getTime() > new Date(element.booked).getTime() ? pivot - 1 : pivot;
	if(new Date(array[pivot].booked).getTime() < new Date(element.booked).getTime()){
		return locationOf(element,	array,	pivot,	end);
	}else{
		return locationOf(element, array, start, pivot);
	}
}


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
		},
		isOwner: function(){
			if(Meteor.user()){
				return this.username == Meteor.user().username;
			}
			return false;
		}
	});

	Template.profile_loans.helpers({
		'loans': function(){
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			console.log(currentUser);
			if(currentUser){
			//get current saved postings array from user profile
			loans = currentUser.loans;
			}
			return loans;
		},
		'loans_preview': function(){
			postingId = this.postingId;
			if(postingId){
				return Postings.findOne({_id: postingId});
			}
		},
		'loans_preview_days': function(){
			booked = this.booked;
			if(booked){	
				//getDate takes an array of dates
				return getDate([booked]);
			}
		}
	});

	Template.profile_bookings.helpers({
		'bookings': function(){
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			if(currentUser){
			//get current saved postings array from user profile
			current_bookings = currentUser.bookings;
			return current_bookings.reverse();
			}
		},
		'bookings_preview': function(){
			//get postingId
			postingId = this.postingId;
			return Postings.findOne({_id: postingId});
		},
		'bookings_preview_days': function(){
			days = this.days;
			return getDate(days);
		}
	});

	Template.profile_saved_postings.helpers({
		'saved_postings': function(){
			meteorusername = Meteor.user().username;
			//meteor username is same as Rentstuff_Users username
			currentUser = Rentstuff_Users.findOne({username: meteorusername});
			if(currentUser){
			//get current saved postings array from user profile
			current_saved_postings = currentUser.saved_postings;
			return current_saved_postings.reverse();		
			}
		},
		'saved_postings_preview': function(){
			postingId = this.valueOf();
			return Postings.findOne({_id: postingId});
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
			var address = $('[name="address"]').val();
			var rentalrate = $('[name="rentalrate"]').val();
			var postingImages = [];
			$(".image_holder img").each(function(){
				postingImages.push(this.src);	//get images from DOM
			})
			daysAvailable = $('#datepicker').datepicker('getFormattedDate');
			console.log(daysAvailable)
			var bookingsArray = [];
			searchAddress(address, function(geocode_address){
				var results = Postings.insert({title: title,
							description: description,
							location: location,
							address: address,
							geocode_address: geocode_address,
							rentalrate: rentalrate,
							createdAt: new Date(),
							createdBy: currentUsername,
							postingImages: postingImages,
							daysBooked: daysBooked = {
								postingBookings: []
							},
							daysAvailable: daysAvailable
				});
				Session.set("selected_images", null);	
				Router.go('posting', {_id: results});
			});
		},
		'click .delete-image': function(){
			event.preventDefault();
			console.log(this);
			console.log(parentData(1));
			deleteImage = this;	//get image url to delete
			deleteImage = deleteImage.valueOf(); 
			var parentthis = Template.parentData(1); //get parent context
			var postingImages = parentthis.postingImages; //get postingImages
			//find item in array
			var deleteImage_index = postingImages.indexOf(deleteImage);
			//delete item from array
			if(deleteImage_index != -1){
				postingImages.splice(deleteImage_index, 1);
			}
			console.log(postingImages);
			//edit saved postingImages object in database
			//Postings.update({_id: parentthis._id}, {$set: {'postingImages': postingImages}});
		},
		'click #all-dates': function(){
			var checkbox = $(this);
			console.log(checkbox);
			if (checkbox.is(':checked')) {	//checkbox was checked
				console.log('hi');
			} else{						//check box was unchecked
				console.log('yo');
			}
		}
	});

	Template.edit.events({
		'submit form': function(){
			event.preventDefault();
			var currentUser = Meteor.userId();
			user = Meteor.users.findOne({_id: currentUser});
			if (user){
				var currentUsername = user.username;
			}
			var postingId = this._id;
			var title = $('[name="title"]').val();
			var description = $('[name="description"]').val();
			var location = $('[name="location"]').val();
			var rentalrate = $('[name="rentalrate"]').val();
			var postingImages = this.postingImages;
			console.log(postingImages);
			if(Session.get("selected_images")){			//if adding more images, 
				addedImages = Session.get("selected_images").imageId;
				if(postingImages.imageId == null){		//check if previous images, if not no push
					postingImages = Session.get("selected_images"); //making postingImages imageupload object
					console.log(postingImages);
				}
				else{		//if there is a previous postingImages object, push addedImages onto array
					postingImages.imageId.push(addedImages);
					console.log(postingImages);
				}
			}
			var bookingsArray = this.daysBooked.postingBookings;
			var createdAt = this.createdAt;
			Postings.update({_id: postingId},{$set: {title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: createdAt,
							createdBy: currentUsername,
							postingImages: postingImages,
							daysBooked: daysBooked = {
								postingBookings: bookingsArray
							}
			}});
			Session.set("selected_images", null);	
			Router.go('/posting/'+postingId);
		},
		'click .delete-image': function(){
			event.preventDefault();
			console.log(this);
			deleteImage = this;	//get image url to delete
			deleteImage = deleteImage.valueOf(); 
			var parentthis = Template.parentData(1); //get parent context
			var postingImages = parentthis.postingImages; //get postingImages
			//find item in array
			var deleteImage_index = postingImages.indexOf(deleteImage);
			//delete item from array
			if(deleteImage_index != -1){
				postingImages.splice(deleteImage_index, 1);
			}
			console.log(postingImages);
			//edit saved postingImages object in database
			//Postings.update({_id: parentthis._id}, {$set: {'postingImages': postingImages}});
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
					password: password,
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
						Rentstuff_Users.insert({
							username: username,
							email: email,
							bookings: [],
							loans: [],
							saved_postings: []
						});
						Router.go('/');
					}
				});				
			}
		});
			
	});
//
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
						password: password,
						loans: [],
						bookings: []
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
						Rentstuff_Users.insert({
							username: username,
							email: email,
							bookings: [],
							loans: [],
							saved_postings: []
						});						
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

/* Google Maps Geocode*/
function searchAddress(addressInput, fn){
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'address': addressInput}, function(results, status){
		if(status == google.maps.GeocoderStatus.OK){
			lat = results[0].geometry.location.lat();
			lng = results[0].geometry.location.lng();
			console.log(lat);
			console.log(lng);
			var latlng = {lat: lat, lng: lng};
			fn(latlng);
		} else{
			//warning message
			console.log(status);
		}
	});
}

function createMarker(latlng){
	//If the user makes another search you must clear the marker variable
	if(marker != undefined && marker != ''){
		market.setMap(null);
		marker = '';
	}

	marker = new google.maps.Marker({
		map: map,
		position: latlng
	})
}

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

/*Datepicker format to readable date*/
function getDate(daysBooked){
var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
	readableDate = "";
	numDaysBooked = daysBooked.length;
	
	for(i = 0; i < numDaysBooked; i++){ //loop through dates
		if(i > 0){ 							//if adding date, add a comma or "and"
			if((numDaysBooked - 1) != 1){  	//check if last date,
				readableDate += ", " 		//if not, only add comma
			}
			else { 							//else add "and "
				readableDate += " and "
			}
		}
		if(daysBooked[i][0] != 0){	//if two digit month, concatenate
			var month = daysBooked[i][0].concat(daysBooked[1]);
		}
		else {
			var month = daysBooked[i][1];
		}
		intmonth = parseInt(month);
		if(daysBooked[i][3] != 0){ //check if two digit date
			readableDate += monthNames[intmonth-1] + " " + daysBooked[i][3] + daysBooked[i][4]
			+ ", " + daysBooked[i][6] + daysBooked[i][7] + daysBooked[i][8] + daysBooked[i][9];
		} else{	//else only return daysBooked[1] for date
			readableDate += monthNames[intmonth-1] + " " + daysBooked[i][4]
			+ ", " + daysBooked[i][6] + daysBooked[i][7] + daysBooked[i][8] + daysBooked[i][9];
		}
	}
	return readableDate;
}

/* Image Upload*/

$.cloudinary.config({
	cloud_name: "gordonseto"
});
//
	Template.imageupload.events({
		//Submit form event
		'submit form': function(event, t){
			event.preventDefault();

			var imageArray = [];
			console.log(imageArray);
			var numuploads = $("#postingimages input").length; //count how many images to upload
			console.log(numuploads);
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
				var imageurl = res.secure_url;
				console.log(res);
				console.log(res.public_id);
				imageArray.push(imageurl);
				console.log(imageArray);
				$('.image_holder').append(
				"<p><img src="+imageurl+"><a href='#' class='delete-image'>[delete]</a></p>"
				);
			});
			}
		}
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
							if (timedifference != 1){
							return timedifference + " months ago";
								}
							return timedifference + " month ago";
					}
					timedifference = Math.round(timedifference);
					if (timedifference != 1){
					return timedifference + " days ago";
						}
					return timedifference + " day ago";
				}
				timedifference = Math.round(timedifference);
				if (timedifference != 1){
				return timedifference + " hours ago";
					}
				return timedifference + " hour ago";
			}
			timedifference = Math.round(timedifference);
			if (timedifference != 1){
			return timedifference + " minutes ago";
				}
			return timedifference + " minute ago";
	}

	/* Calendar */

Template.newPosting.onRendered(function(){
	currentDate = new Date();
	oneYear = new Date();
	oneYear.setYear(currentDate.getFullYear()+1);
	$('#datepicker').datepicker({
		container: '#datepicker',
		clearBtn: true,
		startDate: currentDate,
		endDate: oneYear,
		title: "Available Dates:",
		multidate: true
	});	
})

//Calendar doesn't show on navigation without rendered

Template.calendar.rendered = function(){
	currentDate = new Date();
	oneYear = new Date();
	oneYear.setYear(currentDate.getFullYear()+1);
	//Get parent datacontext
	var dataContext = Template.currentData();
	if (dataContext){
	console.log(dataContext);
	//Get postingId from parent context
	postingId = dataContext._id;
	console.log(postingId);
	//find posting
	posting = Postings.findOne({_id: postingId});
	console.log(posting.daysBooked);
	console.log(posting.daysBooked.postingBookings);
	//Check blocked days by using ._map to put 
	//booked key values in array blockedDays
	var blockedDays = posting.daysBooked.postingBookings.map(function(obj){
		return obj.booked;
	});	
	console.log(blockedDays);
		$('#datepicker').datepicker({
			container: '#datepicker',
			startDate: currentDate,
			endDate: oneYear,
			clearBtn: true,
			multidate: true,
			datesDisabled: blockedDays	//block days booked
		});
	}
}

//Calendar doesn't show on reload without onRendered and helper

Template.calendar.onRendered(function(){
	oneYear = new Date();
	oneYear.setYear(currentDate.getFullYear()+1);
	$('#datepicker').datepicker({
		container: '#datepicker',
		startDate: currentDate,
		endDate: oneYear,
		clearBtn: true,
		multidate: true
	});	
});

Template.calendar.helpers({
	blockDates: function(){
		console.log(this._id);
		postingId = this._id;
		if(postingId){
		posting = Postings.findOne({_id: postingId});
		console.log(posting.daysBooked);
		console.log(posting.daysBooked.postingBookings);
		//Check blocked days by using ._map to put 
		//booked key values in array blockedDays
		var blockedDays = posting.daysBooked.postingBookings.map(function(obj){
			return obj.booked;
		});	
		console.log(blockedDays);
		//disable the days in the calendar
		$('#datepicker').datepicker('setDatesDisabled', blockedDays);
		}
	}
});

Template.calendar.events({
	'submit form': function(){
		event.preventDefault();
		selected_Dates = $('#datepicker').datepicker('getFormattedDate');
		console.log(selected_Dates);
		selected_Dates = selected_Dates.split(','); //split selected_Dates string into
		console.log(selected_Dates);				//seperate values in an array
		currentUser = Meteor.userId();
		if(!currentUser){
			Router.go('/login');
		}
		else if(selected_Dates == ""){
			alert('Make sure to pick a booking time');
			}
		else{
			postingId = this._id;
			Session.set("daysBooked", selected_Dates);
			Router.go('/posting/'+postingId+'/confirm/');
		}
	}
});
