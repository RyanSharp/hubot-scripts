const config = require("./config");

module.exports = function(robot) {
    ROBOT = robot;
    robot.hear(/giphy (.*)/, function(msg) {
        var requestUrl, response;
        msg.http(config.giphy_url).query({q: msg.match[msg.match.length-1], api_key: config.giphy_api_key})
            .get()(function(err, resp, body) {
                response = null;
                try {
                    response = JSON.parse(body);
                    response = response.data;
                    msg.send(response[Math.floor(Math.random() * response.length)].url);
                } catch(err) {
                    console.log(err);
                    msg.send("Fuck you, bitch.  Nothing");
                }
            });
    });
}
