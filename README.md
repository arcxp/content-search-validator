# language-configuration-poc

A tool to build and test language configurations using opensearch.

This is an opensearch docker container with an express app that allows you to load analyzers, data and search for that data.

## What does it do?

- Runs an opensearch docker container on port 9200
- Runs an opensearch admin (kibana) docker container on port 5601
- Load all analyzer configurations in data/analyzer and creates an index using the file name for each analyzer
- Load all content in data/content/{index}
- Runs an express container on port 3000

## Sample data

```
data/
├── analyzer/
│   ├── arabic.json (an example of a custom analyzer "rebuilt_arabic")
│   ├── english.json (native english analyzer)
│   ├── french.json (native french analyzer)
│   └── standard.json (default ArcXP analyzer)
├── content
│   ├── arabic
│   │   └── arabic_content.json
│   ├── english
│   │   └── english_content.json
│   └── french
│   │   └── french_content.json
│   └── standard
│   │   └── standard_content.json
└── test
│   ├── arabic.test.js
│   ├── english.test.js
│   ├── french.test.js
│   └── standard.test.js
```

## Analyzer format

The analyzer file name `french.json` will be used to create the index `french` and if the file contains no analyzer object will use the file name to set the analyzer (native french).

The structure of the analyzer file (analyzers)[https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analyzer-anatomy.html]

```
{
  "settings": {
    "analysis": {
      "filter": {
        "arabic_stop": {
          "type":       "stop",
          "stopwords":  "_arabic_"
        },
        "arabic_keywords": {
          "type":       "keyword_marker",
          "keywords":   ["مثال"]
        },
        "arabic_stemmer": {
          "type":       "stemmer",
          "language":   "arabic"
        }
      },
      "analyzer": {
        "rebuilt_arabic": {
          "tokenizer":  "standard",
          "filter": [
            "lowercase",
            "decimal_digit",
            "arabic_stop",
            "arabic_normalization",
            "arabic_keywords",
            "arabic_stemmer"
          ]
        }
      }
    }
  }
}
```

The name of the analyzer is the key of settings.analysis.analyzer. In the above example it will create a new analyzer called `rebuilt_arabic`` that will contain no configurations. This will not use the native french analyzer.

### Custom analyzers

An example custom analyzer uses external configurations custom_stop_words.txt and custom_synonym.txt. The files are added to
opensearch in docker-compose.yml and the analyzer references the files.

## How to run it?

It is recommneded to install nvm and use it to manage your node environments. This uses node 18 docker image.

### Install dependencies, only needed once.

```
$ npm install
$ ./run.sh
```

Making changes to or adding files in data will trigger the container to reload the analyzers reindex and reload the contents.

open postman or your favorite API tool and access express on port 3000.

To view a json file in the data folder use a GET request:

```
http://localhost:3000/display/content/french/french_content.json
```

To load a json file in the data folder use a POST request /load/{index_name}/{file_name}:

```
http://localhost:3000/load/french/french_content.json
```

To search for content use a POST request /search/{index_name} and pass a opensearch query in the body as json

```
http://localhost:3000/search/french

body:
{
  "query": {
    "query_string": {
      "query": "parle"
    }
  }
}
```

## tests

run tests locally using

```
$ npm test
```

## opensearch container

You can directly access the opensearch container on port 9200. This requires basic auth admin:admin

```
curl \
  -H "Content-Type: application/json" \
  -XPOST http://localhost:3000/search/french \
  -d '{
  "query": {
    "query_string": {
      "query": "parle"
    }
  }
}
```

## admin container

You can directly access the opensearch admin interface on port 5601. login with admin admin

```
http://localhost:5601/
```
