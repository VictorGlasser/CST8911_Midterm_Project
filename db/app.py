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
print("Database created!")
print("Populating database with JSON file data.....")
try:
    print("Attempting to read 'crocodile_dataset.json'.....")
    # try to open the json file with the list of sample data
    with open('crocodile_dataset.json', 'r') as f:
        data = json.load(f)
        print("Reading complete!")

    print("Loading JSON data into the database.....")
    crocodiles.insert_many(data)

    print("Loading of JSON data is complete!")
    print("Welcome to the special crocodile database!")
# if the json file is missing
except FileNotFoundError:
    print("Error: 'crocodile_dataset.json' not found.")

# if the json file is in a bad format
except json.JSONDecodeError:
    print("Error: Could not decode JSON from 'crocodile_dataset.json'. Check file format.")