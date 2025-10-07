sudo apt update

# install deps
sudo apt-get install gnupg curl

# import the public key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

# create the list file
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.2.list
sudo apt-get update

# install mongoDB
sudo apt-get install -y mongodb-org

#run mongo DB
sudo systemctl start mongod
# install mongoDB
sudo apt-get install -y mongodb-org

#run mongo DB
sudo systemctl start mongod

# install python
sudo apt-get update
sudo apt-get install python3.6

# install python package installer
sudo apt install python3-pip

# install app deps
sudo apt install python3-pip

# run app
python3 app.py