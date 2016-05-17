Postings = new Mongo.Collection('postings');
Rentstuff_Users = new Mongo.Collection('rentstuff_users');

//Publish usernames
Meteor.publish('users', function(){
	return Meteor.users.find({}, {fields:{username: true}});
});

//Image Upload

Cloudinary.config({
	cloud_name: 'gordonseto',
	api_key: '594548983263644',
	api_secret: 'lEYgImGmT-dQLvz5ixtGZWRfsLg'
});