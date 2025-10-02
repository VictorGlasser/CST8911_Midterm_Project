import pymongo
import json

# start the mongo client
myclient = pymongo.MongoClient("mongodb://localhost:27017/")

# add a new DB 
mydb = myclient["Crocs"]

# add a new collection called crocodiles
crocodiles = mydb["crocodiles"]

# create an empty query, it will return every item
getAllQuery = {}

# clear the collection, we do this so that we can re-run the script without duping the data
crocodiles.delete_many(getAllQuery)

# populate the DB with sample data
try:
    # try to open the json file with the list of sample data
    with open('crocodile_dataset.json', 'r') as f:
        data = json.load(f)

    crocodiles.insert_many(data)
# if the json file is missing
except FileNotFoundError:
    print("Error: 'data.json' not found.")

# if the json file is in a bad format
except json.JSONDecodeError:
    print("Error: Could not decode JSON from 'crocodile_dataset.json'. Check file format.")

# list the DBs
print("List of databases in the mongoDB client")
print(myclient.list_database_names())

# list the collections
print("List of collections in the Crocs DB")
print(mydb.list_collection_names())


# Get all Crocos in the DB
def get_all_crocos():
    print("Got a request to list all crocos")
    croc_result = crocodiles.find(getAllQuery)
    return croc_result


# Get a Croco based on an ID
def get_croco(ID):
    print("Got a request get croco " + str(ID))
    croco_query = {"_id" : ID}
    croc_result = crocodiles.find_one(croco_query)
    return croc_result

# Create a Croco

# Edit a Croco based on their ID

# Delete a Croco based on their ID
