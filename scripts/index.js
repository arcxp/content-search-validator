const express = require("express");
const {
  downloadFile,
  importDoc,
  searchIndex,
  createAnalyzerAndData,
} = require("./utils");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 3000;

const asyncHandler = (fun) => (req, res, next) => {
  Promise.resolve(fun(req, res, next)).catch(next);
};

app.use("/display", express.static("/data"));

app.post(
  "/load/:indexName/:fileName",
  asyncHandler(async (req, res) => {
    const indexName = req.params.indexName;
    let newContent = await downloadFile(
      `/data/content/${indexName}`,
      req.params.fileName
    );
    if (newContent) {
      console.log(`content - ${JSON.stringify(newContent)}`);
      if (!Array.isArray(newContent)) newContent = [newContent];
      await Promise.all(
        newContent.map(async function (item) {
          importDoc(indexName, item);
        })
      );
      res.send(`Loaded ${JSON.stringify(newContent)}`);
    } else {
      res.status(404).send("File not found");
    }
  })
);

app.get(
  "/searchHeadlines/:indexName/:query",
  asyncHandler(async (req, res) => {
    const indexName = req.params.indexName;
    const query = {
      query: {
        match: {
          "headlines.basic": req.params.query,
        },
      },
    };
    const results = await searchIndex(indexName, query);
    if (results && results.hits && results.hits.hits) {
      res.send(results.hits.hits);
    } else {
      res.status(400).send(results);
    }
  })
);

app.post(
  "/search/:indexName",
  asyncHandler(async (req, res) => {
    const indexName = req.params.indexName;
    const query = req.body;
    const results = await searchIndex(indexName, query);
    if (results && results.hits && results.hits.hits) {
      res.send(results.hits.hits);
    } else {
      res.status(400).send(results);
    }
  })
);

app.post(
  "/reindex",
  asyncHandler(async (req, res) => {
    await createAnalyzerAndData();
    res.send("Reindexed");
  })
);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// Runs on startup
(async () => {
  await createAnalyzerAndData();
})();
