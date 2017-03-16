module.exports = function(robot) {
    var memory = {};
    robot.hear(/(.*)/, function(msg) {
        var prev = memory[msg.message.user.name] || [];
        prev.push(msg.match[1]);
        while (prev.length > 100) {
            prev.splice(0, 1);
        }
        memory[msg.message.user.name] = prev;
        console.log(memory);
    });
    robot.respond(/last (\d+) things ([a-zA-Z0-9\._-]+) said/, function(msg) {
        var count = Number(msg.match[1]);
        var username = msg.match[2];
        var message = "Here are the last " + count + " things " + username + " has said\n";
        var messages = memory[username] || [];
        var msgs = [];
        for (var i = 0; i < count; i++) {
            var curr = messages[messages.length - 1 - i];
            if (!curr) break;
            msgs.push(curr);
        }
        msgs.reverse();
        message += msgs.join("\n");
        msg.send(message);
    });
}