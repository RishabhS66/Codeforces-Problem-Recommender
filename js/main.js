var contest_list;
const api_url = "https://codeforces.com/api/";
const prob = "problemset.problems";
const userinfo = "user.info";
const probsubmitted = "user.status";
var problems_div = 'none';
var rating=  'none';
var ptags=[];
var levels=[];
var handle = 'none';
var estimated_rating = 0;

// Vars for charts
var tags = {};
google.charts.load('current', { 'packages': ['corechart', 'calendar'] });
var titleTextStyle = {
    fontSize: 18,
    color: '#393939',
    bold: false
};
var colors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#2196F3', '#009688',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B', '#E65100',
    '#827717', '#004D40', '#1A237E', '#6200EA', '#3F51B5', '#F50057', '#304FFE', '#b71c1c'];

//-----------------------------------------------------------------Initialize----------------------------------------------------------------------

function init(){
    problems_div = document.getElementById("problems");
    rating=  document.getElementById("rank_display");

    document.getElementById("handle_inp").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        $('#display_values').click();
        }
    });
}

function initialize(){
    $('#handle_display').text(handle)
    $('#Easy').text('')
    $('#Medium').text('')
    $('#Hard').text('')

    problems_div.innerHTML='';
    estimated_rating = 0;
    tags = {};

    // Initialize
    $('#rank_display').text("");
    $('#max_rating_display').text("");
    $('#max_rank_display').text("");
    $('#current_rank_display').text("");
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

function easyLow(x){
    x/=100;
    var low = -21.2 + (25.5 * Math.exp(-0.02 * x));
    low*=100;
    return low;
}

function easyHigh(x){
    x/=100;
    var high = -32.1 + (37.2 * Math.exp(-0.01 * x));
    high*=100;
    return high;
}

function mediumLow(x){
    x/=100;
    var low = -38.8 + (44.8 * Math.exp(-0.008 * x));
    low*=100;
    return low;
}

function mediumHigh(x){
    x/=100;
    var high = -53.2 + (59.9 * Math.exp(-0.005 * x));
    high*=100;
    return high;
}

function hardLow(x){
    x/=100;
    var low = -32.0 + (39.9 * Math.exp(-0.008 * x));
    low*=100;
    return low;
}

function hardHigh(x){
    x/=100;
    var high = -30.8 + (39.6 * Math.exp(-0.006 * x));
    high*=100;
    return high;
}


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
        console.clear()
        display_problem_list(contestId)
    })
}

