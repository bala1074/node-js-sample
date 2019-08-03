var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

var mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
//testing connectivity
mongoose.connection.once('connected', function () {
  console.log("Database connected successfully")
});
var dbUrl = 'mongodb+srv://bala:Code@123@cluster0-xuyp8.mongodb.net/simple-chat?retryWrites=true&w=majority'


mongoose.connect(dbUrl, { useNewUrlParser: true });

var Message = mongoose.model('Message', {
  name: String,
  message: String
})


app.get('/', function (request, response) {
  response.send('Hello World 2.0!')
})

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  })
})


app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  })
})


app.post('/messages', async (req, res) => {
  try {
    var message = new Message(req.body);

    var savedMessage = await message.save()
    console.log('saved');

    var censored = await Message.findOne({ message: 'badword' });
    if (censored)
      await Message.remove({ _id: censored.id })
    else
      io.emit('message', req.body);
    res.sendStatus(200);
  }
  catch (error) {
    res.sendStatus(500);
    return console.log('error', error);
  }
  finally {
    console.log('Message Posted')
  }
})


// Players
var Player = mongoose.model('Player', {
  name: String,
  email: String,
  id: String,
  name: String,
  status: String
})

const possibleStatus = ['0', '1', '2'];
// Get all players, or get players belongs to 0, 1 or 2 status
app.get('/players', (req, res) => {
  console.log('GET /players');
  let status = req.query.status
  console.log('status', status);
  let filter = {};
  if (possibleStatus.includes(status)) {
    filter['status'] = status;
  }
  Player.find(filter, (err, players) => {
    res.send(players);
  });
})

//chage status of player by email
app.post('/players', (req, res) => {
  console.log('POST /players');
  let { email, status } = req.body;
  console.log('email', email);
  console.log('status', status);
  if (possibleStatus.includes(status)) {
    Player.findOneAndUpdate({ email }, { status }, function (err, player) {
      res.send(player);
    });
  } else {
    res.send("Invalid Status");
  }
})





io.on('connection', () => {
  console.log('a user is connected')
})
app.listen(app.get('port'), function () {
  console.log("Node app is running at localhost:" + app.get('port'))
})

