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
import { Button, Form, Card, Input, Row, Col, Alert } from "antd";
import {
  PIN_CODE_REQUIRED,
  INVALID_PIN_CODE,
  VEHICLE_NO_REQUIRED,
  INVALID_VIN,
} from "../../constants/messages";
import { PIN_CODE_VALIDATION, VIN_VALIDATION } from "../../constants/constants";
import "./verifyVehicle.css";

interface VerifyVehicleProps {
  hasErrored: boolean;
  errorMessage: string;
  onFinish: (values: any) => void;
  onRegisterVehicle: () => void;
  vehicleRegistered: number;
  registrationMessage: string;
  vehicles: any[];
}

const VerifyVehicle: React.FC<VerifyVehicleProps> = ({
  hasErrored,
  errorMessage,
  onFinish,
  onRegisterVehicle,
  vehicleRegistered,
  registrationMessage,
  vehicles,
}) => {
  return (
    <div className="container add-vehicle-container">
      <Row justify="center">
        {vehicles.length > 0 && (
          <Col xs={24} md={11}>
            <Card
              title="Register New Vehicle"
              bordered={false}
              className="add-vehicle-card"
            >
              <Button
                type="primary"
                onClick={onRegisterVehicle}
                disabled={vehicleRegistered !== 0}
                loading={vehicleRegistered === 1}
                className="form-button"
              >
                {vehicleRegistered === 2
                  ? "Vehicle Registered"
                  : "Register Your New Vehicle"}
              </Button>
              {registrationMessage && (
                <Alert
                  message={vehicleRegistered === 2 ? "Success" : "Error"}
                  description={registrationMessage}
                  type={vehicleRegistered === 2 ? "success" : "warning"}
                  showIcon
                  className="vehicle-alert"
                />
              )}
            </Card>
          </Col>
        )}

        <Col xs={24} md={vehicles.length ? 11 : 20}>
          <Card
            title="Verify Vehicle Details"
            bordered={false}
            className="add-vehicle-card"
          >
            <Form
              name="verify-vehicle"
              className="verify-vehicle-form"
              initialValues={{
                remember: true,
              }}
              labelCol={{ sm: { span: 8 } }}
              wrapperCol={{ sm: { span: 16 } }}
              onFinish={onFinish}
            >
              <Form.Item
                name="pinCode"
                label="Pin Code"
                rules={[
                  { required: true, message: PIN_CODE_REQUIRED },
                  { pattern: PIN_CODE_VALIDATION, message: INVALID_PIN_CODE },
                ]}
              >
                <Input placeholder="Pin Code" />
              </Form.Item>
              <Form.Item
                name="vin"
                label="VIN"
                rules={[
                  { required: true, message: VEHICLE_NO_REQUIRED },
                  { pattern: VIN_VALIDATION, message: INVALID_VIN },
                ]}
              >
                <Input placeholder="Vehicle No." />
              </Form.Item>
              <Form.Item wrapperCol={{ sm: { span: 24 } }}>
                {hasErrored && (
                  <div className="error-message">{errorMessage}</div>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  className="form-button"
                >
                  Verify Vehicle Details
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default VerifyVehicle;
