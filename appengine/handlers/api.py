from webapp2 import RequestHandler, WSGIApplication
from google.appengine.ext.key_range import ndb
from models.entities import Account, Holding, Transaction, PostedImage, UserHome, Event, Attendees
import httplib2
import logging
import random
import json


def get_account(username):
    account = Account.query(Account.username == username).get()
    if not account:
        account = Account(username=username, cash_funds=250000, holdings=[], shorts=[])
        account.put()
    return account


def get_stock_data_from_yahoo(ticker):
    url = "http://query1.finance.yahoo.com/v10/finance/quoteSummary/{0}?formatted=true&lang=en-US&region=US&modules=defaultKeyStatistics%2CfinancialData%2CcalendarEvents&corsDomain=finance.yahoo.com"
    url = url.format(ticker)
    http = httplib2.Http()
    resp, content = http.request(url, method="GET")
    try:
        content = json.loads(content)
        content = {
            "price": content["quoteSummary"]["result"][0]["financialData"]["currentPrice"]["raw"],
            "market_volume": content["quoteSummary"]["result"][0]["defaultKeyStatistics"]["sharesOutstanding"]["raw"],
        }
        return content
    except Exception as e:
        print e
        return None


class Buy(RequestHandler):
    def get(self):
        rdict = {"success": False}
        ticker = self.request.get("symbol")
        stock_data = get_stock_data_from_yahoo(ticker)
        if stock_data is not None:
            quantity = float(self.request.get("volume"))
            username = self.request.get("user")
            if username:
                account = get_account(username)
                funds = account.cash_funds
                shorts = account.shorts if account.shorts else []
                for short in shorts:
                    data = get_stock_data_from_yahoo(short.ticker)
                    asset_volume = data["market_volume"]
                    if short.market_volume != int(asset_volume):
                        short.quantity = short.quantity * (int(asset_volume)/short.market_volume)
                        short.market_volume = int(asset_volume)
                    funds -= short.quantity * data["price"]
                purchase_cost = quantity * stock_data["price"]
                if purchase_cost <= funds:
                    account.cash_funds -= purchase_cost
                    asset_volume = stock_data["market_volume"]
                    for holding in account.holdings:
                        if holding.ticker == ticker:
                            if int(asset_volume) != holding.market_volume:
                                holding.quantity =\
                                    holding.quantity * (asset_volume/holding.market_volume)
                                holding.market_volume = int(asset_volume)
                            holding.quantity += quantity
                            break
                    else:
                        holding = Holding(ticker=ticker,
                                          quantity=quantity,
                                          market_volume=int(asset_volume))
                        account.holdings.append(holding)
                    account.put()
                    rdict["success"] = True
                else:
                    quantity = funds/stock_data["price"]
                    rdict["msg"] = "You're broke bitch.  You could maybe buy... {0} shares"\
                        .format(quantity)
            else:
                rdict["msg"] = "Username required"
        else:
            rdict["msg"] = "No data for symbol."
        self.response.write(json.dumps(rdict))


class StatusUpdate(RequestHandler):
    def get(self):
        rdict = {"success": False}
        username = self.request.get("user")
        if username:
            account = get_account(username)
            rdict["holdings"] = []
            total = 0
            for holding in account.holdings:
                stock_data = get_stock_data_from_yahoo(holding.ticker)
                if stock_data is None:
                    continue
                asset_volume = stock_data["market_volume"]
                if holding.market_volume != int(asset_volume):
                    holding.quantity = holding.quantity * (int(asset_volume)/holding.market_volume)
                    holding.market_volume = int(asset_volume)
                rdict["holdings"].append({
                    "symbol": holding.ticker,
                    "quantity": holding.quantity,
                    "asset_value": holding.quantity * stock_data["price"],
                })
                total += (holding.quantity * stock_data["price"])
            rdict["shorts"] = []
            shorts = account.shorts if account.shorts else []
            for short in shorts:
                stock_data = get_stock_data_from_yahoo(short.ticker)
                if stock_data is None:
                    continue
                asset_volume = stock_data["market_volume"]
                if short.market_volume != int(asset_volume):
                    short.quantity = short.quantity * (int(asset_volume)/short.market_volume)
                    short.market_volume = int(asset_volume)
                rdict["shorts"].append({
                    "symbol": short.ticker,
                    "quantity": short.quantity,
                    "asset_value": short.quantity * stock_data["price"],
                })
                total += -(short.quantity * stock_data["price"])
            rdict["cash"] = account.cash_funds
            rdict["portfolio_value"] = account.cash_funds + total
            account.put()
            rdict["success"] = True
        else:
            rdict["msg"] = "Username required"
        self.response.write(json.dumps(rdict))


