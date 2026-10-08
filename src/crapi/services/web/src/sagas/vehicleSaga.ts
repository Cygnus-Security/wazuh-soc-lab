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
import {
  EMAIL_NOT_SENT,
  VEHICLE_NOT_ADDED,
  NO_VEHICLES,
  NO_MECHANICS,
  SERVICE_REQUEST_SENT,
  SERVICE_REQUEST_NOT_SENT,
  LOC_NOT_REFRESHED,
  NO_SERVICES,
  VEHICLE_NOT_REGISTERED,
} from "../constants/messages";

interface ReceivedResponse extends Response {
  ok: boolean;
}

/**
 * resend vehicle details
 * @payload { accessToken, callback } payload
 * accessToken: access token of the user
 * callback : callback method
 */
export function* resendMail(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });

    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.RESEND_MAIL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJson.message);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, EMAIL_NOT_SENT);
  }
}

/**
 * register a new vehicle
 * @payload { accessToken, callback } payload
 * accessToken: access token of the user
 * callback : callback method
 */
export function* registerVehicle(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.REGISTER_VEHICLE;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJson.message);
    } else {
      callback(responseTypes.FAILURE, VEHICLE_NOT_REGISTERED);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VEHICLE_NOT_REGISTERED);
  }
}

/**
 * verify vehicle details entered by user and add this vehicle to this uder
 * @payload { pincode, vehicleNumber, accessToken, callback} payload
 * pincode: pincode of the vehicle entered
 * vehicleNumber: vehicle number entered by the user
 * accessToken: access token of the user
 * callback : callback method
 */
export function* verifyVehicle(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, pinCode, vin } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.ADD_VEHICLE;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ vin, pincode: pinCode }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJson.message);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VEHICLE_NOT_ADDED);
  }
}

/**
 * get the list of vehicles of the current user
 * @payload { accessToken, callback} payload
 * accessToken: access token of the user
 * callback : callback method
 */
export function* getVehicles(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback } = action.payload;
  console.log(callback);
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    let getUrl = APIService.IDENTITY_SERVICE + requestURLS.GET_USER;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const userResponseJSON = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });
    if (!recievedResponse.ok) {
      throw userResponseJSON;
    }
    yield put({
      type: actionTypes.FETCHED_USER,
      payload: userResponseJSON,
    });

    getUrl = APIService.IDENTITY_SERVICE + requestURLS.GET_VEHICLES;
    const responseJson = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.FETCHED_VEHICLES,
        payload: responseJson,
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.error);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, NO_VEHICLES);
  }
}

/**
 * get the list of mechanics
 * @payload { accessToken, callback} payload
 * accessToken: access token of the user
 * callback : callback method
 */
export function* getMechanics(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl = APIService.WORKSHOP_SERVICE + requestURLS.GET_MECHANICS;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    yield put({
      type: actionTypes.FETCHED_MECHANICS,
      payload: responseJson.mechanics,
    });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJson.mechanics);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, NO_MECHANICS);
  }
}

/**
 * contact Mechanic API
 * @payload { accessToken, callback, VIN, mechanic, problem_details } payload
 * accessToken: access token of the user
 * callback : callback method
 * VIN: vehicle identification number
 * mechanic: mechanic_code to whom service is to be given
 * problem_details: Problem about the car
 */
export function* contactMechanic(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, mechanicCode, problemDetails, vin } =
    action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.WORKSHOP_SERVICE + requestURLS.CONTACT_MECHANIC;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const http_host = new URL(window.location.href).origin;
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({
        mechanic_code: mechanicCode,
        problem_details: problemDetails,
        vin,
        mechanic_api:
          http_host +
          "/" +
          APIService.WORKSHOP_SERVICE +
          requestURLS.RECEIVE_REPORT,
        repeat_request_if_failed: false,
        number_of_repeats: 1,
      }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, SERVICE_REQUEST_SENT);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, SERVICE_REQUEST_NOT_SENT);
  }
}

/**
 * change location of the vehicle
 * @payload { accessToken, callback, vehicle_id } payload
 * accessToken: access token of the user
 * callback : callback method
 * vehicle_id: vehicle_id of the vehicle whose location is to be changed
 */
export function* refreshLocation(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, carId } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl = APIService.IDENTITY_SERVICE + requestURLS.REFRESH_LOCATION;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(getUrl.replace("<carId>", carId), {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.REFRESHED_LOCATION,
        payload: { carId, location: responseJson.vehicleLocation },
      });
      callback(responseTypes.SUCCESS, responseJson.vehicleLocation);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, LOC_NOT_REFRESHED);
  }
}

export function* getVehicleServices(
  action: MyAction,
): Generator<any, void, any> {
  console.log("Vehicle Services", action.payload);
  const { accessToken, VIN, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.GET_VEHICLE_SERVICES.replace("<vehicleVIN>", VIN);
    console.log("Get URL", getUrl);
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
 * Request for getting service report

 * @payload {string} payload.accessToken - Access token of the user
 * @payload {string} payload.reportId - Report id of the service
 * @payload {Function} payload.callback - Callback method
 */
export function* getServiceReport(action: MyAction): Generator<any, void, any> {
  const { accessToken, reportId, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.GET_SERVICE_REPORT +
      "?report_id=" +
      reportId;
    console.log("Get URL", getUrl);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const responseJSON = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    if (!receivedResponse.ok) {
      throw responseJSON;
    }

    const filename = `report_${reportId}`;
    responseJSON.downloadUrl =
      APIService.WORKSHOP_SERVICE +
      requestURLS.DOWNLOAD_SERVICE_REPORT +
      "?filename=" +
      filename;
    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    callback(responseTypes.SUCCESS, responseJSON);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, e);
  }
}

export function* vehicleActionWatcher(): Generator<any, void, any> {
  yield takeLatest(actionTypes.RESEND_MAIL, resendMail);
  yield takeLatest(actionTypes.REGISTER_VEHICLE, registerVehicle);
  yield takeLatest(actionTypes.VERIFY_VEHICLE, verifyVehicle);
  yield takeLatest(actionTypes.GET_VEHICLES, getVehicles);
  yield takeLatest(actionTypes.GET_MECHANICS, getMechanics);
  yield takeLatest(actionTypes.CONTACT_MECHANIC, contactMechanic);
  yield takeLatest(actionTypes.REFRESH_LOCATION, refreshLocation);
  yield takeLatest(actionTypes.GET_SERVICE_REPORT, getServiceReport);
  yield takeLatest(actionTypes.GET_VEHICLE_SERVICES, getVehicleServices);
}
