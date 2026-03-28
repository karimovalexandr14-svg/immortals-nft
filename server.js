/**
 * Бэкенд для общего маркета / трейдов (Socket.io).
 * Деплой: Jamsocket, Render, Fly.io, Railway и т.д. (не Netlify static).
 */
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

let marketListings = [];
let players = {};
let activeTrades = {};

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'immortals-socket' });
});

io.on('connection', (socket) => {
  socket.on('playerJoin', (userData) => {
    players[socket.id] = {
      nickname: userData.nickname,
      avatar: userData.avatar,
      socketId: socket.id
    };
    io.emit('onlinePlayersUpdate', Object.values(players));
    socket.emit('initMarket', marketListings);
  });

  socket.on('getOnlinePlayers', () => {
    socket.emit('onlinePlayersUpdate', Object.values(players));
  });

  socket.on('tradeRequest', (data) => {
    io.to(data.to).emit('tradeRequest', { fromId: socket.id, fromName: data.fromName });
  });

  socket.on('tradeAccept', (data) => {
    if (!players[socket.id] || !players[data.fromId]) {
      socket.emit('tradeCancelled');
      if (data.fromId) io.to(data.fromId).emit('tradeCancelled');
      return;
    }
    const tradeId = 'trade_' + Date.now();
    activeTrades[tradeId] = {
      id: tradeId,
      p1: data.fromId,
      p2: socket.id,
      data1: { stars: 0, items: [], agreed: false },
      data2: { stars: 0, items: [], agreed: false }
    };
    const p1 = players[data.fromId];
    const p2 = players[socket.id];
    io.to(data.fromId).emit('tradeStart', { id: tradeId, partnerName: p2.nickname, partnerId: socket.id });
    io.to(socket.id).emit('tradeStart', { id: tradeId, partnerName: p1.nickname, partnerId: data.fromId });
  });

  socket.on('tradeUpdate', (payload) => {
    const { tradeId, data } = payload;
    const trade = activeTrades[tradeId];
    if (!trade) return;
    const isP1 = socket.id === trade.p1;
    if (isP1) trade.data1 = data; else trade.data2 = data;
    const partnerId = isP1 ? trade.p2 : trade.p1;
    if (partnerId) io.to(partnerId).emit('tradeUpdate', data);
    if (trade.data1.agreed && trade.data2.agreed) {
      io.to(trade.p1).emit('tradeAgreedSync');
      io.to(trade.p2).emit('tradeAgreedSync');
    } else {
      io.to(trade.p1).emit('tradeStopSync');
      io.to(trade.p2).emit('tradeStopSync');
    }
  });

  socket.on('tradeCancel', (payload) => {
    if (!payload || !payload.tradeId) return;
    const trade = activeTrades[payload.tradeId];
    if (!trade) return;
    if (trade.p1) io.to(trade.p1).emit('tradeCancelled');
    if (trade.p2) io.to(trade.p2).emit('tradeCancelled');
    delete activeTrades[payload.tradeId];
  });

  socket.on('tradeConfirmComplete', (payload) => {
    if (!payload || !payload.tradeId) return;
    const trade = activeTrades[payload.tradeId];
    if (!trade) return;
    if (socket.id === trade.p1) trade.p1Ready = true;
    else if (socket.id === trade.p2) trade.p2Ready = true;
    if (trade.p1Ready && trade.p2Ready) {
      if (trade.p1) io.to(trade.p1).emit('tradeComplete');
      if (trade.p2) io.to(trade.p2).emit('tradeComplete');
      delete activeTrades[payload.tradeId];
    }
  });

  socket.on('addListing', (listing) => {
    marketListings.push({ ...listing, id: 'list_' + Date.now() + Math.random() });
    io.emit('marketUpdate', marketListings);
  });

  socket.on('purchaseItem', (data) => {
    const idx = marketListings.findIndex((l) => l.id === data.listingId);
    if (idx !== -1) {
      const listing = marketListings[idx];
      marketListings.splice(idx, 1);
      const sellerSocketId = Object.keys(players).find((id) => players[id].nickname === listing.seller);
      if (sellerSocketId) {
        io.to(sellerSocketId).emit('itemSold', { itemName: listing.item.name, price: listing.price });
      }
      io.emit('marketUpdate', marketListings);
      socket.emit('purchaseSuccess', listing);
    }
  });

  socket.on('createCustomNFT', (nftData) => {
    io.emit('newCustomNFT', nftData);
  });

  socket.on('disconnect', () => {
    for (const tid in activeTrades) {
      const trade = activeTrades[tid];
      if (trade.p1 === socket.id || trade.p2 === socket.id) {
        const partnerId = trade.p1 === socket.id ? trade.p2 : trade.p1;
        if (partnerId) io.to(partnerId).emit('tradeCancelled');
        delete activeTrades[tid];
      }
    }
    delete players[socket.id];
    io.emit('onlinePlayersUpdate', Object.values(players));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`IMMORTALS socket server on port ${PORT}`);
});
