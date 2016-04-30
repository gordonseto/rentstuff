Postings = new Mongo.Collection('postings');

Router.route('/',{
	name: 'home',
	template: 'home'
});

Router.route('/newPosting',{
	name: 'newPosting'
});

if(Meteor.isClient){

	Template.displayPostings.helpers({
		'posting': function(){
			return Postings.find();
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
			Postings.insert({title: title,
							description: description,
							location: location,
							rentalrate: rentalrate,
							createdAt: new Date()
			});
		}
	})

}

if(Meteor.isServer){

}