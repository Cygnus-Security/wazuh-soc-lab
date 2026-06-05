/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { put, takeLatest } from "redux-saga/effects";
import { APIService, requestURLS } from "../constants/APIConstant";
import MyAction from "../types/action";
import actionTypes from "../constants/actionTypes";
import responseTypes from "../constants/responseTypes";
import {
  NO_PRODUCTS,
  PRODUCT_NOT_BOUGHT,
  NO_ORDER,
  NO_ORDERS,
  ORDER_NOT_RETURNED,
  INVALID_COUPON_CODE,
  COUPON_APPLIED,
  COUPON_NOT_APPLIED,
  COUPON_NOT_CREATED,
  NEW_PRODUCT_ADDED,
  PRODUCT_NOT_ADDED,
} from "../constants/messages";

interface ReceivedResponse extends Response {
  ok: boolean;
  message: string | null;
}

interface ProductResponse {
  credit: number;
  products: any[];
  previous_offset: number | null;
  next_offset: number | null;
  message: string | null;
}

interface OrderResponse {
  orders: any[];
  previous_offset: number | null;
  next_offset: number | null;
  message: string | null;
}

interface CouponResponse {
  coupon_code: string;
  amount: string;
}

/**
 * get the list of products
 * @payload { accessToken, offset, callback} payload
 * accessToken: access token of the user
 * offset: offset for pagination
 * callback : callback method
 */
export function* getProducts(action: MyAction): Generator<any, void, any> {
  const { accessToken, offset, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  let currentOffset = offset ? offset : 0;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.GET_PRODUCTS +
      `?limit=30&offset=${currentOffset}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson: ProductResponse = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.BALANCE_CHANGED,
        payload: { availableCredit: responseJson.credit },
      });
      yield put({
        type: actionTypes.FETCHED_PRODUCTS,
        payload: {
          products: responseJson.products,
          prevOffset: responseJson.previous_offset,
          nextOffset: responseJson.next_offset,
        },
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, recievedResponse.message);
    }
  } catch (e) {
    console.log(e);
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, NO_PRODUCTS);
  }
}

/**
 * buy a product
 * @payload { accessToken, productId, callback} payload
 * accessToken: access token of the user
 * productId: id of the product which is to be bought
 * callback : callback method
 */
export function* buyProduct(action: MyAction): Generator<any, void, any> {
  const { accessToken, productId, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.WORKSHOP_SERVICE + requestURLS.BUY_PRODUCT;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.BALANCE_CHANGED,
        payload: { availableCredit: responseJson.credit },
      });
      callback(responseTypes.SUCCESS, responseJson.message);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, PRODUCT_NOT_BOUGHT);
  }
}

/**
 * get the list of orders ordered by this user
 * @payload { accessToken, offset, callback} payload
 * accessToken: access token of the user
 * offset: offset for pagination
 * callback : callback method
 */
export function* getOrders(action: MyAction): Generator<any, void, any> {
  const { accessToken, offset, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    let currentOffset = offset ? offset : 0;
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.GET_ORDERS +
      `?limit=30&offset=${currentOffset}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson: OrderResponse = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.FETCHED_ORDERS,
        payload: {
          orders: responseJson.orders,
          prevOffset: responseJson.previous_offset,
          nextOffset: responseJson.next_offset,
        },
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, NO_ORDERS);
  }
}

/**
 * Get an order details
 * @payload { accessToken, orderId, callback } payload
 * accessToken: access token of the user
 * orderId: id of the order to be returned
 * callback : callback method
 */
export function* getOrderById(action: MyAction): Generator<any, void, any> {
  const { accessToken, orderId, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl = APIService.WORKSHOP_SERVICE + requestURLS.GET_ORDER_BY_ID;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(getUrl.replace("<orderId>", orderId), {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.FETCHED_ORDER,
        payload: { orderId: orderId, order: responseJson.order },
      });
      callback(responseTypes.SUCCESS, responseJson.order);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, NO_ORDER);
  }
}

