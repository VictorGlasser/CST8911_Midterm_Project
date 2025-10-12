import requests

# Python app that runs API tests; like Insomnia
# Replace localhost address with the proper Azure Function address later.

# Function to get the OAuth token
def get_oauth_token():
    token_url = "http://localhost:8080/oauth/token"
    token_data = {
        "client_id": "example_client_id",
        "client_secret": "example_client_secret",
        "grant_type": "client_credentials"
    }
    response = requests.post(token_url, json=token_data)
    response.raise_for_status()
    return response.json()["access_token"]

# Function to set the authorization header
def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# Function to test getAllCrocodiles
def test_get_all_crocodiles(token):
    url = "http://localhost:7071/api/crocodiles"
    headers = get_headers(token)
    response = requests.get(url, headers=headers)
    print("Testing getAllCrocodiles:\n", response.json(), "\n---")

# Function to test getCrocodile
def test_get_crocodile(token, id):
    url = f"http://localhost:7071/api/crocodiles/{id}"
    headers = get_headers(token)
    response = requests.get(url, headers=headers)
    print(f"Testing getCrocodile matching id {id}:\n", response.json(), "\n---")

# Function to test deleteCrocodile
def test_delete_crocodile(token, id):
    url = f"http://localhost:7071/api/crocodiles/{id}"
    headers = get_headers(token)
    response = requests.delete(url, headers=headers)
    print(f"Testing deleteCrocodile matching id {id}:\n", response.json(), "\n---")


# Function to test createCrocodile w/ Miffy
def test_create_crocodile(token, crocodile_data):
    url = "http://localhost:7071/api/crocodiles/"
    headers = get_headers(token)
    response = requests.post(url, headers=headers, json=crocodile_data)
    print("Testing createCrocodile for Miffy:\n", response.json(), "\n---")


# Function to test updateCrocodile
def test_update_crocodile(token, id, crocodile_data):
    url = f"http://localhost:7071/api/crocodiles/{id}"
    headers = get_headers(token)
    response = requests.patch(url, headers=headers, json=crocodile_data)
    print(f"Updating crocodile for matching id {id} to be updated with the data:\n", crocodile_data, "\n")
    print(f"Testing updateCrocodile for matching id {id}:\n", response.json(), "\n---")

# Main function to run the tests
def main():
    token = get_oauth_token()
    test_get_all_crocodiles(token)
    test_get_crocodile(token, 994)
    # Miffy crocodile
    user_crocodile_data = {
        "Common Name": "Miffy Crocodile",
        "Scientific Name": "Crocodylus miffyticus",
        "Family": "Crocodylidae",
        "Genus": "Crocodylus",
        "Observed Length (m)": 5.0,
        "Observed Weight (kg)": 500,
        "Age Class": "Adult",
        "Sex": "Female",
        "Date of Observation": "12-10-2025",
        "Country/Region": "Netherlands",
        "Habitat Type": "Rivers",
        "Conservation Status": "Least Concern",
        "Observer Name": "Alice Yang",
        "Notes": "A little girl crocodile."
    }

    # Update data
    update_crocodile_data = {
        "Common Name": "Updated Miffy Crocodile",
        "Scientific Name": "Updated Crocodylus miffyticus"
        # Add other fields as needed
    }

    test_create_crocodile(token, user_crocodile_data)
    test_update_crocodile(token, 1001, update_crocodile_data)
    print("Checking that Miffy crocodile actually updated...\n")
    test_get_crocodile(token, 1001)
    test_delete_crocodile(token, 1001)
    print("Checking that Miffy crocodile actually deleted...\n")
    test_get_crocodile(token, 1001)



if __name__ == "__main__":
    main()
