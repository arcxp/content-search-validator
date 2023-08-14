const fs = require("fs");
const got = require("got");
const path = require("path");
const esx = require("/app/search-esX.js");
const mapping = require("/app/elasticsearch_mappings/elasticsearch_mapping.js");

const default_options = {
  headers: { "Content-Type": "application/json" },
  https: { rejectUnauthorized: false },
  responseType: "json",
  username: "admin",
  password: "admin",
};

function change_language(config, lang) {
  esx.modifyObjectRecursively(config, (obj, key) => {
    if (obj[key] === "kuromoji") {
      obj[key] = lang;
    }
    return obj[key];
  });
}

function dowloadFile(pathName, fileName) {
  try {
    const filePath = path.join(pathName, fileName);
    const outFile = fs.readFileSync(filePath, {
      encoding: "utf-8",
    });
    return JSON.parse(outFile);
  } catch (error) {
    console.error(error);
    return {};
  }
}

async function createIndex(name, mapping) {
  try {
    const options = {
      ...default_options,
      method: "PUT",
      body: JSON.stringify(mapping),
    };
    await got(`https://opensearch:9200/${name}`, options);
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
    console.log(`📔 IMPORTING DOCUMENT ${_id}`);
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
    console.log(`options - ${JSON.stringify(options)}`);
    const results = await got(
      `https://opensearch:9200/${index}/_search`,
      options
    ).json();
    console.log(`results - ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    console.error(error);
  }
}

async function refresh() {
  await got(`https://opensearch:9200/_refresh`, {
    ...default_options,
    method: `POST`,
  });
}

async function loadAnalyzer(index, analyzer) {
  // TODO - update to create a new configuration
  try {
    const config_src = mapping.v2["7.1"]["japanese"];
    mapping.remove_all_field_es7(config_src);

    const config = JSON.parse(JSON.stringify(config_src));
    const tokenizer = Object.entries(analyzer.settings.analysis.analyzer).map(
      (i) => {
        const [key, obj] = i;
        return obj.tokenizer;
      }
    );
    change_language(config, tokenizer[0]);
    analyzer.mappings = config.mappings;
    analyzer.settings["index.mapping.ignore_malformed"] = false;
    analyzer.settings["index.mapping.total_fields.limit"] = 2000;

    try {
      console.log(`🗑️ DELETING OLD ${index}`);
      await got(`https://opensearch:9200/${index}`, {
        ...default_options,
        method: `DELETE`,
      });
      await refresh();
    } catch (err) {
      // console.log(err);
    }

    console.log(`📦 CREATING NEW ${index}`);
    console.log(`${index} - ${JSON.stringify(analyzer)}`);
    await createIndex(index, analyzer);
  } catch (err) {
    console.log(err);
  }
}

module.exports = { dowloadFile, importDoc, searchIndex, loadAnalyzer };
