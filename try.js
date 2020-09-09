var api_url = "https://codeforces.com/api/";

// With this request, we get all the rating changes of the user

document.getElementById('display_values').onclick = function () {
	
	var handle_display_div = document.getElementById("handle_display");
	var recent_contests_div = document.getElementById("recent_contests");
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
			}
			
		})
		.fail(function(data){
			
			alert("Handle does not exist!");
			handle_display_div.innerHTML = '';
			recent_contests_div.innerHTML = '';
			handle_inp.value = '';
			
		});
}
