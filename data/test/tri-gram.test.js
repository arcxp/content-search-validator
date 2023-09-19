const { searchHeadlines } = require("./search");
const index = "tri-gram";

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

test("french stem parle matches parler", async () => {
  const results = await searchHeadlines(index, "parle");
  expect(results.length).toEqual(1);
});

test("english exact matches", async () => {
  const results = await searchHeadlines(index, "indexes");
  expect(results.length).toEqual(1);
});

test("english stem index matches", async () => {
  const results = await searchHeadlines(index, "index");
  expect(results.length).toEqual(1);
});

test("gram match", async () => {
  const results = await searchHeadlines(index, "sea");
  expect(results.length).toEqual(2);
});

test("partial gram match", async () => {
  const results = await searchHeadlines(index, "searc");
  expect(results.length).toEqual(2);
});

test("typo match", async () => {
  const results = await searchHeadlines(index, "natve");
  expect(results.length).toEqual(1);
});
