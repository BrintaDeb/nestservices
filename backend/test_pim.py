from pymongo_inmemory import MongoClient

try:
    print("Trying to initialize pymongo_inmemory")
    client = MongoClient()
    print("Success:", client.address)
except Exception as e:
    import traceback
    traceback.print_exc()
