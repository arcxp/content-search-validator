const express = require("express");
const sanitize = require("sanitize").middleware;
const { searchIndex, createAnalyzerAndData } = require("./utils");

const app = express();
app.use(sanitize);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3000;

const asyncHandler = (fun) => (req, res, next) => {
  Promise.resolve(fun(req, res, next)).catch(next);
};

app.get(
  "/searchHeadlines/:indexName/:query",
  asyncHandler(async (req, res) => {
    const indexName = req.paramString("indexName");
    const query = {
      query: {
        match: {
          "headlines.basic": req.paramString("query"),
        },
      },
    };
    const results = await searchIndex(indexName, query);
    if (results && results?.hits?.hits) {
      res.json(results.hits.hits);
    } else {
      res.status(400).json({ message: "error in request" });
    }
  })
);

app.post(
  "/search/:indexName",
  asyncHandler(async (req, res) => {
    const indexName = req.paramString("indexName");
    const query = req.body;
    const results = await searchIndex(indexName, query);
    if (results && results?.hits?.hits) {
      res.json(results.hits.hits);
    } else {
      res.status(400).json({ message: "error in request" });
    }
  })
);

app.post(
  "/reindex",
  asyncHandler(async (req, res) => {
    await createAnalyzerAndData();
    res.json({ message: "Reindexed" });
  })
);

createAnalyzerAndData().then(() =>
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  })
);
