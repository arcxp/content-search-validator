# language-configuration-poc

A tool to build and test multiple language configurations using opensearch.

This is an opensearch docker container with an express app that allows you to load analyzers, data and search for that data

## What does it do?

- Runs an opensearch docker container on port 9200
- Runs an opensearch admin (kibana) docker container on port 5601
- Load all analyzer configurations in data/analyzer and creates an index using the file name for each analyzer
- Load all content in data/content/{index}
- run all test files TODO
- Runs an express container on port 3000

## Sample data

```
data/
├── analyzer/
│   ├── arabic.json
│   └── french.json
├── content
│   ├── arabic
│   │   └── arabic_content.json
│   └── french
│   │   └── french_content.json
└── test
    TODO
```

## Analyzer format

The analyzer file name `french.json` will be used to create the index `french`.

The structure of the analyzer file (analyzers)[https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analyzer-anatomy.html]

```
{
  "settings": {
    "analysis": {
      "analyzer": {
        "french": {}
      }
    }
  }
}
```

The name of the analyzer is the key of settings.analysis.analyzer. In the above example it will use the native french analyzer.

## How to run it?

It is recommneded to install nvm and use it to manage your node environments. This uses node 18 in docker.

```
$ ./run.sh
```

Making changes to or adding files in data will trigger the container to recreate the analyzers and reload the contents.

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
      "query": "headline"
    }
  }
}
```

TODO - implement analyzer endpoints

`/listIndexes`
`/loadAnalyzer/{indexName}/{analyzerFile.json}`

## opensearch container

You can directly access the opensearch container on port 9200. This requires basic auth admin:admin

```
https://localhost:9200/french/_search
body:
{
  "query": {
    "query_string": {
      "query": "headline"
    }
  }
}
```

## admin container

You can directly access the opensearch admin interface on port 5601 login with admin admin

```
http://localhost:5601/
```
