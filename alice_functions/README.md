# Azure Functions

Azure Functions making CRUD operations via HTTP triggers. Written in Javascript.

## Requirements

- nodejs
- azure-functions-core-tools
@azure/functions
- mongodb

## Setup Instructions
1. Install the Azure Functions VSCode Extension (if you want to check out its nifty-ness)
2. Navigate to CRUDfunctions (assuming youre in root):
    ```bash
   cd alice_functions/CRUDfunctions
3. Install dependencies:
   ```bash
   npm install
4. Run the CRUD functions for API testing (currently testing Create, Read, and ReadAll)
    ```bash
   func host start
## Creating Functions Locally
1. If you have the VSCode Extension, you can navigate through options (like HTTP trigger, scheduler, etc.) from running:
    ```bash
    func new
2. Or alternatively for our case, this template works:
    ```bash
    func new --name FuncName --template "HTTP trigger"
3. If you want to remake functions completely, like in a different language, go into your directory of choice and run:
    ```bash
    func init DirName --python     
