
var Netlogger = require("./netlogger");

module.exports = Netlogger;


if ( require.main == module ) {
    var netlogger = new Netlogger(process.argv[2]);
    netlogger.on('new-system', (name, x, y, z) => console.log(`New system entered: '{name}' ({x}, {y}, {z})`));
    netlogger.on('docked', () => console.log("Docked at station!"));
    netlogger.on('undocked', () => console.log("Undocked from station!"));
}