const got = require("got");

const default_options = {
  headers: { "Content-Type": "application/json" },
  https: { rejectUnauthorized: false },
  responseType: "json",
  username: "admin",
  password: "admin",
};

async function searchIndex(index, query) {
  try {
    const options = {
      ...default_options,
      method: "POST",
      body: JSON.stringify(query),
    };
    const results = await got(
      `https://localhost:9200/${index}/_search`,
      options
    ).json();
    console.log(`results - ${JSON.stringify(results)}`);
    return results;
  } catch (error) {
    console.error(`error - ${JSON.stringify(error)}`);
    return error;
  }
}

async function searchHeadlines(index, word) {
  const query = {
    query: {
      query_string: {
        query: word,
      },
    },
  };
  const results = await searchIndex(index, query);
  if (results?.hits?.hits) return results.hits.hits;
}

module.exports = {
  searchIndex,
  searchHeadlines,
};
