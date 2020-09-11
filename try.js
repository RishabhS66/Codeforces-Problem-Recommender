const api_url = "https://codeforces.com/api/";
const prob = "problemset.problems";
const userinfo = "user.info";
const probsubmitted = "user.status";
var handle_display_div = document.getElementById("handle_display");
var recent_contests_div = document.getElementById("recent_contests"); 
var problems_div = document.getElementById("problems");
var input = document.getElementById("handle_inp");
var rating=  document.getElementById("rank_display");

input.addEventListener("keyup", function(event) {
	// Number 13 is the "Enter" key on the keyboard
	if (event.keyCode === 13) {
		// Cancel the default action, if needed
		event.preventDefault();
		// Trigger the button element with a click

		// Clear any data present before
		handle_display_div.innerHTML = '';
	    recent_contests_div.innerHTML = '';
	    problems_div.innerHTML='';  
	    document.getElementById("display_values").click();
	}
});

// With this request, we get all the rating changes of the user
document.getElementById('display_values').onclick = function () {
  
	var handle_inp = document.getElementById("handle_inp");
	//Clear data of previous handle, if present
	handle_display_div.innerHTML = '';
  	recent_contests_div.innerHTML = '';
  	problems_div.innerHTML='';
    var req = $.get(api_url + "user.rating", { 'handle': handle_inp.value })
  
		.done(function(data){
		var heading = '<h2><u>Showing statistics for ' + handle_inp.value + '</u></h2>';
		handle_display_div.innerHTML = heading;
            
		if(data.result.length == 0) {
			recent_contests_div.innerHTML = "User has yet to participate in a contest!";
		}
      
		else {
		
			recent_contests_div.innerHTML = '<h3>Recent contests: </h3>';
            
			for(var i = data.result.length - 1; i >= Math.max(data.result.length - 5, 0); i--) {
				recent_contests_div.innerHTML += data.result[i].contestName + " -> " + data.result[i].rank + "<br>";
			}
			// Since handle is valid, we recommend the user some problems
			RecommendProb(handle_inp.value);
		}
		
      
		})
	
		.fail(function(){
			alert( "Handle does not exist!" );
			handle_display_div.innerHTML = '';
			recent_contests_div.innerHTML = '';
			handle_inp.value = '';
			problems_div.innerHTML='';
		});
}

function RecommendProb(user_handle){
	var handle = user_handle;
	var user_prob_set=[];
  	var ptags=[];
  	
  	// Get list of all problems attempted by user
  	// Here, attempted problems also include those which are still unsolved
	var req3 = $.get(api_url + probsubmitted, {'handle':handle}, function(data,status){
    	var status1=data["status"];
    	if(status!="success" || status1!="OK"){
      		err_message("Get your net checked BRO!!");
      		return;
    	}
    	var res = data.result;
    	for(var i=0;i<res.length;i++){
      		user_prob_set.push(res[i].problem.contestId + "_" + res[i].problem.name); // Array of attempted problems, with problems defined as 'contestId + NameOfProb'
      		var probtag  = res[i].problem.tags; // All tags associated with the problem
      		for(var t =0; t<probtag.length; t++){
        		if(!ptags.includes(probtag[t])) ptags.push(probtag[t]); // Array containing unique tags 
        	}
    	}
    	tags_n_ratings(handle, ptags, user_prob_set);
  	});
}

function tags_n_ratings(handle, ptags, user_prob_set){
  	// Function which takes the set of attempted problems, and all the unique tags of problems attempted by user
  	var req4 = $.get(api_url + userinfo, {'handles': handle}, function(data, status) {
	    var status1=data["status"];
	    if(status!="success" || status1!="OK"){
	      	err_message("Get your net checked BRO!!");
	      	return;
	    }
	    // Gets user rating
	    var curr_rating=data.result[0]["rating"];
      	var curr_rank=data.result[0]["rank"];
      	var maxRating=data.result[0]["maxRating"];
       rating.innerHTML = '';
       rating.innerHTML+="<h3><a>Current Rating: <a/>"+"<violet>"+curr_rating+"<violet/>"+"<br/><a>  Max Rating: <a/>"+maxRating+"<br/>Current Rank: "+curr_rank+"<h3/>";
	    // Recommend problems of certain tag
	    for(var i in ptags){
	    	UserProb(handle, ptags[i], curr_rating, user_prob_set);
	    }
  	});
}

function UserProb(handle, tagname, rating, usersubmits){
	// Function to print recommended problems of certain tag
  	var req2 = $.get(api_url + prob, {'tags': tagname})
  		.done(function(data, status) {
    		var status1 = data["status"];
    		if(status != "success" || status1 != "OK"){
      			err_message("Get your net checked BRO!!");
      			return;
    		}
    		var pset = data.result.problems;
		    // A precautionary check, since we only pass those tags which the user has attempted, thus being sure that the tag itself exists!
		    if(pset.length == 0){
		    	err_message("No such tag exists!");
		      	return;
		    }
    		var pset = data.result.problems //data["result"]["problems"]
    		var ctr = 1;
    
		    var total_no_prob = pset.length;
		    var set_of_prob = new Set(); // To store and search the problems being recommended
		    var get_prob_url = "https://codeforces.com/contest/";
		    var not_attempted_prob = [];
    		
    		// Creates array of problems, of the tag provided in input, NOT attempted by the user
		    for(var i =0; i<total_no_prob; i++){
		      	if(!usersubmits.includes(pset[i].contestId + "_" + pset[i].name)) not_attempted_prob.push(pset[i]);
		    }

		    pset = not_attempted_prob; // Modifies pset to contain only those problems NOT attempted by the user
		    total_no_prob = pset.length;
		    
		    // Generate five random problems
		    var checks=0;
		    while(ctr <= Math.min(5, total_no_prob)){
		      	checks+=1;
		      	// Sometimes, there may not be even 5 problems with the desired rating requirement, so we have to break the loop forcefully
		      	if(checks>1000*total_no_prob){
			        break;
			    }
      			//Generate a random index
		      	var idx = Math.floor(Math.random() * total_no_prob);
		      	if(!set_of_prob.has(idx) && pset[idx]["rating"] <= rating + 200 && pset[idx]["rating"] >= rating - 100){
		        	if(ctr==1){
		        		// Only print the heading if at least 1 problem of that rating is found in the problemset!
		          		var heading = '<h2><u>Recommended problems for ' + handle + ' under <em>' + tagname + '</em> tag : </u></h2>';
		          		problems_div.innerHTML += heading;
		        	}
			        var problem_url = get_prob_url + pset[idx].contestId.toString() + "/problem/" + pset[idx].index;
			        var problem_name = pset[idx].name;
			        problem_name = problem_name.link(problem_url);
			        problems_div.innerHTML += ctr + ". " + problem_name + " (" + pset[idx].rating + ")<br>";
			        set_of_prob.add(idx);
			        ctr++;
		      }
    		}
    
  		})
  		.fail(function(data, status){
  			// If it fails due to too frequent calls to the API (error 429), again call it
  			// Use the commented line only when in production :p
  			//console.clear();
  			UserProb(handle, tagname, rating, usersubmits)
  		});
} 
function err_message(msg) {
	alert(msg);
	problems_div.innerHTML = '';
}
