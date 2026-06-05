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
import MyAction from "../types/action";
interface Post {
  id: string;
  [key: string]: any;
}

interface CommunityState {
  posts: Post[];
  prevOffset: string | null;
  nextOffset: string | null;
  post?: Post;
}

const initialData: CommunityState = {
  posts: [],
  prevOffset: null,
  nextOffset: null,
};

interface Action {
  type: string;
  payload: any;
}

const communityReducer = (
  state: CommunityState = initialData,
  action: Action,
): CommunityState => {
  const maction: MyAction = action as { type: string; payload: any };
  switch (maction.type) {
    case actionTypes.FETCHED_POSTS:
      return {
        ...state,
        posts: maction.payload.posts,
        prevOffset: maction.payload.previous_offset,
        nextOffset: maction.payload.next_offset,
      };
    case actionTypes.FETCHED_POST:
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === maction.payload.postId ? maction.payload.post : post,
        ),
        post: maction.payload.post,
      };
    default:
      return state;
  }
};

export default communityReducer;
