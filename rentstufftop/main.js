/*Search Box with easy-search*/

PostingsIndex = new EasySearch.Index({
	collection: Postings,
	fields: ['title', 'description', 'location'],
	engine: new EasySearch.MongoDB({
		sort: function(){
		return {createdAt: -1};
		}
	})	
});
