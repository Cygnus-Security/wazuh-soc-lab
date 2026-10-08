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

import "./layout.css";

import React, { useState, useEffect } from "react";

import { Navigate, Route, Routes } from "react-router-dom";
import { Layout, Spin } from "antd";
import { connect, ConnectedProps } from "react-redux";
import LoginContainer from "../../containers/login/login";
import SignupContainer from "../../containers/signup/signup";
import NavBar from "../navBar/navBar";
import ForgotPassword from "../forgotPassword/forgotPassword";
import ResetPasswordContainer from "../../containers/resetPassword/resetPassword";
import DashboardContainer from "../../containers/dashboard/dashboard";
import MechanicDashboardContainer from "../../containers/mechanicDashboard/mechanicDashboard";
import VerifyVehicleContainer from "../../containers/verifyVehicle/verifyVehicle";
import ContactMechanicContainer from "../../containers/contactMechanic/contactMechanic";
import ChangeEmail from "../changeEmail/changeEmail";
import roleTypes from "../../constants/roleTypes";
import ProfileContainer from "../../containers/profile/profile";
import ShopContainer from "../../containers/shop/shop";
import PastOrdersContainer from "../../containers/pastOrders/pastOrders";
import OrderContainer from "../../containers/order/order";
import ForumContainer from "../../containers/forum/forum";
import UnlockContainer from "../../containers/unlock/unlock";
import NewPostContainer from "../../containers/newPost/newPost";
import PostContainer from "../../containers/post/post";
import VehicleServiceDashboardContainer from "../../containers/vehicleServiceDashboard/vehicleServiceDashboard";
import ServiceReportContiner from "../../containers/serviceReport/serviceReport";
import MechanicServiceRequestContainer from "../../containers/mechanicServiceRequest/mechanicServiceRequest";
import ChatBotComponent from "../bot/Bot";
import {
  logOutUserAction,
  validateAccessTokenAction,
} from "../../actions/userActions";
import { isAccessTokenValid } from "../../utils";
import ChangePhoneNumber from "../changePhoneNumber/changePhoneNumber";

const { Content } = Layout;

interface AfterLoginProps {
  component: React.ComponentType<any>;
  isLoggedIn: boolean;
  componentRole?: string;
  userRole?: string;
  accessToken?: string;
  logOutUser: (options: { callback: () => void }) => void;
  location?: {
    pathname: string;
  };
}

interface BeforeLoginProps {
  component: React.ComponentType<any>;
  isLoggedIn: boolean;
  location?: {
    pathname: string;
  };
}

interface RootState {
  userReducer: {
    isLoggedIn: boolean;
    role: string;
    accessToken: string;
    fetchingData: boolean;
  };
}

/*
 * function to redirect to dashboard if the user is logged in
 * and tries to open login or other pages where log in is not required
 */
const AfterLogin: React.FC<AfterLoginProps> = ({
  component: Component,
  isLoggedIn,
  componentRole,
  userRole,
  accessToken,
  logOutUser,
}) => {
  // ... existing useEffect ...

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!isAccessTokenValid(accessToken || "")) {
    logOutUser({
      callback: () => {
        localStorage.clear();
      },
    });
    return <Navigate to="/login" />;
  }

  if (
    !componentRole ||
    componentRole === userRole ||
    (componentRole === roleTypes.ROLE_USER && userRole === roleTypes.ROLE_ADMIN)
  ) {
    return <Component />;
  }

  return (
    <Navigate
      to={
        userRole === roleTypes.ROLE_MECHANIC
          ? "/mechanic-dashboard"
          : "/dashboard"
      }
    />
  );
};

/*
 * function to redirect to login if the user is not logged in
 * and tries to open dashboard or other pages where log in is required
 */
const BeforeLogin: React.FC<BeforeLoginProps> = ({
  component: Component,
  isLoggedIn,
}) => {
  return isLoggedIn ? <Navigate to="/dashboard" /> : <Component />;
};

