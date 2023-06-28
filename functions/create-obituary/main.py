import os
import time
import requests
from requests_toolbelt.multipart import decoder
import hashlib
import boto3
import base64
import json
import uuid


dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("thelastshow-30143555")


# getting the params
client = boto3.client('ssm')    
response = client.get_parameters_by_path(
   Path = '/the-last-show/',
   Recursive=True,
   WithDecryption=True
)


# creating a dictionary so that i can have this:
# {"/the-last-show/cloudinary-key": "yourkey"}
keys = {item['Name']: item['Value'] for item in response['Parameters']}


def get_key(key_path):
  return keys.get(key_path, None)


def lambda_handler(event, context):
  
   # getting the body of the request
   # that includes file + name + dates
   body = event["body"]


   if event["isBase64Encoded"]:
       body = base64.b64decode(body)


   content_type = event["headers"]["content-type"]
   data = decoder.MultipartDecoder(body, content_type)


   binary_data = [part.content for part in data.parts]
   name = binary_data[1].decode()
   birth = binary_data[2].decode()
   death = binary_data[3].decode()


   key = "obituary.png"
   file_name = os.path.join("/tmp", key)
   with open (file_name, "wb") as f:
       f.write(binary_data[0])


   res = upload_to_cloudinary(file_name, resource_type="image", extra_fields={"eager":"e_art:zorro"})


   cloudinary_url = res['url']
   gpt_text = ask_gpt(name, birth, death)
   polly_text = read_this(gpt_text)
   mp3 = upload_to_cloudinary(polly_text, resource_type="raw")

   obituary_id = str(uuid.uuid4())
   # make sure you include the url in the response
   body = {
               "name": name,
               "birth": birth,
               "death": death,
               "cloudinary_url": cloudinary_url,
               "image_res": res["eager"][0]["secure_url"],
               "description": gpt_text,
               "polly_url": mp3["secure_url"],
               "id" : obituary_id
       }
  
  
   try:
       table.put_item(Item=body)
       return  {
        "statusCode": 200,
        "body": json.dumps(body)
       }
  
   except Exception as exp:
       print(f"exception:{exp}")
       return{
           "statusCode": 401,
           "body": json.dumps({
           "message": str(exp)
               })
           }


def upload_to_cloudinary(filename, resource_type = "", extra_fields=()):
  """
  Uploads file at filename path to Cloudinary
  """


  api_secret = get_key("/the-last-show/cloudinary-secret-key")
  api_key = get_key("/the-last-show/cloudinary-key")
  cloud_name = "dwk2prxwt"


  body = {
      "api_key" : api_key
  }

  files = {
      "file": open(filename, "rb")
  }

  timestamp = int(time.time())
  body["timestamp"] = timestamp
  body.update(extra_fields)
  body["signature"] = create_signature(body, api_secret)
 
  if resource_type == "image":
     body["eager"] = "e_art:zorro"



  url = f"http://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload".format(cloud_name)
  res = requests.post(url, files = files, data = body)
  return res.json()


def create_signature(body, api_secret):
  exclude = ["api_key", "resource_type", "cloud_name"]
  sorted_body = sort_dictionary(body)
  query_string = create_query_string(sorted_body)
  query_string_appended = f"{query_string}{api_secret}"
  hashed = hashlib.sha1(query_string_appended.encode())
  signature = hashed.hexdigest()
  return signature

def sort_dictionary(dictionary):
  exclude = ["api_key", "resource_type", "cloud_name"]
  return {k: v for k, v in sorted(dictionary.items(), key=lambda item: item[0]) if k not in exclude}

def create_query_string(body):
  query_string = ""
  for idx, (k,v) in enumerate(body.items()):
      query_string = f"{k}={v}" if idx == 0 else f"{query_string}&{k}={v}"
  return query_string


def ask_gpt(name, birth, death):
#    get the key from parameter store and then put it in a variable
#    TODO: create this key
  api_secret = get_key("/the-last-show/gpt-api-key")
  url = "https://api.openai.com/v1/completions"
  headers = {
      "Content-Type" : "application/json",
      "Authorization" : f"Bearer {api_secret}"
  }


#    create a prompt for the user based on birth and death
  prompt = f"write an obituary about a fictional character named {name} who was born on {birth} and died on {death}"


  body = {
      "model": "text-curie-001",
      "prompt": prompt,
      "max_tokens": 600,
      "temperature": 0.2
  }


  res = requests.post(url, headers=headers, json=body)
  return res.json()["choices"][0]["text"]


def read_this(prompt):
  client = boto3.client('polly')
  response = client.synthesize_speech(
  Engine ='standard',
  LanguageCode ='en-US',
  OutputFormat = 'mp3',
  Text = prompt,
  TextType = 'text',
  VoiceId = 'Joanna'
)


  filename = "/tmp/polly.mp3"
  with open(filename, "wb") as f:
      f.write(response["AudioStream"].read())


  return filename

