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
  callback: (status: string, data: any) => void;
  [key: string]: any;
}

export const uploadProfilePicAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.UPLOAD_PROFILE_PIC,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const uploadVideoAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.UPLOAD_VIDEO,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

export const changeVideoNameAction = ({
  accessToken,
  callback,
  ...data
}: ActionPayload) => {
  return {
    type: actionTypes.CHANGE_VIDEO_NAME,
    payload: {
      accessToken,
      ...data,
      callback,
    },
  };
};

interface ConvertVideoPayload {
  accessToken: string;
  videoId: string;
  callback: (res: string, data: any) => void;
}

export const convertVideoAction = ({
  accessToken,
  videoId,
  callback,
}: ConvertVideoPayload) => {
  return {
    type: actionTypes.CONVERT_VIDEO,
    payload: {
      accessToken,
      videoId,
      callback,
    },
  };
};

export const getVideoAction = ({
  accessToken,
  videoId,
  callback,
}: ActionPayload) => {
  return {
    type: actionTypes.GET_VIDEO,
    payload: {
      accessToken,
      videoId,
      callback,
    },
  };
};
