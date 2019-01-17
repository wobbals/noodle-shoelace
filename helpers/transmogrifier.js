/**
 * Step into this chamber, set the appropriate dials, and it turns you into
 * whatever you'd like to be.
 *
 * Keep in mind, Transmogrification is a new technology.
 */

const request = require('request-promise-native');
const xmljs = require('xml-js');
const debug = require('debug')('helper:transmogrifier');
const nlp = require('wink-nlp-utils');

/**
 * Fetches an RSS URL and returns its parsed document
 */
let fetchRSS = async function(url) {
  debug(`fetchRSS: url=${url}`);
  let parsedFeed;
  try {
    let feedXML = await request.get(url);
    parsedFeed = xmljs.xml2js(feedXML, {
      compact: true
    });
  } catch (e) {
    debug(`fetchRSS: error=${e.message}`);
  }
  return parsedFeed;
}

/**
 * Fetches an array of RSS document URLs, and organizes their contents into a
 * normalized Object that can be easily futher processed.
 */
let collectDocuments = async function(rssFeedURLs) {
  debug(`collectDocuments: rssFeedURLs=${JSON.stringify(rssFeedURLs)}`);
  let result = [];
  try {
    for (let feedIndex in rssFeedURLs) {
      let rssObj = await fetchRSS(rssFeedURLs[feedIndex]);
      for (let itemIndex in rssObj.rss.channel.item) {
        let rssItem = rssObj.rss.channel.item[itemIndex];
        let doc = {
          title: rssItem.title._text || rssItem.title._cdata,
          description: rssItem.description._text || rssItem.description._cdata
        };
        debug(`collectDocuments: doc=${JSON.stringify(doc)}`)
        result.push(doc);
      }
    }
  } catch (e) {
    debug(`collectDocuments: error=${e.message}`);
  }
  return result;
}

let tokenizeAndFilter = function(string) {
  let filteredString = nlp.string.removeElisions(string);
  filteredString = nlp.string.lowerCase(filteredString);
  let tokens = nlp.string.tokenize(filteredString, true)
  .filter(token => {
    return token.tag === 'word' && token.value.charAt(0) != '\'';
  })
  .map(token => {
    return token.value;
  });
  return tokens;
}

/**
 * This function based on https://git.io/fhlNg
 * Modified here for arbitrary ngram size
 */
let generateNgrams = function(tokens, n) {
  let ngs = [];
  for (let i = 0; i < tokens.length - n + 1; i++) {
    let ngram = [];

    for (let j = 0; j <= n - 1; j++) {
      ngram.push(tokens[i + j]);
    }
    ngs.push(ngram);
  }
  return ngs;
}


/**
 * Runs through a "document" string for as many ngrams as requested.
 * Example: ngrams = 2 produces individual tokens + bigrams
 *          ngrams = 3 produces individual tokens, bigrams, and trigrams.
 */
let processTokens = function(wordWeights, tokenString, ngrams) {
  let tokens = tokenizeAndFilter(tokenString);
  for (let n = 1; n <= ngrams; n++) {
    let grams = generateNgrams(tokens, n);
    for (let gramIndex = 0; gramIndex < grams.length; gramIndex++) {
      let gram = grams[gramIndex];
      let gramKey = gram.join(' ');
      if (wordWeights[gramKey]) {
        wordWeights[gramKey].occurrences++;
      } else {
        wordWeights[gramKey] = {
          occurrences: 1,
          ngramSize: n,
          key: gramKey,
          gram: gram
        };
      }
    }
  }
}

/**
 * Allows us to play around with different scoring methods.
 * I'm running out of time, so I'm going to wing it here:
 *
 * 1) Descore stop words inverse proportional to ngram size
 * 2) Weigh ngram size proportional to occurance score
 * 3) (added later) punish single-letter topics, apparently not in stop list
 */
let calculateTopicWeight = function(weight) {
  let tokensNoStops = nlp.tokens.removeWords(weight.gram);
  weight.stopWeight = (tokensNoStops.length / weight.ngramSize);
  let score = weight.occurrences * weight.ngramSize * weight.stopWeight;

  // punish single-letter topics until we have a better solution for filtering
  // possessive concatenations (example: "trump's")
  if (weight.key.length <= 1) {
    score = 0;
  }
  return score;
}

/**
 * Checks whether a given topic (gram) could be added to topic list.
 * This is a mutator: if there is a topic collision, the longer topic will
 * be added. Example: "white house" takes precedent over "house"
 * Returns true if the topic list size has changed as a result of this function.
 */
let checkGramEligibility = function(topics, gram) {
  for (let i in topics) {
    let topic = topics[i];
    let longerTopic = topic.length > gram.length ? topic : gram;
    if (topic.indexOf(gram) > 0 || gram.indexOf(topic) > 0) {
      topics.splice(i, 1, longerTopic);
      return false;
    }
  }
  topics.push(gram);
  return true;
}

/**
 * Analyses documents for a number of trends, defined by ntrends
 */
let detectTrends = function(documents, ntrends) {
  debug(`detectTrends: nDocuments=${documents.length}`)
  let topics = [];
  let wordWeights = {};
  let ngramMax = 3;

  for (let i in documents) {
    let doc = documents[i];
    processTokens(wordWeights, doc.title, ngramMax);
    // We could try to add this if there's time to filter out HTML from cdata.
    // processTokens(wordWeights, doc.description, ngramMax);
  }

  for (let i in wordWeights) {
    wordWeights[i].score = calculateTopicWeight(wordWeights[i]);
  }

  let gramsSorted = Object.keys(wordWeights).sort((a, b) => {
    return wordWeights[a].score - wordWeights[b].score;
  });

  while (ntrends > 0 && gramsSorted.length > 0) {
    let gram = gramsSorted.pop();

    if (checkGramEligibility(topics, gram)) {
      ntrends--;
    }
  }

  debug(wordWeights);

  return {
    trends: topics
  };
}

module.exports = {
  collectDocuments,
  detectTrends
}
