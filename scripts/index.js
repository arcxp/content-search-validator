const express = require("express");
const {
  dowloadFile,
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

app.post("/load/:indexName/:fileName", (req, res) => {
  const indexName = req.params.indexName;
  let newContent = dowloadFile(
    `/data/content/${indexName}`,
    req.params.fileName
  );
  if (newContent) {
    if (!Array.isArray(newContent)) newContent = [newContent];
    newContent.forEach((item) => importDoc(indexName, item));
    res.send(`Loaded ${JSON.stringify(newContent)}`);
  } else {
    res.status(404).send("File not found");
  }
});

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
    createAnalyzerAndData();
    res.send("Reindexed");
  })
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Runs on startup
(async () => {
  createAnalyzerAndData();
})();
