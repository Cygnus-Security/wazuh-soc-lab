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
import responseTypes from "../constants/responseTypes";
import {
  PROFILE_PIC_NOT_UPDATED,
  VIDEO_NOT_UPDATED,
  VIDEO_NAME_CHANGED,
  VIDEO_NAME_NOT_CHANGED,
  VIDEO_NOT_CONVERTED,
  FAILURE_MESSAGE,
} from "../constants/messages";
import MyAction from "../types/action";

interface ReceivedResponse extends Response {
  ok: boolean;
}

/**
 * Upload profile pic
 * @payload { accessToken, callback, file } payload
 * accessToken: access token of the user
 * callback : callback method
 * file: image file
 */
export function* uploadProfilePic(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, file } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl =
      APIService.IDENTITY_SERVICE + requestURLS.UPLOAD_PROFILE_PIC;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const formData = new FormData();
    formData.append("file", file);
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: formData,
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.PROFILE_PIC_CHANGED,
        payload: responseJson,
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, PROFILE_PIC_NOT_UPDATED);
  }
}

/**
 * Upload car video
 * @payload { accessToken, callback, file } payload
 * accessToken: access token of the user
 * callback : callback method
 * file: video file
 */
export function* uploadVideo(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, file } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const postUrl = APIService.IDENTITY_SERVICE + requestURLS.UPLOAD_VIDEO;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const formData = new FormData();
    formData.append("file", file);
    const responseJson = yield fetch(postUrl, {
      headers,
      method: "POST",
      body: formData,
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.VIDEO_CHANGED,
        payload: responseJson,
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VIDEO_NOT_UPDATED);
  }
}

/**
 * change Video Name
 * @payload { accessToken, callback, videoName } payload
 * accessToken: access token of the user
 * callback : callback method
 * videoName : new video name
 */
export function* changeVideoName(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, videoName, videoId } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const putUrl =
      APIService.IDENTITY_SERVICE +
      requestURLS.CHANGE_VIDEO_NAME.replace("<videoId>", videoId);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const responseJson = yield fetch(putUrl, {
      headers,
      method: "PUT",
      body: JSON.stringify({ videoName }),
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.VIDEO_NAME_CHANGED,
        payload: responseJson,
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, responseJson.message);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VIDEO_NAME_NOT_CHANGED);
  }
}

/**
 * convert video
 * @payload { accessToken, callback } payload
 * accessToken: access token of the user
 * callback : callback method
 */
export function* convertVideo(action: MyAction): Generator<any, void, any> {
  const { accessToken, callback, videoId } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl = APIService.IDENTITY_SERVICE + requestURLS.CONVERT_VIDEO;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    yield fetch(`${getUrl}?video_id=${videoId}`, {
      headers,
      method: "GET",
    }).then((response: Response) => {
      recievedResponse = response as ReceivedResponse;
      return response.json();
    });

    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    if (recievedResponse.ok) {
      callback(responseTypes.SUCCESS, VIDEO_NOT_CONVERTED);
    } else {
      callback(responseTypes.FAILURE, VIDEO_NOT_CONVERTED);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VIDEO_NOT_CONVERTED);
  }
}

export function* getVideo(action: MyAction): Generator<any, void, any> {
  const { accessToken, videoId, callback } = action.payload;
  let recievedResponse: ReceivedResponse = {} as ReceivedResponse;
  try {
    yield put({ type: actionTypes.FETCHING_DATA });
    const getUrl =
      APIService.IDENTITY_SERVICE +
      requestURLS.GET_VIDEO.replace("<videoId>", videoId);
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
    if (recievedResponse.ok) {
      yield put({
        type: actionTypes.VIDEO_CHANGED,
        payload: responseJson,
      });
      callback(responseTypes.SUCCESS, responseJson);
    } else {
      callback(responseTypes.FAILURE, FAILURE_MESSAGE);
    }
  } catch (e) {
    yield put({ type: actionTypes.FETCHED_DATA, payload: recievedResponse });
    callback(responseTypes.FAILURE, VIDEO_NOT_CONVERTED);
  }
}

export function* profileActionWatcher(): Generator<any, void, any> {
  yield takeLatest(actionTypes.UPLOAD_PROFILE_PIC, uploadProfilePic);
  yield takeLatest(actionTypes.UPLOAD_VIDEO, uploadVideo);
  yield takeLatest(actionTypes.CHANGE_VIDEO_NAME, changeVideoName);
  yield takeLatest(actionTypes.CONVERT_VIDEO, convertVideo);
  yield takeLatest(actionTypes.GET_VIDEO, getVideo);
}
