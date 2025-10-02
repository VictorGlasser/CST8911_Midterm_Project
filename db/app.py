import pymongo

# start the mongo client
myclient = pymongo.MongoClient("mongodb://localhost:27017/")

# add a new DB 
mydb = myclient["Crocs"]

# add a new collection called crocodiles
crocodiles = mydb["crocodiles"]

# create a croco
croco1 = {
            "Observation ID":1,
            "Common Name":"Morelet's Crocodile",
            "Scientific Name":"Crocodylus moreletii",
            "Family":"Crocodylidae",
            "Genus":"Crocodylus",
            "Observed Length (m)":1.9,
            "Observed Weight (kg)":62.0,
            "Age Class":"Adult",
            "Sex":"Male",
            "Date of Observation":"31-03-2018",
            "Country\/Region":"Belize",
            "Habitat Type":"Swamps",
            "Conservation Status":"Least Concern",
            "Observer Name":"Allison Hill",
            "Notes":"Cause bill scientist nation opportunity."
        }

# add the croco to the collection
x = crocodiles.insert_one(croco1)

# list the DBs
print("List of databases")
print(myclient.list_database_names())

# list the collections
print("List of collections in the DB")
print(mydb.list_collection_names())

#address greater than S:
myquery = {}

croclist = crocodiles.find(myquery)

# list crocs
for x in croclist:
    print(x)