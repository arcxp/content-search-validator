const fs = require("fs/promises");
const got = require("got");
const path = require("path");

const { default_mappings } = require("./default_mappings");

const default_options = {
  headers: { "Content-Type": "application/json" },
  https: { rejectUnauthorized: false },
  responseType: "json",
  username: "admin",
  password: "admin",
};

function add_mapping_to_analyzer(index, analyzer) {
  // attempt to get the analyzer name from the object, otherwise use the index (filename)
  const analyzerName = Object.keys(
    analyzer?.settings?.analysis?.analyzer ?? { [index]: index }
  ).shift();

  // set the analyer in the field mappings
  const config = JSON.parse(
    JSON.stringify(default_mappings).replace(/standard/g, analyzerName)
  );

  analyzer.mappings = config.mappings;
  analyzer.settings = {
    ...analyzer.settings,
    ...{
      "index.mapping.ignore_malformed": false,
      "index.mapping.total_fields.limit": 2000,
    },
  };
  return analyzer;
}

async function downloadFile(pathName, fileName) {
  try {
    const outFile = await fs.readFile(path.join(pathName, fileName), {
      encoding: "utf-8",
    });
    return JSON.parse(outFile);
  } catch (error) {
    console.error(error);
  }
}

async function createIndex(name, mapping) {
  const options = {
    ...default_options,
    method: "PUT",
    body: JSON.stringify(mapping),
  };
  await got(`https://opensearch:9200/${name}`, options).catch((error) => {
    console.log(JSON.stringify(error?.response?.body));
  });
}

async function importDoc(index, doc) {
  const { _id, ...cleanDoc } = doc;
  try {
    const options = {
      ...default_options,
      method: "PUT",
      body: JSON.stringify(cleanDoc),
    };
    const results = await got(
      `https://opensearch:9200/${index}/_doc/${_id}`,
      options
    );
    console.log(`📔 IMPORTING DOCUMENT ${_id} to ${index}`);
    return results;
  } catch (error) {
    console.error(error);
  }
}

async function searchIndex(index, query) {
  try {
    const options = {
      ...default_options,
      method: "POST",
      body: JSON.stringify(query),
    };
    const results = await got(
      `https://opensearch:9200/${index}/_search`,
      options
    ).json();
    console.log(`results - ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    console.error(`error - ${JSON.stringify(error)}`);
    return error;
  }
}

async function refresh() {
  await got(`https://opensearch:9200/_refresh`, {
    ...default_options,
    method: `POST`,
  }).catch((error) => {
    console.log(error?.response?.body);
  });
}

async function delete_index(index) {
  console.log(`🗑️ DELETING OLD ${index} index`);
  await got(`https://opensearch:9200/${index}`, {
    ...default_options,
    method: `DELETE`,
  }).catch((error) => {
    if (error.response.body?.status !== 404) {
      console.log(error?.response?.body);
    }
  });
}

async function loadAnalyzer(index, analyzer) {
  const arcAnalyzer = add_mapping_to_analyzer(index, analyzer);
  await delete_index(index);
  await refresh();

  console.log(`📦 CREATING NEW ${index} index`);
  await createIndex(index, arcAnalyzer);
}

async function createAnalyzers() {
  // load all analyzer configurations files in data/analyzer
  const files = await fs.readdir("/data/analyzer");
  await Promise.all(
    files.map(async function (file) {
      try {
        const indexName = path.parse(file).name;
        const config = await downloadFile("/data/analyzer", file);
        await loadAnalyzer(indexName, config);
      } catch (error) {
        console.error(error);
      }
    })
  );
}

async function createData() {
  // load all content files in data/content/index
  // index must match the analyzer configuration name
  const indexes = await fs.readdir("/data/content");
  await Promise.all(
    indexes.map(async function (index) {
      try {
        const contentPath = path.join("/data/content", index);
        const files = await fs.readdir(contentPath);
        await Promise.all(
          files.map(async function (file) {
            let newContent = await downloadFile(contentPath, file);
            if (newContent) {
              if (!Array.isArray(newContent)) newContent = [newContent];
              await Promise.all(
                newContent.map((item) => importDoc(index, item))
              );
            }
          })
        );
      } catch (error) {
        console.error(error);
      }
    })
  );
}

async function createAnalyzerAndData() {
  await createAnalyzers();
  await createData();
}

module.exports = {
  searchIndex,
  createAnalyzerAndData,
};
