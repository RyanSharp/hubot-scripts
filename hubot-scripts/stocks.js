var config = require("./config");

module.exports = function(robot) {
    robot.hear(/stock quote (.*)/, function(msg) {
        requestUrl = "http://query1.finance.yahoo.com/v10/finance/quoteSummary/" + msg.match[1] + "?formatted=true&lang=en-US&region=US&modules=defaultKeyStatistics%2CfinancialData%2CcalendarEvents&corsDomain=finance.yahoo.com";
        msg.http(requestUrl)
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    var message = msg.match[1];
                    message += " | " + response.quoteSummary.result[0].financialData.currentPrice.raw;
                    msg.send(message);
                } catch(err) {
                    console.log(err);
                    msg.send("You sure you got that right?");
                }
            })
    });
    robot.hear(/buy (\d+) (.*)/, function(msg) {
        msg.http(config.api_url + "/api/buy").query({symbol: msg.match[2], volume: msg.match[1], user: msg.message.user.name})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success) {
                        msg.send("You just bought in.  You're gonna be rich, bitch");
                    } else {
                        msg.send(response.msg);
                    }
                } catch(err) {
                    console.log(err);
                    msg.send("Something went wrong.  Probably your fault");
                }
            });
    });
    robot.hear(/show me the money/, function(msg) {
        msg.http(config.api_url + "/api/status").query({user: msg.message.user.name})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    var message = "";
                    if (response.success) {
                        if (response.holdings.length === 0) {
                            message += "You got no investments.  You're pathetic\n";
                        } else {
                            response.holdings.map(function(holding) {
                                message += holding.symbol + " - " + holding.quantity + " - $" + holding.asset_value + " ($" + (holding.asset_value/holding.quantity) + " per share)\n";
                            });
                        }
                        if (response.shorts && response.shorts.length > 0) {
                            message += "Short Positions:\n";
                            response.shorts.map(function(short) {
                                message += short.symbol + " - " + short.quantity + " - will cost $" + short.asset_value + " to close position\n";
                            });
                        }
                        message += "Your un-invested cash is " + response.cash + "\n";
                        message += "Your total portfolio value is " + response.portfolio_value + "\n";
                        if (response.cash/response.portfolio_value > 0.8) {
                            message += "Wtf?  You're too liquid.  You're like diarrhea";
                        } 
                        msg.send(message);
                    } else {
                        msg.send(response.msg);
                    }
                } catch(err) {
                    console.log(err);
                    msg.send("Something went wrong.  Probably your fault");
                }
            });
    });
    robot.hear(/sell (\d+) (.*)/, function(msg) {
        msg.http(config.api_url + "/api/sell").query({user: msg.message.user.name, volume: msg.match[1], symbol: msg.match[2]})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success) {
                        msg.send("You got $" + response.sale_price.toFixed(2) + ".");
                    } else {
                        msg.send(response.msg);
                    } 
                } catch(err) {
                    console.log(err);
                    msg.send("Something went wrong.  Probably your fault");
                }
            });
    });
    robot.hear(/stock short (\d+) (.*)/, function(msg) {
        msg.http(config.api_url + "/api/short").query({user: msg.message.user.name, volume: msg.match[1], symbol: msg.match[2]})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success) {
                        msg.send("You're in.  I hope you know what you're doing");
                    } else {
                        msg.send(response.msg);
                    }
                } catch (err) {
                    console.log(err);
                    msg.send("Something went wrong.  Probably your fault");
                }
            });
    });
    robot.hear(/close short (.*)/, function(msg) {
        msg.http(config.api_url + "/api/exit_short").query({user: msg.message.user.name, symbol: msg.match[1]})
            .get()(function(err, resp, body) {
                var response = null;
                try {
                    response = JSON.parse(body);
                    if (response.success) {
                        msg.send("Short position closed for $" + response.exit_cost);
                    } else {
                        msg.send(response.msg);
                    }
                } catch(err) {
                    console.log(err);
                    msg.send("Something went wrong.  Probably your fault");
                }
            });
    });
}