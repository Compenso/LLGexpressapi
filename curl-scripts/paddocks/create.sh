#!/bin/bash

API="http://localhost:4741"
URL_PATH="/paddocks"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "paddock": {
      "title": "'"${TITLE}"'"
    }
  }'

echo