function display_contest_list(){
    var x,count = 0;
    $('#contestlist *').remove()
    for (x of contest_list){
        if(++count>3)   break;
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
    if(contest_list.length>3){
        $('#view_more').show();
    }
}

function view_more_fun(){
    var x,count = 0;
    for (x of contest_list){
        if(++count>3){
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
}

function err_message(msg) {
    alert(msg);
    problems_div.innerHTML = '';
}

function RecommendProb(){
    var user_prob_set=[];
    ptags=[];
    
    // Get list of all problems attempted by user
    // Here, attempted problems also include those which are still unsolved
    $.get(api_url + probsubmitted, {'handle':handle}, function(data,status){
        var status1=data["status"];
        if(status!="success" || status1!="OK"){
            err_message("Get your net checked BRO!!");
            return;
        }
        var res = data.result;
        for(var i=0;i<res.length;i++){
            if(user_prob_set.includes(res[i].problem.contestId + "_" + res[i].problem.name))    continue;
            user_prob_set.push(res[i].problem.contestId + "_" + res[i].problem.name); // Array of attempted problems, with problems defined as 'contestId + NameOfProb'
            var probtag  = res[i].problem.tags; // All tags associated with the problem
            for(var t =0; t<probtag.length; t++){
                if(!ptags.includes(probtag[t])) ptags.push(probtag[t]); // Array containing unique tags attempted by the user. 
                //  Tags of accepted problem
                if (res[i].verdict == 'OK'){

                    // if(probtag[t]=="combinatorics"){
                    //     console.log(res[i].problem.name+":"+i)
                    // }
                    if (tags[probtag[t]] === undefined) tags[probtag[t]] = 1;
                    else tags[probtag[t]]++;
                }
            }
        }
        if (typeof google.visualization === 'undefined') {
            google.charts.setOnLoadCallback(drawCharts);
        } else {
            drawCharts();
        }
       
        tags_n_ratings(ptags, user_prob_set);
    });
}


function capitalize(str)
{
    if(str)
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function tags_n_ratings(ptags, user_prob_set){
// Function which takes the set of attempted problems, and all the unique tags of problems attempted by user
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
        var max_rank = data.result[0]["maxRank"];
        rating.innerHTML = '';

        var rating_color = {'newbie':'gray', 'pupil':'green', 'specialist':'cyan', 'expert':'blue', 'candidate master':'violet', 'master':'orange', 'international master': 'orange', 'grandmaster':'red', 'international grandmaster':'red', 'legendary grandmaster':'red'};
        
        if(contest_list.length==0){
            $('#rank_display').css('color','black').text("NA");
            $('#max_rating_display').css('color','black').text("NA");
            $('#max_rank_display').css('color','black').text("");
            $('#current_rank_display').css('color','black').text("Not yet defined");  
        }else{
            $('#rank_display').css('color',rating_color[curr_rank]).text(curr_rating);
            $('#max_rating_display').css('color',rating_color[max_rank]).text(maxRating);
            $('#max_rank_display').css('color',rating_color[max_rank]).text("("+capitalize(max_rank)+")");
            $('#current_rank_display').css('color',rating_color[curr_rank]).text(capitalize(curr_rank));
        }
        
  // if the user is new, we define beginner tags and give him a current rating of 800 to give problems 
        if(ptags.length==0 || curr_rating<800 || curr_rating==undefined)
        {
            ptags=["math","greedy","sortings","brute force","implementation"];
            curr_rating =800;
            estimated_rating = 800;
        }

            EMH(curr_rating, user_prob_set);
        // Recommend problems of certain tag
        /*for(var i in ptags){
            UserProb(handle, ptags[i], curr_rating, user_prob_set);
        }*/
    })
    .fail(function(data, status){
        // If it fails due to too frequent calls to the API (error 429), again call it
        console.clear();
        tags_n_ratings(ptags, user_prob_set)
    });
}

function UserProb(tagname, rating, usersubmits){
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
        while(ctr <= Math.min(2, total_no_prob)){
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
        console.clear();
        UserProb(tagname, rating, usersubmits)
    });
} 

function EMH(rating, usersubmits){
    // Function to print recommended problems of all tags
    var req2 = $.get(api_url + prob, {'tags':""})
    .done(function(data, status) {
        var status1 = data["status"];
        if(status != "success" || status1 != "OK"){
            err_message("Get your net checked BRO!!");
            return;
        }
        var pset = data.result.problems;
        // A precautionary check, since we only pass those tags which the user has attempted, thus being sure that the tag itself exists!
        if(pset.length == 0){
        err_message("No Recommendations");
            return;
        }
       // var pset = data.result.problems //data["result"]["problems"]
        
        //var total_no_prob = Math.min(1000,pset.length);
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
       
        level=["Easy","Medium","Hard"];

        var round_rating = estimated_rating%100
        if(round_rating<50) round_rating = estimated_rating-round_rating;
        else                round_rating = estimated_rating+100-round_rating;

        for(var index in level)
        {
            var low,high;
            if (index==0)
            {
                low=easyLow(round_rating)+round_rating;
                high=easyHigh(round_rating)+round_rating;
            }
            else if(index==1)
            {
                low=mediumLow(round_rating)+round_rating;
                high=mediumHigh(round_rating)+round_rating;
            }
            else
            {
                low=hardLow(round_rating)+round_rating;
                high=hardHigh(round_rating)+round_rating;
            }

            // Generate five random problems
            var checks=0;
            var ctr = 1;

            var card_div = document.getElementById(level[index])
    
            while(ctr <= Math.min(5, total_no_prob)){
                checks+=1;
                // Sometimes, there may not be even 2 problems with the desired rating requirement, so we have to break the loop forcefully
                if(checks>1000*total_no_prob){
                break;
            }
                //Generate a random index
                var idx = Math.floor(Math.random() * total_no_prob);
                if(!set_of_prob.has(idx) && pset[idx]["rating"] <= high && pset[idx]["rating"] >= low){
                    if(ctr==1){
                        // Only print the heading if at least 1 problem of that rating is found in the problemset!
                        var heading = '<h2 class="recommend"><u>' + level[index] + '</u>:</h2>';
                        card_div.innerHTML += heading;
                    }
                    var problem_url = get_prob_url + pset[idx].contestId.toString() + "/problem/" + pset[idx].index;
                    var problem_name = pset[idx].name;
                    problem_name = problem_name.link(problem_url);
                    card_div.innerHTML += ctr + ". " + problem_name + " (" + pset[idx].rating + ")<br>";
                    set_of_prob.add(idx);
                    ctr++;
                }
            }
        }
    })
    .fail(function(data, status){
        // If it fails due to too frequent calls to the API (error 429), again call it
        console.clear();
        EMH(rating, usersubmits)
    });
} 

function drawCharts() {
   $('#tags').removeClass('hidden');
   var tagTable = [];
   for (var tag in tags) {
      tagTable.push([tag + ": " + tags[tag], tags[tag]]);
   }
   tagTable.sort(function (a, b) {
      return b[1] - a[1];
   });
   tags = new google.visualization.DataTable();
   tags.addColumn('string', 'Tag');
   tags.addColumn('number', 'solved');
   tags.addRows(tagTable);
   var tagOptions = {
      width: Math.max(600, $('#tags').width()),
      height: Math.max(600, $('#tags').width()) * 0.75,
      chartArea: { width: '80%', height: '100%' },
      title: 'Tags of ' + handle,
      pieSliceText: 'none',
      legend: {
         position: 'right',
         alignment: 'center',
         textStyle: {
            fontSize: 12,
            fontName: 'Roboto',
         }
      },
      pieHole: 0.5,
      tooltip: {
         text: 'percentage'
      },
      fontName: 'Roboto',
      titleTextStyle: titleTextStyle,
      colors: colors.slice(0, Math.min(colors.length, tags.getNumberOfRows())),
   };
   var tagChart = new google.visualization.PieChart(document.getElementById('tags'));
   tagChart.draw(tags, tagOptions);

}

//-------------------------------------------------Jquery---------------------------------------------------------

$(document).ready(function (){
    init();

    $('#display_values').click(function (){
        initialize();
        handle = $('#handle_inp').val()
        $.get(api_url + "user.rating", {'handle':handle})
        .done(function(data,status){
            contest_list = data.result.reverse()

            $('#alert_message').hide();
            $('#display_block').show();
            $('#handle_display').text(handle)
            $('#contest_display').text(contest_list.length) 
            $('#recm_handle').text(handle)     
            $('#nocontests').hide()
            $('#chart').show()
            $('#chart_error').hide()
                    
            if(contest_list.length == 0){
                $('#recent_contests').text("User has yet to participate in a contest!")   
                $('#nocontests').show()
                $('#chart').hide()
                $('#chart_error').show()
            }else                            $('#recent_contests').text("")

            for(var i=0;i<Math.min(5,contest_list.length);i++)  estimated_rating+=contest_list[i].newRating
            if(contest_list.length!=0)  estimated_rating/=Math.min(5,contest_list.length)
            estimated_rating = Math.round(estimated_rating)
            
            RecommendProb();  
            display_contest_list()
        })
        .fail(function(data,status){
            $('#display_block').hide();
            $('#alert_message').show();
        })
    });

    $('#view_more').click(function(){
        view_more_fun();
        $('#view_more').hide()
    })
});