class Sell(RequestHandler):
    def get(self):
        rdict = {"success": False}
        ticker = self.request.get("symbol")
        stock_data = get_stock_data_from_yahoo(ticker)
        if stock_data is not None:
            quantity = float(self.request.get("volume"))
            username = self.request.get("user")
            account = get_account(username)
            asset_volume = stock_data["market_volume"]
            splice_index = 0
            for holding in account.holdings:
                if holding.ticker == ticker:
                    if int(asset_volume) != holding.market_volume:
                        holding.quantity =\
                            holding.quantity * (int(asset_volume)/holding.market_volume)
                        holding.market_volume = int(asset_volume)
                    quantity = min(holding.quantity, quantity)
                    holding.quantity -= quantity
                    if holding.quantity != 0:
                        splice_index = None
                    rdict["sale_price"] = quantity * stock_data["price"]
                    rdict["sale_volume"] = quantity
                    rdict["remaining_volume"] = holding.quantity
                    account.cash_funds += quantity * stock_data["price"]
                    rdict["success"] = True
                    break
                splice_index += 1
            else:
                rdict["msg"] = "User has no holdings for ticker"
            if splice_index is not None and splice_index < len(account.holdings):
                holdings = []
                for holding in account.holdings:
                    if holding.ticker == ticker:
                        continue
                    holdings.append(holding)
                account.holdings = holdings
            account.put()
        else:
            rdict["msg"] = "No data for symbol."
        self.response.write(json.dumps(rdict))


class Short(RequestHandler):
    def get(self):
        rdict = {"success": False}
        ticker = self.request.get("symbol")
        stock_data = get_stock_data_from_yahoo(ticker)
        if stock_data is not None:
            quantity = float(self.request.get("volume"))
            username = self.request.get("user")
            account = get_account(username)
            asset_volume = stock_data["market_volume"]
            cash_sell = quantity * stock_data["price"]
            shorts = account.shorts if account.shorts is not None else []
            for short in shorts:
                if short.ticker == ticker:
                    if int(asset_volume) != short.market_volume:
                        short.quantity = short.quantity * (int(asset_volume)/short.market_volum)
                        short.market_volume = int(asset_volume)
                    short.quantity += quantity
                    break
            else:
                short = Holding(ticker=ticker,
                                quantity=quantity,
                                market_volume=int(asset_volume))
                shorts.append(short)
            account.shorts = shorts
            account.cash_funds += cash_sell
            account.put()
            rdict["success"] = True
        else:
            rdict["msg"] = "No data for symbol."
        self.response.write(json.dumps(rdict))


class DivesetShortPosition(RequestHandler):
    def get(self):
        rdict = {"success": False}
        ticker = self.request.get("symbol")
        stock_data = get_stock_data_from_yahoo(ticker)
        if stock_data is not None:
            username = self.request.get("user")
            account = get_account(username)
            shorts = account.shorts if account.shorts else []
            asset_volume = stock_data["market_volume"]
            index = 0
            sell_price = None
            for short in shorts:
                if short.ticker == ticker:
                    if int(asset_volume) != short.market_volume:
                        short.quantity = short.quantity * (int(asset_volume)/short.market_volum)
                        short.market_volume = int(asset_volume)
                    sell_price = short.quantity * stock_data["price"]
                    break
                index += 1
            if sell_price is None:
                rdict["msg"] = "No short position for that symbol"
            else:
                shorts = []
                for short in account.shorts:
                    if short.ticker != ticker:
                        shorts.append(ticker)
                account.shorts = shorts
                account.cash_funds -= sell_price
                account.put()
                rdict["success"] = True
                rdict["exit_cost"] = sell_price
        else:
            rdict["msg"] = "No data for symbol."
        self.response.write(json.dumps(rdict))


