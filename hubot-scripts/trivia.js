const sourceUrl = "https://opentdb.com/api.php?amount=1&difficulty=hard&type=multiple";

var currentQuestion = null;
var stats = {};

function updateStats(username, correct) {
    if (!stats[username]) {
        stats[username] = {
            attempts: 0,
            correct: 0,
        }
    }
    stats[username].attempts++;
    if (correct) stats[username].correct++;
}

module.exports = function(robot) {
    robot.hear(/!trivia/, function(msg) {
        if (currentQuestion !== null) {
            setTimeout(function() {
                msg.send("Category is: " + currentQuestion.category);
                setTimeout(function() {
                    msg.send(currentQuestion.question);
                    setTimeout(function() {
                        currentQuestion.incorrect_answers.map(function(a, i) {
                            setTimeout(function() {msg.send(i + ". " + a)}, 20);
                        });
                    }, 500);
                }, 100);
            }, 10);
            return;
        }
        msg.http(sourceUrl).query({amount: 1, difficulty: "hard", type: "multiple"})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.results && response.results.length > 0) {
                        currentQuestion = response.results[0];
                        setTimeout(function() {
                            msg.send("Category is: " + currentQuestion.category);
                            setTimeout(function() {
                                msg.send(currentQuestion.question);
                                setTimeout(function() {
                                    const index = Math.floor(Math.random() * currentQuestion.incorrect_answers.length);
                                    currentQuestion.incorrect_answers.splice(index, 0, currentQuestion.correct_answer);
                                    currentQuestion.incorrect_answers.map(function(a, i) {
                                        setTimeout(function() {msg.send(i + ". " + a)}, 20);
                                    });
                                }, 2000);
                            }, 100);
                        }, 10);
                    }
                } catch(err) {
                    msg.send("Oops.  You guys didn't really want to see that, right?");
                }
            })
    });
    robot.hear(/!(\d)/, function(msg) {
        if (!currentQuestion) return;
        if (currentQuestion && currentQuestion.correct_answer === currentQuestion.incorrect_answers[Number(msg.match[1])]) {
            updateStats(msg.message.user.name, true);
            msg.send("Thats it, you got it!");
            msg.send("You are " + stats[msg.message.user.name].correct + " for " + stats[msg.message.user.name].attempts);
        } else {
            updateStats(msg.message.user.name, false);
            msg.send("Jesus dude, get better");
            msg.send("You are " + stats[msg.message.user.name].correct + " for " + stats[msg.message.user.name].attempts);
        }
        currentQuestion = null;
    });
}