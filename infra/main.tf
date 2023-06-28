terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}


provider "aws" {
  region = "ca-central-1"
}


# two lambda functions w/ function url
# one dynamodb table
# roles and policies as needed
# step functions (if you're going for the bonus marks)


#Get_Obituaries


resource "aws_iam_role" "lambda_get_obituaries" {
  name = "iam-for-lambda-get-obituaries"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}


data "archive_file" "get-obituaries-30140959-archive" {
  type        = "zip"
  source_file = "../functions/get-obituaries/main.py"
  output_path = "get_obituaries.zip"
}


resource "aws_lambda_function" "lambda_get_obituaries" {
  role             = aws_iam_role.lambda_get_obituaries.arn
  function_name    = "get-obituaries-30140959"
  handler          = "main.lambda_handler"
  filename         = "get_obituaries.zip"
  source_code_hash = data.archive_file.get-obituaries-30140959-archive.output_base64sha256
  runtime          = "python3.9"
}


resource "aws_iam_policy" "dynamodb_get_policy" {
  name = "dynamodb-get-policy"


  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:*", "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Effect   = "Allow"
        Resource = [aws_dynamodb_table.thelastshow-30143555.arn, "arn:aws:logs:*:*:*"]
      }
    ]
  })
}


# S3 bucket
# if you omit the name, Terraform will assign a random name to it
# see the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
resource "aws_s3_bucket" "lambda" {}


# output the name of the bucket after creation
output "bucket_name" {
  value = aws_s3_bucket.lambda.bucket
}


resource "aws_iam_role_policy_attachment" "lambda_dynamodb_get_policy" {
  policy_arn = aws_iam_policy.dynamodb_get_policy.arn
  role       = aws_iam_role.lambda_get_obituaries.name
}


resource "aws_lambda_function_url" "get_obituaries_url" {
  function_name      = aws_lambda_function.lambda_get_obituaries.function_name
  authorization_type = "NONE"


  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}


output "get_obituaries_url" {
  value = aws_lambda_function_url.get_obituaries_url.function_url
}


#Create_Obituary


resource "aws_iam_role" "lambda_create_obituary" {
  name = "iam-for-lambda-create-obituary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}


data "archive_file" "create-obituary-30140959-archive" {
  type        = "zip"
  source_dir  = "../functions/create-obituary"
  output_path = "create_obituary.zip"
}


resource "aws_lambda_function" "lambda_create_obituary" {
  role             = aws_iam_role.lambda_create_obituary.arn
  function_name    = "create-obituary-30140959"
  handler          = "main.lambda_handler"
  filename         = "create_obituary.zip"
  source_code_hash = data.archive_file.create-obituary-30140959-archive.output_base64sha256


  runtime = "python3.9"
  timeout = 20
}


resource "aws_iam_policy" "dynamodb_create_policy" {
  name = "dynamodb-create-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # add permissions for getting parameters by path from SSM
        Action = ["dynamodb:*", "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "ssm:GetParametersByPath", "polly:SynthesizeSpeech"]
        Effect   = "Allow"
        Resource = [aws_dynamodb_table.thelastshow-30143555.arn, "arn:aws:logs:*:*:*", "*", "*"]
      }

    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda_dynamodb_create_policy" {
  role       = aws_iam_role.lambda_create_obituary.name
  policy_arn = aws_iam_policy.dynamodb_create_policy.arn
}


resource "aws_lambda_function_url" "create_obituary_url" {
  function_name      = aws_lambda_function.lambda_create_obituary.function_name
  authorization_type = "NONE"


  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}


output "create_obituary_url" {
  value = aws_lambda_function_url.create_obituary_url.function_url
}


#DynamoDB Table


resource "aws_dynamodb_table" "thelastshow-30143555" {
  name         = "thelastshow-30143555"
  billing_mode = "PROVISIONED"


  # up to 8KB read per second (eventually consistent)
  read_capacity = 1


  # up to 1KB per second
  write_capacity = 1


  # don't need a sort key here
  hash_key  = "id"


  attribute {
    name = "id"
    type = "S"
  }
}
