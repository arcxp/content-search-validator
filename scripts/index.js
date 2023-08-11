const express = require("express");
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
  let file = dowloadFile(req.params.fileName);
  if (file) {
    if (!Array.isArray(file)) file = [file];
    file.forEach((item) => importDoc(indexName, item));
  }
  res.send(`Loaded ${JSON.stringify(file)}`);
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

// Create index_fr and index_es so there is something to work with
// TODO - Ability to load a new configuration
(async () => {
  await loadAnalyzer("index_name_goes_here", "analyzer_object_here");
})();
