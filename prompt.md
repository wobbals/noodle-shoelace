For this project, we want you to build a very simple server that listens on port 8888 and has
a single endpoint: GET /trending​.
When that endpoint is hit, the server should get the latest top headlines from the following
RSS feeds:
* CNN: http://rss.cnn.com/rss/cnn_topstories.rss
* NYTimes: http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
* Fox News: http://feeds.foxnews.com/foxnews/latest
The endpoint should send a response in the following format:
{
  “topics”: [
    “first example”,
    “second”
  ]
}

The “topics”​ array should contain a list of the top 5 trending news topics right now.
This is intentionally a very open ended ask. How you define trending, how you determine
what qualifies, and what “topic” even means is totally up to you. This is also potentially a
never-ending problem, but you shouldn’t spend more than a couple of hours on it scratching
the surface. We’re looking for creative problem solving and well written code, not the most
accurate answer. If you have thoughts about how you would approach it if you had more
time, feel free to share those with us as well.
