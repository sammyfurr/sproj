from pymongo import MongoClient, errors
import database

# Setup constraints

url = '165.227.252.45'
port = 27017
client = MongoClient(url, port)

client.debugger.users.create_index('name', unique=True)
client.debugger.pods.create_index('channel', unique=True)
client.debugger.examples.create_index('name', unique=True)
