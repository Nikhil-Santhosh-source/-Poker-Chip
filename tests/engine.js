// Loads the rules engine straight out of ../index.html (between the
// ENGINE START / ENGINE END markers), so tests always run the shipped code.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\* ENGINE START[\s\S]*?\*\/([\s\S]*?)\/\* ENGINE END \*\//);
if (!m) throw new Error('Engine markers not found in index.html');
const names = ['RANKS','evaluate7','compareScores','handLabel','newTable','addPlayer','startHand','applyAction',
  'advanceAfterAction','readyForNextHand','rebuy','isBetting','START_CHIPS'];
module.exports = new Function(m[1] + '\nreturn {' + names.join(',') + '};')();
