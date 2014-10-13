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
		createTimemapFromHTTPHeaders(headers,liveWebUrl);
	});
	//if headers @ URI does NOT contain a timemap or timegate value, use the aggregator
	
	//elseif headers @ URI do contain a timemap or timegate value, use those for subsequent query 
}

function splitLinkHeaderIntoEntries(lh){
	lh = lh.split(",");
	//fix the simple split to re-attached datetime to previous entry. There has to be a better way
	$(lh).each(function(i,v){
		if(v != null && v.match(new RegExp(/datetime=(.*?)(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(.*)/gi))){
			lh[i] += lh[i+1];
			lh[i+1] = null;
		}
	});
	//remove the nulls, which were previously date fragments
	lh = $.grep(lh, function(n, i){ 
		return (n !== "" && n != null);
	});
	return lh;
}

function createTimemapFromHTTPHeaders(headerStr,url){
	var linkHeaderRegex = /Link(.*)/gi
	var re = new RegExp(linkHeaderRegex);
	var linkHeaderContents = headerStr.match(re);

	if(linkHeaderContents){	
		linkHeaderContents = splitLinkHeaderIntoEntries(linkHeaderContents[0]);

		var tm = new Timemap();
		for(var tg=linkHeaderContents.length-1; tg>=0; tg--){
			var timegateRegex = /<(.*?)>;(.*?)rel=(.*?)timegate/gi;
			var originalRegex = /<(.*?)>;(.*?)rel=(.*?)original/gi;
			var timemapRegex = /<(.*?)>;(.*?)rel=(.*?)timemap/gi;
			var mementoRegex = /<(.*?)>;(.*?)rel=(.*?)memento/gi;
			var firstRegex = /<(.*?)>;(.*?)rel=(.*?)first/gi;
			var lastRegex = /<(.*?)>;(.*?)rel=(.*?)last/gi;
			var nextRegex = /<(.*?)>;(.*?)rel=(.*?)next/gi;
			var prevRegex = /<(.*?)>;(.*?)rel=(.*?)prev/gi;
			var datetimeRegex = /datetime="(.*)"/gi;
			
			var tgre = new RegExp(timegateRegex);
			var ore = new RegExp(originalRegex);
			var tmre = new RegExp(timemapRegex);
			var mre = new RegExp(mementoRegex);
			var firstre = new RegExp(firstRegex);
			var lastre = new RegExp(lastRegex);
			var nextre = new RegExp(nextRegex);
			var prevre = new RegExp(prevRegex);
			var dtre = new RegExp(datetimeRegex);
			
			var timegateParsingResults = linkHeaderContents[tg].match(tgre);
			var originalParsingResults = linkHeaderContents[tg].match(ore);
			var timemapParsingResults = linkHeaderContents[tg].match(tmre);
			var mementoParsingResults = linkHeaderContents[tg].match(mre);
			var firstParsingResults = linkHeaderContents[tg].match(firstre);
			var lastParsingResults = linkHeaderContents[tg].match(lastre);
			var nextParsingResults = linkHeaderContents[tg].match(nextre);
			var prevParsingResults = linkHeaderContents[tg].match(prevre);
			var datetimeParsingResults = dtre.exec(linkHeaderContents[tg]);
			
			
			if(timegateParsingResults || originalParsingResults || timemapParsingResults || mementoParsingResults || firstParsingResults || lastParsingResults){
				var str = "We have ";
				if(timegateParsingResults){
					var tg = new Timegate();
					tg.uri = tm.getURIFromTimemapEntry(timegateParsingResults[0]);
					tm.timegates.push(tg);
				}
				if(originalParsingResults){
					var original = new Memento();
					original.uri = tm.getURIFromTimemapEntry(originalParsingResults[0]);
					tm.originals.push(original);
				}
				if(mementoParsingResults){
					var memento = new Memento();
					memento.uri = tm.getURIFromTimemapEntry(mementoParsingResults[0]);
					memento.rawText = linkHeaderContents[tg];
					tm.mementos[memento.uri] = memento;
					
					if(datetimeParsingResults && datetimeParsingResults.length > 1){
						tm.mementos[memento.uri].datetime = datetimeParsingResults[1];
					}
					
					if(firstParsingResults){
						tm.first = tm.mementos[memento.uri];
					}
					if(lastParsingResults){
						tm.last = tm.mementos[memento.uri];
					}
					if(nextParsingResults){
						tm.next = tm.mementos[memento.uri];
					}
					if(prevParsingResults){
						tm.prev = tm.mementos[memento.uri];
					}
					
				}			
			}
		}
		console.log(tm);
		
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
	this.originals = [];
	this.first = null;
	this.last = null;
	this.next = null;
	this.prev = null;
}
function Timegate(){

}
function Memento(){
	this.rawText = "";
	this.uri = "";
	this.datetime = "";
}

Timemap.prototype.extractMementos = function(){};
Timemap.prototype.extractTimemaps = function(){};
Timemap.prototype.getURIFromTimemapEntry = function(entry){
	return entry.substr(1,entry.indexOf(">")-1);
};





$(document).ready(function(){
	fetchTimemap("http://cnn.com");	
	//fetchTimemap("http://lanlsource.lanl.gov/hello");
});