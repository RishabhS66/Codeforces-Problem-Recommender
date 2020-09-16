var USER_RATING_URL = 'https://codeforces.com/api/user.rating'
var user_rating;
var contest_list;

var handle = 'none';


$(document).ready(function (){
    $('#display_values').click(function (){
        //alert('HTML: '+$('#handle').val())
        handle = $('#handle_inp').val()
        user_rating = $.get(USER_RATING_URL, {'handle':handle})
        .done(function(data,status){
            //console.log(data.result[0])
            contest_list = data.result.reverse()
            display_contest_list()
            $('#block').show();
        })
        .fail(function(data,status){
            alert("Handle: "+handle+", does not exist!")
            $('#block').hide();
        })
    });
});

class Problem{
    constructor(index,name,attempted,success){
        this.index = index;
        this.name = name;
        if (attempted && success){
            this.verdict = "Submitted Successfully";
        }else if(attempted){
            this.verdict = "Failed";
        }else{
            this.verdict = "Not Attempted"
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


function display_problem_list(contestId){
    
    $.get('https://codeforces.com/api/contest.standings', {'handles':handle, 'contestId':contestId, 'showUnofficial':true})
    .done(function (data,status){
        var contest = new Contest(data)
        for(var x of contest.List){
            $('#'+contestId).append('<tr>'+
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
}