class SetHome(RequestHandler):
    def get(self):
        rdict = {"success": False}
        address = self.request.get("address")
        username = self.request.get("user")
        home = UserHome.query(UserHome.username == username).get()
        if home is None:
            home = UserHome(username=username)
        home.address = address
        home.put()
        rdict["success"] = True
        self.response.write(json.dumps(rdict))


class GetHome(RequestHandler):
    def get(self):
        rdict = {"success": False}
        username = self.request.get("user")
        home = UserHome.query(UserHome.username == username).get()
        if home is not None:
            rdict["address"] = home.address
            rdict["success"] = True
        else:
            rdict["msg"] = "As far as I can tell, you're homeless.  You bum"
        self.response.write(json.dumps(rdict))


class SaveImage(RequestHandler):
    def get(self):
        rdict = {"success": False}
        url = self.request.get("url")
        http = httplib2.Http()
        resp, content = http.request(url, method="GET")
        if resp.status == 200 or resp.status == "200":
            img = PostedImage(url=url,
                              random_num=random.random())
            img.put()
            rdict["success"] = True
        else:
            rdict["msg"] = "URL invalid"
        self.response.write(json.dumps(rdict))


class GetRandomImage(RequestHandler):
    def get(self):
        rdict = {"success": False}
        rand = random.random()
        img = PostedImage.query().filter(PostedImage.random_num >= rand)\
            .order(PostedImage.random_num).get()
        if img is None:
            img = PostedImage.query().filter(PostedImage.random_num <= rand)\
                .order(-PostedImage.random_num).get()
        if img:
            rdict["url"] = img.url
            rdict["success"] = True
        else:
            rdict["msg"] = "No images"
        self.response.write(json.dumps(rdict))


def get_event_by_name(event_name):
    event = Event.query(Event.event_name == event_name).get()
    if event is None:
        event = Event(event_name=event_name,
                      attendees=[])
        event.put()
    return event


class EventHandler(RequestHandler):
    def get(self):
        rdict = {"success": False}
        event_name = self.request.get("event_name")
        try:
            event = get_event_by_name(event_name)
            rdict["event"] = {
                "event_name": event.event_name,
                "location": event.location,
                "start_time": event.start_time,
                "attendees": [],
                "created": event.created.strftime("%c")
            }
            for attendee in event.attendees:
                rdict["attendees"].append({
                    "username": attendee.username,
                    "accepted": attendee.accepted,
                    "pending": attendee.pending,
                })
            rdict["success"] = True
        except Exception as e:
            logging.exception(e)
            rdict["msg"] = e.message
        self.response.write(json.dumps(rdict))

    def post(self):
        rdict = {"success": False}
        try:
            data = json.loads(self.request.body)
            event = get_event_by_name(data["event_name"])
            event.location = data["location"]
            event.start_time = data["start_time"]
            attendees = []
            for attendee in data["attendees"]:
                attendees.append(Attendees(username=attendee["username"],
                                           accepted=attendee["accepted"],
                                           pending=attendee["pending"]))
            event.put()
            rdict["success"] = True
        except Exception as e:
            logging.exception(e)
            rdict["msg"] = e.message
        self.response.write(json.dumps(rdict))


app = ndb.toplevel(WSGIApplication([
    ("/api/buy", Buy),
    ("/api/sell", Sell),
    ("/api/status", StatusUpdate),
    ("/api/short", Short),
    ("/api/exit_short", DivesetShortPosition),
    ("/api/save_posted_img_url", SaveImage),
    ("/api/random_posted_img_url", GetRandomImage),
    ("/api/set_home", SetHome),
    ("/api/get_home", GetHome),
    ("/api/event", EventHandler),
], debug=True))
