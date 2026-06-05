/*
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
import responseTypes from "../constants/responseTypes";
import {
  INVALID_CREDS,
  INVALID_CODE_CREDS,
  SIGN_UP_SUCCESS,
  SIGN_UP_FAILED,
  OTP_SENT,
  OTP_NOT_SENT,
  OTP_VERIFIED,
  OTP_NOT_VERIFIED,
  PASSWORD_CHANGED,
  PASSWORD_NOT_CHANGED,
  TOKEN_NOT_SENT,
  EMAIL_CHANGED,
  EMAIL_NOT_CHANGED,
} from "../constants/messages";
import MyAction from "../types/action";

interface Response {
  ok: boolean;
  status?: number;
  json: () => Promise<any>;
}

/**
 * Validate the access token
 - The payload object
 * @payload {string} payload.accessToken - The access token to validate
 */
export function* validateAccessToken(
  action: MyAction,
): Generator<any, void, any> {
  console.log("validateAccessToken invoked fn", action);
  const { accessToken } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.VALIDATE_TOKEN;
    const headers = {
      "Content-Type": "application/json",
    };
    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ token: accessToken }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: responseJSON });
    if (!receivedResponse.ok) {
      yield put({
        type: actionTypes.INVALID_SESSION,
      });
    }
  } catch (e) {
    console.log("validateAccessToken error", e);
    yield put({ type: actionTypes.FETCHED_DATA, payload: null });
  }
}

/**
 * Request for login

 * @payload {string} payload.email - User email
 * @payload {string} payload.password - User password
 * @payload {Function} payload.callback - Callback method
 */
export function* logIn(action: MyAction): Generator<any, void, any> {
  const { email, password, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });

    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.LOGIN;
    let headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) {
        return response.json();
      } else if (receivedResponse.status === 423) {
        return response.json();
      }
      return response;
    });

    if (receivedResponse.status === 423) {
      yield put({
        type: actionTypes.UNLOCK_USER_REDIRECT,
        payload: { email: email, message: responseJSON.message },
      });
      callback(responseTypes.REDIRECT, "/unlock");
      return;
    }
    if (!receivedResponse.ok) {
      throw responseJSON;
    }

    const getUrl = APIService.IDENTITY_SERVICE + requestURLS.GET_USER;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${responseJSON.token}`,
    };

    const userResponseJSON = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    if (!receivedResponse.ok) {
      throw responseJSON;
    }

    yield put({
      type: actionTypes.LOGGED_IN,
      payload: { token: responseJSON.token, user: userResponseJSON },
    });
    callback(responseTypes.SUCCESS, responseJSON.data);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, INVALID_CREDS);
  }
}

/**
 * Request for unlocking user

 * @payload {string} payload.email - User email
 * @payload {string} payload.code - User code received through mail
 * @payload {Function} payload.callback - Callback method
 */
export function* unlock(action: MyAction): Generator<any, void, any> {
  console.log("unlock action", action.payload);
  const { email, code, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });

    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.UNLOCK;
    let headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ email, code }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) return response.json();
      return response;
    });

    if (!receivedResponse.ok) {
      throw responseJSON;
    }

    const getUrl = APIService.IDENTITY_SERVICE + requestURLS.GET_USER;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${responseJSON.token}`,
    };

    const userResponseJSON = yield fetch(getUrl, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    if (!receivedResponse.ok) {
      throw responseJSON;
    }

    yield put({
      type: actionTypes.LOGGED_IN,
      payload: { token: responseJSON.token, user: userResponseJSON },
    });
    callback(responseTypes.SUCCESS, responseJSON.data);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, INVALID_CODE_CREDS);
  }
}

/**
 * Request for new signup

 * @payload {string} payload.name - User name
 * @payload {string} payload.email - User email
 * @payload {string} payload.number - User number
 * @payload {string} payload.password - User password
 * @payload {Function} payload.callback - Callback method
 */
export function* signUp(action: MyAction): Generator<any, void, any> {
  const { name, email, number, password, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });

    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.SIGNUP;
    const headers = {
      "Content-Type": "application/json",
    };
    // remove special chars from number
    let cleanedNumber = number.replace(/[^0-9+]/g, "");
    console.log("number", cleanedNumber);
    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({
        name: name,
        email: email,
        number: cleanedNumber,
        password: password,
      }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) return response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) callback(responseTypes.SUCCESS, SIGN_UP_SUCCESS);
    else callback(responseTypes.FAILURE, responseJSON.message);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, SIGN_UP_FAILED);
  }
}

/**
 * Send OTP for forgot password

 * @payload {string} payload.email - User email
 * @payload {Function} payload.callback - Callback method
 */
export function* forgotPassword(action: MyAction): Generator<any, void, any> {
  const { email, callback } = action.payload;

  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.FORGOT_PASSWORD;
    const headers = {
      "Content-Type": "application/json",
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ email }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) return response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) callback(responseTypes.SUCCESS, OTP_SENT);
    else callback(responseTypes.FAILURE, responseJSON.message);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, OTP_NOT_SENT);
  }
}

/**
 * Verify OTP for forgot password

 * @payload {string} payload.email - User email
 * @payload {string} payload.otp - OTP received through mail
 * @payload {string} payload.password - New password
 * @payload {Function} payload.callback - Callback method
 */
