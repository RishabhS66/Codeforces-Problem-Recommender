const api_url = "https://codeforces.com/api/";
const prob = "problemset.problems";
const userinfo = "user.info";

var handle_display_div = document.getElementById("handle_display");
var recent_contests_div = document.getElementById("recent_contests"); 
var problems_div = document.getElementById("problems");
  
var input = document.getElementById("handle_inp");

input.addEventListener("keyup", function(event) {
	// Number 13 is the "Enter" key on the keyboard
	if (event.keyCode === 13) {
		// Cancel the default action, if needed
		event.preventDefault();
		// Trigger the button element with a click
		document.getElementById("display_values").click();
	}
});

// With this request, we get all the rating changes of the user
document.getElementById('display_values').onclick = function () {
  
	var handle_inp = document.getElementById("handle_inp");
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
	var req3 = $.get(api_url + userinfo, {'handles': handle}, function(data, status) {
		var status1 = data["status"];
		if(status != "success" || status1 != "OK"){
			err_message("Get your net checked BRO!!");
			return;
		}
		var heading = '<h2><u>Recommending problems for ' + handle + '</u></h2>';
		problems_div.innerHTML = heading;
		var userrating = data.result[0]["rating"];
		
		// Can do more with this function when all data present     
		UserProb(handle, "greedy", userrating);
	});
}

function UserProb(handle, tagname, rating){
	var req2 = $.get(api_url + prob, {'tags': tagname}, function(data, status) {
		var status1 = data["status"];
		if(status != "success" || status1 != "OK"){
			err_message("Get your net checked BRO!!");
			return;
		}
		var pset = data.result.problems;
		if(pset.length == 0){
			err_message("No such tag exists!");
			return;
		}
		var ctr = 1;
		
		var total_no_prob = pset.length;
		var set_of_prob = new Set(); // To store and search the problems being recommended
		var get_prob_url = "https://codeforces.com/contest/";
		
		// Generate five random problems
		while(ctr <= Math.min(5, total_no_prob)){
			
			//Generate a random index
			var idx = Math.floor(Math.random() * total_no_prob);
			
			if(!set_of_prob.has(idx) && pset[idx]["rating"] <= rating + 200 && pset[idx]["rating"] >= rating - 100){
				var problem_url = get_prob_url + pset[idx].contestId.toString() + "/problem/" + pset[idx].index;
				var problem_name = pset[idx].name;
				problem_name = problem_name.link(problem_url);
				problems_div.innerHTML += ctr + ". " + problem_name + " (" + pset[idx].rating + ")<br>";
				set_of_prob.add(idx);
				ctr++;
			}
		}
		
	});
}
  
function err_message(msg) {
	alert(msg);
	problems_div.innerHTML = '';
}