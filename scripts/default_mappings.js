default_mappings = {
  "mappings": {
    "dynamic": false,
    "properties": {
      "headlines": {
        "properties": {
          "basic": {
            "type": "text",
            "boost": 2,
            "fields": {
              "raw": {
                "type": "keyword"
              }
            },
            "analyzer": "standard"
          }
        }
      },
      "subheadlines": {
        "properties": {
          "basic": {
            "type": "text",
            "boost": 2,
            "analyzer": "standard"
          }
        }
      },
      "description": {
        "properties": {
          "basic": {
            "type": "text",
            "analyzer": "standard"
          }
        }
      }
    }
  }
}

module.exports = { default_mappings }
