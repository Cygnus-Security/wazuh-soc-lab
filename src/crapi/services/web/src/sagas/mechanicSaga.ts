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
import actionTypes from "../constants/actionTypes";
import MyAction from "../types/action";
import responseTypes from "../constants/responseTypes";
import { NO_SERVICES } from "../constants/messages";

/**
 * Get the list of services allotted to this mechanic
 * @payload {Object} payload
 * @payload {string} payload.accessToken - Access token of the user
 * @payload {Function} payload.callback - Callback method
 */
export function* getMechanicServices(
  action: MyAction,
): Generator<any, void, any> {
  const { accessToken, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE + requestURLS.GET_MECHANIC_SERVICES;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    interface GetServicesResponse {
      service_requests: any;
      message: string;
    }

    const responseJSON: GetServicesResponse = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON.service_requests);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, NO_SERVICES);
  }
}

/**
 * Get the list of services allotted to this mechanic
 * @payload {Object} payload
 * @payload {string} payload.accessToken - Access token of the user
 * @payload {Function} payload.callback - Callback method
 */
export function* getMechanicService(
  action: MyAction,
): Generator<any, void, any> {
  const { accessToken, serviceId, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.GET_MECHANIC_SERVICE.replace("<serviceId>", serviceId);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    interface GetServicesResponse {
      service_request: any;
      message: string;
    }

    const responseJSON: GetServicesResponse = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, NO_SERVICES);
  }
}

export function* createComment(action: MyAction): Generator<any, void, any> {
  const { accessToken, serviceId, comment, callback } = action.payload;
  console.log("Comment", comment, serviceId);
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.CREATE_SERVICE_COMMENT.replace("<serviceId>", serviceId);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJSON = yield fetch(getUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ comment }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });
    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, e);
  }
}

export function* updateServiceRequestStatus(
  action: MyAction,
): Generator<any, void, any> {
  const { accessToken, serviceId, status, callback } = action.payload;
  console.log("Status", status, serviceId);
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.UPDATE_SERVICE_REQUEST_STATUS.replace(
        "<serviceId>",
        serviceId,
      );
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJSON = yield fetch(getUrl, {
      headers,
      method: "PUT",
      body: JSON.stringify({ status }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });
    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, e);
  }
}

export function* mechanicActionWatcher(): Generator<any, void, any> {
  yield takeLatest(actionTypes.GET_MECHANIC_SERVICES, getMechanicServices);
  yield takeLatest(actionTypes.GET_MECHANIC_SERVICE, getMechanicService);
  yield takeLatest(actionTypes.CREATE_SERVICE_COMMENT, createComment);
  yield takeLatest(
    actionTypes.UPDATE_SERVICE_REQUEST_STATUS,
    updateServiceRequestStatus,
  );
}
