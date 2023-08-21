const { searchHeadlines } = require("./search");
const index = "english";

test("english index contains 3 items", async () => {
  const results = await searchHeadlines(index, "*");
  expect(results.length).toEqual(3);
});

test("exact match", async () => {
  const results = await searchHeadlines(index, "Opensearch");
  expect(results.length).toEqual(2);
});

test("lowercase match", async () => {
  const results = await searchHeadlines(index, "opensearch");
  expect(results.length).toEqual(2);
});

test("french stem parle doesnt matches parler", async () => {
  const results = await searchHeadlines(index, "parle");
  expect(results.length).toEqual(0);
});

test("english stem index matches", async () => {
  const results = await searchHeadlines(index, "index");
  expect(results.length).toEqual(1);
});

test("arabic exact match", async () => {
  const results = await searchHeadlines(index, "التحدث");
  expect(results.length).toEqual(1);
});
