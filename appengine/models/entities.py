from google.appengine.ext import ndb


class Holding(ndb.Model):
    ticker = ndb.StringProperty()
    quantity = ndb.FloatProperty()
    market_volume = ndb.IntegerProperty()


class Account(ndb.Model):
    username = ndb.StringProperty()
    cash_funds = ndb.FloatProperty()
    holdings = ndb.StructuredProperty(Holding, repeated=True)


class Transaction(ndb.Model):
    account_key = ndb.KeyProperty(Account)
    ticker = ndb.StringProperty()
    quantity = ndb.FloatProperty()
    price = ndb.FloatProperty()
    action = ndb.StringProperty()


class PostedImage(ndb.Model):
    url = ndb.StringProperty()
    random_num = ndb.FloatProperty()


class UserHome(ndb.Model):
    address = ndb.StringProperty()
    username = ndb.StringProperty()
