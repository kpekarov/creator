var hive = require('steem-js-patched');
var fs = require('fs')

var config = JSON.parse(fs.readFileSync('./config.json'))

var money = require('./money.js')
var create = require('./createToken.js')

var price = config.price

hive.api.setOptions({ url: config.rpc });

module.exports = {
  getPayment: function getPayment(){
    console.log('Scanning blockchain...')
  	hive.api.streamTransactions('head', function(err, result) {
  		if (err){
        restart()
        console.log("Error scanning blockchain: "+err)
      } else{
        try {
          let type = result.operations[0][0]
          let data = result.operations[0][1]
          if(type == 'transfer' && data.to == config.account && data.memo == 'account_creation'){
            var amount = data.amount.split(" ")[0]
            var currency = data.amount.split(" ")[1]
            if(amount < price.split(" ")[0] || currency != price.split(" ")[1]){
              money.refund(data.amount, data.from)
            } else {
              var number_of_tokens = Math.floor(amount / price.split(" ")[0])
              create.createToken(number_of_tokens, data.from)
            }
          }
        } catch (err) {
          restart()
          console.log("Error scanning blockchain: "+err)
        }
      }
  	});
    function restart(){
      setTimeout(() => {
        getPayment()
      }, 15000)
    }
  }
}
