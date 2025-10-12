# Azure Functions - API Testing

Python app that runs API tests on the Azure Functions (replacing Insomnia)

## Note

Replace localhost address with the proper Azure Function address later.

## Requirements

- python3
- requests

## Setup Instructions
1. SSH connect to the Linux VM
2. Install required software:
   ```bash
   sudo apt update
   sudo apt install python3-pip
3. Clone the repo with the API test script:
   ```bash
   git clone https://github.com/AliceYangAC/CST8911_Midterm_APITest.git
4. Install dependencies:
    ```bash
    pip install requests
4. Run the script:
    ```bash
    python api_test.py
5. Monitor performance of Azure Functions via Azure Monitor

