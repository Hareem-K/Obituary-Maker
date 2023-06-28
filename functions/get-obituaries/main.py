'''
get-obituaries-<your-ucid>: to retrieve all the obituaries. 
Function URL only allows GET requests
'''
import json
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("thelastshow-30143555")

def lambda_handler(event, context):
   
    try:
        response = table.scan()
        
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": str(e)})
        }
    
    items = response["Items"]

    # Return the list of items as a JSON response
    return {
        "statusCode": 200,
        "body": json.dumps(items)
    }