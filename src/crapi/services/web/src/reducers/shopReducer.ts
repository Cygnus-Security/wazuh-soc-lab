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

import { UnknownAction } from "redux";
import actionTypes from "../constants/actionTypes";
import MyAction from "../types/action";

interface Product {
  id: string;
  [key: string]: any;
}

interface Order {
  id: string;
  [key: string]: any;
}

interface ShopState {
  availableCredit: number;
  products: Product[];
  pastOrders: Order[];
  prevOffset: string | null;
  nextOffset: string | null;
  order?: Order;
}

const initialData: ShopState = {
  availableCredit: 0,
  products: [],
  pastOrders: [],
  prevOffset: null,
  nextOffset: null,
};

const shopReducer = (
  state: ShopState = initialData,
  action: UnknownAction,
): ShopState => {
  const maction: MyAction = action as { type: string; payload: any };
  switch (maction.type) {
    case actionTypes.BALANCE_CHANGED:
      return {
        ...state,
        availableCredit: maction.payload.availableCredit,
      };
    case actionTypes.FETCHED_PRODUCTS:
      return {
        ...state,
        products: maction.payload.products,
        prevOffset: maction.payload.prevOffset,
        nextOffset: maction.payload.nextOffset,
      };
    case actionTypes.FETCHED_ORDERS:
      return {
        ...state,
        pastOrders: maction.payload.orders,
        prevOffset: maction.payload.prevOffset,
        nextOffset: maction.payload.nextOffset,
      };
    case actionTypes.FETCHED_ORDER:
      return {
        ...state,
        pastOrders: state.pastOrders.map((order) =>
          order.id === maction.payload.orderId ? maction.payload.order : order,
        ),
        order: maction.payload.order,
      };
    case actionTypes.ORDER_RETURNED:
      return {
        ...state,
        pastOrders: state.pastOrders.map((order) =>
          order.id === maction.payload.orderId ? maction.payload.order : order,
        ),
      };
    default:
      return state;
  }
};

export default shopReducer;
