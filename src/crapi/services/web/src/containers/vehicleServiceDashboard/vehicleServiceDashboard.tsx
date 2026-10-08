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
import { getVehicleServicesAction } from "../../actions/userActions";
import VehicleServiceDashboard from "../../components/vehicleServiceDashboard/vehicleServiceDashboard";
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
  vehicle: {
    owner: {
      email: string;
      number: string;
    };
    id: string;
    vin: string;
  };
  status: string;
}

const mapStateToProps = (state: RootState) => ({
  accessToken: state.userReducer.accessToken,
});

const mapDispatchToProps = {
  getVehicleServiceHistory: getVehicleServicesAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const VehicleServiceDashboardContainer: React.FC<PropsFromRedux> = ({
  accessToken,
  getVehicleServiceHistory,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const urlParams = new URLSearchParams(window.location.search);
  const VIN = urlParams.get("VIN");
  console.log("VIN", VIN);

  useEffect(() => {
    const callback = (status: string, data: Service[] | string) => {
      console.log("Callback", status, data);
      if (status === responseTypes.SUCCESS) {
        setServices(data as Service[]);
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data as string,
        });
      }
    };
    console.log("getVehicleServiceHistory", accessToken, VIN, callback);
    getVehicleServiceHistory({ accessToken, VIN, callback });
  }, [accessToken, getVehicleServiceHistory, VIN]);

  // Ensure that the Service type in the component matches the one from the API
  // Ensure that the Service type in the component matches the one from the API
  // Ensure that the Service type in the component matches the one from the API
  const typedServices: Service[] = services;

  return <VehicleServiceDashboard services={typedServices} />;
};

export default connector(VehicleServiceDashboardContainer);
