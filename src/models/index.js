const mongoose = require('mongoose');

const Player = require('./Player');
const Item = require('./Item');

const mongoURL = '';
// 'mongodb+srv://test0:1234@testmongo.r21jj.mongodb.net/coinServer?retryWrites=true&w=majority';
// mongoDB 새로 파야할듯

mongoose.connect(mongoURL);

module.exports = {
  Player,
  Item,
};
