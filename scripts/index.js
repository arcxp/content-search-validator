const express = require("express");
const fs = require("fs");
const path = require("path");
const {
  dowloadFile,
  importDoc,
  searchIndex,
  loadAnalyzer,
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
  let newContent = dowloadFile("/data/content", req.params.fileName);
  if (newContent) {
    if (!Array.isArray(newContent)) newContent = [newContent];
    newContent.forEach((item) => importDoc(indexName, item));
  }
  res.send(`Loaded ${JSON.stringify(newContent)}`);
});

app.post(
  "/search/:indexName",
  asyncHandler(async (req, res) => {
    const indexName = req.params.indexName;
    const query = req.body;
    const results = await searchIndex(indexName, query);
    if (results && results.hits && results.hits.hits)
      res.send(results.hits.hits);
  })
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// Runs on startup
(async () => {
  // load all analyzer configurations files in data/analyzer
  fs.readdir("/data/analyzer", async function (err, files) {
    files.forEach(async function (file) {
      const indexName = path.parse(file).name;
      const config = dowloadFile("/data/analyzer", file);
      await loadAnalyzer(indexName, config);
    });
  });
  // load all content files in data/content/index/content_to_load.json
  // top level must match the analyzer configuration name
  fs.readdir("/data/content", async function (err, indexes) {
    indexes.forEach(async function (index) {
      const contentPath = path.join("/data/content", index);
      fs.readdir(contentPath, async function (err, files) {
        files.forEach(async function (file) {
          let newContent = dowloadFile(contentPath, file);
          if (newContent) {
            if (!Array.isArray(newContent)) newContent = [newContent];
            newContent.forEach((item) => importDoc(index, item));
          }
        });
      });
    });
  });
})();
