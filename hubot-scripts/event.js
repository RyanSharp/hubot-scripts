const config = require("./config");

function Event(event_name, callback) {
    this.properties = {event_name: event_name};
    this.loadFromServer(callback);
}

Event.prototype.loadFromServer = function(callback) {
    ROBOT.http(config.api_url + "/api/event").query({event_name: this.properties.event_name})
        .get()(function(err, resp, body) {
            try {
                var response = JSON.parse(body);
                if (response.success) {
                    this.properties = response.event;
                    callback("Active event set");
                } else {
                    console.log(response);
                    callback("Something went wrong");
                }
            } catch(err) {
                console.log(err);
                callback("Something went wrong");
            }
        }.bind(this));
}
Event.prototype.save = function(callback) {
    ROBOT.http(config.api_url + "/api/event")
        .post(JSON.stringify(this.properties))(function(err, resp, body) {
            try {
                var response = JSON.parse(body);
                if (response.success) {
                    callback("Event updated");
                } else {
                    console.log(response);
                    callback("Something went wrong");
                }
            } catch(err) {
                console.log(err);
                callback("Something went wrong");
            }
        }.bind(this));
}

Event.prototype.inviteUser = function(username) {
    if (this.properties.attendees.map(function(a){return a.username}).indexOf(username) >= 0) {
        return;
    }
    var invite = {
        username: username,
        pending: true,
        accepted: false,
    }
    this.properties.attendees.push(invite);
    ROBOT.send({room: "@" + username}, "You've been invited to " + this.properties.event_name + ".  Please reply with either 'attending' or 'go fuck yourself'");
}

Event.prototype.remindUser = function(username) {
    var index = this.properties.attendees.map(function(a){return a.username}).indexOf(username);
    if (index >= 0 && this.properties.attendees[index].pending) {
        ROBOT.send({room: "@" + username}, "Hey asshole, why didn't you RSVP for " + this.properties.event_name + ".  Please reply with either 'attending' or 'go fuck yourself'");
    }
}

Event.prototype.setUserAttending = function(username) {
    var index = this.properties.attendees.map(function(a){return a.username}).indexOf(username);
    if (index >= 0) {
        this.properties.attendees[index].pending = false;
        this.properties.attendees[index].accepted = true;
        return "Yes!  You're in!  Everybody is gonna be so excited";
    }
    return "Ummm.  Sorry to be the one to break it to you, but you weren't invited";
}

Event.prototype.setUserDecline = function(username) {
    var index = this.properties.attendees.map(function(a){return a.username}).indexOf(username);
    if (index >= 0) {
        this.properties.attendees[index].pending = false;
        this.properties.attendees[index].accepted = false;
        return "Well, I knew you were a little bitch.  This just confirms it."
    }
    return "LOL.  You're declining, but they didnt' even invite you!";
}

var ROBOT;
module.exports = function(robot) {
    ROBOT = robot;
    var available_users = [];
    Object.keys(robot.brain.data.users).map(function(k) {
        if (robot.brain.data.users[k].real_name && ["slackbot", "gamemonk"].indexOf(robot.brain.data.users[k].real_name < 0)) {
            available_users.push(robot.brain.data.users[k].name);
        }
    });
    var curr_event;
    robot.hear(/set active event (.*)/, function(msg) {
        const event_name = msg.match[1];
        curr_event = new Event(event_name, function(message) {
            msg.send(message);
        });
    });
    robot.hear(/schedule new event (.*)/, function(msg) {
        const event_name = msg.match[1];
        curr_event = new Event(event_name, function(message) {
            msg.send(message);
        });
    });
    robot.hear(/rename event (.*)/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        const new_event_name = msg.match[1];
        curr_event.properties.event_name = new_event_name;
    });
    robot.hear(/invite (.*)/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        const user_to_invite = msg.match[1];
        if (available_users.indexOf(user_to_invite) >= 0)
            curr_event.inviteUser(user_to_invite);
    });
    robot.hear(/invite (everybody|everyone|all the peeps|all mah bitches)/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        var attendees = [];
        available_users.map(function(user) {curr_event.inviteUser(user)});
    });
    robot.respond(/attending/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        msg.send(curr_event.setUserAttending(msg.message.user.name));
    });
    robot.respond(/go fuck yourself/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        msg.send(curr_event.setUserDecline(msg.message.user.name));
    });
    robot.hear(/who's going/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        var message = "";
        curr_event.properties.attendees.map(function(attendee) {
            if (attendee.accepted) {
                message += attendee.username + "\n";
            }
        });
        msg.send(message);
    });
    robot.hear(/who's invited/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        var message = "";
        curr_event.properties.attendees.map(function(attendee) {
            message += attendee.username + "\n";
        });
        msg.send(message);
    });
    robot.hear(/who isn't going/, function(msg) {
        if (!curr_event) {
            msg.send("Theres no event, dumbass");
            return;
        }
        var message = "";
        curr_event.properties.attendees.map(function(attendee) {
            if (!attendee.pending && !attendee.accepted) {
                message += attendee.username + "\n";
            }
        });
        msg.send(message);
    });
}