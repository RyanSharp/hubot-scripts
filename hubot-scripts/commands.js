const config = require("./config");
var pos = require("pos");

const sentence = "I open the box";
var words = new pos.Lexer().lex(sentence);
console.log(words);
var tagger = new pos.Tagger();
console.log(tagger.tag(words));

const IMPRESSIVE_ACTIONS = [
    "holding and not spilling his beer",
    "doing a back flip",
    "eating a hot pocket, without letting it cool down",
    "cooking the perfect steak",
    "walking on water",
    "hacking into the mainframe",
];

function randomImpressiveAction() {
    return IMPRESSIVE_ACTIONS[Math.floor(Math.random() * IMPRESSIVE_ACTIONS.length)];
}

const PATHETIC_ACTIONS = [
    "choked on a fly that happened to be in the wrong place at the wrong time",
    "missed the bus.  Now they're still waiting for the next one.",
    "gave up.  It was just way too hard",
    "realized that it just wasn't their calling.  It's really admirable that you understand that you're just not very good at most things.",
    "forgot what they were going to do",
    "just couldn't figure out",
    "got lost, like wtf.",
    "died of dysntery",
];

function randomPatheticAction() {
    return PATHETIC_ACTIONS[Math.floor(Math.random() * PATHETIC_ACTIONS.length)];
}

module.exports = function(robot) {
    robot.hear(/(swiggity swooty|swiggityswooty|swiggityswoogity|swiggity swoogity)/, function(msg) {
        msg.send("I'm comin' for that booty");
    });
    robot.hear(/(buks|bucks|bux|starbucks|coffee|bean|groundworks)/, function(msg) {
        msg.send("Fuck it, lets go get coffee");
    });
    robot.hear(/btoa (.*)/, function(msg) {
        msg.send(new Buffer(msg.match[1]).toString("base64"));
    });
    robot.hear(/atob (.*)/, function(msg) {
        var message = new Buffer(msg.match[1], "base64").toString("ascii");
        message = (!message || message === "") ? "You're a fucking idiot, you know that?" : message;
        msg.send(message);
    });
    robot.hear(/(whats for lunch|what's for lunch|Whats for lunch|lunch)/, function(msg) {
        msg.send(config.lunch_options[Math.floor(config.lunch_options.length * Math.random())]);
    });
    robot.hear(/^roll$/, function(msg) {
        var roll_result = (Math.floor(Math.random() * 20) + 1);
        if (roll_result === 20) {
            msg.send(msg.message.user.name + " rolled a natural 20, fuck.");
        }
        else if (roll_result === 1) {
            msg.send("Critical miss, lol. " + msg.message.user.name + " rolled a 1.");
        }
        else if (roll_result < 6) {
            msg.send(msg.message.user.name + " rolled a disappointing " + roll_result);
        }
        else if (roll_result > 14) {
            msg.send(msg.message.user.name + " rolled a pretty fucking nice " + roll_result);
        }
        else {
            msg.send(msg.message.user.name + " rolled a " + roll_result);
        }
    });
    robot.hear(/^roll d(4|6|8|10|12|20)$/, function(msg) {
        var ceiling = Number(msg.match[1]);
        var roll_result = (Math.floor(Math.random() * ceiling) + 1);
        console.log(roll_result);
        if (roll_result === ceiling) {
            msg.send(msg.message.user.name + " rolled a fucking natural " + ceiling + "!");
        }
        else if (roll_result === 1) {
            msg.send("Critical miss. " + msg.message.user.name + " rolled a 1, loser.");
        }
        else {
            msg.send(msg.message.user.name + " rolled a " + roll_result);
        }
    });
    robot.hear(/tries to (.*)/, function(msg) {
        var roll_result = (Math.floor(Math.random() * 20) + 1);
        if (msg.message.user.name === 'weston') {
            var message = msg.message.user.name + "rolls a 1\n";
            message += "On " + msg.message.user.name + "'s way to " + msg.match[1] + ", " + msg.message.user.name + " " + randomPatheticAction();
        } else {
            var message = msg.message.user.name + "rolls a " + roll_result + "\n";
            if (roll_result === 20) {
                message += msg.message.user.name + " fucking " + msg.match[1] + ".\n";
            } else if (roll_result > 15) {
                message += "Not only does " + msg.message.user.name + " successfully " + msg.match[1] + ".\n";
                message += msg.message.user.name + " does it while also " + randomImpressiveAction() + " and " + randomImpressiveAction();
            } else if (roll_result > 12) {
                message += msg.message.user.name + " does it and makes it look easy."
            } else if (roll_result > 7) {
                message += "Sorry, " + msg.message.user.name + ", but you'll need a little bit more practice before you can " + msg.match[1];
            } else {
                message += "On " + msg.message.user.name + "'s way to " + msg.match[1] + ", " + msg.message.user.name + " " + randomPatheticAction();
            }
        }
        msg.send(message);
    });
    robot.hear(/set home (.*)/, function(msg) {
        msg.http(config.api_url + "/api/set_home").query({user: msg.message.user.name, address: msg.match[1]})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success) {
                        msg.send("Congratulations on the new diggs");
                    } else {
                        msg.send("That sounds like bullshit, I'm still pretty sure you're homeless");
                    }
                } catch(err) {
                    console.log(err);
                    msg.send("ERROR:  Homeless detected");
                }
            });
    });
    robot.hear(/(should I leave now|should i leave now)(\?)?/, function(msg) {
        msg.send("Well......");
        msg.http(config.api_url + "/api/get_home").query({user: msg.message.user.name})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success && response.address) {
                        msg.http("https://maps.googleapis.com/maps/api/directions/json").query({origin: "5250 Lankershim Blvd", destination: response.address})
                            .get()(function(err, resp, body) {
                                var resp = null;
                                try {
                                    resp = JSON.parse(body);
                                    if (resp.routes && resp.routes.length > 0 && resp.routes[0].legs && resp.routes[0].legs.length > 0) {
                                        msg.send("It's gonna take you " + resp.routes[0].legs[0].duration.text + " to drive " + resp.routes[0].legs[0].distance.text + " home.");
                                    } else {
                                        msg.send("Google thinks your address is bullshit");
                                    }
                                } catch (err) {
                                    console.log(err);
                                    msg.send("Google says you're full of shit");
                                }
                            });
                    } else {
                        msg.send("According to our records, your home is a 404");
                    }
                } catch (err) {
                    console.log(err);
                    msg.send("Poopsie");
                }
            });
    });
}