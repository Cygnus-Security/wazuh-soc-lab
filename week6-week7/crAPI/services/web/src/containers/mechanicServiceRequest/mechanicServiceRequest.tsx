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

import React from "react";

import { connect, ConnectedProps } from "react-redux";
import { getMechanicServiceAction } from "../../actions/userActions";
import MechanicServiceRequest from "../../components/mechanicServiceRequest/mechanicServiceRequest";

interface RootState {
  service: any;
  userReducer: {
    accessToken: string;
  };
}

const mapStateToProps = (state: RootState) => ({
  accessToken: state.userReducer.accessToken,
  service: state.service,
});

const mapDispatchToProps = {
  getService: getMechanicServiceAction,
};

type PropsFromRedux = ConnectedProps<typeof connector>;

const MechanicServiceRequestContainer: React.FC<PropsFromRedux> = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("id") || "";
  console.log("Service ID", serviceId);

  return <MechanicServiceRequest serviceId={serviceId} />;
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(MechanicServiceRequestContainer);