/**
 * return an order
 * @payload { accessToken, orderId, callback } payload
 * accessToken: access token of the user
 * orderId: id of the order to be returned
 * callback : callback method
 */
export function* returnOrder(action: MyAction): Generator<any, void, any> {
  const { accessToken, orderId, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.WORKSHOP_SERVICE + requestURLS.RETURN_ORDER;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(`${postUrl}?order_id=${orderId}`, {
      headers,
      method: "POST",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.ORDER_RETURNED,
        payload: { order: responseJson.order, orderId },
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, ORDER_NOT_RETURNED);
  }
}

/**
 * validate the coupon and increase user credit
 * @payload { accessToken, couponCode, callback} payload
 * accessToken: access token of the user
 * couponCode: coupon code of the coupon
 * callback : callback method
 */
export function* applyCoupon(action: MyAction): Generator<any, void, any> {
  const { accessToken, couponCode, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    let postUrl = APIService.COMMUNITY_SERVICE + requestURLS.VALIDATE_COUPON;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const CouponJson: CouponResponse = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ coupon_code: couponCode }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      if (recievedResponse.ok) return response.json();
      return response;
    });

    if (!recievedResponse.ok) {
      yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
      callback(responseTypes.FAILURE, INVALID_COUPON_CODE);
    } else {
      postUrl = APIService.WORKSHOP_SERVICE + requestURLS.APPLY_COUPON;
      const responseJson = yield fetch(postUrl, {
        headers,
        method: "POST",
        body: JSON.stringify({
          coupon_code: CouponJson.coupon_code,
          amount: parseFloat(CouponJson.amount),
        }),
      }).then((response: Response) => {
        recievedResponse = response as ReceivedResponse;
        return response.json();
      });

      yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
      if (recievedResponse.ok) {
        yield put({
          type: actionTypes.BALANCE_CHANGED,
          payload: { availableCredit: responseJson.credit },
        });
        callback(responseTypes.SUCCESS, COUPON_APPLIED);
      } else {
        callback(responseTypes.FAILURE, responseJson.message);
      }
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, COUPON_NOT_APPLIED);
  }
}

/**
 * add a new product (admin only)
 * @payload { accessToken, name, price, image_url, callback} payload
 * accessToken: access token of the user
 * name: product name
 * price: product price
 * image_url: product image URL
 * callback : callback method
 */
export function* newProduct(action: MyAction): Generator<any, void, any> {
  const { accessToken, name, price, image_url, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.WORKSHOP_SERVICE + requestURLS.GET_PRODUCTS;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ name, price: parseFloat(price), image_url }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, NEW_PRODUCT_ADDED);
    } else {
      callback(responseTypes.FAILURE, PRODUCT_NOT_ADDED);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, PRODUCT_NOT_ADDED);
  }
}

/**
 * create a new coupon (admin only)
 * @payload { accessToken, couponCode, amount, callback} payload
 * accessToken: access token of the user
 * couponCode: coupon code to create
 * amount: amount for the coupon
 * callback : callback method
 */
export function* newCoupon(action: MyAction): Generator<any, void, any> {
  const { accessToken, couponCode, amount, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    let postUrl = APIService.COMMUNITY_SERVICE + requestURLS.NEW_COUPON;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ coupon_code: couponCode, amount: amount }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, COUPON_NOT_CREATED);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, COUPON_NOT_CREATED);
  }
}

export function* shopActionWatcher(): Generator<any, void, any> {
  yield takeLatest(actionTypes.GET_PRODUCTS, getProducts);
  yield takeLatest(actionTypes.BUY_PRODUCT, buyProduct);
  yield takeLatest(actionTypes.GET_ORDERS, getOrders);
  yield takeLatest(actionTypes.GET_ORDER_BY_ID, getOrderById);
  yield takeLatest(actionTypes.RETURN_ORDER, returnOrder);
  yield takeLatest(actionTypes.APPLY_COUPON, applyCoupon);
  yield takeLatest(actionTypes.NEW_PRODUCT, newProduct);
  yield takeLatest(actionTypes.NEW_COUPON, newCoupon);
}
