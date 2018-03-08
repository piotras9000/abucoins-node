# Abucoins

The official Node.js library for [Abucoins API](https://docs.abucoins.com/).

## Features

* Market watching
* Trading

## Installation

```bash
npm install abucoinsnode
```

You can learn about the API responses of each endpoint [by reading our
documentation](https://docs.abucoins.com/).

## Quick Start

The Abbucoins API has both public and private endpoints. If you're only interested in
the public endpoints, you should use a `PublicClient`.

```js
const Abucoins = require('abucoinsnode');
const publicClient = new Abucoins.PublicClient();
```

All methods, unless otherwise specified, can be used with either a promise or
callback API.

### Using Promises

```js
publicClient
  .getProducts()
  .then(data => {
    // work with data
  })
  .catch(error => {
    // handle the error
  });
```

The promise API can be used as expected in `async` functions in ES2017+
environments:

```js
async function yourFunction() {
  try {
    const products = await publicClient.getProducts();
  } catch (error) {
    /* ... */
  }
}
```

### Using Callbacks

Your callback should accept two arguments:

* `error`: contains an error message (`string`), or `null` if no was error
  encountered
* `response`: a generic HTTP response abstraction created by the [`request`
  library](https://github.com/request/request)
* `data`: contains data returned by the Abucoins API, or `undefined` if an error was
  encountered

```js
publicClient.getProducts((error, response, data) => {
  if (error) {
    // handle the error
  } else {
    // work with data
  }
});
```

**NOTE:** if you supply a callback, no promise will be returned. This is to
prevent potential `UnhandledPromiseRejectionWarning`s, which will cause future
versions of Node to terminate.

```js
const myCallback = (err, response, data) => {
  /* ... */
};

const result = publicClient.getProducts(myCallback);

result.then(() => {
  /* ... */
}); // TypeError: Cannot read property 'then' of undefined
```

### Optional Parameters

Some methods accept optional parameters, e.g.

```js
publicClient.getProductOrderBook('BTC-USD', { level: 3 }).then(book => {
  /* ... */
});
```

To use optional parameters with callbacks, supply the options as the first
parameter(s) and the callback as the last parameter:

```js
publicClient.getProductOrderBook(
  'ETH-USD',
  { level: 3 },
  (error, response, book) => {
    /* ... */
  }
);
```

### The Public API Client

```js
const publicClient = new Abucoins.PublicClient(endpoint);
```

* `productID` _optional_ - defaults to 'BTC-USD' if not specified.
* `endpoint` _optional_ - defaults to 'https://api.abucoins.com' if not specified.

#### Public API Methods

* [`getProducts`](https://docs.abucoins.com/#get-products)

```js
publicClient.getProducts(callback);
```

* [`getProductOrderBook`](https://docs.abucoins.com/#get-product-order-book)

```js
// Get the order book at the default level of detail.
publicClient.getProductOrderBook('BTC-USD', callback);

// Get the order book at a specific level of detail.
publicClient.getProductOrderBook('LTC-USD', { level: 3 }, callback);
```

* [`getProductTicker`](https://docs.abucoins.com/#get-product-ticker)

```js
publicClient.getProductTicker('ETH-USD', callback);
```

* [`getProductTrades`](https://docs.abucoins.com/#get-trades)

```js
publicClient.getProductTrades('BTC-USD', callback);

// To make paginated requests, include page parameters
publicClient.getProductTrades('BTC-USD', { after: 1000 }, callback);
```

* [`getProductTradeStream`](https://docs.abucoins.com/#get-trades)

Wraps around `getProductTrades`, fetches all trades with IDs `>= tradesFrom` and
`<= tradesTo`. Handles pagination and rate limits.

```js
const trades = publicClient.getProductTradeStream('BTC-USD', 8408000, 8409000);

// tradesTo can also be a function
const trades = publicClient.getProductTradeStream(
  'BTC-USD',
  8408000,
  trade => Date.parse(trade.time) >= 1463068e6
);
```

* [`getProductHistoricRates`](https://docs.abucoins.com/#get-historic-rates)

```js
publicClient.getProductHistoricRates('BTC-USD', callback);

// To include extra parameters:
publicClient.getProductHistoricRates(
  'BTC-USD',
  { granularity: 3600 },
  callback
);
```

* [`getProduct24HrStats`](https://docs.abucoins.com/#get-24hr-stats)

```js
publicClient.getProduct24HrStats('BTC-USD', callback);
```

* [`getCurrencies`](https://docs.abucoins.com/#get-currencies)

```js
publicClient.getCurrencies(callback);
```

* [`getTime`](https://docs.abucoins.com/#time)

```js
publicClient.getTime(callback);
```

### The Authenticated API Client

The [private exchange API endpoints](http://docs.abucoins.com/#authentication) require you
to authenticate with a Abucoins API key. You can create a new API key [in your
exchange account's settings](https://abucoins.com/account/api). You can also specify
the API URI (defaults to `https://api.abucoins.com`).

```js
const key = 'your_api_key';
const secret = 'your_secret';
const passphrase = 'your_passphrase';

const apiURI = 'https://api.abucoins.com';

const authedClient = new Abucoins.AuthenticatedClient(
  key,
  secret,
  passphrase,
  apiURI
);
```

Like `PublicClient`, all API methods can be used with either callbacks or will
return promises.

`AuthenticatedClient` inherits all of the API methods from
`PublicClient`, so if you're hitting both public and private API endpoints you
only need to create a single client.

#### Private API Methods

* [`getPaymentMethods`](https://docs.abucoins.com/#payment-methods)

```javascript
authedClient.getPaymentMethods(callback);
```

* [`getAccounts`](https://docs.abucoins.com/#list-accounts)

```js
authedClient.getAccounts(callback);
```

* [`getAccount`](https://docs.abucoins.com/#get-an-account)

```js
const accountID = '7d0f7d8e-dd34-4d9c-a846-06f431c381ba';
authedClient.getAccount(accountID, callback);
```

* [`buy`, `sell`](https://docs.abucoins.com/#place-a-new-order)

```js
// Buy 1 BTC @ 100 USD
const buyParams = {
  price: '100.00', // USD
  size: '1', // BTC
  product_id: 'BTC-USD',
};
authedClient.buy(buyParams, callback);

// Sell 1 BTC @ 110 USD
const sellParams = {
  price: '110.00', // USD
  size: '1', // BTC
  product_id: 'BTC-USD',
};
authedClient.sell(sellParams, callback);
```

* [`placeOrder`](https://docs.abucoins.com/#place-a-new-order)

```js
// Buy 1 LTC @ 75 USD
const params = {
  side: 'buy',
  price: '75.00', // USD
  size: '1', // LTC
  product_id: 'LTC-USD',
};
authedClient.placeOrder(params, callback);
```

* [`cancelOrder`](https://docs.abucoins.com/#cancel-an-order)

```js
const orderID = 'd50ec984-77a8-460a-b958-66f114b0de9b';
authedClient.cancelOrder(orderID, callback);
```

* [`cancelOrders`](https://docs.abucoins.com/#cancel-all)

```js
authedClient.cancelOrders(callback);
```

* [`cancelAllOrders`](https://docs.abucoins.com/#cancel-all)

```js
// `cancelOrders` may require you to make the request multiple times until
// all of the orders are deleted.

// `cancelAllOrders` will handle making these requests for you asynchronously.
// Also, you can add a `product_id` param to only delete orders of that product.

// The data will be an array of the order IDs of all orders which were cancelled
authedClient.cancelAllOrders({ product_id: 'BTC-USD' }, callback);
```

* [`getOrders`](https://docs.abucoins.com/#list-open-orders)

```js
authedClient.getOrders(callback);
// For pagination, you can include extra page arguments
// Get all orders of 'open' status
authedClient.getOrders({ after: 3000, status: 'open' }, callback);
```

* [`getOrder`](https://docs.abucoins.com/#get-an-order)

```js
const orderID = 'd50ec984-77a8-460a-b958-66f114b0de9b';
authedClient.getOrder(orderID, callback);
```

* [`getFills`](https://docs.abucoins.com/#list-fills)

```js
authedClient.getFills(callback);
// For pagination, you can include extra page arguments
authedClient.getFills({ before: 3000 }, callback);
```

### Websocket Client

The `WebsocketClient` allows you to connect and listen to the [exchange
websocket messages](https://docs.abucoins.com/#messages).

```js
const websocket = new Abucoins.WebsocketClient(['BTC-USD', 'ETH-USD']);

websocket.on('message', data => {
  /* work with data */
});
websocket.on('error', err => {
  /* handle error */
});
websocket.on('close', () => {
  /* ... */
});
```

The client will automatically subscribe to the `heartbeat` channel. By
default, the `full` channel will be subscribed to unless other channels are
requested.

```javascript
const websocket = new Abucoins.WebsocketClient(
  ['BTC-USD', 'ETH-USD'],
  'wss://ws.abucoins.com',
  {
    key: 'suchkey',
    secret: 'suchsecret',
    passphrase: 'muchpassphrase',
  },
  { channels: ['full', 'level2'] }
);

```

Optionally, [change subscriptions at runtime](https://docs.abucoins.com/#subscribe):

```javascript
websocket.unsubscribe({ channels: ['full'] });

websocket.subscribe({ product_ids: ['LTC-USD'], channels: ['ticker', 'user'] });

websocket.subscribe({
  channels: [{
    name: 'user',
    product_ids: ['ETH-USD']
  }]
});

websocket.unsubscribe({
  channels: [{
    name: 'user',
    product_ids: ['LTC-USD']
  }, {
    name: 'user',
    product_ids: ['ETH-USD']
  }]
});
```

The following events can be emitted from the `WebsocketClient`:

* `open`
* `message`
* `close`
* `error`
