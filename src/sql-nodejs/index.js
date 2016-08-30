var parser = require('./sqlparser.js');

console.log(parser.parse('select * from system.tables'));
