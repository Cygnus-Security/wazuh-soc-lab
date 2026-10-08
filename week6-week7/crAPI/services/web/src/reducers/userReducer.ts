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
import MyAction from "../types/action";
import actionTypes from "../constants/actionTypes";

interface UserState {
  fetchingData: boolean;
  isLoggedIn: boolean;
  accessToken: string;
  id: string;
  name: string;
  email: string;
  number: string;
  role: string;
  message?: string;
  available_credit: number;
  picture_url: string;
  video_url: string;
  video_id: string;
  video_name: string;
}

const initialData: UserState = {
  fetchingData: false,
  isLoggedIn: false,
  accessToken: "",
  id: "",
  name: "",
  email: "",
  number: "",
  role: "",
  available_credit: 0,
  picture_url: "",
  video_url: "",
  video_id: "",
  video_name: "",
};

const userReducer = (
  state: UserState = initialData,
  action: UnknownAction,
): UserState => {
  const maction: MyAction = action as { type: string; payload: any };
  switch (maction.type) {
    case actionTypes.FETCHING_DATA:
      return {
        ...state,
        fetchingData: true,
      };
    case actionTypes.FETCHED_DATA:
      return {
        ...state,
        fetchingData: false,
      };
    case actionTypes.VALIDATED_ACCESS_TOKEN:
      return {
        ...state,
      };
    case actionTypes.LOGGED_IN:
      return {
        ...state,
        fetchingData: false,
        isLoggedIn: true,
        accessToken: maction.payload.token,
        id: maction.payload.user.id,
        name: maction.payload.user.name,
        email: maction.payload.user.email,
        number: maction.payload.user.number,
        role: maction.payload.user.role,
      };
    case actionTypes.UNLOCK_USER_REDIRECT:
      return {
        ...state,
        fetchingData: false,
        email: maction.payload.email,
        message: maction.payload.message,
      };
    case actionTypes.FETCHED_USER:
      return {
        ...state,
        id: maction.payload.id,
        name: maction.payload.name,
        email: maction.payload.email,
        number: maction.payload.number,
        role: maction.payload.role,
      };
    case actionTypes.LOG_OUT:
      console.log("Logged out");
      return initialData;
    case actionTypes.INVALID_SESSION:
      return initialData;
    case actionTypes.BALANCE_CHANGED:
      return {
        ...state,
        available_credit: maction.payload.availableCredit,
      };
    case actionTypes.PHONE_NUMBER_VERIFIED:
      return {
        ...state,
        number: maction.payload.new_number,
      };
    default:
      return state;
  }
};

export default userReducer;
