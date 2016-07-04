let Nightmare = require('nightmare');
let nightmare = Nightmare({
  openDevTools: true,
  // show: true
});

function grabAppleData(){
  nightmare
    .goto('http://www.apple.com/tw/shop/browse/home/specialdeals/mac')
    // .type('form[action*="/search"] [name=p]', 'github nightmare')
    // .click('form[action*="/search"] [type=submit]')
    .wait('.refurb-list')
    .evaluate(function () {


      // should be array of objests
      //
      // objects:
      // 1. title
      // 1.2 link
      // 2. 價錢
      // 3. image
      // 4. desc

      const macs = [];

      let tables = document.querySelectorAll(".refurb-list .box-content table");
      for (const table of tables){
        const firstRow = table.querySelector(".product");

        const imageColumn = firstRow.querySelector(".image img");
        const imageSrc = imageColumn.src;

        const specsTotalColumn = firstRow.querySelector(".specs"); //how to remove title part ?
        const specsTotalDesc = specsTotalColumn.innerText;
        // const specsTitleColumn = firstRow.querySelector(".specs a");
        // const specsTitle = specsTitleColumn .innerText;

        const purchaseInfoColumn = firstRow.querySelector(".purchase-info .price"); //multiple span?
        const price = purchaseInfoColumn.innerText;

        const mac = {imageURL:imageSrc, specs:specsTotalDesc, price};

        macs.push(mac);
        // debugger;
      }


      // debugger;
      return macs;


  //    return "yes";
      // return document.querySelector('#main .searchCenterMiddle li a').href
    })
    // .end()
    .then(function (result) {
      console.log('macs:',result)
    })
    .catch(function (error) {
      console.error('Search failed:', error);
    });
}

grabAppleData();

setInterval(function(){
  console.log('start');

  grabAppleData();

  // var seconds = 10;
  // var waitTill = new Date(new Date().getTime() + seconds * 1000);
  // while(waitTill > new Date())
  // {
  //
  // }

  console.log('end');  //test2後的下一次出現test1超過10s !!!
}, 15 * 10* 1000); //15 min

process.on('SIGINT', function() {
  process.exit();
});




// nightmare
//   .goto('http://yahoo.com')
//   .type('form[action*="/search"] [name=p]', 'github nightmare')
//   .click('form[action*="/search"] [type=submit]')
//   .wait('#main')
//   .evaluate(function () {
//
//
//     return document.querySelector('#main .searchCenterMiddle li a').href
//   })
//   // .end()
//   .then(function (result) {
//     console.log(result)
//   })
//   .catch(function (error) {
//     console.error('Search failed:', error);
//   });
