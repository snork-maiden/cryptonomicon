const API_KEY =
  "380ec498044c900f249ad39326e8320a2cb4ee09b94afe4dff6911e37ef56bfc";

const tickersHandlers = new Map(); // {}
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);
  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

function unsubscribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
};

export async function getCoinsList() {
  let coinsList = [];
  let response = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );
  console.log(coinsList)

  if (response.ok) {
    const responseJSON = await response.json();
    const data = await responseJSON.Data;

    for (const key in data) {
      const coin = {
        symbol: data[key]?.Symbol,
        fullName: data[key]?.FullName,
      };
      coinsList.push(coin);
    }
    return coinsList;
  } else {
    console.error("HTTP error: " + response.status);
    return null;
  }
}