export function* verifyOTP(action: MyAction): Generator<any, void, any> {
  const { email, otp, password, callback } = action.payload;

  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.VERIFY_OTP;
    const headers = {
      "Content-Type": "application/json",
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ email, otp, password }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) return response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) callback(responseTypes.SUCCESS, OTP_VERIFIED);
    else if (receivedResponse.status === 503)
      callback(responseTypes.REDIRECT, responseJSON.message);
    else callback(responseTypes.FAILURE, responseJSON.message);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, OTP_NOT_VERIFIED);
  }
}

/**
 * Verify OTP for change Phone Number

 * @payload {string} payload.old_number - User number
 * @payload {string} payload.new_number - User new number
 * @payload {string} payload.otp - OTP received through mail
 */
export function* verifyPhoneNumberOTP(
  action: MyAction,
): Generator<any, void, any> {
  const { accessToken, old_number, new_number, otp, callback } = action.payload;

  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl =
      APIService.IDENTITY_SERVICE + requestURLS.VERIFY_PHONE_NUMBER_OTP;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ old_number, new_number, otp }),
    }).then((response: Response) => {
      receivedResponse = response;
      if (receivedResponse.ok) return response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, OTP_VERIFIED);
      yield put({
        type: actionTypes.PHONE_NUMBER_VERIFIED,
        payload: { new_number },
      });
    } else if (receivedResponse.status === 503)
      callback(responseTypes.REDIRECT, responseJSON.message);
    else callback(responseTypes.FAILURE, responseJSON.message);
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, OTP_NOT_VERIFIED);
  }
}

/**
 * Change user password

 * @payload {string} payload.accessToken - Access token of the user
 * @payload {string} payload.password - New password
 * @payload {Function} payload.callback - Callback method
 */
export function* resetPassword(action: MyAction): Generator<any, void, any> {
  const { accessToken, password, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.RESET_PASSWORD;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ password }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response;
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, PASSWORD_CHANGED);
    } else {
      callback(responseTypes.FAILURE, PASSWORD_NOT_CHANGED);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, PASSWORD_NOT_CHANGED);
  }
}

/**
 * Request for changing email

 * @payload {string} payload.accessToken - Access token of the user
 * @payload {string} payload.old_email - Old email id of the user
 * @payload {string} payload.new_email - New email id entered by the user
 * @payload {Function} payload.callback - Callback method
 */
export function* changeEmail(action: MyAction): Generator<any, void, any> {
  const { accessToken, old_email, new_email, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.CHANGE_EMAIL;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ old_email, new_email }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON.message);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, TOKEN_NOT_SENT);
  }
}
/**
 * Request for changing email

 * @payload {string} payload.accessToken - Access token of the user
 * @payload {string} payload.old_email - Old Phone Number of the user
 * @payload {string} payload.new_email - New Phone Number entered by the user
 * @payload {Function} payload.callback - Callback method
 */
export function* changePhoneNumber(
  action: MyAction,
): Generator<any, void, any> {
  const { accessToken, old_number, new_number, callback } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl =
      APIService.IDENTITY_SERVICE + requestURLS.CHANGE_PHONE_NUMBER;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ old_number, new_number }),
    }).then((response: Response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, responseJSON.message);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, TOKEN_NOT_SENT);
  }
}

/**
 * Verify token and change email

 * @payload {string} payload.accessToken - Access token of the user
 * @payload {string} payload.new_email - New email id entered by the user
 * @payload {string} payload.token - Token sent to new_email id
 * @payload {Function} payload.callback - Callback method
 */
export function* verifyToken(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, new_email, token } = action.payload;
  let receivedResponse: Partial<Response> = {};
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.VERIFY_TOKEN;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const responseJSON = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: JSON.stringify({ new_email, token }),
    }).then((response) => {
      receivedResponse = response;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    if (receivedResponse.ok) {
      callback(responseTypes.SUCCESS, EMAIL_CHANGED);
    } else {
      callback(responseTypes.FAILURE, responseJSON.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: receivedResponse });
    callback(responseTypes.FAILURE, EMAIL_NOT_CHANGED);
  }
}

export function* userActionWatcher() {
  yield takeLatest(actionTypes.LOG_IN, logIn);
  yield takeLatest(actionTypes.VALIDATE_ACCESS_TOKEN, validateAccessToken);
  yield takeLatest(actionTypes.UNLOCK_USER, unlock);
  yield takeLatest(actionTypes.SIGN_UP, signUp);
  yield takeLatest(actionTypes.VERIFY_OTP, verifyOTP);
  yield takeLatest(actionTypes.FORGOT_PASSWORD, forgotPassword);
  yield takeLatest(actionTypes.RESET_PASSWORD, resetPassword);
  yield takeLatest(actionTypes.CHANGE_EMAIL, changeEmail);
  yield takeLatest(actionTypes.VERIFY_TOKEN, verifyToken);
  yield takeLatest(actionTypes.CHANGE_PHONE_NUMBER, changePhoneNumber);
  yield takeLatest(actionTypes.VERIFY_PHONE_NUMBER_OTP, verifyPhoneNumberOTP);
}
