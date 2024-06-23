

const http = require('http');
const express = require("express");
const path = require("path");
const socketIo = require('socket.io');
const ejs = require("ejs");
require("dotenv").config();
const routes = require('../routes/routes');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const publicPath = path.join(__dirname, "../public");

app.set("view engine", "ejs");
app.use(express.static(publicPath));
app.use(routes);

const PORT = process.env.PORT;

const users = {};
const sessions = {};

const menu = [
  `1. amala and ewedu`,
  `2. chicken and chips`,
  `3. beans and plantain`,
  `4. yam and egg sauce`,
  `5. pounded yam and egusi soup`,
];

const commands = {
  1: "select 1 to place an order ",
  99: "select 99 to checkout order",
  98: "select 98 to see order history",
  97: "select 97 to see current order",
  0: "select 0 to cancel order ",
};

io.on('connection', (socket) => {
  console.log('a new user has connected!');

  socket.on('session', (sessionId) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        socketId: socket.id,
        currentOrder: [],
        orderHistory: [],
      };
      console.log(`new session created: ${sessionId}`);

      let commandsList = Object.values(commands).join('\n');
      socket.emit('message', `Welcome, what would you like to do:\n${commandsList}`);
    } else {
      sessions[sessionId].socketId = socket.id;
      console.log(`existing user: ${sessionId}`);

      let commandsList = Object.values(commands).join('\n');
      socket.emit('message', `Welcome back, what would you like to do:\n${commandsList}`);
    }
  });

  socket.on('message', (message) => {
    const sessionId = Object.keys(sessions).find(key => sessions[key].socketId === socket.id);
    if (!sessionId) {
      return console.log('session is not found in this socket');
    }

    const userSession = sessions[sessionId];

    switch (message) {
      case '1':
        socket.emit('message', `Items available to order:\n${menu.join('\n')} \n select 99 to checkout order`);
        break;
      case '99':
        if (userSession.currentOrder.length > 0) {
          userSession.orderHistory.push([...userSession.currentOrder]);
          userSession.currentOrder = [];
          socket.emit('message', 'Order successfully placed \n select 1 to order again');
        } else {
          socket.emit('message', 'No order placed, Place one by selecting 1');
        }
        break;
      case '98':
        if (userSession.orderHistory.length > 0) {
          let orderHistory = userSession.orderHistory
            .map((order, index) => `Order ${index + 1}: ${order.join(', ')}`)
            .join('\n');
          socket.emit('message', `Order History:\n${orderHistory}`);
        } else {
          socket.emit('message', 'You have no order history \n select 1 to order');
        }
        break;
      case '97':
        if (userSession.currentOrder.length > 0) {
          socket.emit('message', `Current order- ${userSession.currentOrder.join(', ')}\n press 99 to checkout order \n press 0 to cancel order`);
        } else {
          socket.emit('message', 'You have no current order');
        }
        break;
      case '0':
        if (userSession.currentOrder.length > 0) {
          userSession.currentOrder = [];
          socket.emit('message', 'Your current order has been cancelled. \n select 1 to order again');
        } else {
          socket.emit('message', 'You have no order to cancel. \n select 1 to order');
        }
        break;
      default:
        const menuOrder = parseInt(message, 10) - 1;
        if (menuOrder >= 0 && menuOrder < menu.length) {
          userSession.currentOrder.push(menu[menuOrder].substring(3));
          socket.emit('message', `${menu[menuOrder].substring(3)} has been added to your order. \n select 97 to view your order`);
        } else {
          socket.emit('message', 'Invalid option, please choose a valid option');
        }
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
