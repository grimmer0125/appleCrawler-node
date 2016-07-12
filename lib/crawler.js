'use strict';

// var Nightmare = require('nightmare');
const cheerio = require('cheerio');
const request = require('request');

exports.grabAppleData = function (dataHandler) {
  request({
    method: 'GET',
    url: 'http://www.apple.com/tw/shop/browse/home/specialdeals/mac',
  }, function (err, response, body) {
    if (err) {
      return console.error(err);
    }

    const $ = cheerio.load(body);

    const newMacs = [];

    $('.refurb-list .box-content table').each(function (i, elem) {
      const firstRow = $(this).find('.product');

      const imageColumn = firstRow.find('.image img');
      const imageSrc = imageColumn.attr('src');

      const specsTitleColumn = firstRow.find('.specs h3');
      let specsTitleDesc = specsTitleColumn.text();
      specsTitleDesc = specsTitleDesc.trim();

      const specsURLColumn = firstRow.find('.specs h3 a');
      const specsURL = specsURLColumn.attr('href');
        // console.log('url:', specsURL);
        // console.log('title desc:' + specsTitleDesc+";end;");

      const specsTotalColumn = firstRow.find('.specs');
      const specsTotalDesc = specsTotalColumn.text();
        // console.log('before desc:' + specsTotalDesc +";end;");
      let specsDetailDesc = specsTotalDesc.replace(specsTitleDesc, '');
      specsDetailDesc = specsDetailDesc.trim();
        // console.log('desc detail:'+specsDetailDesc+";end;");

      const purchaseInfoColumn = firstRow.find('.purchase-info .price');
      let price = purchaseInfoColumn.text();
      price = price.trim();

      const mac = { imageURL: imageSrc, specsURL, specsTitle: specsTitleDesc,
        specsDetail: specsDetailDesc, price };

      newMacs.push(mac);
    });

    dataHandler(newMacs);
  });
};