const mapStateToProps = (state: RootState) => ({
  isLoggedIn: state.userReducer.isLoggedIn,
  role: state.userReducer.role,
  accessToken: state.userReducer.accessToken,
  fetchingData: state.userReducer.fetchingData,
});

const mapDispatchToProps = {
  logOutUser: logOutUserAction,
  validateAccessToken: validateAccessTokenAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

/**
 * function to handle different page rendering based on pathname
 * @param {*} userData
 */
const StyledComp: React.FC<PropsFromRedux> = (props) => {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  function handleResize() {
    setWindowHeight(window.innerHeight);
  }

  const isLoggedIn = props.isLoggedIn;
  const accessToken = props.accessToken;
  const validateAccessToken = props.validateAccessToken;

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (isLoggedIn) {
        validateAccessToken({ accessToken: accessToken });
      }
    };
  }, [isLoggedIn, validateAccessToken, accessToken]);

  return (
    <Spin spinning={props.fetchingData} className="spinner">
      <Layout style={{ minHeight: windowHeight }}>
        <NavBar />
        <Content className="layout-content">
          <Routes>
            <Route
              path="/login"
              element={
                <BeforeLogin
                  component={LoginContainer}
                  isLoggedIn={props.isLoggedIn}
                />
              }
            />
            <Route
              path="/unlock"
              element={
                <BeforeLogin
                  component={UnlockContainer}
                  isLoggedIn={props.isLoggedIn}
                />
              }
            />
            <Route
              path="/signup"
              element={
                <BeforeLogin
                  component={SignupContainer}
                  isLoggedIn={props.isLoggedIn}
                />
              }
            />
            <Route
              path="/forgot-password"
              element={
                <BeforeLogin
                  component={ForgotPassword}
                  isLoggedIn={props.isLoggedIn}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <AfterLogin
                  component={DashboardContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/mechanic-dashboard"
              element={
                <AfterLogin
                  component={MechanicDashboardContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_MECHANIC}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/mechanic-service"
              element={
                <AfterLogin
                  component={MechanicServiceRequestContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_MECHANIC}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/reset-password"
              element={
                <AfterLogin
                  component={ResetPasswordContainer}
                  isLoggedIn={props.isLoggedIn}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/my-profile"
              element={
                <AfterLogin
                  component={ProfileContainer}
                  isLoggedIn={props.isLoggedIn}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/change-email"
              element={
                <AfterLogin
                  component={ChangeEmail}
                  isLoggedIn={props.isLoggedIn}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/change-phone-number"
              element={
                <AfterLogin
                  component={ChangePhoneNumber}
                  isLoggedIn={props.isLoggedIn}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/verify-vehicle"
              element={
                <AfterLogin
                  component={VerifyVehicleContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/contact-mechanic"
              element={
                <AfterLogin
                  component={ContactMechanicContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/service-report"
              element={
                <AfterLogin
                  component={ServiceReportContiner}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/shop"
              element={
                <AfterLogin
                  component={ShopContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/past-orders"
              element={
                <AfterLogin
                  component={PastOrdersContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <AfterLogin
                  component={OrderContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/vehicle-service-dashboard"
              element={
                <AfterLogin
                  component={VehicleServiceDashboardContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/forum"
              element={
                <AfterLogin
                  component={ForumContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/new-post"
              element={
                <AfterLogin
                  component={NewPostContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/post"
              element={
                <AfterLogin
                  component={PostContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
            <Route
              path="/"
              element={
                <AfterLogin
                  component={DashboardContainer}
                  isLoggedIn={props.isLoggedIn}
                  componentRole={roleTypes.ROLE_USER}
                  userRole={props.role}
                  accessToken={props.accessToken}
                  logOutUser={props.logOutUser}
                />
              }
            />
          </Routes>
          <ChatBotComponent
            accessToken={props.accessToken}
            isLoggedIn={props.isLoggedIn}
            role={props.role}
          />
        </Content>
      </Layout>
    </Spin>
  );
};

export default connector(StyledComp);
