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

import React, { useState, useEffect } from "react";

import { connect, ConnectedProps } from "react-redux";
import { Modal } from "antd";
import { getMechanicServicesAction } from "../../actions/userActions";
import MechanicDashboard from "../../components/mechanicDashboard/mechanicDashboard";
import responseTypes from "../../constants/responseTypes";
import { FAILURE_MESSAGE } from "../../constants/messages";

interface RootState {
  userReducer: {
    accessToken: string;
  };
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  updated_on: string;
  vehicle: {
    id: string;
    vin: string;
    owner: {
      email: string;
      number: string;
    };
  };
  status: string;
}

const mapStateToProps = (state: RootState) => ({
  accessToken: state.userReducer.accessToken,
});

const mapDispatchToProps = {
  getServices: getMechanicServicesAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const MechanicDashboardContainer: React.FC<PropsFromRedux> = ({
  accessToken,
  getServices,
}) => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const callback = (res: string, data: Service[] | string) => {
      if (res === responseTypes.SUCCESS) {
        setServices(data as Service[]);
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data as string,
        });
      }
    };
    getServices({ accessToken, callback });
  }, [accessToken, getServices]);

  return <MechanicDashboard services={services} />;
};

export default connector(MechanicDashboardContainer);
