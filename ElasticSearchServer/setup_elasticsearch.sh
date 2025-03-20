#!/bin/bash

ES_HOST="http://elasticsearch:9200"
INDEX_NAME="logs"
TEMP_INDEX_NAME="logs_temp"

echo "🚀 Checking if index '$INDEX_NAME' exists..."
if curl -s -o /dev/null -w "%{http_code}" -X GET "$ES_HOST/$INDEX_NAME" | grep -q "200"; then
    echo "✅ Index '$INDEX_NAME' exists. Migrating data..."

    echo "🚀 Creating temporary index '$TEMP_INDEX_NAME' with the correct schema..."
    curl -X PUT "$ES_HOST/$TEMP_INDEX_NAME" -H "Content-Type: application/json" -d '{
      "mappings": {
        "properties": {
          "user_id": { "type": "keyword" },
          "video_id": { "type": "keyword" },
          "video_title": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
          "event": { "type": "keyword" },
          "time_seconds": { "type": "integer" },
          "processed_at": { "type": "date", "format": "epoch_millis" }
        }
      }
    }'

    echo "🔄 Migrating data from '$INDEX_NAME' to '$TEMP_INDEX_NAME'..."
    curl -X POST "$ES_HOST/_reindex" -H "Content-Type: application/json" -d '{
      "source": { "index": "'$INDEX_NAME'" },
      "dest": { "index": "'$TEMP_INDEX_NAME'" }
    }'

    echo "🗑️ Deleting old index '$INDEX_NAME'..."
    curl -X DELETE "$ES_HOST/$INDEX_NAME"

    echo "🔄 Renaming '$TEMP_INDEX_NAME' to '$INDEX_NAME'..."
    curl -X POST "$ES_HOST/_aliases" -H "Content-Type: application/json" -d '{
      "actions": [
        { "add": { "index": "'$TEMP_INDEX_NAME'", "alias": "'$INDEX_NAME'" } }
      ]
    }'

    echo "✅ Migration complete! The new schema is now in use."
else
    echo "❌ Index '$INDEX_NAME' does not exist. Creating it now..."
    curl -X PUT "$ES_HOST/$INDEX_NAME" -H "Content-Type: application/json" -d '{
      "mappings": {
        "properties": {
          "user_id": { "type": "keyword" },
          "video_id": { "type": "keyword" },
          "video_title": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
          "event": { "type": "keyword" },
          "time_seconds": { "type": "integer" },
          "processed_at": { "type": "date", "format": "epoch_millis" }
        }
      }
    }'
    echo "✅ Index '$INDEX_NAME' created with correct schema!"
fi
