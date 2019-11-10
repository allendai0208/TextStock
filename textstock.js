const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
const axios = require('axios');

/**
* An HTTP endpoint that acts as a webhook for Twilio sms.received event
* @param {object} event
* @returns {object} result The result of your workflow steps
*/
module.exports = async (event) => {

  // Prepare workflow object to store API responses

  let result = {};

  console.log(`Running twilio.messages[@0.1.1].create()...`);

  result.step1 = {};

  // helper method for ticker news
  async function getTickerNews(ticker) {
    const getAllNews = async() => {
        try {
          return await axios.get('https://stocknewsapi.com/api/v1?tickers=' + ticker + '&items=5&token=qq391fyosu6x7pcsnkfzbd5ytjgxuz2ibpndsr5p');
        } catch (error) {
          console.error(error);
          return null;
        }
      }
      let news = await getAllNews();
      
      return "This week's top stories on " + ticker + "\n\n" + news.data.data.map(entry => {
  	     return "Title: " + entry.title + "\nLink: " + entry.news_url + "\nSentiment: " + entry.sentiment}).join("\n\n");
  }

  // General Market News
  if (event.Body.toLowerCase().startsWith('general')) {
    const getGeneralNews = async() => {
      try {
        return await axios.get('https://stocknewsapi.com/api/v1/category?section=general&items=5&token=qq391fyosu6x7pcsnkfzbd5ytjgxuz2ibpndsr5p');
      } catch (error) {
      console.error(error);
      }
    }
    let news = await getGeneralNews();
    
    let bodyString = "Today’s Top 5 Stories\n\n" + news.data.data.map(entry => {
	  return "Title: " + entry.title + "\nLink: " + entry.news_url + "\nSentiment: " + entry.sentiment}).join("\n\n");

    result.step1.returnValue = await lib.twilio.messages['@0.1.1'].create({
    from: null,
    to: `${event.From}`,
    body: bodyString,
    mediaUrl: null
  });}
  
  // All Ticker News
  else if (event.Body.toLowerCase().startsWith('ticker')) {
    let words = event.Body.split(" ");
    let bodyString = await getTickerNews(words[1]);
    
    result.step1.returnValue = await lib.twilio.messages['@0.1.1'].create({
    from: null,
    to: `${event.From}`,
    body: bodyString,
    mediaUrl: null
  });}
  
  // Top Mentioned Stocks
  else if (event.Body.toLowerCase().startsWith('stock')) {
    const getAllNews = async() => {
      try {
        return await axios.get('https://stocknewsapi.com/api/v1/top-mention?&date=last7days&token=qq391fyosu6x7pcsnkfzbd5ytjgxuz2ibpndsr5p');
      } catch (error) {
        console.error(error);
      }
    }
    let news = await getAllNews();
    
    let bodyString = 'Company\nTotal\nP | NG | NEU\n\n' + news.data.data.all.map(entry => {
      return entry.name + "(" + entry.ticker + ")" + "\n" + 
        entry.total_mentions + "\n" + 
        entry.positive_mentions +  " | " + entry.negative_mentions + " | " + entry.neutral_mentions;
    }).join('\n\n');
    
    result.step1.returnValue = await lib.twilio.messages['@0.1.1'].create({
    from: null,
    to: `${event.From}`,
    body: bodyString,
    mediaUrl: null
  });}
  
  // If text command is not found
  else {
    let bodyString = "Type in one of these commands:\n(1) General - Obtains the top five general market news stories in the past day\n(2) Ticker [NAME] - Obtains the top five news stories about ticker [NAME]\n(3) Stocks - Obtains the top ten most mentioned tickers from the last week";
    result.step1.returnValue = await lib.twilio.messages['@0.1.1'].create({
    from: null,
    to: `${event.From}`,
    body: bodyString,
    mediaUrl: null
  });}
  
  return result;
};
