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

import MyAction from "../types/action";
import actionTypes from "../constants/actionTypes";

interface ProfileState {
  videoId: string;
  videoName: string;
  profilePicData: string;
}

const initialData: ProfileState = {
  videoId: "",
  videoName: "",
  profilePicData: "",
};

interface Action {
  type: string;
  payload: any;
}

const profileReducer = (
  state: ProfileState = initialData,
  action: Action,
): ProfileState => {
  const maction: MyAction = action as { type: string; payload: any };
  switch (maction.type) {
    case actionTypes.FETCHED_USER:
      return {
        ...state,
        videoId: maction.payload.video_id,
        videoName: maction.payload.video_name,
        profilePicData: maction.payload.picture_url,
      };
    case actionTypes.PROFILE_PIC_CHANGED:
      return {
        ...state,
        profilePicData: maction.payload.picture,
      };
    case actionTypes.VIDEO_CHANGED:
      return {
        ...state,
        videoId: maction.payload.id,
        videoName: maction.payload.video_name,
      };
    case actionTypes.VIDEO_NAME_CHANGED:
      return {
        ...state,
        videoId: maction.payload.id,
        videoName: maction.payload.video_name,
      };
    case actionTypes.INVALID_SESSION:
      return initialData;
    default:
      return state;
  }
};

export default profileReducer;
