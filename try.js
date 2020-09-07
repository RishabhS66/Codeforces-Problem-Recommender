var api_url = "https://codeforces.com/api/";



// With this request we get all the rating changes of the user
   var req2 = $.get(api_url + "user.rating", { 'handle': 'prathamarora25.6' },function(data, status) {
      console.log(data.status);
      console.log(data.result);

	var elem=document.getElementById("demo");
      for(var i=0;i<5;i++)
      {	
      elem.innerHTML +=data.result[i].contestName+" -> "+data.result[i].rank+"<br/>";
   	}
	  });

 
