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

interface Vehicle {
  uuid: string;
  vehicleLocation?: string;
  [key: string]: any;
}

interface Mechanic {
  [key: string]: any;
}

interface VehicleState {
  vehicles: Vehicle[];
  mechanics: Mechanic[];
  prevOffset?: number;
  nextOffset?: number;
}

interface Action {
  type: string;
  payload: any;
}

const initialData: VehicleState = {
  vehicles: [],
  mechanics: [],
};

const vehicleReducer = (
  state: VehicleState = initialData,
  action: Action,
): VehicleState => {
  const maction: MyAction = action as { type: string; payload: any };
  switch (maction.type) {
    case actionTypes.FETCHED_VEHICLES:
      return {
        ...state,
        vehicles: maction.payload,
      };
    case actionTypes.FETCHED_MECHANICS:
      return {
        ...state,
        mechanics: maction.payload,
        prevOffset: maction.payload.prevOffset,
        nextOffset: maction.payload.nextOffset,
      };
    case actionTypes.REFRESHED_LOCATION:
      return {
        ...state,
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.uuid === maction.payload.carId
            ? { ...vehicle, vehicleLocation: maction.payload.location }
            : vehicle,
        ),
      };
    default:
      return state;
  }
};

export default vehicleReducer;
