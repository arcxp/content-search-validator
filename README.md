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
│   └── french_v2.json
├── content
│   ├── arabic
│   │   └── arabic_content.json
│   └── french_v2
│   │   └── french_content.json
└── test
    TODO
```

## How to run it?

It is recommneded to install nvm and use it to manage your node environments.

```
$ ./run.sh
```

Making changes to or adding files in data will trigger the container to recreate the analyzers and reload the contents.

open postman or your favorite API tool and access express on port 3000.

You can add data to opensearch by creating a json file in the data directory. There is already a data/load_fr.json

To view a json file in the data folder use a GET request:

```
http://localhost:3000/display/load_fr.json
```

To load a json file in the data folder use a POST request /load/{index_name}/{file_name}:

```
http://localhost:3000/load/index_fr/load_fr.json
```

To search for content use a POST request /search/{index_name} and pass a opensearch query in the body as json

```
http://localhost:3000/search/index_fr

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
https://localhost:9200/index_fr/_search
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

You can directly access the opensearch admin interface on port 5601

```
http://localhost:5601/
```
