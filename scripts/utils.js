const fs = require("fs");
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

function modifyObjectRecursively(obj, fn) {
  let val;
  for (const key in obj) {
    val = fn.apply(this, [obj, key]);
    if (val) {
      if (typeof val === "object") {
        modifyObjectRecursively(val, fn);
      } else if (Object.prototype.toString.call(val) === "[object Array]") {
        val.forEach(function (entry) {
          modifyObjectRecursively(entry, fn);
        });
      }
    }
  }
}

function add_mapping_to_analyzer(index, analyzer) {
  const config = JSON.parse(JSON.stringify(default_mappings));

  // attempt to get the analyzer name from the object, otherwise use the index (filename)
  let analyzerName;
  try {
    analyzerName = Object.keys(analyzer.settings.analysis.analyzer);
    analyzerName = analyzerName[0];
  } catch (error) {
    analyzerName = index;
  }
  // set the analyer in the field mappings
  modifyObjectRecursively(config, (obj, key) => {
    if (obj[key] === "standard") {
      obj[key] = analyzerName;
    }
    return obj[key];
  });
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
    const filePath = path.join(pathName, fileName);
    const outFile = await fs.promises.readFile(filePath, {
      encoding: "utf-8",
    });
    return JSON.parse(outFile);
  } catch (error) {
    console.error(error);
  }
}

async function createIndex(name, mapping) {
  try {
    const options = {
      ...default_options,
      method: "PUT",
      body: JSON.stringify(mapping),
    };
    await got(`https://opensearch:9200/${name}`, options).catch((error) => {
      console.log(JSON.stringify(error.response.body));
    });
  } catch (error) {
    console.error(error);
  }
}

async function importDoc(index, doc) {
  const { _id } = doc;
  delete doc._id;
  try {
    const options = {
      ...default_options,
      method: "PUT",
      body: JSON.stringify(doc),
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
    console.log(error.response.body);
  });
}

async function delete_index(index) {
  console.log(`🗑️ DELETING OLD ${index} index`);
  await got(`https://opensearch:9200/${index}`, {
    ...default_options,
    method: `DELETE`,
  }).catch((error) => {
    if (error.response.body?.status !== 404) {
      console.log(error.response.body);
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
  const files = await fs.promises.readdir("/data/analyzer");
  await Promise.all(
    files.map(async function (file) {
      const indexName = path.parse(file).name;
      const config = await downloadFile("/data/analyzer", file);
      await loadAnalyzer(indexName, config);
    })
  );
}

async function createData() {
  // load all content files in data/content/index
  // index must match the analyzer configuration name
  const indexes = await fs.promises.readdir("/data/content");
  await Promise.all(
    indexes.map(async function (index) {
      const contentPath = path.join("/data/content", index);
      const files = await fs.promises.readdir(contentPath);
      await Promise.all(
        files.map(async function (file) {
          let newContent = await downloadFile(contentPath, file);
          if (newContent) {
            if (!Array.isArray(newContent)) newContent = [newContent];
            await Promise.all(
              newContent.map(async (item) => importDoc(index, item))
            );
          }
        })
      );
    })
  );
}

async function createAnalyzerAndData() {
  await createAnalyzers();
  await createData();
}

module.exports = {
  downloadFile,
  importDoc,
  searchIndex,
  createAnalyzerAndData,
};
