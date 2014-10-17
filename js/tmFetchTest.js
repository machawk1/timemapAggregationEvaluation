var timemaps = [];
var timemapIndexesAcquired = []; //a simpler, less memory hungry way to not duplicate fetches
var aggregator_lanl = "http://mementoweb.org/timemap/link/";
var timeouts = [];
var empiricalThreshold = 99999999999;


//EXPERIMENT variables
var followTimemapReferenceCount = 8;
var timemapI = 0;
var differential = null;
var differentialEstablished = false;

function setThreshold(v){
	if(parseInt(v) < empiricalThreshold){
		empiricalThreshold = v;
	}
	
}

function fetchTimemap(liveWebUrl){
	console.log("Fetching timemap at "+liveWebUrl+". Have "+calculateTotalNumberOfAccumulatedMementos()+" mementos from "+timemaps.length+" timemaps");
	//curl livewebURI
	$.ajax({
		url: liveWebUrl,
		type: "GET",
		beforeSend: function(xhr, settings) {
        	xhr.url = settings.url;
        }
	}).success(function(data,textStatus,xhr){
		var headers = xhr.getAllResponseHeaders();
		createTimemap(data);
	}).fail(function(xhr,text,a){
		var numberRE = /\/([0-9]+)\//g
		var groups = numberRE.exec(xhr.url);
		setThreshold(groups[1]);
	});
	//if headers @ URI does NOT contain a timemap or timegate value, use the aggregator
	
	//elseif headers @ URI do contain a timemap or timegate value, use those for subsequent query 
}

function calculateTotalNumberOfAccumulatedMementos(){
	return "suppressed"; //for testing
	var count = 0;
	for(var tm=0; tm<timemaps.length; tm++){
		count += Object.keys(timemaps[tm].mementos).length
	}
	return count;
}

function removeNullsFrom(ary){//remove the nulls, which were previously date fragments
	return $.grep(ary, function(n, i){ 
		return (n !== "" && n != null);
	});
}

