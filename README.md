# Development notes for review

Style patterns might be a little odd, hopefully nothing too egregious. I haven't
maintained a ton of JS in a context where lint or checkstyle-like tools were in
place.

I used the scaffolding generator provided by Express CLI, but then realized
that this probably made much more cruft than was needed for the assignment
task. Cleaned up as much of it as possible, but the file layout for `bin/www`
and `app.js` feels a bit odd to me.

Pretty much all the heavy lifting in the app is in `helpers/transmogrifier.js`.

## On topic detection

This prompt reminds me how much fun text search and retrieval was as an
undergraduate class.

I tried my best to reuse some of the methods from that class lingering in the
back of my head, but we're drawing on cobwebs that are over a decade old.
My approach here is mostly guided by intuition, and an awareness of the
amount of time I want to put in to this.

Before writing anything, the approach I have in mind consists of:

* [p1] Build a word-cloud-like data structure that can tally unique word counts
  to all the input feeds.
* [p1] Need to filter out stop words in the word/ngram counts; hoping there's a
  module sitting on GitHub that I can borrow.
* [p2] If there's not too much data pressure above, it might be worth tallying
  n-grams for maybe `n=[1,3]`. Example: `El Chapo` is a more compelling topic
  token than `Chapo`. Higher `n` should take precedence over lower `n`,
  especially across multiple input feeds.
* [p2] The weight of a "trending" topic seems like it should probably be higher
  if topic incidence is tallied from multiple feeds. Example: All feeds with
  nonzero counts of the word "shutdown" should weigh more than a single feed
  with a high count.
* [p3] A stemmer would be useful ("America" and "American" should be the same
  topic), but this feels like a rabbit hole.


Glancing through the raw feeds, I see a few features in the input data:

* The Fox news feed is quite short compared to the Times, and a quick glance
  shows very little overlap in the titles of articles between each feed.
* NYT feed already has categories built in to the XML document itself. CNN and
  Fox do not include this, but it still might be interesting to use as a seed
  for feature detection if other approaches fall short.
* Quite a lot of variance in XML tag use between different feeds.
  There are common tags and some seemingly proprietary ones. Keep this in mind
  when writing handlers to interact with the XML parser.
* The two main input points that seem good for feature detection are
  `/item/title` and `/item/description`. Having never read the RSS spec,
  I would bet that these two are some of the few required RSS document tags :-)



# Running the project

Assuming a node and npm installation, the project should be straightforward:

```sh
npm i && npm start

# To enable debug logging:
DEBUG=* node bin/www

```

Test a running server (with default configuration):
```sh
curl -v http://localhost:8888/trending | python -m json.tool

#Skip the pipe if you don't have python installed
curl -v http://localhost:8888/trending

```

