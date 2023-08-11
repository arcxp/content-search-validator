const fs = require("fs");
const got = require("got");
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

function dowloadFile(fileName) {
  try {
    const outFile = fs.readFileSync(`/data/${fileName}`, { encoding: "utf-8" });
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

    const config_fr = JSON.parse(JSON.stringify(config_src));
    const config_es = JSON.parse(JSON.stringify(config_src));
    change_language(config_fr, "french");
    change_language(config_es, "spanish");

    try {
      console.log(`🗑️ DELETING OLD INDICES`);
      await got(`https://opensearch:9200/index_fr`, {
        ...default_options,
        method: `DELETE`,
      });
      await got(`https://opensearch:9200/index_es`, {
        ...default_options,
        method: `DELETE`,
      });
      await refresh();
    } catch (err) {
      // console.log(err);
    }

    console.log(`📦 CREATING NEW INDEXES`);
    await createIndex("index_fr", config_fr);
    await createIndex("index_es", config_es);
  } catch (err) {
    console.log(err);
  }
}

module.exports = { dowloadFile, importDoc, searchIndex, loadAnalyzer };
