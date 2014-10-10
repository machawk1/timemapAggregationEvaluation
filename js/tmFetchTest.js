var timemaps = [];
var aggregator_lanl = "http://mementoweb.org/timegate/";

function fetchTimemap(liveWebUrl){
	console.log("Starting the processing of "+liveWebUrl);
	//curl livewebURI
	$.ajax({
		url: liveWebUrl,
		type: "HEAD"
	}).success(function(data,textStatus,xhr){
		var headers = xhr.getAllResponseHeaders();
		extractLinkHeaderFromHTTPHeaders(headers,liveWebUrl);
	});
	//if headers @ URI does NOT contain a timemap or timegate value, use the aggregator
	
	//elseif headers @ URI do contain a timemap or timegate value, use those for subsequent query 
}

function extractLinkHeaderFromHTTPHeaders(headerStr,url){
	var linkHeaderRegex = /Link(.*)/gi
	var re = new RegExp(linkHeaderRegex);
	var linkHeaderContents = headerStr.match(re);

	if(linkHeaderContents){	
		linkHeaderContents = linkHeaderContents[0].split(",");
		console.log(linkHeaderContents);
		for(var tg=linkHeaderContents.length-1; tg>=0; tg--){
			var timegateRegex = /rel=(.*?)timegate/gi
			var originalRegex = /rel=(.*?)original/gi
			var timemapRegex = /rel=(.*?)timemap/gi
			var mementoRegex = /rel=(.*?)memento/gi
			var firstRegex = /rel=(.*?)first/gi
			var lastRegex = /rel=(.*?)last/gi
			var tgre = new RegExp(timegateRegex);
			var ore = new RegExp(originalRegex);
			var tmre = new RegExp(timemapRegex);
			var mre = new RegExp(mementoRegex);
			var firstre = new RegExp(firstRegex);
			var lastre = new RegExp(lastRegex);
			var timegateParsingResults = linkHeaderContents[tg].match(tgre);
			var originalParsingResults = linkHeaderContents[tg].match(ore);
			var timemapParsingResults = linkHeaderContents[tg].match(tmre);
			var mementoParsingResults = linkHeaderContents[tg].match(mre);
			var firstParsingResults = linkHeaderContents[tg].match(firstre);
			var lastParsingResults = linkHeaderContents[tg].match(lastre);
			
			if(timegateParsingResults || originalParsingResults || timemapParsingResults || mementoParsingResults || firstParsingResults || lastParsingResults){
				var str = "We have ";
				if(timegateParsingResults){str += "a timegate: "+timegateParsingResults;}
				if(originalParsingResults){str += "an original: "+originalParsingResults;}
				if(timemapParsingResults){str += "a timemap: "+timemapParsingResults;}
				if(mementoParsingResults){str += "a memento: "+mementoParsingResults;}
				if(firstParsingResults){str += "a first: "+firstParsingResults;}
				if(lastParsingResults){str += "a last: "+lastParsingResults;}
				console.log(str);
			}
		}
		
	}else { //there are no link headers, prepend the aggregator
		console.log("There were no link headers for "+url+". Prepending the LANL aggregator.");
		fetchTimemap(aggregator_lanl + url);
	}
}

function Timemap(){
	this.rawText = "";
	this.mementos = [];
	this.timemaps = [];
	this.timegates = [];
	this.origins = [];
	this.fetch = function(){
		//get this url
	};
	this.extractMementos = function(){};
	this.extractTimemaps = function(){};
}
function Memento(){
	this.rawText = "";
	this.url = "";
	this.datetime = "";
}





$(document).ready(function(){
	fetchTimemap("http://cnn.com");	
	fetchTimemap("http://lanlsource.lanl.gov/hello");
});