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

import actionTypes from "../constants/actionTypes";

interface ActionPayload {
  accessToken: string;
  callback: () => void;
  [key: string]: any;
}

interface OrderByIdPayload extends ActionPayload {
  orderId: string;
}

export const getProductsAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.GET_PRODUCTS,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const buyProductAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.BUY_PRODUCT,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const getOrdersAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.GET_ORDERS,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const getOrderByIdAction = ({
  accessToken,
  orderId,
  callback,
}: OrderByIdPayload) => {
  return {
    type: actionTypes.GET_ORDER_BY_ID,
    payload: {
      accessToken,
      orderId,
      callback,
    },
  };
};

export const returnOrderAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.RETURN_ORDER,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const applyCouponAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.APPLY_COUPON,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const newProductAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.NEW_PRODUCT,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const newCouponAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.NEW_COUPON,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};