function splitIntoEntries(es){
	es = es.split(",");
	//fix the simple split to re-attached datetime to previous entry. There has to be a better way
	$(es).each(function(i,v){
		if(v != null && v.match(new RegExp(/datetime=(.*?)(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(.*)/gi))){
			es[i] += es[i+1];
			es[i+1] = null;
		}
	});
	es = removeNullsFrom(es);
	
	//append the stragglers that got split out based on using "," as the parsing delimiter
	for(var i=es.length-1; i>=0; i--){
		if(es[i].indexOf(">") == -1 && es[i].indexOf("<") == -1){ //fragment, append it to the previous element
			es[i-1] += "," + es[i];
			es[i] = null;
		}
	}
	
	es = removeNullsFrom(es);
	
	es = $.map(es,$.trim); //clean spaces from front and back

	return es;
}

function createTimemap(str){
	var entries = splitIntoEntries(str);
	var tm = new Timemap();
		
	for(var tg=0; tg< entries.length; tg++){
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
		
		var timegateParsingResults = entries[tg].match(tgre);
		var originalParsingResults = entries[tg].match(ore);
		var timemapParsingResults = entries[tg].match(tmre);
		var mementoParsingResults = entries[tg].match(mre);
		var firstParsingResults = entries[tg].match(firstre);
		var lastParsingResults = entries[tg].match(lastre);
		var nextParsingResults = entries[tg].match(nextre);
		var prevParsingResults = entries[tg].match(prevre);
		var datetimeParsingResults = dtre.exec(entries[tg]);
		

				
			
		if(timegateParsingResults || originalParsingResults || timemapParsingResults || mementoParsingResults || firstParsingResults || lastParsingResults){
			if(timegateParsingResults){
				var tg2add = new Timegate();
				tg2add.uri = tm.getURIFromTimemapEntry(timegateParsingResults[0]);
				tm.timegates.push(tg2add);
			}
			
			
			if(timemapParsingResults){
				var tm2add = new Timemap();
				tm2add.uri = tm2add.getURIFromTimemapEntry(timemapParsingResults[0]);
				tm.timemaps.push(tm2add);
			}
			
			if(originalParsingResults){
				var original = new Memento();
				original.uri = tm.getURIFromTimemapEntry(originalParsingResults[0]);
				tm.originals.push(original);
			}
			if(mementoParsingResults){
				var memento = new Memento();
				memento.uri = tm.getURIFromTimemapEntry(mementoParsingResults[0]);
				memento.rawText = entries[tg];
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
	//console.log(Object.keys(tm.mementos).length + " mementos found (possible duplicates)");
	timemapI++;
	timemaps.push(tm);
	
	/*if(timemapI >= followTimemapReferenceCount){
		console.log("Fetching artificially halted at "+timemapI+" timemaps.");
		console.timeEnd("Synchronous fetching");
		for(var to=0; to<timeouts.length; to++){
			clearTimeout(timeouts[to]);
		}
		return;
	}*/
	console.log("Theshold: "+empiricalThreshold);
	if(tm.timemaps.length > 0){
		//TODO, timemap pattern discovery
		var numberRE = /\/([0-9]+)\//g
		var groups = numberRE.exec(tm.timemaps[0].uri);
		
		/*if(!differentialEstablished && !differential){
			differential = parseInt(groups[1]);
		}else if(!differentialEstablished) {
			console.log(groups[1]+" vs. "+differential+" "+(parseInt(groups[1])-parseInt(differential)));
			differential = parseInt(groups[1]);
			differentialEstablished = true;
		}
		differential = parseInt(groups[1]);
		*///
		differential = parseInt(999);
		
		var num = parseInt(groups[1]);
		timemapIndexesAcquired.push(num);
		console.log(timemapIndexesAcquired);
	
		
		var nextAdjacent = num;
		var to1, to2, to3, to4;
		while($.inArray(nextAdjacent,timemapIndexesAcquired) != -1){
						//console.log("Found a duplicate in "+nextAdjacent);
			nextAdjacent += differential;
			if(nextAdjacent > empiricalThreshold){return;}

		}
		var nextURI = tm.timemaps[0].uri.replace(numberRE,"/"+nextAdjacent+"/");

		to1 = setTimeout(fetchTimemap,0,nextURI);
				
		
		
		var i1 = (nextAdjacent+3*differential);
		var i2 = (nextAdjacent+7*differential);
		var i3 = (nextAdjacent+10*differential);
		
		
		if(i1 < empiricalThreshold && $.inArray(i1,timemapIndexesAcquired) == -1){
			console.log("Didn't find "+i1+" in array "+$.inArray(i1,timemapIndexesAcquired)+" "+timemapIndexesAcquired.join(","));
			timemapIndexesAcquired.push(i1);
			to2 = setTimeout(fetchTimemap,0,tm.timemaps[0].uri.replace(numberRE,"/"+i1+"/"));
		}
		if(i2 < empiricalThreshold && $.inArray(i2,timemapIndexesAcquired) == -1){			
			console.log("Didn't find "+i2+" in array "+$.inArray(i1,timemapIndexesAcquired)+" "+timemapIndexesAcquired.join(","));
			timemapIndexesAcquired.push(i2);
			to3 = setTimeout(fetchTimemap,0,tm.timemaps[0].uri.replace(numberRE,"/"+i2+"/"));
		}
		if(i3 < empiricalThreshold && $.inArray(i3,timemapIndexesAcquired) == -1){
			console.log("Didn't find "+i3+" in array "+$.inArray(i1,timemapIndexesAcquired)+" "+timemapIndexesAcquired.join(","));
			timemapIndexesAcquired.push(i3);
			to4 = setTimeout(fetchTimemap,0,tm.timemaps[0].uri.replace(numberRE,"/"+i3+"/"));
		}	
		timeouts.push(to1,to2,to3,to4);
		
		
		//console.log(groups[1]);
		//console.log(tm.timemaps[0].uri.replace(numberRE,"/radon/"));
		//fetchTimemap(tm.timemaps[0].uri);
	}else {
		console.log("Done");
		console.timeEnd("Synchronous fetching");
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






console.time("Synchronous fetching");
$(document).ready(function(){
	fetchTimemap(aggregator_lanl + "http://cnn.com");	
	//fetchTimemap("http://lanlsource.lanl.gov/hello");
});