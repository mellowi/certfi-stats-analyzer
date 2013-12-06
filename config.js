module.exports = {
  url: "http://pilvilinna.cert.fi/opendata/autoreporter/json.zip",
  tmpDir: "data",
  tmpOutputDir: "public/output",
  tmpOutputCategory: "category.txt",
  tmpOutputLocation: "location.txt",
  tmpOutputDate: "date.txt",
  cache: {
    host: "localhost",
    port: 6379,
    key: {
      category: "certfi:category",
      location: "certfi:location",
      date: "certfi:date",
    }
  }
}
