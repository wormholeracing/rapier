'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var ITEMID = 0;
var PORT = 3001;
var HOST = 'localhost';
var BASE_PREFIX = 'http://' + HOST + ':' + PORT
var TODOS_URL =  BASE_PREFIX + '/to-dos';
var TODOS = {
  self: BASE_PREFIX + '/to-dos',
  type: 'TodoList',
  items: BASE_PREFIX + '/to-dos/items'
}
var ITEMS = {
  self: BASE_PREFIX + '/to-dos/items',
  type: 'Collection',
  items: [],
  item_type: 'Item'
}

app.use(bodyParser.json()); // for parsing application/json

app.get('/to-dos', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    res.set('Content-Type', 'application/json');
    res.set('Content-Location', TODOS.self);
    res.json(TODOS);
  } else {
    res.status(406).send('Unrecognized accept header media type: ' + accept_type)
  }
});

app.get('/to-dos/items', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    res.set('Content-Type', 'application/json');
    res.set('Content-Location', ITEMS.self);
    res.json(ITEMS);
  } else {
    res.status(406).send('Unrecognized accept header media type: ' + accept_type)
  }
});

app.get('/items;:itemid', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    var itemid = req.params.itemid;
    var items = ITEMS.items;
    var item = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id == itemid) {
        item = items[i];
        break;
      }
    }
    if (item !== null) {
      res.set('Content-Type', 'application/json');
      res.set('Content-Location', item.self);
      res.status(200);
      res.json(item);
    } else {
      res.status(404).send('Not Found')
    }
  } else {
    res.status(406).send('Unrecognized accept header media type: ' + accept_type)
  }
});

app.patch('/items;:itemid', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    var content_type = req.get('Content-Type');
    if (typeof content_type == 'undefined' || content_type === 'application/json') {
      var itemid = req.params.itemid;
      var items = ITEMS.items;
      var item = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == itemid) {
          item = items[i];
          break;
        }
      }
      if (item !== null) {
        var changes = req.body;
        var error = null;
        for (var property in changes) {
          if (['type', 'self', 'id', 'etag'].indexOf(property) > -1) {
            res.status(400).send({'text': 'Cannot set property '+ property})
            error = 400
          }
        }
        if (error == null) {
          for (var property in changes) {
            item[property] = changes[property]            
          }
          item.etag++
          res.set('Content-Type', 'application/json');
          res.set('Content-Location', item.self);
          res.set('ETag', item.etag);
          res.status(200);
          res.json(item);
        }
      } else {
        res.status(404).send('Not Found')
      }
    } else {
      res.status(406).send({text: 'Unrecognized Content-Type header media type: ' + content_type})
    }
  } else {
    res.status(406).send('Unrecognized Accept header media type: ' + accept_type)
  }
});

app.delete('/items;:itemid', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    var content_type = req.get('Content-Type');
    if (typeof content_type == 'undefined' || content_type === 'application/json') {
      var itemid = req.params.itemid;
      var items = ITEMS.items;
      var item = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == itemid) {
          item = items.splice(i,1)[0]
          break;
        }
      }
      if (item !== null) {
        res.set('Content-Type', 'application/json');
        res.set('Content-Location', item.self);
        res.set('ETag', item.etag);
        res.status(200);
        res.json(item);
      } else {
        res.status(404).send('Not Found')
      }
    } else {
      res.status(406).send({text: 'Unrecognized Content-Type header media type: ' + content_type})
    }
  } else {
    res.status(406).send('Unrecognized Accept header media type: ' + accept_type)
  }
});

app.post('/to-dos/items', function(req, res) {
  var accept_type = req.get('Accept');
  if (typeof accept_type == 'undefined' || accept_type === '*/*'|| accept_type === 'application/json') {
    var content_type = req.get('Content-Type');
    if (typeof content_type == 'undefined' || content_type === 'application/json') {
      var item = req.body;
      if ('type' in item) {
        var itemid = ITEMID++;
        item.self = BASE_PREFIX + '/items/' + itemid.toString();
        item.id = itemid.toString();
        item.etag = 0;
        ITEMS.items.push(item);
        res.set('ETag', item.etag);
        res.set('Location', item.self);
        res.status(201).json(item)
      } else {
        res.status(400).send({text: 'No type set for Item'})
        }
    } else {
      res.status(406).send({text: 'Unrecognized Content-Type header media type: ' + content_type})
    }
  } else {
    res.status(406).send('Unrecognized Accept header media type: ' + accept_type)
  }
});

console.log('Listening on %d', PORT);
app.listen(PORT);
