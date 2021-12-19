const fs = require('fs');

class Manager {
  constructor() {}
}

class ConstantManager extends Manager {
  constructor(datas) {
    super();
    this.gameName = datas.gameName;
  }
}

const getDirection = (x, y) => {
  let res = [];
  if (y !== 10) res.push(0);
  if (x !== 10) res.push(1);
  if (y !== 0) res.push(2);
  if (x !== 0) res.push(3);
  return res;
};

// Deprecated
// class MapManager extends Manager {
//   constructor(datas) {
//     super();
//     this.id = datas.id;
//     this.fields = {};

//     datas.fields.forEach((field) => {
//       this.fields[`${field[0]}_${field[1]}`] = {
//         x: field[0],
//         y: field[1],
//         description: field[2],
//         canGo: field[3],
//         events: field[4],
//       };
//     });
//   }

//   getField(x, y) {
//     return this.fields[`${x}_${y}`];
//   }
// }

class newMapManager extends Manager {
  constructor(datas) {
    super();
    this.fields = [];

    datas.forEach((field) => {
      this.fields[`${field.x},${field.y}`] = {
        x: field.x,
        y: field.y,
        description: field.description,
        canGo: getDirection(field.x, field.y),
        events: field[4],
      };
    });
  }
  getField(x, y) {
    return this.fields[`${x},${y}`];
  }
}

// class EventManager extends Manager {
//   constructor(events) {
//     super();
//     this.events = [];
// 
//     events.forEach((event) =>
//         this.events[`${event.type}, ${event.id}`] = {
//           type: event.type,
//           description: event.description,
//           id: event.id,
//         });
//   }
//   getEvent(type, id) {
//     return this.event[`${type}, ${id}`];
//   }
// };

const constantManager = new ConstantManager(
  JSON.parse(fs.readFileSync(__dirname + '/constants.json'))
);

const mapManager = new newMapManager(
  JSON.parse(fs.readFileSync(__dirname + '/newMap.json'))
);

// const eventManager = new EventManager(
//   JSON.parse(fs.readFileSync(__dirname + '/events.json'))
// );

module.exports = {
  constantManager,
  mapManager,
};
