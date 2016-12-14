// [START app]

var serverAddress = "http://localhost:8080/";
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require("request");
var cheerio = require('cheerio');
var htmlToText = require('html-to-text');
var sw = require('stopword');

var termDictionary = {};
var maxTFIDFScore = 0;
var documents = [];

var path = require('path')

var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/images", express.static(__dirname + "/images"));


function initTermDictionary(tokenizedSearchQuery)
{
  termDictionary = {};
  if(tokenizedSearchQuery)
  {
    for(var i = 0; i < tokenizedSearchQuery.length; i++)
    {    
      var term = tokenizedSearchQuery[i].toLowerCase();
      if(!termDictionary[term])
      {
        termDictionary[term] = {
          df: 0
        } 
      } 
      else termDictionary[term].tf++;
    }
  }
}

// Not used atm, doing parsing on client side
function parseSearchQuery(query){
  return query.map(term => {
    return term.toLowerCase().replace(/\W+/, '');
  }).filter(term => term !== '');
}

function calculateTFIDFScore()
{ 
  maxTFIDFScore = 0;
  var tfidfScores = [];
  documents.forEach(function(document, index){
    var totalScore = 0; 
    for(term in document)
    {
      var idf = Math.log(documents.length / termDictionary[term].df);
      if(idf == 0) idf = 1;      
      var score = document[term].tf * idf;
      totalScore += score;
    };
    if(totalScore > maxTFIDFScore) maxTFIDFScore = totalScore;
    tfidfScores[index] = totalScore;
  }); 
  return tfidfScores;
}

function addDocument(body, documentIndex)
{
  var $ = cheerio.load(body);
  var document = htmlToText.fromString($('body'), { ignoreHref: true, ignoreImage:true });
  
  var tokens = document.split(/\W+/);
  termFrequencyCounter(tokens, documentIndex);
}

function termFrequencyCounter(tokenizedDocument, documentIndex)
{
  if(tokenizedDocument)
  {
    var termsFoundInDocument = {};
    for(var i = 0; i < tokenizedDocument.length; i++)
    {    
      var word = tokenizedDocument[i].toLowerCase();
      if(termDictionary[word])
      {
        if(!termsFoundInDocument[word])
        {
          termsFoundInDocument[word] = {
            tf: 1
          };
          termDictionary[word].df++;
        } 
        else termsFoundInDocument[word].tf++;
      } 
    }
    console.log(termsFoundInDocument);
    documents[documentIndex] = termsFoundInDocument;
  }
}

io.on("connection", function(socket)
{
  socket.on("google_result_links", function(data){
    var pageURLs = data.resultPageURLs;
    var searchQuery = data.searchQuery;
    initTermDictionary(searchQuery);

    console.log(searchQuery);
    if(pageURLs.length > 1)
    {
      var getRequestPromises = [];
      var phantomWorkerPromises = [];
      var indexMap = [];
      pageURLs.forEach(function(pageURL, index) 
      {
        getRequestPromises.push(new Promise((resolve, reject) => {
          request({
              method: 'GET',
              url: pageURL,
              },
              (error, response, body) => {
                if(error) {
                  console.log(error)
                  return reject(error);
                }
                else
                {
                  indexMap.push({index:index, url:pageURL}); 
                  addDocument(body, index);
                  return resolve();
                }
              });
        }));
      });

      console.log("finished");
      Promise.all(getRequestPromises).then(()=>
      {
          return calculateTFIDFScore();;
      }).then( scores =>{
        pageURLs.forEach((pageURL, index)=> 
        {
          phantomWorker(index, pageURL, searchQuery, (phantomData) =>
          {
            phantomData.tfidfScore = { 
              score: scores[index],
              maxScore: maxTFIDFScore
            };
            socket.emit("image_loaded", phantomData);
          });
        })
      }).catch(function(err) {
          console.log(err.message);
      });

      
    }
  });
});


function phantomWorker(index, pageURL, searchQuery, callback)
{
  var resultPagePath = "images/page" + index;
  var childArgs = [
    path.join(__dirname, 'phantomjs-script.js'),
    pageURL,
    resultPagePath,
    searchQuery[0]
  ];

  var worker = require('child_process');
  worker.execFile(binPath, childArgs, function(err, stdout, stderr){
    //console.log(stdout);
    var resource = {ImgUrl: (serverAddress+resultPagePath)};
    console.log("finished : " + resource.ImgUrl);
    callback({ImgUrl: serverAddress+resultPagePath, pageIndex:index});
  });
}

// for socket connections
server.listen(3000);


// Serving the static images
var server = app.listen(process.env.PORT || '8080', function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});



 /* =================== Unused functions =================== */
 /*
function chunkSubStr(str, size)
{
  var numChunks = Math.ceil(str.length / size),
      chunks = new Array(numChunks);
      
  for(var i = 0, o = 0; i < numChunks; ++i, o += size)
  {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

function stopAndStem(rawText)
{
    return sw.removeStopwords(rawText.split(' '));
}



function tokenize(text) {
  if (text === null) { return []; }
  if (text.length === 0) { return []; }
  return text.toLowerCase().replace(
      /[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-’]/g
    , ''
  ).split(' ').filter(term => term !== ' ');
};

function makeDictionary(tokenizedDocuments)
{
  return tokenizedDocuments.reduce((accumulator, currentTokenizedDocument) => 
  {
    return accumulator.concat(currentTokenizedDocument);
  }, []
  ).reduce((accumulator, token) =>
  { 
    if(accumulator.indexOf(token) === -1)
    {
      accumulator.push(token);
    }
    return accumulator; 
  }, []).sort();
}


function onFinished(searchTerms)
{
  textOfPages.forEach((page, index)=>
  {
    tfidf.addDocument(page);
  });
  tfidf.tfidfs(searchTerms, function(i, measure) {
    console.log('document #' + i + ' is ' + measure);
  });
}

*/

// [END app]