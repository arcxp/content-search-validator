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
│   ├── custom.json
│   ├── english.json (native english analyzer)
│   ├── french.json (native french analyzer)
│   └── standard.json (default ArcXP analyzer)
├── config
│   ├── custom_stop_words.txt
│   ├── custom_synonym.txt
├── content
│   ├── arabic
│   │   └── arabic_content.json
│   ├── custom
│   │   └── custom_content.json
│   ├── english
│   │   └── english_content.json
│   └── french
│   │   └── french_content.json
│   └── standard
│   │   └── standard_content.json
└── test
│   ├── arabic.test.js
│   ├── custom.test.js
│   ├── english.test.js
│   ├── french.test.js
│   └── standard.test.js
```

## Analyzer format

The analyzer file name `french.json` will be used to create the index `french` and if the file contains no analyzer object will use the file name to set the analyzer (native french).

The list of supported language analyzers (languages)[(analyzers)[https://opensearch.org/docs/latest/analyzers/language-analyzers/]

### Custom analyzers

Documentation on analyzer configuration (analyzers)[https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis.html]

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

The name of the analyzer is the key of settings.analysis.analyzer. In the above example it will create a new analyzer called `rebuilt_arabic`. This will not use the native arabic analyzer. The index will be called arabic.

The custom analyzer uses external configuration files custom_stop_words.txt and custom_synonym.txt. The files are added to
the opensearch containers /usr/share/opensearch/config/analyzers in docker-compose.yml and the analyzer references the files with `*_path` statements like:

```
"stopword_path": "analyzers/custom_stop_words.txt"
```

### field mappings

When the analyzer is loaded, a set of field mappings (scripts/default_mappings) is added that will map the analyzer to three fields.

- headlines.basic
- subheadlines.basic
- description.basic

## How to run it?

This repo requires you have [docker](https://www.docker.com/products/docker-desktop/) installed and running to work.

It is recommneded to install nvm and use it to manage your node environments. This uses node 18 docker image.

### Install dependencies, only needed once.

```
$ npm install
$ ./run.sh
```

Making changes to or adding any `.json` or `.txt` files in data will trigger the container to reload the analyzers reindex and reload the contents.

open postman, your favorite API tool or curl and access express on port 3000.

To search for text in headlines.basic use a GET request to /searchHeadlines/{index_name}/{search text}

```
http://localhost:3000/searchHeadlines/standard/opensearch
```

To search for content using your own query, use a POST request /search/{index_name} and pass a opensearch query in the body as json. This returns the `hits.hits` array of the opensearch results.

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
}'
```

## tests

run tests locally using

```
$ npm test
```

## opensearch container

You can directly access the opensearch container on port 9200. Note, this is https and has a self signed certificate and needs --insecure or -k. This requires basic auth admin:admin

```
curl \
  -u 'admin:admin' \
  -k \
  -H "Content-Type: application/json" \
  -XPOST https://localhost:9200/french/_search \
  -d '{
  "query": {
      "match_all": {}
  }
}'
```

Opensearch has an `_analyze` endpoint that works with the native analyzers and returns the tokens the analyzer generates for the specified text.

```
curl \
  -u 'admin:admin' \
  -k \
  -H "Content-Type: application/json" \
  -XPOST https://localhost:9200/_analyze \
  -d '{
    "analyzer": "standard",
    "text": "Is this déjà vu?"
}'
```

## admin container

You can directly access the opensearch admin interface on port 5601. login with admin admin

```
http://localhost:5601/
```
