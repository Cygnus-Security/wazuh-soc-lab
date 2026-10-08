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

import { Middleware } from "redux";
import { invalidSessionAction } from "../actions/userActions";
import actionTypes from "../constants/actionTypes";

interface Payload {
  status: number;
  error: boolean;
  message: string;
}

export const authInterceptor: Middleware = (api) => (next) => (action) => {
  // Check if the action is of type FETCHED_DATA
  console.log("authInterceptor", action);
  const fetchedDataAction = action as { type: string; payload: Payload };
  console.log("fetchedDataAction", fetchedDataAction);
  if (fetchedDataAction.type === actionTypes.FETCHED_DATA) {
    // Type assertion to ensure action is of the expected type
    // Check if the status is 401 (Unauthorized)
    if (fetchedDataAction.payload.status === 401) {
      console.log("invalidSessionAction");
      next(invalidSessionAction());
    }
  }
  console.log("next", action);
  next(action);
};
