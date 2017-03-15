var hidden = requre("./hidden");

const LUNCH_OPTIONS = [
    "Chipotle",
    "Lulz Mirch",
    "FedDawg",
    "Starbys",
    "Pitfire.  Sorry Bryan, but I have spoken",
    "Ramen",
    "Pho",
    "EAT",
    "Oh no. It's Onos.  Fuck",
    "Panda Xpress",
    "Firehau5",
    "Thai? Lol jk.  Krnbbq",
    "That one place with the good sandwiches",
    "Portos!",
    "Sam's choice",
    "I dunno, but Weston is driving",
    "I want mediterranean, but I don't know any places",
    "Pho 87",
    "I brought my own",
    "Dim Sum",
];

const IMPRESSIVE_ACTIONS = [
    "holding and not spilling his beer",
    "doing a back flip",
    "eating a hot pocket, without letting it cool down",
    "cooking the perfect steak",
    "walking on water",
    "hacking into the mainframe",
];

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

function encodeJSONForURI(params) {
    return Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
}

module.exports = {
    api_url: hidden.api_url,
    giphy_url: "http://api.giphy.com/v1/gifs/search",
    giphy_api_key: "dc6zaTOxFJmzC",
    lunch_options: LUNCH_OPTIONS,
    encodeJSONForURI: encodeJSONForURI,
    impressive_actions: IMPRESSIVE_ACTIONS,
    pathetic_actions: PATHETIC_ACTIONS,
}