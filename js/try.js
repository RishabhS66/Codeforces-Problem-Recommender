var user_rating;
var contest_list;
const api_url = "https://codeforces.com/api/";
const prob = "problemset.problems";
const userinfo = "user.info";
const probsubmitted = "user.status";
var handle_display_div = 'none';
var recent_contests_div = 'none';
var problems_div = 'none';
var rating=  'none';
var input;
var ptags=[];
var handle = 'none';
var total_contest_div;

function init(){
    handle_display_div = document.getElementById("handle_display");
    recent_contests_div = document.getElementById("recent_contests"); 
    problems_div = document.getElementById("problems");
    rating=  document.getElementById("rank_display");
    input = document.getElementById("handle_inp");
    total_contest_div = document.getElementById("contest_display");

    input.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click

        // Clear any data present before
        //handle_display_div.innerHTML = '';
        //recent_contests_div.innerHTML = '';
        //problems_div.innerHTML='';  
        //document.getElementById("display_values").click();
        $('#display_values').click();
        }
    });
}

//-------------------------------------------------Class---------------------------------------------------------

class Problem{
    constructor(index,name,attempted,success){
        this.index = index;
        this.name = name;
        if (attempted && success){
            this.verdict = "Accepted";
            this.css = "accepted"
        }else if(attempted){
            this.verdict = "Failed";
            this.css = "failed"
        }else{
            this.verdict = "Not Attempted"
            this.css = "notattempted"
        }
    }
}

class Contest{
    constructor(data){
        var problems = data.result.problems;
        var rows = data.result.rows;
        var l = rows.length;
        var n = problems.length;

        this.List = [];
        for(var i=0;i<n;i++){
            var attempted = false;
            var success = false;
            for(var j=0;j<l;j++){
                if(rows[j].problemResults[i].bestSubmissionTimeSeconds){
                    attempted = true;
                    success = true;
                    break;
                }
                else if(rows[j].problemResults[i].rejectedAttemptCount>0){
                    attempted = true;
                }
            }

            this.List.push(new Problem(problems[i].index,problems[i].name,attempted,success))
        }
    }
}

//-------------------------------------------------Functions---------------------------------------------------------

function display_problem_list(contestId){
    
    $.get('https://codeforces.com/api/contest.standings', {'handles':handle, 'contestId':contestId, 'showUnofficial':true})
    .done(function (data,status){
        var contest = new Contest(data)
        for(var x of contest.List){
            $('#'+contestId).append('<tr class="'+x.css+'">'+
                                        '<td>'+x.index+'</td>'+
                                        '<td>'+x.name+'</td>'+
                                        '<td>'+x.verdict+'</td>'+
                                    '</tr>');
        }
        
    })
    .fail(function(data,status){
        display_problem_list(contestId)
    })
}

function display_contest_list(){
    var x,count = 0;
    $('#contestlist *').remove()
    for (x of contest_list){
        //if(++count>5)   break;
        $('#contestlist').append('<div class="card">'+
                                    '<div class="card-body">'+
                                        '<h4><a href="https://codeforces.com/contest/'+x.contestId+'">'+x.contestName+'</a></h4>'+
                                        '<table class="table table-bordered">'+
                                            '<tbody id="'+x.contestId+'">'+
                                            '</tbody>'+
                                        '</table>'+
                                    '</div>'+
                                '</div>');
        display_problem_list(x.contestId);
    }
}

function err_message(msg) {
    alert(msg);
    problems_div.innerHTML = '';
}

function RecommendProb(user_handle){
    var handle = user_handle;
    var user_prob_set=[];
    ptags=[];
    
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
console.log("YES!");
var req4 = $.get(api_url + userinfo, {'handles': handle})
    .done(function(data, status) {
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
        //documents.getElementById("max_rating_display").innerHTML = maxRating;
        //documents.getElementById("current_rank_display").innerHTML = curr_rank;
        $('#max_rating_display').text(maxRating);
        $('#current_rank_display').text(curr_rank);
        // Recommend problems of certain tag
        for(var i in ptags){
            UserProb(handle, ptags[i], curr_rating, user_prob_set);
        }
    })
    .fail(function(data, status){
        // If it fails due to too frequent calls to the API (error 429), again call it
        //console.clear();
        tags_n_ratings(handle, ptags, user_prob_set)
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
                var heading = '<h2 class="recommend"><u>Recommended problems for ' + handle + ' under <em>' + tagname + '</em> tag : </u></h2>';
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
        //console.clear();
        UserProb(handle, tagname, rating, usersubmits)
    });
} 

function clear_all(){
    handle_display_div.innerHTML = '';
    recent_contests_div.innerHTML = '';
    handle_inp.value = '';
    problems_div.innerHTML='';
    total_contest_div.innerHTML = '';
    document.getElementById("block").innerHTML = "";
}

//-------------------------------------------------Jquery---------------------------------------------------------

$(document).ready(function (){
    init();

    $('#display_values').click(function (){
        
        //alert('HTML: '+$('#handle').val())
        handle = $('#handle_inp').val()
        user_rating = $.get(api_url + "user.rating", {'handle':handle})
        .done(function(data,status){
            $('#alert_message').hide();
            //console.log(data.result[0])
            handle_display_div.innerHTML = handle_inp.value;
            
                    
            if(data.result.length == 0) {
              recent_contests_div.innerHTML = "User has yet to participate in a contest!";
            }              
            else {            
                //$('#contest_display').text = data.result.length
                total_contest_div.innerHTML = data.result.length
                // Since handle is valid, we recommend the user some problems
                RecommendProb(handle_inp.value);
            }

            contest_list = data.result.reverse()
            display_contest_list()
            $('#display_block').show();
        })
        .fail(function(data,status){
            $('#display_block').hide();
            $('#alert_message').show();
            //clear_all();
            //alert("Handle: "+handle+", does not exist!")
        })
    });
});


