const LUNCH_OPTIONS = [
    "Lunch Option #1",
    "Lunch Option #2",
    "Lunch Option #3",
];

const IMPRESSIVE_ACTIONS = [
    ""
];

const PATHETIC_ACTIONS = [
    ""
];

function encodeJSONForURI(params) {
    return Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
}

module.exports = {
    api_url: "DEPLOYED_APPENGINE_URL",
    giphy_url: "http://api.giphy.com/v1/gifs/search", // Giphy API URL
    giphy_api_key: "dc6zaTOxFJmzC", // Beta test API key for giphy
    lunch_options: LUNCH_OPTIONS,
    encodeJSONForURI: encodeJSONForURI,
}