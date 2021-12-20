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

class newMapManager extends Manager {
  constructor(datas) {
    super();
    this.fields = {};

    datas.forEach((field) => {
      this.fields[`${field.x},${field.y}`] = {
        x: field.x,
        y: field.y,
        description: field.description,
        canGo: getDirection(field.x, field.y),
        events: field.events,
      };
    });
  }
  getField(x, y) {
    return this.fields[`${x},${y}`];
  }
}

class EventManager extends Manager {
  constructor(events) {
    super();
    this.events = [];

    events.forEach((event) =>
        this.events[`${event.type}, ${event.id}`] = {
          type: event.type,
          description: event.description,
          id: event.id,
        });
  }
  getEvent(type, id) {
    return this.events[`${type}, ${id}`];
  }
};

// class MonsterManager extends Manager {
//   constructor(monsters) {
//     super();
//     this.monsters = [];

//     monsters.forEach((monster) =>
//         this.monsters[`${monster.id}`] = {
//           id: monster.id,
//           name: monster.name,
//           str: monster.str,
//           def: monster.def,
//           hp: monster.hp,
//         });
//   }
//   getMonster( id) {
//     return this.monsters[`${id}`];
//   }
// };

class ItemManager extends Manager {
  constructor(items) {
    super();
    this.items = [];

    items.forEach((item) =>
        this.items[`${item.id}`] = {
          id: item.id,
          name: item.name,
          str: item.str,
          def: item.def,
        });
  }
  getItem( id ) {
    return this.items[`${id}`];
  }
};

const constantManager = new ConstantManager(
  JSON.parse(fs.readFileSync(__dirname + '/constants.json'))
);

const mapManager = new newMapManager(
  JSON.parse(fs.readFileSync(__dirname + '/newMap.json'))
);

const eventManager = new EventManager(
  JSON.parse(fs.readFileSync(__dirname + '/events.json'))
);

// const monsterManager = new MonsterManager(
//     JSON.parse(fs.readFileSync(__dirname + '/monsters.json'))
// );

const itemManager = new ItemManager(
    JSON.parse(fs.readFileSync(__dirname + '/items.json'))
);

module.exports = {
  constantManager,
  mapManager,
  eventManager,
//   monsterManager,
  itemManager,
};
