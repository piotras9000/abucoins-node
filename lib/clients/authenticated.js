const { signRequest } = require('../../lib/request_signer');

const PublicClient = require('./public.js');

class AuthenticatedClient extends PublicClient {
  constructor(key, secret, passphrase, apiURI, options = {}) {
    super(apiURI, options);
    this.key = key;
    this.secret = secret;
    this.passphrase = passphrase;
  }

  request(method, uriParts, opts = {}, callback) {
    if (!callback && typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    this.addHeaders(
      opts,
      this._getSignature(
        method.toUpperCase(),
        this.makeRelativeURI(uriParts),
        opts
      )
    );

    return super.request(method, uriParts, opts, callback);
  }

  _getSignature(method, relativeURI, opts) {
    const sig = signRequest(this, method, relativeURI, opts);

    if (opts.body) {
      opts.body = JSON.stringify(opts.body);
    }
    return {
      'AC-ACCESS-KEY': sig.key,
      'AC-ACCESS-SIGN': sig.signature,
      'AC-ACCESS-TIMESTAMP': sig.timestamp,
      'AC-ACCESS-PASSPHRASE': sig.passphrase,
    };
  }

  getAccounts(callback) {
    return this.get(['accounts'], callback);
  }

  getAccount(accountID, callback) {
    return this.get(['accounts', accountID], callback);
  }

  placeOrder(params, callback) {
    let requiredParams = ['side', 'product_id'];
    let needsSize = params.type !== 'market' && params.type !== 'stop';

    if (needsSize) {
      requiredParams.push('price', 'size');
    }

    this._requireParams(params, requiredParams);

    if (!needsSize && !params.size && !params.funds) {
      throw new Error('`opts` must include either `size` or `funds`');
    }

    if (params.side !== 'buy' && params.side !== 'sell') {
      throw new Error('`side` must be `buy` or `sell`');
    }

    return this.post(['orders'], { body: params }, callback);
  }

  buy(params, callback) {
    params.side = 'buy';
    return this.placeOrder(params, callback);
  }

  sell(params, callback) {
    params.side = 'sell';
    return this.placeOrder(params, callback);
  }

  cancelOrder(orderID, callback) {
    if (!orderID || typeof orderID === 'function') {
      let err = new Error('must provide an orderID or consider cancelOrders');
      if (typeof orderID === 'function') {
        orderID(err);
      }
      return Promise.reject(err);
    }

    return this.delete(['orders', orderID], callback);
  }

  cancelOrders(callback) {
    return this.delete(['orders'], callback);
  }

  cancelAllOrders(args = {}, callback) {
    if (!callback && typeof args === 'function') {
      callback = args;
      args = {};
    }

    const opts = { qs: args };
    const totalDeletedOrders = [];

    const p = function deleteNext() {
      return new Promise((resolve, reject) => {
        this.delete(['orders'], opts, (err, response, data) => {
          if (err) {
            reject(err);
          } else {
            resolve([response, data]);
          }
        });
      })
        .then(values => {
          let [response, data] = values;
          totalDeletedOrders.push(...data);
          if (data.length) {
            return deleteNext.call(this);
          } else {
            return response;
          }
        })
        .then(response => {
          if (callback) {
            callback(undefined, response, totalDeletedOrders);
          }
          return totalDeletedOrders;
        })
        .catch(err => {
          if (callback) {
            callback(err);
          }
          throw err;
        });
    }.call(this);

    if (callback) {
      p.catch(() => {});
      return undefined;
    } else {
      return p;
    }
  }

  getOrders(args = {}, callback) {
    if (!callback && typeof args === 'function') {
      callback = args;
      args = {};
    }

    return this.get(['orders'], { qs: args }, callback);
  }

  getOrder(orderID, callback) {
    if (!orderID || typeof orderID === 'function') {
      let err = new Error('must provide an orderID or consider getOrders');
      if (typeof orderID === 'function') {
        orderID(err);
      }
      return Promise.reject(err);
    }

    return this.get(['orders', orderID], callback);
  }

  getFills(args = {}, callback) {
    if (!callback && typeof args === 'function') {
      callback = args;
      args = {};
    }

    return this.get(['fills'], { qs: args }, callback);
  }

  withdrawCrypto(body, callback) {
    this._requireParams(body, ['amount', 'currency', 'crypto_address']);
    return this.post(['withdrawals/crypto'], { body }, callback);
  }

  _requireParams(params, required) {
    for (let param of required) {
      if (params[param] === undefined) {
        throw new Error('`opts` must include param `' + param + '`');
      }
    }
    return true;
  }

  createReport(params, callback) {
    const required = ['type', 'start_date', 'end_date'];
    this._requireParams(params, required);

    if (params.type === 'fills') {
      required.push('product_id');
      this._requireParams(params, required);
    }

    if (params.type === 'account') {
      required.push('account_id');
      this._requireParams(params, required);
    }

    return this.post(['reports'], { body: params }, callback);
  }

  getReportStatus(reportId, callback) {
    return this.get(['reports', reportId], callback);
  }
}

module.exports = exports = AuthenticatedClient;
