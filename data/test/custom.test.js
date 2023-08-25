const { searchHeadlines } = require("./search");
const index = "custom";

test("standard index contains 3 items", async () => {
  const results = await searchHeadlines(index, "*");
  expect(results.length).toEqual(3);
});

test("exact match", async () => {
  const results = await searchHeadlines(index, "Opensearch");
  expect(results.length).toEqual(2);
});

test("lowercase matches", async () => {
  const results = await searchHeadlines(index, "opensearch");
  expect(results.length).toEqual(2);
});

test("french exact matches parler", async () => {
  const results = await searchHeadlines(index, "parler");
  expect(results.length).toEqual(1);
});

test("french stem parle doesnt matches parler", async () => {
  const results = await searchHeadlines(index, "parle");
  expect(results.length).toEqual(0);
});

test("english exact matches", async () => {
  const results = await searchHeadlines(index, "indexes");
  expect(results.length).toEqual(1);
});

test("english stem index doesn't match", async () => {
  const results = await searchHeadlines(index, "index");
  expect(results.length).toEqual(0);
});

test("arabic exact match", async () => {
  const results = await searchHeadlines(index, "التحدث");
  expect(results.length).toEqual(1);
});

test("synonym elastic search matches opensearch", async () => {
  const results = await searchHeadlines(index, "elastic search");
  expect(results.length).toEqual(2);
});

test("search for stop word in custom_stop_words.txt ", async () => {
  const results = await searchHeadlines(index, "in");
  expect(results.length).toEqual(0);
});

test("search for stop word not in custom_stop_words.txt ", async () => {
  const results = await searchHeadlines(index, "to");
  expect(results.length).toEqual(1);
});
