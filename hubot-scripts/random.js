

const IMPRESSIVE_ACTIONS = config.impressive_actions;

function randomImpressiveAction() {
    return IMPRESSIVE_ACTIONS[Math.floor(Math.random() * IMPRESSIVE_ACTIONS.length)];
}

const PATHETIC_ACTIONS = config.pathetic_actions;

function randomPatheticAction() {
    return PATHETIC_ACTIONS[Math.floor(Math.random() * PATHETIC_ACTIONS.length)];
}

module.exports = function(robot) {
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
}